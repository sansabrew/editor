export type LanguageType = 'markdown' | 'javascript' | 'typescript' | 'html' | 'json' | 'plaintext';

export type EditorViewMode = 'split' | 'edit' | 'preview';

export type EditorTheme = 'dark' | 'light' | 'sepia';

export type FontFamily = 'mono' | 'sans' | 'serif';

export interface DocumentItem {
  id: string;
  title: string;
  content: string;
  language: LanguageType;
  createdAt: number;
  updatedAt: number;
}

export interface EditorSettings {
  fontSize: number;
  lineNumbers: boolean;
  wordWrap: boolean;
  fontFamily: FontFamily;
  tabSize: number;
  spellCheck: boolean;
}

export interface SearchState {
  isOpen: boolean;
  query: string;
  replaceText: string;
  matchCase: boolean;
  currentIndex: number;
  matchesCount: number;
}

export interface DocumentStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  lines: number;
  readingTimeMinutes: number;
}
