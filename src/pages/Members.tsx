import { useState, useEffect } from 'react';
import { Search, Users, Loader, Sparkles, Linkedin, Instagram, MessageCircle, Mail, Phone, GraduationCap, Briefcase, Calendar, Heart, ExternalLink, Award, Star, User, MapPin, Zap, Copy, Check } from 'lucide-react';
import { supabase, Member } from '../lib/supabase';
import { motion, AnimatePresence } from "framer-motion";

import {
  isTodayBirthday,
  isTodayAnniversary,
} from '../lib/dateUtils';

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [todayCelebrations, setTodayCelebrations] = useState<Member[]>([]);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [members, searchQuery]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMembers(data || []);

      const celebrations = (data || []).filter(
        (m) => isTodayBirthday(m.dob) || isTodayAnniversary(m.anniversary)
      );
      setTodayCelebrations(celebrations);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterMembers = () => {
    const filtered = members.filter((m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMembers(filtered);
  };

  const handleSocialClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  const handleEmailClick = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    window.location.href = `mailto:${email}`;
  };

  const handlePhoneClick = (e: React.MouseEvent, phone: string) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  const handleCopyToClipboard = async (e: React.MouseEvent, text: string, fieldId: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="text-center">
          <div className="relative">
            <Loader className="animate-spin text-maroon-800 mx-auto mb-4" size={56} />
            <Sparkles className="absolute top-0 right-0 text-orange-400 animate-pulse" size={24} />
          </div>
          <p className="text-maroon-700 font-bold text-lg">Loading our amazing community...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className="min-h-screen py-10 px-4 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 relative overflow-hidden"
    >
      {/* Animated Background Elements - Enhanced */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-purple-300/30 to-pink-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-orange-300/30 to-rose-300/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-maroon-300/30 to-purple-300/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating sparkles */}
        <motion.div
          animate={{
            y: [0, -20, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/4 right-1/4"
        >
          <Sparkles className="text-yellow-400" size={24} />
        </motion.div>
        <motion.div
          animate={{
            y: [0, -15, 0],
            opacity: [0.4, 0.9, 0.4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-1/3 left-1/4"
        >
          <Star className="text-pink-400" size={20} />
        </motion.div>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">

        {/* 🎉 Today's Celebrations Banner - Enhanced */}
        {todayCelebrations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="mb-10 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white rounded-3xl p-6 md:p-8 shadow-2xl border-4 border-white/30 backdrop-blur-sm relative overflow-hidden"
          >
            {/* Animated sparkles background */}
            <div className="absolute inset-0 opacity-20">
              <motion.div 
                animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-4 left-4 text-2xl"
              >
                ✨
              </motion.div>
              <motion.div 
                animate={{ scale: [1, 1.3, 1], rotate: [0, -180, -360] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                className="absolute top-4 right-4 text-2xl"
              >
                🎉
              </motion.div>
              <motion.div 
                animate={{ scale: [1, 1.15, 1], y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                className="absolute bottom-4 left-1/4 text-2xl"
              >
                ⭐
              </motion.div>
              <motion.div 
                animate={{ scale: [1, 1.25, 1], y: [0, 10, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: 1.5 }}
                className="absolute bottom-4 right-1/4 text-2xl"
              >
                🎊
              </motion.div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm"
                >
                  <Sparkles size={32} className="text-white" />
                </motion.div>
                <div>
                  <h2 className="text-3xl md:text-4xl font-extrabold">
                    🎊 Today's Special Celebrations! 🎊
                  </h2>
                  <p className="text-white/90 font-medium mt-1">
                    Let's celebrate these wonderful people!
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {todayCelebrations.map((m, index) => (
                  <motion.span
                    key={m.id}
                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ delay: index * 0.1, type: "spring" }}
                    className="bg-white/25 backdrop-blur-md px-5 py-3 rounded-full font-bold text-lg border-2 border-white/40 shadow-lg hover:bg-white/35 transition-all cursor-pointer"
                  >
                    {isTodayBirthday(m.dob) ? '🎂' : '💝'} {m.name}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Header Section - Enhanced */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 mb-10 border-2 border-purple-100"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-4">
                <motion.div 
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-2xl shadow-lg"
                >
                  <Users className="text-white" size={36} />
                </motion.div>
                Community Members
              </h1>
              <p className="text-gray-600 mt-3 text-lg font-medium flex items-center gap-2">
                <Star className="text-orange-400 fill-orange-400" size={20} />
                A beautiful collection of amazing people celebrating life together
              </p>
            </div>

            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" size={20} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members by name..."
                className="w-full pl-12 pr-4 py-4 border-2 border-purple-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 focus:outline-none transition-all shadow-sm text-lg bg-white"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-purple-100 to-pink-100 px-5 py-3 rounded-2xl border-2 border-purple-200 shadow-md"
            >
              <p className="text-purple-800 font-bold text-lg">
                Total Members: <span className="text-2xl text-pink-600">{filteredMembers.length}</span>
              </p>
            </motion.div>
            {todayCelebrations.length > 0 && (
              <motion.div 
                whileHover={{ scale: 1.05 }}
                animate={{ boxShadow: ["0 0 0 0 rgba(249, 115, 22, 0)", "0 0 0 10px rgba(249, 115, 22, 0)"] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="bg-gradient-to-r from-orange-100 to-rose-100 px-5 py-3 rounded-2xl border-2 border-orange-200 shadow-md"
              >
                <p className="text-orange-800 font-bold text-lg">
                  Today's Celebrations: <span className="text-2xl text-rose-600">{todayCelebrations.length}</span>
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Members Grid */}
        {filteredMembers.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/90 backdrop-blur-md rounded-3xl p-14 text-center shadow-2xl border-2 border-purple-100"
          >
            <Users className="mx-auto mb-4 text-gray-400" size={64} />
            <p className="text-gray-600 text-xl font-semibold">
              No members found matching your search.
            </p>
            <p className="text-gray-500 mt-2">Try a different search term!</p>
          </motion.div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member, index) => {
              const isBirthday = isTodayBirthday(member.dob);
              const isAnniversary = isTodayAnniversary(member.anniversary);
              const isCelebrating = isBirthday || isAnniversary;
              const isExpanded = activeCard === member.id;

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  onClick={() => setActiveCard(isExpanded ? null : member.id)}
                  className={`cursor-pointer rounded-3xl p-6 transition-all duration-500 border-2 relative group overflow-hidden
                    ${
                      isCelebrating
                        ? "bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 border-orange-300 shadow-xl ring-4 ring-orange-200"
                        : isExpanded
                        ? "bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 border-purple-400 shadow-2xl scale-[1.02] ring-4 ring-purple-300"
                        : "bg-white/90 backdrop-blur-sm border-purple-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:border-purple-400"
                    }
                  `}
                >
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>

                  {/* Celebration Badge */}
                  {isCelebrating && (
                    <motion.div 
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", duration: 0.8 }}
                      className="absolute -top-3 -right-3 z-20"
                    >
                      <motion.div 
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg border-2 border-white flex items-center gap-2"
                      >
                        {isBirthday ? '🎂 Birthday' : '💝 Anniversary'}
                      </motion.div>
                    </motion.div>
                  )}

                  {/* New Member Badge with shimmer */}
                  {new Date().getTime() - new Date(member.created_at).getTime() < 7 * 24 * 60 * 60 * 1000 && (
                    <motion.div 
                      initial={{ scale: 0, rotate: 180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", duration: 0.8, delay: 0.2 }}
                      className="absolute -top-3 -left-3 z-20"
                    >
                      <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full font-bold text-xs shadow-lg border-2 border-white flex items-center gap-1 overflow-hidden">
                        <motion.div
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        />
                        <Sparkles size={14} className="relative z-10" /> 
                        <span className="relative z-10">NEW</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Profile Photo Section */}
                  <div className="flex flex-col items-center mb-5">
                    <motion.div 
                      animate={isExpanded ? { scale: 1.3 } : { scale: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className={`relative ${isCelebrating ? 'animate-pulse' : ''}`}
                    >
                      {member.profile_photo ? (
                        <div className="relative">
                          <img
                            src={member.profile_photo}
                            alt={member.name}
                            onError={(e) => {
                              console.error('Failed to load image:', member.profile_photo);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                            className={`${isExpanded ? 'w-36 h-36' : 'w-28 h-28'} rounded-full object-cover shadow-xl border-4 transition-all duration-300
                              ${isCelebrating 
                                ? 'border-orange-400 ring-4 ring-orange-200' 
                                : isExpanded
                                ? 'border-purple-500 ring-4 ring-purple-200'
                                : 'border-purple-300 group-hover:border-purple-500 group-hover:ring-4 group-hover:ring-purple-200'
                              }`}
                          />
                          {/* Fallback shown only if image fails */}
                          <div 
                            style={{ display: 'none' }}
                            className={`${isExpanded ? 'w-36 h-36' : 'w-28 h-28'} rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-xl border-4 transition-all duration-300
                              ${isCelebrating 
                                ? 'border-orange-400 ring-4 ring-orange-200' 
                                : isExpanded
                                ? 'border-purple-500 ring-4 ring-purple-200'
                                : 'border-purple-300 group-hover:border-purple-500 group-hover:ring-4 group-hover:ring-purple-200'
                              }`}
                          >
                            <User className="text-white" size={isExpanded ? 56 : 48} />
                          </div>
                        </div>
                      ) : (
                        <div className={`${isExpanded ? 'w-36 h-36' : 'w-28 h-28'} rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-xl border-4 transition-all duration-300
                          ${isCelebrating 
                            ? 'border-orange-400 ring-4 ring-orange-200' 
                            : isExpanded
                            ? 'border-purple-500 ring-4 ring-purple-200'
                            : 'border-purple-300 group-hover:border-purple-500 group-hover:ring-4 group-hover:ring-purple-200'
                          }`}
                        >
                          <User className="text-white" size={isExpanded ? 56 : 48} />
                        </div>
                      )}
                      
                      {/* Celebration Icon Overlay */}
                      {isCelebrating && (
                        <motion.div 
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg border-2 border-orange-400"
                        >
                          <span className="text-2xl">{isBirthday ? '🎉' : '💕'}</span>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>

                  {/* Card Header */}
                  <div className="mb-4">
                    <div className="text-center mb-3">
                      <h3
                        className={`text-2xl font-extrabold transition-colors duration-500 mb-1 ${
                          isCelebrating
                            ? "text-orange-800"
                            : isExpanded
                            ? "text-purple-900"
                            : "text-gray-800 group-hover:text-purple-700"
                        }`}
                      >
                        {member.name}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5">
                        <Calendar size={14} />
                        Joined {new Date(member.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>

                    {/* Quick Info Badges */}
                    <div className="flex flex-wrap gap-2 mb-4 justify-center">
                      <motion.span 
                        whileHover={{ scale: 1.1 }}
                        className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-sm"
                      >
                        <GraduationCap size={12} />
                        {member.qualification}
                      </motion.span>
                    </div>

                    {/* Social Media Icons - Always Visible with enhanced design */}
                    <div className="flex items-center justify-center gap-2 mb-3">
                      {member.linkedin && (
                        <motion.button
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleSocialClick(e, member.linkedin!)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-xl transition-all shadow-md hover:shadow-xl relative overflow-hidden group/social"
                          title="LinkedIn Profile"
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/social:translate-y-0 transition-transform duration-300"></div>
                          <Linkedin size={18} className="relative z-10" />
                        </motion.button>
                      )}

                      {member.whatsapp && (
                        <motion.button
                          whileHover={{ scale: 1.15, rotate: -5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleSocialClick(e, `https://wa.me/91${member.whatsapp}`)}
                          className="bg-green-500 hover:bg-green-600 text-white p-2.5 rounded-xl transition-all shadow-md hover:shadow-xl relative overflow-hidden group/social"
                          title="WhatsApp Chat"
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/social:translate-y-0 transition-transform duration-300"></div>
                          <MessageCircle size={18} className="relative z-10" />
                        </motion.button>
                      )}

                      {member.instagram && (
                        <motion.button
                          whileHover={{ scale: 1.15, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => handleSocialClick(e, `https://instagram.com/${member.instagram.replace('@', '')}`)}
                          className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white p-2.5 rounded-xl transition-all shadow-md hover:shadow-xl relative overflow-hidden group/social"
                          title="Instagram Profile"
                        >
                          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/social:translate-y-0 transition-transform duration-300"></div>
                          <Instagram size={18} className="relative z-10" />
                        </motion.button>
                      )}

                      {!member.linkedin && !member.whatsapp && !member.instagram && (
                        <span className="text-xs text-gray-400 italic">No social links added</span>
                      )}
                    </div>
                  </div>

                  {/* Click to expand indicator */}
                  <motion.div 
                    animate={isExpanded ? { borderColor: ["#c084fc", "#ec4899", "#c084fc"] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-center py-2 border-t-2 border-dashed border-purple-200"
                  >
                    <p className="text-xs text-purple-600 font-semibold flex items-center justify-center gap-2">
                      {isExpanded ? (
                        <>Click to collapse <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity }} className="text-lg">▲</motion.span></>
                      ) : (
                        <>Click to view details <motion.span animate={{ y: [0, 3, 0] }} transition={{ duration: 1, repeat: Infinity }} className="text-lg">▼</motion.span></>
                      )}
                    </p>
                  </motion.div>

                  {/* Expanded Details Section */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="overflow-hidden mt-4 space-y-4"
                      >
                        {/* Contact Information - ENHANCED WITH CLICKABLE ACTIONS */}
                        <motion.div 
                          initial={{ x: -20 }}
                          animate={{ x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border-2 border-purple-200 space-y-3 shadow-lg"
                        >
                          <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2 text-lg">
                            <Phone size={18} className="text-purple-600" />
                            Contact Information
                          </h4>

                          <div className="space-y-2.5">
                            {/* Email - Clickable */}
                            <motion.div 
                              whileHover={{ scale: 1.02, x: 5 }}
                              onClick={(e) => handleEmailClick(e, member.email)}
                              className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-xl hover:from-blue-100 hover:to-cyan-100 transition-all cursor-pointer border-2 border-transparent hover:border-blue-300 group/contact relative"
                            >
                              <motion.div
                                whileHover={{ scale: 1.2, rotate: 15 }}
                                className="bg-blue-500 p-2 rounded-lg text-white flex-shrink-0 mt-0.5 shadow-md group-hover/contact:shadow-lg"
                              >
                                <Mail size={16} />
                              </motion.div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-blue-600 mb-0.5 flex items-center gap-2">
                                  Email 
                                  <span className="text-[10px] bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full opacity-0 group-hover/contact:opacity-100 transition-opacity">
                                    Click to send
                                  </span>
                                </p>
                                <p className="text-sm font-medium text-gray-800 break-all group-hover/contact:text-blue-600 transition-colors">
                                  {member.email}
                                </p>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => handleCopyToClipboard(e, member.email, `email-${member.id}`)}
                                className="bg-blue-200 hover:bg-blue-300 p-1.5 rounded-lg transition-colors opacity-0 group-hover/contact:opacity-100"
                                title="Copy email"
                              >
                                {copiedField === `email-${member.id}` ? (
                                  <Check size={14} className="text-green-600" />
                                ) : (
                                  <Copy size={14} className="text-blue-600" />
                                )}
                              </motion.button>
                            </motion.div>

                            {/* Phone - Clickable */}
                            <motion.div 
                              whileHover={{ scale: 1.02, x: 5 }}
                              onClick={(e) => handlePhoneClick(e, member.phone)}
                              className="flex items-start gap-3 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl hover:from-green-100 hover:to-emerald-100 transition-all cursor-pointer border-2 border-transparent hover:border-green-300 group/contact relative"
                            >
                              <motion.div
                                whileHover={{ scale: 1.2, rotate: 15 }}
                                className="bg-green-500 p-2 rounded-lg text-white flex-shrink-0 mt-0.5 shadow-md group-hover/contact:shadow-lg"
                              >
                                <Phone size={16} />
                              </motion.div>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-green-600 mb-0.5 flex items-center gap-2">
                                  Phone
                                  <span className="text-[10px] bg-green-200 text-green-700 px-2 py-0.5 rounded-full opacity-0 group-hover/contact:opacity-100 transition-opacity">
                                    Click to call
                                  </span>
                                </p>
                                <p className="text-sm font-medium text-gray-800 group-hover/contact:text-green-600 transition-colors">
                                  {member.phone}
                                </p>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => handleCopyToClipboard(e, member.phone, `phone-${member.id}`)}
                                className="bg-green-200 hover:bg-green-300 p-1.5 rounded-lg transition-colors opacity-0 group-hover/contact:opacity-100"
                                title="Copy phone"
                              >
                                {copiedField === `phone-${member.id}` ? (
                                  <Check size={14} className="text-green-600" />
                                ) : (
                                  <Copy size={14} className="text-green-600" />
                                )}
                              </motion.button>
                            </motion.div>
                          </div>
                        </motion.div>

                        {/* Professional Information */}
                        <motion.div 
                          initial={{ x: 20 }}
                          animate={{ x: 0 }}
                          transition={{ delay: 0.2 }}
                          className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border-2 border-purple-200 space-y-3 shadow-lg"
                        >
                          <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2 text-lg">
                            <Briefcase size={18} className="text-purple-600" />
                            Professional Info
                          </h4>

                          <div className="space-y-2.5">
                            <motion.div 
                              whileHover={{ scale: 1.02, x: 5 }}
                              className="flex items-start gap-3 bg-white/50 p-3 rounded-xl hover:bg-white/80 transition-all"
                            >
                              <GraduationCap className="text-purple-500 flex-shrink-0 mt-0.5" size={16} />
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-600 mb-0.5">Education</p>
                                <p className="text-sm font-medium text-gray-800">
                                  {member.qualification}
                                </p>
                              </div>
                            </motion.div>

                            <motion.div 
                              whileHover={{ scale: 1.02, x: 5 }}
                              className="flex items-start gap-3 bg-white/50 p-3 rounded-xl hover:bg-white/80 transition-all"
                            >
                              <Briefcase className="text-orange-500 flex-shrink-0 mt-0.5" size={16} />
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-600 mb-0.5">Current Status</p>
                                <p className="text-sm font-medium text-gray-800">
                                  {member.current_status}
                                </p>
                              </div>
                            </motion.div>
                          </div>
                        </motion.div>

                        {/* Special Dates */}
                        {(member.dob || member.anniversary) && (
                          <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-5 border-2 border-pink-200 space-y-3 shadow-lg"
                          >
                            <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2 text-lg">
                              <Heart size={18} className="text-pink-500 fill-pink-500" />
                              Special Dates
                            </h4>

                            <div className="space-y-2.5">
                              {member.dob && (
                                <motion.div 
                                  whileHover={{ scale: 1.02 }}
                                  className="flex items-center justify-between bg-white/60 p-3 rounded-xl hover:bg-white/90 transition-all"
                                >
                                  <span className="font-semibold text-gray-700 flex items-center gap-2">
                                    🎂 Birthday
                                  </span>
                                  <span className="font-bold text-gray-800">
                                    {new Date(member.dob).toLocaleDateString('en-US', { 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                </motion.div>
                              )}

                              {member.anniversary && (
                                <motion.div 
                                  whileHover={{ scale: 1.02 }}
                                  className="flex items-center justify-between bg-white/60 p-3 rounded-xl hover:bg-white/90 transition-all"
                                >
                                  <span className="font-semibold text-gray-700 flex items-center gap-2">
                                    💝 Anniversary
                                  </span>
                                  <span className="font-bold text-gray-800">
                                    {new Date(member.anniversary).toLocaleDateString('en-US', { 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {/* Social Links (Detailed View) */}
                        {(member.linkedin || member.whatsapp || member.instagram) && (
                          <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-200 shadow-lg"
                          >
                            <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2 text-lg">
                              <Zap size={18} className="text-blue-600" />
                              Connect with {member.name.split(' ')[0]}
                            </h4>

                            <div className="flex flex-wrap gap-2">
                              {member.linkedin && (
                                <motion.button
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => handleSocialClick(e, member.linkedin!)}
                                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg text-sm"
                                >
                                  <Linkedin size={16} />
                                  LinkedIn
                                  <ExternalLink size={12} />
                                </motion.button>
                              )}

                              {member.whatsapp && (
                                <motion.button
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => handleSocialClick(e, `https://wa.me/91${member.whatsapp}`)}
                                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg text-sm"
                                >
                                  <MessageCircle size={16} />
                                  WhatsApp
                                  <ExternalLink size={12} />
                                </motion.button>
                              )}

                              {member.instagram && (
                                <motion.button
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => handleSocialClick(e, `https://instagram.com/${member.instagram.replace('@', '')}`)}
                                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg text-sm"
                                >
                                  <Instagram size={16} />
                                  Instagram
                                  <ExternalLink size={12} />
                                </motion.button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}