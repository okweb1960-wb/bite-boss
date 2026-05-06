const CUISINES_ROW1 = [
  { value: "American", label: "🇺🇸 American" },
  { value: "Burgers", label: "🍔 Burgers" },
  { value: "Fast Food", label: "⚡ Fast Food" },
  { value: "Mexican", label: "🌮 Mexican" },
  { value: "Italian", label: "🍝 Italian" },
  { value: "Pizza", label: "🍕 Pizza" },
  { value: "Chinese", label: "🥡 Chinese" },
  { value: "Japanese", label: "🍜 Japanese" },
  { value: "Sushi", label: "🍣 Sushi" },
];

const CUISINES_ROW2 = [
  { value: "Thai", label: "🌶️ Thai" },
  { value: "Indian", label: "🍛 Indian" },
  { value: "Mediterranean", label: "🫒 Mediterranean" },
  { value: "BBQ", label: "🔥 BBQ" },
  { value: "Seafood", label: "🦞 Seafood" },
  { value: "breakfast", label: "🍳 Breakfast & Brunch" },
  { value: "Cafe", label: "☕ Cafe" },
  { value: "Desserts", label: "🍦 Desserts" },
  { value: "bars", label: "🍺 Bars & Pubs" },
  { value: "sports bar", label: "📺 Sports Bar" },
];

const SERVICE_TYPES = [
  { value: "dine_in", label: "🍽️ Dine In" },
  { value: "takeout", label: "🥡 Takeout" },
  { value: "delivery", label: "🚗 Delivery" },
];

const RADIUS_OPTIONS = [1, 3, 5, 10, 20];

const PRICE_LABELS = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };
const PRICE_DESCS = { 1: "Under $15", 2: "Under $30", 3: "Under $50", 4: "Any price" };

const scrollRowStyle = {
  display: "flex",
  flexWrap: "nowrap",
  overflowX: "auto",
  gap: "8px",
  paddingBottom: "4px",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

function CuisineRow({ items, showAll, cuisines, onAll, onToggle }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={scrollRowStyle} className="hide-scrollbar">
        {showAll && (
          <button
            onClick={onAll}
            className={`px-3 py-1.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap flex-shrink-0 ${
              cuisines.length === 0
                ? "bg-teal-600 text-white shadow-md"
                : "bg-teal-100 text-teal-600 hover:bg-teal-200"
            }`}
          >
            All
          </button>
        )}
        {items.map(c => {
          const selected = cuisines.includes(c.value);
          return (
            <button
              key={c.value}
              onClick={() => onToggle(c.value)}
              className={`px-3 py-1.5 rounded-full font-semibold text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                selected
                  ? "bg-teal-600 text-white shadow-md"
                  : "border-2 border-teal-600 text-teal-600 hover:bg-teal-50"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      {/* Right fade gradient */}
      <div style={{
        position: "absolute", top: 0, right: 0, bottom: "4px", width: "32px",
        background: "linear-gradient(to right, transparent, white)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

export default function FilterPanel({ filters, onChange }) {
  const cuisines = filters.cuisines || [];
  const maxPrice = filters.maxPrice ?? 4;

  function toggleCuisine(c) {
    const updated = cuisines.includes(c) ? cuisines.filter(x => x !== c) : [...cuisines, c];
    onChange({ ...filters, cuisines: updated });
  }

  function toggleService(s) {
    const current = filters.services || [];
    const updated = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
    onChange({ ...filters, services: updated });
  }

  return (
    <div className="space-y-5">
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
                  ? "bg-teal-600 text-white shadow-md scale-105"
                  : "border-2 border-teal-600 text-teal-600 hover:bg-teal-50"
              }`}
            >
              {r} mi
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine — 2 scrollable rows */}
      <div>
        <h3 className="font-bold text-foreground mb-2">What are you in the mood for?</h3>
        <div className="space-y-2">
          <CuisineRow
            items={CUISINES_ROW1}
            showAll={true}
            cuisines={cuisines}
            onAll={() => onChange({ ...filters, cuisines: [] })}
            onToggle={toggleCuisine}
          />
          <CuisineRow
            items={CUISINES_ROW2}
            showAll={false}
            cuisines={cuisines}
            onAll={() => onChange({ ...filters, cuisines: [] })}
            onToggle={toggleCuisine}
          />
        </div>
      </div>

      {/* Price filter */}
      <div>
        <h3 className="font-bold text-foreground mb-3">What's your budget?</h3>
        <div className="relative px-1">
          {/* Thumb label */}
          <div
            className="text-center font-black text-teal-700 text-lg mb-1"
            style={{ marginLeft: `calc(${((maxPrice - 1) / 3) * 100}% - ${((maxPrice - 1) / 3) * 24}px)`, width: "24px", transition: "margin 0.1s" }}
          >
            {PRICE_LABELS[maxPrice]}
          </div>
          {/* Slider track + filled */}
          <div className="relative h-2 rounded-full mb-3" style={{ background: "#E5E7EB" }}>
            <div
              className="absolute h-full rounded-full"
              style={{ background: "#0D9488", width: `${((maxPrice - 1) / 3) * 100}%`, transition: "width 0.1s" }}
            />
            <input
              type="range"
              min={1}
              max={4}
              step={1}
              value={maxPrice}
              onChange={e => onChange({ ...filters, maxPrice: Number(e.target.value) })}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              style={{ height: "100%", margin: 0 }}
            />
            {/* Custom thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{
                width: "24px", height: "24px", background: "#F97316",
                left: `calc(${((maxPrice - 1) / 3) * 100}% - ${((maxPrice - 1) / 3) * 24}px)`,
                transition: "left 0.1s",
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            $ Under $15 · $$ Under $30 · $$$ Under $50 · $$$$ Any price
          </p>
        </div>
      </div>

      {/* Service — compact single scrollable row */}
      <div style={{ position: "relative" }}>
        <div style={scrollRowStyle} className="hide-scrollbar">
          {SERVICE_TYPES.map(s => {
            const selected = (filters.services || []).includes(s.value);
            return (
              <button
                key={s.value}
                onClick={() => toggleService(s.value)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all whitespace-nowrap flex-shrink-0 ${
                  selected
                    ? "bg-teal-600 text-white shadow-md scale-105"
                    : "border-2 border-teal-600 text-teal-600 hover:bg-teal-50"
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <div style={{
          position: "absolute", top: 0, right: 0, bottom: "4px", width: "32px",
          background: "linear-gradient(to right, transparent, white)",
          pointerEvents: "none",
        }} />
      </div>

      {/* Open Now — compact */}
      <div className="flex items-center justify-between bg-teal-50 rounded-2xl px-4" style={{ paddingTop: "10px", paddingBottom: "10px" }}>
        <p className="font-bold text-foreground">Open right now 🟢</p>
        <button
          onClick={() => onChange({ ...filters, openNow: !filters.openNow })}
          className={`w-12 h-6 rounded-full transition-all relative flex-shrink-0 ${
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