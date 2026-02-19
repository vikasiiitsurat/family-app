import { useState, useEffect } from 'react';
import {
  UserPlus, CheckCircle, Edit3, Search, RefreshCw,
  Linkedin, Instagram, MessageCircle, Sparkles, Camera, X,
  Heart, Users, ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Confetti from '../components/Confetti';
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";

const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

type TabType = 'register' | 'update';
type SearchType = 'email' | 'phone' | 'name';

interface MemberRecord {
  id?: string;
  name: string;
  email: string;
  dob: string;
  phone: string;
  qualification: string;
  current_status: string;
  anniversary?: string;
  linkedin?: string;
  whatsapp?: string;
  instagram?: string;
  profile_photo?: string;
  fathers_name?: string;
  mothers_name?: string;
  spouse_name?: string;
}

export default function Register() {
  const [activeTab, setActiveTab] = useState<TabType>('register');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    dob: '',
    phone: '',
    qualification: '',
    currentStatus: '',
    anniversary: '',
    linkedin: '',
    whatsapp: '',
    instagram: '',
    profilePhoto: '',
    fathersName: '',
    mothersName: '',
    spouseName: '',
    isMarried: false,
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('email');
  const [userFound, setUserFound] = useState(false);
  const [multipleResults, setMultipleResults] = useState<MemberRecord[]>([]);
  const [originalEmail, setOriginalEmail] = useState('');
  const [timezone, setTimezone] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(tz);
  }, []);

  const emptyForm = {
    name: '', email: '', dob: '', phone: '', qualification: '',
    currentStatus: '', anniversary: '', linkedin: '', whatsapp: '',
    instagram: '', profilePhoto: '', fathersName: '', mothersName: '',
    spouseName: '', isMarried: false,
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setError('');
    setSuccess(false);
    setUserFound(false);
    setSearchQuery('');
    setMultipleResults([]);
    setPhotoFile(null);
    setPhotoPreview('');
    setFormData(emptyForm);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select a valid image file (JPG, PNG, GIF, WebP)'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image size should be less than 5MB'); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
    setError('');
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview('');
    setFormData({ ...formData, profilePhoto: '' });
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      setUploadingPhoto(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;
      const { error: uploadError } = await supabase.storage.from('member-photos').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('member-photos').getPublicUrl(filePath);
      setUploadingPhoto(false);
      return publicUrl;
    } catch (err) {
      console.error('Error uploading photo:', err);
      setUploadingPhoto(false);
      return null;
    }
  };

  const populateFromRecord = (data: MemberRecord) => {
    setFormData({
      name: data.name || '',
      email: data.email || '',
      dob: data.dob || '',
      phone: data.phone || '',
      qualification: data.qualification || '',
      currentStatus: data.current_status || '',
      anniversary: data.anniversary || '',
      linkedin: data.linkedin || '',
      whatsapp: data.whatsapp || '',
      instagram: data.instagram || '',
      profilePhoto: data.profile_photo || '',
      fathersName: data.fathers_name || '',
      mothersName: data.mothers_name || '',
      spouseName: data.spouse_name || '',
      isMarried: !!(data.spouse_name || data.anniversary),
    });
    if (data.profile_photo) setPhotoPreview(data.profile_photo);
    setOriginalEmail(data.email);
    setUserFound(true);
    setMultipleResults([]);
    setError('');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError(`Please enter a ${searchType === 'email' ? 'email' : searchType === 'phone' ? 'phone number' : 'name'}`);
      return;
    }
    setSearching(true);
    setError('');
    setMultipleResults([]);

    try {
      if (searchType === 'name') {
        // Name search — may return multiple
        const { data, error: searchError } = await supabase
          .from('members')
          .select('*')
          .ilike('name', `%${searchQuery.trim()}%`);

        if (searchError || !data || data.length === 0) {
          setError('No member found with this name');
          setSearching(false);
          return;
        }
        if (data.length === 1) {
          populateFromRecord(data[0]);
        } else {
          setMultipleResults(data);
        }
      } else {
        const { data, error: searchError } = await supabase
          .from('members')
          .select('*')
          .eq(searchType, searchQuery.trim())
          .single();

        if (searchError || !data) {
          setError('No member found with this information');
          setSearching(false);
          return;
        }
        populateFromRecord(data);
      }
    } catch {
      setError('An error occurred while searching');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!/^[0-9]{10}$/.test(formData.phone)) {
      setError('Phone number must be exactly 10 digits.');
      setLoading(false);
      return;
    }
    if (formData.whatsapp && !/^[0-9]{10}$/.test(formData.whatsapp)) {
      setError('WhatsApp number must be exactly 10 digits.');
      setLoading(false);
      return;
    }
    if (formData.instagram && !/^[a-zA-Z0-9._]{1,30}$/.test(formData.instagram)) {
      setError('Instagram ID can only contain letters, numbers, dots, and underscores (max 30 characters).');
      setLoading(false);
      return;
    }
    if (formData.isMarried && !formData.spouseName.trim()) {
      setError('Please enter your spouse name.');
      setLoading(false);
      return;
    }

    try {
      let photoUrl = formData.profilePhoto;
      if (photoFile) {
        const uploadedUrl = await uploadPhoto(photoFile);
        if (!uploadedUrl) {
          setError('Failed to upload photo. Please try again.');
          setLoading(false);
          return;
        }
        photoUrl = uploadedUrl;
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        dob: formData.dob,
        phone: formData.phone,
        qualification: formData.qualification,
        current_status: formData.currentStatus,
        anniversary: formData.isMarried && formData.anniversary ? formData.anniversary : null,
        linkedin: formData.linkedin || null,
        whatsapp: formData.whatsapp || null,
        instagram: formData.instagram || null,
        profile_photo: photoUrl || null,
        fathers_name: formData.fathersName || null,
        mothers_name: formData.mothersName || null,
        spouse_name: formData.isMarried ? formData.spouseName || null : null,
      };

      if (activeTab === 'register') {
        const { error: insertError } = await supabase.from('members').insert([{ ...payload, timezone }]);
        if (insertError) {
          setError(insertError.code === '23505' ? 'This email is already registered!' : 'Registration failed. Please try again.');
          setLoading(false);
          return;
        }
        setSuccessMessage('Welcome to the family! Registration successful! 🎉');
      } else {
        const { error: updateError } = await supabase.from('members').update(payload).eq('email', originalEmail);
        if (updateError) {
          setError(updateError.code === '23505' ? 'This email is already taken by another user!' : 'Update failed. Please try again.');
          setLoading(false);
          return;
        }
        setSuccessMessage('Your profile shines brighter now! Updated successfully! ✨');
        setUserFound(false);
        setSearchQuery('');
      }

      setSuccess(true);
      setPhotoFile(null);
      setPhotoPreview('');
      setFormData(emptyForm);
      setTimeout(() => setSuccess(false), 4000);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const searchTypeConfig: { type: SearchType; label: string; emoji: string }[] = [
    { type: 'email', label: 'Email', emoji: '📧' },
    { type: 'phone', label: 'Phone', emoji: '📱' },
    { type: 'name', label: 'Name', emoji: '👤' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-purple-50 py-12 px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-orange-200/30 to-pink-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-purple-200/30 to-rose-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-rose-200/20 to-orange-200/20 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {success && <Confetti />}

      <div className="container mx-auto max-w-3xl relative z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100">

          {/* Tabs */}
          <div className="flex border-b-2 border-orange-100">
            {(['register', 'update'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`flex-1 py-5 px-6 font-bold text-center transition-all duration-300 relative group ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-maroon-800 to-maroon-700 text-white'
                    : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 hover:from-orange-50 hover:to-rose-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  {tab === 'register'
                    ? <UserPlus className={`transition-transform group-hover:scale-110 ${activeTab === tab ? 'animate-bounce' : ''}`} size={22} />
                    : <Edit3 className={`transition-transform group-hover:scale-110 ${activeTab === tab ? 'animate-bounce' : ''}`} size={22} />
                  }
                  <span>{tab === 'register' ? 'New Registration' : 'Update Profile'}</span>
                </div>
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-pink-400" />
                )}
              </button>
            ))}
          </div>

          <div className="p-8 md:p-12">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="relative inline-block mb-4">
                {activeTab === 'register'
                  ? <UserPlus className="inline-block text-maroon-800 animate-pulse" size={56} />
                  : <Edit3 className="inline-block text-maroon-800 animate-pulse" size={56} />
                }
                <Sparkles className="absolute -top-2 -right-2 text-orange-400 animate-spin" size={24} style={{ animationDuration: '3s' }} />
              </div>
              <h2 className="text-4xl font-extrabold bg-gradient-to-r from-maroon-800 via-rose-700 to-orange-600 bg-clip-text text-transparent mb-3">
                {activeTab === 'register' ? 'Join Our Community' : 'Update Your Profile'}
              </h2>
              <p className="text-gray-600 text-lg font-medium">
                {activeTab === 'register'
                  ? 'Register to be part of our celebration family ✨'
                  : 'Keep your information fresh and up to date 🌟'}
              </p>
            </div>

            {/* Success */}
            {success && (
              <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-2xl p-5 flex items-center gap-4 shadow-lg animate-bounce">
                <CheckCircle className="text-green-500 animate-pulse flex-shrink-0" size={32} />
                <p className="text-green-800 font-bold text-lg">{successMessage}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-8 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-400 rounded-2xl p-5 shadow-lg">
                <p className="text-red-700 font-bold text-lg">⚠️ {error}</p>
              </div>
            )}

            {/* ── Search Section (Update tab) ── */}
            {activeTab === 'update' && !userFound && (
              <div className="mb-10 p-8 bg-gradient-to-br from-orange-50 via-rose-50 to-purple-50 rounded-2xl border-2 border-maroon-300 shadow-xl">
                <h3 className="text-xl font-bold text-maroon-800 mb-6 flex items-center gap-3">
                  <Search className="animate-pulse" size={24} />
                  Find Your Profile
                </h3>

                {/* Search type — 3 buttons */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {searchTypeConfig.map(({ type, label, emoji }) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setSearchType(type); setMultipleResults([]); setError(''); }}
                      className={`py-3 px-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 text-sm ${
                        searchType === type
                          ? 'bg-gradient-to-r from-maroon-800 to-maroon-700 text-white shadow-xl scale-105'
                          : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-maroon-400 hover:shadow-lg'
                      }`}
                    >
                      {emoji} {label}
                    </button>
                  ))}
                </div>

                {/* Search input */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type={searchType === 'email' ? 'email' : searchType === 'phone' ? 'tel' : 'text'}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={
                      searchType === 'email' ? 'Enter your email address'
                      : searchType === 'phone' ? 'Enter your 10-digit phone number'
                      : 'Enter your full name or partial name'
                    }
                    className="flex-1 px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-maroon-800 focus:ring-4 focus:ring-maroon-200 text-lg transition-all shadow-sm"
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={searching}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-maroon-800 to-maroon-700 text-white rounded-xl font-bold hover:from-maroon-700 hover:to-maroon-600 transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg transform hover:scale-105 active:scale-95"
                  >
                    {searching ? <><RefreshCw className="animate-spin" size={22} />Searching...</> : <><Search size={22} />Search</>}
                  </button>
                </div>

                {/* Multiple results picker */}
                {multipleResults.length > 1 && (
                  <div className="mt-6">
                    <p className="text-maroon-800 font-bold mb-3 text-sm">
                      {multipleResults.length} profiles found — select yours:
                    </p>
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {multipleResults.map((member, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => populateFromRecord(member)}
                          className="w-full text-left px-5 py-4 bg-white rounded-xl border-2 border-gray-200 hover:border-maroon-500 hover:shadow-md transition-all flex items-center gap-4 group"
                        >
                          {member.profile_photo ? (
                            <img src={member.profile_photo} alt={member.name} className="w-12 h-12 rounded-full object-cover border-2 border-maroon-300" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 to-rose-200 flex items-center justify-center font-bold text-maroon-800 text-lg">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-800 group-hover:text-maroon-800 transition-colors">{member.name}</p>
                            <p className="text-gray-500 text-sm truncate">{member.email} · {member.phone}</p>
                          </div>
                          <ChevronDown className="text-gray-400 group-hover:text-maroon-600 -rotate-90 transition-all" size={18} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User found banner */}
            {activeTab === 'update' && userFound && (
              <div className="mb-8 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-400 rounded-2xl p-6 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                  <CheckCircle className="text-blue-500 animate-pulse" size={32} />
                  <div>
                    <p className="text-blue-800 font-bold text-lg">Profile Found! 🎯</p>
                    <p className="text-blue-600 font-medium">Update your information below</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setUserFound(false);
                    setSearchQuery('');
                    setMultipleResults([]);
                    setPhotoFile(null);
                    setPhotoPreview('');
                    setFormData(emptyForm);
                  }}
                  className="text-blue-700 hover:text-blue-900 font-bold text-sm underline hover:no-underline transition-all"
                >
                  🔄 Search Again
                </button>
              </div>
            )}

            {/* ── FORM ── */}
            {(activeTab === 'register' || userFound) && (
              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Profile Photo */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-2xl border-2 border-indigo-200">
                  <h3 className="text-xl font-bold text-maroon-800 mb-5 flex items-center gap-2">
                    📸 Profile Photo
                  </h3>
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      {photoPreview ? (
                        <div className="relative group">
                          <img src={photoPreview} alt="Profile preview" className="w-40 h-40 rounded-full object-cover border-4 border-maroon-800 shadow-xl" />
                          <button type="button" onClick={handleRemovePhoto} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-all shadow-lg opacity-0 group-hover:opacity-100">
                            <X size={20} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-40 h-40 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center border-4 border-dashed border-gray-400">
                          <Camera className="text-gray-500" size={48} />
                        </div>
                      )}
                    </div>
                    <div className="w-full max-w-md">
                      <label className="block">
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                        <div className="cursor-pointer bg-gradient-to-r from-maroon-800 to-maroon-700 text-white py-4 px-6 rounded-xl font-bold text-center hover:from-maroon-700 hover:to-maroon-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-3">
                          <Camera size={22} />
                          {photoPreview ? 'Change Photo' : 'Upload Photo'}
                        </div>
                      </label>
                      <p className="text-gray-600 text-sm mt-3 text-center">JPG, PNG, GIF or WebP • Max size: 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-gradient-to-r from-orange-50 to-rose-50 p-6 rounded-2xl border-2 border-orange-200">
                  <h3 className="text-xl font-bold text-maroon-800 mb-5 flex items-center gap-2">
                    👤 Personal Information
                  </h3>
                  <div className="space-y-6">
                    <InputField label="Full Name" name="name" value={formData.name} onChange={handleChange} icon="✨" required />
                    <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} icon="📧" required />
                    <InputField label="Phone Number" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="10 digit number" maxLength={10} icon="📱" required />
                    <DateField label="Date of Birth (Real, not Aadhaar)" name="dob" value={formData.dob} setFormData={setFormData} icon="🎂" required />
                  </div>
                </div>

                {/* Family Information */}
                <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 p-6 rounded-2xl border-2 border-amber-300 shadow-inner">
                  <h3 className="text-xl font-bold text-maroon-800 mb-1 flex items-center gap-2">
                    <Users size={22} className="text-orange-600" /> Family Information
                  </h3>
                  <p className="text-gray-500 text-sm mb-5">Tell us a bit about your family 🏡</p>

                  <div className="space-y-6">
                    {/* Father & Mother side by side on larger screens */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <InputField label="Father's Name" name="fathersName" value={formData.fathersName} onChange={handleChange} icon="👨" required />
                      <InputField label="Mother's Name" name="mothersName" value={formData.mothersName} onChange={handleChange} icon="👩" required />
                    </div>

                    {/* Married toggle */}
                    <div>
                      <label className="block text-gray-800 font-bold mb-3 flex items-center gap-2">
                        <Heart size={18} className="text-rose-500" /> Marital Status <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, isMarried: false, spouseName: '', anniversary: '' }))}
                          className={`flex-1 py-3 px-5 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                            !formData.isMarried
                              ? 'bg-gradient-to-r from-maroon-800 to-maroon-700 text-white shadow-xl scale-105'
                              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-maroon-400 hover:shadow-lg'
                          }`}
                        >
                          💚 Single / Not Married
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, isMarried: true }))}
                          className={`flex-1 py-3 px-5 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 ${
                            formData.isMarried
                              ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-xl scale-105'
                              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-rose-400 hover:shadow-lg'
                          }`}
                        >
                          💍 Married
                        </button>
                      </div>
                    </div>

                    {/* Spouse fields — shown only if married */}
                    {formData.isMarried && (
                      <div className="space-y-5 p-5 bg-white/70 rounded-2xl border-2 border-rose-200 shadow-sm animate-fadeIn">
                        <div className="flex items-center gap-2 mb-1">
                          <Heart className="text-rose-500 animate-pulse" size={18} />
                          <span className="text-rose-700 font-semibold text-sm">Married details</span>
                        </div>
                        <InputField
                          label="Spouse Name"
                          name="spouseName"
                          value={formData.spouseName}
                          onChange={handleChange}
                          placeholder="Your spouse's full name"
                          icon="💑"
                          required
                        />
                        <DateField
                          label="Wedding Anniversary Date"
                          name="anniversary"
                          value={formData.anniversary}
                          setFormData={setFormData}
                          icon="💝"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Professional Information */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-200">
                  <h3 className="text-xl font-bold text-maroon-800 mb-5 flex items-center gap-2">
                    🎓 Professional Information
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-gray-800 font-bold mb-3 flex items-center gap-2">
                        <span>📚</span> Latest Qualification <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="qualification"
                        value={formData.qualification}
                        onChange={handleChange}
                        required
                        className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-maroon-800 focus:ring-4 focus:ring-maroon-200 text-lg transition-all shadow-sm bg-white hover:border-maroon-400"
                      >
                        <option value="">Select Qualification</option>
                        <option value="Under 10th">Studying in School under 10th</option>
                        <option value="10th">Matriculation</option>
                        <option value="12th">Intermediate</option>
                        <option value="Diploma">Diploma</option>
                        <option value="Bachelor's">Bachelor's</option>
                        <option value="Master's">Master's</option>
                        <option value="PhD">PhD</option>
                      </select>
                    </div>
                    <InputField
                      label="What are you currently doing?"
                      name="currentStatus"
                      value={formData.currentStatus}
                      onChange={handleChange}
                      placeholder="e.g., Working at XYZ Company, Studying at ABC University"
                      icon="💼"
                      required
                    />
                  </div>
                </div>

                {/* Social & Additional */}
                <div className="bg-gradient-to-r from-cyan-50 to-blue-50 p-6 rounded-2xl border-2 border-cyan-200">
                  <h3 className="text-xl font-bold text-maroon-800 mb-5 flex items-center gap-2">
                    🌐 Social & Additional Information
                  </h3>
                  <div className="space-y-6">
                    <InputField label="LinkedIn Profile URL" name="linkedin" type="url" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/your-profile" icon={<Linkedin size={18} className="text-blue-600" />} />
                    <InputField label="WhatsApp Number" name="whatsapp" type="tel" value={formData.whatsapp} onChange={handleChange} placeholder="10 digit number" maxLength={10} icon={<MessageCircle size={18} className="text-green-600" />} />
                    <InputField label="Instagram ID" name="instagram" value={formData.instagram} onChange={handleChange} placeholder="your_instagram_handle" maxLength={30} icon={<Instagram size={18} className="text-pink-600" />} />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || uploadingPhoto}
                  className="w-full bg-gradient-to-r from-maroon-800 via-rose-700 to-orange-600 text-white py-5 rounded-2xl font-bold text-lg hover:from-maroon-700 hover:via-rose-600 hover:to-orange-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl border-2 border-maroon-900"
                >
                  {loading || uploadingPhoto ? (
                    <span className="flex items-center justify-center gap-3">
                      <RefreshCw className="animate-spin" size={24} />
                      {uploadingPhoto ? 'Uploading Photo...' : activeTab === 'register' ? 'Creating Your Profile...' : 'Updating Your Profile...'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-3">
                      <Sparkles size={24} />
                      {activeTab === 'register' ? '🎉 Register Now' : '✨ Update Profile'}
                      <Sparkles size={24} />
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200">
            <p className="text-gray-700 font-semibold text-lg mb-2">💬 Need Help?</p>
            <p className="text-gray-600">Contact our support team for assistance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable Components ─── */

function InputField({ label, name, value, onChange, type = "text", required = false, icon = null, ...props }: any) {
  return (
    <div>
      <label className="block text-gray-800 font-bold mb-3 flex items-center gap-2">
        {typeof icon === 'string' ? <span>{icon}</span> : icon}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        {...props}
        className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-maroon-800 focus:ring-4 focus:ring-maroon-200 transition-all text-lg shadow-sm hover:border-maroon-400"
      />
    </div>
  );
}

function DateField({ label, name, value, setFormData, required = false, icon = null }: any) {
  return (
    <div>
      <label className="block text-gray-800 font-bold mb-3 flex items-center gap-2">
        {typeof icon === 'string' ? <span>{icon}</span> : icon}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {isMobile ? (
        <input
          type="date"
          name={name}
          value={value}
          required={required}
          max={new Date().toISOString().split("T")[0]}
          onChange={e => setFormData((prev: any) => ({ ...prev, [name]: e.target.value }))}
          className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-maroon-800 focus:ring-4 focus:ring-maroon-200 transition-all text-lg shadow-sm hover:border-maroon-400"
        />
      ) : (
        <Flatpickr
          options={{ dateFormat: "Y-m-d", maxDate: "today", disableMobile: true }}
          value={value}
          onChange={(_, dateStr) => setFormData((prev: any) => ({ ...prev, [name]: dateStr }))}
          className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:border-maroon-800 focus:ring-4 focus:ring-maroon-200 transition-all text-lg shadow-sm hover:border-maroon-400"
          required={required}
        />
      )}
    </div>
  );
}