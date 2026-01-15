"use client";

import { useEffect } from "react";
import { useForm, UseFormRegister, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AddressFields } from "@/components/shared/forms/AddressFields";
import type { DeliveryAddress } from "../types";

const addressSchema = z.object({
  fullName: z.string().min(2, "Name required"),
  mobile: z.string().regex(/^\d{10}$/, "10 digits required"),
  email: z.string().email("Invalid email"),
  addressLine1: z.string().min(5, "Address required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  pincode: z.string().regex(/^\d{6}$/, "6 digits required"),
  country: z.string().min(2, "Country required"),
  notes: z.string().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export function GuestAddress({onAddressChange}: {onAddressChange: (address: DeliveryAddress) => void}) {

  const {
    register,
    watch,
    formState: { errors, isValid },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    mode: "onChange",
    defaultValues: {
      country: "India",
    },
  });

  const formValues: DeliveryAddress = {
    fullName: watch("fullName"),
    mobile: watch("mobile"),
    email: watch("email"),
    addressLine1: watch("addressLine1"),
    addressLine2: watch("addressLine2"),
    city: watch("city"),
    state: watch("state"),
    pincode: watch("pincode"),
    country: watch("country"),
    notes: watch("notes"),
  };

  // Notify parent when valid
  useEffect(() => {
    if (isValid) {
      onAddressChange(formValues);
    }
  }, [formValues, isValid, onAddressChange]);

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground/80">
        Delivery Address
      </label>

      <div className="rounded-xl border border-border/70 bg-card/80 p-4">
        <AddressFields
          register={register}
          errors={errors}
        />
      </div>
    </div>
  );
}