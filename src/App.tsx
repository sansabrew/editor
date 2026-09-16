import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { Toolbar } from './components/Toolbar';
import { SearchBar } from './components/SearchBar';
import { EditorPane, EditorPaneHandle } from './components/EditorPane';
import { PreviewPane } from './components/PreviewPane';
import { StatusBar } from './components/StatusBar';
import { SettingsModal } from './components/SettingsModal';
import { INITIAL_DOCUMENTS } from './data/defaultDocs';
import {
  DocumentItem,
  EditorSettings,
  EditorTheme,
  EditorViewMode,
  SearchState,
} from './types';
import {
  applyFormatting,
  calculateDocumentStats,
  detectLanguageFromTitle,
  downloadFile,
  generateHTMLDocument,
} from './utils/textUtils';

const STORAGE_KEYS = {
  DOCS: 'editor_documents_v1',
  ACTIVE_ID: 'editor_active_doc_id_v1',
  THEME: 'editor_theme_v1',
  VIEW_MODE: 'editor_view_mode_v1',
  SETTINGS: 'editor_settings_v1',
};

const DEFAULT_SETTINGS: EditorSettings = {
  fontSize: 14,
  lineNumbers: true,
  wordWrap: true,
  fontFamily: 'mono',
  tabSize: 2,
  spellCheck: true,
};

export const App: React.FC = () => {
  // Documents state
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DOCS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_DOCUMENTS;
  });

  const [activeDocId, setActiveDocId] = useState<string>(() => {
    const savedId = localStorage.getItem(STORAGE_KEYS.ACTIVE_ID);
    if (savedId && documents.some((d) => d.id === savedId)) {
      return savedId;
    }
    return documents[0]?.id || INITIAL_DOCUMENTS[0].id;
  });

  // UI preferences
  const [theme, setTheme] = useState<EditorTheme>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) as EditorTheme;
    return saved === 'light' || saved === 'sepia' || saved === 'dark' ? saved : 'dark';
  });

  const [viewMode, setViewMode] = useState<EditorViewMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VIEW_MODE) as EditorViewMode;
    return saved === 'edit' || saved === 'preview' || saved === 'split' ? saved : 'split';
  });

  const [settings, setSettings] = useState<EditorSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(Date.now());

  // Cursor & selection tracking
  const [cursorPos, setCursorPos] = useState({
    start: 0,
    end: 0,
    line: 1,
    col: 1,
    selectedChars: 0,
  });

  // Search and replace state
  const [searchState, setSearchState] = useState<SearchState>({
    isOpen: false,
    query: '',
    replaceText: '',
    matchCase: false,
    currentIndex: 0,
    matchesCount: 0,
  });

  const editorRef = useRef<EditorPaneHandle>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Active document
  const activeDoc = documents.find((d) => d.id === activeDocId) || documents[0];

  // Show temporary toast notification
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Save documents to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DOCS, JSON.stringify(documents));
      setLastSavedAt(Date.now());
    } catch (e) {
      console.error('Failed to save documents to localStorage', e);
    }
  }, [documents]);

  // Save active document ID
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ID, activeDocId);
  }, [activeDocId]);

  // Save theme
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Save view mode
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
  }, [viewMode]);

  // Save settings
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  // Handle active doc content update
  const handleContentChange = useCallback(
    (newContent: string) => {
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === activeDocId
            ? { ...doc, content: newContent, updatedAt: Date.now() }
            : doc
        )
      );
    },
    [activeDocId]
  );

  // Handle document rename
  const handleRenameDoc = useCallback((id: string, newTitle: string) => {
    const language = detectLanguageFromTitle(newTitle);
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === id ? { ...doc, title: newTitle, language, updatedAt: Date.now() } : doc
      )
    );
  }, []);

  // Create a new document
  const handleNewDoc = useCallback(() => {
    const docNum = documents.length + 1;
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      title: `Untitled-${docNum}.md`,
      content: `# Untitled Document\n\nStart writing here...\n`,
      language: 'markdown',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setDocuments((prev) => [...prev, newDoc]);
    setActiveDocId(newDoc.id);
    showToast(`Created ${newDoc.title}`);
  }, [documents.length, showToast]);

  // Close a document
  const handleCloseDoc = useCallback(
    (id: string) => {
      if (documents.length <= 1) return;
      const index = documents.findIndex((d) => d.id === id);
      const remaining = documents.filter((d) => d.id !== id);
      setDocuments(remaining);

      if (id === activeDocId) {
        const nextActive = remaining[Math.min(index, remaining.length - 1)];
        if (nextActive) setActiveDocId(nextActive.id);
      }
    },
    [documents, activeDocId]
  );

  // Formatting actions
  const handleFormat = useCallback(
    (action: string) => {
      if (!activeDoc) return;
      const { start, end } = cursorPos;
      const result = applyFormatting(activeDoc.content, start, end, action);

      handleContentChange(result.newText);

      setTimeout(() => {
        editorRef.current?.setSelection(result.newSelectionStart, result.newSelectionEnd);
      }, 0);
    },
    [activeDoc, cursorPos, handleContentChange]
  );

  // Search: update match counts and find positions
  const getSearchMatches = useCallback((): number[] => {
    if (!activeDoc || !searchState.query) return [];
    const text = activeDoc.content;
    const query = searchState.query;
    const matches: number[] = [];

    const flags = searchState.matchCase ? 'g' : 'gi';
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, flags);

    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push(match.index);
    }
    return matches;
  }, [activeDoc, searchState.query, searchState.matchCase]);

  useEffect(() => {
    const matches = getSearchMatches();
    setSearchState((prev) => ({
      ...prev,
      matchesCount: matches.length,
      currentIndex: matches.length > 0 ? Math.min(prev.currentIndex, matches.length - 1) : 0,
    }));
  }, [getSearchMatches]);

  // Find next match
  const handleFindNext = useCallback(() => {
    const matches = getSearchMatches();
    if (matches.length === 0) return;

    const nextIndex = (searchState.currentIndex + 1) % matches.length;
    setSearchState((prev) => ({ ...prev, currentIndex: nextIndex }));

    const matchPos = matches[nextIndex];
    editorRef.current?.setSelection(matchPos, matchPos + searchState.query.length);
  }, [getSearchMatches, searchState.currentIndex, searchState.query.length]);

  // Find previous match
  const handleFindPrev = useCallback(() => {
    const matches = getSearchMatches();
    if (matches.length === 0) return;

    const prevIndex = (searchState.currentIndex - 1 + matches.length) % matches.length;
    setSearchState((prev) => ({ ...prev, currentIndex: prevIndex }));

    const matchPos = matches[prevIndex];
    editorRef.current?.setSelection(matchPos, matchPos + searchState.query.length);
  }, [getSearchMatches, searchState.currentIndex, searchState.query.length]);

  // Replace current match
  const handleReplaceCurrent = useCallback(() => {
    if (!activeDoc || searchState.matchesCount === 0) return;
    const matches = getSearchMatches();
    const currentPos = matches[searchState.currentIndex];
    if (currentPos === undefined) return;

    const queryLen = searchState.query.length;
    const newContent =
      activeDoc.content.substring(0, currentPos) +
      searchState.replaceText +
      activeDoc.content.substring(currentPos + queryLen);

    handleContentChange(newContent);
    showToast('Replaced 1 match');
  }, [activeDoc, searchState, getSearchMatches, handleContentChange, showToast]);

  // Replace all matches
  const handleReplaceAll = useCallback(() => {
    if (!activeDoc || !searchState.query || searchState.matchesCount === 0) return;
    const flags = searchState.matchCase ? 'g' : 'gi';
    const escapedQuery = searchState.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, flags);
    const count = searchState.matchesCount;

    const newContent = activeDoc.content.replace(regex, searchState.replaceText);
    handleContentChange(newContent);
    showToast(`Replaced ${count} matches`);
  }, [activeDoc, searchState, handleContentChange, showToast]);

  // Export handlers
  const handleExport = useCallback(
    (format: 'md' | 'txt' | 'html') => {
      if (!activeDoc) return;
      const baseName = activeDoc.title.replace(/\.[^/.]+$/, '');

      if (format === 'md') {
        downloadFile(`${baseName}.md`, activeDoc.content, 'text/markdown;charset=utf-8');
        showToast(`Exported ${baseName}.md`);
      } else if (format === 'txt') {
        downloadFile(`${baseName}.txt`, activeDoc.content, 'text/plain;charset=utf-8');
        showToast(`Exported ${baseName}.txt`);
      } else if (format === 'html') {
        const htmlContent = generateHTMLDocument(activeDoc.title, activeDoc.content);
        downloadFile(`${baseName}.html`, htmlContent, 'text/html;charset=utf-8');
        showToast(`Exported ${baseName}.html`);
      }
    },
    [activeDoc, showToast]
  );

  // Copy raw content
  const handleCopyContent = useCallback(() => {
    if (!activeDoc) return;
    navigator.clipboard.writeText(activeDoc.content);
    showToast('Copied document content to clipboard');
  }, [activeDoc, showToast]);

  // Import local file
  const handleImportFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === 'string') {
          const newDoc: DocumentItem = {
            id: `doc-${Date.now()}`,
            title: file.name,
            content,
            language: detectLanguageFromTitle(file.name),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          setDocuments((prev) => [...prev, newDoc]);
          setActiveDocId(newDoc.id);
          showToast(`Imported ${file.name}`);
        }
      };
      reader.readAsText(file);
    },
    [showToast]
  );

  // Reset to default sample documents
  const handleResetDocuments = useCallback(() => {
    setDocuments(INITIAL_DOCUMENTS);
    setActiveDocId(INITIAL_DOCUMENTS[0].id);
    showToast('Reset to default sample documents');
  }, [showToast]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setSearchState((prev) => ({ ...prev, isOpen: !prev.isOpen }));
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 's') {
        e.preventDefault();
        showToast('All changes saved locally');
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        handleFormat('bold');
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handleFormat('italic');
      } else if (isCmdOrCtrl && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setViewMode((current) =>
          current === 'split' ? 'edit' : current === 'edit' ? 'preview' : 'split'
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFormat, showToast]);

  // Stats calculation
  const stats = calculateDocumentStats(activeDoc ? activeDoc.content : '');

  return (
    <div
      id="editor-app-root"
      className={`flex flex-col h-screen w-screen overflow-hidden ${
        theme === 'dark'
          ? 'bg-neutral-950 text-neutral-100'
          : theme === 'sepia'
          ? 'bg-[#f7f2e4] text-[#332616]'
          : 'bg-white text-neutral-900'
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="toast-notification"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full bg-blue-600 text-white text-xs font-medium shadow-lg animate-bounce"
        >
          {toastMessage}
        </div>
      )}

      {/* Main Header */}
      <Header
        viewMode={viewMode}
        onSetViewMode={setViewMode}
        theme={theme}
        onSetTheme={setTheme}
        onToggleSearch={() => setSearchState((prev) => ({ ...prev, isOpen: !prev.isOpen }))}
        isSearchOpen={searchState.isOpen}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExport={handleExport}
        onCopyContent={handleCopyContent}
        onImportFile={handleImportFile}
        activeDocTitle={activeDoc ? activeDoc.title : 'No Document'}
      />

      {/* Document Tabs */}
      <TabBar
        documents={documents}
        activeDocId={activeDocId}
        onSelectDoc={setActiveDocId}
        onCloseDoc={handleCloseDoc}
        onNewDoc={handleNewDoc}
        onRenameDoc={handleRenameDoc}
        theme={theme}
      />

      {/* Search and Replace Bar */}
      <SearchBar
        searchState={searchState}
        onUpdateSearch={(updates) => setSearchState((prev) => ({ ...prev, ...updates }))}
        onFindNext={handleFindNext}
        onFindPrev={handleFindPrev}
        onReplaceCurrent={handleReplaceCurrent}
        onReplaceAll={handleReplaceAll}
        onClose={() => setSearchState((prev) => ({ ...prev, isOpen: false }))}
        theme={theme}
      />

      {/* Formatting Toolbar (shown when editing is possible) */}
      {viewMode !== 'preview' && (
        <Toolbar
          onFormat={handleFormat}
          theme={theme}
          disabled={!activeDoc}
        />
      )}

      {/* Main Workspace Area (Editor + Preview Split) */}
      <main id="editor-workspace-area" className="flex flex-1 overflow-hidden relative">
        {/* Editor Pane */}
        {viewMode !== 'preview' && (
          <div
            id="editor-wrapper-pane"
            className={`flex-1 h-full overflow-hidden flex flex-col ${
              viewMode === 'split' ? 'border-r border-inherit/20' : ''
            }`}
          >
            <EditorPane
              ref={editorRef}
              value={activeDoc ? activeDoc.content : ''}
              onChange={handleContentChange}
              onSelectionChange={(start, end, line, col) => {
                setCursorPos({
                  start,
                  end,
                  line,
                  col,
                  selectedChars: Math.abs(end - start),
                });
              }}
              settings={settings}
              theme={theme}
            />
          </div>
        )}

        {/* Live Preview Pane */}
        {viewMode !== 'edit' && (
          <div id="preview-wrapper-pane" className="flex-1 h-full overflow-hidden flex flex-col">
            <PreviewPane
              ref={previewRef}
              content={activeDoc ? activeDoc.content : ''}
              theme={theme}
              settings={settings}
              title={activeDoc ? activeDoc.title : 'Preview'}
            />
          </div>
        )}
      </main>

      {/* Status Bar */}
      <StatusBar
        stats={stats}
        cursorPos={cursorPos}
        language={activeDoc ? activeDoc.language : 'plaintext'}
        theme={theme}
        lastSavedAt={lastSavedAt}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(updates) => setSettings((prev) => ({ ...prev, ...updates }))}
        onResetDocuments={handleResetDocuments}
        theme={theme}
      />
    </div>
  );
};
