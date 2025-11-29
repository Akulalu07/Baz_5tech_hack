import React, { useEffect, useState } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { api } from '../api/endpoints';
import type { User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useGame } from '../context/GameContext';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const ProfilePage: React.FC = () => {
  const { user: tgUser } = useTelegram();
  const { t, language, setLanguage } = useLanguage();
  const { logout } = useGame();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await api.user.me();
        // @ts-expect-error - types are now aligned but keeping for safety during transition
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [tgUser]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0]) return;

    const file = event.target.files[0];
    setUploading(true);

    try {
      const response = await api.user.uploadAvatar(file);
      if (user) {
        // Force a cache bust by adding a timestamp
        setUser({ ...user, photo_url: `${response.photo_url}?t=${new Date().getTime()}` });
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(t('profile.errorUploading'));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
              {user?.photo_url ? (
                <img 
                  src={user.photo_url.startsWith('http') ? user.photo_url : `${API_URL}${user.photo_url}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <label 
              htmlFor="avatar-upload" 
              className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-blue-600 transition-colors"
            >
              {uploading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </label>
            <input 
              id="avatar-upload" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleAvatarChange}
              disabled={uploading}
            />
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-gray-500">@{user?.username}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('profile.settings')}</h3>
        
        <div className="flex items-center justify-between py-2 border-b border-gray-100">
          <span className="text-gray-600">{t('profile.language')}</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                language === 'en' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('ru')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                language === 'ru' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Русский
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">{t('profile.stats')}</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{user?.balance || 0}</div>
            <div className="text-sm text-gray-500">{t('profile.balance')}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{user?.current_streak || 0}</div>
            <div className="text-sm text-gray-500">{t('profile.streak')}</div>
          </div>
        </div>
      </div>

      <button 
        onClick={handleLogout}
        className="w-full py-3 text-red-500 font-medium bg-white rounded-xl shadow-sm hover:bg-red-50 transition-colors"
      >
        {t('profile.logout')}
      </button>
    </div>
  );
};
