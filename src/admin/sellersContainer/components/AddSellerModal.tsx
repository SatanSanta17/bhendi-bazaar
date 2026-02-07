import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SellerForm } from "@/components/shared/forms/sellers";
import type { Seller, CreateSellerInput } from "@/domain/seller";

interface AddSellerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSellerInput) => Promise<void>;
  seller?: Seller; // For edit mode
  isSubmitting?: boolean;
  mode?: "create" | "edit" | "view";
}

export function AddSellerModal({
  open,
  onClose,
  onSubmit,
  seller,
  isSubmitting = false,
  mode = "create",
}: AddSellerModalProps) {
  const isEdit = mode === "edit";
  const isView = mode === "view";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? `Edit Seller: ${seller?.name || ""}`
              : isView
              ? `View Seller: ${seller?.name || ""}`
              : "Add New Seller"}
          </DialogTitle>
        </DialogHeader>

        <SellerForm
          seller={seller}
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
          readOnly={isView}
        />
      </DialogContent>
    </Dialog>
  );
}
