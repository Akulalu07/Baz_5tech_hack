import { useState, useEffect } from 'react';
import { api, type AdminMetricsResponse, type AdminUserResponse, type AdminTaskResponse, type CreateTaskRequest } from '../api/endpoints';
import { Button } from '../components/Button';
import { Users, BarChart3, ClipboardList, Plus, Trash2, Edit, X, LogOut } from 'lucide-react';

type Tab = 'metrics' | 'users' | 'tasks';

export const AdminPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('admin_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('metrics');
  const [metrics, setMetrics] = useState<AdminMetricsResponse | null>(null);
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [tasks, setTasks] = useState<AdminTaskResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<AdminTaskResponse | null>(null);
  
  // Task form state
  const [taskForm, setTaskForm] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    type: 'quiz',
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    reward: 100,
    position: 0,
    language: 'ru',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const { token } = await api.admin.login(username, password);
      localStorage.setItem('admin_token', token);
      setIsLoggedIn(true);
    } catch {
      setLoginError('Неверный логин или пароль');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsLoggedIn(false);
  };

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      if (activeTab === 'metrics') loadMetrics();
      else if (activeTab === 'users') loadUsers();
      else if (activeTab === 'tasks') loadTasks();
    }
  }, [isLoggedIn, activeTab]);

  const handleCreateTask = async () => {
    try {
      await api.admin.createTask({
        ...taskForm,
        options: taskForm.options?.filter(o => o.trim() !== ''),
      });
      setShowTaskModal(false);
      resetTaskForm();
      loadTasks();
    } catch (error) {
      console.error('Failed to create task', error);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    try {
      await api.admin.updateTask(editingTask.id, {
        ...taskForm,
        options: taskForm.options?.filter(o => o.trim() !== ''),
      });
      setShowTaskModal(false);
      setEditingTask(null);
      resetTaskForm();
      loadTasks();
    } catch (error) {
      console.error('Failed to update task', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm('Удалить это задание?')) return;
    try {
      await api.admin.deleteTask(taskId);
      loadTasks();
    } catch (error) {
      console.error('Failed to delete task', error);
    }
  };

  const openEditModal = (task: AdminTaskResponse) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      type: task.type,
      question: task.question,
      options: task.options.length > 0 ? task.options : ['', '', '', ''],
      correct_answer: task.correct_answer,
      reward: task.reward,
      position: task.position,
      language: task.language,
    });
    setShowTaskModal(true);
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      type: 'quiz',
      question: '',
      options: ['', '', '', ''],
      correct_answer: '',
      reward: 100,
      position: 0,
      language: 'ru',
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Админ-панель</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••"
              />
            </div>
            {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
            <Button fullWidth type="submit">Войти</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Админ-панель X5 Tech</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-500">
            <LogOut size={20} /> Выйти
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'metrics' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart3 size={20} /> Метрики
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'users' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users size={20} /> Пользователи
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
              activeTab === 'tasks' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ClipboardList size={20} /> Задания
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Загрузка...</div>
        ) : (
          <>
            {/* Metrics Tab */}
            {activeTab === 'metrics' && metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <div className="text-3xl font-bold text-green-600">{metrics.total_users}</div>
                  <div className="text-gray-500">Пользователей</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <div className="text-3xl font-bold text-blue-600">{metrics.total_tasks}</div>
                  <div className="text-gray-500">Заданий</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <div className="text-3xl font-bold text-purple-600">{metrics.total_completed_tasks}</div>
                  <div className="text-gray-500">Выполнено заданий</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <div className="text-3xl font-bold text-orange-600">{metrics.total_purchases}</div>
                  <div className="text-gray-500">Покупок</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <div className="text-3xl font-bold text-yellow-600">{metrics.total_revenue}</div>
                  <div className="text-gray-500">Потрачено баллов</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                  <div className="text-3xl font-bold text-teal-600">{metrics.active_users_today}</div>
                  <div className="text-gray-500">Активны сегодня</div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm col-span-2">
                  <div className="text-3xl font-bold text-indigo-600">{metrics.avg_tasks_per_user.toFixed(2)}</div>
                  <div className="text-gray-500">Среднее кол-во заданий на пользователя</div>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Имя</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Username</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Телефон</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Баланс</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Заданий</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Streak</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Роль</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800">{user.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">{user.first_name} {user.last_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">@{user.username}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.phone_number || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600">{user.balance}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.completed_tasks_count}</td>
                        <td className="px-4 py-3 text-sm text-orange-500">{user.current_streak}🔥</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div>
                <div className="mb-4">
                  <Button onClick={() => { resetTaskForm(); setEditingTask(null); setShowTaskModal(true); }}>
                    <Plus size={20} className="mr-2" /> Создать задание
                  </Button>
                </div>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Позиция</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Название</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Тип</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Награда</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Язык</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {tasks.map((task) => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-800">{task.position}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">{task.title}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.type === 'quiz' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {task.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-yellow-600 font-medium">{task.reward}⭐</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{task.language}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => openEditModal(task)}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingTask ? 'Редактировать задание' : 'Создать задание'}
              </h2>
              <button onClick={() => setShowTaskModal(false)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                  <select
                    value={taskForm.type}
                    onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="quiz">Quiz</option>
                    <option value="survey">Survey</option>
                    <option value="code">Code</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Язык</label>
                  <select
                    value={taskForm.language}
                    onChange={(e) => setTaskForm({ ...taskForm, language: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Вопрос</label>
                <textarea
                  value={taskForm.question}
                  onChange={(e) => setTaskForm({ ...taskForm, question: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Варианты ответов</label>
                {taskForm.options?.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...(taskForm.options || [])];
                      newOptions[idx] = e.target.value;
                      setTaskForm({ ...taskForm, options: newOptions });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={`Вариант ${idx + 1}`}
                  />
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Правильный ответ</label>
                <input
                  type="text"
                  value={taskForm.correct_answer}
                  onChange={(e) => setTaskForm({ ...taskForm, correct_answer: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Точный текст правильного ответа"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Награда (баллов)</label>
                  <input
                    type="number"
                    value={taskForm.reward}
                    onChange={(e) => setTaskForm({ ...taskForm, reward: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Позиция</label>
                  <input
                    type="number"
                    value={taskForm.position}
                    onChange={(e) => setTaskForm({ ...taskForm, position: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  fullWidth
                  variant="secondary"
                  onClick={() => setShowTaskModal(false)}
                >
                  Отмена
                </Button>
                <Button
                  fullWidth
                  onClick={editingTask ? handleUpdateTask : handleCreateTask}
                >
                  {editingTask ? 'Сохранить' : 'Создать'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
