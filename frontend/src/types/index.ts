export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  balance: number;
  current_streak: number;
  completed_tasks_count?: number;
  role: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  type: 'quiz' | 'subscription' | 'survey';
  reward: number;
  status: 'locked' | 'available' | 'completed';
  question?: string;
  options?: string[];
  correct_answer?: string;
  language: 'en' | 'ru';
}

export interface ShopItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  stock: number;
}
