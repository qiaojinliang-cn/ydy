import { useState } from 'react';
import { useWorkspace } from '../context';
import { Icon } from '../ui';
import { Empty, Field, LocalNotice, Modal, PageHeader } from './shared';
import { productToItem, readProduct, PRODUCT_TAG, uid, type ProductData } from './page-model';

const TYPES = ['Custom AI', 'Course', 'Digital download', 'Newsletter'];
const BLANK: ProductData = { title: '', description: '', price: '', type: 'Digital download', status: 'draft' };

export function StorePage() {
  const { state, dispatch, toast } = useWorkspace();
  const [editing, setEditing] = useState<{ id?: string; value: ProductData } | null>(null);
  const products = state.items.map(item => ({ item, data: readProduct(item) })).filter((entry): entry is { item: typeof state.items[number]; data: ProductData } => entry.data !== null && !entry.item.trashed);
  const save = () => {
    if (!editing || !editing.value.title.trim()) return;
    const existing = editing.id ? state.items.find(item => item.id === editing.id) : undefined;
    const item = productToItem({ ...editing.value, title: editing.value.title.trim() }, existing);
    dispatch(existing ? { type: 'update-item', id: existing.id, patch: { title: item.title, content: item.content, tags: item.tags } } : { type: 'add-item', item });
    toast(existing ? 'Draft updated' : 'Draft created');
    setEditing(null);
  };
  return <section className="p-page p-store">
    <PageHeader title="Your store" subtitle="Package what you know. Drafts stay local until you publish them.">
      <button className="btn" onClick={() => setEditing({ value: { ...BLANK } })}><Icon name="plus" size={16} />New product</button>
    </PageHeader>
    <LocalNotice>Payments and accounts are not connected. Nothing here can charge a card or email a buyer.</LocalNotice>
    {!products.length ? <Empty title="Nothing for sale yet" text="Turn one part of your practice into something small and useful."><button className="btn" onClick={() => setEditing({ value: { ...BLANK } })}>Draft a product</button></Empty>
      : <div className="p-product-grid">{products.map(({ item, data }) => <article className="p-product" key={item.id}>
        <div className="p-product-cover"><Icon name={data.type === 'Course' ? 'book' : data.type === 'Custom AI' ? 'sparkles' : 'store'} size={26} /></div>
        <div className="p-product-body"><div className="p-product-top"><span className="p-tag">{data.type}</span><span className="p-pill">{data.status === 'draft' ? 'Draft' : 'Preview'}</span></div><h2>{data.title}</h2><p className="muted">{data.description || 'No description yet.'}</p><footer><strong>{data.price ? `$${data.price}` : 'Free'}</strong><div className="p-actions"><button className="btn btn-ghost" onClick={() => setEditing({ id: item.id, value: data })}>Edit</button></div></footer></div>
      </article>)}</div>}
    <div className="p-callout"><div><h3>The four-step editor</h3><p className="muted">Offer, knowledge, page, publish. YDY keeps the same shape without a live checkout.</p></div><button className="btn" onClick={() => setEditing({ value: { ...BLANK } })}>Start from a blank draft</button></div>
    {editing && <Modal title={editing.id ? 'Edit draft' : 'New product draft'} onClose={() => setEditing(null)} wide><form className="p-modal-body" onSubmit={event => { event.preventDefault(); save(); }}>
      <Field label="Title"><input className="field" autoFocus required value={editing.value.title} maxLength={110} onChange={event => setEditing({ ...editing, value: { ...editing.value, title: event.target.value } })} /></Field>
      <Field label="Description"><textarea className="field" rows={4} value={editing.value.description} maxLength={600} onChange={event => setEditing({ ...editing, value: { ...editing.value, description: event.target.value } })} /></Field>
      <div className="p-form-row"><Field label="Price (USD)"><input className="field" inputMode="decimal" value={editing.value.price} placeholder="29" onChange={event => setEditing({ ...editing, value: { ...editing.value, price: event.target.value.replace(/[^\d.]/g, '') } })} /></Field>
      <Field label="Type"><select className="field" value={editing.value.type} onChange={event => setEditing({ ...editing, value: { ...editing.value, type: event.target.value } })}>{TYPES.map(value => <option key={value}>{value}</option>)}</select></Field>
      <Field label="Status"><select className="field" value={editing.value.status} onChange={event => setEditing({ ...editing, value: { ...editing.value, status: event.target.value as ProductData['status'] } })}><option value="draft">Draft</option><option value="preview">Preview</option></select></Field></div>
      <p className="muted">This creates a workspace document tagged {PRODUCT_TAG}. No checkout is created.</p>
      <button className="btn btn-primary" type="submit">Save draft</button>
    </form></Modal>}
  </section>;
}
