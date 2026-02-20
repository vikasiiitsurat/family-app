import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { supabase } from '../lib/supabase';
import Confetti from '../components/Confetti';

// ─── EXACT DB SCHEMA from Register.tsx ───────────────────────────────────────
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

// ─── PAGE PROP ────────────────────────────────────────────────────────────────
interface HomeProps {
  onNavigate: (page: 'register' | 'members' | 'privacy') => void;
}

// ─── STRICT NAME MATCHING ─────────────────────────────────────────────────────
// Only normalize: lowercase + collapse multiple spaces + trim
function normalizeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

function namesMatch(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b);
}

// ─── DEDUPLICATE: only exact (case-insensitive, space-normalized) matches ─────
function deduplicateMembers(members: Member[]): Member[] {
  const merged: Member[] = [];
  for (const m of members) {
    const match = merged.find(e => namesMatch(m.name, e.name));
    if (match) {
      (Object.keys(m) as (keyof Member)[]).forEach(k => {
        if (m[k] != null && m[k] !== '' && !match[k]) {
          (match as any)[k] = m[k];
        }
      });
    } else {
      merged.push({ ...m });
    }
  }
  return merged;
}

function isToday(dateStr?: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const t = new Date();
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
  const diff = getNextOccurrence(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
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
  ghost = false,
}: {
  member: Member;
  size?: number;
  ring?: boolean;
  ghost?: boolean;
}) {
  const grad = AVATAR_GRADIENTS[member.id?.charCodeAt(0) % AVATAR_GRADIENTS.length ?? 0];
  return (
    <div
      className={`rounded-full flex-shrink-0 flex items-center justify-center text-white font-extrabold overflow-hidden
        ${ring ? 'ring-4 ring-white shadow-xl' : 'shadow-md'}
        ${ghost ? 'opacity-50 ring-2 ring-dashed ring-orange-300' : ''}`}
      style={{ width: size, height: size, fontSize: size * 0.33, background: member.profile_photo ? 'transparent' : undefined }}
    >
      {member.profile_photo
        ? <img src={member.profile_photo} alt={member.name} className="w-full h-full object-cover" />
        : (
          <div className={`w-full h-full bg-gradient-to-br ${ghost ? 'from-orange-200 to-amber-300' : grad} flex items-center justify-center`}>
            {ghost ? '?' : getInitials(member.name)}
          </div>
        )
      }
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 1 — HERO
// ════════════════════════════════════════════════════════════════════════════════
function HeroSection({ onNavigate }: HomeProps) {
  const floatingIcons = ['✨', '💖', '🎂', '🎵', '🌸', '💫', '🎁', '⭐', '🎊', '💝'];

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[#1c0a00]" />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 60% at 20% 40%, rgba(180,60,0,0.35) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 80% 60%, rgba(130,20,50,0.4) 0%, transparent 65%), radial-gradient(ellipse 50% 50% at 50% 100%, rgba(200,100,0,0.2) 0%, transparent 60%)'
      }} />

      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'linear-gradient(rgba(255,180,80,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,180,80,0.5) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

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

      {[300, 520, 740].map((size, i) => (
        <motion.div key={i}
          className="absolute rounded-full border border-orange-800/20"
          style={{ width: size, height: size }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6 + i * 2, repeat: Infinity, delay: i * 1.5 }}
        />
      ))}

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
        </motion.div>
      </div>

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
            {todayBdays.map((m, i) => <TodayCard key={m.id} member={m} type="birthday" delay={i * 0.15} inView={inView} />)}
            {todayAnnivs.map((m, i) => <TodayCard key={m.id + 'a'} member={m} type="anniversary" delay={(todayBdays.length + i) * 0.15} inView={inView} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function TodayCard({ member: m, type, delay, inView }: { member: Member; type: 'birthday' | 'anniversary'; delay: number; inView: boolean }) {
  const isBday = type === 'birthday';
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.6, type: 'spring' }}
      className={`relative overflow-hidden rounded-3xl shadow-2xl ${isBday ? 'bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600' : 'bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600'}`}
    >
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

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-semibold">{children}</span>;
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
          <p className="text-center text-gray-400 italic py-16 text-lg">No more events this month</p>
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
                  <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-black shadow-lg flex-shrink-0 ${type === 'birthday' ? 'bg-gradient-to-br from-orange-400 to-rose-500' : 'bg-gradient-to-br from-rose-500 to-fuchsia-600'}`}>
                    <span className="text-xl leading-none">{new Date(date).getDate()}</span>
                    <span className="text-[10px] opacity-80 font-bold">{new Date(date).toLocaleString('default', { month: 'short' })}</span>
                  </div>

                  <Avatar member={m} size={46} />

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-base group-hover:text-orange-700 transition-colors truncate">{m.name}</p>
                    <p className="text-gray-400 text-sm truncate">
                      {m.current_status || (type === 'birthday' ? `Turning ${getAge(m.dob) + 1}` : `${getYearsMarried(date) + 1} years`)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${type === 'birthday' ? 'bg-orange-100 text-orange-700' : 'bg-rose-100 text-rose-700'}`}>
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
// SECTION 4 — FAMILY TREE (COUPLE-UNIT BASED)
// ════════════════════════════════════════════════════════════════════════════════

interface CoupleUnit {
  key: string;
  father?: Member;
  fatherIsGhost: boolean;
  mother?: Member;
  motherIsGhost: boolean;
  children: Member[];
}

interface TreeNode {
  father?: Member;
  fatherIsGhost: boolean;
  mother?: Member;
  motherIsGhost: boolean;
  children: TreeNode[];
}

// ── buildTree() ────────────────────────────────────────────────────────────────
function buildTree(members: Member[]): TreeNode[] {
  // ── Ghost registry ──────────────────────────────────────────────────────────
  let ghostCounter = 0;
  const ghostByName = new Map<string, Member>();

  const makeGhost = (name: string): Member => {
    // Key by normalized name so "ved" and "Ved" → same ghost
    const key = normalizeName(name);
    if (!ghostByName.has(key)) {
      ghostCounter--;
      ghostByName.set(key, {
        id: `ghost_${ghostCounter}`,
        name: name.trim(),
        email: '',
        dob: '1970-01-01',
        phone: '',
        qualification: '',
        current_status: 'Not Registered',
        profile_photo: null,
        fathers_name: null,
        mothers_name: null,
        spouse_name: null,
        anniversary: null,
      });
    }
    return ghostByName.get(key)!;
  };

  // ── Member lookup: strict case-insensitive + space-normalized ───────────────
  const findReal = (name: string, excludeId?: string): Member | undefined =>
    members.find(m => m.id !== excludeId && namesMatch(m.name, name));

  const resolve = (name: string, excludeId?: string): { member: Member; isGhost: boolean } => {
    const real = findReal(name, excludeId);
    return real
      ? { member: real, isGhost: false }
      : { member: makeGhost(name), isGhost: true };
  };

  // ── Couple key: normalize both names so spacing/case never splits a couple ──
  const makeCoupleKey = (a?: string, b?: string): string =>
    [a, b]
      .filter(Boolean)
      .map(s => normalizeName(s!))
      .sort()
      .join('__');

  // ── Couple map ──────────────────────────────────────────────────────────────
  const couples = new Map<string, CoupleUnit>();

  const getOrCreateCouple = (
    fatherName?: string,
    motherName?: string,
    fallbackFatherId?: string,
  ): CoupleUnit => {
    const key = fatherName || motherName
      ? makeCoupleKey(fatherName, motherName)
      : `single__${fallbackFatherId}`;

    if (couples.has(key)) return couples.get(key)!;

    const unit: CoupleUnit = {
      key,
      father: undefined,
      fatherIsGhost: false,
      mother: undefined,
      motherIsGhost: false,
      children: [],
    };

    if (fatherName) {
      const r = resolve(fatherName);
      unit.father = r.member;
      unit.fatherIsGhost = r.isGhost;
    }
    if (motherName) {
      const r = resolve(motherName);
      unit.mother = r.member;
      unit.motherIsGhost = r.isGhost;
    }

    couples.set(key, unit);
    return unit;
  };

  // ── Step 1: assign every member to their parents' CoupleUnit ────────────────
  const childOfKey = new Map<string, string>();

  members.forEach(child => {
    const fn = child.fathers_name?.trim() || undefined;
    const mn = child.mothers_name?.trim() || undefined;
    if (!fn && !mn) return;

    const couple = getOrCreateCouple(fn, mn);
    if (!couple.children.find(c => c.id === child.id)) {
      couple.children.push(child);
    }
    childOfKey.set(child.id, couple.key);
  });

  // ── Step 2: build reverse index — which couple does each member PARENT? ─────
  const parentCoupleKey = new Map<string, string>();

  couples.forEach(c => {
    if (c.father && !c.fatherIsGhost) parentCoupleKey.set(c.father.id, c.key);
    if (c.mother && !c.motherIsGhost) parentCoupleKey.set(c.mother.id, c.key);
  });

  // ── Step 3: self-couples for members not yet in any couple as parent ─────────
  const processedAsParent = new Set<string>(parentCoupleKey.keys());

  members.forEach(m => {
    if (processedAsParent.has(m.id)) return;

    const spouseName = m.spouse_name?.trim() || undefined;

    if (spouseName) {
      // Strict name match for spouse
      const spReal = members.find(
        s => s.id !== m.id && namesMatch(s.name, spouseName),
      );

      if (spReal) {
        const key = makeCoupleKey(m.name, spReal.name);
        if (!couples.has(key)) {
          couples.set(key, {
            key,
            father: m,
            fatherIsGhost: false,
            mother: spReal,
            motherIsGhost: false,
            children: [],
          });
        }
        if (!parentCoupleKey.has(m.id)) parentCoupleKey.set(m.id, key);
        if (!parentCoupleKey.has(spReal.id)) parentCoupleKey.set(spReal.id, key);
        processedAsParent.add(m.id);
        processedAsParent.add(spReal.id);
      } else {
        // Spouse unregistered → ghost
        const key = makeCoupleKey(m.name, spouseName);
        if (!couples.has(key)) {
          const ghost = makeGhost(spouseName);
          couples.set(key, {
            key,
            father: m,
            fatherIsGhost: false,
            mother: ghost,
            motherIsGhost: true,
            children: [],
          });
        }
        parentCoupleKey.set(m.id, key);
        processedAsParent.add(m.id);
      }
    } else {
      // No spouse — single-person node
      const key = `single__${m.id}`;
      if (!couples.has(key)) {
        couples.set(key, {
          key,
          father: m,
          fatherIsGhost: false,
          mother: undefined,
          motherIsGhost: false,
          children: [],
        });
      }
      parentCoupleKey.set(m.id, key);
      processedAsParent.add(m.id);
    }
  });

  // ── Step 4: root detection ───────────────────────────────────────────────────
  const isChildMember = new Set<string>(childOfKey.keys());

  const rootCouples: CoupleUnit[] = [];
  const seenRootKeys = new Set<string>();

  couples.forEach(c => {
    const fId = c.father?.id;
    const mId = c.mother?.id;
    const fIsChild = fId && !c.fatherIsGhost && isChildMember.has(fId);
    const mIsChild = mId && !c.motherIsGhost && isChildMember.has(mId);
    if (!fIsChild && !mIsChild && !seenRootKeys.has(c.key)) {
      seenRootKeys.add(c.key);
      rootCouples.push(c);
    }
  });

  // ── Step 5: recursive TreeNode builder ──────────────────────────────────────
  const visited = new Set<string>();

  const buildNode = (couple: CoupleUnit): TreeNode => {
    visited.add(couple.key);

    const childNodes: TreeNode[] = [];

    for (const child of couple.children) {
      const ck = parentCoupleKey.get(child.id);
      if (ck && !visited.has(ck)) {
        const childCouple = couples.get(ck);
        if (childCouple) {
          childNodes.push(buildNode(childCouple));
        }
      } else if (!ck) {
        const singleKey = `single__${child.id}`;
        if (!visited.has(singleKey)) {
          const singleCouple: CoupleUnit = {
            key: singleKey,
            father: child,
            fatherIsGhost: false,
            mother: undefined,
            motherIsGhost: false,
            children: [],
          };
          childNodes.push(buildNode(singleCouple));
        }
      }
    }

    return {
      father: couple.father,
      fatherIsGhost: couple.fatherIsGhost,
      mother: couple.mother,
      motherIsGhost: couple.motherIsGhost,
      children: childNodes,
    };
  };

  return rootCouples
    .filter(c => !visited.has(c.key))
    .map(c => buildNode(c));
}

// ── Tooltip ────────────────────────────────────────────────────────────────────
function MemberTooltip({
  member,
  isGhost,
  show,
  label,
}: {
  member: Member;
  isGhost: boolean;
  show: boolean;
  label: string;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.92 }}
          transition={{ duration: 0.18 }}
          className="absolute z-50 bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-orange-100 p-4 w-64"
          style={{ minWidth: 220 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Avatar member={member} size={40} ghost={isGhost} />
            <div>
              <p className="font-extrabold text-gray-900 text-sm leading-tight">{member.name}</p>
              <p className={`text-xs font-semibold ${isGhost ? 'text-orange-400 italic' : 'text-orange-500'}`}>
                {isGhost ? '⚠️ Not yet registered' : (member.current_status || label)}
              </p>
            </div>
          </div>
          {!isGhost ? (
            <div className="space-y-1 text-xs text-gray-600">
              <p>🎂 {formatShortDate(member.dob)} · Age {getAge(member.dob)}</p>
              {member.anniversary && <p>💍 {formatShortDate(member.anniversary)} · {getYearsMarried(member.anniversary)}y</p>}
              {member.spouse_name && <p>💕 Spouse: {member.spouse_name}</p>}
              {member.fathers_name && <p>👨 {member.fathers_name}</p>}
              {member.mothers_name && <p>👩 {member.mothers_name}</p>}
              {member.email && <p className="truncate">📧 {member.email}</p>}
              {member.phone && <p>📱 {member.phone}</p>}
              {member.qualification && <p>🎓 {member.qualification}</p>}
            </div>
          ) : (
            <p className="text-xs text-orange-400 italic">
              Referenced by family members but not yet registered.
            </p>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-orange-100 rotate-45 -mt-1.5" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Member bubble ──────────────────────────────────────────────────────────────
function MemberBubble({
  member,
  isGhost,
  depth,
  hasChildren,
  expanded,
  onToggle,
  label,
}: {
  member: Member;
  isGhost: boolean;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  onToggle: () => void;
  label: string;
}) {
  const [hovered, setHovered] = useState(false);
  const hasCelebration =
    !isGhost && (isToday(member.dob) || (member.anniversary && isToday(member.anniversary)));

  return (
    <motion.div
      className="relative flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: depth * 0.08, type: 'spring', stiffness: 180 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      {hasCelebration && (
        <motion.div
          className="absolute inset-0 rounded-full bg-orange-400/40 blur-md"
          animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      )}

      <div
        className="relative z-10 flex flex-col items-center gap-1 cursor-pointer"
        onClick={hasChildren ? onToggle : undefined}
      >
        <div className="relative">
          <Avatar member={member} size={60} ring ghost={isGhost} />
          {isGhost && (
            <span className="absolute -bottom-1 -right-1 text-[10px] bg-orange-100 text-orange-600 rounded-full px-1 font-bold border border-orange-200">
              ?
            </span>
          )}
        </div>
        <p className={`text-xs font-bold max-w-[72px] text-center leading-tight ${isGhost ? 'text-orange-400 italic' : 'text-gray-700'}`}>
          {member.name.split(' ')[0]}
        </p>
        {isGhost && <p className="text-[9px] text-orange-300 italic">not registered</p>}
        {hasChildren && (
          <span className="text-[10px] bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 font-bold cursor-pointer">
            {expanded ? '▲' : `▼`}
          </span>
        )}
      </div>

      <MemberTooltip member={member} isGhost={isGhost} show={hovered} label={label} />
    </motion.div>
  );
}

// ── TreeNodeCard ───────────────────────────────────────────────────────────────
function TreeNodeCard({ node, depth }: { node: TreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(true);

  const hasBothParents = !!node.father && !!node.mother;
  const hasChildren = node.children.length > 0;

  return (
    <div className="flex flex-col items-center select-none">
      {/* ── Couple row ── */}
      <div className="flex items-end gap-2">
        {node.father && (
          <MemberBubble
            member={node.father}
            isGhost={node.fatherIsGhost}
            depth={depth}
            hasChildren={hasChildren && !hasBothParents}
            expanded={expanded}
            onToggle={() => setExpanded(e => !e)}
            label="Family Member"
          />
        )}

        {hasBothParents && (
          <div className="flex flex-col items-center mb-8 gap-0.5">
            <div className="flex items-center">
              <div className="w-5 border-t-2 border-dashed border-rose-300" />
              <motion.span
                animate={{ scale: [1, 1.35, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-rose-400 text-sm px-0.5 cursor-pointer"
                onClick={hasChildren ? () => setExpanded(e => !e) : undefined}
              >
                💕
              </motion.span>
              <div className="w-5 border-t-2 border-dashed border-rose-300" />
            </div>
            {hasChildren && (
              <span
                className="text-[10px] bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 font-bold cursor-pointer"
                onClick={() => setExpanded(e => !e)}
              >
                {expanded ? '▲' : `▼ ${node.children.length}`}
              </span>
            )}
          </div>
        )}

        {node.mother && (
          <MemberBubble
            member={node.mother}
            isGhost={node.motherIsGhost}
            depth={depth}
            hasChildren={hasChildren && !hasBothParents && !node.father}
            expanded={expanded}
            onToggle={() => setExpanded(e => !e)}
            label="Family Member"
          />
        )}
      </div>

      {/* ── Children subtree ── */}
      <AnimatePresence>
        {expanded && node.children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-visible"
          >
            <motion.div
              className="w-px h-8 bg-gradient-to-b from-orange-300 to-orange-100 mx-auto"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.15 }}
            />

            {node.children.length > 1 && (
              <div className="relative flex justify-center">
                <div
                  className="h-px bg-orange-200"
                  style={{ width: `${(node.children.length - 1) * 120}px` }}
                />
              </div>
            )}

            <div className="flex gap-6 items-start justify-center">
              {node.children.map((child, idx) => {
                const key = child.father?.id ?? child.mother?.id ?? `child-${idx}`;
                return (
                  <div key={key} className="flex flex-col items-center">
                    <div className="w-px h-6 bg-orange-200 mx-auto" />
                    <TreeNodeCard node={child} depth={depth + 1} />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── FamilyTreeSection ──────────────────────────────────────────────────────────
function FamilyTreeSection({ members }: { members: Member[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const trees = buildTree(members);

  return (
    <section ref={ref} className="py-24 px-5 bg-gradient-to-br from-[#fdf6ee] via-white to-orange-50/30 overflow-x-auto">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-emerald-500 mb-3">OUR ROOTS</p>
          <h2 className="text-5xl font-black text-gray-900 mb-3" style={{ fontFamily: "'Georgia', serif" }}>
            Family Tree 🌳
          </h2>
          <p className="text-gray-400 italic mb-5">Hover any member for details · Click 💕 or ▲▼ to expand/collapse</p>
          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" /> Birthday today
            </span>
            <span className="flex items-center gap-1.5">
              <span className="border-t-2 border-dashed border-rose-300 w-7 inline-block" /> Spouse connection
            </span>
            <span className="flex items-center gap-1.5">💕 Married couple</span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-orange-200 opacity-60 border-2 border-dashed border-orange-400 inline-block" /> Unregistered parent
            </span>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl border border-orange-100 overflow-x-auto"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          {trees.length === 0 ? (
            <p className="text-center text-gray-400 italic py-12">No family data yet — register members to see the tree!</p>
          ) : (
            <div className="flex gap-20 min-w-max justify-center pb-4 pt-4 flex-wrap">
              {trees.map((tree, idx) => {
                const key = tree.father?.id ?? tree.mother?.id ?? `root-${idx}`;
                return <TreeNodeCard key={key} node={tree} depth={0} />;
              })}
            </div>
          )}
        </motion.div>

        <motion.p
          className="text-center text-xs text-orange-400/70 italic mt-4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
        >
          ✨ Faded nodes = family members referenced but not yet registered · Strict name matching (case & space insensitive)
        </motion.p>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 5 — UPCOMING
// ════════════════════════════════════════════════════════════════════════════════
function UpcomingSection({ members }: { members: Member[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const ranked = (type: 'birthday' | 'anniversary') => {
    return members
      .filter(m => type === 'birthday' ? !isToday(m.dob) : m.anniversary && !isToday(m.anniversary))
      .map(m => ({ m, days: getDaysUntil(type === 'birthday' ? m.dob : m.anniversary!) }))
      .sort((a, b) => a.days - b.days)
      .slice(0, 3);
  };

  const upBdays = ranked('birthday');
  const upAnnivs = ranked('anniversary');

  return (
    <section ref={ref} className="py-24 px-5 bg-white">
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

function UpcomingCard({ member: m, days, label, color, rank }: { member: Member; days: number; label: string; color: string; rank: number }) {
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
// SECTION 6 — STATS
// ════════════════════════════════════════════════════════════════════════════════
function StatsSection({ members }: { members: Member[] }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const thisMonth = members.filter(m => isThisMonth(m.dob) || (m.anniversary && isThisMonth(m.anniversary))).length;
  const married = members.filter(m => m.spouse_name || m.anniversary).length;

  const stats = [
    { icon: '👥', value: members.length, label: 'Family Members', sub: 'and growing', color: 'from-orange-500 to-rose-500' },
    { icon: '🎉', value: thisMonth, label: 'Events This Month', sub: 'to celebrate', color: 'from-rose-500 to-fuchsia-600' },
    { icon: '💍', value: married, label: 'Married Couples', sub: 'love stories', color: 'from-fuchsia-500 to-violet-600' },
  ];

  return (
    <section ref={ref} className="py-24 px-5 bg-[#fdf6ee]">
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
// SECTION 7 — MEMBERS PREVIEW
// ════════════════════════════════════════════════════════════════════════════════
function MembersPreview({ members, onNavigate }: { members: Member[]; onNavigate: (p: 'register' | 'members' | 'privacy') => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const preview = members.slice(0, 6);

  return (
    <section ref={ref} className="py-24 px-5 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div
          className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
        >
          <div>
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-orange-500 mb-2">OUR PEOPLE</p>
            <h2 className="text-5xl font-black text-gray-900" style={{ fontFamily: "'Georgia', serif" }}>
              Meet the Family 👨‍👩‍👧‍👦
            </h2>
          </div>
          <button
            onClick={() => onNavigate('members')}
            className="text-orange-600 font-bold hover:text-rose-600 transition-colors text-sm border border-orange-200 hover:border-rose-300 rounded-xl px-5 py-2.5 hover:shadow-md"
          >
            View All Members →
          </button>
        </motion.div>

        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {preview.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="bg-gradient-to-br from-orange-50 to-rose-50/40 border border-orange-100 rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg hover:border-orange-200 transition-all cursor-default"
            >
              <Avatar member={m} size={56} ring />
              <div className="min-w-0 flex-1">
                <p className="font-extrabold text-gray-900 truncate">{m.name}</p>
                <p className="text-xs text-orange-500 font-semibold truncate">{m.current_status || m.qualification}</p>
                <p className="text-xs text-gray-400 mt-0.5">🎂 {formatShortDate(m.dob)}</p>
                {m.anniversary && <p className="text-xs text-rose-400">💍 {formatShortDate(m.anniversary)}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// SECTION 8 — CTA
// ════════════════════════════════════════════════════════════════════════════════
function CtaSection({ onNavigate, totalMembers }: { onNavigate: (p: 'register' | 'members' | 'privacy') => void; totalMembers: number }) {
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
            ✨ Start Celebrating Today
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('members')}
            className="bg-white/10 backdrop-blur border border-white/25 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/20 transition-colors"
          >
            👨‍👩‍👧 View Members
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// FOOTER
// ════════════════════════════════════════════════════════════════════════════════
function Footer({ onNavigate, total }: { onNavigate: (p: 'register' | 'members' | 'privacy') => void; total: number }) {
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
      <FamilyTreeSection members={members} />
      <MembersPreview members={members} onNavigate={onNavigate} />
      <StatsSection members={members} />
      <CtaSection onNavigate={onNavigate} totalMembers={members.length} />
      <Footer onNavigate={onNavigate} total={members.length} />
    </div>
  );
}