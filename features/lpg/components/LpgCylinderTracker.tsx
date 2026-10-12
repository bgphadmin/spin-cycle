"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StandardInput } from "@/components/ui/custom/StandardInput";
import FormContainer from "@/components/utils/FormContainer";
import {
  markLpgCylinderEmptyAction,
  startLpgCylinderAction,
} from "../actions/lpgCylinderActions";

type CylinderReport = {
  id: string;
  note: string | null;
  filledAt: string;
  emptiedAt: string | null;
  dryOrders: number;
  dryCustomers: number;
  normalDryEquivalents: number;
};

function formatDate(value: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export default function LpgCylinderTracker({
  cylinders,
  timeZone,
  tenantSlug,
  isAdmin,
}: {
  cylinders: CylinderReport[];
  timeZone: string;
  tenantSlug: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const activeCylinder = cylinders.find((cylinder) => cylinder.emptiedAt === null);
  const history = cylinders.filter((cylinder) => cylinder.emptiedAt !== null);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-teal-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-teal-800">Current 50 kg cylinder</h2>
            {activeCylinder ? (
              <p className="mt-1 text-sm text-gray-600">
                Full cylinder recorded {formatDate(activeCylinder.filledAt, timeZone)}.
              </p>
            ) : (
              <p className="mt-1 text-sm text-gray-600">
                {isAdmin
                  ? "No active cylinder. Record one when a full 50 kg cylinder is installed."
                  : "No active cylinder has been recorded."}
              </p>
            )}
          </div>
          {isAdmin && activeCylinder ? (
            <FormContainer action={markLpgCylinderEmptyAction} onSuccess={() => router.refresh()}>
              {({ loading }) => (
                <>
                  <input type="hidden" name="tenantSlug" value={tenantSlug} />
                  <input type="hidden" name="id" value={activeCylinder.id} />
                  <Button type="submit" variant="standard" disabled={loading}>
                    {loading ? "Saving..." : "Mark Cylinder Empty"}
                  </Button>
                </>
              )}
            </FormContainer>
          ) : isAdmin ? (
            <FormContainer action={startLpgCylinderAction} onSuccess={() => router.refresh()}>
              {({ loading }) => (
                <>
                  <input type="hidden" name="tenantSlug" value={tenantSlug} />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <StandardInput
                      name="note"
                      label="Note (optional)"
                      placeholder="Supplier, receipt, or other details"
                      maxLength={500}
                      className="min-h-12 rounded bg-gray-100 px-3 py-2 text-sm shadow-lg ring-1 focus:ring-2 focus:ring-teal-500"
                    />
                    <Button type="submit" variant="standard" disabled={loading}>
                      {loading ? "Saving..." : "Record Full Cylinder"}
                    </Button>
                  </div>
                </>
              )}
            </FormContainer>
          ) : null}
        </div>
        {activeCylinder && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric label="Dry customers" value={activeCylinder.dryCustomers} />
            <Metric label="Completed dry orders" value={activeCylinder.dryOrders} />
            <Metric
              label="Normal Dry equivalents"
              value={activeCylinder.normalDryEquivalents}
            />
          </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-teal-800">Cylinder history</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            Completed cylinder reports will appear here after you mark a cylinder empty.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {history.map((cylinder) => (
              <article key={cylinder.id} className="rounded-md border border-gray-200 p-4">
                <p className="font-medium text-gray-800">
                  {formatDate(cylinder.filledAt, timeZone)} –{" "}
                  {cylinder.emptiedAt ? formatDate(cylinder.emptiedAt, timeZone) : "In use"}
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  Note: {cylinder.note || "—"}
                </p>
                <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-3">
                  <p>Dry customers: <strong>{cylinder.dryCustomers}</strong></p>
                  <p>Completed dry orders: <strong>{cylinder.dryOrders}</strong></p>
                  <p>
                    Normal Dry equivalents:{" "}
                    <strong>{cylinder.normalDryEquivalents}</strong>
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-gray-500">
        Counts include completed orders in each cylinder period. Extra Dry counts as 0.25,
        Comforter counts as 0.5, and other DRY services count as 1 Normal Dry equivalent.
        Customer totals use the app’s customer records. This is a usage estimate, not a direct
        LPG weight measurement.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-teal-50 p-4">
      <p className="text-sm text-teal-700">{label}</p>
      <p className="mt-1 text-2xl font-bold text-teal-900">
        {Number.isInteger(value) ? value : value.toFixed(2)}
      </p>
    </div>
  );
}
