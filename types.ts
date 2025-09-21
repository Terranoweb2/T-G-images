
export enum Plan {
  Free = 'Free',
  Medium = 'Medium',
  Pro = 'Pro',
}

export interface User {
  username: string;
  email: string;
  plan: Plan;
  generationsLeft: number;
}

export enum Page {
  Landing,
  Auth,
  Creator,
  Subscription,
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  sourceImage?: {
    base64: string;
    mimeType: string;
  };
  generatedMedia: {
    type: 'image' | 'video';
    base64?: string;
    mimeType?: string;
  };
}
