// components/shared/button-groups/FormActions.tsx

import { Button } from "@/components/ui/button";

interface FormActionsProps {
  onCancel: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export function FormActions({
  onCancel,
  onSubmit,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  isSubmitting = false,
  disabled = false,
}: FormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isSubmitting || disabled}
        onClick={onCancel}
        className="rounded-full text-[0.7rem] font-semibold uppercase tracking-[0.2em]"
      >
        {cancelLabel}
      </Button>
      <Button
        type={onSubmit ? "button" : "submit"}
        size="sm"
        disabled={isSubmitting || disabled}
        onClick={onSubmit}
        className="rounded-full text-[0.7rem] font-semibold uppercase tracking-[0.2em]"
      >
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </div>
  );
}