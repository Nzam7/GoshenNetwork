export enum SessionState {
  GREETING = 'GREETING',
  CATEGORY_MENU = 'CATEGORY_MENU',
  SEARCH_RESULTS = 'SEARCH_RESULTS',
}

export interface UserSession {
  userId: string;
  state: SessionState;
  lastCategory?: string;
  lastKeyword?: string;
  updatedAt: Date;
}
