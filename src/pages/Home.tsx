import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { supabase } from '../lib/supabase';
import Confetti from '../components/Confetti';

// ─── DB SCHEMA ────────────────────────────────────────────────────────────────
interface Member {
  id: string;
  name: string;
  email: string;
  dob: string;
  phone: string;
  qualification: string;
  current_status: string;
  anniversary?: string | null;
  linkedin?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  profile_photo?: string | null;
  fathers_name?: string | null;
  mothers_name?: string | null;
  spouse_name?: string | null;
  timezone?: string | null;
}

interface HomeProps {
  onNavigate: (page: 'register' | 'members' | 'privacy' | 'familyTree') => void;
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

function namesMatch(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
}

function deduplicateMembers(members: Member[]): Member[] {
  const merged: Member[] = [];
  for (const m of members) {
    const match = merged.find(e => namesMatch(m.name, e.name));
    if (match) {
      (Object.keys(m) as (keyof Member)[]).forEach(k => {
        if (m[k] != null && m[k] !== '' && !match[k]) (match as any)[k] = m[k];
      });
    } else {
      merged.push({ ...m });
    }
  }
  return merged;
}

function isToday(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr), t = new Date();
  return d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

function isThisMonth(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr).getMonth() === new Date().getMonth();
}

function getNextOccurrence(dateStr: string): Date {
  const today = new Date();
  const d = new Date(dateStr);
  d.setFullYear(today.getFullYear());
  if (d < today) d.setFullYear(today.getFullYear() + 1);
  return d;
}

function getDaysUntil(dateStr: string): number {
  return Math.ceil((getNextOccurrence(dateStr).getTime() - Date.now()) / 86400000);
}

function getAge(dob: string): number {
  const b = new Date(dob), t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--;
  return age;
}

function getYearsMarried(anniversary: string): number {
  return new Date().getFullYear() - new Date(anniversary).getFullYear();
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
const AVATAR_GRADIENTS = [
  'from-rose-400 to-pink-600',
  'from-violet-400 to-purple-600',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-600',
  'from-sky-400 to-blue-600',
  'from-fuchsia-400 to-pink-600',
];

function Avatar({
  member,
  size = 48,
  ring = false,
}: {
  member: Member;
  size?: number;
  ring?: boolean;
}) {
  const grad = AVATAR_GRADIENTS[member.id?.charCodeAt(0) % AVATAR_GRADIENTS.length ?? 0];
  return (
    <div
      className={`rounded-full flex-shrink-0 flex items-center justify-center text-white font-extrabold overflow-hidden
        ${ring ? 'ring-4 ring-white shadow-xl' : 'shadow-md'}`}
      style={{ width: size, height: size, fontSize: size * 0.33, background: member.profile_photo ? 'transparent' : undefined }}
    >
      {member.profile_photo
        ? <img src={member.profile_photo} alt={member.name} className="w-full h-full object-cover" />
        : (
          <div className={`w-full h-full bg-gradient-to-br ${grad} flex items-center justify-center`}>
            {getInitials(member.name)}
          </div>
        )
      }
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold">{children}</span>;
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 1 — HERO
// ════════════════════════════════════════════════════════════════════════════════
function HeroSection({ onNavigate }: HomeProps) {
  const floatingIcons = ['✨', '💖', '🎂', '🎵', '🌸', '💫', '🎁', '⭐', '🎊', '💝'];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Base background */}
      <div className="absolute inset-0 bg-[#1c0a00]" />

      {/* Radial glows */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(180,60,0,0.35) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 80% 60%, rgba(130,20,50,0.4) 0%, transparent 65%), radial-gradient(ellipse 50% 50% at 50% 100%, rgba(200,100,0,0.2) 0%, transparent 60%)'
      }} />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(rgba(255,180,80,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,180,80,0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* Floating emojis */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingIcons.map((icon, i) => (
          <motion.span
            key={i}
            className="absolute text-2xl select-none"
            style={{ left: `${8 + i * 9.2}%`, bottom: '-5%' }}
            animate={{ y: [0, -900], opacity: [0, 0.5, 0.5, 0] }}
            transition={{ duration: 14 + i * 1.5, repeat: Infinity, delay: i * 1.8, ease: 'easeInOut' }}
          >
            {icon}
          </motion.span>
        ))}
      </div>

      {/* Pulsing rings */}
      {[300, 520, 740].map((size, i) => (
        <motion.div key={i}
          className="absolute rounded-full border border-orange-800/20"
          style={{ width: size, height: size }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, delay: i * 1.5 }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 bg-orange-950/60 backdrop-blur border border-orange-700/40 rounded-full px-5 py-2 text-orange-300 text-xs font-bold mb-8 tracking-[0.25em] uppercase"
        >
          ✨ Family Celebration Hub ✨
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.15 }}
          className="text-6xl md:text-8xl font-black text-white leading-none mb-4"
          style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: '-0.02em' }}
        >
          Celebrating
          <span className="block bg-gradient-to-r from-orange-300 via-rose-300 to-amber-200 bg-clip-text text-transparent mt-1">
            Life, Love
          </span>
          <span className="block text-4xl md:text-6xl font-light text-white/50 mt-3 tracking-wide">
            & Family Together
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xl text-white/50 mb-12 italic"
          style={{ fontFamily: "'Georgia', serif" }}
        >
          Every moment counts. Every connection matters.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('register')}
            className="bg-gradient-to-r from-orange-500 to-rose-600 text-white px-10 py-4 rounded-2xl font-bold text-lg shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-shadow"
          >
            🎉 Add Family Member
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('members')}
            className="bg-white/10 backdrop-blur border border-white/25 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-colors"
          >
            👨‍👩‍👧 View All Members
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('familyTree')}
            className="bg-white/10 backdrop-blur border border-white/25 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-white/20 transition-colors"
          >
            🌳 Family Tree
          </motion.button>
        </motion.div>
      </div>

      {/* Fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#fdf6ee] to-transparent" />
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 2 — TODAY'S CELEBRATIONS
// ════════════════════════════════════════════════════════════════════════════════
function TodaySection({ members }: { members: Member[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const todayBdays = members.filter(m => isToday(m.dob));
  const todayAnnivs = members.filter(m => m.anniversary && isToday(m.anniversary));
  const hasCelebrations = todayBdays.length > 0 || todayAnnivs.length > 0;

  return (
    <section ref={ref} className="py-24 px-5 bg-[#fdf6ee]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-orange-500 mb-3">TODAY</p>
          <h2 className="text-5xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Georgia', serif" }}>
            Today's Celebrations 🎊
          </h2>
          <p className="text-gray-400 italic text-lg">Moments that deserve to be honoured</p>
        </motion.div>

        {!hasCelebrations ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            className="text-center py-20 rounded-3xl border-2 border-dashed border-orange-200 bg-white/60"
          >
            <div className="text-7xl mb-5">🎈</div>
            <p className="text-2xl text-gray-500" style={{ fontFamily: "'Georgia', serif", fontStyle: 'italic' }}>
              No celebrations today —<br />but love is always around!
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {todayBdays.map((m, i) => (
              <TodayCard key={m.id} member={m} type="birthday" delay={i * 0.15} inView={inView} />
            ))}
            {todayAnnivs.map((m, i) => (
              <TodayCard key={m.id + 'a'} member={m} type="anniversary" delay={(todayBdays.length + i) * 0.15} inView={inView} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function TodayCard({ member: m, type, delay, inView }: {
  member: Member; type: 'birthday' | 'anniversary'; delay: number; inView: boolean;
}) {
  const isBday = type === 'birthday';
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, type: 'spring' }}
      className={`relative overflow-hidden rounded-3xl shadow-2xl ${isBday
        ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600'
        : 'bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600'}`}
    >
      {/* Sparkle dots */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(16)].map((_, i) => (
          <motion.div key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-white/30"
            style={{ left: `${(i * 6.5) % 100}%`, top: `${(i * 11.3) % 100}%` }}
            animate={{ opacity: [0.2, 0.7, 0.2], scale: [1, 1.6, 1] }}
            transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>

      <div className="relative z-10 p-7 md:p-10 flex flex-col md:flex-row items-center gap-7">
        <motion.div
          animate={{ scale: [1, 1.06, 1], rotate: [0, 3, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Avatar member={m} size={90} ring />
        </motion.div>

        <div className="flex-1 text-white text-center md:text-left">
          <span className="inline-block bg-white/25 text-white/90 text-xs font-extrabold tracking-[0.25em] uppercase px-4 py-1 rounded-full mb-3">
            {isBday ? '🎂 Happy Birthday!' : '💍 Happy Anniversary!'}
          </span>
          <h3 className="text-4xl md:text-5xl font-black mb-2" style={{ fontFamily: "'Georgia', serif" }}>{m.name}</h3>

          <p className="text-white/80 text-lg mb-4">
            {isBday
              ? `🎉 Turning ${getAge(m.dob)} years young today!`
              : m.anniversary
                ? `💕 ${getYearsMarried(m.anniversary)} beautiful years with ${m.spouse_name || 'your love'}!`
                : ''
            }
          </p>

          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {m.email && <Chip>📧 {m.email}</Chip>}
            {m.phone && <Chip>📱 {m.phone}</Chip>}
            {m.current_status && <Chip>💼 {m.current_status}</Chip>}
            {m.qualification && <Chip>🎓 {m.qualification}</Chip>}
          </div>
        </div>

        <motion.div
          className="text-7xl"
          animate={{ y: [0, -12, 0], rotate: [0, 12, -12, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          {isBday ? '🥳' : '🥂'}
        </motion.div>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 3 — THIS MONTH
// ════════════════════════════════════════════════════════════════════════════════
function MonthSection({ members }: { members: Member[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const events: { member: Member; type: 'birthday' | 'anniversary'; date: string; day: number }[] = [];
  members.forEach(m => {
    if (isThisMonth(m.dob) && !isToday(m.dob))
      events.push({ member: m, type: 'birthday', date: m.dob, day: new Date(m.dob).getDate() });
    if (m.anniversary && isThisMonth(m.anniversary) && !isToday(m.anniversary))
      events.push({ member: m, type: 'anniversary', date: m.anniversary, day: new Date(m.anniversary).getDate() });
  });
  events.sort((a, b) => a.day - b.day);

  return (
    <section ref={ref} className="py-24 px-5 bg-white">
      <div className="max-w-3xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-rose-500 mb-3">THIS MONTH</p>
          <h2 className="text-5xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Georgia', serif" }}>
            Coming Up 📅
          </h2>
          <p className="text-gray-400 italic">Mark your calendar for these special moments</p>
        </motion.div>

        {events.length === 0 ? (
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            className="text-center text-gray-400 italic py-16 text-lg"
          >
            No more events this month
          </motion.p>
        ) : (
          <div className="space-y-3">
            {events.map(({ member: m, type, date }, i) => {
              const daysLeft = getDaysUntil(date);
              return (
                <motion.div
                  key={`${m.id}-${type}`}
                  initial={{ opacity: 0, x: -30 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: i * 0.08, duration: 0.5 }}
                  className="flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-r from-orange-50/60 to-rose-50/60 border border-orange-100 hover:shadow-md hover:border-orange-200 transition-all group"
                >
                  {/* Date badge */}
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-black shadow-lg flex-shrink-0 ${type === 'birthday'
                    ? 'bg-gradient-to-br from-orange-400 to-rose-500'
                    : 'bg-gradient-to-br from-rose-500 to-fuchsia-600'}`}
                  >
                    <span className="text-xl leading-none">{new Date(date).getDate()}</span>
                    <span className="text-[10px] opacity-80 font-bold">
                      {new Date(date).toLocaleString('default', { month: 'short' })}
                    </span>
                  </div>

                  <Avatar member={m} size={46} />

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-base group-hover:text-orange-700 transition-colors truncate">{m.name}</p>
                    <p className="text-gray-400 text-sm truncate">
                      {m.current_status || (type === 'birthday' ? `Turning ${getAge(m.dob) + 1}` : `${getYearsMarried(date) + 1} years`)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${type === 'birthday'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-rose-100 text-rose-700'}`}
                    >
                      {type === 'birthday' ? '🎂 Birthday' : '💍 Anniversary'}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      {daysLeft === 0 ? 'Today!' : `in ${daysLeft}d`}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 4 — UPCOMING
// ════════════════════════════════════════════════════════════════════════════════
function UpcomingSection({ members }: { members: Member[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const ranked = (type: 'birthday' | 'anniversary') =>
    members
      .filter(m => type === 'birthday' ? !isToday(m.dob) : m.anniversary && !isToday(m.anniversary))
      .map(m => ({ m, days: getDaysUntil(type === 'birthday' ? m.dob : m.anniversary!) }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 3);

  const upBdays = ranked('birthday');
  const upAnnivs = ranked('anniversary');

  return (
    <section ref={ref} className="py-24 px-5 bg-[#fdf6ee]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-violet-500 mb-3">UPCOMING</p>
          <h2 className="text-5xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Georgia', serif" }}>
            Next Celebrations 🎉
          </h2>
          <p className="text-gray-400 italic">Don't miss these special moments coming up soon</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.15 }}>
            <h3 className="text-lg font-extrabold text-gray-700 mb-4 flex items-center gap-2">🎂 Upcoming Birthdays</h3>
            <div className="space-y-3">
              {upBdays.map(({ m, days }, i) => (
                <UpcomingCard key={m.id} member={m} days={days} label={`Turning ${getAge(m.dob) + 1}`} color="from-orange-400 to-rose-500" rank={i} />
              ))}
              {upBdays.length === 0 && <p className="text-gray-400 italic text-sm p-4">No upcoming birthdays</p>}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.25 }}>
            <h3 className="text-lg font-extrabold text-gray-700 mb-4 flex items-center gap-2">💍 Upcoming Anniversaries</h3>
            <div className="space-y-3">
              {upAnnivs.map(({ m, days }, i) => (
                <UpcomingCard
                  key={m.id + 'a'}
                  member={m}
                  days={days}
                  label={m.spouse_name ? `with ${m.spouse_name}` : `${getYearsMarried(m.anniversary!) + 1}y`}
                  color="from-rose-500 to-fuchsia-600"
                  rank={i}
                />
              ))}
              {upAnnivs.length === 0 && <p className="text-gray-400 italic text-sm p-4">No upcoming anniversaries</p>}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function UpcomingCard({ member: m, days, label, color, rank }: {
  member: Member; days: number; label: string; color: string; rank: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      whileHover={{ x: 4 }}
      className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-orange-50 to-rose-50/40 border border-orange-100 hover:border-orange-200 hover:shadow-md transition-all"
    >
      <Avatar member={m} size={48} />
      <div className="flex-1 min-w-0">
        <p className="font-extrabold text-gray-900 truncate">{m.name}</p>
        <p className="text-sm text-gray-500 truncate">{label}</p>
      </div>
      <div className={`flex-shrink-0 bg-gradient-to-br ${color} text-white rounded-xl px-3 py-2 text-center shadow-md min-w-[56px]`}>
        <p className="text-xl font-black leading-none">{days}</p>
        <p className="text-[10px] font-bold opacity-80 uppercase tracking-wide">days</p>
      </div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 5 — STATS
// ════════════════════════════════════════════════════════════════════════════════
function StatsSection({ members }: { members: Member[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const thisMonth = members.filter(m =>
    isThisMonth(m.dob) || (m.anniversary && isThisMonth(m.anniversary))
  ).length;
  const married = members.filter(m => m.spouse_name || m.anniversary).length;

  const stats = [
    { icon: '👥', value: members.length, label: 'Family Members', sub: 'and growing', color: 'from-orange-500 to-rose-500' },
    { icon: '🎉', value: thisMonth, label: 'Events This Month', sub: 'to celebrate', color: 'from-rose-500 to-fuchsia-600' },
    { icon: '💍', value: married, label: 'Married Couples', sub: 'love stories', color: 'from-fuchsia-500 to-violet-600' },
  ];

  return (
    <section ref={ref} className="py-24 px-5 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-orange-500 mb-3">AT A GLANCE</p>
          <h2 className="text-5xl font-black text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>
            Family by Numbers 📊
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative overflow-hidden rounded-3xl bg-white shadow-xl border border-orange-100 p-8 text-center cursor-default"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-[0.06]`} />
              <div className="relative z-10">
                <div className="text-5xl mb-4">{s.icon}</div>
                <motion.div
                  className={`text-6xl font-black bg-gradient-to-br ${s.color} bg-clip-text text-transparent mb-2`}
                  animate={inView ? { scale: [0.4, 1.08, 1] } : {}}
                  transition={{ delay: 0.3 + i * 0.15, duration: 0.7, type: 'spring' }}
                >
                  {s.value}
                </motion.div>
                <p className="font-extrabold text-gray-800 text-lg">{s.label}</p>
                <p className="text-gray-400 text-sm italic mt-1">{s.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 6 — FAMILY TREE PROMO BANNER
// ════════════════════════════════════════════════════════════════════════════════
function FamilyTreeBanner({ onNavigate }: HomeProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-20 px-5 bg-[#fdf6ee]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, #0d2610 0%, #061009 50%, #0a1f0d 100%)',
            border: '1px solid rgba(52,211,153,0.2)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(52,211,153,0.1)',
          }}
        >
          {/* Animated particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {['🍃', '🌿', '✨', '🌱', '💫', '⭐', '🍀', '🌸'].map((icon, i) => (
              <motion.span
                key={i}
                className="absolute text-lg select-none opacity-20"
                style={{ left: `${10 + i * 12}%`, bottom: '-5%' }}
                animate={{ y: [0, -300], opacity: [0, 0.3, 0] }}
                transition={{ duration: 10 + i, repeat: Infinity, delay: i * 1.2, ease: 'easeInOut' }}
              >
                {icon}
              </motion.span>
            ))}
          </div>

          {/* Glow orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
            style={{ background: 'radial-gradient(circle, #34d399 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-8 blur-3xl"
            style={{ background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)' }} />

          <div className="relative z-10 p-10 md:p-14 flex flex-col md:flex-row items-center gap-8">
            {/* Icon side */}
            <motion.div
              className="text-8xl md:text-9xl flex-shrink-0 select-none"
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            >
              🌳
            </motion.div>

            {/* Text side */}
            <div className="flex-1 text-center md:text-left">
              <motion.span
                className="inline-block text-xs font-bold tracking-[0.3em] uppercase mb-3 px-4 py-1.5 rounded-full"
                style={{ color: 'rgba(52,211,153,0.9)', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.3 }}
              >
                ✨ New Feature
              </motion.span>

              <motion.h2
                className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight"
                style={{ fontFamily: "'Georgia', serif" }}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.4 }}
              >
                Explore Your{' '}
                <span style={{
                  background: 'linear-gradient(135deg, #34d399, #fbbf24)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  Family Tree
                </span>
              </motion.h2>

              <motion.p
                className="text-white/50 mb-6 text-base leading-relaxed"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.5 }}
              >
                Visualise generations of your family in a beautiful interactive tree. Drag, zoom, hover to discover connections and celebrate milestones.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-3 justify-center md:justify-start mb-6"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 0.55 }}
              >
                {['🔍 Search members', '📊 Live stats', '💕 Couple links', '🎂 Birthday glow', '🖱️ Pan & zoom'].map(tag => (
                  <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full"
                    style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {tag}
                  </span>
                ))}
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate('familyTree')}
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #34d399 50%, #fbbf24 100%)',
                  boxShadow: '0 10px 40px rgba(52,211,153,0.3)',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.65 }}
              >
                🌳 Open Family Tree
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 7 — CTA
// ════════════════════════════════════════════════════════════════════════════════
function CtaSection({ onNavigate, totalMembers }: {
  onNavigate: (p: 'register' | 'members' | 'privacy' | 'familyTree') => void;
  totalMembers: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-32 px-5 relative overflow-hidden bg-[#1c0a00]">
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 70% 70% at 30% 50%, rgba(200,70,0,0.35) 0%, transparent 65%), radial-gradient(ellipse 60% 80% at 75% 50%, rgba(160,20,60,0.4) 0%, transparent 60%)'
      }} />

      {['💖', '✨', '🎊', '🌟', '💫', '🎁', '🎂', '💝'].map((icon, i) => (
        <motion.span
          key={i}
          className="absolute text-3xl opacity-15 pointer-events-none select-none"
          style={{ left: `${8 + i * 12}%`, top: `${15 + (i % 2) * 65}%` }}
          animate={{ y: [0, -18, 0], rotate: [0, 20, -20, 0] }}
          transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.6 }}
        >
          {icon}
        </motion.span>
      ))}

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.p
          className="text-orange-400/80 text-sm font-bold tracking-[0.3em] uppercase mb-6"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
        >
          {totalMembers} members and counting
        </motion.p>

        <motion.h2
          className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight"
          style={{ fontFamily: "'Georgia', serif" }}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.1 }}
        >
          Because every family moment deserves to be{' '}
          <span className="bg-gradient-to-r from-orange-300 to-rose-300 bg-clip-text text-transparent">
            remembered.
          </span>
        </motion.h2>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.35 }}
        >
          <motion.button
            whileHover={{ scale: 1.06, y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('register')}
            className="bg-gradient-to-r from-orange-500 to-rose-600 text-white px-12 py-5 rounded-2xl font-black text-xl shadow-2xl shadow-orange-500/30"
          >
            ✨ Add a Member
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('members')}
            className="bg-white/10 backdrop-blur border border-white/25 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/20 transition-colors"
          >
            👨‍👩‍👧 View Members
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('familyTree')}
            className="bg-white/10 backdrop-blur border border-white/25 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/20 transition-colors"
          >
            🌳 Family Tree
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// FOOTER
// ════════════════════════════════════════════════════════════════════════════════
function Footer({ onNavigate, total }: {
  onNavigate: (p: 'register' | 'members' | 'privacy' | 'familyTree') => void;
  total: number;
}) {
  return (
    <footer className="bg-gray-950 text-white/50 py-12 px-6">
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 mb-8">
        <div>
          <p className="font-black text-white text-2xl mb-2" style={{ fontFamily: "'Georgia', serif" }}>Family Hub</p>
          <p className="text-sm leading-relaxed">Celebrating every birthday, anniversary, and moment that brings our family together.</p>
          <p className="mt-3 text-orange-400/70 text-sm font-semibold">{total} members strong 💪</p>
        </div>
        <div>
          <p className="font-bold text-white/80 mb-3 text-sm uppercase tracking-wider">Quick Links</p>
          <div className="space-y-2 text-sm">
            <button onClick={() => onNavigate('register')} className="block hover:text-orange-400 transition-colors">🎉 Add Member</button>
            <button onClick={() => onNavigate('members')} className="block hover:text-orange-400 transition-colors">👥 All Members</button>
            <button onClick={() => onNavigate('familyTree')} className="block hover:text-orange-400 transition-colors">🌳 Family Tree</button>
            <button onClick={() => onNavigate('privacy')} className="block hover:text-orange-400 transition-colors">🔒 Privacy Policy</button>
          </div>
        </div>
        <div>
          <p className="font-bold text-white/80 mb-3 text-sm uppercase tracking-wider">Contact</p>
          <div className="space-y-2 text-sm">
            <a href="tel:9162576850" className="block hover:text-orange-400 transition-colors">📞 9162576850</a>
          </div>
          <p className="mt-4 italic text-white/30 text-xs leading-relaxed">
            "Family is not an important thing. It's everything."
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 pt-6 text-center text-xs">
        <p>Made with 💖 for our amazing family · © {new Date().getFullYear()} Family Celebrations</p>
      </div>
    </footer>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// LOADING SCREEN
// ════════════════════════════════════════════════════════════════════════════════
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#1c0a00] flex flex-col items-center justify-center gap-6">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        className="text-6xl"
      >✨</motion.div>
      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="text-orange-300/60 font-semibold tracking-widest text-sm uppercase"
        style={{ fontFamily: "'Georgia', serif" }}
      >
        Loading family…
      </motion.p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN HOME EXPORT
// ════════════════════════════════════════════════════════════════════════════════
export default function Home({ onNavigate }: HomeProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError('');
      const { data, error: err } = await supabase
        .from('members')
        .select('id, name, email, dob, phone, qualification, current_status, anniversary, linkedin, whatsapp, instagram, profile_photo, fathers_name, mothers_name, spouse_name, timezone')
        .order('name', { ascending: true });

      if (err) throw err;

      const clean = deduplicateMembers(data || []);
      setMembers(clean);

      const hasCelebration = clean.some(m => isToday(m.dob) || (m.anniversary && isToday(m.anniversary)));
      if (hasCelebration) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 8000);
      }
    } catch (e: any) {
      setError('Could not load family data. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="min-h-screen bg-[#fdf6ee] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-5xl mb-4">😔</div>
          <p className="text-gray-600 text-xl mb-6">{error}</p>
          <button
            onClick={fetchMembers}
            className="bg-gradient-to-r from-orange-500 to-rose-600 text-white px-8 py-3 rounded-xl font-bold hover:scale-105 transition-transform"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans">
      {showConfetti && <Confetti />}
      <HeroSection onNavigate={onNavigate} />
      <TodaySection members={members} />
      <MonthSection members={members} />
      <UpcomingSection members={members} />
      <StatsSection members={members} />
      <FamilyTreeBanner onNavigate={onNavigate} />
      <CtaSection onNavigate={onNavigate} totalMembers={members.length} />
      <Footer onNavigate={onNavigate} total={members.length} />
    </div>
  );
}