import { useState } from 'react';
import { useWorkspace } from '../context';
import { Icon } from '../ui';
import { Field, LocalNotice, Modal, PageHeader, Tabs } from './shared';
import { readStrategy, strategyToItem, STRATEGY_TAG, uid, type StrategyData } from './page-model';

const SIGNATURE: { key: keyof Pick<StrategyData, 'mission' | 'audience' | 'becomes' | 'enemy' | 'story'>; label: string; hint: string }[] = [
  { key: 'mission', label: 'Your mission', hint: 'One sentence about the change you make.' },
  { key: 'audience', label: 'Who it is for', hint: 'Where they are stuck right now.' },
  { key: 'becomes', label: 'Who they become', hint: 'The version of them on the other side.' },
  { key: 'enemy', label: 'What you are against', hint: 'The thing your work pushes back on.' },
  { key: 'story', label: 'Your story', hint: 'Why you are the one saying this.' },
];

export function StrategyPage() {
  const { state, dispatch, toast } = useWorkspace();
  const saved = state.items.find(item => item.tags.includes(STRATEGY_TAG) && !item.trashed);
  const [strategy, setStrategy] = useState<StrategyData>(() => readStrategy(saved));
  const [tab, setTab] = useState('Pillars');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const persist = (next: StrategyData) => {
    setStrategy(next);
    const item = strategyToItem(next, saved);
    dispatch(saved ? { type: 'update-item', id: saved.id, patch: { title: next.title, content: item.content, tags: item.tags } } : { type: 'add-item', item });
  };
  const editField = (key: string) => { setDraft(String((strategy as unknown as Record<string, unknown>)[key] ?? '')); setEditing(key); };
  const saveField = () => { persist({ ...strategy, [editing as string]: draft }); setEditing(null); toast('Strategy updated'); };
  const setPillarText = (id: string, patch: Partial<StrategyData['pillars'][number]>) => persist({ ...strategy, pillars: strategy.pillars.map(pillar => pillar.id === id ? { ...pillar, ...patch } : pillar) });
  return <section className="p-page">
    <PageHeader title={strategy.title} subtitle="One clear point of view. Everything you make grows from here.">
      <span className="p-pill"><span className="p-status-dot" />Beta</span>
      <button className="btn" onClick={() => editField('title')}><Icon name="document" size={16} />Rename</button>
    </PageHeader>
    <Tabs values={['Pillars', 'Signature', 'Map']} value={tab} onChange={setTab} />
    {tab === 'Pillars' && <div className="p-strategy-grid">
      <aside className="p-pillar-list">{strategy.pillars.map(pillar => <button key={pillar.id} className="p-pillar-tab" onClick={() => editField(`pillar:${pillar.id}`)}><i style={{ background: pillar.color }} /><div><strong>{pillar.name}</strong><small className="muted">{pillar.lens}</small></div><span>{pillar.topics.length}</span></button>)}
        <button className="btn btn-ghost" onClick={() => { const name = window.prompt('Name this pillar'); if (!name?.trim()) return; persist({ ...strategy, pillars: [...strategy.pillars, { id: uid(), name: name.trim(), lens: '', claim: '', color: '#8fa9a0', topics: [] }] }); toast('Pillar added'); }}><Icon name="plus" size={16} />Add pillar</button>
      </aside>
      <div className="p-pillar-detail">{strategy.pillars.map(pillar => <article className="p-card" key={pillar.id}>
        <header className="p-card-head"><div><h2>{pillar.name}</h2><p className="muted">{pillar.lens || 'Add a lens: how you come at this.'}</p></div><i className="p-swatch" style={{ background: pillar.color }} /></header>
        <p className="p-claim">{pillar.claim || 'Add the one-line claim this pillar argues.'}</p>
        <div className="p-topic-row">{pillar.topics.map(topic => <span className="p-tag" key={topic}>{topic}</span>)}{!pillar.topics.length && <span className="muted">No topics yet.</span>}</div>
        <footer className="p-card-foot"><button className="btn btn-ghost" onClick={() => { const raw = window.prompt('Topics, separated by commas', pillar.topics.join(', ')); if (raw === null) return; setPillarText(pillar.id, { topics: raw.split(',').map(value => value.trim()).filter(Boolean) }); toast('Topics saved'); }}>Edit topics</button>
          <button className="btn btn-ghost" onClick={() => { const claim = window.prompt('The claim this pillar makes', pillar.claim); if (claim === null) return; setPillarText(pillar.id, { claim }); toast('Claim saved'); }}>Edit claim</button></footer>
      </article>)}</div>
    </div>}
    {tab === 'Signature' && <div className="p-signature">{SIGNATURE.map(field => <div className="p-signature-row" key={field.key}><span className="p-signature-label">{field.label}</span><button className="p-signature-value" onClick={() => editField(field.key)}>{strategy[field.key] || <span className="muted">{field.hint}</span>}<Icon name="right" size={15} /></button></div>)}
      <div className="p-signature-row"><span className="p-signature-label">What you believe</span><div className="p-signature-value as-static">{strategy.beliefs.length ? strategy.beliefs.map(belief => <p key={belief}>{belief}</p>) : <span className="muted">No beliefs saved yet.</span>}<button className="btn btn-ghost" onClick={() => { const raw = window.prompt('Beliefs, one per line', strategy.beliefs.join('\n')); if (raw === null) return; persist({ ...strategy, beliefs: raw.split('\n').map(value => value.trim()).filter(Boolean) }); toast('Beliefs saved'); }}>Edit beliefs</button></div></div>
      <div className="p-signature-row"><span className="p-signature-label">Shaped by</span><div className="p-signature-value as-static">{strategy.shapedBy.map(name => <span className="p-tag" key={name}>{name}</span>)}<button className="btn btn-ghost" onClick={() => { const raw = window.prompt('Influences, separated by commas', strategy.shapedBy.join(', ')); if (raw === null) return; persist({ ...strategy, shapedBy: raw.split(',').map(value => value.trim()).filter(Boolean) }); toast('Saved'); }}>Edit</button></div></div>
    </div>}
    {tab === 'Map' && <div className="p-map"><div className="p-map-canvas">{strategy.pillars.map((pillar, index) => <div className="p-map-node" key={pillar.id} style={{ ['--node-color' as string]: pillar.color, left: `${12 + index * 30}%`, top: `${18 + (index % 2) * 34}%` }}><strong>{pillar.name}</strong><small>{pillar.topics.length} topics</small></div>)}<svg className="p-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M18 26 C 34 60, 46 40, 62 52 S 78 74, 92 66" fill="none" stroke="currentColor" strokeWidth="0.4" /></svg></div><p className="muted p-map-note">A rough map of how your pillars connect. Local sketch only.</p></div>}
    <LocalNotice>Your strategy is saved on this device as a workspace document. Nothing is sent to a live account.</LocalNotice>
    {editing && <Modal title={editing.startsWith('pillar:') ? 'Edit pillar' : 'Edit signature'} onClose={() => setEditing(null)}><div className="p-modal-body"><Field label="Text">{editing.startsWith('pillar:') ? <input className="field" autoFocus value={draft} onChange={event => setDraft(event.target.value)} /> : <textarea className="field" rows={4} autoFocus value={draft} onChange={event => setDraft(event.target.value)} />}</Field><button className="btn btn-primary" onClick={() => {
      if (editing.startsWith('pillar:')) { const id = editing.slice(7); setPillarText(id, { name: draft || 'Untitled pillar' }); setEditing(null); toast('Pillar renamed'); return; }
      saveField();
    }}>Save</button></div></Modal>}
  </section>;
}
