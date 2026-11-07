import { useState } from 'react';
import { useWorkspace } from '../context';
import { Icon } from '../ui';
import { Empty, IntegrationNotice, LocalNotice, PageHeader, Tabs } from './shared';
import { PLATFORMS, uid } from './page-model';

export function PublishPage() {
  const { state, dispatch, toast } = useWorkspace();
  const [tab, setTab] = useState('Drafts');
  const [text, setText] = useState('');
  const [platform, setPlatform] = useState('X');
  const [date, setDate] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const drafts = state.drafts.filter(draft => draft.status === 'draft');
  const scheduled = state.drafts.filter(draft => draft.status === 'scheduled');
  const save = (status: 'draft' | 'scheduled') => {
    setError('');
    if (!text.trim()) { setError('Write something before saving. An empty draft would help nobody.'); return; }
    if (status === 'scheduled') {
      const when = new Date(date);
      if (!date || Number.isNaN(when.valueOf())) { setError('Choose a date and time to schedule this post.'); return; }
      if (when.valueOf() <= Date.now()) { setError('Choose a time in the future. A post cannot be scheduled in the past.'); return; }
    }
    dispatch({ type: 'save-draft', draft: { id: uid(), text: text.trim(), platform, status, date: status === 'scheduled' ? new Date(date).toISOString() : '' } });
    toast(status === 'scheduled' ? 'Saved as a local schedule' : 'Saved as a local draft');
    setText(''); setDate('');
  };
  return <section className="p-page">
    <PageHeader title="Publish" subtitle="Write here. Nothing leaves this device — no account is connected.">
      <button className="btn" onClick={() => setConnecting(true)}><Icon name="globe" size={16} />Connect an account</button>
    </PageHeader>
    <Tabs values={['Drafts', 'Scheduled', 'Composer']} value={tab} onChange={setTab} />
    <LocalNotice>Local drafts only. Publishing, email, and payments are never executed from this workspace.</LocalNotice>
    {tab === 'Composer' && <div className="p-composer">
      <label className="p-platform-row"><span className="muted">Posting to</span><select className="p-control" value={platform} onChange={event => setPlatform(event.target.value)}>{PLATFORMS.map(value => <option key={value}>{value}</option>)}</select></label>
      <textarea className="field p-compose-field" rows={8} maxLength={4000} placeholder="Say the thing you keep almost saying…" value={text} onChange={event => setText(event.target.value)} aria-label="Post text" />
      <div className="p-compose-foot"><span className="muted">{text.length} / 4000</span>
        <label className="p-schedule"><span className="muted">When</span><input className="field" type="datetime-local" value={date} onChange={event => setDate(event.target.value)} aria-label="Schedule time" /></label></div>
      {error && <p className="p-error" role="alert">{error}</p>}
      <div className="p-actions"><button className="btn" onClick={() => save('draft')}>Save draft</button><button className="btn btn-primary" onClick={() => save('scheduled')}><Icon name="calendar" size={16} />Schedule locally</button></div>
    </div>}
    {tab === 'Drafts' && (drafts.length ? <div className="p-draft-list">{drafts.map(draft => <article className="p-draft" key={draft.id}><header><span className="p-tag">{draft.platform}</span><span className="muted">Draft</span></header><p className="p-prose">{draft.text}</p><footer><button className="btn btn-ghost" onClick={() => { setText(draft.text); setPlatform(draft.platform); setTab('Composer'); }}>Edit</button><button className="btn btn-ghost" onClick={() => { dispatch({ type: 'save-draft', draft: { ...draft, status: 'scheduled', date: draft.date || new Date(Date.now() + 86_400_000).toISOString() } }); toast('Moved to scheduled'); }}>Schedule</button><button className="btn btn-ghost danger" onClick={() => { dispatch({ type: 'delete-draft', id: draft.id }); toast('Draft deleted'); }}>Delete</button></footer></article>)}</div>
      : <Empty title="No drafts yet" text="Start with one honest sentence. You can shape it later."><button className="btn" onClick={() => setTab('Composer')}>Open the composer</button></Empty>)}
    {tab === 'Scheduled' && (scheduled.length ? <div className="p-draft-list">{scheduled.map(draft => <article className="p-draft" key={draft.id}><header><span className="p-tag">{draft.platform}</span><span className="muted">{new Date(draft.date).toLocaleString()}</span></header><p className="p-prose">{draft.text}</p><footer><button className="btn btn-ghost" onClick={() => { dispatch({ type: 'save-draft', draft: { ...draft, status: 'draft', date: '' } }); toast('Back to drafts'); }}>Back to drafts</button><button className="btn btn-ghost danger" onClick={() => { dispatch({ type: 'delete-draft', id: draft.id }); toast('Schedule removed'); }}>Remove</button></footer></article>)}</div>
      : <Empty title="Nothing scheduled" text="A local schedule keeps your intentions visible without touching a live account." />)}
    {connecting && <IntegrationNotice service="social" onClose={() => setConnecting(false)} />}
  </section>;
}
