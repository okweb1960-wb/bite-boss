import { useState } from "react";
import { X } from "lucide-react";

const CUISINES_MAIN = [
  { value: "American", label: "🇺🇸 American" },
  { value: "Burgers", label: "🍔 Burgers" },
  { value: "Fast Food", label: "⚡ Fast Food" },
  { value: "Mexican", label: "🌮 Mexican" },
  { value: "Italian", label: "🍝 Italian" },
  { value: "Pizza", label: "🍕 Pizza" },
  { value: "Chinese", label: "🥡 Chinese" },
  { value: "Japanese", label: "🍜 Japanese" },
  { value: "Sushi", label: "🍣 Sushi" },
  { value: "Thai", label: "🌶️ Thai" },
];

const CUISINES_MORE = [
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

const MORE_VALUES = new Set(CUISINES_MORE.map(c => c.value));

const SERVICE_TYPES = [
  { value: "dine_in", label: "🍽️ Dine In" },
  { value: "takeout", label: "🥡 Takeout" },
  { value: "delivery", label: "🚗 Delivery" },
];

const RADIUS_OPTIONS = [1, 3, 5, 10, 20];


export default function FilterPanel({ filters, onChange }) {
  const [showMoreSheet, setShowMoreSheet] = useState(false);

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

  const selectedCuisines = filters.cuisines || [];
  const hasMoreSelected = selectedCuisines.some(c => MORE_VALUES.has(c));

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
                  ? "bg-teal-600 text-white shadow-md scale-105"
                  : "border-2 border-teal-600 text-teal-600 hover:bg-teal-50"
              }`}
            >
              {r} mi
            </button>
          ))}
        </div>
      </div>

      {/* Cuisine */}
      <div>
        <h3 className="font-bold text-foreground mb-1">What are you in the mood for?</h3>
        <p className="text-xs text-muted-foreground mb-3">Pick one or more</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onChange({ ...filters, cuisines: [] })}
            className={`px-3 py-1.5 rounded-full font-semibold text-sm transition-all ${
              selectedCuisines.length === 0
                ? "bg-teal-600 text-white shadow-md scale-105"
                : "bg-teal-100 text-teal-600 hover:bg-teal-200"
            }`}
          >
            All
          </button>
          {CUISINES_MAIN.map(c => {
            const selected = selectedCuisines.includes(c.value);
            return (
              <button
                key={c.value}
                onClick={() => toggleCuisine(c.value)}
                className={`px-3 py-1.5 rounded-full font-semibold text-sm transition-all ${
                  selected
                    ? "bg-teal-600 text-white shadow-md scale-105"
                    : "border-2 border-teal-600 text-teal-600 hover:bg-teal-50"
                }`}
              >
                {c.label}
              </button>
            );
          })}
          {/* More + button */}
          <button
            onClick={() => setShowMoreSheet(true)}
            className="px-3 py-1.5 rounded-full font-semibold text-sm transition-all"
            style={{
              border: `2px dashed ${hasMoreSelected ? '#0D9488' : '#9CA3AF'}`,
              color: hasMoreSelected ? '#0D9488' : '#6B7280',
              background: hasMoreSelected ? '#F0FDFA' : '#F9FAFB',
            }}
          >
            {hasMoreSelected ? "More ✓" : "More +"}
          </button>
        </div>
      </div>

      {/* Service */}
      <div>
        <h3 className="font-bold text-foreground mb-1">How do you want to eat?</h3>
        <p className="text-xs text-muted-foreground mb-3">Pick one or more (or none for all)</p>
        <div className="flex gap-2 flex-wrap">
          {SERVICE_TYPES.map(s => {
            const selected = (filters.services || []).includes(s.value);
            return (
              <button
                key={s.value}
                onClick={() => toggleService(s.value)}
                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${
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
      </div>

      {/* Open Now */}
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

      {/* More Cuisines Bottom Sheet */}
      {showMoreSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setShowMoreSheet(false)}
          />
          {/* Sheet */}
          <div
            className="relative bg-white flex flex-col"
            style={{ borderRadius: '24px 24px 0 0', maxHeight: '75vh', padding: '20px' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full bg-teal-400" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-teal-700 text-lg">More Options</h2>
              <button
                onClick={() => setShowMoreSheet(false)}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all"
              >
                <X className="w-5 h-5 text-foreground" />
              </button>
            </div>
            {/* Cuisine pills */}
            <div className="flex gap-2 flex-wrap overflow-y-auto flex-1">
              {CUISINES_MORE.map(c => {
                const selected = selectedCuisines.includes(c.value);
                return (
                  <button
                    key={c.value}
                    onClick={() => toggleCuisine(c.value)}
                    className={`px-3 py-1.5 rounded-full font-semibold text-sm transition-all ${
                      selected
                        ? "bg-teal-600 text-white shadow-md scale-105"
                        : "border-2 border-teal-600 text-teal-600 hover:bg-teal-50"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
            {/* Done button */}
            <button
              onClick={() => setShowMoreSheet(false)}
              className="mt-5 w-full py-3 rounded-2xl font-black text-white text-base shadow-lg active:scale-95 transition-all"
              style={{ background: '#F97316', boxShadow: '0 4px 15px rgba(249,115,22,0.4)' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}