export type Page = 'library' | 'boards' | 'board' | 'discover' | 'strategy' | 'planner' | 'publish' | 'chat' | 'custom-ai' | 'analytics' | 'store' | 'settings' | 'trash';
export type ItemKind = 'video' | 'image' | 'document' | 'card' | 'link' | 'table';
export interface Item {
  id: string; kind: ItemKind; title: string; content: string; createdAt: string;
  image?: string; avatar?: string; author?: string; platform?: string; url?: string;
  boardId?: string; tags: string[]; note?: string; starred?: boolean; trashed?: boolean;
  color?: string; duration?: string; views?: string; outlier?: string;
}
export interface Board { id: string; title: string; description: string; color: string; icon: string }
export interface PlanCard { id: string; title: string; stage: string; pillar: string; platform: string; date: string; notes: string }
export interface Draft { id: string; text: string; platform: string; status: 'draft' | 'scheduled'; date: string }
export interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; error?: boolean }
export interface CustomAI { id: string; name: string; description: string; icon: string; instructions: string }
export interface WorkspaceState {
  version: 1; items: Item[]; boards: Board[]; plans: PlanCard[]; drafts: Draft[];
  messages: ChatMessage[]; customAIs: CustomAI[];
  settings: { workspace: string; name: string; theme: 'light' | 'dark'; language: string };
}
export type Action =
  | { type: 'add-item'; item: Item }
  | { type: 'update-item'; id: string; patch: Partial<Item> }
  | { type: 'trash-item'; id: string }
  | { type: 'restore-item'; id: string }
  | { type: 'add-board'; board: Board }
  | { type: 'update-board'; id: string; patch: Partial<Board> }
  | { type: 'add-plan'; card: PlanCard }
  | { type: 'update-plan'; id: string; patch: Partial<PlanCard> }
  | { type: 'save-draft'; draft: Draft }
  | { type: 'delete-draft'; id: string }
  | { type: 'add-message'; message: ChatMessage }
  | { type: 'clear-messages' }
  | { type: 'add-ai'; ai: CustomAI }
  | { type: 'settings'; patch: Partial<WorkspaceState['settings']> }
  | { type: 'import'; state: WorkspaceState };
