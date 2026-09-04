export default function SkeletonTable() {
  return (
    <div className="bg-white rounded-lg shadow p-6 overflow-x-auto animate-pulse">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-2 text-left">
              <div className="h-4 w-24 bg-gray-300 rounded"></div>
            </th>
            <th className="px-4 py-2 text-left">
              <div className="h-4 w-24 bg-gray-300 rounded"></div>
            </th>
            <th className="px-4 py-2 text-left">
              <div className="h-4 w-24 bg-gray-300 rounded"></div>
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b">
              <td className="px-4 py-2">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </td>
              <td className="px-4 py-2">
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
              </td>
              <td className="px-4 py-2">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}