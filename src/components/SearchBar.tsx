import React, { useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, Replace, X } from 'lucide-react';
import { SearchState } from '../types';

interface SearchBarProps {
  searchState: SearchState;
  onUpdateSearch: (updates: Partial<SearchState>) => void;
  onFindNext: () => void;
  onFindPrev: () => void;
  onReplaceCurrent: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
  theme: 'dark' | 'light' | 'sepia';
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchState,
  onUpdateSearch,
  onFindNext,
  onFindPrev,
  onReplaceCurrent,
  onReplaceAll,
  onClose,
  theme,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchState.isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [searchState.isOpen]);

  if (!searchState.isOpen) return null;

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  const containerBg = isDark
    ? 'bg-neutral-900/95 border-neutral-700 text-neutral-200'
    : isSepia
    ? 'bg-[#f4ecd8]/95 border-[#d5c7a4] text-[#423422]'
    : 'bg-white/95 border-neutral-300 text-neutral-800 shadow-md';

  const inputBg = isDark
    ? 'bg-neutral-800 border-neutral-700 text-neutral-100 placeholder-neutral-500'
    : isSepia
    ? 'bg-[#e9dfc6] border-[#d0c29d] text-[#332514] placeholder-[#8a7a66]'
    : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder-neutral-400';

  const btnClass = isDark
    ? 'hover:bg-neutral-800 text-neutral-300'
    : isSepia
    ? 'hover:bg-[#e4d8bb] text-[#4b3c2a]'
    : 'hover:bg-neutral-200 text-neutral-700';

  return (
    <div
      id="search-and-replace-bar"
      className={`flex flex-wrap items-center gap-2 p-2.5 border-b backdrop-blur-xs text-xs select-none transition-all ${containerBg}`}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-[260px]">
        <Search className="w-3.5 h-3.5 opacity-50 shrink-0" />
        <div className="relative flex-1">
          <input
            ref={inputRef}
            id="search-input"
            type="text"
            placeholder="Find in document..."
            value={searchState.query}
            onChange={(e) => onUpdateSearch({ query: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) onFindPrev();
                else onFindNext();
              }
              if (e.key === 'Escape') onClose();
            }}
            className={`w-full px-2 py-1 pr-16 rounded border outline-hidden text-xs ${inputBg}`}
          />
          {searchState.query && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] opacity-60">
              {searchState.matchesCount > 0
                ? `${searchState.currentIndex + 1} of ${searchState.matchesCount}`
                : 'No match'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            id="search-prev-btn"
            disabled={searchState.matchesCount === 0}
            onClick={onFindPrev}
            className={`p-1 rounded disabled:opacity-30 ${btnClass}`}
            title="Previous match (Shift+Enter)"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="search-next-btn"
            disabled={searchState.matchesCount === 0}
            onClick={onFindNext}
            className={`p-1 rounded disabled:opacity-30 ${btnClass}`}
            title="Next match (Enter)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            id="search-match-case-btn"
            onClick={() => onUpdateSearch({ matchCase: !searchState.matchCase })}
            className={`px-1.5 py-0.5 rounded font-mono font-semibold border ${
              searchState.matchCase
                ? 'bg-blue-600 text-white border-blue-600'
                : `border-transparent opacity-60 ${btnClass}`
            }`}
            title="Match Case"
          >
            Aa
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-1 min-w-[240px]">
        <Replace className="w-3.5 h-3.5 opacity-50 shrink-0" />
        <input
          id="replace-input"
          type="text"
          placeholder="Replace with..."
          value={searchState.replaceText}
          onChange={(e) => onUpdateSearch({ replaceText: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onReplaceCurrent();
            if (e.key === 'Escape') onClose();
          }}
          className={`flex-1 px-2 py-1 rounded border outline-hidden text-xs ${inputBg}`}
        />

        <div className="flex items-center gap-1">
          <button
            type="button"
            id="replace-current-btn"
            disabled={searchState.matchesCount === 0}
            onClick={onReplaceCurrent}
            className={`px-2 py-1 rounded border border-current/20 disabled:opacity-30 font-medium ${btnClass}`}
          >
            Replace
          </button>
          <button
            type="button"
            id="replace-all-btn"
            disabled={searchState.matchesCount === 0}
            onClick={onReplaceAll}
            className={`px-2 py-1 rounded border border-current/20 disabled:opacity-30 font-medium ${btnClass}`}
          >
            All
          </button>
        </div>
      </div>

      <button
        type="button"
        id="search-close-btn"
        onClick={onClose}
        className={`p-1 rounded opacity-60 hover:opacity-100 ${btnClass}`}
        title="Close (Escape)"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
