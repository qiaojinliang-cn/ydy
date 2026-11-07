import { createContext, useContext, type Dispatch } from 'react';
import type { Action, Item, ItemKind, Page, WorkspaceState } from './types';

export interface WorkspaceContextValue {
  state: WorkspaceState; dispatch: Dispatch<Action>;
  navigate: (page: Page, boardId?: string) => void;
  toast: (message: string) => void;
  openItem: (item: Item) => void;
  openInPane: (item: Item) => void;
  newItem: (kind: ItemKind) => void;
}
export const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('Workspace provider is missing');
  return context;
}
