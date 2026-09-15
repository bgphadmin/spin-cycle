// components/ProductGridSkeleton.tsx
interface SkeletonProps {
  count?: number;
}

export default function CardSkeleton({ count = 6 }: SkeletonProps) {
  const skeletonCards = Array.from({ length: count });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {skeletonCards.map((_, index) => (
        <div 
          key={index} 
          className="w-full border border-gray-200 rounded-xl p-4 shadow animate-pulse bg-white"
        >
          {/* Card Media / Image Block */}
          <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
          
          {/* Title Line */}
          <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
          
          {/* Body Text Lines */}
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
