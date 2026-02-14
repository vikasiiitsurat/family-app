import { useState, useEffect } from 'react';
import { Search, Users, Loader, Sparkles, Linkedin, Instagram, MessageCircle, Mail, Phone, GraduationCap, Briefcase, Calendar, Heart, ExternalLink, Award, Star } from 'lucide-react';
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
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-orange-200/20 to-rose-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-maroon-200/20 to-purple-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container mx-auto max-w-7xl relative z-10">

        {/* 🎉 Today's Celebrations Banner */}
        {todayCelebrations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white rounded-3xl p-6 md:p-8 shadow-2xl border-4 border-white/20 backdrop-blur-sm relative overflow-hidden"
          >
            {/* Animated sparkles background */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 left-4 animate-ping">✨</div>
              <div className="absolute top-4 right-4 animate-ping" style={{ animationDelay: '0.5s' }}>🎉</div>
              <div className="absolute bottom-4 left-1/4 animate-ping" style={{ animationDelay: '1s' }}>⭐</div>
              <div className="absolute bottom-4 right-1/4 animate-ping" style={{ animationDelay: '1.5s' }}>🎊</div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <Sparkles size={32} className="animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold">
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
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/25 backdrop-blur-md px-5 py-3 rounded-full font-bold text-lg border-2 border-white/40 shadow-lg hover:bg-white/35 transition-all cursor-pointer hover:scale-105"
                  >
                    {isTodayBirthday(m.dob) ? '🎂' : '💝'} {m.name}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Header Section */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 mb-10 border-2 border-purple-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent flex items-center gap-4">
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-2xl">
                  <Users className="text-white" size={36} />
                </div>
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
                className="w-full pl-12 pr-4 py-4 border-2 border-purple-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-200 focus:outline-none transition-all shadow-sm text-lg"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-5 py-3 rounded-2xl border-2 border-purple-200">
              <p className="text-purple-800 font-bold text-lg">
                Total Members: <span className="text-2xl text-pink-600">{filteredMembers.length}</span>
              </p>
            </div>
            {todayCelebrations.length > 0 && (
              <div className="bg-gradient-to-r from-orange-100 to-rose-100 px-5 py-3 rounded-2xl border-2 border-orange-200">
                <p className="text-orange-800 font-bold text-lg">
                  Today's Celebrations: <span className="text-2xl text-rose-600">{todayCelebrations.length}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Members Grid */}
        {filteredMembers.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-14 text-center shadow-2xl border-2 border-purple-100">
            <Users className="mx-auto mb-4 text-gray-400" size={64} />
            <p className="text-gray-600 text-xl font-semibold">
              No members found matching your search.
            </p>
            <p className="text-gray-500 mt-2">Try a different search term!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member, index) => {
              const isBirthday = isTodayBirthday(member.dob);
              const isAnniversary = isTodayAnniversary(member.anniversary);
              const isCelebrating = isBirthday || isAnniversary;

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  onClick={() =>
                    setActiveCard(activeCard === member.id ? null : member.id)
                  }
                  className={`cursor-pointer rounded-3xl p-6 transition-all duration-500 border-2 relative group
                    ${
                      isCelebrating
                        ? "bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 border-orange-300 shadow-xl ring-4 ring-orange-200"
                        : activeCard === member.id
                        ? "bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 border-purple-400 shadow-2xl scale-[1.02] ring-4 ring-purple-300"
                        : "bg-white/90 backdrop-blur-sm border-purple-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 hover:border-purple-400"
                    }
                  `}
                >
                  {/* Celebration Badge */}
                  {isCelebrating && (
                    <div className="absolute -top-3 -right-3 z-20">
                      <div className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg border-2 border-white animate-bounce flex items-center gap-2">
                        {isBirthday ? '🎂 Birthday' : '💝 Anniversary'}
                      </div>
                    </div>
                  )}

                  {/* New Member Badge */}
                  {new Date().getTime() - new Date(member.created_at).getTime() < 7 * 24 * 60 * 60 * 1000 && (
                    <div className="absolute -top-3 -left-3 z-20">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full font-bold text-xs shadow-lg border-2 border-white flex items-center gap-1">
                        <Sparkles size={14} /> NEW
                      </div>
                    </div>
                  )}

                  {/* Card Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3
                          className={`text-2xl font-extrabold transition-colors duration-500 mb-1 ${
                            isCelebrating
                              ? "text-orange-800"
                              : activeCard === member.id
                              ? "text-purple-900"
                              : "text-gray-800 group-hover:text-purple-700"
                          }`}
                        >
                          {member.name}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5">
                          <Calendar size={14} />
                          Joined {new Date(member.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </p>
                      </div>

                      {isCelebrating && (
                        <span className="text-4xl animate-bounce">{isBirthday ? '🎉' : '💕'}</span>
                      )}
                    </div>

                    {/* Quick Info Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <GraduationCap size={12} />
                        {member.qualification}
                      </span>
                    </div>

                    {/* Social Media Icons - Always Visible */}
                    <div className="flex items-center gap-2 mb-3">
                      {member.linkedin && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handleSocialClick(e, member.linkedin!)}
                          className="bg-blue-500 hover:bg-blue-600 text-white p-2.5 rounded-xl transition-all shadow-md hover:shadow-lg group/icon"
                          title="LinkedIn Profile"
                        >
                          <Linkedin size={18} />
                          <ExternalLink size={10} className="absolute -top-1 -right-1 opacity-0 group-hover/icon:opacity-100 transition-opacity" />
                        </motion.button>
                      )}

                      {member.whatsapp && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handleSocialClick(e, `https://wa.me/91${member.whatsapp}`)}
                          className="bg-green-500 hover:bg-green-600 text-white p-2.5 rounded-xl transition-all shadow-md hover:shadow-lg group/icon relative"
                          title="WhatsApp Chat"
                        >
                          <MessageCircle size={18} />
                          <ExternalLink size={10} className="absolute -top-1 -right-1 opacity-0 group-hover/icon:opacity-100 transition-opacity" />
                        </motion.button>
                      )}

                      {member.instagram && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => handleSocialClick(e, `https://instagram.com/${member.instagram.replace('@', '')}`)}
                          className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white p-2.5 rounded-xl transition-all shadow-md hover:shadow-lg group/icon relative"
                          title="Instagram Profile"
                        >
                          <Instagram size={18} />
                          <ExternalLink size={10} className="absolute -top-1 -right-1 opacity-0 group-hover/icon:opacity-100 transition-opacity" />
                        </motion.button>
                      )}

                      {!member.linkedin && !member.whatsapp && !member.instagram && (
                        <span className="text-xs text-gray-400 italic">No social links added</span>
                      )}
                    </div>
                  </div>

                  {/* Click to expand indicator */}
                  <div className="text-center py-2 border-t-2 border-dashed border-purple-200">
                    <p className="text-xs text-purple-600 font-semibold flex items-center justify-center gap-2">
                      {activeCard === member.id ? (
                        <>Click to collapse <span className="text-lg">▲</span></>
                      ) : (
                        <>Click to view details <span className="text-lg">▼</span></>
                      )}
                    </p>
                  </div>

                  {/* Expanded Details Section */}
                  <AnimatePresence>
                    {activeCard === member.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden mt-4 space-y-4"
                      >
                        {/* Contact Information */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border-2 border-purple-200 space-y-3">
                          <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2 text-lg">
                            <Phone size={18} />
                            Contact Information
                          </h4>

                          <div className="space-y-2.5">
                            <div className="flex items-start gap-3 bg-white/50 p-3 rounded-xl">
                              <Mail className="text-blue-500 flex-shrink-0 mt-0.5" size={16} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-600 mb-0.5">Email</p>
                                <p className="text-sm font-medium text-gray-800 break-all">
                                  {member.email}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 bg-white/50 p-3 rounded-xl">
                              <Phone className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-600 mb-0.5">Phone</p>
                                <p className="text-sm font-medium text-gray-800">
                                  {member.phone}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Professional Information */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border-2 border-purple-200 space-y-3">
                          <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2 text-lg">
                            <Briefcase size={18} />
                            Professional Info
                          </h4>

                          <div className="space-y-2.5">
                            <div className="flex items-start gap-3 bg-white/50 p-3 rounded-xl">
                              <GraduationCap className="text-purple-500 flex-shrink-0 mt-0.5" size={16} />
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-600 mb-0.5">Education</p>
                                <p className="text-sm font-medium text-gray-800">
                                  {member.qualification}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-start gap-3 bg-white/50 p-3 rounded-xl">
                              <Briefcase className="text-orange-500 flex-shrink-0 mt-0.5" size={16} />
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-600 mb-0.5">Current Status</p>
                                <p className="text-sm font-medium text-gray-800">
                                  {member.current_status}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Special Dates */}
                        {(member.dob || member.anniversary) && (
                          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-5 border-2 border-pink-200 space-y-3">
                            <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2 text-lg">
                              <Heart size={18} className="text-pink-500" />
                              Special Dates
                            </h4>

                            <div className="space-y-2.5">
                              {member.dob && (
                                <div className="flex items-center justify-between bg-white/60 p-3 rounded-xl">
                                  <span className="font-semibold text-gray-700 flex items-center gap-2">
                                    🎂 Birthday
                                  </span>
                                  <span className="font-bold text-gray-800">
                                    {new Date(member.dob).toLocaleDateString('en-US', { 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                </div>
                              )}

                              {member.anniversary && (
                                <div className="flex items-center justify-between bg-white/60 p-3 rounded-xl">
                                  <span className="font-semibold text-gray-700 flex items-center gap-2">
                                    💝 Anniversary
                                  </span>
                                  <span className="font-bold text-gray-800">
                                    {new Date(member.anniversary).toLocaleDateString('en-US', { 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Social Links (Detailed View) */}
                        {(member.linkedin || member.whatsapp || member.instagram) && (
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border-2 border-blue-200">
                            <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2 text-lg">
                              <Award size={18} />
                              Connect with {member.name.split(' ')[0]}
                            </h4>

                            <div className="flex flex-wrap gap-2">
                              {member.linkedin && (
                                <button
                                  onClick={(e) => handleSocialClick(e, member.linkedin!)}
                                  className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg text-sm"
                                >
                                  <Linkedin size={16} />
                                  LinkedIn
                                  <ExternalLink size={12} />
                                </button>
                              )}

                              {member.whatsapp && (
                                <button
                                  onClick={(e) => handleSocialClick(e, `https://wa.me/91${member.whatsapp}`)}
                                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg text-sm"
                                >
                                  <MessageCircle size={16} />
                                  WhatsApp
                                  <ExternalLink size={12} />
                                </button>
                              )}

                              {member.instagram && (
                                <button
                                  onClick={(e) => handleSocialClick(e, `https://instagram.com/${member.instagram.replace('@', '')}`)}
                                  className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg text-sm"
                                >
                                  <Instagram size={16} />
                                  Instagram
                                  <ExternalLink size={12} />
                                </button>
                              )}
                            </div>
                          </div>
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
