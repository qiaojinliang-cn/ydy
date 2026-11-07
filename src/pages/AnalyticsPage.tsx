import { useMemo } from 'react';
import { useWorkspace } from '../context';
import { Icon } from '../ui';
import { Empty, LocalNotice, PageHeader } from './shared';

const BAR_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function AnalyticsPage() {
  const { state, dispatch, navigate } = useWorkspace();
  const live = state.items.filter(item => !item.trashed);
  const stats = useMemo(() => ({
    saved: live.length,
    boards: state.boards.length,
    plans: state.plans.length,
    drafts: state.drafts.length,
    favorites: live.filter(item => item.starred).length,
  }), [live, state.boards.length, state.plans.length, state.drafts.length]);
  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    live.forEach(item => item.tags.filter(tag => !tag.startsWith('discover:') && !tag.startsWith('workspace-')).forEach(tag => counts.set(tag, (counts.get(tag) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [live]);
  const max = Math.max(1, ...topics.map(([, count]) => count));
  return <section className="p-page">
    <PageHeader title="Analytics" subtitle="What you actually did, counted on this device.">
      <button className="btn" onClick={() => navigate('library')}><Icon name="library" size={16} />Open library</button>
    </PageHeader>
    <LocalNotice>Live social analytics need a connected paid account. These numbers describe your local workspace only.</LocalNotice>
    <div className="p-stat-grid">{[['Saved items', stats.saved], ['Boards', stats.boards], ['Plan cards', stats.plans], ['Drafts', stats.drafts], ['Favorites', stats.favorites]].map(([label, value]) => <div className="p-stat" key={String(label)}><span className="muted">{label}</span><strong>{value}</strong></div>)}</div>
    {topics.length ? <div className="p-two-col">
      <article className="p-card"><header className="p-card-head"><div><h2>Your topics</h2><p className="muted">Where your saved attention goes.</p></div></header><div className="p-bars">{topics.map(([topic, count]) => <div className="p-bar-row" key={topic}><span>{topic}</span><div className="p-bar-track"><i style={{ width: `${(count / max) * 100}%` }} /></div><span className="p-count">{count}</span></div>)}</div></article>
      <article className="p-card"><header className="p-card-head"><div><h2>This week</h2><p className="muted">A quiet rhythm beats a loud one.</p></div></header><div className="p-week">{BAR_DAYS.map((day, index) => <div className="p-week-col" key={day}><i style={{ height: `${20 + ((stats.saved + index * 3) % 7) * 9}%` }} /><span>{day}</span></div>)}</div><p className="muted p-foot-note">Illustrative shape from your local totals, not a live chart.</p></article>
    </div> : <Empty title="No activity to measure yet" text="Save a few things and this page starts to mean something."><button className="btn" onClick={() => navigate('discover')}>Browse samples</button></Empty>}
    <div className="p-actions"><button className="btn btn-ghost" onClick={() => dispatch({ type: 'update-item', id: live[0]?.id ?? '', patch: {} })}>Refresh local totals</button></div>
  </section>;
}
