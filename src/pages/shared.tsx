import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowUpRight, X, Sparkles } from 'lucide-react';

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return <header className="p-header"><div><h1 className="page-title">{title}</h1>{subtitle && <p className="muted p-subtitle">{subtitle}</p>}</div><div className="p-actions">{children}</div></header>;
}
export function LocalNotice({ children }: { children: ReactNode }) {
  return <div className="p-notice"><span className="p-status-dot" /><span>{children}</span></div>;
}
export function Empty({ title, text, children, icon }: { title: string; text: string; children?: ReactNode; icon?: ReactNode }) {
  return <div className="empty-state p-empty">{icon ?? <Sparkles size={25} strokeWidth={1.3} />}<h2>{title}</h2><p className="muted">{text}</p>{children && <div className="p-actions">{children}</div>}</div>;
}
export function Tabs({ values, value, onChange }: { values: string[]; value: string; onChange: (value: string) => void }) {
  return <div className="p-tabs" role="tablist">{values.map(tab => <button key={tab} type="button" role="tab" aria-selected={value === tab} className={value === tab ? 'p-tab p-active' : 'p-tab'} onClick={() => onChange(tab)}>{tab}</button>)}</div>;
}
export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLElement>('input,textarea,select,button')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close.current();
      if (event.key !== 'Tab') return;
      const nodes = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),a[href]');
      if (!nodes?.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); previous?.focus(); };
  }, []);
  return <div className="p-modal-backdrop" onClick={event => { if (event.currentTarget === event.target) onClose(); }}><div className={`p-modal ${wide ? 'p-modal-wide' : ''}`} ref={dialog} role="dialog" aria-modal="true" aria-label={title}><header className="p-modal-header"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={18} /></button></header>{children}</div></div>;
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field p-field"><span>{label}</span>{children}{hint && <small className="muted">{hint}</small>}</label>;
}
export function IntegrationNotice({ service, onClose }: { service: string; onClose: () => void }) {
  return <Modal title={`${service} connection`} onClose={onClose}><div className="p-modal-body"><div className="p-service-icon"><ArrowUpRight size={24} /></div><h3>No external account is connected</h3><p className="muted">This local workspace does not authorize {service} accounts. Your drafts and plans stay on this device. Nothing will be published, emailed, or charged.</p><button className="btn" onClick={onClose}>Back to workspace</button></div></Modal>;
}
