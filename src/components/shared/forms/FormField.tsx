// components/shared/forms/FormField.tsx

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  required = false,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <label className="text-[0.7rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Quick use variants
export function FormInput({
  label,
  required,
  error,
  hint,
  ...inputProps
}: Omit<FormFieldProps, "children"> & React.ComponentProps<typeof Input>) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <Input {...inputProps} aria-invalid={!!error} />
    </FormField>
  );
}

export function FormTextarea({
  label,
  required,
  error,
  hint,
  ...textareaProps
}: Omit<FormFieldProps, "children"> & React.ComponentProps<typeof Textarea>) {
  return (
    <FormField label={label} required={required} error={error} hint={hint}>
      <Textarea {...textareaProps} aria-invalid={!!error} />
    </FormField>
  );
}

// TODO: Add other form fields here