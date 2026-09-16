import React from 'react';
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  List,
  ListOrdered,
  CheckSquare,
  Link,
  Table,
  Minus,
} from 'lucide-react';

interface ToolbarProps {
  onFormat: (action: string) => void;
  theme: 'dark' | 'light' | 'sepia';
  disabled?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ onFormat, theme, disabled = false }) => {
  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  const toolbarBg = isDark
    ? 'bg-neutral-900 border-neutral-800 text-neutral-300'
    : isSepia
    ? 'bg-[#f4ecd8] border-[#dfd4ba] text-[#554330]'
    : 'bg-white border-neutral-200 text-neutral-700';

  const btnHover = isDark
    ? 'hover:bg-neutral-800 hover:text-white'
    : isSepia
    ? 'hover:bg-[#e6dcbf] hover:text-neutral-900'
    : 'hover:bg-neutral-100 hover:text-neutral-900';

  const dividerColor = isDark
    ? 'border-neutral-800'
    : isSepia
    ? 'border-[#dfd4ba]'
    : 'border-neutral-200';

  return (
    <div
      id="formatting-toolbar"
      className={`flex items-center gap-0.5 px-3 py-1.5 border-b overflow-x-auto text-xs shrink-0 select-none ${toolbarBg}`}
    >
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          id="toolbar-bold-btn"
          disabled={disabled}
          onClick={() => onFormat('bold')}
          className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${btnHover}`}
          title="Bold (Ctrl/Cmd+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          id="toolbar-italic-btn"
          disabled={disabled}
          onClick={() => onFormat('italic')}
          className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${btnHover}`}
          title="Italic (Ctrl/Cmd+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          id="toolbar-strike-btn"
          disabled={disabled}
          onClick={() => onFormat('strike')}
          className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${btnHover}`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
      </div>

      <div className={`h-4 border-r mx-1 ${dividerColor}`} />

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          id="toolbar-h1-btn"
          disabled={disabled}
          onClick={() => onFormat('h1')}
          className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${btnHover}`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          id="toolbar-h2-btn"
          disabled={disabled}
          onClick={() => onFormat('h2')}
          className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${btnHover}`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          id="toolbar-h3-btn"
          disabled={disabled}
          onClick={() => onFormat('h3')}
          className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${btnHover}`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
      </div>

      <div className={`h-4 border-r mx-1 ${dividerColor}`} />

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          id="toolbar-quote-btn"
          disabled={disabled}
          onClick={() => onFormat('quote')}
          className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${btnHover}`}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          type="button"
          id="toolbar-code-btn"
          disabled={disabled}
          onClick={() => onFormat('code')}
          className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${btnHover}`}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>

      <div className={`h-4 border-r mx-1 ${dividerColor}`} />

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          id="toolbar-ul-btn"
          disabled={disabled}
          onClick={() => onFormat('ul')}
          className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${btnHover}`}
          title="Bulleted List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          id="toolbar-ol-btn"
          disabled={disabled}
          onClick={() => onFormat('ol')}
          className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${btnHover}`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          id="toolbar-task-btn"
          disabled={disabled}
          onClick={() => onFormat('task')}
          className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${btnHover}`}
          title="Task List"
        >
          <CheckSquare className="w-4 h-4" />
        </button>
      </div>

      <div className={`h-4 border-r mx-1 ${dividerColor}`} />

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          id="toolbar-link-btn"
          disabled={disabled}
          onClick={() => onFormat('link')}
          className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${btnHover}`}
          title="Insert Link"
        >
          <Link className="w-4 h-4" />
        </button>
        <button
          type="button"
          id="toolbar-table-btn"
          disabled={disabled}
          onClick={() => onFormat('table')}
          className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${btnHover}`}
          title="Insert Table"
        >
          <Table className="w-4 h-4" />
        </button>
        <button
          type="button"
          id="toolbar-hr-btn"
          disabled={disabled}
          onClick={() => onFormat('hr')}
          className={`p-1.5 rounded-md transition-colors disabled:opacity-40 ${btnHover}`}
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
