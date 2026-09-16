import React, { useState, useRef } from 'react';
import {
  PenTool,
  Columns,
  Eye,
  Edit3,
  Search,
  Download,
  Upload,
  Copy,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Coffee,
  Check,
  ChevronDown,
} from 'lucide-react';
import { EditorTheme, EditorViewMode } from '../types';

interface HeaderProps {
  viewMode: EditorViewMode;
  onSetViewMode: (mode: EditorViewMode) => void;
  theme: EditorTheme;
  onSetTheme: (theme: EditorTheme) => void;
  onToggleSearch: () => void;
  isSearchOpen: boolean;
  onOpenSettings: () => void;
  onExport: (format: 'md' | 'txt' | 'html') => void;
  onCopyContent: () => void;
  onImportFile: (file: File) => void;
  activeDocTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onSetViewMode,
  theme,
  onSetTheme,
  onToggleSearch,
  isSearchOpen,
  onOpenSettings,
  onExport,
  onCopyContent,
  onImportFile,
  activeDocTitle,
}) => {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    onCopyContent();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  const headerBg = isDark
    ? 'bg-neutral-950 border-neutral-800 text-neutral-200'
    : isSepia
    ? 'bg-[#ece2cb] border-[#d8caa7] text-[#3e301f]'
    : 'bg-white border-neutral-200 text-neutral-800 shadow-xs';

  const btnClass = (active = false) => {
    if (active) {
      return isDark
        ? 'bg-neutral-800 text-white shadow-xs'
        : isSepia
        ? 'bg-[#ded0b1] text-[#332515] shadow-xs'
        : 'bg-neutral-200 text-neutral-900 shadow-xs';
    }
    return isDark
      ? 'text-neutral-400 hover:text-white hover:bg-neutral-900'
      : isSepia
      ? 'text-[#74644e] hover:text-[#332515] hover:bg-[#e2d5ba]'
      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100';
  };

  const dropdownBg = isDark
    ? 'bg-neutral-900 border-neutral-700 text-neutral-200'
    : isSepia
    ? 'bg-[#f4ebd6] border-[#d4c6a4] text-[#3c2e1d]'
    : 'bg-white border-neutral-200 text-neutral-800 shadow-lg';

  const nextTheme: Record<EditorTheme, EditorTheme> = {
    dark: 'light',
    light: 'sepia',
    sepia: 'dark',
  };

  return (
    <header
      id="editor-main-header"
      className={`flex items-center justify-between px-3.5 py-2 border-b select-none shrink-0 transition-colors ${headerBg}`}
    >
      {/* Left: Brand & Active Document */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white shadow-xs">
            <PenTool className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight hidden sm:inline">Editor</span>
        </div>

        <div className="h-4 border-r border-current opacity-20 hidden sm:block" />

        <div className="flex items-center gap-1.5 text-xs truncate max-w-[200px] md:max-w-xs font-mono opacity-85">
          <span className="truncate">{activeDocTitle}</span>
        </div>
      </div>

      {/* Center: View Modes */}
      <div
        id="view-mode-selector"
        className={`flex items-center p-0.5 rounded-lg border text-xs ${
          isDark
            ? 'bg-neutral-900 border-neutral-800'
            : isSepia
            ? 'bg-[#e2d5ba] border-[#d5c6a5]'
            : 'bg-neutral-100 border-neutral-200'
        }`}
      >
        <button
          type="button"
          id="view-mode-edit-btn"
          onClick={() => onSetViewMode('edit')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${btnClass(
            viewMode === 'edit'
          )}`}
          title="Editor Only"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Edit</span>
        </button>
        <button
          type="button"
          id="view-mode-split-btn"
          onClick={() => onSetViewMode('split')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${btnClass(
            viewMode === 'split'
          )}`}
          title="Split View (Side by Side)"
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Split</span>
        </button>
        <button
          type="button"
          id="view-mode-preview-btn"
          onClick={() => onSetViewMode('preview')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${btnClass(
            viewMode === 'preview'
          )}`}
          title="Preview Only"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Preview</span>
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 text-xs">
        {/* Search Toggle */}
        <button
          type="button"
          id="header-search-toggle-btn"
          onClick={onToggleSearch}
          className={`p-1.5 rounded-md transition-colors ${btnClass(isSearchOpen)}`}
          title="Find and Replace (Ctrl+F)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Copy Text */}
        <button
          type="button"
          id="header-copy-btn"
          onClick={handleCopy}
          className={`p-1.5 rounded-md transition-colors ${btnClass(copied)}`}
          title={copied ? 'Copied to Clipboard!' : 'Copy Document Text'}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>

        {/* Open Local File */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.txt,.js,.ts,.html,.json,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onImportFile(file);
              e.target.value = '';
            }
          }}
        />
        <button
          type="button"
          id="header-import-file-btn"
          onClick={() => fileInputRef.current?.click()}
          className={`p-1.5 rounded-md transition-colors ${btnClass()}`}
          title="Open Local File (.md, .txt, .js, etc.)"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            type="button"
            id="header-export-btn"
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors font-medium ${btnClass(
              isExportMenuOpen
            )}`}
            title="Export or Download"
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">Export</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isExportMenuOpen && (
            <div
              id="export-dropdown-menu"
              className={`absolute right-0 mt-1 w-44 rounded-lg border shadow-lg py-1 z-30 ${dropdownBg}`}
              onClick={() => setIsExportMenuOpen(false)}
            >
              <button
                type="button"
                id="export-md-option"
                onClick={() => onExport('md')}
                className="w-full text-left px-3 py-2 text-xs hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-between"
              >
                <span>Markdown (.md)</span>
              </button>
              <button
                type="button"
                id="export-txt-option"
                onClick={() => onExport('txt')}
                className="w-full text-left px-3 py-2 text-xs hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-between"
              >
                <span>Plain Text (.txt)</span>
              </button>
              <button
                type="button"
                id="export-html-option"
                onClick={() => onExport('html')}
                className="w-full text-left px-3 py-2 text-xs hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-between"
              >
                <span>HTML Page (.html)</span>
              </button>
            </div>
          )}
        </div>

        {/* Theme Cycler */}
        <button
          type="button"
          id="header-theme-toggle-btn"
          onClick={() => onSetTheme(nextTheme[theme])}
          className={`p-1.5 rounded-md transition-colors ${btnClass()}`}
          title={`Switch Theme (Current: ${theme})`}
        >
          {theme === 'dark' && <Moon className="w-4 h-4 text-blue-400" />}
          {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
          {theme === 'sepia' && <Coffee className="w-4 h-4 text-amber-700" />}
        </button>

        {/* Settings */}
        <button
          type="button"
          id="header-settings-btn"
          onClick={onOpenSettings}
          className={`p-1.5 rounded-md transition-colors ${btnClass()}`}
          title="Editor Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
