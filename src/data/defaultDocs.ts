import { DocumentItem } from '../types';

export const INITIAL_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-readme',
    title: 'README.md',
    language: 'markdown',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now(),
    content: `# Welcome to Editor

A distraction-free, modern editor built for writing notes, drafting specifications, and crafting code.

---

## ✨ Core Features

- **Split View & Live Preview**: Real-time rendering of your Markdown alongside the raw source.
- **Smart Formatting Toolbar**: Quick actions for bold, italics, headings, code blocks, lists, and tables.
- **Multi-Document Tabs**: Organize your thoughts across multiple documents with automatic local saving.
- **Search & Replace**: Fast search with case sensitivity and batch replacement.
- **Statistics & Readability**: Real-time word, character, and estimated reading time counts.
- **Export & Import**: Download your work as \`.md\`, \`.txt\`, or rendered \`.html\`, or import local files.

---

## 📝 Markdown Cheatsheet

### Typography & Emphasis
You can use **bold text**, *italic text*, and ~~strikethrough~~ effortlessly.

### Task Checklist
- [x] Create project repository
- [x] Launch distraction-free editor
- [ ] Draft upcoming release notes
- [ ] Export final document

### Code Example
\`\`\`javascript
function calculateReadingTime(text) {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\\s+/).filter(Boolean).length;
  return Math.ceil(words / wordsPerMinute);
}
\`\`\`

> *"Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away."*
> — Antoine de Saint-Exupéry

### Table Example

| Feature | Support | Status |
| :--- | :--- | :--- |
| Live Split Preview | Yes | Active |
| Multi-Tab Switcher | Yes | Active |
| Local Persistence | Yes | Ready |

Enjoy creating with **Editor**!
`
  },
  {
    id: 'doc-notes',
    title: 'Product Roadmap.md',
    language: 'markdown',
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
    updatedAt: Date.now() - 1000 * 60 * 10,
    content: `# Product Roadmap & Milestones

## Q3 Goals
- [x] Streamlined text editor interface with responsive split view
- [x] Document tab switching with persistent state
- [ ] Cloud sync integration
- [ ] Plugin architecture for custom linters

### Brainstorming Ideas
1. **Focus Mode**: Hide all navigation and toolbars when typing.
2. **Custom Themes**: Allow customizing accent colors, background tones, and typography scale.
3. **Table Generator**: Visual modal to insert arbitrary sized Markdown tables.
`
  },
  {
    id: 'doc-script',
    title: 'utils.js',
    language: 'javascript',
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
    updatedAt: Date.now() - 1000 * 60 * 2,
    content: `// Utility functions for text processing

export function slugify(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\\w\\s-]/g, '')
    .replace(/[\\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\\s+/).filter(Boolean).length;
}

export function formatTimestamp(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(date);
}
`
  }
];
