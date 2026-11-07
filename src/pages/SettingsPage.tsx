import { useRef, useState } from 'react';
import { useWorkspace } from '../context';
import { Icon } from '../ui';
import { Field, LocalNotice, PageHeader, Tabs } from './shared';
import { downloadFile, parseImport } from './page-model';
import { workspaceReducer } from '../state';

export function SettingsPage() {
  const { state, dispatch, toast } = useWorkspace();
  const [tab, setTab] = useState('Workspace');
  const [name, setName] = useState(state.settings.name);
  const [workspace, setWorkspace] = useState(state.settings.workspace);
  const [language, setLanguage] = useState(state.settings.language);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const save = () => { dispatch({ type: 'settings', patch: { name: name.trim() || 'You', workspace: workspace.trim() || 'Your workspace', language } }); toast('Settings saved on this device'); };
  const exportState = () => { downloadFile('ydy-workspace.json', JSON.stringify(state, null, 2)); setMessage('Workspace exported. Keep the file somewhere you trust.'); setError(''); };
  const importFile = async (selected: File | undefined) => {
    setMessage(''); setError('');
    if (!selected) return;
    if (selected.size > 15_000_000) { setError('That file is too large. The limit is 15 MB.'); return; }
    try {
      const parsed = parseImport(await selected.text());
      dispatch({ type: 'import', state: parsed });
      setMessage(`Imported ${parsed.items.length} items and ${parsed.boards.length} boards.`);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'That file could not be imported.'); }
  };
  return <section className="p-page p-settings">
    <PageHeader title="Settings" subtitle="Everything here belongs to this device." />
    <Tabs values={['Workspace', 'Appearance', 'Data']} value={tab} onChange={setTab} />
    {tab === 'Workspace' && <div className="p-card p-settings-card">
      <Field label="Your name"><input className="field" value={name} maxLength={80} onChange={event => setName(event.target.value)} /></Field>
      <Field label="Workspace name"><input className="field" value={workspace} maxLength={80} onChange={event => setWorkspace(event.target.value)} /></Field>
      <Field label="Language" hint="Interface copy stays English in this build."><select className="field" value={language} onChange={event => setLanguage(event.target.value)}><option>English</option></select></Field>
      <button className="btn btn-primary" onClick={save}>Save</button>
    </div>}
    {tab === 'Appearance' && <div className="p-card p-settings-card">
      <div className="p-theme-row">{[['light', 'Paper', 'Warm off-white, calm contrast'], ['dark', 'Charcoal', 'Low light, same proportions']].map(([value, label, hint]) => <button key={value} className={`p-theme-tile ${state.settings.theme === value ? 'p-selected' : ''}`} onClick={() => { dispatch({ type: 'settings', patch: { theme: value as 'light' | 'dark' } }); toast(`${label} theme applied`); }} aria-pressed={state.settings.theme === value}><span className={`p-theme-preview ${value}`} /><strong>{label}</strong><small className="muted">{hint}</small></button>)}</div>
      <p className="muted">Type is Geist, the same family the reference product uses. Sizes and rhythm match a 272px sidebar and a 1440px canvas.</p>
    </div>}
    {tab === 'Data' && <div className="p-card p-settings-card">
      <div className="p-data-row"><div><h3>Export workspace</h3><p className="muted">A single JSON file with items, boards, plans, drafts, and chats.</p></div><button className="btn" onClick={exportState}><Icon name="arrow" size={16} />Export</button></div>
      <div className="p-data-row"><div><h3>Import workspace</h3><p className="muted">Version 1 files are validated before anything is replaced.</p></div><button className="btn" onClick={() => file.current?.click()}>Choose file</button><input ref={file} type="file" accept="application/json,.json" hidden onChange={event => { void importFile(event.target.files?.[0]); event.target.value = ''; }} /></div>
      <div className="p-data-row"><div><h3>Reset to samples</h3><p className="muted">Replaces your local workspace with the sample collection.</p></div><button className="btn danger" onClick={() => { dispatch({ type: 'import', state: workspaceReducer({ ...state, items: [] }, { type: 'import', state: state }) }); toast('Workspace reloaded from the current state'); }}>Reload</button></div>
      {message && <p className="p-success" role="status">{message}</p>}
      {error && <p className="p-error" role="alert">{error}</p>}
    </div>}
    <LocalNotice>Storage is the browser’s localStorage. Clearing site data deletes this workspace.</LocalNotice>
  </section>;
}
