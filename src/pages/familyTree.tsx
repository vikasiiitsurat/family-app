import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

// ─── TYPES ────────────────────────────────────────────────────────────────────
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
  coupleKey: string;
}

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg:            '#160410',
  bgCard:        '#1f0718',
  border:        'rgba(219,39,119,0.22)',
  borderStrong:  'rgba(219,39,119,0.50)',
  primary:       '#db2777',
  primaryLight:  '#f472b6',
  primaryDim:    'rgba(244,114,182,0.55)',
  maroon:        '#831843',
  surface:       'rgba(255,255,255,0.055)',
  surfaceHover:  'rgba(255,255,255,0.09)',
  text:          'rgba(255,255,255,0.92)',
  textMuted:     'rgba(255,255,255,0.48)',
  textDim:       'rgba(255,255,255,0.24)',
  ghost:         'rgba(251,191,36,0.55)',
  ghostBorder:   'rgba(251,191,36,0.32)',
  linkLine:      'rgba(190,24,93,0.55)',
  coupleLine:    'rgba(244,114,182,0.50)',
};

const AVATAR_PALETTES: [string, string][] = [
  ['#be185d', '#881337'],
  ['#a21caf', '#701a75'],
  ['#b91c1c', '#7f1d1d'],
  ['#c026d3', '#86198f'],
  ['#db2777', '#9d174d'],
  ['#7c3aed', '#4c1d95'],
  ['#e11d48', '#9f1239'],
  ['#d946ef', '#a21caf'],
];
function ap(id: string): [string, string] {
  const i = (id.charCodeAt(0) + (id.charCodeAt(1) || 0)) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[i];
}

// ─── UTILS ────────────────────────────────────────────────────────────────────
function normalizeName(n: string) { return n.toLowerCase().replace(/\s+/g, ' ').trim(); }
function namesMatch(a: string, b: string) { return normalizeName(a) === normalizeName(b); }
function deduplicateMembers(members: Member[]): Member[] {
  const merged: Member[] = [];
  for (const m of members) {
    const found = merged.find(e => namesMatch(m.name, e.name));
    if (found) {
      (Object.keys(m) as (keyof Member)[]).forEach(k => {
        if (m[k] != null && m[k] !== '' && !found[k]) (found as any)[k] = m[k];
      });
    } else merged.push({ ...m });
  }
  return merged;
}
function isToday(d?: string | null) {
  if (!d) return false;
  const dt = new Date(d), t = new Date();
  return dt.getMonth() === t.getMonth() && dt.getDate() === t.getDate();
}
function getAge(dob: string) {
  const b = new Date(dob), t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
}
function getYearsMarried(ann: string) { return new Date().getFullYear() - new Date(ann).getFullYear(); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function initials(name: string) { return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(); }

// ─── TREE BUILDER ─────────────────────────────────────────────────────────────
function buildTree(members: Member[]): TreeNode[] {
  let gc = 0;
  const ghosts = new Map<string, Member>();
  const mkGhost = (name: string): Member => {
    const k = normalizeName(name);
    if (!ghosts.has(k)) {
      gc--;
      ghosts.set(k, { id: `ghost_${gc}`, name: name.trim(), email: '', dob: '1970-01-01', phone: '', qualification: '', current_status: 'Not Registered', profile_photo: null, fathers_name: null, mothers_name: null, spouse_name: null, anniversary: null });
    }
    return ghosts.get(k)!;
  };
  const findReal = (name: string, exId?: string) => members.find(m => m.id !== exId && namesMatch(m.name, name));
  const resolve = (name: string, exId?: string) => { const r = findReal(name, exId); return r ? { member: r, isGhost: false } : { member: mkGhost(name), isGhost: true }; };
  const ck = (a?: string, b?: string) => [a, b].filter(Boolean).map(s => normalizeName(s!)).sort().join('__');
  const couples = new Map<string, CoupleUnit>();
  const getOrCreate = (fN?: string, mN?: string, fb?: string): CoupleUnit => {
    const key = fN || mN ? ck(fN, mN) : `single__${fb}`;
    if (couples.has(key)) return couples.get(key)!;
    const u: CoupleUnit = { key, father: undefined, fatherIsGhost: false, mother: undefined, motherIsGhost: false, children: [] };
    if (fN) { const r = resolve(fN); u.father = r.member; u.fatherIsGhost = r.isGhost; }
    if (mN) { const r = resolve(mN); u.mother = r.member; u.motherIsGhost = r.isGhost; }
    couples.set(key, u);
    return u;
  };
  const childOfKey = new Map<string, string>();
  members.forEach(child => {
    const fn = child.fathers_name?.trim() || undefined;
    const mn = child.mothers_name?.trim() || undefined;
    if (!fn && !mn) return;
    const c = getOrCreate(fn, mn);
    if (!c.children.find(x => x.id === child.id)) c.children.push(child);
    childOfKey.set(child.id, c.key);
  });
  const parentCK = new Map<string, string>();
  couples.forEach(c => {
    if (c.father && !c.fatherIsGhost) parentCK.set(c.father.id, c.key);
    if (c.mother && !c.motherIsGhost) parentCK.set(c.mother.id, c.key);
  });
  const done = new Set<string>(parentCK.keys());
  members.forEach(m => {
    if (done.has(m.id)) return;
    const sp = m.spouse_name?.trim() || undefined;
    if (sp) {
      const spR = members.find(s => s.id !== m.id && namesMatch(s.name, sp));
      if (spR) {
        const key = ck(m.name, spR.name);
        if (!couples.has(key)) couples.set(key, { key, father: m, fatherIsGhost: false, mother: spR, motherIsGhost: false, children: [] });
        if (!parentCK.has(m.id)) parentCK.set(m.id, key);
        if (!parentCK.has(spR.id)) parentCK.set(spR.id, key);
        done.add(m.id); done.add(spR.id);
      } else {
        const key = ck(m.name, sp);
        if (!couples.has(key)) couples.set(key, { key, father: m, fatherIsGhost: false, mother: mkGhost(sp), motherIsGhost: true, children: [] });
        parentCK.set(m.id, key); done.add(m.id);
      }
    } else {
      const key = `single__${m.id}`;
      if (!couples.has(key)) couples.set(key, { key, father: m, fatherIsGhost: false, mother: undefined, motherIsGhost: false, children: [] });
      parentCK.set(m.id, key); done.add(m.id);
    }
  });
  const isChild = new Set<string>(childOfKey.keys());
  const roots: CoupleUnit[] = [];
  const seen = new Set<string>();
  couples.forEach(c => {
    const fC = c.father?.id && !c.fatherIsGhost && isChild.has(c.father.id);
    const mC = c.mother?.id && !c.motherIsGhost && isChild.has(c.mother.id);
    if (!fC && !mC && !seen.has(c.key)) { seen.add(c.key); roots.push(c); }
  });
  const vis = new Set<string>();
  const build = (c: CoupleUnit): TreeNode => {
    vis.add(c.key);
    const childNodes: TreeNode[] = [];
    for (const child of c.children) {
      const k = parentCK.get(child.id);
      if (k && !vis.has(k)) { const cc = couples.get(k); if (cc) childNodes.push(build(cc)); }
      else if (!k) {
        const sk = `single__${child.id}`;
        if (!vis.has(sk)) childNodes.push(build({ key: sk, father: child, fatherIsGhost: false, mother: undefined, motherIsGhost: false, children: [] }));
      }
    }
    return { father: c.father, fatherIsGhost: c.fatherIsGhost, mother: c.mother, motherIsGhost: c.motherIsGhost, children: childNodes, coupleKey: c.key };
  };
  return roots.filter(c => !vis.has(c.key)).map(build);
}

// ─── LAYOUT ───────────────────────────────────────────────────────────────────
const NW = 120, NH = 115, HG = 50, VG = 90, CG = 56;

interface LayoutNode { treeNode: TreeNode; x: number; y: number; width: number; children: LayoutNode[]; }

function computeLayout(node: TreeNode, depth: number, offset: number): LayoutNode {
  if (!node.children.length)
    return { treeNode: node, x: offset, y: depth * (NH + VG), width: NW * 2 + CG, children: [] };
  const ch: LayoutNode[] = [];
  let cur = offset;
  for (const c of node.children) { const l = computeLayout(c, depth + 1, cur); ch.push(l); cur += l.width + HG; }
  const tw = cur - HG - offset;
  return { treeNode: node, x: offset + tw / 2 - (NW * 2 + CG) / 2, y: depth * (NH + VG), width: Math.max(tw, NW * 2 + CG), children: ch };
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Avatar({ member, size = 56, ghost = false }: { member: Member; size?: number; ghost?: boolean }) {
  const [c1, c2] = ap(member.id);
  const cel = !ghost && (isToday(member.dob) || (member.anniversary && isToday(member.anniversary)));
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {cel && (
        <motion.div
          className="absolute rounded-full"
          style={{ inset: -2, background: `conic-gradient(${T.primaryLight}, #f9a8d4, ${T.primaryLight})` }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      )}
      <div
        className="absolute rounded-full overflow-hidden flex items-center justify-center font-bold text-white"
        style={{
          inset: cel ? 2 : 0,
          background: ghost ? `linear-gradient(135deg, ${T.maroon} 0%, #3b0a24 100%)` : `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
          border: ghost ? `2px dashed ${T.ghostBorder}` : '2px solid rgba(255,255,255,0.18)',
          fontSize: size * 0.33,
          color: ghost ? T.ghost : '#fff',
        }}
      >
        {member.profile_photo && !ghost
          ? <img src={member.profile_photo} alt={member.name} className="w-full h-full object-cover" />
          : ghost ? '?' : initials(member.name)}
      </div>
    </div>
  );
}

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────
function Tooltip({ member, ghost }: { member: Member; ghost: boolean }) {
  const bday = !ghost && isToday(member.dob);
  const anniv = !ghost && !!member.anniversary && isToday(member.anniversary);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 6 }}
      transition={{ duration: 0.16 }}
      className="absolute z-[200] bottom-full mb-3 left-1/2 -translate-x-1/2"
      style={{ width: 240 }}
    >
      <div className="rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: T.bgCard, border: `1px solid ${ghost ? T.ghostBorder : T.borderStrong}`, boxShadow: '0 20px 50px rgba(0,0,0,0.65)' }}>
        <div className="h-[3px]" style={{ background: ghost ? 'linear-gradient(90deg,#92400e,#d97706)' : `linear-gradient(90deg,${T.maroon},${T.primary},${T.primaryLight})` }} />
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar member={member} size={40} ghost={ghost} />
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight truncate" style={{ color: T.text }}>{member.name}</p>
              <p className="text-xs mt-0.5 truncate" style={{ color: ghost ? T.ghost : T.primaryLight }}>
                {ghost ? '⚠ Not registered' : (member.current_status || member.qualification || 'Family Member')}
              </p>
            </div>
          </div>
          {!ghost ? (
            <div className="space-y-1.5 text-xs">
              {(bday || anniv) && (
                <div className="rounded-lg px-3 py-1.5 text-center font-semibold"
                  style={{ background: 'rgba(219,39,119,0.12)', border: `1px solid ${T.border}`, color: T.primaryLight }}>
                  {bday ? '🎂 Birthday Today!' : '💍 Anniversary Today!'}
                </div>
              )}
              <Row icon="🎂" v={`${fmtDate(member.dob)} · Age ${getAge(member.dob)}`} />
              {member.anniversary && <Row icon="💍" v={`${getYearsMarried(member.anniversary)}y married`} />}
              {member.qualification && <Row icon="🎓" v={member.qualification} />}
              {member.phone && <Row icon="📱" v={member.phone} />}
              {member.email && <Row icon="📧" v={member.email} clip />}
            </div>
          ) : (
            <p className="text-xs italic" style={{ color: T.ghost }}>Referenced but not yet registered in the system.</p>
          )}
        </div>
      </div>
      <div className="w-3 h-3 mx-auto -mt-1.5 rotate-45 border-b border-r"
        style={{ background: T.bgCard, borderColor: ghost ? T.ghostBorder : T.borderStrong }} />
    </motion.div>
  );
}

function Row({ icon, v, clip }: { icon: string; v: string; clip?: boolean }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-sm flex-shrink-0 mt-px">{icon}</span>
      <span className={clip ? 'truncate' : ''} style={{ color: T.textMuted }}>{v}</span>
    </div>
  );
}

// ─── MEMBER NODE ─────────────────────────────────────────────────────────────
function MemberNode({ member, ghost, depth }: { member: Member; ghost: boolean; depth: number }) {
  const [hov, setHov] = useState(false);
  const cel = !ghost && (isToday(member.dob) || (member.anniversary && isToday(member.anniversary)));

  return (
    <motion.div
      className="relative flex flex-col items-center cursor-pointer select-none"
      initial={{ opacity: 0, scale: 0.65, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: depth * 0.09, type: 'spring', stiffness: 210, damping: 20 }}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
    >
      {/* Celebration ring */}
      {cel && (
        <motion.div
          className="absolute rounded-full"
          style={{ width: 70, height: 70, top: -5, left: -5, background: 'radial-gradient(circle, rgba(219,39,119,0.22) 0%, transparent 65%)' }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        />
      )}

      {/* Hover ring */}
      {hov && (
        <motion.div className="absolute rounded-full pointer-events-none"
          style={{ width: 66, height: 66, top: -3, left: -3, background: 'radial-gradient(circle, rgba(219,39,119,0.15) 0%, transparent 70%)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12 }} />
      )}

      <motion.div animate={{ scale: hov ? 1.07 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
        <Avatar member={member} size={60} ghost={ghost} />
      </motion.div>

      <p
        className="mt-1.5 text-[10px] font-semibold text-center leading-snug break-words"
        style={{ maxWidth: 108, color: hov ? (ghost ? '#fbbf24' : T.primaryLight) : (ghost ? T.ghost : T.text) }}
      >
        {member.name}
      </p>

      {ghost && <p className="text-[8px] italic" style={{ color: 'rgba(251,191,36,0.38)' }}>unregistered</p>}
      {cel && <span className="text-[11px] mt-0.5">{isToday(member.dob) ? '🎂' : '💍'}</span>}

      <AnimatePresence>{hov && <Tooltip member={member} ghost={ghost} />}</AnimatePresence>
    </motion.div>
  );
}

// ─── ANIMATED SVG PATH ────────────────────────────────────────────────────────
function APath({ d, delay = 0, color, dashed = false }: { d: string; delay?: number; color: string; dashed?: boolean }) {
  return (
    <motion.path d={d} fill="none" stroke={color} strokeWidth={1.5}
      strokeDasharray={dashed ? '5 5' : undefined}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.65, delay, ease: 'easeOut' }} />
  );
}

// ─── RENDER TREE ─────────────────────────────────────────────────────────────
function renderTree(
  layout: LayoutNode, depth: number,
  paths: JSX.Element[], nodes: JSX.Element[],
  expanded: Set<string>, toggle: (k: string) => void
) {
  const { treeNode: node, children: cLayouts } = layout;
  const { coupleKey: ck } = node;
  const isExp = expanded.has(ck);
  const hasBoth = !!node.father && !!node.mother;
  const hasKids = node.children.length > 0;

  const fCx = layout.x + NW / 2;
  const fCy = layout.y + NH / 2;
  const mCx = layout.x + NW + CG + NW / 2;
  const mCy = layout.y + NH / 2;
  const cCx = hasBoth ? (fCx + mCx) / 2 : (node.father ? fCx : mCx);
  const botY = layout.y + NH;

  // Couple link
  if (hasBoth) {
    paths.push(
      <APath key={`cp-${ck}`} d={`M ${fCx} ${fCy} Q ${cCx} ${fCy - 8} ${mCx} ${mCy}`}
        delay={depth * 0.07} color={T.coupleLine} dashed />
    );
    nodes.push(
      <motion.div key={`hrt-${ck}`} className="absolute z-20 text-xs cursor-pointer"
        style={{ left: cCx - 7, top: layout.y + NH / 2 - 22 }}
        animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2.5, repeat: Infinity }}
        onClick={() => hasKids && toggle(ck)}>
        💕
      </motion.div>
    );
  }

  // Lines to children
  if (hasKids && isExp) {
    const midY = layout.y + NH + VG / 2;
    paths.push(<APath key={`vl-${ck}`} d={`M ${cCx} ${botY + 6} L ${cCx} ${midY}`} delay={depth * 0.07 + 0.18} color={T.linkLine} />);

    if (cLayouts.length > 1) {
      const fstCx = cLayouts[0].x + (cLayouts[0].treeNode.mother ? (NW + CG / 2 + NW / 2) : NW / 2);
      const lstL = cLayouts[cLayouts.length - 1];
      const lstCx = lstL.x + (lstL.treeNode.mother ? (NW + CG / 2 + NW / 2) : NW / 2);
      paths.push(<APath key={`hl-${ck}`} d={`M ${fstCx} ${midY} L ${lstCx} ${midY}`} delay={depth * 0.07 + 0.28} color={T.linkLine} />);
    }

    for (const cl of cLayouts) {
      const ccx = cl.x + (cl.treeNode.mother ? (NW + CG / 2 + NW / 2) : NW / 2);
      paths.push(<APath key={`dl-${ck}-${ccx}`} d={`M ${ccx} ${midY} L ${ccx} ${cl.y}`} delay={depth * 0.07 + 0.38} color={T.linkLine} />);
      renderTree(cl, depth + 1, paths, nodes, expanded, toggle);
    }
  }

  // Expand/collapse button
  if (hasKids) {
    nodes.push(
      <motion.button key={`tog-${ck}`} className="absolute z-30 rounded-full font-bold flex items-center justify-center text-[9px]"
        style={{ left: cCx - 10, top: botY + 4, width: 20, height: 20, background: isExp ? 'rgba(190,24,93,0.18)' : 'rgba(157,23,77,0.18)', border: `1px solid ${isExp ? T.borderStrong : T.border}`, color: T.primaryLight }}
        onClick={() => toggle(ck)} whileHover={{ scale: 1.25 }} whileTap={{ scale: 0.88 }} animate={{ rotate: isExp ? 0 : 180 }}>
        ▲
      </motion.button>
    );
  }

  if (node.father)
    nodes.push(<div key={`fa-${ck}`} className="absolute z-10" style={{ left: layout.x, top: layout.y }}><MemberNode member={node.father} ghost={node.fatherIsGhost} depth={depth} /></div>);

  if (node.mother)
    nodes.push(<div key={`mo-${ck}`} className="absolute z-10" style={{ left: layout.x + NW + CG, top: layout.y }}><MemberNode member={node.mother} ghost={node.motherIsGhost} depth={depth} /></div>);
}

// ─── SEARCH OVERLAY ───────────────────────────────────────────────────────────
function SearchOverlay({ members, onClose }: { members: Member[]; onClose: () => void }) {
  const [q, setQ] = useState('');
  const filtered = q.length > 1
    ? members.filter(m => m.name.toLowerCase().includes(q.toLowerCase()) || m.current_status?.toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <motion.div className="absolute inset-0 z-50 flex items-start justify-center pt-14 px-4"
      style={{ background: 'rgba(8,0,6,0.78)', backdropFilter: 'blur(6px)' }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="w-full max-w-md" initial={{ y: -18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={e => e.stopPropagation()}>
        <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: T.bgCard, border: `1px solid ${T.borderStrong}` }}>
          <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: 'rgba(219,39,119,0.14)' }}>
            <span>🔍</span>
            <input autoFocus className="flex-1 bg-transparent outline-none text-sm" style={{ color: T.text }}
              placeholder="Search members…" value={q} onChange={e => setQ(e.target.value)} />
            <button onClick={onClose} style={{ color: T.textDim }} className="text-lg leading-none hover:text-white">✕</button>
          </div>
          {filtered.length > 0 && (
            <div className="max-h-72 overflow-y-auto">
              {filtered.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 transition-colors"
                  style={{ borderBottom: `1px solid rgba(219,39,119,0.07)` }}
                  onMouseEnter={e => (e.currentTarget.style.background = T.surface)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <Avatar member={m} size={34} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: T.text }}>{m.name}</p>
                    <p className="text-xs truncate" style={{ color: T.primaryLight }}>{m.current_status || m.qualification}</p>
                  </div>
                  <span className="text-xs" style={{ color: T.textDim }}>{getAge(m.dob)}y</span>
                </div>
              ))}
            </div>
          )}
          {q.length > 1 && !filtered.length && (
            <div className="p-7 text-center text-sm italic" style={{ color: T.textDim }}>No members found</div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── STATS SIDEBAR ────────────────────────────────────────────────────────────
function StatsSidebar({ members, onClose }: { members: Member[]; onClose: () => void }) {
  const married = members.filter(m => m.anniversary || m.spouse_name).length;
  const withPhoto = members.filter(m => m.profile_photo).length;
  const today = members.filter(m => isToday(m.dob) || (m.anniversary && isToday(m.anniversary)));

  return (
    <motion.div className="absolute right-0 top-0 h-full z-50 w-72 overflow-y-auto"
      style={{ background: T.bgCard, borderLeft: `1px solid ${T.border}` }}
      initial={{ x: 288 }} animate={{ x: 0 }} exit={{ x: 288 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-sm" style={{ color: T.text }}>Family Insights</h3>
          <button onClick={onClose} style={{ color: T.textDim }} className="text-lg leading-none hover:text-white">✕</button>
        </div>

        <div className="space-y-2 mb-5">
          {[
            { label: 'Total Members', value: members.length, icon: '👥', color: T.primaryLight },
            { label: 'Married', value: married, icon: '💍', color: '#f9a8d4' },
            { label: 'With Photos', value: withPhoto, icon: '📸', color: '#c084fc' },
            { label: 'Celebrating Today', value: today.length, icon: '🎉', color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: T.surface, border: `1px solid rgba(219,39,119,0.1)` }}>
              <span className="text-xl">{s.icon}</span>
              <div>
                <p className="text-[9px] uppercase tracking-wide" style={{ color: T.textMuted }}>{s.label}</p>
                <p className="text-xl font-black leading-tight" style={{ color: s.color }}>{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {today.length > 0 && (
          <div className="mb-5">
            <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: '#fbbf24' }}>Today's Stars ⭐</p>
            {today.map(m => (
              <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg mb-1.5"
                style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.18)' }}>
                <Avatar member={m} size={28} />
                <div>
                  <p className="text-xs font-semibold" style={{ color: T.text }}>{m.name}</p>
                  <p className="text-[10px]" style={{ color: '#fbbf24' }}>
                    {isToday(m.dob) ? `🎂 Turns ${getAge(m.dob)}` : `💍 ${getYearsMarried(m.anniversary!)}y`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-3" style={{ color: T.primaryLight }}>All Members</p>
          <div className="space-y-0.5 max-h-64 overflow-y-auto">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-2 p-1.5 rounded-lg"
                onMouseEnter={e => (e.currentTarget.style.background = T.surface)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <Avatar member={m} size={24} />
                <p className="text-xs font-medium flex-1 truncate" style={{ color: T.text }}>{m.name}</p>
                <span className="text-[10px]" style={{ color: T.textDim }}>{getAge(m.dob)}y</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── TREE CANVAS ─────────────────────────────────────────────────────────────
function TreeCanvas({ trees, members }: { trees: TreeNode[]; members: Member[] }) {
  const [zoom, setZoom] = useState(0.9);
  const [pan, setPan] = useState({ x: 60, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const drag = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>();
    const col = (n: TreeNode) => { s.add(n.coupleKey); n.children.forEach(col); };
    trees.forEach(col);
    return s;
  });

  const toggle = useCallback((k: string) => {
    setExpanded(prev => { const next = new Set(prev); next.has(k) ? next.delete(k) : next.add(k); return next; });
  }, []);

  const layouts = useMemo(() => {
    let off = 0;
    return trees.map(t => { const l = computeLayout(t, 0, off); off += l.width + 80; return l; });
  }, [trees]);

  const { tw, th } = useMemo(() => {
    let mx = 0, my = 0;
    const tr = (l: LayoutNode) => { mx = Math.max(mx, l.x + l.width); my = Math.max(my, l.y + NH); l.children.forEach(tr); };
    layouts.forEach(tr);
    return { tw: mx + 100, th: my + 120 };
  }, [layouts]);

  const paths: JSX.Element[] = [], nodes: JSX.Element[] = [];
  layouts.forEach(l => renderTree(l, 0, paths, nodes, expanded, toggle));

  return (
    <div className="w-full h-full overflow-hidden relative"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={e => { if (e.button !== 0) return; setIsDragging(true); drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }; }}
      onMouseMove={e => { if (isDragging) setPan({ x: drag.current.px + e.clientX - drag.current.x, y: drag.current.py + e.clientY - drag.current.y }); }}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onWheel={e => { e.preventDefault(); setZoom(z => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001))); }}
    >
      <div style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', position: 'absolute', width: tw, height: th }}>
        <svg className="absolute inset-0 pointer-events-none overflow-visible" width={tw} height={th} style={{ zIndex: 1 }}>
          {paths}
        </svg>
        <div className="absolute inset-0" style={{ zIndex: 5 }}>{nodes}</div>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col gap-1.5">
        {[{ l: '+', fn: () => setZoom(z => Math.min(2, z + 0.15)) },
          { l: '⟳', fn: () => { setZoom(0.9); setPan({ x: 60, y: 50 }); } },
          { l: '−', fn: () => setZoom(z => Math.max(0.3, z - 0.15)) }].map(b => (
          <button key={b.l} onClick={b.fn}
            className="w-9 h-9 rounded-xl font-bold text-base flex items-center justify-center hover:scale-110 transition-transform"
            style={{ background: 'rgba(190,24,93,0.14)', border: `1px solid ${T.border}`, color: T.primaryLight }}>
            {b.l}
          </button>
        ))}
      </div>
      <div className="absolute bottom-5 left-5 z-20 text-[11px] font-semibold" style={{ color: T.primaryDim }}>
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function FamilyTreePage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [trees, setTrees] = useState<TreeNode[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from('members')
          .select('id,name,email,dob,phone,qualification,current_status,anniversary,linkedin,whatsapp,instagram,profile_photo,fathers_name,mothers_name,spouse_name,timezone')
          .order('name', { ascending: true });
        if (err) throw err;
        const clean = deduplicateMembers(data || []);
        setMembers(clean);
        setTrees(buildTree(clean));
      } catch (e: any) {
        setError('Could not load family data.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(s => !s); }
      if (e.key === 'Escape') { setShowSearch(false); setShowStats(false); }
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, []);

  return (
    <div className="relative w-full overflow-hidden"
      style={{ background: `radial-gradient(ellipse 90% 70% at 20% 15%, #2a0a1c 0%, ${T.bg} 55%, #0e020b 100%)`, height: 'calc(100vh - 120px)' }}>

      {/* Very subtle ambient — just two soft blobs, no particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-64 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: 'radial-gradient(circle, #db2777 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full opacity-[0.04] blur-3xl"
          style={{ background: 'radial-gradient(circle, #be185d 0%, transparent 70%)' }} />
      </div>

      {/* Header controls */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        <motion.button
          className="flex items-center gap-1.5 text-xs font-medium rounded-xl px-3 py-2"
          style={{ color: T.textMuted, background: T.surface, border: `1px solid rgba(255,255,255,0.08)` }}
          onClick={() => setShowSearch(s => !s)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          🔍 Search
        </motion.button>
        <motion.button
          className="flex items-center gap-1.5 text-xs font-medium rounded-xl px-3 py-2"
          style={{ color: T.primaryLight, background: 'rgba(190,24,93,0.12)', border: `1px solid ${T.border}` }}
          onClick={() => setShowStats(s => !s)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          📊 Stats
        </motion.button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 z-20 flex flex-wrap items-center justify-center gap-5 px-6 py-2.5"
        style={{ background: 'rgba(12,2,9,0.82)', borderTop: `1px solid rgba(219,39,119,0.1)`, backdropFilter: 'blur(8px)' }}>
        {[
          { icon: '💕', text: 'Married couple' },
          { icon: '🎂', text: "Today's birthday" },
          { swatch: T.ghostBorder, text: 'Unregistered' },
          { swatch: T.linkLine, text: 'Family link' },
          { text: '🖱 Drag · Scroll = zoom · Hover for details' },
        ].map((l, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[10px]" style={{ color: T.textDim }}>
            {l.icon && <span>{l.icon}</span>}
            {l.swatch && <div className="w-5 h-px rounded" style={{ background: l.swatch }} />}
            <span>{l.text}</span>
          </div>
        ))}
      </div>

      {/* Main canvas */}
      <div className="absolute inset-0 pb-10" style={{ zIndex: 10 }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-5">
            <motion.div className="text-5xl" animate={{ rotate: 360 }} transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}>🌸</motion.div>
            <motion.p className="text-sm tracking-widest uppercase" style={{ color: T.primaryDim }}
              animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
              Loading family tree…
            </motion.p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-5xl">🥀</div>
            <p className="text-sm" style={{ color: T.textMuted }}>{error}</p>
          </div>
        ) : !trees.length ? (
          <div className="flex flex-col items-center justify-center h-full gap-5">
            <motion.div className="text-7xl" animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}>🌱</motion.div>
            <p className="text-lg font-bold" style={{ color: T.text }}>Your family tree awaits</p>
            <p className="text-sm" style={{ color: T.textMuted }}>Register members with parent/spouse names to grow the tree</p>
          </div>
        ) : (
          <TreeCanvas trees={trees} members={members} />
        )}
      </div>

      <AnimatePresence>{showSearch && <SearchOverlay members={members} onClose={() => setShowSearch(false)} />}</AnimatePresence>
      <AnimatePresence>{showStats && <StatsSidebar members={members} onClose={() => setShowStats(false)} />}</AnimatePresence>
    </div>
  );
}