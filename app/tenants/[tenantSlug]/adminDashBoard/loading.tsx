function ChartSkeleton({ titleWidth = "w-40" }: { titleWidth?: string }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 h-7 ${titleWidth} rounded bg-gray-200`} />
      <div className="h-80 rounded bg-gray-100" />
    </section>
  );
}

export default function AdminDashboardLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading admin dashboard"
      className="mx-auto mb-24 w-full max-w-6xl px-4 py-8 sm:px-6"
    >
      <div className="mb-6 mx-10 animate-pulse">
        <div className="h-9 w-64 rounded bg-gray-200" />
        <div className="mt-2 h-5 w-96 max-w-full rounded bg-gray-200" />
      </div>

      <div className="space-y-6 animate-pulse">
        <ChartSkeleton titleWidth="w-48" />
        <ChartSkeleton titleWidth="w-40" />
        <ChartSkeleton titleWidth="w-56" />

        <div className="grid gap-6 lg:grid-cols-2">
          <ChartSkeleton titleWidth="w-44" />
          <ChartSkeleton titleWidth="w-64" />
        </div>
      </div>
    </main>
  );
}
