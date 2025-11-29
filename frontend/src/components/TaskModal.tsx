import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useGame } from '../context/GameContext';
import { api, type TaskDetail, type QuestionItem } from '../api/endpoints';
import { Button } from './Button';
import { clsx } from 'clsx';
import { useLanguage } from '../context/LanguageContext';

interface TaskModalProps {
  levelId: number;
  onClose: () => void;
}

export const TaskModal = ({ levelId, onClose }: TaskModalProps) => {
  const { completeLevel } = useGame();
  const { t } = useLanguage();
  const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [textAnswer, setTextAnswer] = useState('');
  
  // Multi-question state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    setTextAnswer('');
  }, [currentQuestionIndex]);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const data = await api.tasks.get(levelId);
        setTaskDetail(data);
      } catch (error) {
        console.error("Failed to fetch task details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [levelId]);

  // Normalize questions
  const questions: QuestionItem[] = taskDetail?.questions && taskDetail.questions.length > 0 
    ? taskDetail.questions 
    : taskDetail 
      ? [{ type: 'choice', text: taskDetail.question || '', options: taskDetail.options || [], correct_answer: taskDetail.correct_answer }]
      : [];

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + (showSummary ? 1 : 0)) / totalQuestions) * 100;

  const handleAnswer = async (index: number) => {
    if (status !== 'idle') return;
    setSelectedOption(index);

    // Local validation
    let isCorrect = true;
    if (currentQuestion.correct_answer) {
        const selectedText = currentQuestion.options[index];
        isCorrect = selectedText === currentQuestion.correct_answer;
    }

    if (isCorrect) {
      setStatus('correct');
    } else {
      setStatus('wrong');
    }
  };

  const handleTextSubmit = () => {
    if (status !== 'idle') return;
    if (!textAnswer.trim()) return;
    
    // For surveys/text input without strict validation, we consider it correct
    // If there was a correct answer, we would check it here
    setStatus('correct');
  };

  const handleContinue = async () => {
    const isCorrect = status === 'correct';
    const newResults = [...results, isCorrect];
    setResults(newResults);

    if (currentQuestionIndex < totalQuestions - 1) {
        // Next question
        setCurrentQuestionIndex(prev => prev + 1);
        setStatus('idle');
        setSelectedOption(null);
    } else {
        // Finished all questions
        // Submit to backend to mark completion and get reward
        // We send the last answer index, though for surveys it might not matter
        await completeLevel(levelId, selectedOption || 0);
        
        setShowConfetti(true);
        setShowSummary(true);
    }
  };

  const correctCount = results.filter(r => r).length;
  const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[100] bg-white flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {showConfetti && (
            <Confetti 
                recycle={false} 
                numberOfPieces={800} 
                gravity={0.2}
                initialVelocityY={20}
            />
        )}
        
        {/* Header */}
        <div className="flex-shrink-0 p-4 flex justify-between items-center border-b border-gray-100">
            <button onClick={onClose}><X size={24} className="text-gray-400" /></button>
            <div className="w-full bg-gray-200 h-4 rounded-full mx-4 overflow-hidden">
                <motion.div 
                    className="bg-x5green h-full rounded-full" 
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                />
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col justify-center max-w-[480px] mx-auto w-full overflow-y-auto min-h-0">
            {loading ? (
                <div className="text-center">{t('task.loading')}</div>
            ) : showSummary ? (
                <div className="text-center space-y-6">
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="w-32 h-32 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <Trophy size={64} className="text-yellow-500" />
                    </motion.div>
                    
                    <h2 className="text-3xl font-bold text-gray-800">Задание завершено!</h2>
                    
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                            <div className="text-green-600 font-bold text-xl">{correctCount}</div>
                            <div className="text-green-800 text-sm">Правильно</div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                            <div className="text-red-600 font-bold text-xl">{totalQuestions - correctCount}</div>
                            <div className="text-red-800 text-sm">Неправильно</div>
                        </div>
                    </div>

                    <div className="text-gray-500 mt-4">
                        Точность: {accuracy}%
                    </div>
                </div>
            ) : currentQuestion ? (
                <>
                    <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">{currentQuestion.text}</h2>
                    
                    <div className="space-y-4">
                        {currentQuestion.type === 'text' ? (
                            <input 
                                type="text" 
                                value={textAnswer}
                                onChange={(e) => setTextAnswer(e.target.value)}
                                className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:border-x5green text-lg bg-white"
                                placeholder="Введите ваш ответ..."
                                disabled={status !== 'idle'}
                            />
                        ) : (
                            currentQuestion.options.map((opt, idx) => {
                                let variant: 'secondary' | 'primary' | 'danger' | 'outline' = 'outline';
                                if (selectedOption === idx) {
                                    if (status === 'correct') variant = 'primary'; // Green
                                    if (status === 'wrong') variant = 'danger'; // Red
                                }

                                const isSelected = selectedOption === idx;
                                const isWrong = isSelected && status === 'wrong';

                                return (
                                    <Button
                                        key={idx}
                                        fullWidth
                                        variant={variant}
                                        onClick={() => handleAnswer(idx)}
                                        className={clsx(
                                            "justify-between group transition-all duration-200",
                                            status === 'idle' && "hover:border-x5green hover:text-x5green"
                                        )}
                                        disabled={status !== 'idle'}
                                    >
                                        <span>{opt}</span>
                                        {status === 'correct' && isSelected && <CheckCircle size={20} />}
                                        {isWrong && <XCircle size={20} />}
                                    </Button>
                                );
                            })
                        )}
                    </div>
                </>
            ) : (
                <div className="text-center text-red-500">{t('task.failed')}</div>
            )}
        </div>

        {/* Footer - fixed at bottom */}
        <div className="flex-shrink-0 p-4 pb-6 border-t border-gray-100 bg-white">
            {showSummary ? (
                <Button 
                    fullWidth 
                    variant="primary"
                    onClick={onClose}
                >
                    Продолжить
                </Button>
            ) : (
                <Button 
                    fullWidth 
                    variant={status === 'correct' ? 'primary' : status === 'wrong' ? 'danger' : 'secondary'}
                    onClick={() => {
                        if (status === 'idle') {
                            if (currentQuestion?.type === 'text') handleTextSubmit();
                        } else {
                            handleContinue();
                        }
                    }}
                    disabled={status === 'idle' && currentQuestion?.type !== 'text'}
                >
                    {status === 'idle' 
                        ? (currentQuestion?.type === 'text' ? 'Проверить' : t('task.select_answer'))
                        : t('task.continue')
                    }
                </Button>
            )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
