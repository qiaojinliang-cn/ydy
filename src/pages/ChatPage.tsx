import { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '../context';
import { Icon } from '../ui';
import { LocalNotice, PageHeader } from './shared';
import { buildChatContext, requestChat, uid } from './page-model';

const STARTERS = ['Help me find the thread in my saved ideas.', 'What should I write next, and why?', 'Challenge the weakest claim in my strategy.'];

export function ChatPage() {
  const { state, dispatch, toast } = useWorkspace();
  const [draft, setDraft] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [picker, setPicker] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }); }, [state.messages.length, busy]);
  useEffect(() => () => abort.current?.abort(), []);
  const send = async (value: string) => {
    const content = value.trim();
    if (!content || busy) return;
    setError('');
    dispatch({ type: 'add-message', message: { id: uid(), role: 'user', content } });
    setDraft('');
    setBusy(true);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const history = [...state.messages.filter(message => !message.error), { id: 'pending', role: 'user' as const, content }].map(({ role, content: text }) => ({ role, content: text }));
      const answer = await requestChat(history, buildChatContext(state.items, selected, ''), controller.signal);
      dispatch({ type: 'add-message', message: { id: uid(), role: 'assistant', content: answer } });
    } catch (caught) {
      if ((caught as Error).name === 'AbortError') { toast('Stopped'); return; }
      const message = caught instanceof Error ? caught.message : 'Something went wrong.';
      setError(message);
      dispatch({ type: 'add-message', message: { id: uid(), role: 'assistant', content: message, error: true } });
    } finally { setBusy(false); abort.current = null; }
  };
  return <section className="p-page p-chat">
    <PageHeader title="Chat" subtitle="Think out loud with what you have saved.">
      <button className="btn" onClick={() => setPicker(!picker)} aria-expanded={picker}><Icon name="library" size={16} />Context · {selected.length}</button>
      <button className="btn btn-ghost" onClick={() => { dispatch({ type: 'clear-messages' }); toast('Conversation cleared'); }}>Clear</button>
    </PageHeader>
    {picker && <div className="p-context-picker"><p className="muted">Only the items you select are shared with the configured model.</p>{state.items.filter(item => !item.trashed).map(item => <label key={item.id} className="p-context-row"><input type="checkbox" checked={selected.includes(item.id)} onChange={event => setSelected(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} /><span>{item.title}</span><small className="muted">{item.kind}</small></label>)}</div>}
    <LocalNotice>This chat only answers when a model is configured on the local server. Nothing is published or emailed.</LocalNotice>
    <div className="p-chat-log" ref={scroller} aria-live="polite">
      {!state.messages.length && <div className="p-chat-empty"><h2>What are you working on?</h2><p className="muted">Ask about your own notes. The reply stays on this device until you clear it.</p><div className="p-starter-row">{STARTERS.map(starter => <button key={starter} className="p-starter" onClick={() => { void send(starter); }}>{starter}</button>)}</div></div>}
      {state.messages.map(message => <div key={message.id} className={`p-bubble ${message.role} ${message.error ? 'p-bubble-error' : ''}`}>{message.role === 'assistant' && <span className="p-bubble-mark"><Icon name={message.error ? 'help' : 'sparkles'} size={15} /></span>}<div><p>{message.content}</p>{message.error && <small>Not a model reply. Check the local service configuration.</small>}</div></div>)}
      {busy && <div className="p-bubble assistant"><span className="p-bubble-mark"><Icon name="sparkles" size={15} /></span><div className="p-typing" aria-label="Waiting for the model"><i /><i /><i /></div></div>}
    </div>
    {error && <p className="p-error" role="alert">{error}</p>}
    <form className="p-chat-input" onSubmit={event => { event.preventDefault(); void send(draft); }}>
      <textarea className="field" rows={2} value={draft} placeholder="Ask about your library…" aria-label="Message" onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(draft); } }} />
      {busy ? <button className="btn" type="button" onClick={() => abort.current?.abort()}><Icon name="close" size={16} />Stop</button> : <button className="btn btn-primary" type="submit" disabled={!draft.trim()}><Icon name="arrow" size={16} />Send</button>}
    </form>
  </section>;
}
