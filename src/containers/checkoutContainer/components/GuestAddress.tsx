"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AddressFields } from "@/components/shared/forms/AddressFields";
import { DeliveryAddress } from "@/domain/profile";

const addressSchema = z.object({
  fullName: z.string().min(2, "Name required"),
  mobile: z.string().regex(/^\d{10}$/, "10 digits required"),
  email: z.string().email("Invalid email"),
  addressLine1: z.string().min(5, "Address required"),
  landmark: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City required"),
  state: z.string().min(2, "State required"),
  pincode: z.string().regex(/^\d{6}$/, "6 digits required"),
  country: z.string().min(2, "Country required"),
  notes: z.string().optional(),
});

type AddressFormValues = z.infer<typeof addressSchema>;

export function GuestAddress({ onAddressChange }: { onAddressChange: (address: DeliveryAddress) => void }) {

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
  // Watch individual fields
  const fullName = watch("fullName");
  const mobile = watch("mobile");
  const email = watch("email");
  const addressLine1 = watch("addressLine1");
  const addressLine2 = watch("addressLine2");
  const city = watch("city");
  const state = watch("state");
  const pincode = watch("pincode");
  const country = watch("country");
  const landmark = watch("landmark");
  // useMemo with ACTUAL dependencies
  const formValues: Omit<DeliveryAddress, "id"> = useMemo(() => ({
    fullName: fullName || "",
    mobile: mobile || "",
    email: email || "",
    addressLine1: addressLine1 || "",
    addressLine2: addressLine2 || "",
    landmark: landmark || "",
    city: city || "",
    state: state || "",
    pincode: pincode || "",
    country: country || "India",
  }), [fullName, mobile, email, addressLine1, addressLine2, city, state, pincode, country]);

  useEffect(() => {
    console.log('🔵 GuestAddress useEffect triggered', {
      isValid,
      formValues,
      pincode: formValues.pincode
    });

    if (isValid) {
      console.log('✅ Calling onAddressChange with:', formValues);
      onAddressChange({ ...formValues, id: "" });
    } else {
      console.log('❌ Form not valid yet');
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