import type { ParsedDocument } from '@/types/document';
import type { ContentItem } from '@/types/builder';
import { randomUUID } from 'crypto';

export function parseDocumentToContentItems(doc: ParsedDocument): ContentItem[] {
  const items: ContentItem[] = [];

  // Process sections
  for (const section of doc.sections) {
    // Add header
    items.push({
      id: randomUUID(),
      type: 'header',
      level: section.level,
      text: section.title,
      isSelected: false,
    });

    // Split content into paragraphs and lists
    if (section.content) {
      const contentItems = parseContent(section.content);
      items.push(...contentItems);
    }
  }

  // Process tables
  for (const table of doc.tables) {
    const tableText = table.rows
      .map((row) => row.map((cell) => cell.content).join(' | '))
      .join('\n');
    
    items.push({
      id: randomUUID(),
      type: 'table',
      text: tableText,
      isSelected: false,
    });
  }

  return items;
}

function parseContent(content: string): ContentItem[] {
  const items: ContentItem[] = [];
  const lines = content.split('\n');
  
  let currentParagraph: string[] = [];
  let inList = false;
  let currentList: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        items.push({
          id: randomUUID(),
          type: 'paragraph',
          text,
          isSelected: false,
        });
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      items.push({
        id: randomUUID(),
        type: 'list',
        text: currentList.join('\n'),
        isSelected: false,
      });
      currentList = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Check if it's a list item
    if (/^[-•*]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed)) {
      flushParagraph();
      inList = true;
      currentList.push(trimmed);
    } else if (inList && /^\s+/.test(line)) {
      // Continuation of list item (indented)
      currentList[currentList.length - 1] += ' ' + trimmed;
    } else {
      // Regular paragraph text
      if (inList) {
        flushList();
        inList = false;
      }
      currentParagraph.push(trimmed);
    }
  }

  flushParagraph();
  flushList();

  return items;
}

// Client-safe version that doesn't use crypto
export function parseDocumentToContentItemsClient(doc: ParsedDocument): ContentItem[] {
  let idCounter = 0;
  const generateId = () => `content-${++idCounter}-${Date.now()}`;

  const items: ContentItem[] = [];

  for (const section of doc.sections) {
    items.push({
      id: generateId(),
      type: 'header',
      level: section.level,
      text: section.title,
      isSelected: false,
    });

    if (section.content) {
      const contentItems = parseContentClient(section.content, generateId);
      items.push(...contentItems);
    }
  }

  for (const table of doc.tables) {
    const tableText = table.rows
      .map((row) => row.map((cell) => cell.content).join(' | '))
      .join('\n');
    
    items.push({
      id: generateId(),
      type: 'table',
      text: tableText,
      isSelected: false,
    });
  }

  return items;
}

function parseContentClient(content: string, generateId: () => string): ContentItem[] {
  const items: ContentItem[] = [];
  const lines = content.split('\n');
  
  let currentParagraph: string[] = [];
  let inList = false;
  let currentList: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        items.push({
          id: generateId(),
          type: 'paragraph',
          text,
          isSelected: false,
        });
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      items.push({
        id: generateId(),
        type: 'list',
        text: currentList.join('\n'),
        isSelected: false,
      });
      currentList = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    if (/^[-•*]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed)) {
      flushParagraph();
      inList = true;
      currentList.push(trimmed);
    } else if (inList && /^\s+/.test(line)) {
      currentList[currentList.length - 1] += ' ' + trimmed;
    } else {
      if (inList) {
        flushList();
        inList = false;
      }
      currentParagraph.push(trimmed);
    }
  }

  flushParagraph();
  flushList();

  return items;
}
