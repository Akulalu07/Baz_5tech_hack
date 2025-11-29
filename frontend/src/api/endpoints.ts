import { client, adminClient } from './client';

// --- Types ---

export interface AuthResponse {
  token: string;
}

export interface UserProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  photo_url: string;
  balance: number;
  current_streak: number;
  completed_tasks_count: number;
  role: string;
}

export interface QuestionItem {
  type?: 'choice' | 'text';
  text: string;
  options: string[];
  correct_answer?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  type: string;
  status: 'locked' | 'available' | 'completed';
  position: number;
  reward: number;
  question?: string;
  options?: string[];
  correct_answer?: string;
  questions?: QuestionItem[];
  language?: string;
}

export interface SubmitTaskResponse {
  success: boolean;
  earned: number;
  new_balance: number;
}

export interface BuyItemResponse {
  purchase_id: string;
}

export interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
}

// --- Endpoints ---

export interface TelegramAuthRequest {
  hash: string;
  user_id: number;
  username: string;
  first_name: string;
  last_name?: string;
  photo_url?: string;
  auth_date: number;
}

export interface PhoneAuthRequest {
  first_name: string;
  last_name: string;
  phone_number: string;
}

export interface TaskDetail {
  id: number;
  question: string;
  options: string[];
  type: string;
  questions?: QuestionItem[];
  correct_answer?: string;
}

export const api = {
  auth: {
    telegram: async (data: TelegramAuthRequest) => {
      const response = await client.post<AuthResponse>('/api/auth/telegram', data);
      return response.data;
    },
    phone: async (data: PhoneAuthRequest) => {
      const response = await client.post<AuthResponse>('/api/auth/phone', data);
      return response.data;
    },
  },
  user: {
    me: async () => {
      const { data } = await client.get<UserProfile>('/api/user/me');
      return data;
    },
    uploadAvatar: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await client.post<{ photo_url: string }>('/api/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    },
  },
  tasks: {
    list: async () => {
      const { data } = await client.get<Task[]>('/api/tasks');
      return data;
    },
    get: async (taskId: number) => {
      const { data } = await client.get<TaskDetail>(`/api/tasks/${taskId}`);
      return data;
    },
    submit: async (taskId: number, answer?: string, answerIndex?: number) => {
      const { data } = await client.post<SubmitTaskResponse>(`/api/tasks/${taskId}/submit`, { answer, answer_index: answerIndex });
      return data;
    },
  },
  shop: {
    items: async () => {
      const { data } = await client.get<ShopItem[]>('/api/shop/items');
      return data;
    },
    buy: async (itemId: number, email: string) => {
      const { data } = await client.post<BuyItemResponse>('/api/shop/buy', { item_id: itemId, email });
      return data;
    },
  },
  admin: {
    login: async (username: string, password: string) => {
      const { data } = await client.post<AuthResponse>('/api/admin/login', { username, password });
      return data;
    },
    getMetrics: async () => {
      const { data } = await adminClient.get<AdminMetricsResponse>('/api/admin/metrics');
      return data;
    },
    getUsers: async () => {
      const { data } = await adminClient.get<AdminUserResponse[]>('/api/admin/users');
      return data;
    },
    getTasks: async () => {
      const { data } = await adminClient.get<AdminTaskResponse[]>('/api/admin/tasks');
      return data;
    },
    createTask: async (task: CreateTaskRequest) => {
      const { data } = await adminClient.post<AdminTaskResponse>('/api/admin/tasks', task);
      return data;
    },
    updateTask: async (taskId: number, task: UpdateTaskRequest) => {
      const { data } = await adminClient.put<AdminTaskResponse>(`/api/admin/tasks/${taskId}`, task);
      return data;
    },
    deleteTask: async (taskId: number) => {
      await adminClient.delete(`/api/admin/tasks/${taskId}`);
    },
  },
};

// Admin types
export interface AdminMetricsResponse {
  total_users: number;
  total_tasks: number;
  total_completed_tasks: number;
  total_purchases: number;
  total_revenue: number;
  active_users_today: number;
  avg_tasks_per_user: number;
}

export interface AdminUserResponse {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  balance: number;
  current_streak: number;
  completed_tasks_count: number;
  role: string;
  created_at: string;
}

export interface AdminTaskResponse {
  id: number;
  title: string;
  description: string;
  type: string;
  question: string;
  options: string[];
  correct_answer: string;
  reward: number;
  position: number;
  language: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  type: string;
  question?: string;
  options?: string[];
  correct_answer?: string;
  reward: number;
  position?: number;
  language?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  type?: string;
  question?: string;
  options?: string[];
  correct_answer?: string;
  reward?: number;
  position?: number;
  language?: string;
}
