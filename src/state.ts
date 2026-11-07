import type { Action, Item, WorkspaceState } from './types';

function addUnique<T extends { id: string }>(values: T[], value: T): T[] {
  return values.some(existing => existing.id === value.id) ? values : [...values, value];
}
function patchById<T extends { id: string }>(values: T[], id: string, patch: Partial<T>): T[] {
  return values.map(value => value.id === id ? { ...value, ...patch, id } : value);
}
export function workspaceReducer(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case 'add-item': return { ...state, items: addUnique(state.items, action.item) };
    case 'update-item': return { ...state, items: patchById(state.items, action.id, action.patch) };
    case 'trash-item': return { ...state, items: patchById(state.items, action.id, { trashed: true }) };
    case 'restore-item': return { ...state, items: patchById(state.items, action.id, { trashed: false }) };
    case 'add-board': return { ...state, boards: addUnique(state.boards, action.board) };
    case 'update-board': return { ...state, boards: patchById(state.boards, action.id, action.patch) };
    case 'add-plan': return { ...state, plans: addUnique(state.plans, action.card) };
    case 'update-plan': return { ...state, plans: patchById(state.plans, action.id, action.patch) };
    case 'save-draft': return { ...state, drafts: state.drafts.some(draft => draft.id === action.draft.id) ? patchById(state.drafts, action.draft.id, action.draft) : [...state.drafts, action.draft] };
    case 'delete-draft': return { ...state, drafts: state.drafts.filter(draft => draft.id !== action.id) };
    case 'add-message': return { ...state, messages: addUnique(state.messages, action.message) };
    case 'clear-messages': return { ...state, messages: [] };
    case 'add-ai': return { ...state, customAIs: addUnique(state.customAIs, action.ai) };
    case 'settings': return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'import': return parseWorkspace(JSON.stringify(action.state), state);
    default: return state;
  }
}

const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const strings = (value: Record<string, unknown>, keys: string[]) => keys.every(key => typeof value[key] === 'string');
function validRows(value: unknown, keys: string[]): boolean {
  return Array.isArray(value) && value.length <= 10000 && value.every(row => object(row) && strings(row, keys));
}
export function parseWorkspace(value: string | null, fallback: WorkspaceState): WorkspaceState {
  if (!value) return fallback;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!object(parsed) || parsed.version !== 1 || !object(parsed.settings)) return fallback;
    if (!strings(parsed.settings, ['workspace', 'name', 'language']) || !['light', 'dark'].includes(String(parsed.settings.theme))) return fallback;
    if (!validRows(parsed.items, ['id', 'kind', 'title', 'content', 'createdAt'])) return fallback;
    if (!(parsed.items as Record<string, unknown>[]).every(row => ['video', 'image', 'document', 'card', 'link', 'table'].includes(String(row.kind)) && Array.isArray(row.tags) && row.tags.every(tag => typeof tag === 'string'))) return fallback;
    if (!validRows(parsed.boards, ['id', 'title', 'description', 'color', 'icon']) || !validRows(parsed.plans, ['id', 'title', 'stage', 'pillar', 'platform', 'date', 'notes'])) return fallback;
    if (!validRows(parsed.drafts, ['id', 'text', 'platform', 'status', 'date']) || !validRows(parsed.messages, ['id', 'role', 'content']) || !validRows(parsed.customAIs, ['id', 'name', 'description', 'icon', 'instructions'])) return fallback;
    return parsed as unknown as WorkspaceState;
  } catch { return fallback; }
}
export function filterItems(state: WorkspaceState, query: string, kind = 'all', boardId?: string, trashed = false): Item[] {
  const terms = query.trim().toLocaleLowerCase();
  return state.items.filter(item => Boolean(item.trashed) === trashed && (kind === 'all' || item.kind === kind) && (!boardId || item.boardId === boardId) && (!terms || [item.title, item.content, item.author ?? '', ...item.tags].join(' ').toLocaleLowerCase().includes(terms)));
}
