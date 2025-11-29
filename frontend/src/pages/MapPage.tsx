import { useGame } from '../context/GameContext';
import { LevelNode } from '../components/LevelNode';
import { Flame, Coins } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { TaskModal } from '../components/TaskModal';
import { motion, type Variants } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

export const MapPage = () => {
  const { userBalance, userStreak, tasks, isLoading } = useGame();
  const { language, t } = useLanguage();
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHeight, setSvgHeight] = useState(0);

  // Filter tasks by language
  const filteredTasks = tasks.filter(task => task.language === language || !task.language || task.language === 'en'); // Fallback to 'en' if no language set or match

  // Calculate SVG path based on levels
  // Assuming each level row is roughly 120px height (80px node + 40px spacing)
  const ROW_HEIGHT = 124; 
  const OFFSET_Y = 62; // Center of the first node (124/2)
  const CENTER_X = 240; 
  const X_OFFSET = 64; 

  useEffect(() => {
    setSvgHeight(filteredTasks.length * ROW_HEIGHT + 100);
  }, [filteredTasks]);

  const getX = (pos: number) => {
    if (pos === 0) return CENTER_X - X_OFFSET;
    if (pos === 2) return CENTER_X + X_OFFSET;
    return CENTER_X;
  };

  const generatePath = () => {
    if (filteredTasks.length === 0) return '';
    let path = `M ${getX(filteredTasks[0].position)} ${OFFSET_Y}`;
    
    filteredTasks.forEach((level, index) => {
      if (index === 0) return;
      const prev = filteredTasks[index - 1];
      const currentX = getX(level.position);
      const currentY = index * ROW_HEIGHT + OFFSET_Y;
      const prevX = getX(prev.position);
      const prevY = (index - 1) * ROW_HEIGHT + OFFSET_Y;

      // Bezier curve for smooth connection
      const cp1x = prevX;
      const cp1y = prevY + ROW_HEIGHT / 2;
      const cp2x = currentX;
      const cp2y = currentY - ROW_HEIGHT / 2;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${currentX} ${currentY}`;
    });

    return path;
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 50, scale: 0.5 },
    show: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { type: "spring", stiffness: 300, damping: 20 }
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">{t('map.loading')}</div>;
  }

  return (
    <div className="bg-white min-h-full relative overflow-hidden" ref={containerRef}>
      {/* Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-sm z-40 border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
            <Flame className="text-orange-500 fill-orange-500" />
            <span className="font-bold text-orange-500">{userStreak}</span>
        </div>
        <div className="flex items-center gap-2">
            <Coins className="text-yellow-500 fill-yellow-500" />
            <span className="font-bold text-yellow-500">{userBalance}</span>
        </div>
      </div>

      {/* Map Content */}
      <div className="relative w-full max-w-[480px] mx-auto">
         {/* SVG Path Background */}
         <svg 
            className="absolute top-0 left-0 w-full pointer-events-none z-0" 
            height={svgHeight}
            viewBox={`0 0 480 ${svgHeight}`}
            preserveAspectRatio="xMidYMin slice"
         >
            <motion.path 
                d={generatePath()} 
                fill="none" 
                stroke="#e5e7eb" 
                strokeWidth="12" 
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
            />
         </svg>

         {/* Levels List */}
         <motion.div 
            className="py-8 relative z-10"
            variants={containerVariants}
            initial="hidden"
            animate="show"
         >
            {filteredTasks.map((level) => (
                <motion.div 
                    key={level.id}  
                    className="flex justify-center items-center" 
                    style={{ height: ROW_HEIGHT }}
                    variants={itemVariants}
                >
                    <LevelNode 
                        level={level} 
                        onClick={() => setSelectedLevel(level.id)} 
                    />
                </motion.div>
            ))}
         </motion.div>
      </div>

      {selectedLevel && (
        <TaskModal 
            levelId={selectedLevel} 
            onClose={() => setSelectedLevel(null)} 
        />
      )}
    </div>
  );
};
