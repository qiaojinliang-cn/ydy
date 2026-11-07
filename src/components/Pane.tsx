import { useWorkspace } from '../context';
import { Icon } from '../ui';
import type { Item } from '../types';

export function ItemPane({ item, close }: { item: Item; close: () => void }) {
  const { state, dispatch, toast, openItem } = useWorkspace();
  const board = state.boards.find(entry => entry.id === item.boardId);
  const toggleFavorite = () => {
    dispatch({ type: 'update-item', id: item.id, patch: { starred: !item.starred } });
    toast(item.starred ? 'Removed from favorites' : 'Added to favorites');
  };
  const move = (boardId: string) => {
    dispatch({ type: 'update-item', id: item.id, patch: { boardId: boardId || undefined } });
    toast(boardId ? 'Moved to board' : 'Moved to the library');
  };
  return <aside className="pane" aria-label="Open in pane">
    <header className="pane-head">
      <span className="pane-kind"><Icon name={item.kind} size={15} />{item.kind === 'document' ? 'Document' : item.kind === 'card' ? 'A little thought' : item.kind}</span>
      <button className="icon-button" aria-label="Close pane" onClick={close}><Icon name="close" size={16} /></button>
    </header>
    <div className="pane-scroll">
      {item.image && <img className="pane-media" src={item.image} alt={item.title} />}
      <h2 className="pane-title">{item.title}</h2>
      <p className="pane-meta">{[item.author, item.platform, item.tags[0]].filter(Boolean).join(' · ')}</p>
      {item.content.split('\n').filter(Boolean).map((line, index) => <p className="pane-prose" key={index}>{line}</p>)}
      {item.note && <p className="pane-note"><Icon name="chat" size={14} />{item.note}</p>}
      <div className="pane-tags">{item.tags.map(tag => <span key={tag} className="p-chip p-chip-quiet">{tag}</span>)}</div>
    </div>
    <footer className="pane-foot">
      <button className="btn" onClick={toggleFavorite} aria-pressed={Boolean(item.starred)}><Icon name="bookmark" size={15} />{item.starred ? 'Favorited' : 'Favorite'}</button>
      <label className="pane-board">Board<select aria-label="Move to board" className="p-control" value={item.boardId ?? ''} onChange={event => move(event.target.value)}><option value="">Library</option>{state.boards.map(entry => <option key={entry.id} value={entry.id}>{entry.title}</option>)}</select></label>
      <button className="btn btn-primary" onClick={() => openItem(item)}>Open full view</button>
      {board && <p className="muted pane-hint">On {board.title}</p>}
    </footer>
  </aside>;
}
