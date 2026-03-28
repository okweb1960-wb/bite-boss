const CUISINES = [
  "American", "Mexican", "Italian", "Chinese", "Japanese", "Thai",
  "Indian", "Mediterranean", "Pizza", "Burgers", "Sandwiches", "Sushi",
  "BBQ", "Seafood", "Vegetarian", "Vegan", "Breakfast", "Desserts"
];

const SERVICE_TYPES = [
  { value: "sit-down", label: "🍽️ Sit-Down" },
  { value: "takeout", label: "📦 Takeout" },
  { value: "fast food", label: "⚡ Fast Food" },
  { value: "delivery", label: "🛵 Delivery" },
  { value: "cafe", label: "☕ Café" },
];

const RADIUS_OPTIONS = [1, 3, 5, 10, 20];

export default function FilterPanel({ filters, onChange }) {


  function toggleCuisine(c) {
    const current = filters.cuisines || [];
    const updated = current.includes(c) ? current.filter(x => x !== c) : [...current, c];
    onChange({ ...filters, cuisines: updated });
  }

  function toggleService(s) {
    const current = filters.services || [];
    const updated = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
    onChange({ ...filters, services: updated });
  }

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
              }}
              className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                filters.radius === r
                  ? "bg-teal-600 text-white shadow-md scale-105"
                  : "border-2 border-teal-600 text-teal-600 hover:bg-teal-50"
              }`}
            >
              {r} mi
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-bold text-foreground mb-1">What are you in the mood for?</h3>
        <p className="text-xs text-muted-foreground mb-3">Pick one or more</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onChange({ ...filters, cuisines: [] })}
            className={`px-3 py-1.5 rounded-full font-semibold text-sm transition-all ${
              (filters.cuisines || []).length === 0
                ? "bg-teal-600 text-white shadow-md scale-105"
                : "bg-teal-100 text-teal-600 hover:bg-teal-200"
            }`}
          >
            All
          </button>
          {CUISINES.map(c => {
            const selected = (filters.cuisines || []).includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleCuisine(c)}
                className={`px-3 py-1.5 rounded-full font-semibold text-sm transition-all ${
                  selected
                    ? "bg-teal-600 text-white shadow-md scale-105"
                    : "border-2 border-teal-600 text-teal-600 hover:bg-teal-50"
                }`}
              >
                {c}
              </button>
            );
          })}
          </div>
      </div>
      <div>
        <h3 className="font-bold text-foreground mb-1">How do you want to eat?</h3>
        <p className="text-xs text-muted-foreground mb-3">Pick one or more</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onChange({ ...filters, services: [] })}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
              (filters.services || []).length === 0
                ? "bg-orange-500 text-white shadow-md scale-105"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Any Style
          </button>
          {SERVICE_TYPES.map(s => {
            const selected = (filters.services || []).includes(s.value);
            return (
              <button
                key={s.value}
                onClick={() => toggleService(s.value)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                  selected
                    ? "bg-orange-500 text-white shadow-md scale-105"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-between bg-teal-50 rounded-2xl px-4 py-3">
        <div>
          <p className="font-bold text-foreground">Open right now</p>
          <p className="text-sm text-muted-foreground">Only show places that are open</p>
        </div>
        <button
          onClick={() => onChange({ ...filters, openNow: !filters.openNow })}
          className={`w-12 h-6 rounded-full transition-all relative ${
            filters.openNow ? "bg-green-500" : "bg-gray-300"
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