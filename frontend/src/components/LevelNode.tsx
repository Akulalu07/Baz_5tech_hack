import { motion } from 'framer-motion';
import { Check, Star, Lock } from 'lucide-react';
import type { Task } from '../api/endpoints';
import { clsx } from 'clsx';
import { useLanguage } from '../context/LanguageContext';

interface LevelNodeProps {
  level: Task;
  onClick: (level: Task) => void;
}

export const LevelNode = ({ level, onClick }: LevelNodeProps) => {
  const { t } = useLanguage();
  const isLocked = level.status === 'locked';
  const isCompleted = level.status === 'completed';
  const isActive = level.status === 'available';

  return (
    <div className={clsx(
      "flex justify-center py-4 relative",
      level.position === 0 && "-translate-x-16",
      level.position === 2 && "translate-x-16"
    )}>
      <motion.button
        whileTap={!isLocked ? { scale: 0.9, y: 5 } : {}}
        animate={isActive ? { scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1.5 } } : {}}
        onClick={() => !isLocked && onClick(level)}
        className={clsx(
          "w-20 h-20 rounded-full flex items-center justify-center border-b-8 transition-colors relative z-10 shadow-lg",
          isLocked ? "bg-gray-200 border-gray-300 text-gray-400" : 
          isCompleted ? "bg-yellow-400 border-yellow-600 text-white" : 
          "bg-x5green border-x5green-dark text-white"
        )}
      >
        {isLocked && <Lock size={32} />}
        {isCompleted && <Check size={40} strokeWidth={4} />}
        {isActive && <Star size={40} fill="currentColor" />}
        
        {/* Crown for active level */}
        {isActive && (
            <div className="absolute -top-10 bg-white px-3 py-1 rounded-xl border-2 border-gray-200 text-xs font-bold text-x5green shadow-sm animate-bounce whitespace-nowrap">
                {t('map.start')}
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-gray-200 rotate-45"></div>
            </div>
        )}
      </motion.button>
    </div>
  );
};
