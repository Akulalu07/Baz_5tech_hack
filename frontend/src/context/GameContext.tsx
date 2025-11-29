import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, type Task, type TelegramAuthRequest, type PhoneAuthRequest } from '../api/endpoints';

interface GameContextType {
  userBalance: number;
  userStreak: number;
  tasks: Task[];
  isLoading: boolean;
  login: (userData: Partial<TelegramAuthRequest>) => Promise<void>;
  loginWithPhone: (userData: PhoneAuthRequest) => Promise<void>;
  logout: () => void;
  completeLevel: (levelId: number, answerIndex?: number) => Promise<boolean>;
  buyItem: (itemId: number, email: string) => Promise<string | null>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [userBalance, setUserBalance] = useState(0);
  const [userStreak, setUserStreak] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [user, tasksData] = await Promise.all([
        api.user.me(),
        api.tasks.list()
      ]);
      setUserBalance(user.balance);
      setUserStreak(user.current_streak); 
      setTasks(tasksData);
    } catch (error) {
      console.error("Failed to fetch game data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUserBalance(0);
    setUserStreak(0);
    setTasks([]);
  };

  const login = async (userData: Partial<TelegramAuthRequest>) => {
    try {
      setIsLoading(true);
      const requestData: TelegramAuthRequest = {
        user_id: userData.user_id || 12345,
        username: userData.username || 'guest',
        first_name: userData.first_name || 'Guest',
        hash: userData.hash || 'dummy_hash',
        auth_date: userData.auth_date || Math.floor(Date.now() / 1000),
        ...userData
      } as TelegramAuthRequest;

      const { token } = await api.auth.telegram(requestData);
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithPhone = async (userData: PhoneAuthRequest) => {
    try {
      setIsLoading(true);
      const { token } = await api.auth.phone(userData);
      localStorage.setItem('token', token);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Phone login failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeLevel = async (levelId: number, answerIndex?: number) => {
    try {
      const response = await api.tasks.submit(levelId, undefined, answerIndex);
      if (response.success) {
        setUserBalance(response.new_balance);
        // Refresh tasks to update status
        const updatedTasks = await api.tasks.list();
        setTasks(updatedTasks);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to complete level:", error);
      return false;
    }
  };

  const buyItem = async (itemId: number, email: string): Promise<string | null> => {
    try {
      const result = await api.shop.buy(itemId, email);
      // Refetch user data to update balance
      const user = await api.user.me();
      setUserBalance(user.balance);
      return result.purchase_id;
    } catch (error) {
      console.error("Failed to buy item:", error);
      return null;
    }
  };

  return (
    <GameContext.Provider value={{
      userBalance,
      userStreak,
      tasks,
      isLoading,
      login,
      loginWithPhone,
      logout,
      completeLevel,
      buyItem
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
