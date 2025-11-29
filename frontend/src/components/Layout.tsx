import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export const Layout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-gray-200 flex justify-center font-sans">
      <div className="w-full max-w-[480px] bg-white min-h-screen shadow-2xl relative flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
           <Outlet />
        </div>
        {!isAuthPage && <BottomNav />}
      </div>
    </div>
  );
};
