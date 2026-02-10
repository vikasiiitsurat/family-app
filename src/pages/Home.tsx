import { Cake, Heart, Users, Sparkles } from 'lucide-react';

interface HomeProps {
  onNavigate: (page: 'register' | 'members') => void;
}

export default function Home({ onNavigate }: HomeProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-maroon-50">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center animate-fadeIn">
          <div className="mb-8">
            <Sparkles className="inline-block text-maroon-800 mb-4" size={60} />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-maroon-800 mb-6">
            Celebrate Special Moments Together
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-12 max-w-2xl mx-auto">
            Join our community and never miss a birthday or anniversary celebration.
            Share joy, spread happiness, and make every moment memorable!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={() => onNavigate('register')}
              className="bg-maroon-800 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-maroon-700 transition-all transform hover:scale-105 shadow-lg animate-glow"
            >
              Register Now
            </button>
            <button
              onClick={() => onNavigate('members')}
              className="bg-white text-maroon-800 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg border-2 border-maroon-800"
            >
              View Members
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-16">
            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2">
              <Cake className="text-maroon-800 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Birthday Wishes</h3>
              <p className="text-gray-600">
                Never forget a birthday! Get reminders and celebrate together.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2">
              <Heart className="text-maroon-800 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Anniversary Joy</h3>
              <p className="text-gray-600">
                Commemorate special milestones and share love.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-2">
              <Users className="text-maroon-800 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-bold text-gray-800 mb-2">Community</h3>
              <p className="text-gray-600">
                Join a warm community that celebrates life's precious moments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
