import { Home, ShoppingBag, Trophy, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

export const BottomNav = () => {
  const location = useLocation();
  
  const tabs = [
    { icon: Home, label: 'Map', path: '/map' },
    { icon: ShoppingBag, label: 'Shop', path: '/shop' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 px-4 py-2 flex justify-around items-center z-50 max-w-[480px] mx-auto pb-6 pt-3">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <Link key={tab.path} to={tab.path} className="flex flex-col items-center p-2 relative">
            <tab.icon 
              size={28} 
              className={clsx("transition-colors mb-1", isActive ? "text-x5green fill-current" : "text-gray-400")} 
              strokeWidth={isActive ? 2.5 : 2}
            />
            {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 bg-x5green rounded-full" />
            )}
          </Link>
        );
      })}
    </div>
  );
};
