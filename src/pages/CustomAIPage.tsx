import { useState } from 'react';
import { useWorkspace } from '../context';
import { Icon } from '../ui';
import { Empty, Field, LocalNotice, Modal, PageHeader } from './shared';
import { uid } from './page-model';

const ICONS = ['sparkles', 'bulb', 'fingerprint', 'book', 'telescope'];

export function CustomAIPage() {
  const { state, dispatch, toast } = useWorkspace();
  const [activeId, setActiveId] = useState<string | null>(state.customAIs[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const active = state.customAIs.find(ai => ai.id === activeId) ?? null;
  const create = () => {
    if (!name.trim()) return;
    const ai = { id: uid(), name: name.trim(), description: description.trim() || 'A local assistant for your workspace.', icon: ICONS[state.customAIs.length % ICONS.length], instructions: '' };
    dispatch({ type: 'add-ai', ai });
    setActiveId(ai.id); setName(''); setDescription(''); setCreating(false); toast('Local AI created');
  };
  const patch = (value: string) => { if (!active) return; dispatch({ type: 'update-item', id: active.id, patch: { content: value } }); };
  return <section className="p-page p-ai">
    <PageHeader title="Custom AI" subtitle="Assistants that know your workspace and your voice.">
      <button className="btn" onClick={() => setCreating(true)}><Icon name="plus" size={16} />New AI</button>
    </PageHeader>
    <LocalNotice>Instructions are stored locally. Running an AI requires a model configured on the local server.</LocalNotice>
    {!state.customAIs.length ? <Empty title="Build your first assistant" text="Give it instructions, a voice, and the part of your library it should read."><button className="btn" onClick={() => setCreating(true)}>Create an AI</button></Empty>
      : <div className="p-ai-layout">
        <aside className="p-ai-list">{state.customAIs.map(ai => <button key={ai.id} className={`p-ai-item ${ai.id === activeId ? 'p-active' : ''}`} onClick={() => setActiveId(ai.id)}><span className="p-ai-icon"><Icon name={ai.icon} size={18} /></span><div><strong>{ai.name}</strong><small className="muted">{ai.description}</small></div></button>)}</aside>
        {active && <article className="p-ai-detail">
          <header className="p-card-head"><div><h2>{active.name}</h2><p className="muted">{active.description}</p></div><span className="p-pill">Local</span></header>
          <Field label="Instructions" hint="Written as if you were briefing a thoughtful collaborator."><textarea className="field" rows={10} value={active.instructions} placeholder="You are a writing partner who…" onChange={event => patch(event.target.value)} /></Field>
          <div className="p-ai-meta"><span className="p-tag">{state.items.filter(item => !item.trashed).length} items available</span><span className="p-tag">No external tools</span></div>
          <footer className="p-card-foot"><button className="btn" onClick={() => toast('Instructions saved on this device')}>Save instructions</button><button className="btn btn-ghost" onClick={() => { setActiveId(null); toast('Closed — nothing was deleted'); }}>Close</button></footer>
        </article>}
      </div>}
    {creating && <Modal title="New local AI" onClose={() => setCreating(false)}><form className="p-modal-body" onSubmit={event => { event.preventDefault(); create(); }}>
      <Field label="Name"><input className="field" autoFocus required value={name} maxLength={80} placeholder="Editorial partner" onChange={event => setName(event.target.value)} /></Field>
      <Field label="What it helps with"><input className="field" value={description} maxLength={140} placeholder="Sharpens my drafts before I publish" onChange={event => setDescription(event.target.value)} /></Field>
      <button className="btn btn-primary" type="submit">Create</button>
    </form></Modal>}
  </section>;
}
