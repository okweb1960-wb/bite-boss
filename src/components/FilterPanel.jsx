const CUISINES = [
  "Any", "American", "Mexican", "Italian", "Chinese", "Japanese", "Thai",
  "Indian", "Mediterranean", "Pizza", "Burgers", "Sandwiches", "Sushi",
  "BBQ", "Seafood", "Vegetarian", "Vegan", "Breakfast", "Desserts"
];

const SERVICE_TYPES = [
  { value: "any", label: "Any Style" },
  { value: "sit-down", label: "🍽️ Sit-Down" },
  { value: "takeout", label: "📦 Takeout" },
  { value: "fast food", label: "⚡ Fast Food" },
  { value: "delivery", label: "🛵 Delivery" },
  { value: "cafe", label: "☕ Café" },
];

const RADIUS_OPTIONS = [1, 3, 5, 10, 20];

export default function FilterPanel({ filters, onChange }) {
  return (
    <div className="space-y-6">
      {/* Radius */}
      <div>
        <h3 className="font-bold text-foreground mb-3">How far are you willing to go?</h3>
        <div className="flex gap-2 flex-wrap">
          {RADIUS_OPTIONS.map(r => (
            <button
              key={r}
              onClick={() => onChange({ ...filters, radius: r })}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                filters.radius === r
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "bg-muted text-muted-foreground hover:bg-primary/10"
              }`}
            >
              {r} mi
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine */}
      <div>
        <h3 className="font-bold text-foreground mb-3">What are you in the mood for?</h3>
        <div className="flex gap-2 flex-wrap">
          {CUISINES.map(c => (
            <button
              key={c}
              onClick={() => onChange({ ...filters, cuisine: c === "Any" ? "" : c })}
              className={`px-3 py-1.5 rounded-full font-semibold text-sm transition-all ${
                (c === "Any" && !filters.cuisine) || filters.cuisine === c
                  ? "bg-secondary text-secondary-foreground shadow-md scale-105"
                  : "bg-muted text-muted-foreground hover:bg-secondary/20"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Service Type */}
      <div>
        <h3 className="font-bold text-foreground mb-3">How do you want to eat?</h3>
        <div className="flex gap-2 flex-wrap">
          {SERVICE_TYPES.map(s => (
            <button
              key={s.value}
              onClick={() => onChange({ ...filters, service: s.value === "any" ? "" : s.value })}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                (s.value === "any" && !filters.service) || filters.service === s.value
                  ? "bg-accent text-accent-foreground shadow-md scale-105"
                  : "bg-muted text-muted-foreground hover:bg-accent/10"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Open Now */}
      <div className="flex items-center justify-between bg-muted rounded-2xl px-4 py-3">
        <div>
          <p className="font-bold text-foreground">Open right now</p>
          <p className="text-sm text-muted-foreground">Only show places that are open</p>
        </div>
        <button
          onClick={() => onChange({ ...filters, openNow: !filters.openNow })}
          className={`w-12 h-6 rounded-full transition-all relative ${
            filters.openNow ? "bg-primary" : "bg-border"
          }`}
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
            filters.openNow ? "left-7" : "left-1"
          }`} />
        </button>
      </div>
    </div>
  );
}