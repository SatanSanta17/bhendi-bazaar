// components/shared/forms/AddressFields.tsx

import { FormInput, FormTextarea } from "./FormField";
import type { OrderAddress } from "@/domain/order";
import { UseFormRegister, FieldErrors } from "react-hook-form";

interface AddressFieldsProps {
  register: UseFormRegister<any>;
  errors?: FieldErrors;
  namePrefix?: string; // For nested forms like "shippingAddress."
  includeEmail?: boolean;
  includeNotes?: boolean;
}

export function AddressFields({
  register,
  errors,
  namePrefix = "",
  includeEmail = false,
  includeNotes = false,
}: AddressFieldsProps) {
  const getFieldName = (field: string) => `${namePrefix}${field}`;

  const getError = (field: string): string | undefined => {
    if (!errors) return undefined;
  
    try {
      if (namePrefix) {
        // Safely access nested error
        const nestedErrors = errors[namePrefix];
        if (nestedErrors && typeof nestedErrors === 'object') {
          const fieldError = (nestedErrors as Record<string, any>)[field];
          return fieldError?.message;
        }
        return undefined;
      }
      
      // Direct field access
      const fieldError = errors[field];
      return fieldError?.message as string | undefined;
    } catch {
      return undefined;
    }
  };
  
  return (
    <>
      {/* Name and Phone Row */}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormInput
          label="Full Name"
          required
          placeholder="Your full name"
          {...register(getFieldName("fullName"), { required: true })}
          error={getError("fullName")}
        />
        <FormInput
          label="Phone"
          required
          type="tel"
          placeholder="10-digit mobile"
          {...register(getFieldName("phone"), { required: true })}
          error={getError("phone")}
        />
      </div>

      {/* Email (optional) */}
      {includeEmail && (
        <FormInput
          label="Email"
          type="email"
          placeholder="your@email.com"
          {...register(getFieldName("email"))}
          hint="Optional - for order updates"
          error={getError("email")}
        />
      )}

      {/* Address Line 1 */}
      <FormInput
        label="Address Line 1"
        required
        placeholder="Flat, house no., building"
        {...register(getFieldName("line1"), { required: true })}
        error={getError("line1")}
      />

      {/* Address Line 2 */}
      <FormInput
        label="Address Line 2"
        placeholder="Area, street (optional)"
        {...register(getFieldName("line2"))}
        error={getError("line2")}
      />

      {/* City, State, PIN Row */}
      <div className="grid gap-3 sm:grid-cols-3">
        <FormInput
          label="City"
          required
          {...register(getFieldName("city"), { required: true })}
          error={getError("city")}
        />
        <FormInput
          label="State"
          required
          {...register(getFieldName("state"), { required: true })}
          error={getError("state")}
        />
        <FormInput
          label="PIN Code"
          required
          {...register(getFieldName("postalCode"), { required: true })}
          error={getError("postalCode")}
        />
      </div>

      {/* Country */}
      <FormInput
        label="Country"
        required
        {...register(getFieldName("country"), { required: true })}
        error={getError("country")}
      />

      {/* Notes (optional) */}
      {includeNotes && (
        <FormTextarea
          label="Notes for the Bazaar"
          rows={3}
          placeholder="Any special instructions..."
          {...register(getFieldName("notes"))}
          hint="Optional"
        />
      )}
    </>
  );
}