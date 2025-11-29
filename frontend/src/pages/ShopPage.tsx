import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Button } from '../components/Button';
import { Coins, X, CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { QRCodeSVG } from 'qrcode.react';
import { api, type ShopItem } from '../api/endpoints';

type ModalStep = 'email' | 'qr';

export const ShopPage = () => {
  const { userBalance, buyItem } = useGame();
  const { t } = useLanguage();
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>('email');
  const [purchaseId, setPurchaseId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const items = await api.shop.items();
        setShopItems(items);
      } catch (error) {
        console.error('Failed to load shop items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handleBuyClick = (itemId: number) => {
    setSelectedItem(itemId);
    setShowModal(true);
    setModalStep('email');
    setPurchaseId('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEmail('');
    setSelectedItem(null);
    setModalStep('email');
    setPurchaseId('');
  };

  const handleConfirmBuy = async () => {
    if (selectedItem && email) {
      setIsLoading(true);
      try {
        const purchaseIdResult = await buyItem(selectedItem, email);
        if (purchaseIdResult) {
          setPurchaseId(purchaseIdResult);
          setModalStep('qr');
        } else {
          alert(t('shop.failed'));
        }
      } catch {
        alert(t('shop.failed'));
      } finally {
        setIsLoading(false);
      }
    } else {
      alert(t('shop.email_required'));
    }
  };

  const selectedItemData = shopItems.find(item => item.id === selectedItem);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-green-500" size={40} />
      </div>
    );
  }

  return (
    <div className="p-4 relative">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('shop.title')}</h1>
        <div className="flex items-center gap-2 bg-yellow-100 px-3 py-1 rounded-xl">
            <Coins className="text-yellow-600 fill-yellow-600" size={20} />
            <span className="font-bold text-yellow-700">{userBalance}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {shopItems.map((item) => (
            <div key={item.id} className="border-2 border-gray-200 rounded-2xl p-4 flex flex-col items-center bg-white">
                <div className="text-6xl mb-4">{item.image}</div>
                <h3 className="font-bold text-gray-700 mb-2 text-center">{item.name}</h3>
                <p className="text-sm text-gray-500 mb-2 text-center">{item.description}</p>
                <Button 
                    fullWidth 
                    variant={userBalance >= item.price ? 'primary' : 'secondary'}
                    onClick={() => handleBuyClick(item.id)}
                    disabled={userBalance < item.price}
                >
                    <div className="flex items-center gap-1">
                        <Coins size={16} /> {item.price}
                    </div>
                </Button>
            </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative shadow-xl">
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
            
            {modalStep === 'email' ? (
              <>
                <h2 className="text-xl font-bold mb-4 text-gray-800">{t('shop.confirm')}</h2>
                <p className="mb-4 text-gray-600">{t('shop.email_prompt')}</p>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-800"
                />
                <Button fullWidth onClick={handleConfirmBuy} disabled={isLoading}>
                  {isLoading ? '...' : t('shop.confirm')}
                </Button>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={40} className="text-green-500" />
                </div>
                <h2 className="text-xl font-bold mb-2 text-gray-800">{t('shop.success')}</h2>
                {selectedItemData && (
                  <p className="text-gray-600 mb-4">
                    {selectedItemData.name} - {selectedItemData.price} ⭐
                  </p>
                )}
                <div className="bg-gray-50 p-4 rounded-xl mb-4">
                  <QRCodeSVG 
                    value={`purchase:${purchaseId}:${email}:${selectedItem}`}
                    size={180}
                    className="mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Покажите этот QR-код для получения награды
                </p>
                <Button fullWidth variant="primary" onClick={handleCloseModal}>
                  Закрыть
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

