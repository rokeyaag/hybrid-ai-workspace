import type { ReactNode } from "react";

interface MarkdownViewProps {
  content: string;
}

function renderInline(text: string): ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={idx}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code key={idx} className="md-inline-code">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function MarkdownView({ content }: MarkdownViewProps) {
  const lines = content.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks
    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      blocks.push(
        <pre key={`code-${i}`} className="md-code-block">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      i += 1;
      continue;
    }

    // Bullet lists
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul key={`ul-${i}`} className="md-list">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered lists
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol key={`ol-${i}`} className="md-list">
          {items.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      blocks.push(
        <div key={`h-${i}`} className={`md-heading md-h${level}`}>
          {renderInline(text)}
        </div>
      );
      i += 1;
      continue;
    }

    // Blockquote
    if (line.trim().startsWith("> ")) {
      blocks.push(
        <blockquote key={`bq-${i}`} className="md-blockquote">
          {renderInline(line.trim().slice(2))}
        </blockquote>
      );
      i += 1;
      continue;
    }

    // Blank line
    if (!line.trim()) {
      i += 1;
      continue;
    }

    // Paragraph
    blocks.push(
      <p key={`p-${i}`} className="md-paragraph">
        {renderInline(line)}
      </p>
    );
    i += 1;
  }

  return <div className="md-content">{blocks}</div>;
}
