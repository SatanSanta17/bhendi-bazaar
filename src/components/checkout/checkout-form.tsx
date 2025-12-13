"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import type { OrderAddress } from "@/domain/order";
import { useCartStore } from "@/store/cartStore";
import { orderService } from "@/services/orderService";
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

  const onSubmit = async (values: CheckoutFormValues) => {
    if (!items.length) return;
    const order = await orderService.createFromCart({
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
    });
    clear();
    router.push(`/order/${order.id}`);
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
        {isSubmitting ? "Placing order..." : "Place order (mock payment)"}
      </Button>
    </form>
  );
}


