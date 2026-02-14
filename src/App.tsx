import { useState } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import Register from './pages/Register';
import Members from './pages/Members';
import PrivacyPolicy from './pages/PrivacyPolicy';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'register' | 'members' |'privacy'>('home');

  return (
    <div className="min-h-screen bg-white">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      {currentPage === 'home' && <Home onNavigate={setCurrentPage} />}
      {currentPage === 'register' && <Register />}
      {currentPage === 'members' && <Members />}
      {currentPage === 'privacy' && <PrivacyPolicy />}

    </div>
  );
}

export default App;
