import { useMemo, useState } from 'react';
import { Bookmark, Check, ChevronDown, Diamond, Flame, Heart, Image as ImageIcon, Play, Plus, Search, Zap, Crown, Compass } from 'lucide-react';
import { useWorkspace } from '../context';
import type { Item } from '../types';
import { filterSamples, now, uid } from './page-model';
import { Empty, LocalNotice, Modal } from './shared';

const asset = (name: string) => `/assets/eden/${name}.jpg`;
const sample = (id: string, title: string, content: string, author: string, platform: string, category: string, image?: string, avatar?: string): Item => ({ id, title, content, author, platform, kind: image ? 'video' : 'card', image: image ? asset(image) : undefined, avatar: avatar ? asset(avatar) : undefined, createdAt: '2026-11-01T00:00:00.000Z', tags: ['Local sample', category], note: 'Local sample for exploring the workspace. No live social data or performance metrics.' });
const SAMPLES: Item[] = [
  sample('evans', 'Switching off is a skill', 'UNPOPULAR OPINION: Being able to switch off after work is a bigger flex than being constantly busy.', 'Jon Evans', 'Threads', 'Productivity'),
  sample('hormozi', 'One thing. Every day.', 'How to make progress when you have more ideas than time. Start with one thing you can repeat.', 'Alex Hormozi', 'YouTube', 'Business', 'hormozi-thumb', 'hormozi-avatar'),
  sample('notebook', 'Learn ANYTHING 10x faster with Claude and Gemini Notebook', 'Build a research workflow that connects what you read to what you make.', 'Question Forward | AI', 'YouTube', 'AI', 'notebook-thumb'),
  sample('bloom-x', 'Make room for what matters', 'You do not rise to the level of your goals. You fall to the level of your systems.\n\nMake the next good decision the easy one.', 'Sahil Bloom', 'X', 'Productivity', undefined, 'bloom-x-avatar'),
  sample('filips', 'Why your life feels so chaotic', 'A practical look at focus, habits, and getting out of your own way.', 'Filip', 'YouTube', 'Productivity', 'filips-thumb', 'filips-avatar'),
  sample('decision', 'You are not paid to be busy', 'A lesson in how decision making is connected to hours you sleep.\n\nJeff Bezos starts work at 10am.\n\nNot because he is lazy. Because he understands something most founders learn too late.\n\nYou are paid to make a small number of genuinely good decisions.', 'Sandiip Porwal', 'LinkedIn', 'Business'),
  sample('leila', 'Build the business you actually want', 'The difference between building a job and building a business.', 'Leila Hormozi', 'YouTube', 'Business', 'leila-thumb', 'leila-avatar'),
  sample('sung', 'How to learn difficult things', 'A better process for turning information into understanding.', 'Justin Sung', 'YouTube', 'Productivity', 'sung-thumb', 'sung-avatar'),
  sample('dango', 'Small habits, lasting change', 'Make a promise small enough to keep. Then keep it.', 'Dan Go', 'YouTube', 'Health', 'dango-thumb', 'dango-avatar'),
  sample('bloom', 'The five types of wealth', 'A richer life is about more than your bank account.', 'Sahil Bloom', 'YouTube', 'Business', 'bloom-thumb', 'bloom-avatar'),
];
const SORTS = [{ name: 'Breakouts', icon: Zap }, { name: 'Hidden gems', icon: Diamond }, { name: 'Viral now', icon: Flame }, { name: 'All-time greats', icon: Crown }];

export function DiscoverPage() {
  const { state, dispatch, toast, navigate, openItem } = useWorkspace();
  const [section, setSection] = useState('Discover');
  const [mode, setMode] = useState('Posts');
  const [query, setQuery] = useState('');
  const [platform, setPlatform] = useState('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('Breakouts');
  const [destination, setDestination] = useState('library');
  const [imagesOnly, setImagesOnly] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);
  const filtered = useMemo(() => {
    const items = filterSamples(SAMPLES, query, platform, category).filter(item => !imagesOnly || item.image);
    if (sort === 'Hidden gems') return items.filter(item => !item.image);
    if (sort === 'Viral now') return [...items].reverse();
    if (sort === 'All-time greats') return [...items].sort((a, b) => a.title.localeCompare(b.title));
    return items;
  }, [query, platform, category, sort, imagesOnly]);
  const savedFor = (item: Item) => state.items.find(entry => entry.tags.includes(`discover:${item.id}`) && !entry.trashed && (destination === 'library' ? !entry.boardId : entry.boardId === destination));
  const save = (item: Item) => {
    const existing = savedFor(item);
    if (existing) { openItem(existing); return; }
    dispatch({ type: 'add-item', item: { ...item, id: uid(), createdAt: now(), boardId: destination === 'library' ? undefined : destination, tags: [...item.tags, `discover:${item.id}`] } });
    toast(destination === 'library' ? 'Saved to Library' : 'Saved to board');
  };
  return <section className="p-page p-discover">
    <nav className="p-discover-nav" aria-label="Discovery sections">{['Discover', 'Creators', 'Brands', 'Lists'].map(tab => <button key={tab} className={section === tab ? 'p-nav-active' : ''} onClick={() => setSection(tab)}>{tab}</button>)}</nav>
    {section === 'Discover' && <>
      <div className="p-discover-filters"><div className="p-segmented">{['Posts', 'Ads'].map(tab => <button key={tab} className={mode === tab ? 'p-selected' : ''} onClick={() => setMode(tab)}>{tab}</button>)}</div><span className="p-divider" />
        {SORTS.map(({ name, icon: Icon }) => <button className={`p-chip ${sort === name ? 'p-selected' : ''}`} aria-pressed={sort === name} key={name} onClick={() => setSort(name)}><Icon size={15} />{name}</button>)}
        <span className="p-divider" /><label className="p-chip p-select-wrap"><Zap size={15} /><select aria-label="Discover category" value={category} onChange={event => setCategory(event.target.value)}><option value="all">All categories</option>{['Productivity', 'Business', 'AI', 'Health'].map(value => <option key={value}>{value}</option>)}</select><ChevronDown size={13} /></label>
        <button className={`icon-button ${imagesOnly ? 'p-selected' : ''}`} aria-label="Show samples with media only" aria-pressed={imagesOnly} onClick={() => setImagesOnly(value => !value)}><ImageIcon size={17} /></button>
      </div>
      <div className="p-discover-tools"><label className="p-search"><Search size={16} /><input aria-label="Search local sample content" placeholder="Search inspiration…" value={query} onChange={event => setQuery(event.target.value)} /></label><select aria-label="Filter by platform" className="p-control" value={platform} onChange={event => setPlatform(event.target.value)}><option value="all">All platforms</option>{['YouTube', 'X', 'LinkedIn', 'Threads'].map(value => <option key={value}>{value}</option>)}</select><label className="p-save-target muted">Save to <select aria-label="Save destination" className="p-control" value={destination} onChange={event => setDestination(event.target.value)}><option value="library">Library</option>{state.boards.map(board => <option key={board.id} value={board.id}>{board.title}</option>)}</select></label></div>
      <LocalNotice>Local sample collection · Filters apply to these samples, not a live social index.</LocalNotice>
      {mode === 'Ads' ? <Empty icon={<Compass size={28} />} title="No ad library connected" text="This reconstruction does not fetch live ads. Explore the local post samples instead."><button className="btn" onClick={() => setMode('Posts')}>Explore posts</button></Empty> : filtered.length ? <div className="p-feed">{filtered.map(item => <article key={item.id} className={`p-post ${item.image ? 'p-post-media' : ''}`}>
        {item.image ? <button className="p-thumb" onClick={() => setSelected(item)} aria-label={`Preview ${item.title}`}><img src={item.image} alt={item.title} loading="lazy" /><span><Play size={11} fill="currentColor" /> Sample</span></button> : null}
        <div className="p-post-body"><div className="p-author">{item.avatar ? <img src={item.avatar} alt="" loading="lazy" /> : <span className="p-avatar-letter">{item.author?.slice(0, 1)}</span>}<div><strong>{item.author}</strong><small className="muted">{item.platform} · Local sample</small></div></div>
          <button className="p-post-open" onClick={() => setSelected(item)}>{item.image ? <h2>{item.title}</h2> : <p>{item.content}</p>}</button>
          {item.image && <p className="p-post-description muted">{item.content}</p>}
          <footer><span className="p-sample-tag"><Heart size={14} /> Sample content</span><button className="p-save" onClick={() => save(item)} aria-label={`${savedFor(item) ? 'Open saved' : 'Save'} ${item.title}`}>{savedFor(item) ? <Check size={16} /> : <Bookmark size={16} />}<span>{savedFor(item) ? 'Saved' : 'Save'}</span></button></footer>
        </div></article>)}</div> : <Empty title="No matching samples" text="Try another topic or platform, or clear your filters."><button className="btn" onClick={() => { setQuery(''); setPlatform('all'); setCategory('all'); setImagesOnly(false); setSort('Breakouts'); }}>Clear filters</button></Empty>}
    </>}
    {section === 'Creators' && <><LocalNotice>Creators appearing in the local sample collection. No live profile metrics.</LocalNotice><div className="p-creator-list">{SAMPLES.filter((item, index, list) => item.avatar && list.findIndex(entry => entry.author === item.author) === index).map(item => <div className="p-creator-row" key={item.id}><img src={item.avatar} alt="" /><div><strong>{item.author}</strong><p className="muted">{item.platform} · {item.tags[1]}</p></div><button className="btn" onClick={() => { setQuery(item.author ?? ''); setSection('Discover'); setSort('Breakouts'); setPlatform('all'); setCategory('all'); }}>View samples</button></div>)}</div></>}
    {section === 'Brands' && <Empty title="Your brand research starts here" text="Live advertiser research is not connected in this local workspace."><button className="btn" onClick={() => { setSection('Discover'); setMode('Posts'); }}>Browse local inspiration</button></Empty>}
    {section === 'Lists' && <><LocalNotice>Your local boards can hold curated collections.</LocalNotice>{state.boards.length ? <div className="p-creator-list">{state.boards.map(board => <button className="p-board-link" key={board.id} onClick={() => navigate('board', board.id)}><span>{board.icon || '◫'}</span><div><strong>{board.title}</strong><p className="muted">{board.description || 'Local collection'}</p></div><ChevronDown size={16} /></button>)}</div> : <Empty title="No collections yet" text="Create a board, then save your favorite samples into it."><button className="btn" onClick={() => navigate('boards')}><Plus size={16} />Create a board</button></Empty>}</>}
    {selected && <Modal title={selected.title} wide onClose={() => setSelected(null)}><div className="p-modal-body">{selected.image && <img className="p-preview-image" src={selected.image} alt={selected.title} />}<p className="muted">{selected.author} · {selected.platform} · Local sample</p><p className="p-prose">{selected.content}</p><LocalNotice>{selected.note}</LocalNotice><button className="btn btn-primary" onClick={() => save(selected)}><Bookmark size={15} />{savedFor(selected) ? 'Open saved item' : 'Save to collection'}</button></div></Modal>}
  </section>;
}
