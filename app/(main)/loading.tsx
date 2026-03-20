export default function Loading() {
  return (
    <div className="p-6 pb-24 space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="w-32 h-8 bg-card-dark rounded-xl" />
        <div className="w-10 h-10 bg-card-dark rounded-full" />
      </div>

      {/* Main Card Skeleton */}
      <div className="w-full h-48 bg-card-dark rounded-3xl" />

      {/* Grid Skeleton */}
      <div className="grid grid-cols-3 gap-3">
        <div className="h-24 bg-card-dark rounded-2xl" />
        <div className="h-24 bg-card-dark rounded-2xl" />
        <div className="h-24 bg-card-dark rounded-2xl" />
      </div>

      {/* List Skeleton */}
      <div className="space-y-3 pt-4">
        <div className="w-full h-16 bg-card-dark rounded-2xl" />
        <div className="w-full h-16 bg-card-dark rounded-2xl" />
        <div className="w-full h-16 bg-card-dark rounded-2xl" />
      </div>
    </div>
  );
}
