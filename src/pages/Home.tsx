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

// ─── GHOST MEMBER (for unregistered parents) ──────────────────────────────────
interface GhostMember extends Member {
  isGhost: true;
}

// ─── PAGE PROP ────────────────────────────────────────────────────────────────
interface HomeProps {
  onNavigate: (page: 'register' | 'members' | 'privacy') => void;
}

// ─── FUZZY / UTILS ────────────────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function nameSimilarity(a: string, b: string): number {
  const norm = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');
  const na = norm(a), nb = norm(b);
  if (na === nb) return 1;
  return 1 - levenshtein(na, nb) / Math.max(na.length, nb.length);
}

function deduplicateMembers(members: Member[]): Member[] {
  const merged: Member[] = [];
  for (const m of members) {
    const match = merged.find(e => nameSimilarity(m.name, e.name) >= 0.82);
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
// SECTION 4 — FAMILY TREE (ENHANCED)
// ════════════════════════════════════════════════════════════════════════════════

interface TreeNode {
  member: Member;
  isGhost?: boolean;            // true = parent not registered
  spouse?: { member: Member; isGhost?: boolean };
  children: TreeNode[];
}

const GHOST_COUNTER = { val: 0 };

function makeGhost(name: string): Member {
  GHOST_COUNTER.val -= 1;
  return {
    id: `ghost_${GHOST_COUNTER.val}`,
    name,
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
  };
}

function buildTree(members: Member[]): TreeNode[] {
  GHOST_COUNTER.val = 0;

  // ── Step 1: Spouse matching ──────────────────────────────────────────────────
  const spouseMap = new Map<string, string>(); // id → partner id
  members.forEach(m => {
    if (m.spouse_name) {
      const sp = members.find(
        s => s.id !== m.id && nameSimilarity(s.name, m.spouse_name!) >= 0.75
      );
      if (sp && !spouseMap.has(m.id) && !spouseMap.has(sp.id)) {
        spouseMap.set(m.id, sp.id);
        spouseMap.set(sp.id, m.id);
      }
    }
  });

  // ── Step 2: Build parent→children map ───────────────────────────────────────
  // Ghost parents keyed by normalised name
  const ghostByName = new Map<string, Member>();
  const getOrMakeGhost = (name: string): Member => {
    const key = name.toLowerCase().trim();
    if (!ghostByName.has(key)) ghostByName.set(key, makeGhost(name));
    return ghostByName.get(key)!;
  };

  const childrenOf = new Map<string, Member[]>(); // parentId → children
  const hasRegisteredParent = new Set<string>();   // child ids with real parent
  const hasAnyParent = new Set<string>();          // child ids with any parent (real or ghost)

  members.forEach(child => {
    // Try fathers_name
    const fatherNames = [child.fathers_name, child.mothers_name].filter(Boolean) as string[];
    fatherNames.forEach(parentName => {
      const realParent = members.find(
        p => p.id !== child.id && nameSimilarity(p.name, parentName) >= 0.8
      );
      if (realParent) {
        const kids = childrenOf.get(realParent.id) || [];
        if (!kids.find(k => k.id === child.id)) kids.push(child);
        childrenOf.set(realParent.id, kids);
        hasRegisteredParent.add(child.id);
        hasAnyParent.add(child.id);
      } else {
        // Create/reuse ghost parent
        const ghost = getOrMakeGhost(parentName);
        const kids = childrenOf.get(ghost.id) || [];
        if (!kids.find(k => k.id === child.id)) kids.push(child);
        childrenOf.set(ghost.id, kids);
        hasAnyParent.add(child.id);
      }
    });
  });

  // ── Step 3: Build node recursively ──────────────────────────────────────────
  const visited = new Set<string>();
  const buildNode = (m: Member, isGhost = false): TreeNode => {
    visited.add(m.id);
    const spouseId = spouseMap.get(m.id);
    const spouseMember = spouseId ? members.find(s => s.id === spouseId) : undefined;
    // Check if there's a ghost spouse
    let ghostSpouse: Member | undefined;
    if (!spouseMember && m.spouse_name) {
      ghostSpouse = getOrMakeGhost(m.spouse_name);
    }

    const kids = (childrenOf.get(m.id) || []).filter(k => !visited.has(k.id));
    // Also pull kids from ghost spouse if any
    const spouseKids = ghostSpouse
      ? (childrenOf.get(ghostSpouse.id) || []).filter(k => !visited.has(k.id))
      : spouseId
      ? (childrenOf.get(spouseId) || []).filter(k => !visited.has(k.id))
      : [];

    const allKids = [...kids, ...spouseKids].filter(
      (k, idx, arr) => arr.findIndex(x => x.id === k.id) === idx
    );

    return {
      member: m,
      isGhost,
      spouse: spouseMember
        ? { member: spouseMember, isGhost: false }
        : ghostSpouse
        ? { member: ghostSpouse, isGhost: true }
        : undefined,
      children: allKids.map(k => buildNode(k, false)),
    };
  };

  // ── Step 4: Determine roots ──────────────────────────────────────────────────
  // Roots = real members with no identified parent (registered or ghost)
  // + ghost parents who ARE parents
  const spouseIds = new Set(spouseMap.values());

  const realRoots = members.filter(m =>
    !hasAnyParent.has(m.id) &&
    // don't root a spouse — their spouse-node includes them
    !Array.from(spouseMap.entries()).some(([primary, spId]) =>
      spId === m.id && !hasAnyParent.has(primary)
    )
  );

  // Ghost roots = ghost parents not themselves a child
  const ghostRoots: Member[] = [...ghostByName.values()].filter(
    g => !hasAnyParent.has(g.id)
  );

  const roots: TreeNode[] = [];
  const addedIds = new Set<string>();

  [...ghostRoots, ...realRoots].forEach(m => {
    if (addedIds.has(m.id)) return;
    const isGhost = m.id.startsWith('ghost_');
    // Skip spouses — they'll be attached to their partner node
    const partnerKey = spouseMap.get(m.id);
    if (partnerKey && !isGhost) {
      const partner = members.find(x => x.id === partnerKey);
      if (partner && !hasAnyParent.has(partner.id) && !addedIds.has(partner.id)) {
        // Let the one with more children be the primary
        const mKids = (childrenOf.get(m.id) || []).length;
        const pKids = (childrenOf.get(partner.id) || []).length;
        const primary = mKids >= pKids ? m : partner;
        const secondary = primary.id === m.id ? partner : m;
        addedIds.add(primary.id);
        addedIds.add(secondary.id);
        visited.add(secondary.id);
        roots.push(buildNode(primary, false));
        return;
      }
    }
    if (!visited.has(m.id)) {
      addedIds.add(m.id);
      roots.push(buildNode(m, isGhost));
    }
  });

  return roots;
}

// ── Tree Node Card ─────────────────────────────────────────────────────────────
function TreeNodeCard({ node, depth }: { node: TreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [spouseHovered, setSpouseHovered] = useState(false);
  const m = node.member;
  const isGhost = node.isGhost ?? false;
  const hasCelebration = !isGhost && (isToday(m.dob) || (m.anniversary && isToday(m.anniversary)));

  const cardWidth = 80; // px per node (avatar + label)

  return (
    <div className="flex flex-col items-center select-none">
      {/* ── Couple row ── */}
      <div className="flex items-end gap-2">
        {/* Main member */}
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
            onClick={() => node.children.length > 0 && setExpanded(e => !e)}
          >
            <div className="relative">
              <Avatar member={m} size={60} ring ghost={isGhost} />
              {isGhost && (
                <span className="absolute -bottom-1 -right-1 text-[10px] bg-orange-100 text-orange-600 rounded-full px-1 font-bold border border-orange-200">
                  ?
                </span>
              )}
            </div>
            <p className={`text-xs font-bold max-w-[72px] text-center leading-tight ${isGhost ? 'text-orange-400 italic' : 'text-gray-700'}`}>
              {m.name.split(' ')[0]}
            </p>
            {isGhost && <p className="text-[9px] text-orange-300 italic">not registered</p>}
            {node.children.length > 0 && (
              <span className="text-[10px] bg-orange-100 text-orange-600 rounded-full px-2 py-0.5 font-bold cursor-pointer">
                {expanded ? '▲' : `▼ ${node.children.length}`}
              </span>
            )}
          </div>

          {/* Hover tooltip for main member */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.92 }}
                transition={{ duration: 0.18 }}
                className="absolute z-50 bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-orange-100 p-4 w-64"
                style={{ minWidth: 220 }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Avatar member={m} size={40} ghost={isGhost} />
                  <div>
                    <p className="font-extrabold text-gray-900 text-sm leading-tight">{m.name}</p>
                    <p className={`text-xs font-semibold ${isGhost ? 'text-orange-400 italic' : 'text-orange-500'}`}>
                      {isGhost ? '⚠️ Not yet registered' : (m.current_status || 'Family Member')}
                    </p>
                  </div>
                </div>
                {!isGhost ? (
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>🎂 {formatShortDate(m.dob)} · Age {getAge(m.dob)}</p>
                    {m.anniversary && <p>💍 {formatShortDate(m.anniversary)} · {getYearsMarried(m.anniversary)}y</p>}
                    {m.spouse_name && <p>💕 Spouse: {m.spouse_name}</p>}
                    {m.fathers_name && <p>👨 {m.fathers_name}</p>}
                    {m.mothers_name && <p>👩 {m.mothers_name}</p>}
                    {m.email && <p className="truncate">📧 {m.email}</p>}
                    {m.phone && <p>📱 {m.phone}</p>}
                    {m.qualification && <p>🎓 {m.qualification}</p>}
                  </div>
                ) : (
                  <p className="text-xs text-orange-400 italic">
                    This parent was referenced by family members but hasn't registered yet.
                  </p>
                )}
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-orange-100 rotate-45 -mt-1.5" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Spouse if present */}
        {node.spouse && (
          <>
            <div className="flex items-center mb-8">
              <div className="w-5 border-t-2 border-dashed border-rose-300" />
              <motion.span
                animate={{ scale: [1, 1.35, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-rose-400 text-sm px-0.5"
              >
                💕
              </motion.span>
              <div className="w-5 border-t-2 border-dashed border-rose-300" />
            </div>

            <motion.div
              className="relative flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: depth * 0.08 + 0.05, type: 'spring', stiffness: 180 }}
              onHoverStart={() => setSpouseHovered(true)}
              onHoverEnd={() => setSpouseHovered(false)}
            >
              <div className="relative">
                <Avatar member={node.spouse.member} size={60} ring ghost={node.spouse.isGhost} />
                {node.spouse.isGhost && (
                  <span className="absolute -bottom-1 -right-1 text-[10px] bg-orange-100 text-orange-600 rounded-full px-1 font-bold border border-orange-200">?</span>
                )}
              </div>
              <p className={`text-xs font-bold max-w-[72px] text-center leading-tight mt-1 ${node.spouse.isGhost ? 'text-orange-400 italic' : 'text-gray-700'}`}>
                {node.spouse.member.name.split(' ')[0]}
              </p>
              {node.spouse.isGhost && <p className="text-[9px] text-orange-300 italic">not registered</p>}

              {/* Hover tooltip for spouse */}
              <AnimatePresence>
                {spouseHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.92 }}
                    transition={{ duration: 0.18 }}
                    className="absolute z-50 bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-orange-100 p-4 w-64"
                    style={{ minWidth: 220 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar member={node.spouse!.member} size={40} ghost={node.spouse!.isGhost} />
                      <div>
                        <p className="font-extrabold text-gray-900 text-sm leading-tight">{node.spouse!.member.name}</p>
                        <p className={`text-xs font-semibold ${node.spouse!.isGhost ? 'text-orange-400 italic' : 'text-orange-500'}`}>
                          {node.spouse!.isGhost ? '⚠️ Not yet registered' : (node.spouse!.member.current_status || 'Family Member')}
                        </p>
                      </div>
                    </div>
                    {!node.spouse!.isGhost ? (
                      <div className="space-y-1 text-xs text-gray-600">
                        <p>🎂 {formatShortDate(node.spouse!.member.dob)} · Age {getAge(node.spouse!.member.dob)}</p>
                        {node.spouse!.member.anniversary && <p>💍 {formatShortDate(node.spouse!.member.anniversary!)} · {getYearsMarried(node.spouse!.member.anniversary!)}y</p>}
                        {node.spouse!.member.email && <p className="truncate">📧 {node.spouse!.member.email}</p>}
                        {node.spouse!.member.phone && <p>📱 {node.spouse!.member.phone}</p>}
                        {node.spouse!.member.qualification && <p>🎓 {node.spouse!.member.qualification}</p>}
                      </div>
                    ) : (
                      <p className="text-xs text-orange-400 italic">
                        This person was referenced as a spouse but hasn't registered yet.
                      </p>
                    )}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-orange-100 rotate-45 -mt-1.5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>

      {/* Children */}
      <AnimatePresence>
        {expanded && node.children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-visible"
          >
            {/* Vertical connector from parent couple */}
            <motion.div
              className="w-px h-8 bg-gradient-to-b from-orange-300 to-orange-100 mx-auto"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.15 }}
            />

            {/* Horizontal bar spanning children */}
            {node.children.length > 1 && (
              <div className="relative flex justify-center">
                <div
                  className="h-px bg-orange-200"
                  style={{ width: `${(node.children.length - 1) * 120}px` }}
                />
              </div>
            )}

            {/* Children row */}
            <div className="flex gap-6 items-start justify-center">
              {node.children.map(child => (
                <div key={child.member.id} className="flex flex-col items-center">
                  <div className="w-px h-6 bg-orange-200 mx-auto" />
                  <TreeNodeCard node={child} depth={depth + 1} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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
          <p className="text-gray-400 italic mb-5">Hover any member for details · Click to expand/collapse</p>
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
              {trees.map(tree => (
                <TreeNodeCard key={tree.member.id} node={tree} depth={0} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Ghost legend note */}
        <motion.p
          className="text-center text-xs text-orange-400/70 italic mt-4"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5 }}
        >
          ✨ Faded nodes indicate family members referenced but not yet registered · Fuzzy name matching active
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