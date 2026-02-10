import { useState, useEffect } from 'react';
import { UserPlus, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Confetti from '../components/Confetti';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    anniversary: '',
    message: '',
  });

  const [timezone, setTimezone] = useState(''); // NEW
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // NEW: capture timezone once
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error: insertError } = await supabase.from('members').insert([
        {
          name: formData.name,
          email: formData.email,
          dob: formData.dob,
          anniversary: formData.anniversary || null,
          message: formData.message || null,
          timezone, // NEW
        },
      ]);

      if (insertError) {
        if (insertError.code === '23505') {
          setError('This email is already registered!');
        } else {
          setError('Registration failed. Please try again.');
        }
        setLoading(false);
        return;
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        dob: '',
        anniversary: '',
        message: '',
      });

      setTimeout(() => {
        setSuccess(false);
      }, 4000);
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-maroon-50 py-12 px-4">
      {success && <Confetti />}

      <div className="container mx-auto max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12
                        animate-fadeIn transition-transform duration-500 hover:scale-[1.01]">
          
          <div className="text-center mb-8">
            <UserPlus
              className="inline-block text-maroon-800 mb-4 animate-bounce"
              size={48}
            />
            <h2 className="text-3xl md:text-4xl font-bold text-maroon-800 mb-2">
              Join Our Community
            </h2>
            <p className="text-gray-600">
              Register to be part of our celebration family
            </p>
          </div>

          {success && (
            <div className="mb-6 bg-green-50 border-2 border-green-500
                            rounded-xl p-4 flex items-center gap-3
                            animate-slideDown">
              <CheckCircle className="text-green-500" size={24} />
              <p className="text-green-700 font-semibold">
                Registration successful! 🎉
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-500
                            rounded-xl p-4 animate-shake">
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Inputs */}
            {[
              { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter your full name' },
              { id: 'email', label: 'Email Address', type: 'email', placeholder: 'your.email@example.com' },
            ].map(field => (
              <div key={field.id}>
                <label className="block text-gray-700 font-semibold mb-2">
                  {field.label} <span className="text-red-500">*</span>
                </label>
                <input
                  type={field.type}
                  name={field.id}
                  value={(formData as any)[field.id]}
                  onChange={handleChange}
                  required
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                             focus:border-maroon-800 focus:ring-2 focus:ring-maroon-200
                             focus:outline-none transition-all"
                />
              </div>
            ))}

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                           focus:border-maroon-800 focus:ring-2 focus:ring-maroon-200
                           transition-all"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Anniversary Date (Optional)
              </label>
              <input
                type="date"
                name="anniversary"
                value={formData.anniversary}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                           focus:border-maroon-800 focus:ring-2 focus:ring-maroon-200
                           transition-all"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Message to appear with your wish (Optional)
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={3}
                maxLength={120}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg
                           focus:border-maroon-800 focus:ring-2 focus:ring-maroon-200
                           transition-all resize-none"
                placeholder="A short line that will be shown with your celebration message..."
              
              />
              <div className="mt-1 text-right text-sm text-gray-500">
    {formData.message.length} / 120
  </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-maroon-800 text-white py-4 rounded-lg
                         font-semibold text-lg shadow-lg
                         hover:bg-maroon-700 hover:scale-[1.03]
                         active:scale-[0.98]
                         transition-all duration-300
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registering...' : 'Register Now'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
