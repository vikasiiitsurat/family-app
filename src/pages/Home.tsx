import { useEffect, useState } from 'react';
import { Cake, Heart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase, Member } from '../lib/supabase';

export default function Home({ onNavigate }: { onNavigate: (page: 'register' | 'members') => void }) {
  const [nextBirthday, setNextBirthday] = useState<Member | null>(null);
  const [nextAnniversary, setNextAnniversary] = useState<Member | null>(null);
  const [birthdayCountdown, setBirthdayCountdown] = useState<any>(null);
  const [anniversaryCountdown, setAnniversaryCountdown] = useState<any>(null);

  useEffect(() => {
    fetchNextEvents();
    const interval = setInterval(updateCountdowns, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNextEvents = async () => {
    const { data } = await supabase.from('members').select('*');
    if (!data) return;

    const birthdays = data
      .map((m) => ({ member: m, date: getNextEventDate(m.dob) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const anniversaries = data
      .filter((m) => m.anniversary)
      .map((m) => ({ member: m, date: getNextEventDate(m.anniversary!) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    setNextBirthday(birthdays[0]?.member || null);
    setNextAnniversary(anniversaries[0]?.member || null);

    if (birthdays[0]) setBirthdayCountdown(getCountdown(birthdays[0].date));
    if (anniversaries[0]) setAnniversaryCountdown(getCountdown(anniversaries[0].date));
  };

  const updateCountdowns = () => {
    if (nextBirthday) setBirthdayCountdown(getCountdown(getNextEventDate(nextBirthday.dob)));
    if (nextAnniversary) setAnniversaryCountdown(getCountdown(getNextEventDate(nextAnniversary.anniversary!)));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-pink-100 via-white to-maroon-100 px-4 py-20">

      {/* Floating Background Sparkles */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <Sparkles className="absolute top-20 left-20 text-pink-400 animate-pulse" size={80} />
        <Sparkles className="absolute bottom-20 right-20 text-maroon-400 animate-pulse" size={100} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto text-center relative z-10"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 6 }}
        >
          <Sparkles className="mx-auto text-maroon-800 mb-6" size={70} />
        </motion.div>

        <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-pink-600 to-maroon-800 bg-clip-text text-transparent mb-6">
          Upcoming Celebrations 🎉
        </h1>

        <p className="text-lg text-gray-700 mb-14 max-w-2xl mx-auto">
          Love, laughter, and memories — countdown to the next beautiful moment.
        </p>

        <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto mb-20">
          <CountdownCard
            title="Next Birthday"
            icon={<Cake size={38} />}
            member={nextBirthday}
            countdown={birthdayCountdown}
            glow="from-pink-400 to-pink-600"
          />

          <CountdownCard
            title="Next Anniversary"
            icon={<Heart size={38} />}
            member={nextAnniversary}
            countdown={anniversaryCountdown}
            glow="from-maroon-500 to-pink-600"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('register')}
            className="bg-gradient-to-r from-maroon-700 to-pink-600 text-white px-10 py-4 rounded-2xl text-lg font-semibold shadow-xl"
          >
            Register Celebration
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('members')}
            className="border-2 border-maroon-700 text-maroon-700 px-10 py-4 rounded-2xl text-lg font-semibold bg-white/60 backdrop-blur shadow-xl"
          >
            View Members
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------ Components ------------------ */

function CountdownCard({ title, icon, member, countdown, glow }: any) {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className={`relative rounded-3xl p-[2px] bg-gradient-to-r ${glow}`}
    >
      <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-10 shadow-2xl text-center">
        <div className="text-maroon-700 mb-4 flex justify-center">
          {icon}
        </div>

        <h3 className="text-2xl font-bold mb-2">{title}</h3>

        {member && countdown ? (
          <>
            <p className="text-lg font-semibold text-gray-800 mb-6">
              {member.name}
            </p>

            <div className="flex justify-center gap-8 text-maroon-800">
              <TimeBox label="Days" value={countdown.days} />
              <TimeBox label="Hours" value={countdown.hours} />
              <TimeBox label="Minutes" value={countdown.minutes} />
            </div>
          </>
        ) : (
          <p className="text-gray-600">No upcoming events</p>
        )}
      </div>
    </motion.div>
  );
}

function TimeBox({ label, value }: { label: string; value: number }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ repeat: Infinity, duration: 2 }}
    >
      <p className="text-4xl font-extrabold">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </motion.div>
  );
}

/* ------------------ Utils ------------------ */

function getNextEventDate(dateStr: string) {
  const today = new Date();
  const eventDate = new Date(dateStr);

  eventDate.setFullYear(today.getFullYear());
  if (eventDate < today) eventDate.setFullYear(today.getFullYear() + 1);

  return eventDate;
}

function getCountdown(targetDate: Date) {
  const diff = targetDate.getTime() - Date.now();

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
  };
}
