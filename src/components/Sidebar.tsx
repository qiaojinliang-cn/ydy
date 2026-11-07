import { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '../context';
import { BrandMark, Icon } from '../ui';
import type { Page } from '../types';

interface Row { page: Page; label: string; icon: string }
const PRIMARY: Row[] = [
  { page: 'library', label: 'Library', icon: 'library' },
  { page: 'discover', label: 'Discover', icon: 'telescope' },
  { page: 'chat', label: 'Chat', icon: 'chat' },
  { page: 'boards', label: 'Boards', icon: 'board' },
];
const CREATE: Row[] = [
  { page: 'strategy', label: 'Strategy', icon: 'fingerprint' },
  { page: 'planner', label: 'Planner', icon: 'calendar' },
  { page: 'publish', label: 'Publish', icon: 'globe' },
  { page: 'custom-ai', label: 'Custom AI', icon: 'sparkles' },
  { page: 'store', label: 'Your store', icon: 'store' },
];
const WORKSPACE: Row[] = [
  { page: 'analytics', label: 'Analytics', icon: 'grid' },
  { page: 'trash', label: 'Trash', icon: 'trash' },
];

export function Sidebar({ page, onNavigate, onCommand, onNew }: { page: Page; onNavigate: (page: Page, boardId?: string) => void; onCommand: () => void; onNew: () => void }) {
  const { state, dispatch, toast, openInPane } = useWorkspace();
  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (event: MouseEvent) => { if (!menuRef.current?.contains(event.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);
  const row = (entry: Row) => <button key={entry.page} className={`nav-row ${page === entry.page ? 'nav-active' : ''}`} aria-current={page === entry.page ? 'page' : undefined} onClick={() => onNavigate(entry.page)} title={entry.label}>
    <span className="nav-icon"><Icon name={entry.icon} size={19} /></span><span className="nav-label">{entry.label}</span>
  </button>;
  return <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`} aria-label="Workspace navigation">
    <div className="sidebar-top">
      <button className="brand-chip" onClick={() => setMenu(current => !current)} aria-expanded={menu} aria-label="Workspace menu"><BrandMark size={22} /><span className="nav-label">{state.settings.workspace}</span><Icon name="chevron" size={14} /></button>
      {menu && <div className="sidebar-menu" ref={menuRef} role="menu">
        <p className="muted menu-label">{state.settings.name}</p>
        <button role="menuitem" onClick={() => { setMenu(false); onNavigate('settings'); }}><Icon name="settings" size={16} />Workspace settings</button>
        <button role="menuitem" onClick={() => { setMenu(false); onNavigate('trash'); }}><Icon name="trash" size={16} />Trash</button>
        <button role="menuitem" onClick={() => { const next = state.settings.theme === 'light' ? 'dark' : 'light'; dispatch({ type: 'settings', patch: { theme: next } }); setMenu(false); toast(`${next === 'dark' ? 'Charcoal' : 'Paper'} theme`); }}><Icon name="bulb" size={16} />Switch to {state.settings.theme === 'light' ? 'dark' : 'light'} theme</button>
      </div>}
    </div>
    <button className="nav-row nav-new" onClick={onNew}><span className="nav-icon"><Icon name="plus" size={19} /></span><span className="nav-label">New</span><kbd className="nav-label nav-kbd">N</kbd></button>
    <nav className="nav-group" aria-label="Main">{PRIMARY.map(row)}</nav>
    <p className="nav-section-label">Create</p>
    <nav className="nav-group" aria-label="Create">{CREATE.map(row)}</nav>
    <p className="nav-section-label">Workspace</p>
    <nav className="nav-group" aria-label="Workspace">{WORKSPACE.map(row)}</nav>
    <div className="sidebar-recents"><p className="nav-section-label">Recent boards</p>{state.boards.slice(0, 3).map(board => <button key={board.id} className="nav-row" onClick={() => onNavigate('board', board.id)}><span className="nav-icon"><i className="board-dot" style={{ background: board.color }} /></span><span className="nav-label">{board.title}</span></button>)}</div>
    <div className="sidebar-footer">
      <button className="nav-row" onClick={onCommand}><span className="nav-icon"><Icon name="search" size={19} /></span><span className="nav-label">Search</span><kbd className="nav-label nav-kbd">⌘K</kbd></button>
      <button className="nav-row" onClick={() => { const first = state.items.find(entry => !entry.trashed); if (first) openInPane(first); }}><span className="nav-icon"><Icon name="panel" size={19} /></span><span className="nav-label">Open in Pane</span><kbd className="nav-label nav-kbd">⇥</kbd></button>
      <button className="nav-row" onClick={() => setCollapsed(!collapsed)} aria-pressed={collapsed}><span className="nav-icon"><Icon name="panel" size={19} /></span><span className="nav-label">{collapsed ? 'Expand' : 'Collapse'}</span></button>
      <div className="profile-row"><span className="profile-avatar">{state.settings.name.slice(0, 1).toUpperCase()}</span><div className="nav-label"><strong>{state.settings.name}</strong><small>Local workspace</small></div></div>
    </div>
  </aside>;
}
