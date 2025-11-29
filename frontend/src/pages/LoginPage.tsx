import { useState } from 'react';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { useLanguage } from '../context/LanguageContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithPhone } = useGame();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
      setError(t('login.fill_all'));
      return;
    }

    // Phone validation: simple check for length of digits
    const digitsOnly = formData.phoneNumber.replace(/\D/g, '');
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        setError('Invalid phone number length (10-15 digits required)');
        return;
    }

    try {
      await loginWithPhone({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber
      });
      navigate('/map');
    } catch (error) {
      console.error("Login failed", error);
      setError(t('login.failed'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-x5green text-white text-center">
      <h1 className="text-4xl font-bold mb-4">{t('login.title')}</h1>
      <p className="text-xl mb-12 opacity-90">{t('login.subtitle')}</p>
      
      <form onSubmit={handleLogin} className="w-full max-w-xs space-y-4">
        <div className="space-y-2">
          <input
            type="text"
            name="firstName"
            placeholder={t('login.first_name')}
            value={formData.firstName}
            onChange={handleInputChange}
            className="w-full p-3 rounded bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white"
          />
          <input
            type="text"
            name="lastName"
            placeholder={t('login.last_name')}
            value={formData.lastName}
            onChange={handleInputChange}
            className="w-full p-3 rounded bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white"
          />
          <input
            type="tel"
            name="phoneNumber"
            placeholder={t('login.phone')}
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className="w-full p-3 rounded bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-white"
          />
        </div>

        {error && <p className="text-red-300 text-sm">{error}</p>}

        <Button 
            fullWidth 
            variant="secondary" 
            type="submit"
            className="text-x5green border-b-4 border-gray-200"
        >
            {t('login.start')}
        </Button>
      </form>
    </div>
  );
};
