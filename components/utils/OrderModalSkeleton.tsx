export default function OrderModalSkeleton() {
  return (
    <div className="animate-pulse space-y-5" role="status" aria-label="Loading order details">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 rounded bg-gray-300" />
          <div className="h-4 w-48 rounded bg-gray-200" />
        </div>
        <div className="h-11 w-24 rounded-md bg-gray-300" />
      </div>
      <div className="h-12 w-full rounded bg-gray-200" />
      <div className="rounded-md border border-gray-200 p-3">
        <div className="mb-4 h-4 w-28 rounded bg-gray-300" />
        <div className="space-y-3">
          <div className="h-5 w-40 rounded bg-gray-200" />
          <div className="h-5 w-36 rounded bg-gray-200" />
        </div>
      </div>
      <div className="rounded-md border border-gray-200 p-3">
        <div className="mb-4 h-4 w-40 rounded bg-gray-300" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-5 w-32 rounded bg-gray-200" />
          <div className="h-5 w-28 rounded bg-gray-200" />
          <div className="h-5 w-36 rounded bg-gray-200" />
        </div>
      </div>
      <div className="rounded-md border border-gray-200 p-3">
        <div className="mb-4 h-4 w-32 rounded bg-gray-300" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="h-5 w-56 rounded bg-gray-200" />
              <div className="h-8 w-20 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-md border border-gray-200 p-3">
        <div className="mb-4 h-4 w-36 rounded bg-gray-300" />
        <div className="flex gap-5">
          <div className="h-5 w-16 rounded bg-gray-200" />
          <div className="h-5 w-16 rounded bg-gray-200" />
          <div className="h-5 w-20 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}