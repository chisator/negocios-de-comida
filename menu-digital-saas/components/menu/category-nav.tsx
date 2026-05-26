interface CategoryNavProps {
  categories: Array<{ id: string; name: string }>;
  activeId: string;
  onChange: (id: string) => void;
}

export function CategoryNav({ categories, activeId, onChange }: CategoryNavProps) {
  return (
    <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-zinc-800">
      <div className="flex gap-1 overflow-x-auto px-4 py-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onChange(cat.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeId === cat.id
                ? "bg-[#11BEE8] text-black shadow-[0_0_12px_rgba(17,190,232,0.4)]"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 active:scale-95"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
