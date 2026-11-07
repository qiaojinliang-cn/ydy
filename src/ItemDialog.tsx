import { useRef, useState } from 'react';
import { useWorkspace } from './context';
import { Dialog, Icon, safeUrl } from './ui';
import type { Item, ItemKind } from './types';

export function ItemDialog({ item, kind = 'document', boardId, close }: { item?: Item; kind?: ItemKind; boardId?: string; close: () => void }) {
  const { state, dispatch, toast, navigate } = useWorkspace();
  const [title, setTitle] = useState(item?.title ?? ''); const [content, setContent] = useState(item?.content ?? '');
  const [url, setUrl] = useState(item?.url ?? ''); const [note, setNote] = useState(item?.note ?? '');
  const [board, setBoard] = useState(item?.boardId ?? boardId ?? ''); const [tags, setTags] = useState(item?.tags.join(', ') ?? '');
  const [image, setImage] = useState(item?.image ?? ''); const [error, setError] = useState(''); const upload = useRef<HTMLInputElement>(null);
  const actualKind = item?.kind ?? kind;
  const save = () => {
    if (!title.trim()) { setError('Give this idea a name first.'); return; }
    if (url && !safeUrl(url)) { setError('Use a complete http:// or https:// link.'); return; }
    const patch = { title: title.trim(), content, url: url || undefined, note, boardId: board || undefined, tags: tags.split(',').map(tag => tag.trim()).filter(Boolean), image: image || undefined };
    if (item) dispatch({ type: 'update-item', id: item.id, patch });
    else dispatch({ type: 'add-item', item: { id: crypto.randomUUID(), kind: actualKind, createdAt: new Date().toISOString(), ...patch } });
    toast(item ? 'Changes saved' : 'Saved to your library'); close();
  };
  const uploadImage = (file?: File) => {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) { setError('Choose a PNG, JPG, WebP, or GIF image.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('Choose an image smaller than 2 MB for local storage.'); return; }
    const reader = new FileReader(); reader.onerror = () => setError('The image could not be read. Try another file.'); reader.onload = () => { setImage(String(reader.result)); if (!title) setTitle(file.name.replace(/\.[^.]+$/, '')); setError(''); }; reader.readAsDataURL(file);
  };
  const source = safeUrl(item?.url);
  return <Dialog title={item ? actualKind === 'document' ? 'Document' : 'Your saved idea' : `New ${actualKind}`} onClose={close} wide>
    <form className="item-editor" onSubmit={event => { event.preventDefault(); save(); }}>
      {image && <img className="editor-image" src={image} alt={title} />}
      <input className="editor-title" aria-label="Title" placeholder="Untitled" value={title} onChange={event => setTitle(event.target.value)} maxLength={300} autoFocus required />
      {actualKind === 'image' && !image && <button className="upload-zone" type="button" onClick={() => upload.current?.click()}><Icon name="image" size={28} /><span>Drop a little inspiration here</span><small>Choose an image · up to 2 MB</small></button>}
      <input hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" ref={upload} onChange={event => uploadImage(event.target.files?.[0])} />
      {(actualKind === 'link' || item?.url) && <label>Link<input className="field" aria-label="Link URL" type="url" value={url} onChange={event => setUrl(event.target.value)} placeholder="https://" /></label>}
      <textarea className="editor-content" aria-label="Content" placeholder={actualKind === 'table' ? 'Name, Status, Notes\nMy first idea, Not started, A thought worth keeping' : 'Start with a thought…'} value={content} onChange={event => setContent(event.target.value)} rows={actualKind === 'document' ? 11 : 6} />
      {actualKind === 'table' && content && <div className="table-preview"><table><tbody>{content.split('\n').map((row, index) => <tr key={index}>{row.split(',').map((cell, col) => index === 0 ? <th key={col}>{cell.trim()}</th> : <td key={col}>{cell.trim()}</td>)}</tr>)}</tbody></table></div>}
      <div className="editor-details"><label>Board<select className="field" value={board} onChange={event => setBoard(event.target.value)}><option value="">Library only</option>{state.boards.map(b => <option value={b.id} key={b.id}>{b.title}</option>)}</select></label><label>Topics<input className="field" value={tags} onChange={event => setTags(event.target.value)} placeholder="Writing, Creativity" /></label></div>
      <label className="note-field"><Icon name="chat" size={16} /> Why did you save this?<textarea className="field" aria-label="Why I saved this" value={note} onChange={event => setNote(event.target.value)} placeholder="A little context for your future self…" rows={2} /></label>
      {error && <p className="error-message" role="alert">{error}</p>}
      <div className="editor-actions"><div>{item && <button type="button" className="icon-button danger" aria-label="Move to trash" onClick={() => { dispatch({ type: 'trash-item', id: item.id }); toast('Moved to Trash. You can restore it anytime.'); close(); }}><Icon name="trash" /></button>}{source && <a className="btn" href={source} target="_blank" rel="noreferrer">Open original <Icon name="arrow" size={14} /></a>}</div><div>{item && <button className="btn" type="button" onClick={() => { dispatch({ type: 'add-plan', card: { id: crypto.randomUUID(), title: title || item.title, stage: 'Idea', pillar: item.tags[0] ?? '', platform: 'X', date: '', notes: content } }); toast('Added to your plan'); close(); navigate('planner'); }}><Icon name="calendar" size={15} /> Add to plan</button>}<button className="btn btn-primary" type="submit">{item ? 'Save changes' : 'Save to library'}</button></div></div>
    </form>
  </Dialog>;
}
