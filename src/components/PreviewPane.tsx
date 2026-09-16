import React, { forwardRef } from 'react';
import Markdown from 'react-markdown';
import { EditorSettings } from '../types';
import { BookOpen } from 'lucide-react';

interface PreviewPaneProps {
  content: string;
  theme: 'dark' | 'light' | 'sepia';
  settings: EditorSettings;
  title: string;
}

export const PreviewPane = forwardRef<HTMLDivElement, PreviewPaneProps>(
  ({ content, theme, settings, title }, ref) => {
    const isDark = theme === 'dark';
    const isSepia = theme === 'sepia';

    const bgClass = isDark
      ? 'bg-neutral-950 text-neutral-200'
      : isSepia
      ? 'bg-[#f7f2e4] text-[#332616]'
      : 'bg-neutral-50/80 text-neutral-800';

    const fontClass =
      settings.fontFamily === 'serif'
        ? 'font-serif-body'
        : settings.fontFamily === 'mono'
        ? 'font-mono-code'
        : 'font-sans-body';

    const headerBorder = isDark
      ? 'border-neutral-800'
      : isSepia
      ? 'border-[#ded2b8]'
      : 'border-neutral-200';

    return (
      <div
        id="preview-pane-container"
        ref={ref}
        className={`flex-1 h-full overflow-y-auto px-8 py-6 ${bgClass} ${fontClass}`}
        style={{ fontSize: `${settings.fontSize}px` }}
      >
        <div className="max-w-3xl mx-auto">
          <div
            id="preview-header-meta"
            className={`flex items-center justify-between pb-3 mb-6 border-b text-xs opacity-60 ${headerBorder}`}
          >
            <div className="flex items-center gap-1.5 font-medium">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Preview Mode &mdash; {title}</span>
            </div>
            <span>Rendered Live</span>
          </div>

          <div className="markdown-body">
            <Markdown>{content || '*No content to preview yet. Start writing in the editor!*'}</Markdown>
          </div>
        </div>
      </div>
    );
  }
);
