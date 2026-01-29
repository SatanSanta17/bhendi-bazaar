// src/app/(main)/checkout/page.tsx

import { SectionHeader } from "@/components/shared/SectionHeader";
import { CheckoutContainer } from "@/components/checkoutContainer";

export default function CheckoutPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        overline="Checkout"
        title="Finalise your Bhendi Bazaar order"
      />

      <CheckoutContainer />
    </div>
  );
}
