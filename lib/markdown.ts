/** Minimal markdown -> HTML (server-side, no extra deps). Moved out of the
 *  learn/[slug] page so the route file only exports route exports. */

/* ---------- Minimal markdown -> HTML (server-side, no extra deps) ---------- */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMd(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, '<a href="$2">$1</a>');
  return out;
}

/** Supports: ##/### headings, fenced code, -/* bullets, 1. ordered lists, paragraphs. */
export function mdToHtml(md: string): string {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let paraBuf: string[] = [];

  function closePara() {
    if (paraBuf.length > 0) {
      html.push(`<p>${inlineMd(paraBuf.join(" "))}</p>`);
      paraBuf = [];
    }
  }
  function closeList() {
    if (listType) {
      html.push(listType === "ul" ? "</ul>" : "</ol>");
      listType = null;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
        codeBuf = [];
        inCode = false;
      } else {
        closePara();
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }
    if (trimmed === "") {
      closePara();
      closeList();
      continue;
    }
    const h3 = trimmed.match(/^###\s+(.*)/);
    const h2 = trimmed.match(/^##\s+(.*)/);
    if (h3 || h2) {
      closePara();
      closeList();
      const [tag, text] = h3 ? ["h3", h3[1]] : ["h2", h2![1]];
      html.push(`<${tag}>${inlineMd(text)}</${tag}>`);
      continue;
    }
    const bullet = trimmed.match(/^[-*]\s+(.*)/);
    if (bullet) {
      closePara();
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${inlineMd(bullet[1])}</li>`);
      continue;
    }
    const ordered = trimmed.match(/^\d+\.\s+(.*)/);
    if (ordered) {
      closePara();
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${inlineMd(ordered[1])}</li>`);
      continue;
    }
    closeList();
    paraBuf.push(trimmed);
  }
  closePara();
  closeList();
  return html.join("\n");
}
