"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import type { OrderAddress } from "@/domain/order";
import { useCartStore } from "@/store/cartStore";
import { orderRepository } from "@/server/repositories/orderRepository";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CheckoutFormValues = OrderAddress & {
  notes?: string;
};

export function CheckoutForm() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal);
  const discount = useCartStore((state) => state.discount);
  const total = useCartStore((state) => state.total);
  const clear = useCartStore((state) => state.clear);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<CheckoutFormValues>({
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

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!items.length) return;

    const gateway = "razorpay";

    const order = await orderRepository.createFromCart({
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
      paymentMethod: gateway,
      paymentStatus: "pending",
    });

    const amountInMinorUnit = Math.round(total * 100);
    if (amountInMinorUnit <= 0) {
      clear();
      router.push(`/order/${order.id}`);
      return;
    }

    if (gateway === "razorpay") {
      if (typeof window === "undefined" || !(window as any).Razorpay) {
        // Fallback: treat as mock payment if Razorpay JS is not loaded.
        clear();
        router.push(`/order/${order.id}`);
        return;
      }

      try {
        const response = await fetch("/api/payments/razorpay/create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amountInMinorUnit,
            currency: "INR",
            localOrderId: order.id,
            customer: {
              name: values.fullName,
              email: values.email,
              contact: values.phone,
            },
          }),
        });

        if (!response.ok) {
          // eslint-disable-next-line no-console
          console.error("Failed to create Razorpay order");
          clear();
          router.push(`/order/${order.id}`);
          return;
        }

        const data: {
          orderId: string;
          amount: number;
          currency: string;
        } = await response.json();

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: data.currency,
          name: "Bhendi Bazaar",
          description: `Order ${order.code}`,
          order_id: data.orderId,
          prefill: {
            name: values.fullName,
            email: values.email,
            contact: values.phone,
          },
          notes: {
            localOrderId: order.id,
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            await orderRepository.update(order.id, {
              paymentStatus: "paid",
              paymentMethod: "razorpay",
              paymentId: response.razorpay_payment_id,
            });
            clear();
            router.push(`/order/${order.id}`);
          },
          theme: {
            color: "#0f766e",
          },
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Razorpay checkout error", error);
        clear();
        router.push(`/order/${order.id}`);
      }
      return;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-sm">
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