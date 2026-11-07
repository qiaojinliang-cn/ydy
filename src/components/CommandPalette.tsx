import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '../ui';
import type { Page } from '../types';

export interface Command { id: string; label: string; hint: string; run: () => void }

export function CommandPalette({ commands, close }: { commands: Command[]; close: () => void }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); }, []);
  const matches = useMemo(() => {
    const term = query.toLowerCase().trim();
    return commands.filter(command => !term || `${command.label} ${command.hint}`.toLowerCase().includes(term)).slice(0, 12);
  }, [commands, query]);
  const run = (command?: Command) => { if (!command) return; close(); command.run(); };
  return <div className="palette-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <div className="palette" role="dialog" aria-modal="true" aria-label="Search and commands">
      <div className="palette-input"><Icon name="search" size={18} /><input ref={input} value={query} placeholder="Search or jump to…" aria-label="Search or jump to" onChange={event => { setQuery(event.target.value); setIndex(0); }} onKeyDown={event => {
        if (event.key === 'ArrowDown') { event.preventDefault(); setIndex(current => Math.min(current + 1, matches.length - 1)); }
        if (event.key === 'ArrowUp') { event.preventDefault(); setIndex(current => Math.max(current - 1, 0)); }
        if (event.key === 'Enter') { event.preventDefault(); run(matches[index]); }
        if (event.key === 'Escape') { event.preventDefault(); close(); }
      }} /><kbd>esc</kbd></div>
      <div className="palette-list" role="listbox" aria-label="Matches">
        {matches.length ? matches.map((command, position) => <button key={command.id} role="option" aria-selected={position === index} className={`palette-row ${position === index ? 'palette-active' : ''}`} onMouseEnter={() => setIndex(position)} onClick={() => run(command)}><span>{command.label}</span><small>{command.hint}</small></button>) : <p className="palette-empty">Nothing matches “{query}”.</p>}
      </div>
      <footer className="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>↵</kbd> to open</span></footer>
    </div>
  </div>;
}

export function Toasts({ messages, dismiss }: { messages: { id: string; message: string }[]; dismiss: (id: string) => void }) {
  return <div className="toasts" role="status" aria-live="polite">{messages.map(entry => <div className="toast" key={entry.id}><Icon name="sparkles" size={15} /><span>{entry.message}</span><button className="icon-button" aria-label="Dismiss" onClick={() => dismiss(entry.id)}><Icon name="close" size={14} /></button></div>)}</div>;
}

export function pageCommands(navigate: (page: Page) => void, newItem: (kind: 'document' | 'card' | 'link' | 'table' | 'image') => void): Command[] {
  const pages: { page: Page; label: string }[] = [{ page: 'library', label: 'Library' }, { page: 'discover', label: 'Discover' }, { page: 'chat', label: 'Chat' }, { page: 'boards', label: 'Boards' }, { page: 'strategy', label: 'Strategy' }, { page: 'planner', label: 'Planner' }, { page: 'publish', label: 'Publish' }, { page: 'custom-ai', label: 'Custom AI' }, { page: 'analytics', label: 'Analytics' }, { page: 'store', label: 'Your store' }, { page: 'settings', label: 'Settings' }];
  return [
    ...pages.map(entry => ({ id: `go:${entry.page}`, label: `Go to ${entry.label}`, hint: 'Navigate', run: () => navigate(entry.page) })),
    { id: 'new:document', label: 'New document', hint: 'Create', run: () => newItem('document') },
    { id: 'new:card', label: 'New card', hint: 'Create', run: () => newItem('card') },
    { id: 'new:link', label: 'Save a link', hint: 'Create', run: () => newItem('link') },
  ];
}
