export interface User {
  id: number;
  email: string;
  username: string;
  displayName: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  department?: string;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}

export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
  sort_order: number;
  children: Folder[];
}

export interface FolderPermission {
  id: number;
  user_id: number | null;
  can_read: boolean;
  can_write: boolean;
  username?: string;
  display_name?: string;
}

export interface FileItem {
  id: number;
  folder_id: number;
  original_name: string;
  mime_type: string;
  file_size: number;
  sort_order: number;
  created_at: string;
  uploaded_by_name: string;
  folder_name?: string;
}

export interface Answer {
  id: number;
  body: string;
  created_at: string;
  answerer_id: number;
  answerer_username: string;
  answerer_display_name: string;
}

export interface Question {
  id: number;
  body: string;
  is_resolved: boolean;
  created_at: string;
  asker_id: number;
  username: string;
  display_name: string;
  answers: Answer[];
}

export interface FaqItem {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
}

export interface FaqCategory {
  id: number;
  name: string;
  sort_order: number;
  items: FaqItem[];
}

export interface ApiResponse<T> {
  status: string;
  data: T;
  message?: string;
}

export interface PendingUser {
  id: number;
  email: string;
  username: string;
  display_name: string;
  department?: string;
  created_at: string;
}
