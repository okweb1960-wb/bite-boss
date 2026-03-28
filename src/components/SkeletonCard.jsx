export default function SkeletonCard() {
  return (
    <div className="absolute inset-0 rounded-3xl overflow-hidden bg-white shadow-2xl">
      {/* Photo skeleton */}
      <div className="w-full h-[60%] bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-pulse" />
      
      {/* Info skeleton */}
      <div className="p-5 space-y-4">
        <div className="h-6 bg-gray-300 rounded-lg w-3/4 animate-pulse" />
        <div className="h-3 bg-gray-200 rounded-lg w-1/2 animate-pulse" />
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-2 bg-gray-200 rounded w-4/5 animate-pulse" />
        </div>
      </div>
    </div>
  );
}