import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';
import { DocumentStats, LanguageType } from '../types';

interface StatusBarProps {
  stats: DocumentStats;
  cursorPos: { line: number; col: number; selectedChars: number };
  language: LanguageType;
  theme: 'dark' | 'light' | 'sepia';
  lastSavedAt: number | null;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  stats,
  cursorPos,
  language,
  theme,
  lastSavedAt,
}) => {
  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  const barBg = isDark
    ? 'bg-neutral-950 border-neutral-800 text-neutral-400'
    : isSepia
    ? 'bg-[#eae0c8] border-[#d8caa8] text-[#6b5a45]'
    : 'bg-neutral-100 border-neutral-200 text-neutral-600';

  const badgeBg = isDark
    ? 'bg-neutral-800 text-neutral-300'
    : isSepia
    ? 'bg-[#dbcbb0] text-[#4a3a28]'
    : 'bg-neutral-200 text-neutral-800';

  return (
    <footer
      id="editor-status-bar"
      className={`flex items-center justify-between px-3 py-1 border-t text-[11px] select-none shrink-0 ${barBg}`}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
          <CheckCircle2 className="w-3 h-3" />
          <span>{lastSavedAt ? 'Saved' : 'Auto-save active'}</span>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <span>
            <strong className="font-semibold">{stats.words}</strong> words
          </span>
          <span>
            <strong className="font-semibold">{stats.characters}</strong> chars
          </span>
          <span>
            <strong className="font-semibold">{stats.lines}</strong> lines
          </span>
        </div>

        {stats.readingTimeMinutes > 0 && (
          <div className="hidden md:flex items-center gap-1 opacity-80">
            <Clock className="w-3 h-3" />
            <span>~{stats.readingTimeMinutes} min read</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="font-mono">
          <span>Ln {cursorPos.line}, Col {cursorPos.col}</span>
          {cursorPos.selectedChars > 0 && (
            <span className="ml-1.5 opacity-75">({cursorPos.selectedChars} selected)</span>
          )}
        </div>

        <span className={`px-2 py-0.5 rounded font-mono uppercase text-[10px] font-medium tracking-wide ${badgeBg}`}>
          {language}
        </span>
      </div>
    </footer>
  );
};
