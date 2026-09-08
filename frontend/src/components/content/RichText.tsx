import type { ReactNode } from 'react';

export function safeContentHref(value: string): boolean {
  if (/[\s\\]/.test(value)) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try { const url=new URL(value);return url.protocol==='https:' && !url.username && !url.password; } catch { return false; }
}

function inline(text: string): ReactNode[] {
  return text.split(/(\[[^\]\n]+\]\([^\s)]+\))/g).map((part,index)=>{
    const link=part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    return link && safeContentHref(link[2]) ? <a key={index} href={link[2]} className="font-medium text-primary underline underline-offset-2">{link[1]}</a> : part;
  });
}

/** A small text format: H2/H3, lists and safe links. HTML is always escaped by React. */
export function RichText({ content }: { content: string }) {
  return <div className="space-y-5 leading-8 text-slate-700">{content.split(/\n{2,}/).filter(Boolean).map((block,index)=>{
    if (block.startsWith('### ')) return <h3 key={index} className="text-xl font-bold">{inline(block.slice(4))}</h3>;
    if (block.startsWith('## ')) return <h2 key={index} className="text-2xl font-bold">{inline(block.slice(3))}</h2>;
    const lines=block.split('\n');
    if (lines.every(line=>line.startsWith('- '))) return <ul key={index} className="list-disc space-y-2 ps-6">{lines.map((line,i)=><li key={i}>{inline(line.slice(2))}</li>)}</ul>;
    if (lines.every(line=>/^\d+\. /.test(line))) return <ol key={index} className="list-decimal space-y-2 ps-6">{lines.map((line,i)=><li key={i}>{inline(line.replace(/^\d+\. /,''))}</li>)}</ol>;
    return <p key={index} className="whitespace-pre-line">{inline(block)}</p>;
  })}</div>;
}
