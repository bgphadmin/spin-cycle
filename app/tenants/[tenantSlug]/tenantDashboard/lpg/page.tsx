import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { getLpgCylinderReportAction } from "@/features/lpg/actions/lpgCylinderActions";
import LpgCylinderTracker from "@/features/lpg/components/LpgCylinderTracker";

export const dynamic = "force-dynamic";

export default async function LpgCylinderPage({
  params,
}: {
  params: { tenantSlug: string };
}) {
  const { userId } = await getAuthContext();
  if (!userId) {
    redirect("/not-allowed");
  }

  const report = await getLpgCylinderReportAction(params.tenantSlug);

  return (
    <main className="mx-auto mb-24 w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-teal-800">LPG Cylinder Tracking</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track dry customers and cycle-equivalent usage for each full 50 kg cylinder.
        </p>
      </div>
      <LpgCylinderTracker
        cylinders={report.cylinders}
        timeZone={report.timeZone}
        tenantSlug={params.tenantSlug}
      />
    </main>
  );
}
