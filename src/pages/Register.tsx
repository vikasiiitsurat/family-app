import { useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      }, 5000);
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
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 animate-fadeIn">
          <div className="text-center mb-8">
            <UserPlus className="inline-block text-maroon-800 mb-4" size={48} />
            <h2 className="text-3xl md:text-4xl font-bold text-maroon-800 mb-2">
              Join Our Community
            </h2>
            <p className="text-gray-600">
              Register to be part of our celebration family
            </p>
          </div>

          {success && (
            <div className="mb-6 bg-green-50 border-2 border-green-500 rounded-xl p-4 flex items-center gap-3 animate-fadeIn">
              <CheckCircle className="text-green-500" size={24} />
              <p className="text-green-700 font-semibold">
                Registration successful! Welcome to our community!
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-500 rounded-xl p-4 animate-fadeIn">
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-gray-700 font-semibold mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-maroon-800 focus:outline-none transition-colors"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-gray-700 font-semibold mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-maroon-800 focus:outline-none transition-colors"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label htmlFor="dob" className="block text-gray-700 font-semibold mb-2">
                Please enter your real date of birth<span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="dob"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-maroon-800 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="anniversary" className="block text-gray-700 font-semibold mb-2">
                Anniversary Date (Optional)
              </label>
              <input
                type="date"
                id="anniversary"
                name="anniversary"
                value={formData.anniversary}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-maroon-800 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-gray-700 font-semibold mb-2">
                Message to appear with your Birthday / Anniversary wish (Optional)
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-maroon-800 focus:outline-none transition-colors resize-none"
                placeholder="A short line that will be shown with your celebration message..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-maroon-800 text-white py-4 rounded-lg font-semibold text-lg hover:bg-maroon-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? 'Registering...' : 'Register Now'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
