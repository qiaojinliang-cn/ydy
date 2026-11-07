import { describe, expect, it, vi } from 'vitest';
import type { Item, WorkspaceState } from '../types';
import { filterSamples, readStrategy, strategyToItem, readProduct, productToItem, parseImport, requestChat, buildChatContext } from './page-model';

const item: Item = { id: 'one', kind: 'video', title: 'Build a writing habit', content: 'A local sample about creative work.', createdAt: '2026-11-07', platform: 'YouTube', tags: ['Writing'] };
const state: WorkspaceState = { version: 1, items: [item], boards: [], plans: [], drafts: [], messages: [], customAIs: [], settings: { workspace: 'Studio', name: 'YG', theme: 'light', language: 'en' } };

describe('local discovery', () => {
  it('filters across text, platform and category without mutating samples', () => {
    const samples = [item, { ...item, id: 'two', platform: 'X', tags: ['Focus'] }];
    expect(filterSamples(samples, 'WRITING', 'YouTube', 'Writing')).toEqual([item]);
    expect(filterSamples(samples, '', 'all', 'Focus')).toHaveLength(1);
    expect(filterSamples(samples, 'missing', 'all', 'all')).toEqual([]);
    expect(samples).toHaveLength(2);
  });
});

describe('strategy and store records', () => {
  it('round trips an editable strategy through an ordinary workspace document', () => {
    const strategy = { ...readStrategy(), title: 'My studio', mission: 'Make useful things' };
    const saved = strategyToItem(strategy);
    expect(saved.tags).toContain('workspace-strategy');
    expect(readStrategy(saved)).toEqual(strategy);
    expect(strategyToItem(strategy, saved).id).toBe(saved.id);
  });
  it('recovers malformed strategy records without crashing', () => {
    expect(readStrategy({ ...item, content: 'invalid json' }).pillars.length).toBeGreaterThan(0);
    expect(readStrategy({ ...item, content: '{"title":12}' }).title).toBe('The Focused Operator');
  });
  it('round trips a local product and rejects malformed metadata', () => {
    const product = { title: 'Writing kit', description: 'A local workbook', price: '29', type: 'Digital download', status: 'draft' as const };
    const saved = productToItem(product);
    expect(readProduct(saved)).toEqual(product);
    expect(productToItem(product, saved).id).toBe(saved.id);
    expect(readProduct(item)).toBeNull();
    expect(readProduct({ ...item, content: '{}' })).toBeNull();
  });
});

describe('workspace import boundary', () => {
  it('accepts the versioned workspace without altering its data', () => {
    expect(parseImport(JSON.stringify(state))).toEqual(state);
  });
  it.each(['{}', '{', 'null', '{"version":2}'])('rejects malformed import %s', value => {
    expect(() => parseImport(value)).toThrow();
  });
  it('rejects corrupt nested records and unsafe media paths', () => {
    expect(() => parseImport(JSON.stringify({ ...state, settings: { ...state.settings, theme: 'rainbow' } }))).toThrow();
    expect(() => parseImport(JSON.stringify({ ...state, plans: [{ id: 'x' }] }))).toThrow();
    expect(() => parseImport(JSON.stringify({ ...state, items: [{ ...item, image: 'javascript:alert(1)' }] }))).toThrow();
  });
});

describe('chat API contract', () => {
  it('sends only role/content messages and explicit context to the actual endpoint', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, text: 'A real answer' }), { status: 200 }));
    const signal = new AbortController().signal;
    expect(await requestChat([{ role: 'user', content: 'Hello' }], 'Local context', signal, fetcher)).toBe('A real answer');
    expect(fetcher).toHaveBeenCalledWith('/api/chat', expect.objectContaining({ method: 'POST', signal, body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }], context: 'Local context' }) }));
  });
  it('surfaces configured-service and invalid-response errors, never a fake response', async () => {
    const signal = new AbortController().signal;
    const unavailable = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: false, message: 'AI is not configured' }), { status: 503 }));
    await expect(requestChat([], '', signal, unavailable)).rejects.toThrow('AI is not configured');
    const malformed = vi.fn().mockResolvedValue(new Response('not JSON', { status: 200 }));
    await expect(requestChat([], '', signal, malformed)).rejects.toThrow('invalid JSON');
    const empty = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, text: '' }), { status: 200 }));
    await expect(requestChat([], '', signal, empty)).rejects.toThrow('empty response');
  });
  it('keeps aborts cancellable and does not silently retry', async () => {
    const fetcher = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));
    await expect(requestChat([], '', new AbortController().signal, fetcher)).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('shares only explicitly selected items, excluding trashed and unselected content', () => {
    const context = buildChatContext([item, { ...item, id: 'two', title: 'Private note' }], ['one'], 'Be concise');
    expect(context).toContain('Build a writing habit');
    expect(context).not.toContain('Private note');
    expect(context).toContain('Be concise');
    expect(buildChatContext([{ ...item, trashed: true }], ['one'], '')).not.toContain(item.title);
  });
});
