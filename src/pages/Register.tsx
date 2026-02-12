import { useState, useEffect } from 'react';
import { UserPlus, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Confetti from '../components/Confetti';
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    phone: '',
    qualification: '',
    currentStatus: '',
    anniversary: '',
    message: '',
  });

  const [timezone, setTimezone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 🔥 Phone validation
    if (!/^[0-9]{10}$/.test(formData.phone)) {
      setError('Phone number must be exactly 10 digits.');
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase.from('members').insert([
        {
          name: formData.name,
          email: formData.email,
          dob: formData.dob,
          phone: formData.phone,
          qualification: formData.qualification,
          current_status: formData.currentStatus,
          anniversary: formData.anniversary || null,
          message: formData.message || null,
          timezone,
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
        phone: '',
        qualification: '',
        currentStatus: '',
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
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">

          <div className="text-center mb-8">
            <UserPlus className="inline-block text-maroon-800 mb-4" size={48} />
            <h2 className="text-3xl font-bold text-maroon-800 mb-2">
              Join Our Community
            </h2>
            <p className="text-gray-600">
              Register to be part of our celebration family
            </p>
          </div>

          {success && (
            <div className="mb-6 bg-green-50 border-2 border-green-500 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle className="text-green-500" size={24} />
              <p className="text-green-700 font-semibold">
                Registration successful! 🎉
              </p>
            </div>
          )}

          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-500 rounded-xl p-4">
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Name */}
            <InputField
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            {/* Email */}
            <InputField
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            {/* Phone */}
            <InputField
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="10 digit number"
              maxLength={10}
              required
            />

            {/* Qualification */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Latest Qualification <span className="text-red-500">*</span>
              </label>
              <select
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-maroon-800 focus:ring-2 focus:ring-maroon-200"
              >
                <option value="">Select Qualification</option>
                <option value="10th">Studying in School under 10th</option>
                <option value="10th">Matriculation</option>
                <option value="12th">Intermediate</option>
                <option value="Diploma">Diploma</option>
                <option value="Bachelor's">Bachelor's</option>
                <option value="Master's">Master's</option>
                <option value="PhD">PhD</option>
              </select>
            </div>

            {/* Current Status */}
            <InputField
              label="What are you currently doing?"
              name="currentStatus"
              value={formData.currentStatus}
              onChange={handleChange}
              placeholder="write anything you want to say like where you are working/studying where are you studying or what are you doing currently or something else you should say for your family"
              required
            />

            {/* DOB */}
            <DateField
              label="Enter your real date of birth (not the one on your Aadhaar)"
              name="dob"
              value={formData.dob}
              setFormData={setFormData}
              required
            />

            {/* Anniversary */}
            <DateField
              label="Anniversary Date (Optional)"
              name="anniversary"
              value={formData.anniversary}
              setFormData={setFormData}
            />

            {/* Message */}
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Message (Optional)
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={3}
                maxLength={120}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
              />
              <div className="mt-1 text-right text-sm text-gray-500">
                {formData.message.length} / 120
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-maroon-800 text-white py-4 rounded-lg font-semibold hover:bg-maroon-700 transition-all"
            >
              {loading ? 'Registering...' : 'Register Now'}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

/* 🔥 Reusable Input Component */
function InputField({ label, name, value, onChange, type = "text", ...props }: any) {
  return (
    <div>
      <label className="block text-gray-700 font-semibold mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        {...props}
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-maroon-800 focus:ring-2 focus:ring-maroon-200"
      />
    </div>
  );
}

/* 🔥 Reusable Date Component */
function DateField({ label, name, value, setFormData, required = false }: any) {
  return (
    <div>
      <label className="block text-gray-700 font-semibold mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {isMobile ? (
        <input
          type="date"
          name={name}
          value={value}
          required={required}
          max={new Date().toISOString().split("T")[0]}
          onChange={(e) =>
            setFormData((prev: any) => ({ ...prev, [name]: e.target.value }))
          }
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
        />
      ) : (
        <Flatpickr
          options={{
            dateFormat: "Y-m-d",
            maxDate: "today",
            disableMobile: true,
          }}
          value={value}
          onChange={(selectedDates, dateStr) =>
            setFormData((prev: any) => ({ ...prev, [name]: dateStr }))
          }
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg"
          required={required}
        />
      )}
    </div>
  );
}
