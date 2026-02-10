import { useEffect, useState } from 'react';
import { Cake, Heart, Sparkles, Timer } from 'lucide-react';
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

    const today = new Date();

    const birthdays = data
      .map((m) => ({
        member: m,
        date: getNextEventDate(m.dob),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const anniversaries = data
      .filter((m) => m.anniversary)
      .map((m) => ({
        member: m,
        date: getNextEventDate(m.anniversary!),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    setNextBirthday(birthdays[0]?.member || null);
    setNextAnniversary(anniversaries[0]?.member || null);

    if (birthdays[0]) setBirthdayCountdown(getCountdown(birthdays[0].date));
    if (anniversaries[0]) setAnniversaryCountdown(getCountdown(anniversaries[0].date));
  };

  const updateCountdowns = () => {
    if (nextBirthday) {
      setBirthdayCountdown(getCountdown(getNextEventDate(nextBirthday.dob)));
    }
    if (nextAnniversary) {
      setAnniversaryCountdown(getCountdown(getNextEventDate(nextAnniversary.anniversary!)));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-maroon-50 px-4 py-16">
      <div className="container mx-auto text-center">
        <Sparkles className="mx-auto text-maroon-800 mb-6" size={64} />

        <h1 className="text-4xl md:text-6xl font-bold text-maroon-800 mb-6">
          Upcoming Celebrations 🎉
        </h1>

        <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
          Never miss a special moment. Here’s what’s coming next in our community.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Birthday Countdown */}
          <CountdownCard
            title="Next Birthday"
            icon={<Cake size={36} />}
            member={nextBirthday}
            countdown={birthdayCountdown}
          />

          {/* Anniversary Countdown */}
          <CountdownCard
            title="Next Anniversary"
            icon={<Heart size={36} />}
            member={nextAnniversary}
            countdown={anniversaryCountdown}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={() => onNavigate('register')}
            className="bg-maroon-800 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-maroon-700 transition shadow-lg"
          >
            Register Now
          </button>

          <button
            onClick={() => onNavigate('members')}
            className="border-2 border-maroon-800 text-maroon-800 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-maroon-50 transition shadow-lg"
          >
            View Members
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------ Components ------------------ */

function CountdownCard({
  title,
  icon,
  member,
  countdown,
}: any) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
      <div className="text-maroon-800 mb-4 flex justify-center">{icon}</div>

      <h3 className="text-2xl font-bold mb-2">{title}</h3>

      {member && countdown ? (
        <>
          <p className="text-lg font-semibold text-gray-800 mb-4">
            {member.name}
          </p>

          <div className="flex justify-center gap-6 text-maroon-800">
            <TimeBox label="Days" value={countdown.days} />
            <TimeBox label="Hours" value={countdown.hours} />
            <TimeBox label="Minutes" value={countdown.minutes} />
          </div>
        </>
      ) : (
        <p className="text-gray-600">No upcoming events</p>
      )}
    </div>
  );
}

function TimeBox({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm">{label}</p>
    </div>
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
