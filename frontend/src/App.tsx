import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import { LanguageProvider } from './context/LanguageContext';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { MapPage } from './pages/MapPage';
import { ShopPage } from './pages/ShopPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

function App() {
  return (
    <LanguageProvider>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<LoginPage />} />
              <Route path="map" element={<MapPage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="leaderboard" element={<LeaderboardPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </LanguageProvider>
  );
}

export default App;
