import type { ChatMessage, Item, WorkspaceState } from '../types';

export interface Pillar { id: string; name: string; lens: string; claim: string; color: string; topics: string[] }
export interface StrategyData { title: string; mission: string; audience: string; becomes: string; enemy: string; story: string; beliefs: string[]; shapedBy: string[]; pillars: Pillar[] }
export interface ProductData { title: string; description: string; price: string; type: string; status: 'draft' | 'preview' }
export const STRATEGY_TAG = 'workspace-strategy';
export const PRODUCT_TAG = 'workspace-product';
export const PLAN_STAGES = ['Ideas', 'In progress', 'Review', 'Scheduled', 'Done'];
export const PLATFORMS = ['X', 'LinkedIn', 'Instagram', 'YouTube', 'Substack', 'Threads'];
export const uid = (): string => crypto.randomUUID();
export const now = (): string => new Date().toISOString();

export function filterSamples(items: Item[], query: string, platform: string, category: string): Item[] {
  const term = query.toLowerCase().trim();
  return items.filter(item => (platform === 'all' || item.platform === platform)
    && (category === 'all' || item.tags.includes(category))
    && `${item.title} ${item.content} ${item.author ?? ''} ${item.tags.join(' ')}`.toLowerCase().includes(term));
}

export function defaultStrategy(): StrategyData {
  return {
    title: 'The Focused Operator', mission: 'Help people give their best hours to work they can point to.',
    audience: 'People who are busy all day, but want to finish something that matters.',
    becomes: 'Someone with one finished thing and a daily practice that keeps producing.',
    enemy: 'Busyness that feels productive and leaves nothing behind.', story: '',
    beliefs: ['Two hours of real focus beat eight hours of busy.', 'Taste comes from reps, not talent.'],
    shapedBy: ['Cal Newport', 'Austin Kleon', 'Paul Graham'],
    pillars: [
      { id: 'writing', name: 'Writing that ships', lens: 'Through practice, not perfection', claim: 'Publishing unfinished work beats polishing private drafts.', color: '#609e81', topics: ['Daily writing habit', 'Finishing vs. perfecting', 'Personal essays'] },
      { id: 'focus', name: 'Focus for deep work', lens: 'For people whose phone gets their best hours', claim: 'Your attention is your most valuable resource.', color: '#9b88b1', topics: ['Weekly planning', 'Overloaded task lists', 'Attention span', 'Deep work rituals', 'Doomscrolling'] },
      { id: 'business', name: 'The one-person business', lens: 'With habits and digital products', claim: 'A finished product beats a big idea you keep planning.', color: '#d29483', topics: ['Building with AI', 'Selling digital products', 'Simple business systems'] },
    ],
  };
}

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(item => typeof item === 'string');
const fields = (value: unknown, keys: string[]): boolean => record(value) && keys.every(key => typeof value[key] === 'string');
const safeUrl = (value: unknown): boolean => value === undefined || (typeof value === 'string' && /^(https?:\/\/|\/assets\/eden\/)/.test(value));

export function readStrategy(item?: Item): StrategyData {
  if (!item) return defaultStrategy();
  try {
    const value: unknown = JSON.parse(item.content);
    if (!record(value) || !fields(value, ['title', 'mission', 'audience', 'becomes', 'enemy', 'story'])
      || !strings(value.beliefs) || !strings(value.shapedBy) || !Array.isArray(value.pillars)
      || !value.pillars.every(pillar => record(pillar) && fields(pillar, ['id', 'name', 'lens', 'claim', 'color']) && strings(pillar.topics))) return defaultStrategy();
    return value as unknown as StrategyData;
  } catch { return defaultStrategy(); }
}

export function strategyToItem(strategy: StrategyData, existing?: Item): Item {
  return { ...existing, id: existing?.id ?? uid(), kind: 'document', title: strategy.title, content: JSON.stringify(strategy), createdAt: existing?.createdAt ?? now(), tags: [STRATEGY_TAG] };
}

export function readProduct(item: Item): ProductData | null {
  if (!item.tags.includes(PRODUCT_TAG)) return null;
  try {
    const value: unknown = JSON.parse(item.content);
    if (!record(value) || !fields(value, ['title', 'description', 'price', 'type']) || !['draft', 'preview'].includes(String(value.status))) return null;
    return value as unknown as ProductData;
  } catch { return null; }
}

export function productToItem(product: ProductData, existing?: Item): Item {
  return { ...existing, id: existing?.id ?? uid(), kind: 'document', title: product.title, content: JSON.stringify(product), createdAt: existing?.createdAt ?? now(), tags: [PRODUCT_TAG] };
}

export function parseImport(text: string): WorkspaceState {
  if (text.length > 15_000_000) throw new Error('This workspace file is too large (15 MB maximum).');
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error('Choose a valid workspace JSON file.'); }
  if (!record(value) || value.version !== 1 || !record(value.settings)
    || !fields(value.settings, ['workspace', 'name', 'theme', 'language']) || !['light', 'dark'].includes(String(value.settings.theme))) {
    throw new Error('This is not a supported version 1 workspace.');
  }
  const validators: Record<string, (entry: unknown) => boolean> = {
    items: entry => record(entry) && fields(entry, ['id', 'kind', 'title', 'content', 'createdAt']) && ['video', 'image', 'document', 'card', 'link', 'table'].includes(String(entry.kind))
      && strings(entry.tags) && ['image', 'avatar', 'url'].every(key => safeUrl(entry[key]))
      && ['trashed', 'starred'].every(key => entry[key] === undefined || typeof entry[key] === 'boolean')
      && ['author', 'platform', 'boardId', 'note', 'color', 'duration', 'views', 'outlier'].every(key => entry[key] === undefined || typeof entry[key] === 'string'),
    boards: entry => fields(entry, ['id', 'title', 'description', 'color', 'icon']),
    plans: entry => fields(entry, ['id', 'title', 'stage', 'pillar', 'platform', 'date', 'notes']),
    drafts: entry => record(entry) && fields(entry, ['id', 'text', 'platform', 'status', 'date']) && ['draft', 'scheduled'].includes(String(entry.status)),
    messages: entry => record(entry) && fields(entry, ['id', 'role', 'content']) && ['user', 'assistant'].includes(String(entry.role)) && (entry.error === undefined || typeof entry.error === 'boolean'),
    customAIs: entry => fields(entry, ['id', 'name', 'description', 'icon', 'instructions']),
  };
  for (const [key, validate] of Object.entries(validators)) {
    const entries = value[key];
    if (!Array.isArray(entries) || entries.length > 10_000 || !entries.every(validate)) throw new Error(`Invalid ${key} in workspace file. Nothing was imported.`);
  }
  return value as unknown as WorkspaceState;
}

export function buildChatContext(items: Item[], selected: string[], instructions: string): string {
  return [instructions, ...items.filter(item => selected.includes(item.id) && !item.trashed)
    .map(item => `Document: ${item.title}\n${item.content.slice(0, 6000)}`)].filter(Boolean).join('\n\n').slice(0, 30_000);
}

export async function requestChat(messages: Pick<ChatMessage, 'role' | 'content'>[], context: string, signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<string> {
  const response = await fetcher('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal, body: JSON.stringify({ messages, context }) });
  let result: unknown;
  try { result = await response.json(); } catch { throw new Error('The AI service returned invalid JSON. Please try again.'); }
  if (record(result) && result.ok === false && typeof result.message === 'string') throw new Error(result.message);
  if (!response.ok) throw new Error(`The AI service is unavailable (${response.status}). Please try again.`);
  if (!record(result) || result.ok !== true || typeof result.text !== 'string' || !result.text.trim()) throw new Error('The AI service returned an empty response. Please try again.');
  return result.text;
}

export function downloadFile(name: string, content: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
