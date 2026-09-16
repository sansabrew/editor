import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { EditorSettings } from '../types';

interface EditorPaneProps {
  value: string;
  onChange: (value: string) => void;
  onSelectionChange: (start: number, end: number, line: number, col: number) => void;
  settings: EditorSettings;
  theme: 'dark' | 'light' | 'sepia';
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
}

export interface EditorPaneHandle {
  getTextarea: () => HTMLTextAreaElement | null;
  focus: () => void;
  setSelection: (start: number, end: number) => void;
}

export const EditorPane = forwardRef<EditorPaneHandle, EditorPaneProps>(
  ({ value, onChange, onSelectionChange, settings, theme, onScroll }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getTextarea: () => textareaRef.current,
      focus: () => textareaRef.current?.focus(),
      setSelection: (start: number, end: number) => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(start, end);
        }
      },
    }));

    const lines = value.split('\n');
    const lineCount = Math.max(1, lines.length);

    const isDark = theme === 'dark';
    const isSepia = theme === 'sepia';

    const bgClass = isDark
      ? 'bg-neutral-900 text-neutral-100'
      : isSepia
      ? 'bg-[#fbf7ee] text-[#3c2f1f]'
      : 'bg-white text-neutral-900';

    const gutterBg = isDark
      ? 'bg-neutral-950/80 text-neutral-600 border-neutral-800'
      : isSepia
      ? 'bg-[#f0e7d1] text-[#9c8b74] border-[#ded3bb]'
      : 'bg-neutral-100 text-neutral-400 border-neutral-200';

    const fontClass =
      settings.fontFamily === 'mono'
        ? 'font-mono-code'
        : settings.fontFamily === 'serif'
        ? 'font-serif-body'
        : 'font-sans-body';

    const updateCursorPosition = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const textUpToCursor = value.substring(0, start);
      const linesUpToCursor = textUpToCursor.split('\n');
      const currentLine = linesUpToCursor.length;
      const currentCol = linesUpToCursor[linesUpToCursor.length - 1].length + 1;

      onSelectionChange(start, end, currentLine, currentCol);
    };

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
      const target = e.currentTarget;
      if (gutterRef.current) {
        gutterRef.current.scrollTop = target.scrollTop;
      }
      if (onScroll) {
        onScroll(target.scrollTop, target.scrollHeight, target.clientHeight);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const { selectionStart, selectionEnd } = textarea;

      // Handle Tab
      if (e.key === 'Tab') {
        e.preventDefault();
        const tabSpaces = ' '.repeat(settings.tabSize || 2);

        if (selectionStart === selectionEnd) {
          const newValue =
            value.substring(0, selectionStart) + tabSpaces + value.substring(selectionEnd);
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = selectionStart + tabSpaces.length;
            textarea.selectionEnd = selectionStart + tabSpaces.length;
            updateCursorPosition();
          }, 0);
        } else {
          // Multi-line indent/outdent
          const before = value.substring(0, selectionStart);
          const lineStart = before.lastIndexOf('\n') + 1;
          const after = value.substring(selectionEnd);
          const selectedText = value.substring(lineStart, selectionEnd);
          const selectedLines = selectedText.split('\n');

          let newSelectedText = '';
          if (e.shiftKey) {
            // Outdent
            newSelectedText = selectedLines
              .map((line) => (line.startsWith(tabSpaces) ? line.substring(tabSpaces.length) : line))
              .join('\n');
          } else {
            // Indent
            newSelectedText = selectedLines.map((line) => tabSpaces + line).join('\n');
          }

          const newValue = value.substring(0, lineStart) + newSelectedText + after;
          onChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = lineStart;
            textarea.selectionEnd = lineStart + newSelectedText.length;
            updateCursorPosition();
          }, 0);
        }
        return;
      }

      // Auto closing pairs
      const pairs: Record<string, string> = {
        '(': ')',
        '[': ']',
        '{': '}',
        '"': '"',
        "'": "'",
        '`': '`',
      };

      if (pairs[e.key] && selectionStart === selectionEnd) {
        e.preventDefault();
        const closeChar = pairs[e.key];
        const newValue =
          value.substring(0, selectionStart) + e.key + closeChar + value.substring(selectionEnd);
        onChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = selectionStart + 1;
          textarea.selectionEnd = selectionStart + 1;
          updateCursorPosition();
        }, 0);
        return;
      }
    };

    return (
      <div id="editor-pane-container" className={`relative flex flex-1 h-full overflow-hidden ${bgClass}`}>
        {settings.lineNumbers && (
          <div
            ref={gutterRef}
            id="editor-line-gutter"
            className={`select-none text-right px-2.5 py-4 border-r overflow-hidden font-mono text-xs leading-[1.6] shrink-0 ${gutterBg}`}
            style={{ fontSize: `${settings.fontSize}px`, minWidth: '42px' }}
          >
            {Array.from({ length: lineCount }).map((_, idx) => (
              <div key={idx} className="h-[1.6em]">
                {idx + 1}
              </div>
            ))}
          </div>
        )}

        <div className="relative flex-1 h-full overflow-hidden">
          <textarea
            ref={textareaRef}
            id="editor-textarea"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              updateCursorPosition();
            }}
            onKeyUp={updateCursorPosition}
            onClick={updateCursorPosition}
            onSelect={updateCursorPosition}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            spellCheck={settings.spellCheck}
            wrap={settings.wordWrap ? 'on' : 'off'}
            placeholder="Type your document content here..."
            className={`w-full h-full p-4 resize-none outline-hidden bg-transparent leading-[1.6] ${fontClass} ${
              settings.wordWrap ? 'whitespace-pre-wrap' : 'whitespace-pre overflow-x-auto'
            }`}
            style={{ fontSize: `${settings.fontSize}px` }}
          />
        </div>
      </div>
    );
  }
);
