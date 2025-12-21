"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { MapPin, ChevronRight } from "lucide-react";
import { paymentRepository } from "@/server/repositories/paymentRepository";
import type {
  OrderAddress,
  PaymentMethod,
  PaymentStatus,
} from "@/domain/order";
import type { ProfileAddress } from "@/domain/profile";
import { useCartStore } from "@/store/cartStore";
import { orderRepository } from "@/server/repositories/orderRepository";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddressModal } from "@/components/profile/address-modal";
import { cn } from "@/lib/utils";
import type { CartItem, CartTotals } from "@/domain/cart";

// Extend Window interface to include Razorpay
declare global {
  interface Window {
    Razorpay?: any;
  }
}
type GuestCheckoutFormValues = OrderAddress & {
  notes?: string;
};

export function CheckoutForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal);
  const discount = useCartStore((state) => state.discount);
  const total = useCartStore((state) => state.total);
  const clear = useCartStore((state) => state.clear);

  const { profile, user, updateAddresses } = useProfile(!!session?.user);

  const [selectedAddress, setSelectedAddress] = useState<ProfileAddress | null>(
    null
  );
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // For guest checkout
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<GuestCheckoutFormValues>({
    defaultValues: {
      country: "India",
    },
  });

  useEffect(() => {
    const scriptId = "razorpay-checkout-js";
    if (document.getElementById(scriptId)) return;
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Auto-select default address for authenticated users
  useEffect(() => {
    if (profile?.addresses?.length) {
      const defaultAddress =
        profile.addresses.find((addr) => addr.isDefault) ||
        profile.addresses[0];
      setSelectedAddress(defaultAddress);
    }
  }, [profile]);

  const handleSaveNewAddress = async (address: ProfileAddress) => {
    if (!profile) return;

    const isFirstAddress = !profile.addresses?.length;
    const newAddress = {
      ...address,
      isDefault: isFirstAddress, // Set as default if first address
    };

    await updateAddresses([...(profile?.addresses || []), newAddress]);
    setSelectedAddress(newAddress);
    setShowAddressModal(false);
  };

  const processPayment = async (orderData: {
    items: CartItem[];
    totals: CartTotals;
    address: OrderAddress;
    notes?: string;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
  }) => {
    setError(null);

    try {
      // Step 1: Create local order
      const order = await orderRepository.createFromCart({ ...orderData });

      const amountInMinorUnit = Math.round(total * 100);

      if (amountInMinorUnit <= 0) {
        await orderRepository.update(order.id, { paymentStatus: "paid" });
        clear();
        router.push(`/order/${order.id}`);
        return;
      }

      if (!window.Razorpay) {
        throw new Error(
          "Payment system not loaded. Please refresh and try again."
        );
      }

      // Step 2: Create payment gateway order via REPOSITORY
      const paymentOrder = await paymentRepository.createOrder({
        amount: amountInMinorUnit,
        currency: "INR",
        localOrderId: order.id,
        customer: {
          name: orderData.address.fullName,
          email: orderData.address.email,
          contact: orderData.address.phone,
        },
      });

      // Step 3: Open Razorpay checkout with COMPLETE options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Bhendi Bazaar",
        description: `Order ${order.code}`,
        order_id: paymentOrder.gatewayOrderId,
        prefill: {
          name: orderData.address.fullName,
          email: orderData.address.email || "",
          contact: orderData.address.phone,
        },
        notes: {
          localOrderId: order.id,
        },
        // SUCCESS HANDLER - This is what was missing!
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // Update order status to paid
            await orderRepository.update(order.id, {
              paymentStatus: "paid",
              paymentMethod: "razorpay",
              paymentId: response.razorpay_payment_id,
            });

            // Clear cart and redirect
            clear();
            router.push(`/order/${order.id}`);
          } catch (error) {
            console.error("Failed to update order after payment:", error);
            // Still redirect since payment succeeded
            clear();
            router.push(`/order/${order.id}`);
          }
        },
        modal: {
          // Handle when user closes the payment modal
          ondismiss: () => {
            setError(
              "Payment cancelled. Your order is saved, you can complete payment later."
            );
            setIsProcessing(false);
          },
        },
        theme: {
          color: "#0f766e",
        },
      };

      const razorpay = new window.Razorpay(options);

      // Handle payment failures
      razorpay.on("payment.failed", async (response: any) => {
        console.error("Payment failed:", response.error);
        await orderRepository.update(order.id, {
          paymentStatus: "failed",
        });
        setError(
          `Payment failed: ${response.error.description || "Please try again"}`
        );
        setIsProcessing(false);
      });

      razorpay.open();
    } catch (error) {
      console.error("Checkout error:", error);
      setError(error instanceof Error ? error.message : "Checkout failed");
      setIsProcessing(false);
    }
  };

  // Authenticated user checkout
  const handleAuthenticatedCheckout = async () => {
    if (!selectedAddress || !items.length) return;

    setIsProcessing(true);
    try {
      await processPayment({
        items,
        totals: { subtotal, discount, total },
        address: {
          fullName: selectedAddress.name,
          phone: selectedAddress.phone,
          email: user?.email || "",
          line1: selectedAddress.line1,
          line2: selectedAddress.line2,
          city: selectedAddress.city,
          state: selectedAddress.state ?? "",
          postalCode: selectedAddress.postalCode,
          country: selectedAddress.country,
        },
        notes: orderNotes,
        paymentMethod: "razorpay",
        paymentStatus: "pending",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Guest checkout
  const onGuestSubmit = async (values: GuestCheckoutFormValues) => {
    if (!items.length) return;

    await processPayment({
      items,
      totals: { subtotal, discount, total },
      address: {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        line1: values.line1,
        line2: values.line2,
        city: values.city,
        state: values.state,
        postalCode: values.postalCode,
        country: values.country,
      },
      notes: values.notes,
      paymentMethod: "razorpay",
      paymentStatus: "pending",
    });
  };

  // Authenticated user view
  if (session?.user) {
    const hasAddresses = !!profile?.addresses?.length;

    return (
      <div className="space-y-6">
        {/* Selected Address Display */}
        <div className="space-y-3">
          <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
            Delivery Address
          </label>

          {selectedAddress ? (
            <Card className="overflow-hidden border-border/60">
              <button
                type="button"
                onClick={() => setShowAddressSelector(!showAddressSelector)}
                className="flex w-full items-start justify-between gap-4 p-5 text-left transition-colors hover:bg-muted/30"
              >
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-teal-600" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {selectedAddress.label}
                      </span>
                      {selectedAddress.isDefault && (
                        <Badge variant="secondary" className="text-[0.65rem]">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {selectedAddress.name} • {selectedAddress.phone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[
                        selectedAddress.line1,
                        selectedAddress.line2,
                        selectedAddress.city,
                        selectedAddress.state,
                        selectedAddress.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform",
                    showAddressSelector && "rotate-90"
                  )}
                />
              </button>

              {/* Address Selector Dropdown */}
              {showAddressSelector && hasAddresses && (
                <div className="border-t border-border/60 bg-muted/20 p-4">
                  <div className="space-y-2">
                    {profile.addresses
                      .filter((addr) => addr.id !== selectedAddress.id)
                      .map((address) => (
                        <button
                          key={address.id}
                          type="button"
                          onClick={() => {
                            setSelectedAddress(address);
                            setShowAddressSelector(false);
                          }}
                          className="flex w-full items-start gap-3 rounded-lg border border-border bg-card p-3 text-left text-sm transition-colors hover:bg-muted/50"
                        >
                          <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {address.label}
                              </span>
                              {address.isDefault && (
                                <Badge
                                  variant="secondary"
                                  className="text-[0.6rem]"
                                >
                                  Default
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {address.name} • {address.phone}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {[address.line1, address.city, address.postalCode]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        </button>
                      ))}

                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressModal(true);
                        setShowAddressSelector(false);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 p-3 text-sm font-medium text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:bg-muted/50"
                    >
                      <MapPin className="h-4 w-4" />
                      Add new address
                    </button>
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-5">
              <p className="mb-3 text-sm text-muted-foreground">
                You don&apos;t have any saved addresses.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddressModal(true)}
                className="w-full"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Add delivery address
              </Button>
            </Card>
          )}
        </div>

        {/* Notes Field */}
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
            Notes for the Bazaar (Optional)
          </label>
          <Textarea
            rows={3}
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Any special instructions for delivery..."
            className="resize-none"
          />
        </div>

        {/* Place Order Button */}
        <Button
          type="button"
          onClick={handleAuthenticatedCheckout}
          disabled={!items.length || !selectedAddress || isProcessing}
          className="w-full rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
          size="lg"
        >
          {isProcessing ? "Processing..." : "Place Order & Pay"}
        </Button>

        {/* Address Modal for Adding New Address */}
        {showAddressModal && (
          <AddressModal
            mode="add"
            address={{
              id: crypto.randomUUID(),
              label: "",
              name: user?.name || "",
              line1: "",
              line2: "",
              city: "",
              state: "",
              country: "India",
              postalCode: "",
              phone: user?.mobile || "",
              isDefault: !hasAddresses,
            }}
            saving={false}
            onClose={() => setShowAddressModal(false)}
            onSave={handleSaveNewAddress}
            onStartEdit={() => {}}
            onDelete={() => {}}
          />
        )}
      </div>
    );
  }

  // Guest user view - Full form
  return (
    <form onSubmit={handleSubmit(onGuestSubmit)} className="space-y-4 text-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-[0.18em]">
            Full name
          </label>
          <Input {...register("fullName", { required: true })} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-[0.18em]">
            Phone
          </label>
          <Input {...register("phone", { required: true })} />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-[0.18em]">
          Email (optional)
        </label>
        <Input type="email" {...register("email")} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-[0.18em]">
          Address line 1
        </label>
        <Input {...register("line1", { required: true })} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-[0.18em]">
          Address line 2
        </label>
        <Input {...register("line2")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-[0.18em]">
            City
          </label>
          <Input {...register("city", { required: true })} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-[0.18em]">
            State
          </label>
          <Input {...register("state", { required: true })} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium uppercase tracking-[0.18em]">
            PIN code
          </label>
          <Input {...register("postalCode", { required: true })} />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-[0.18em]">
          Country
        </label>
        <Input {...register("country", { required: true })} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-[0.18em]">
          Notes for the bazaar
        </label>
        <Textarea rows={3} {...register("notes")} />
      </div>
      <Button
        type="submit"
        disabled={!items.length || isSubmitting}
        className="mt-2 w-full rounded-full text-xs font-semibold uppercase tracking-[0.2em]"
      >
        {isSubmitting ? "Processing checkout..." : "Place order & pay"}
      </Button>
    </form>
  );
}