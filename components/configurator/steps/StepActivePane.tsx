'use client';

import type { ConfiguratorAction, ActivePane } from '@/lib/configurator/types';

let lastSelectTime = 0;

interface Props {
  dispatch: React.Dispatch<ConfiguratorAction>;
}

const OPTIONS: { value: ActivePane; label: string; description: string }[] = [
  {
    value: 'left',
    label: 'Geamul din stânga',
    description: 'Mânerul pe geamul stâng',
  },
  {
    value: 'right',
    label: 'Geamul din dreapta',
    description: 'Mânerul pe geamul drept',
  },
  {
    value: 'both',
    label: 'Ambele geamuri',
    description: 'Vei selecta pe care geam e mânerul',
  },
];

export function StepActivePane({ dispatch }: Props) {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto px-4">
      <h2 className="text-2xl font-semibold text-zinc-900 text-center">
        Ce geam se deschide?
      </h2>
      <div className="flex flex-col md:flex-row w-full gap-4 md:gap-0 rounded-2xl overflow-hidden shadow-sm border border-zinc-200">
        {OPTIONS.map((opt, i) => (
          <button
            key={opt.value}
            onClick={() => {
              const now = Date.now();
              if (now - lastSelectTime < 400) return;
              lastSelectTime = now;
              dispatch({ type: 'SET_ACTIVE_PANE', payload: opt.value });
            }}
            className={`
              group flex-1 flex flex-col items-center justify-center gap-3
              min-h-[240px] md:min-h-[320px] px-6 py-10
              bg-white hover:bg-amber-50
              transition-all duration-200
              ${i < OPTIONS.length - 1 ? 'md:border-r border-b md:border-b-0 border-zinc-200' : ''}
              focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500
            `}
          >
            <span className="text-xl font-semibold text-zinc-900 group-hover:text-amber-800 transition-colors duration-200">
              {opt.label}
            </span>
            <span className="text-sm text-zinc-500 text-center">
              {opt.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
