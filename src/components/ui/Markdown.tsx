import { memo } from 'react';

interface MarkdownProps {
  content: string;
}

interface ParsedBlock {
  type: 'heading' | 'table' | 'list' | 'blockquote' | 'paragraph' | 'code';
  level?: number;
  lines: string[];
  ordered?: boolean;
}

function parseBlocks(text: string): ParsedBlock[] {
  const lines = text.split('\n');
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      blocks.push({ type: 'code', lines: codeLines });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)/);
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, lines: [headingMatch[2]] });
      i++;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      blocks.push({ type: 'blockquote', lines: quoteLines });
      continue;
    }

    if (trimmed.startsWith('|') && i + 1 < lines.length && lines[i + 1].trim().startsWith('|') && lines[i + 1].includes('-')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      blocks.push({ type: 'table', lines: tableLines });
      continue;
    }

    if (trimmed.match(/^[-*]\s+/)) {
      let ordered = false;
      const listLines: string[] = [];
      while (i < lines.length) {
        const lt = lines[i].trim();
        if (lt.match(/^[-*]\s+/)) {
          listLines.push(lt.replace(/^[-*]\s+/, ''));
          i++;
        } else if (lt.match(/^\d+\.\s+/)) {
          ordered = true;
          listLines.push(lt.replace(/^\d+\.\s+/, ''));
          i++;
        } else if (lt === '') {
          if (i + 1 < lines.length && lines[i + 1].trim().match(/^[-*]\s+|^\d+\.\s+/)) {
            i++;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      blocks.push({ type: 'list', lines: listLines, ordered });
      continue;
    }

    if (trimmed.match(/^\d+\.\s+/)) {
      const listLines: string[] = [];
      const ordered = true;
      while (i < lines.length) {
        const lt = lines[i].trim();
        if (lt.match(/^\d+\.\s+/)) {
          listLines.push(lt.replace(/^\d+\.\s+/, ''));
          i++;
        } else if (lt.match(/^[-*]\s+/)) {
          listLines.push(lt.replace(/^[-*]\s+/, ''));
          i++;
        } else if (lt === '') {
          if (i + 1 < lines.length && lines[i + 1].trim().match(/^[-*]\s+|^\d+\.\s+/)) {
            i++;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      blocks.push({ type: 'list', lines: listLines, ordered });
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].trim().startsWith('#') && !lines[i].trim().startsWith('|') && !lines[i].trim().startsWith('> ') && !lines[i].trim().match(/^[-*]\s+/) && !lines[i].trim().match(/^\d+\.\s+/) && !lines[i].trim().startsWith('```')) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'paragraph', lines: paraLines });
  }

  return blocks;
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/\*(.+?)\*/);
    const codeMatch = remaining.match(/`(.+?)`/);

    const matches = [
      boldMatch ? { type: 'bold', match: boldMatch, priority: 0 } : null,
      italicMatch ? { type: 'italic', match: italicMatch, priority: 1 } : null,
      codeMatch ? { type: 'code', match: codeMatch, priority: 2 } : null,
    ].filter(Boolean) as { type: string; match: RegExpMatchArray; priority: number }[];

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    matches.sort((a, b) => (a.match.index ?? 0) - (b.match.index ?? 0));
    const first = matches[0];
    const idx = first.match.index ?? 0;

    if (idx > 0) {
      parts.push(remaining.slice(0, idx));
    }

    if (first.type === 'bold') {
      parts.push(<strong key={key++} className="font-bold text-ink-100">{first.match[1]}</strong>);
    } else if (first.type === 'italic') {
      parts.push(<em key={key++} className="italic text-ink-200">{first.match[1]}</em>);
    } else if (first.type === 'code') {
      parts.push(<code key={key++} className="px-1.5 py-0.5 rounded bg-ink-900/60 text-frost-300 text-xs font-mono">{first.match[1]}</code>);
    }

    remaining = remaining.slice(idx + first.match[0].length);
  }

  return <>{parts.map((p, i) => <span key={i}>{p}</span>)}</>;
}

function MarkdownImpl({ content }: MarkdownProps) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-2.5">
      {blocks.map((block, bi) => {
        if (block.type === 'heading') {
          const sizes: Record<number, string> = {
            1: 'text-lg font-bold text-ink-100 mt-1',
            2: 'text-base font-bold text-ink-100 mt-1',
            3: 'text-sm font-bold text-ink-200',
            4: 'text-xs font-bold text-ink-300 uppercase tracking-wider',
          };
          return <div key={bi} className={sizes[block.level ?? 2]}>{renderInline(block.lines[0])}</div>;
        }

        if (block.type === 'code') {
          return (
            <pre key={bi} className="bg-ink-900/60 border border-white/5 rounded-xl p-3 overflow-x-auto scrollbar-thin">
              <code className="text-xs font-mono text-frost-300 leading-relaxed">{block.lines.join('\n')}</code>
            </pre>
          );
        }

        if (block.type === 'blockquote') {
          return (
            <blockquote key={bi} className="border-l-2 border-shadow-500/40 pl-3 py-1 bg-shadow-500/5 rounded-r-lg">
              <div className="text-sm text-ink-300 italic">{renderInline(block.lines.join(' '))}</div>
            </blockquote>
          );
        }

        if (block.type === 'table') {
          const rows = block.lines.filter((l) => !l.match(/^\|[\s-:|]+\|$/));
          if (rows.length < 1) return null;
          const headers = rows[0].split('|').map((c) => c.trim()).filter(Boolean);
          const bodyRows = rows.slice(1).map((r) => r.split('|').map((c) => c.trim()).filter(Boolean));

          return (
            <div key={bi} className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    {headers.map((h, hi) => (
                      <th key={hi} className="text-left py-2 px-3 font-bold text-ink-200 whitespace-nowrap">{renderInline(h)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bodyRows.map((row, ri) => (
                    <tr key={ri} className="border-b border-white/5">
                      {row.map((cell, ci) => (
                        <td key={ci} className="py-1.5 px-3 text-ink-300 whitespace-nowrap">{renderInline(cell)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (block.type === 'list') {
          if (block.ordered) {
            return (
              <ol key={bi} className="space-y-1.5 ml-1">
                {block.lines.map((line, li) => (
                  <li key={li} className="flex gap-2.5 text-sm text-ink-200 leading-relaxed">
                    <span className="flex-shrink-0 w-5 h-5 rounded-md bg-shadow-500/15 text-shadow-400 text-xs font-bold flex items-center justify-center mt-0.5">{li + 1}</span>
                    <span>{renderInline(line)}</span>
                  </li>
                ))}
              </ol>
            );
          }
          return (
            <ul key={bi} className="space-y-1.5 ml-1">
              {block.lines.map((line, li) => (
                <li key={li} className="flex gap-2.5 text-sm text-ink-200 leading-relaxed">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-shadow-400 mt-2" />
                  <span>{renderInline(line)}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={bi} className="text-sm text-ink-200 leading-relaxed">
            {renderInline(block.lines.join(' '))}
          </p>
        );
      })}
    </div>
  );
}

export const Markdown = memo(MarkdownImpl);
