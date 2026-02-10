import { Home, UserPlus, Users } from 'lucide-react';

interface HeaderProps {
  currentPage: 'home' | 'register' | 'members';
  onNavigate: (page: 'home' | 'register' | 'members') => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  return (
    <header className="bg-maroon-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left">
            Celebrate Together 🎉
          </h1>
          <nav className="flex gap-2 md:gap-4">
            <button
              onClick={() => onNavigate('home')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                currentPage === 'home'
                  ? 'bg-white text-maroon-800 shadow-lg'
                  : 'bg-maroon-700 hover:bg-maroon-600'
              }`}
            >
              <Home size={20} />
              <span className="hidden sm:inline">Home</span>
            </button>
            <button
              onClick={() => onNavigate('register')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                currentPage === 'register'
                  ? 'bg-white text-maroon-800 shadow-lg'
                  : 'bg-maroon-700 hover:bg-maroon-600'
              }`}
            >
              <UserPlus size={20} />
              <span className="hidden sm:inline">Register</span>
            </button>
            <button
              onClick={() => onNavigate('members')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                currentPage === 'members'
                  ? 'bg-white text-maroon-800 shadow-lg'
                  : 'bg-maroon-700 hover:bg-maroon-600'
              }`}
            >
              <Users size={20} />
              <span className="hidden sm:inline">Members</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
