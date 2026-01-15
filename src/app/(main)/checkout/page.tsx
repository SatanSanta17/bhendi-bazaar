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

      {/* <div className="grid gap-6 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"> */}
      <CheckoutContainer />
      {/* </div> */}
    </div>
  );
}
