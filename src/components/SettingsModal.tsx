import React from 'react';
import { X, RotateCcw, Sliders, Type, AlignLeft, Check } from 'lucide-react';
import { EditorSettings, FontFamily } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EditorSettings;
  onUpdateSettings: (updates: Partial<EditorSettings>) => void;
  onResetDocuments: () => void;
  theme: 'dark' | 'light' | 'sepia';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onResetDocuments,
  theme,
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  const modalBg = isDark
    ? 'bg-neutral-900 border-neutral-700 text-neutral-100'
    : isSepia
    ? 'bg-[#f7f1e1] border-[#d8cbb0] text-[#3d2f1f]'
    : 'bg-white border-neutral-200 text-neutral-900';

  const sectionBorder = isDark
    ? 'border-neutral-800'
    : isSepia
    ? 'border-[#e2d6be]'
    : 'border-neutral-200';

  const btnOptionClass = (active: boolean) => {
    if (active) {
      return 'bg-blue-600 text-white font-medium shadow-xs';
    }
    return isDark
      ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
      : isSepia
      ? 'bg-[#ebdcb9] text-[#4d3c2a] hover:bg-[#e2d1ab]'
      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200';
  };

  return (
    <div
      id="settings-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        id="settings-modal"
        className={`w-full max-w-md rounded-xl border shadow-xl p-6 transition-all ${modalBg}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-inherit">
          <div className="flex items-center gap-2 font-semibold text-base">
            <Sliders className="w-5 h-5 text-blue-500" />
            <h2>Editor Settings</h2>
          </div>
          <button
            type="button"
            id="close-settings-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-5 text-sm">
          {/* Font Family */}
          <div>
            <label className="block font-medium mb-2 flex items-center gap-2">
              <Type className="w-4 h-4 opacity-60" />
              Typography Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['mono', 'sans', 'serif'] as FontFamily[]).map((font) => (
                <button
                  key={font}
                  type="button"
                  id={`font-opt-${font}`}
                  onClick={() => onUpdateSettings({ fontFamily: font })}
                  className={`px-3 py-2 rounded-lg text-xs capitalize text-center transition-colors flex items-center justify-center gap-1.5 ${btnOptionClass(
                    settings.fontFamily === font
                  )}`}
                >
                  {settings.fontFamily === font && <Check className="w-3.5 h-3.5" />}
                  {font === 'mono' ? 'Monospace' : font === 'sans' ? 'Modern Sans' : 'Classic Serif'}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className={`pt-4 border-t ${sectionBorder}`}>
            <div className="flex items-center justify-between mb-2">
              <label className="font-medium">Font Size</label>
              <span className="font-mono text-xs opacity-75">{settings.fontSize}px</span>
            </div>
            <div className="flex items-center gap-2">
              {[12, 14, 16, 18, 20].map((size) => (
                <button
                  key={size}
                  type="button"
                  id={`fontsize-${size}`}
                  onClick={() => onUpdateSettings({ fontSize: size })}
                  className={`flex-1 py-1.5 rounded-md text-xs font-mono transition-colors ${btnOptionClass(
                    settings.fontSize === size
                  )}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className={`pt-4 border-t space-y-3 ${sectionBorder}`}>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <AlignLeft className="w-4 h-4 opacity-60" />
                Line Numbers
              </span>
              <input
                id="toggle-line-numbers"
                type="checkbox"
                checked={settings.lineNumbers}
                onChange={(e) => onUpdateSettings({ lineNumbers: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Word Wrap</span>
              <input
                id="toggle-word-wrap"
                type="checkbox"
                checked={settings.wordWrap}
                onChange={(e) => onUpdateSettings({ wordWrap: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span>Browser Spellcheck</span>
              <input
                id="toggle-spellcheck"
                type="checkbox"
                checked={settings.spellCheck}
                onChange={(e) => onUpdateSettings({ spellCheck: e.target.checked })}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Indentation */}
          <div className={`pt-4 border-t flex items-center justify-between ${sectionBorder}`}>
            <label className="font-medium">Tab Indentation</label>
            <div className="flex items-center gap-1">
              {[2, 4].map((size) => (
                <button
                  key={size}
                  type="button"
                  id={`tabsize-${size}`}
                  onClick={() => onUpdateSettings({ tabSize: size })}
                  className={`px-3 py-1 rounded text-xs font-mono transition-colors ${btnOptionClass(
                    settings.tabSize === size
                  )}`}
                >
                  {size} spaces
                </button>
              ))}
            </div>
          </div>

          {/* Reset Action */}
          <div className={`pt-4 border-t ${sectionBorder}`}>
            <button
              type="button"
              id="reset-docs-btn"
              onClick={() => {
                if (window.confirm('Reset all documents to original sample templates? Any local edits will be replaced.')) {
                  onResetDocuments();
                  onClose();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Sample Documents
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
