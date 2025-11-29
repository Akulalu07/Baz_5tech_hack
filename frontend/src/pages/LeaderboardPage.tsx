import { useLanguage } from '../context/LanguageContext';

export const LeaderboardPage = () => {
  const { t } = useLanguage();
  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('leaderboard.title')}</h1>
      <p className="text-gray-500">{t('leaderboard.coming_soon')}</p>
    </div>
  );
};
