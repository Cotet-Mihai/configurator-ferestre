'use client';

interface Option<T> {
  value: T;
  label: string;
  description?: string;
}

interface BinaryChoiceProps<T> {
  question: string;
  options: [Option<T>, Option<T>];
  onSelect: (value: T) => void;
}

export function BinaryChoice<T>({
  question,
  options,
  onSelect,
}: BinaryChoiceProps<T>) {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto px-4">
      <h2 className="text-2xl font-semibold text-zinc-900 text-center">
        {question}
      </h2>
      <div className="flex flex-col md:flex-row w-full gap-4 md:gap-0 rounded-2xl overflow-hidden shadow-sm border border-zinc-200">
        {options.map((opt, i) => (
          <button
            key={String(opt.value)}
            onClick={() => onSelect(opt.value)}
            className={`
              group flex-1 flex flex-col items-center justify-center gap-3
              min-h-[240px] md:min-h-[320px] px-8 py-10
              bg-white hover:bg-amber-50
              transition-all duration-200
              ${i === 0 ? 'md:border-r border-b md:border-b-0 border-zinc-200' : ''}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
            `}
          >
            <span className="text-xl font-semibold text-zinc-900 group-hover:text-amber-800 transition-colors duration-200">
              {opt.label}
            </span>
            {opt.description && (
              <span className="text-sm text-zinc-500 text-center">
                {opt.description}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
