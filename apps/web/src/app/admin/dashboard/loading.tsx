export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 rounded-lg bg-card-hover/60" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-lg bg-card-hover/60" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-64 rounded-lg bg-card-hover/60" />
        ))}
      </div>
    </div>
  );
}
