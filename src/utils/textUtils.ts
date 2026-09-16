import { DocumentStats, LanguageType } from '../types';

export function calculateDocumentStats(text: string): DocumentStats {
  if (!text) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      lines: 1,
      readingTimeMinutes: 0,
    };
  }

  const lines = text.split('\n').length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s+/g, '').length;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 200));

  return {
    words,
    characters,
    charactersNoSpaces,
    lines,
    readingTimeMinutes: words === 0 ? 0 : readingTimeMinutes,
  };
}

export function detectLanguageFromTitle(title: string): LanguageType {
  const ext = title.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'js':
    case 'jsx':
    case 'mjs':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'html':
    case 'htm':
      return 'html';
    case 'json':
      return 'json';
    default:
      return 'plaintext';
  }
}

export interface FormatResult {
  newText: string;
  newSelectionStart: number;
  newSelectionEnd: number;
}

export function applyFormatting(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  action: string
): FormatResult {
  const selectedText = text.substring(selectionStart, selectionEnd);
  let before = text.substring(0, selectionStart);
  let after = text.substring(selectionEnd);
  let replacement = '';
  let cursorOffsetStart = 0;
  let cursorOffsetEnd = 0;

  switch (action) {
    case 'bold': {
      replacement = `**${selectedText || 'bold text'}**`;
      cursorOffsetStart = selectedText ? selectionStart : selectionStart + 2;
      cursorOffsetEnd = selectedText ? selectionStart + replacement.length : selectionStart + replacement.length - 2;
      break;
    }
    case 'italic': {
      replacement = `*${selectedText || 'italic text'}*`;
      cursorOffsetStart = selectedText ? selectionStart : selectionStart + 1;
      cursorOffsetEnd = selectedText ? selectionStart + replacement.length : selectionStart + replacement.length - 1;
      break;
    }
    case 'strike': {
      replacement = `~~${selectedText || 'strikethrough'}~~`;
      cursorOffsetStart = selectedText ? selectionStart : selectionStart + 2;
      cursorOffsetEnd = selectedText ? selectionStart + replacement.length : selectionStart + replacement.length - 2;
      break;
    }
    case 'h1': {
      // If beginning of line, add # 
      const lineStart = before.lastIndexOf('\n') + 1;
      before = text.substring(0, lineStart);
      const restOfLine = text.substring(lineStart, selectionEnd);
      replacement = `# ${restOfLine || 'Heading 1'}`;
      cursorOffsetStart = lineStart + replacement.length;
      cursorOffsetEnd = cursorOffsetStart;
      break;
    }
    case 'h2': {
      const lineStart = before.lastIndexOf('\n') + 1;
      before = text.substring(0, lineStart);
      const restOfLine = text.substring(lineStart, selectionEnd);
      replacement = `## ${restOfLine || 'Heading 2'}`;
      cursorOffsetStart = lineStart + replacement.length;
      cursorOffsetEnd = cursorOffsetStart;
      break;
    }
    case 'h3': {
      const lineStart = before.lastIndexOf('\n') + 1;
      before = text.substring(0, lineStart);
      const restOfLine = text.substring(lineStart, selectionEnd);
      replacement = `### ${restOfLine || 'Heading 3'}`;
      cursorOffsetStart = lineStart + replacement.length;
      cursorOffsetEnd = cursorOffsetStart;
      break;
    }
    case 'quote': {
      const lineStart = before.lastIndexOf('\n') + 1;
      before = text.substring(0, lineStart);
      const restOfLine = text.substring(lineStart, selectionEnd);
      replacement = `> ${restOfLine || 'Quote text'}`;
      cursorOffsetStart = lineStart + replacement.length;
      cursorOffsetEnd = cursorOffsetStart;
      break;
    }
    case 'code': {
      if (selectedText.includes('\n') || !selectedText) {
        replacement = `\`\`\`javascript\n${selectedText || '// Code here'}\n\`\`\``;
        cursorOffsetStart = selectionStart + 13;
        cursorOffsetEnd = cursorOffsetStart + (selectedText ? selectedText.length : 11);
      } else {
        replacement = `\`${selectedText}\``;
        cursorOffsetStart = selectionStart + 1;
        cursorOffsetEnd = cursorOffsetStart + selectedText.length;
      }
      break;
    }
    case 'ul': {
      const lines = (selectedText || 'List item').split('\n');
      replacement = lines.map(line => `- ${line.replace(/^[-*•]\s+/, '')}`).join('\n');
      cursorOffsetStart = selectionStart;
      cursorOffsetEnd = selectionStart + replacement.length;
      break;
    }
    case 'ol': {
      const lines = (selectedText || 'List item').split('\n');
      replacement = lines.map((line, i) => `${i + 1}. ${line.replace(/^\d+\.\s+/, '')}`).join('\n');
      cursorOffsetStart = selectionStart;
      cursorOffsetEnd = selectionStart + replacement.length;
      break;
    }
    case 'task': {
      const lines = (selectedText || 'Task item').split('\n');
      replacement = lines.map(line => `- [ ] ${line.replace(/^-\s\[[ x]\]\s+/, '')}`).join('\n');
      cursorOffsetStart = selectionStart;
      cursorOffsetEnd = selectionStart + replacement.length;
      break;
    }
    case 'link': {
      replacement = `[${selectedText || 'Link text'}](https://example.com)`;
      cursorOffsetStart = selectedText ? selectionStart + selectedText.length + 3 : selectionStart + 1;
      cursorOffsetEnd = selectedText ? selectionStart + replacement.length - 1 : selectionStart + 10;
      break;
    }
    case 'table': {
      replacement = `\n| Column 1 | Column 2 | Column 3 |\n| :--- | :--- | :--- |\n| Item 1 | Item 2 | Item 3 |\n| Item 4 | Item 5 | Item 6 |\n`;
      cursorOffsetStart = selectionStart + replacement.length;
      cursorOffsetEnd = cursorOffsetStart;
      break;
    }
    case 'hr': {
      replacement = `\n---\n`;
      cursorOffsetStart = selectionStart + replacement.length;
      cursorOffsetEnd = cursorOffsetStart;
      break;
    }
    default:
      return {
        newText: text,
        newSelectionStart: selectionStart,
        newSelectionEnd: selectionEnd,
      };
  }

  const newText = before + replacement + after;
  return {
    newText,
    newSelectionStart: cursorOffsetStart,
    newSelectionEnd: cursorOffsetEnd,
  };
}

export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function generateHTMLDocument(title: string, markdownOrText: string): string {
  // Simple clean HTML wrapper for downloading rendered or styled views
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 40px auto;
      padding: 0 20px;
      color: #24292f;
      background-color: #ffffff;
    }
    pre {
      background-color: #f6f8fa;
      padding: 16px;
      border-radius: 6px;
      overflow: auto;
      font-family: 'Fira Code', Consolas, monospace;
      font-size: 14px;
    }
    code {
      background-color: rgba(175, 184, 193, 0.2);
      padding: 0.2em 0.4em;
      border-radius: 4px;
      font-size: 85%;
    }
    blockquote {
      padding: 0 1em;
      color: #57606a;
      border-left: 0.25em solid #d0d7de;
      margin: 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }
    th, td {
      border: 1px solid #d0d7de;
      padding: 6px 13px;
    }
    th {
      background-color: #f6f8fa;
    }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  <div style="white-space: pre-wrap;">${escapeHtml(markdownOrText)}</div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
