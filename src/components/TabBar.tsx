import React, { useState } from 'react';
import { FileText, Code2, Plus, X, Edit2, Check } from 'lucide-react';
import { DocumentItem } from '../types';

interface TabBarProps {
  documents: DocumentItem[];
  activeDocId: string;
  onSelectDoc: (id: string) => void;
  onCloseDoc: (id: string) => void;
  onNewDoc: () => void;
  onRenameDoc: (id: string, newTitle: string) => void;
  theme: 'dark' | 'light' | 'sepia';
}

export const TabBar: React.FC<TabBarProps> = ({
  documents,
  activeDocId,
  onSelectDoc,
  onCloseDoc,
  onNewDoc,
  onRenameDoc,
  theme,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleStartRename = (doc: DocumentItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(doc.id);
    setEditTitle(doc.title);
  };

  const handleSaveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameDoc(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const isDark = theme === 'dark';
  const isSepia = theme === 'sepia';

  const tabBgActive = isDark
    ? 'bg-neutral-900 text-neutral-100 border-neutral-700'
    : isSepia
    ? 'bg-[#f4ecd8] text-[#433422] border-[#d8caa8]'
    : 'bg-white text-neutral-900 border-neutral-300 shadow-xs';

  const tabBgInactive = isDark
    ? 'bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60 border-transparent'
    : isSepia
    ? 'bg-[#e7dec6] text-[#7a6a52] hover:text-[#433422] hover:bg-[#ede3cc] border-transparent'
    : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60 border-transparent';

  const containerBg = isDark
    ? 'bg-neutral-950 border-neutral-800'
    : isSepia
    ? 'bg-[#ded4bc] border-[#d0c29f]'
    : 'bg-neutral-200/70 border-neutral-300';

  return (
    <div
      id="editor-tab-bar"
      className={`flex items-center gap-1 px-2 pt-2 border-b overflow-x-auto text-xs select-none ${containerBg}`}
    >
      <div className="flex items-center gap-1.5 flex-1 overflow-x-auto py-0.5">
        {documents.map((doc) => {
          const isActive = doc.id === activeDocId;
          const isRenaming = editingId === doc.id;

          return (
            <div
              key={doc.id}
              id={`tab-${doc.id}`}
              onClick={() => onSelectDoc(doc.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-md border-t border-x cursor-pointer transition-colors max-w-[200px] shrink-0 ${
                isActive ? tabBgActive : tabBgInactive
              }`}
            >
              {doc.language === 'javascript' || doc.language === 'typescript' ? (
                <Code2 className="w-3.5 h-3.5 opacity-70 shrink-0" />
              ) : (
                <FileText className="w-3.5 h-3.5 opacity-70 shrink-0" />
              )}

              {isRenaming ? (
                <div
                  className="flex items-center gap-1 flex-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editTitle}
                    autoFocus
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(doc.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => handleSaveRename(doc.id)}
                    className="w-24 px-1 py-0.5 text-xs bg-transparent border border-current rounded outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveRename(doc.id)}
                    className="p-0.5 hover:opacity-80"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span
                  className="truncate font-medium flex-1"
                  onDoubleClick={(e) => handleStartRename(doc, e)}
                  title="Double-click to rename"
                >
                  {doc.title}
                </span>
              )}

              {!isRenaming && (
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    id={`rename-btn-${doc.id}`}
                    onClick={(e) => handleStartRename(doc, e)}
                    className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
                    title="Rename"
                  >
                    <Edit2 className="w-3 h-3 opacity-60" />
                  </button>
                  {documents.length > 1 && (
                    <button
                      type="button"
                      id={`close-btn-${doc.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCloseDoc(doc.id);
                      }}
                      className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10"
                      title="Close Document"
                    >
                      <X className="w-3 h-3 opacity-60" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        id="new-document-tab-btn"
        onClick={onNewDoc}
        className={`flex items-center justify-center p-1.5 rounded-md mb-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors ${
          isDark ? 'text-neutral-400 hover:text-neutral-100' : 'text-neutral-600 hover:text-neutral-900'
        }`}
        title="Create New Document"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};
