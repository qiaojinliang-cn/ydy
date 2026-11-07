import { useState } from 'react';
import { useWorkspace } from '../context';
import { Icon } from '../ui';
import { Field, LocalNotice, Modal, PageHeader } from './shared';
import { PLATFORMS, PLAN_STAGES, uid } from './page-model';
import type { PlanCard } from '../types';

export function PlannerPage() {
  const { state, dispatch, toast } = useWorkspace();
  const [adding, setAdding] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [pillar, setPillar] = useState('');
  const [platform, setPlatform] = useState('X');
  const [moving, setMoving] = useState<PlanCard | null>(null);
  const create = () => {
    if (!title.trim()) return;
    dispatch({ type: 'add-plan', card: { id: uid(), title: title.trim(), stage: adding ?? PLAN_STAGES[0], pillar: pillar.trim(), platform, date: '', notes: '' } });
    toast('Idea added to the plan');
    setTitle(''); setPillar(''); setAdding(null);
  };
  return <section className="p-page p-planner">
    <PageHeader title="Planner" subtitle="Turn ideas into something you can finish. Drag-free: every card moves with a click.">
      <button className="btn" onClick={() => setAdding(PLAN_STAGES[0])}><Icon name="plus" size={16} />New idea</button>
    </PageHeader>
    <LocalNotice>Your plan lives on this device. Nothing is scheduled with a live account.</LocalNotice>
    <div className="p-kanban">{PLAN_STAGES.map(stage => {
      const cards = state.plans.filter(card => card.stage === stage);
      return <div className="p-column" key={stage}><header><span>{stage}</span><span className="p-count">{cards.length}</span></header>
        {cards.map(card => <article className="p-kanban-card" key={card.id}>
          <button className="p-kanban-open" onClick={() => setMoving(card)}>{card.title}</button>
          <div className="p-kanban-meta">{card.pillar && <span className="p-tag">{card.pillar}</span>}<span className="muted">{card.platform}</span></div>
          <footer><button className="btn btn-ghost" onClick={() => { const index = PLAN_STAGES.indexOf(stage); const next = Math.min(index + 1, PLAN_STAGES.length - 1); dispatch({ type: 'update-plan', id: card.id, patch: { stage: next === index ? PLAN_STAGES[0] : PLAN_STAGES[next] } }); toast(`Moved to ${next === index ? PLAN_STAGES[0] : PLAN_STAGES[next]}`); }}>Move on</button></footer>
        </article>)}
        <button className="p-column-add" onClick={() => setAdding(stage)}><Icon name="plus" size={15} />Add a card</button>
      </div>;
    })}</div>
    {adding && <Modal title={`New idea · ${adding}`} onClose={() => setAdding(null)}><form className="p-modal-body" onSubmit={event => { event.preventDefault(); create(); }}>
      <Field label="The idea"><input className="field" autoFocus required value={title} maxLength={200} placeholder="What are you making?" onChange={event => setTitle(event.target.value)} /></Field>
      <Field label="Pillar" hint="Optional. Tie it to a strategy pillar."><input className="field" value={pillar} onChange={event => setPillar(event.target.value)} placeholder="Writing that ships" /></Field>
      <Field label="Platform"><select className="field" value={platform} onChange={event => setPlatform(event.target.value)}>{PLATFORMS.map(value => <option key={value}>{value}</option>)}</select></Field>
      <button className="btn btn-primary" type="submit">Add to plan</button>
    </form></Modal>}
    {moving && <Modal title="Move this card" onClose={() => setMoving(null)}><div className="p-modal-body"><p className="p-prose">{moving.title}</p><div className="p-stage-picker">{PLAN_STAGES.map(stage => <button key={stage} className={`p-chip ${moving.stage === stage ? 'p-selected' : ''}`} onClick={() => { dispatch({ type: 'update-plan', id: moving.id, patch: { stage } }); setMoving({ ...moving, stage }); toast(`Moved to ${stage}`); }}>{stage}</button>)}</div><button className="btn" onClick={() => setMoving(null)}>Done</button></div></Modal>}
  </section>;
}
