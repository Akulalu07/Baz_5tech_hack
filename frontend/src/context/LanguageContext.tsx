import { createContext, useContext, useState, type ReactNode } from 'react';

type Language = 'en' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    'profile.title': 'Profile',
    'profile.role': 'Role',
    'profile.balance': 'Coins',
    'profile.streak': 'Streak',
    'profile.tasks': 'Tasks Completed',
    'profile.logout': 'Logout',
    'profile.upload_avatar': 'Upload Avatar',
    'profile.settings': 'Settings',
    'profile.language': 'Language',
    'profile.stats': 'Statistics',
    'profile.errorUploading': 'Error uploading avatar',
    'shop.title': 'Shop',
    'shop.buy': 'Buy',
    'shop.email_prompt': 'Please enter your email to receive the item:',
    'shop.cancel': 'Cancel',
    'shop.confirm': 'Confirm',
    'shop.success': 'Purchase successful!',
    'shop.failed': 'Purchase failed.',
    'shop.email_required': 'Please enter your email.',
    'map.loading': 'Loading...',
    'map.start': 'START',
    'login.title': 'X5 Journey',
    'login.subtitle': 'Master IT skills the fun way!',
    'login.first_name': 'First Name',
    'login.last_name': 'Last Name',
    'login.phone': 'Phone Number',
    'login.start': 'Start Journey',
    'login.fill_all': 'Please fill in all fields',
    'login.failed': 'Login failed. Please try again.',
    'nav.map': 'Map',
    'nav.shop': 'Shop',
    'nav.leaderboard': 'Leaderboard',
    'nav.profile': 'Profile',
    'task.loading': 'Loading task...',
    'task.failed': 'Failed to load task',
    'task.continue': 'Continue',
    'task.try_again': 'Try Again',
    'task.select_answer': 'Select an answer',
    'leaderboard.title': 'Leaderboard',
    'leaderboard.coming_soon': 'Coming soon...',
  },
  ru: {
    'profile.title': 'Профиль',
    'profile.role': 'Роль',
    'profile.balance': 'Монеты',
    'profile.streak': 'Серия',
    'profile.tasks': 'Заданий выполнено',
    'profile.logout': 'Выйти',
    'profile.upload_avatar': 'Загрузить аватар',
    'profile.settings': 'Настройки',
    'profile.language': 'Язык',
    'profile.stats': 'Статистика',
    'profile.errorUploading': 'Ошибка загрузки аватара',
    'shop.title': 'Магазин',
    'shop.buy': 'Купить',
    'shop.email_prompt': 'Пожалуйста, введите ваш email для получения товара:',
    'shop.cancel': 'Отмена',
    'shop.confirm': 'Подтвердить',
    'shop.success': 'Покупка успешна!',
    'shop.failed': 'Ошибка покупки.',
    'shop.email_required': 'Пожалуйста, введите ваш email.',
    'map.loading': 'Загрузка...',
    'map.start': 'СТАРТ',
    'login.title': 'X5 Journey',
    'login.subtitle': 'Осваивай IT навыки играючи!',
    'login.first_name': 'Имя',
    'login.last_name': 'Фамилия',
    'login.phone': 'Номер телефона',
    'login.start': 'Начать путешествие',
    'login.fill_all': 'Пожалуйста, заполните все поля',
    'login.failed': 'Ошибка входа. Попробуйте снова.',
    'nav.map': 'Карта',
    'nav.shop': 'Магазин',
    'nav.leaderboard': 'Лидеры',
    'nav.profile': 'Профиль',
    'task.loading': 'Загрузка задания...',
    'task.failed': 'Не удалось загрузить задание',
    'task.continue': 'Продолжить',
    'task.try_again': 'Попробовать снова',
    'task.select_answer': 'Выберите ответ',
    'leaderboard.title': 'Таблица лидеров',
    'leaderboard.coming_soon': 'Скоро...',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string) => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
