import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CheckoutSummary } from "@/components/checkout/checkout-summary";

export default function CheckoutPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-muted-foreground/80">
          Checkout
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Finalise your Bhendi Bazaar order
        </h1>
      </header>
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <CheckoutForm />
        <CheckoutSummary />
      </div>
    </div>
  );
}


