import { useState, useEffect, useMemo } from 'react';
import {
  Search, Loader, Sparkles, Linkedin, Instagram, MessageCircle,
  Mail, Phone, GraduationCap, Briefcase, Calendar, Heart,
  ExternalLink, Star, User, Zap, Copy, Check, Users,
  Filter, ChevronDown, Facebook, UserCheck, Globe,
} from 'lucide-react';
import { supabase, Member } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { isTodayBirthday, isTodayAnniversary } from '../lib/dateUtils';

// ─── Types ───────────────────────────────────────────────────────────────────

type FilterGender = 'all' | 'male' | 'female';
type FilterMarital = 'all' | 'married' | 'unmarried';
type FilterSocial = 'all' | 'has_social';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FAMILY_QUOTES = [
  "Family is not an important thing. It's everything.",
  "Where there is family, there is love.",
  "The bond that links your true family is not one of blood, but of respect and joy in each other's life.",
  "Family means no one gets left behind or forgotten.",
  "In family life, love is the oil that eases friction, the cement that binds closer together.",
  "You don't choose your family. They are God's gift to you.",
  "A happy family is but an earlier heaven.",
];

function getZodiac(dob: string): { sign: string; emoji: string } {
  const date = new Date(dob);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return { sign: 'Aries', emoji: '♈' };
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return { sign: 'Taurus', emoji: '♉' };
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return { sign: 'Gemini', emoji: '♊' };
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return { sign: 'Cancer', emoji: '♋' };
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return { sign: 'Leo', emoji: '♌' };
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return { sign: 'Virgo', emoji: '♍' };
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return { sign: 'Libra', emoji: '♎' };
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return { sign: 'Scorpio', emoji: '♏' };
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return { sign: 'Sagittarius', emoji: '♐' };
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return { sign: 'Capricorn', emoji: '♑' };
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return { sign: 'Aquarius', emoji: '♒' };
  return { sign: 'Pisces', emoji: '♓' };
}

function getAge(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function isNewMember(created_at: string): boolean {
  return new Date().getTime() - new Date(created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
}

function isMarried(member: Member): boolean {
  return !!(member.spouse_name || member.anniversary);
}

function isLateName(name?: string): boolean {
  return /^late\b/i.test((name || '').trim());
}

function getUpcomingBirthdays(members: Member[]): Member[] {
  const now = new Date();
  return members.filter((m) => {
    if (!m.dob) return false;
    const bday = new Date(m.dob);
    const next = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
    if (next < now) next.setFullYear(next.getFullYear() + 1);
    const diff = (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30;
  });
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function FloatingParticle({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: y }}
      animate={{ y: [0, -18, 0], opacity: [0.4, 1, 0.4], scale: [1, 1.15, 1] }}
      transition={{ duration: 3 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <Heart size={size} className="text-rose-300 fill-rose-200" />
    </motion.div>
  );
}

function QuoteCarousel() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % FAMILY_QUOTES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative h-20 flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
          className="absolute text-center text-lg md:text-xl font-semibold text-rose-800 italic px-4"
        >
          "{FAMILY_QUOTES[idx]}"
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

interface MemberCardProps {
  member: Member;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  copiedField: string | null;
  onCopy: (e: React.MouseEvent, text: string, id: string) => void;
}

function MemberCard({ member, index, isExpanded, onToggle, copiedField, onCopy }: MemberCardProps) {
  const isBirthday = isTodayBirthday(member.dob);
  const isAnniversary = isTodayAnniversary(member.anniversary);
  const isCelebrating = isBirthday || isAnniversary;
  const newMember = isNewMember(member.created_at);
  const zodiac = member.dob ? getZodiac(member.dob) : null;
  const age = member.dob ? getAge(member.dob) : null;
  const married = isMarried(member);
  const isMale = member.gender?.toLowerCase() === 'male';
  const hasSocial = !!(member.linkedin || member.whatsapp || member.instagram || member.facebook);

  const handleSocial = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `mailto:${member.email}`;
  };

  const handlePhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${member.phone}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 100 }}
      layout
      onClick={onToggle}
      className={`relative cursor-pointer rounded-3xl border-2 transition-all duration-500 overflow-hidden group
        ${isCelebrating
          ? 'bg-gradient-to-br from-amber-50 via-rose-50 to-orange-50 border-orange-300 shadow-xl ring-4 ring-orange-200'
          : isExpanded
          ? 'bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 border-rose-400 shadow-2xl ring-4 ring-rose-200 scale-[1.01]'
          : 'bg-white/80 backdrop-blur-sm border-rose-100 shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-rose-300'}
      `}
    >
      {/* Shimmer */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>

      {/* Celebration Badge */}
      {isCelebrating && (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring' }}
          className="absolute -top-3 -right-3 z-20"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="bg-gradient-to-r from-orange-500 to-rose-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border-2 border-white"
          >
            {isBirthday ? '🎂 Birthday' : '💝 Anniversary'}
          </motion.div>
        </motion.div>
      )}

      {/* New Member Badge */}
      {newMember && (
        <div className="absolute -top-3 -left-3 z-20 overflow-hidden">
          <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border-2 border-white flex items-center gap-1">
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            />
            <Sparkles size={12} className="relative z-10" />
            <span className="relative z-10">NEW</span>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Profile Photo */}
        <div className="flex flex-col items-center mb-4">
          <motion.div
            animate={isExpanded ? { scale: 1.15 } : { scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className={`relative ${isCelebrating ? 'animate-pulse' : ''}`}
          >
            {member.profile_photo ? (
              <div className="relative">
                <img
                  src={member.profile_photo}
                  alt={member.name}
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    t.style.display = 'none';
                    const fb = t.nextElementSibling as HTMLElement;
                    if (fb) fb.style.display = 'flex';
                  }}
                  className={`${isExpanded ? 'w-28 h-28' : 'w-24 h-24'} rounded-full object-cover shadow-lg border-4 transition-all duration-300
                    ${isCelebrating ? 'border-orange-400 ring-4 ring-orange-200'
                      : isExpanded ? 'border-rose-400 ring-4 ring-rose-200'
                      : 'border-rose-200 group-hover:border-rose-400 group-hover:ring-4 group-hover:ring-rose-100'}`}
                />
                <div
                  style={{ display: 'none' }}
                  className={`${isExpanded ? 'w-28 h-28' : 'w-24 h-24'} rounded-full bg-gradient-to-br from-rose-300 to-orange-300 items-center justify-center shadow-lg border-4 border-rose-200`}
                >
                  <User className="text-white" size={40} />
                </div>
              </div>
            ) : (
              <div className={`${isExpanded ? 'w-28 h-28' : 'w-24 h-24'} rounded-full bg-gradient-to-br from-rose-300 via-pink-300 to-orange-300 flex items-center justify-center shadow-lg border-4 transition-all duration-300
                ${isCelebrating ? 'border-orange-400 ring-4 ring-orange-200'
                  : isExpanded ? 'border-rose-400 ring-4 ring-rose-200'
                  : 'border-rose-200 group-hover:border-rose-400 group-hover:ring-4 group-hover:ring-rose-100'}`}
              >
                <User className="text-white" size={isExpanded ? 48 : 40} />
              </div>
            )}

            {/* Gender + Celebration overlay */}
            <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-md border-2 border-rose-200">
              {isCelebrating
                ? <span className="text-lg">{isBirthday ? '🎉' : '💕'}</span>
                : <span className="text-sm font-bold">{isMale ? '♂' : '♀'}</span>
              }
            </div>
          </motion.div>
        </div>

        {/* Name & Info */}
        <div className="text-center mb-4">
          <h3 className={`text-xl font-extrabold mb-1 transition-colors duration-300
            ${isCelebrating ? 'text-orange-800' : isExpanded ? 'text-rose-800' : 'text-gray-800 group-hover:text-rose-700'}`}
          >
            {member.name}
          </h3>

          {/* Badges row */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 mb-2">
            {married && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 border border-pink-200">
                <Heart size={10} className="fill-pink-500 text-pink-500" /> Married
              </span>
            )}
            {zodiac && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                {zodiac.emoji} {zodiac.sign}
              </span>
            )}
            {age !== null && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-teal-100 text-teal-700 border border-teal-200">
                🎂 {age}y
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
            <Calendar size={11} />
            Joined {new Date(member.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        {/* Social quick icons */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {member.linkedin && (
            <motion.button whileHover={{ scale: 1.2, rotate: 5 }} whileTap={{ scale: 0.9 }}
              onClick={(e) => handleSocial(e, member.linkedin!)}
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-xl shadow-md transition-all" title="LinkedIn">
              <Linkedin size={15} />
            </motion.button>
          )}
          {member.whatsapp && (
            <motion.button whileHover={{ scale: 1.2, rotate: -5 }} whileTap={{ scale: 0.9 }}
              onClick={(e) => handleSocial(e, `https://wa.me/91${member.whatsapp}`)}
              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-xl shadow-md transition-all" title="WhatsApp">
              <MessageCircle size={15} />
            </motion.button>
          )}
          {member.instagram && (
            <motion.button whileHover={{ scale: 1.2, rotate: 5 }} whileTap={{ scale: 0.9 }}
              onClick={(e) => handleSocial(e, `https://instagram.com/${member.instagram.replace('@', '')}`)}
              className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 text-white p-2 rounded-xl shadow-md transition-all" title="Instagram">
              <Instagram size={15} />
            </motion.button>
          )}
          {member.facebook && (
            <motion.button whileHover={{ scale: 1.2, rotate: -5 }} whileTap={{ scale: 0.9 }}
              onClick={(e) => handleSocial(e, member.facebook!)}
              className="bg-blue-700 hover:bg-blue-800 text-white p-2 rounded-xl shadow-md transition-all" title="Facebook">
              <Facebook size={15} />
            </motion.button>
          )}
          {!hasSocial && <span className="text-xs text-gray-400 italic">No social links</span>}
        </div>

        {/* Toggle hint */}
        <div className="text-center border-t-2 border-dashed border-rose-100 pt-3">
          <p className="text-xs text-rose-500 font-semibold flex items-center justify-center gap-1.5">
            {isExpanded ? (
              <>
                <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity }}>▲</motion.span>
                Collapse
              </>
            ) : (
              <>
                <motion.span animate={{ y: [0, 3, 0] }} transition={{ duration: 1, repeat: Infinity }}>▼</motion.span>
                View Details
              </>
            )}
          </p>
        </div>

        {/* ── Expanded Section ── */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="overflow-hidden mt-4 space-y-4"
            >
              {/* Contact */}
              <motion.div initial={{ x: -15 }} animate={{ x: 0 }} transition={{ delay: 0.1 }}
                className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border-2 border-rose-100 shadow space-y-2.5"
              >
                <h4 className="font-bold text-rose-700 flex items-center gap-2 text-sm mb-3">
                  <Phone size={15} /> Contact Information
                </h4>

                {/* Email */}
                <motion.div whileHover={{ x: 5 }} onClick={handleEmail}
                  className="flex items-start gap-3 bg-gradient-to-r from-blue-50 to-cyan-50 p-3 rounded-xl cursor-pointer border-2 border-transparent hover:border-blue-200 group/c transition-all"
                >
                  <div className="bg-blue-500 p-1.5 rounded-lg text-white flex-shrink-0 shadow-sm group-hover/c:shadow-md transition-shadow">
                    <Mail size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-blue-600 mb-0.5">Email · click to send</p>
                    <p className="text-xs font-medium text-gray-700 break-all group-hover/c:text-blue-600 transition-colors">{member.email}</p>
                  </div>
                  <button
                    onClick={(e) => onCopy(e, member.email, `email-${member.id}`)}
                    className="bg-blue-100 hover:bg-blue-200 p-1.5 rounded-lg transition-colors opacity-0 group-hover/c:opacity-100"
                  >
                    {copiedField === `email-${member.id}` ? <Check size={12} className="text-green-600" /> : <Copy size={12} className="text-blue-600" />}
                  </button>
                </motion.div>

                {/* Phone */}
                {member.phone && (
                  <motion.div whileHover={{ x: 5 }} onClick={handlePhone}
                    className="flex items-start gap-3 bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-xl cursor-pointer border-2 border-transparent hover:border-green-200 group/c transition-all"
                  >
                    <div className="bg-green-500 p-1.5 rounded-lg text-white flex-shrink-0 shadow-sm group-hover/c:shadow-md transition-shadow">
                      <Phone size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-semibold text-green-600 mb-0.5">Phone · click to call</p>
                      <p className="text-xs font-medium text-gray-700 group-hover/c:text-green-600 transition-colors">{member.phone}</p>
                    </div>
                    <button
                      onClick={(e) => onCopy(e, member.phone, `phone-${member.id}`)}
                      className="bg-green-100 hover:bg-green-200 p-1.5 rounded-lg transition-colors opacity-0 group-hover/c:opacity-100"
                    >
                      {copiedField === `phone-${member.id}` ? <Check size={12} className="text-green-600" /> : <Copy size={12} className="text-green-600" />}
                    </button>
                  </motion.div>
                )}
              </motion.div>

              {/* Professional */}
              <motion.div initial={{ x: -15 }} animate={{ x: 0 }} transition={{ delay: 0.2 }}
                className="bg-white/70 rounded-2xl p-4 border-2 border-rose-100 shadow space-y-2"
              >
                <h4 className="font-bold text-rose-700 flex items-center gap-2 text-sm mb-3">
                  <Briefcase size={15} /> Professional
                </h4>
                {member.qualification && (
                  <div className="flex items-center gap-2 bg-purple-50 p-2.5 rounded-xl">
                    <GraduationCap size={14} className="text-purple-500" />
                    <div>
                      <p className="text-[10px] text-gray-500 font-semibold">Education</p>
                      <p className="text-xs font-bold text-gray-800">{member.qualification}</p>
                    </div>
                  </div>
                )}
                {member.current_status && (
                  <div className="flex items-center gap-2 bg-orange-50 p-2.5 rounded-xl">
                    <Briefcase size={14} className="text-orange-500" />
                    <div>
                      <p className="text-[10px] text-gray-500 font-semibold">Current Status</p>
                      <p className="text-xs font-bold text-gray-800">{member.current_status}</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Special Dates */}
              {(member.dob || member.anniversary) && (
                <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
                  className="bg-gradient-to-br from-amber-50 to-rose-50 rounded-2xl p-4 border-2 border-amber-100 shadow space-y-2"
                >
                  <h4 className="font-bold text-rose-700 flex items-center gap-2 text-sm mb-3">
                    <Heart size={15} className="fill-rose-500 text-rose-500" /> Special Dates
                  </h4>
                  {member.dob && (
                    <div className="flex items-center justify-between bg-white/70 p-2.5 rounded-xl">
                      <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">🎂 Birthday</span>
                      <span className="text-xs font-bold text-gray-900">
                        {new Date(member.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        {zodiac && <span className="ml-2 text-violet-500">{zodiac.emoji}</span>}
                      </span>
                    </div>
                  )}
                  {member.anniversary && (
                    <div className="flex items-center justify-between bg-white/70 p-2.5 rounded-xl">
                      <span className="text-xs font-semibold text-gray-700 flex items-center gap-2">💝 Anniversary</span>
                      <span className="text-xs font-bold text-gray-900">
                        {new Date(member.anniversary).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Social Links Detailed */}
              {hasSocial && (
                <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-blue-50 to-violet-50 rounded-2xl p-4 border-2 border-blue-100 shadow"
                >
                  <h4 className="font-bold text-rose-700 flex items-center gap-2 text-sm mb-3">
                    <Globe size={15} /> Connect with {member.name.split(' ')[0]}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {member.linkedin && (
                      <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleSocial(e, member.linkedin!)}
                        className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-xl font-semibold transition-all shadow-md text-xs"
                      >
                        <Linkedin size={13} /> LinkedIn <ExternalLink size={10} />
                      </motion.button>
                    )}
                    {member.whatsapp && (
                      <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleSocial(e, `https://wa.me/91${member.whatsapp}`)}
                        className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-xl font-semibold transition-all shadow-md text-xs"
                      >
                        <MessageCircle size={13} /> WhatsApp <ExternalLink size={10} />
                      </motion.button>
                    )}
                    {member.instagram && (
                      <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleSocial(e, `https://instagram.com/${member.instagram.replace('@', '')}`)}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-xl font-semibold transition-all shadow-md text-xs"
                      >
                        <Instagram size={13} /> Instagram <ExternalLink size={10} />
                      </motion.button>
                    )}
                    {member.facebook && (
                      <motion.button whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                        onClick={(e) => handleSocial(e, member.facebook!)}
                        className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-xl font-semibold transition-all shadow-md text-xs"
                      >
                        <Facebook size={13} /> Facebook <ExternalLink size={10} />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main Family Page ─────────────────────────────────────────────────────────

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<FilterGender>('all');
  const [filterMarital, setFilterMarital] = useState<FilterMarital>('all');
  const [filterSocial, setFilterSocial] = useState<FilterSocial>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (e: React.MouseEvent, text: string, fieldId: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch { /* silent */ }
  };

  const visibleMembers = useMemo(
    () => members.filter((m) => !isLateName(m.name)),
    [members]
  );

  const filteredMembers = useMemo(() => {
    return visibleMembers.filter((m) => {
      if (!m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterGender !== 'all') {
        const g = m.gender?.toLowerCase();
        if (filterGender === 'male' && g !== 'male') return false;
        if (filterGender === 'female' && g !== 'female') return false;
      }
      if (filterMarital !== 'all') {
        const married = isMarried(m);
        if (filterMarital === 'married' && !married) return false;
        if (filterMarital === 'unmarried' && married) return false;
      }
      if (filterSocial === 'has_social' && !m.linkedin && !m.whatsapp && !m.instagram && !m.facebook) return false;
      return true;
    });
  }, [visibleMembers, searchQuery, filterGender, filterMarital, filterSocial]);

  // Stats
  const totalMarried = useMemo(() => visibleMembers.filter(isMarried).length, [visibleMembers]);
  const upcomingBirthdays = useMemo(() => getUpcomingBirthdays(visibleMembers).length, [visibleMembers]);
  const todayCelebrations = useMemo(
    () => visibleMembers.filter((m) => isTodayBirthday(m.dob) || isTodayAnniversary(m.anniversary)),
    [visibleMembers]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50">
        <div className="text-center">
          <div className="relative inline-block">
            <Loader className="animate-spin text-rose-500 mx-auto mb-4" size={52} />
            <Heart className="absolute top-0 right-0 text-pink-400 animate-pulse fill-pink-300" size={22} />
          </div>
          <p className="text-rose-700 font-bold text-lg mt-4">Gathering our family...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 relative overflow-hidden"
    >
      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-rose-200/40 to-pink-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-200/40 to-amber-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-purple-200/20 to-rose-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* ── Floating Hearts ── */}
      <FloatingParticle delay={0} x="8%" y="20%" size={18} />
      <FloatingParticle delay={1.2} x="90%" y="15%" size={14} />
      <FloatingParticle delay={0.5} x="15%" y="70%" size={12} />
      <FloatingParticle delay={1.8} x="85%" y="65%" size={16} />
      <FloatingParticle delay={0.8} x="50%" y="10%" size={10} />

      <div className="relative z-10">

        {/* ════════════════ HERO SECTION ════════════════ */}
        <section className="relative pt-20 pb-28 px-4 text-center overflow-hidden">

          {/* Decorative arch */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 rounded-t-[50%]" />

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 80, duration: 1 }}
            className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-md border-2 border-rose-200 px-6 py-3 rounded-full shadow-lg mb-8"
          >
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Heart className="text-rose-500 fill-rose-400" size={22} />
            </motion.div>
            <span className="text-rose-700 font-bold text-lg tracking-wide">A Place of Love & Belonging</span>
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}>
              <Heart className="text-rose-500 fill-rose-400" size={22} />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-6xl md:text-8xl font-extrabold mb-4"
          >
            <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 bg-clip-text text-transparent drop-shadow-sm">
              Our Family
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="text-xl md:text-2xl text-rose-700/80 font-semibold mb-10 max-w-xl mx-auto"
          >
            Bound by Love, Strengthened by Unity
          </motion.p>

          {/* ── Today's Celebrations Banner ── */}
          {todayCelebrations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', delay: 0.5 }}
              className="inline-flex flex-wrap items-center justify-center gap-3 bg-gradient-to-r from-orange-400 via-rose-500 to-pink-500 text-white px-8 py-4 rounded-3xl shadow-2xl border-4 border-white/30 mb-10 max-w-2xl mx-auto"
            >
              <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-2xl">🎊</motion.span>
              <span className="font-bold text-lg">Today we celebrate:</span>
              {todayCelebrations.map((m) => (
                <span key={m.id} className="bg-white/25 px-4 py-1.5 rounded-full font-bold text-sm border border-white/40">
                  {isTodayBirthday(m.dob) ? '🎂' : '💝'} {m.name}
                </span>
              ))}
              <motion.span animate={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }} className="text-2xl">🎊</motion.span>
            </motion.div>
          )}

          {/* ── Stats Row ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            {[
              { icon: <Users size={20} />, value: visibleMembers.length, label: 'Total Members', color: 'from-rose-400 to-pink-500', bg: 'from-rose-50 to-pink-50', border: 'border-rose-200', text: 'text-rose-700' },
              { icon: <Heart size={20} className="fill-current" />, value: totalMarried, label: 'Married Couples', color: 'from-pink-400 to-rose-500', bg: 'from-pink-50 to-rose-50', border: 'border-pink-200', text: 'text-pink-700' },
              { icon: <Star size={20} className="fill-current" />, value: upcomingBirthdays, label: 'Birthdays (30d)', color: 'from-amber-400 to-orange-500', bg: 'from-amber-50 to-orange-50', border: 'border-amber-200', text: 'text-amber-700' },
              { icon: <Sparkles size={20} />, value: todayCelebrations.length, label: "Today's Special", color: 'from-purple-400 to-pink-500', bg: 'from-purple-50 to-pink-50', border: 'border-purple-200', text: 'text-purple-700' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.08, y: -4 }}
                className={`bg-gradient-to-br ${stat.bg} border-2 ${stat.border} px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm`}
              >
                <div className={`flex items-center gap-2 ${stat.text} mb-1`}>
                  <div className={`bg-gradient-to-br ${stat.color} text-white p-1.5 rounded-lg`}>{stat.icon}</div>
                  <span className="text-3xl font-extrabold">{stat.value}</span>
                </div>
                <p className={`text-xs font-semibold ${stat.text} opacity-70`}>{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ════════════════ SEARCH & FILTER ════════════════ */}
        <section className="px-4 pb-8 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 border-2 border-rose-100"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400" size={18} />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search family members..."
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-rose-200 rounded-2xl focus:border-rose-400 focus:ring-4 focus:ring-rose-100 focus:outline-none transition-all text-base bg-white"
                />
              </div>

              {/* Filter toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl border-2 font-semibold transition-all shadow-sm text-sm
                  ${showFilters ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}
              >
                <Filter size={16} />
                Filters
                <motion.div animate={{ rotate: showFilters ? 180 : 0 }} transition={{ duration: 0.3 }}>
                  <ChevronDown size={16} />
                </motion.div>
              </motion.button>
            </div>

            {/* Filter dropdowns */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t-2 border-dashed border-rose-100">
                    {/* Gender */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">Gender:</span>
                      {(['all', 'male', 'female'] as FilterGender[]).map((g) => (
                        <button
                          key={g}
                          onClick={() => setFilterGender(g)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all
                            ${filterGender === g ? 'bg-rose-500 text-white border-rose-500 shadow' : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'}`}
                        >
                          {g === 'all' ? 'All' : g === 'male' ? '♂ Male' : '♀ Female'}
                        </button>
                      ))}
                    </div>

                    {/* Marital */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-pink-600 uppercase tracking-wide">Status:</span>
                      {(['all', 'married', 'unmarried'] as FilterMarital[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setFilterMarital(s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all
                            ${filterMarital === s ? 'bg-pink-500 text-white border-pink-500 shadow' : 'bg-white text-pink-600 border-pink-200 hover:bg-pink-50'}`}
                        >
                          {s === 'all' ? 'All' : s === 'married' ? '💍 Married' : '🕊️ Unmarried'}
                        </button>
                      ))}
                    </div>

                    {/* Social */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">Social:</span>
                      {(['all', 'has_social'] as FilterSocial[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setFilterSocial(s)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all
                            ${filterSocial === s ? 'bg-purple-500 text-white border-purple-500 shadow' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'}`}
                        >
                          {s === 'all' ? 'All' : '🌐 Has Social'}
                        </button>
                      ))}
                    </div>

                    {/* Result count */}
                    <div className="ml-auto flex items-center">
                      <span className="text-sm font-bold text-gray-500">
                        Showing <span className="text-rose-600 text-base">{filteredMembers.length}</span> of {visibleMembers.length} members
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* ════════════════ MEMBER GRID ════════════════ */}
        <section className="px-4 pb-20 max-w-7xl mx-auto">
          {filteredMembers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/90 rounded-3xl p-16 text-center shadow-xl border-2 border-rose-100"
            >
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <Heart className="mx-auto mb-4 text-rose-300 fill-rose-100" size={64} />
              </motion.div>
              <p className="text-gray-600 text-xl font-bold">No family members found.</p>
              <p className="text-gray-400 mt-2">Try adjusting your search or filters.</p>
            </motion.div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMembers.map((member, index) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  index={index}
                  isExpanded={activeCard === member.id}
                  onToggle={() => setActiveCard(activeCard === member.id ? null : member.id)}
                  copiedField={copiedField}
                  onCopy={handleCopy}
                />
              ))}
            </div>
          )}
        </section>

        {/* ════════════════ QUOTE CAROUSEL ════════════════ */}
        <section className="px-4 pb-20 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400 rounded-3xl p-10 text-center shadow-2xl border-4 border-white/30 relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-white text-4xl select-none"
                  style={{ left: `${10 + i * 16}%`, top: `${20 + (i % 2) * 40}%` }}
                  animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.3, 1] }}
                  transition={{ duration: 3, delay: i * 0.4, repeat: Infinity }}
                >
                  ❤️
                </motion.div>
              ))}
            </div>

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="inline-block bg-white/20 p-3 rounded-2xl mb-4 backdrop-blur-sm"
            >
              <Heart className="text-white fill-white" size={28} />
            </motion.div>

            <p className="text-white/80 font-semibold text-sm uppercase tracking-widest mb-3">Family Wisdom</p>
            <QuoteCarousel />
            <div className="flex justify-center gap-1.5 mt-6">
              {FAMILY_QUOTES.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40" />
              ))}
            </div>
          </motion.div>
        </section>

      </div>
    </motion.div>
  );
}
