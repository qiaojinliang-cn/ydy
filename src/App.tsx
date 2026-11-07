import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { WorkspaceContext } from './context';
import { workspaceReducer, parseWorkspace } from './state';
import { initialState } from './seed';
import { ItemDialog } from './ItemDialog';
import { Boards, Library } from './Library';
import { Sidebar } from './components/Sidebar';
import { CommandPalette, Toasts, pageCommands, type Command } from './components/CommandPalette';
import { ItemPane } from './components/Pane';
import { Icon } from './ui';
import { DiscoverPage } from './pages/DiscoverPage';
import { StrategyPage } from './pages/StrategyPage';
import { PlannerPage } from './pages/PlannerPage';
import { PublishPage } from './pages/PublishPage';
import { ChatPage } from './pages/ChatPage';
import { CustomAIPage } from './pages/CustomAIPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { StorePage } from './pages/StorePage';
import { SettingsPage } from './pages/SettingsPage';
import type { Item, ItemKind, Page } from './types';

const STORAGE_KEY = 'ydy:workspace:v1';
const PAGES: Page[] = ['library', 'boards', 'board', 'discover', 'strategy', 'planner', 'publish', 'chat', 'custom-ai', 'analytics', 'store', 'settings', 'trash'];

function readRoute(): { page: Page; boardId?: string } {
  const [page, boardId] = window.location.hash.replace(/^#\/?/, '').split('/');
  return { page: PAGES.includes(page as Page) ? page as Page : 'library', boardId: boardId || undefined };
}
function writeRoute(page: Page, boardId?: string): void {
  const next = boardId ? `#/${page}/${boardId}` : `#/${page}`;
  if (window.location.hash !== next) window.history.pushState(null, '', next);
}

export function App() {
  const [state, dispatch] = useReducer(workspaceReducer, undefined, () => {
    try { return parseWorkspace(window.localStorage.getItem(STORAGE_KEY), initialState); } catch { return initialState; }
  });
  const [route, setRoute] = useState(readRoute);
  const [dialog, setDialog] = useState<{ item?: Item; kind?: ItemKind } | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);
  const [palette, setPalette] = useState(false);
  const [pane, setPane] = useState<Item | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* quota or private mode: the workspace stays in memory */ } }, 250);
    return () => window.clearTimeout(timer);
  }, [state]);
  useEffect(() => {
    const sync = () => setRoute(readRoute());
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => { window.removeEventListener('popstate', sync); window.removeEventListener('hashchange', sync); };
  }, []);
  useEffect(() => { document.documentElement.dataset.theme = state.settings.theme; }, [state.settings.theme]);
  useEffect(() => () => { timers.current.forEach(window.clearTimeout); }, []);

  const toast = useCallback((message: string) => {
    const id = crypto.randomUUID();
    setToasts(current => [...current.slice(-2), { id, message }]);
    timers.current.push(window.setTimeout(() => setToasts(current => current.filter(entry => entry.id !== id)), 3200));
  }, []);
  const navigate = useCallback((page: Page, boardId?: string) => { setRoute({ page, boardId }); writeRoute(page, boardId); setNavOpen(false); }, []);
  const openItem = useCallback((item: Item) => setDialog({ item }), []);
  const openInPane = useCallback((item: Item) => setPane(item), []);
  const newItem = useCallback((kind: ItemKind) => setDialog({ kind }), []);
  const commands = useMemo<Command[]>(() => pageCommands(navigate, kind => newItem(kind)), [navigate, newItem]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target ? ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) : false;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setPalette(current => !current); return; }
      if (event.key === 'Escape') setPalette(false);
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.toLowerCase() === 'n') { event.preventDefault(); newItem('card'); }
      if (event.key === '/') { event.preventDefault(); setPalette(true); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [newItem]);

  const value = useMemo(() => ({ state, dispatch, navigate, toast, openItem, openInPane, newItem }), [state, navigate, toast, openItem, openInPane, newItem]);
  const screen = (() => {
    switch (route.page) {
      case 'boards': return <Boards />;
      case 'board': return <Library boardId={route.boardId} />;
      case 'trash': return <Library trashed />;
      case 'discover': return <DiscoverPage />;
      case 'strategy': return <StrategyPage />;
      case 'planner': return <PlannerPage />;
      case 'publish': return <PublishPage />;
      case 'chat': return <ChatPage />;
      case 'custom-ai': return <CustomAIPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'store': return <StorePage />;
      case 'settings': return <SettingsPage />;
      default: return <Library />;
    }
  })();
  return <WorkspaceContext.Provider value={value}>
    <div className={`app-shell ${pane ? 'with-pane' : ''} ${navOpen ? 'nav-open' : ''}`}>
      <button className="mobile-nav-toggle" aria-label="Open navigation" aria-expanded={navOpen} onClick={() => setNavOpen(value => !value)}><Icon name="menu" size={19} /></button>
      {navOpen && <div className="nav-scrim" onClick={() => setNavOpen(false)} />}
      <Sidebar page={route.page} onNavigate={navigate} onCommand={() => setPalette(true)} onNew={() => newItem('card')} />
      <main className="app-main" id="main">{screen}</main>
      {pane && <ItemPane item={pane} close={() => setPane(null)} />}
    </div>
    {dialog && <ItemDialog item={dialog.item} kind={dialog.kind} close={() => setDialog(null)} />}
    {palette && <CommandPalette commands={commands} close={() => setPalette(false)} />}
    <Toasts messages={toasts} dismiss={id => setToasts(current => current.filter(entry => entry.id !== id))} />
  </WorkspaceContext.Provider>;
}
