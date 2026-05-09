export default function CoursesPage() {
  const courses = [
    { id: "1", title: "TypeScript Mastery", instructor: "Dr. Kumar", progress: 75, modules: 12, enrolled: 156, level: "Advanced", price: "₹2,499" },
    { id: "2", title: "React Pro", instructor: "Prof. Sharma", progress: 45, modules: 8, enrolled: 234, level: "Intermediate", price: "₹1,999" },
    { id: "3", title: "Backend 101", instructor: "Dr. Patel", progress: 90, modules: 10, enrolled: 312, level: "Beginner", price: "Free" },
    { id: "4", title: "System Design", instructor: "Dr. Gupta", progress: 0, modules: 15, enrolled: 89, level: "Advanced", price: "₹3,499" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Courses</h1>
        <p className="text-sm text-muted mt-1">Browse and manage your courses</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((c) => (
          <div key={c.id} className="glass-card overflow-hidden group cursor-pointer">
            <div className="h-36 bg-gradient-to-br from-primary/30 to-accent/20 flex items-center justify-center text-4xl">📚</div>
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{c.level}</span>
                <span className="text-sm font-bold text-foreground">{c.price}</span>
              </div>
              <h3 className="text-base font-semibold text-foreground group-hover:text-primary-hover transition-colors">{c.title}</h3>
              <p className="text-xs text-muted">{c.instructor} · {c.modules} modules · {c.enrolled} students</p>
              {c.progress > 0 && (
                <div>
                  <div className="flex justify-between text-xs text-muted mb-1">
                    <span>Progress</span><span>{c.progress}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
