import { TabsContent } from "@/components/ui/tabs";
import { PendingCreators } from "./_components/pending-creators";
import { PendingPayouts } from "./_components/pending-payouts";
import { VerifiedCreators } from "./_components/verified-creators";

import {
  getPendingCreators,
  getVerifiedCreators,
  getPendingPayouts,
} from "@/actions/admin";

export default async function AdminPage() {
  // Fetch all data in parallel
  const [pendingCreatorsData, verifiedCreatorsData, pendingPayoutsData] =
    await Promise.all([
      getPendingCreators(),
      getVerifiedCreators(),
      getPendingPayouts(),
    ]);

  return (
    <>
      <TabsContent value="pending" className="border-none p-0">
        <PendingCreators creators={pendingCreatorsData.creators || []} />
      </TabsContent>

      <TabsContent value="creators" className="border-none p-0">
        <VerifiedCreators creators={verifiedCreatorsData.creators || []} />
      </TabsContent>

      <TabsContent value="payouts" className="border-none p-0">
        <PendingPayouts payouts={pendingPayoutsData.payouts || []} />
      </TabsContent>
    </>
  );
}