import { X } from 'lucide-react';

export default function FilterSummary({ filters, location, onClear }) {
  if (!filters || (!filters.cuisines?.length && filters.radius === 5 && !filters.services?.length && !filters.openNow)) {
    return null;
  }

  const tags = [];
  if (filters.cuisines?.length) tags.push(...filters.cuisines);
  if (filters.radius !== 5) tags.push(`${filters.radius}mi`);
  if (filters.services?.length) tags.push(...filters.services);
  if (filters.openNow) tags.push('Open Now');

  return (
    <div className="px-5 py-3 bg-black/20 backdrop-blur-sm flex flex-wrap items-center gap-2">
      {tags.map((tag, i) => (
        <span key={i} className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-semibold">
          {tag}
        </span>
      ))}
      {tags.length > 0 && (
        <button
          onClick={onClear}
          className="ml-auto p-1 hover:bg-white/20 rounded-full transition-all"
          title="Clear filters"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      )}
    </div>
  );
}