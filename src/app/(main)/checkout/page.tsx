import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";
import { SectionHeader } from "@/components/shared/SectionHeader";

export default function CheckoutPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        overline="Checkout"
        title="Finalise your Bhendi Bazaar order"
      />
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <CheckoutForm />
        <CheckoutSummary />
      </div>
    </div>
  );
}


