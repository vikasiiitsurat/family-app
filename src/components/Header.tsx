import { Home, UserPlus, Users, Heart } from 'lucide-react';

interface HeaderProps {
  currentPage: 'home' | 'register' | 'members' | 'familyTree';
  onNavigate: (page: 'home' | 'register' | 'members' | 'familyTree') => void;
}

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'register', label: 'Join Us', icon: UserPlus },
    { id: 'members', label: 'The Family', icon: Users },
    { id: 'familyTree', label: 'Family Tree', icon: Users },
  ] as const;

  return (
    <header className="relative overflow-hidden bg-gradient-to-r from-maroon-900 via-maroon-800 to-rose-900 text-white shadow-2xl">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-64 h-64 bg-rose-400 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 py-6 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Logo Section */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
            <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md group-hover:scale-110 transition-transform duration-300">
              <Heart className="text-rose-300 fill-rose-300" size={28} />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-rose-100">
              Family<span className="text-rose-300">Connect</span>
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center bg-black/10 p-1.5 rounded-2xl backdrop-blur-sm border border-white/10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`
                    relative flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all duration-300 group
                    ${isActive 
                      ? 'bg-white text-maroon-900 shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                      : 'hover:bg-white/10 text-rose-100'
                    }
                  `}
                >
                  <Icon size={18} className={`${isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                  <span className="font-semibold text-sm tracking-wide uppercase">
                    {item.label}
                  </span>
                  
                  {/* Subtle indicator for active state */}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-maroon-900 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}