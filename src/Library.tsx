import { useMemo, useState } from 'react';
import { useWorkspace } from './context';
import { filterItems } from './state';
import { BrandMark, Dialog, EmptyState, Icon } from './ui';
import type { Item, ItemKind } from './types';

export function ItemCard({ item, compact = false }: { item: Item; compact?: boolean }) {
  const { openItem, openInPane, dispatch, toast } = useWorkspace();
  return <article className={`item-wrap kind-${item.kind}`}>
    <div className={`item-card ${compact ? 'compact' : ''}`}>
      <button className="card-open" onClick={() => openItem(item)} aria-label={`Open ${item.title}`}>
        {item.image ? <div className={`card-media ${item.platform === 'Instagram' ? 'portrait' : ''}`}><img src={item.image} alt={item.title} loading="lazy" />{item.duration && <span className="duration">{item.duration}</span>}{item.kind === 'video' && <span className="play-icon">▶</span>}</div> : null}
        <div className="card-body">
          {!item.image && <div className="card-kind"><Icon name={item.kind} size={15} /><span>{item.kind === 'document' ? 'Document' : item.kind === 'table' ? 'Table' : 'A little thought'}</span></div>}
          <h3>{item.title}</h3>
          {!item.image && <p className="card-excerpt">{item.content}</p>}
          {item.author && <div className="card-author">{item.avatar ? <img src={item.avatar} alt="" /> : <span className="avatar-letter">{item.author[0]}</span>}<span>{item.author}<small>{item.platform ?? 'Saved thought'}</small></span></div>}
          {item.views && <div className="card-metrics"><span>{item.views} views</span><span className="outlier">{item.outlier}</span><Icon name={item.platform === 'YouTube' ? 'video' : 'image'} size={15} /></div>}
        </div>
      </button>
      <button className="card-pane icon-button" aria-label={`Open ${item.title} in pane`} onClick={() => openInPane(item)}><Icon name="panel" size={15} /></button>
      <button className={`card-save icon-button ${item.starred ? 'is-starred' : ''}`} aria-label={item.starred ? `Unsave ${item.title}` : `Favorite ${item.title}`} onClick={() => { dispatch({ type: 'update-item', id: item.id, patch: { starred: !item.starred } }); toast(item.starred ? 'Removed from favorites' : 'Added to favorites'); }}><Icon name="bookmark" size={17} /></button>
    </div>
    <div className="item-meta"><span>{item.boardId ? 'Board' : 'Library'}</span><i>·</i><span>{item.tags[0] ?? 'Just added'}</span>{item.note && <Icon name="chat" size={12} />}</div>
  </article>;
}
export function NewMenu({ close }: { close: () => void }) {
  const { newItem } = useWorkspace();
  const options: { kind: ItemKind; title: string; description: string }[] = [
    { kind: 'document', title: 'Create a document', description: 'A little room to think and write' },
    { kind: 'card', title: 'Create a card', description: 'Capture a thought, quote, or idea' },
    { kind: 'link', title: 'Save a link', description: 'Keep something from the internet' },
    { kind: 'table', title: 'Create a table', description: 'Give your ideas a little structure' },
    { kind: 'image', title: 'Upload a file', description: 'Images, screenshots, and inspiration' }
  ];
  return <div className="new-menu" role="menu">{options.map(option => <button key={option.kind} role="menuitem" onClick={() => { close(); newItem(option.kind); }}><Icon name={option.kind} size={19} /><span>{option.title}<small>{option.description}</small></span></button>)}</div>;
}
export function Library({ boardId, trashed = false }: { boardId?: string; trashed?: boolean }) {
  const { state, newItem, openItem, dispatch, toast } = useWorkspace();
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState('all');
  const [view, setView] = useState('grid'); const [newOpen, setNewOpen] = useState(false);
  const [topic, setTopic] = useState(''); const [sort, setSort] = useState('recent');
  const board = state.boards.find(candidate => candidate.id === boardId);
  const allItems = filterItems(state, query, filter, boardId, trashed);
  const items = useMemo(() => allItems.filter(item => !topic || item.tags.includes(topic) || item.author === topic).sort((a, b) => sort === 'name' ? a.title.localeCompare(b.title) : sort === 'favorites' ? Number(b.starred ?? false) - Number(a.starred ?? false) : 0), [allItems, topic, sort]);
  const topics = [...new Set(state.items.filter(item => !item.trashed).flatMap(item => item.tags))];
  const people = [...new Set(state.items.flatMap(item => item.author ? [item.author] : []))];
  const title = trashed ? 'Trash' : board?.title ?? 'All items';
  return <section className={`library-page ${board ? 'board-page' : ''}`}>
    <div className="library-heading"><div className="title-line"><BrandMark size={25} /><h1>{title}</h1><div className="view-switch" aria-label="Library view">{[['grid', 'grid', 'Grid view'], ['index', 'library', 'Index view'], ['list', 'list', 'List view']].map(([value, icon, label]) => <button key={value} className={view === value ? 'active' : ''} aria-label={label} aria-pressed={view === value} onClick={() => setView(value)}><Icon name={icon} size={16} /></button>)}</div></div>
      {!trashed && <div className="new-anchor"><button className="btn new-btn" onClick={() => setNewOpen(!newOpen)} aria-expanded={newOpen}><Icon name="plus" size={17} /> New</button>{newOpen && <NewMenu close={() => setNewOpen(false)} />}</div>}
    </div>
    <p className="library-subtitle">{trashed ? 'Your ideas are still here. Restore them whenever you’re ready.' : board?.description ?? (view === 'index' ? 'A generated table of contents for everything you’ve saved.' : 'A home for everything that inspires you.')}</p>
    {!trashed && <div className="library-toolbar"><div className="filter-tabs">{[['all', 'All items'], ['video', 'Videos'], ['document', 'Documents'], ['card', 'Cards'], ['link', 'Links'], ['image', 'Images'], ['table', 'Tables']].map(([value, label]) => <button key={value} className={filter === value ? 'selected' : ''} onClick={() => { setFilter(value); setTopic(''); }}>{label}{value === 'all' && <span>{filterItems(state, '', 'all', boardId).length}</span>}</button>)}</div><div className="library-tools"><label className="search-inline"><Icon name="search" size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search your library" aria-label="Search your library" /></label><select className="sort-select" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort items"><option value="recent">Recently added</option><option value="name">Name A–Z</option><option value="favorites">Favorites first</option></select></div></div>}
    <div className={`library-layout ${view === 'index' ? 'has-index' : ''}`}>
      {view === 'index' && <aside className="index-panel"><h2>Index <Icon name="panel" size={16} /></h2><label className="search-inline"><Icon name="search" size={15} /><input placeholder="Filter the index" aria-label="Filter the index" value={query} onChange={event => setQuery(event.target.value)} /></label><h3>TOPICS</h3><button className={!topic ? 'active' : ''} onClick={() => setTopic('')}>All topics <span>{state.items.filter(item => !item.trashed).length}</span></button>{topics.map((name, i) => <button key={name} className={topic === name ? 'active' : ''} onClick={() => setTopic(name)}><i style={{ background: ['#88a882', '#dba775', '#b7add1', '#78b7b1', '#96b9d7', '#d496ac'][i % 6] }} />{name}<span>{state.items.filter(item => item.tags.includes(name) && !item.trashed).length}</span></button>)}<h3>PEOPLE</h3>{people.map(name => <button key={name} className={topic === name ? 'active' : ''} onClick={() => setTopic(name)}>{name}<span>{state.items.filter(item => item.author === name).length}</span></button>)}</aside>}
      <div className="library-results">
        {topic && <div className="topic-heading"><h2>{topic}</h2><button className="icon-button" aria-label="Clear topic" onClick={() => setTopic('')}><Icon name="close" size={15} /></button><span>{items.length} items</span></div>}
        {items.length === 0 ? <EmptyState title={query || topic ? 'Nothing here just yet' : 'A little room for inspiration'} text={query || topic ? 'Try another search, or make a little room for a new idea.' : 'Save a link, capture a thought, or start a document. It all begins here.'} action={<button className="btn" onClick={() => { setQuery(''); setFilter('all'); setTopic(''); if (!query && !topic) newItem('card'); }}>{query || topic ? 'Clear filters' : 'Capture an idea'}</button>} /> : view === 'list' || trashed ? <div className="item-list"><div className="list-header"><span>Name</span><span>Type</span><span>Topic</span><span>Added</span></div>{items.map(item => <div className="list-row" key={item.id}><button onClick={() => openItem(item)}><Icon name={item.kind} /><span>{item.title}</span></button><span>{item.kind}</span><span>{item.tags[0] ?? '—'}</span><span>{trashed ? <button className="btn" onClick={() => { dispatch({ type: 'restore-item', id: item.id }); toast('Restored to your library'); }}>Restore</button> : 'Today'}</span></div>)}</div> : <div className="masonry">{items.map(item => <ItemCard key={item.id} item={item} />)}</div>}
        <div className="library-bottom"><Icon name="library" size={14} /><span>{items.length} little pieces of inspiration</span><span className="sample-note">Local workspace · sample collection</span></div>
      </div>
    </div>
  </section>;
}
export function Boards() {
  const { state, dispatch, navigate, toast } = useWorkspace();
  const [creating, setCreating] = useState(false); const [name, setName] = useState('');
  const create = () => { if (!name.trim()) return; const id = crypto.randomUUID(); dispatch({ type: 'add-board', board: { id, title: name.trim(), description: 'A fresh space for your ideas.', color: '#aabda5', icon: 'folder' } }); toast('Board created'); setCreating(false); navigate('board', id); };
  return <section className="library-page"><div className="library-heading"><div className="title-line"><Icon name="board" size={25} /><h1>Your boards</h1></div><button className="btn" onClick={() => setCreating(true)}><Icon name="plus" /> New board</button></div><p className="library-subtitle">Bring your ideas together. See what connects.</p><div className="boards-grid">{state.boards.map(board => { const items = state.items.filter(item => item.boardId === board.id && !item.trashed); return <button className="board-tile" key={board.id} onClick={() => navigate('board', board.id)}><div className="board-tile-preview" style={{ background: board.color }}>{items.slice(0, 3).map(item => item.image ? <img src={item.image} key={item.id} alt="" /> : <div key={item.id}>{item.title}</div>)}{!items.length && <Icon name="folder" size={42} />}</div><h2><Icon name={board.icon} />{board.title}</h2><p>{items.length} items <span>·</span> Private</p></button>; })}<button className="board-tile new-board-tile" onClick={() => setCreating(true)}><Icon name="plus" size={26} /><span>A fresh space for your ideas</span></button></div>{creating && <Dialog title="Create a board" onClose={() => setCreating(false)}><form onSubmit={event => { event.preventDefault(); create(); }} className="dialog-form"><label>Board name<input autoFocus required className="field" value={name} maxLength={160} placeholder="What are you thinking about?" onChange={event => setName(event.target.value)} /></label><p className="muted">A board is a space to connect your notes, links, and ideas.</p><button className="btn btn-primary" type="submit">Create board</button></form></Dialog>}</section>;
}
