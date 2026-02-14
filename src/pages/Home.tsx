import { useEffect, useState } from 'react';
import { Cake, Heart, Sparkles, Gift, PartyPopper, Star, Flame, Users, Calendar, Mail, Phone, Zap, Crown, Trophy, Rocket, Sunrise, Music, Camera, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, Member } from '../lib/supabase';
import Confetti from '../components/Confetti';

export default function Home({ onNavigate }: { onNavigate: (page: 'register' | 'members' | 'privacy') => void }) {
  const [nextBirthday, setNextBirthday] = useState<Member | null>(null);
  const [nextAnniversary, setNextAnniversary] = useState<Member | null>(null);
  const [birthdayCountdown, setBirthdayCountdown] = useState<any>(null);
  const [anniversaryCountdown, setAnniversaryCountdown] = useState<any>(null);
  
  // Second upcoming events
  const [secondNextBirthday, setSecondNextBirthday] = useState<Member | null>(null);
  const [secondNextAnniversary, setSecondNextAnniversary] = useState<Member | null>(null);
  const [secondBirthdayCountdown, setSecondBirthdayCountdown] = useState<any>(null);
  const [secondAnniversaryCountdown, setSecondAnniversaryCountdown] = useState<any>(null);
  
  // Today's celebrations
  const [todayBirthdays, setTodayBirthdays] = useState<Member[]>([]);
  const [todayAnniversaries, setTodayAnniversaries] = useState<Member[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Stats for footer
  const [totalMembers, setTotalMembers] = useState(0);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);

  useEffect(() => {
    fetchNextEvents();
    const interval = setInterval(updateCountdowns, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (todayBirthdays.length > 0 || todayAnniversaries.length > 0) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [todayBirthdays, todayAnniversaries]);

  const fetchNextEvents = async () => {
    const { data } = await supabase.from('members').select('*');
    if (!data) return;

    setTotalMembers(data.length);
    
    const today = new Date();
    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const birthdaysToday = data.filter((m) => {
      const dob = new Date(m.dob);
      const dobStr = `${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`;
      return dobStr === todayStr;
    });

    const anniversariesToday = data.filter((m) => {
      if (!m.anniversary) return false;
      const anniversary = new Date(m.anniversary);
      const annivStr = `${String(anniversary.getMonth() + 1).padStart(2, '0')}-${String(anniversary.getDate()).padStart(2, '0')}`;
      return annivStr === todayStr;
    });

    setTodayBirthdays(birthdaysToday);
    setTodayAnniversaries(anniversariesToday);

    const upcomingBirthdays = data
      .filter(m => !birthdaysToday.includes(m))
      .map((m) => ({ member: m, date: getNextEventDate(m.dob) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const upcomingAnniversaries = data
      .filter((m) => m.anniversary && !anniversariesToday.includes(m))
      .map((m) => ({ member: m, date: getNextEventDate(m.anniversary!) }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const upcomingCount = [
      ...upcomingBirthdays.filter(b => b.date <= thirtyDaysFromNow),
      ...upcomingAnniversaries.filter(a => a.date <= thirtyDaysFromNow)
    ].length;
    
    setUpcomingEventsCount(upcomingCount);

    // First upcoming events
    setNextBirthday(upcomingBirthdays[0]?.member || null);
    setNextAnniversary(upcomingAnniversaries[0]?.member || null);

    // Second upcoming events
    setSecondNextBirthday(upcomingBirthdays[1]?.member || null);
    setSecondNextAnniversary(upcomingAnniversaries[1]?.member || null);

    if (upcomingBirthdays[0]) setBirthdayCountdown(getCountdown(upcomingBirthdays[0].date));
    if (upcomingAnniversaries[0]) setAnniversaryCountdown(getCountdown(upcomingAnniversaries[0].date));
    if (upcomingBirthdays[1]) setSecondBirthdayCountdown(getCountdown(upcomingBirthdays[1].date));
    if (upcomingAnniversaries[1]) setSecondAnniversaryCountdown(getCountdown(upcomingAnniversaries[1].date));
  };

  const updateCountdowns = () => {
    if (nextBirthday) setBirthdayCountdown(getCountdown(getNextEventDate(nextBirthday.dob)));
    if (nextAnniversary) setAnniversaryCountdown(getCountdown(getNextEventDate(nextAnniversary.anniversary!)));
    if (secondNextBirthday) setSecondBirthdayCountdown(getCountdown(getNextEventDate(secondNextBirthday.dob)));
    if (secondNextAnniversary) setSecondAnniversaryCountdown(getCountdown(getNextEventDate(secondNextAnniversary.anniversary!)));
  };

  const getAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getYearsMarried = (anniversary: string) => {
    const anniversaryDate = new Date(anniversary);
    const today = new Date();
    return today.getFullYear() - anniversaryDate.getFullYear();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100">
      
      {showConfetti && <Confetti />}

      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-purple-300/40 to-pink-300/40 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-20 right-20 w-[500px] h-[500px] bg-gradient-to-br from-orange-300/40 to-rose-300/40 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -30, 30, 0],
            scale: [1, 1.1, 1.2, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-cyan-300/30 to-blue-300/30 rounded-full blur-3xl"
        />
        
        {/* Floating Sparkles */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-20"
        >
          <Sparkles className="text-pink-400 opacity-30" size={80} />
        </motion.div>
        <motion.div
          animate={{ 
            y: [0, 30, 0],
            rotate: [360, 180, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-32 right-32"
        >
          <Star className="text-yellow-400 opacity-30" size={100} />
        </motion.div>
        <motion.div
          animate={{ 
            x: [0, 40, 0],
            y: [0, -40, 0],
            rotate: [0, 90, 180, 270, 360],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/4"
        >
          <Gift className="text-purple-400 opacity-20" size={70} />
        </motion.div>
        <motion.div
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-40 right-1/3"
        >
          <Heart className="text-red-400 fill-red-400 opacity-20" size={90} />
        </motion.div>
        <motion.div
          animate={{ 
            rotate: [0, 360],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 left-1/3"
        >
          <Cake className="text-pink-400 opacity-20" size={85} />
        </motion.div>
      </div>

      <div className="px-4 py-20">
        <div className="container mx-auto relative z-10 max-w-6xl">
          
          {/* TODAY'S CELEBRATIONS */}
          <AnimatePresence>
            {(todayBirthdays.length > 0 || todayAnniversaries.length > 0) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -50 }}
                transition={{ duration: 0.6, type: 'spring' }}
                className="mb-16"
              >
                {/* Birthday Celebrations */}
                {todayBirthdays.map((member, index) => (
                  <motion.div
                    key={`birthday-${member.id}`}
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.2 }}
                    className="mb-8"
                  >
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                      {/* Animated Background Gradient */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600"
                        animate={{
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        style={{ backgroundSize: '200% 200%' }}
                      />
                      
                      {/* Floating Elements Background */}
                      <div className="absolute inset-0 overflow-hidden">
                        {[...Array(15)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute text-white/20"
                            initial={{ 
                              x: Math.random() * 100 + '%',
                              y: '120%',
                            }}
                            animate={{
                              y: '-20%',
                              x: `${Math.random() * 100}%`,
                              rotate: 360,
                            }}
                            transition={{
                              duration: Math.random() * 10 + 15,
                              repeat: Infinity,
                              delay: Math.random() * 5,
                              ease: "linear"
                            }}
                          >
                            {i % 3 === 0 ? <Cake size={30} /> : i % 3 === 1 ? <Gift size={25} /> : <Star size={28} />}
                          </motion.div>
                        ))}
                      </div>
                      
                      <div className="relative p-8 md:p-12 text-white">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          {/* Animated Icon */}
                          <motion.div
                            animate={{ 
                              rotate: [0, 10, -10, 10, 0],
                              scale: [1, 1.15, 1, 1.15, 1]
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 3,
                              ease: "easeInOut"
                            }}
                            className="flex-shrink-0 relative"
                          >
                            <div className="bg-white/25 backdrop-blur-xl rounded-full p-8 shadow-2xl border-4 border-white/40">
                              <Cake size={70} className="text-white" />
                            </div>
                            <motion.div
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="absolute -top-2 -right-2"
                            >
                              <Crown size={35} className="text-yellow-300 fill-yellow-300" />
                            </motion.div>
                          </motion.div>

                          <div className="flex-1 text-center md:text-left">
                            {/* Animated Title */}
                            <motion.div
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              <h2 className="text-4xl md:text-6xl font-extrabold mb-3 flex items-center justify-center md:justify-start gap-4 flex-wrap">
                                <PartyPopper size={48} />
                                Happy Birthday!
                                <Gift size={48} />
                              </h2>
                            </motion.div>
                            
                            <motion.p 
                              className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center md:justify-start gap-3"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Sparkles size={30} />
                              {member.name}
                              <Sparkles size={30} />
                            </motion.p>
                            
                            <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 rounded-full px-8 py-3 mb-5 shadow-xl border-2 border-white/50">
                              <p className="text-2xl font-extrabold flex items-center gap-2">
                                <Trophy size={24} />
                                Turning {getAge(member.dob)} Today!
                                <Rocket size={24} />
                              </p>
                            </div>

                            {/* Professional Info */}
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm md:text-base mb-4">
                              <motion.span 
                                className="bg-white/30 backdrop-blur-sm px-5 py-2.5 rounded-full font-semibold border border-white/40 flex items-center gap-2"
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.4)' }}
                              >
                                📧 {member.email}
                              </motion.span>
                              <motion.span 
                                className="bg-white/30 backdrop-blur-sm px-5 py-2.5 rounded-full font-semibold border border-white/40 flex items-center gap-2"
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.4)' }}
                              >
                                📱 {member.phone}
                              </motion.span>
                              {member.current_status && (
                                <motion.span 
                                  className="bg-white/30 backdrop-blur-sm px-5 py-2.5 rounded-full font-semibold border border-white/40 flex items-center gap-2"
                                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.4)' }}
                                >
                                  💼 {member.current_status}
                                </motion.span>
                              )}
                            </div>

                            {/* Age Milestone Badge */}
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 rounded-full text-sm font-bold border-2 border-white/50 shadow-lg">
                                🎓 {member.qualification}
                              </div>
                              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-5 py-2 rounded-full text-sm font-bold border-2 border-white/50 shadow-lg flex items-center gap-2">
                                <Zap size={16} />
                                Birthday Star!
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Floating Decorations */}
                        <motion.div 
                          className="absolute top-4 right-4"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles size={45} className="text-yellow-300" />
                        </motion.div>
                        <motion.div 
                          className="absolute bottom-4 left-4"
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Star size={45} className="text-yellow-300 fill-yellow-300" />
                        </motion.div>
                        <motion.div 
                          className="absolute top-1/2 right-8"
                          animate={{ y: [0, -15, 0] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          <Music size={35} className="text-white/60" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Anniversary Celebrations */}
                {todayAnniversaries.map((member, index) => (
                  <motion.div
                    key={`anniversary-${member.id}`}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (todayBirthdays.length + index) * 0.2 }}
                    className="mb-8"
                  >
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                      {/* Animated Background Gradient */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-red-500 via-pink-500 to-rose-600"
                        animate={{
                          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                        }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        style={{ backgroundSize: '200% 200%' }}
                      />
                      
                      {/* Floating Hearts Background */}
                      <div className="absolute inset-0 overflow-hidden">
                        {[...Array(20)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute text-white/20"
                            initial={{ 
                              x: Math.random() * 100 + '%',
                              y: '120%',
                            }}
                            animate={{
                              y: '-20%',
                              x: `${Math.random() * 100}%`,
                            }}
                            transition={{
                              duration: Math.random() * 12 + 18,
                              repeat: Infinity,
                              delay: Math.random() * 5,
                              ease: "linear"
                            }}
                          >
                            <Heart size={i % 2 === 0 ? 35 : 25} className="fill-current" />
                          </motion.div>
                        ))}
                      </div>
                      
                      <div className="relative p-8 md:p-12 text-white">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          {/* Animated Heart Icon */}
                          <motion.div
                            animate={{ 
                              scale: [1, 1.2, 1],
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 2,
                              ease: "easeInOut"
                            }}
                            className="flex-shrink-0 relative"
                          >
                            <div className="bg-white/25 backdrop-blur-xl rounded-full p-8 shadow-2xl border-4 border-white/40">
                              <Heart size={70} className="text-white fill-white" />
                            </div>
                            <motion.div
                              animate={{ 
                                scale: [1, 1.2, 1],
                                rotate: [0, 15, -15, 0]
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute -top-2 -right-2"
                            >
                              <Sparkles size={35} className="text-yellow-300" />
                            </motion.div>
                          </motion.div>

                          <div className="flex-1 text-center md:text-left">
                            {/* Animated Title */}
                            <motion.div
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              <h2 className="text-4xl md:text-6xl font-extrabold mb-3 flex items-center justify-center md:justify-start gap-4 flex-wrap">
                                <Flame size={48} />
                                Happy Anniversary!
                                <Heart size={48} className="fill-white" />
                              </h2>
                            </motion.div>
                            
                            <motion.p 
                              className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center md:justify-start gap-3"
                              animate={{ y: [0, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              💝 {member.name} 💝
                            </motion.p>
                            
                            <div className="inline-block bg-gradient-to-r from-yellow-400 to-pink-400 text-gray-900 rounded-full px-8 py-3 mb-5 shadow-xl border-2 border-white/50">
                              <p className="text-2xl font-extrabold flex items-center gap-2">
                                <Heart size={24} className="fill-gray-900" />
                                {getYearsMarried(member.anniversary!)} Years of Love!
                                <Smile size={24} />
                              </p>
                            </div>

                            {/* Contact Info */}
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm md:text-base mb-4">
                              <motion.span 
                                className="bg-white/30 backdrop-blur-sm px-5 py-2.5 rounded-full font-semibold border border-white/40 flex items-center gap-2"
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.4)' }}
                              >
                                📧 {member.email}
                              </motion.span>
                              <motion.span 
                                className="bg-white/30 backdrop-blur-sm px-5 py-2.5 rounded-full font-semibold border border-white/40 flex items-center gap-2"
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.4)' }}
                              >
                                📱 {member.phone}
                              </motion.span>
                              {member.current_status && (
                                <motion.span 
                                  className="bg-white/30 backdrop-blur-sm px-5 py-2.5 rounded-full font-semibold border border-white/40 flex items-center gap-2"
                                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.4)' }}
                                >
                                  💼 {member.current_status}
                                </motion.span>
                              )}
                            </div>

                            {/* Anniversary Badges */}
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                              <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-2 rounded-full text-sm font-bold border-2 border-white/50 shadow-lg">
                                🎓 {member.qualification}
                              </div>
                              <div className="bg-gradient-to-r from-red-500 to-pink-500 px-5 py-2 rounded-full text-sm font-bold border-2 border-white/50 shadow-lg flex items-center gap-2">
                                <Camera size={16} />
                                Love Story!
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Floating Decorations */}
                        <motion.div 
                          className="absolute top-4 right-4"
                          animate={{ scale: [1, 1.4, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Heart size={45} className="text-white fill-white opacity-60" />
                        </motion.div>
                        <motion.div 
                          className="absolute bottom-4 left-4"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles size={45} className="text-yellow-300" />
                        </motion.div>
                        <motion.div 
                          className="absolute top-1/2 right-8"
                          animate={{ 
                            scale: [1, 1.3, 1],
                            rotate: [0, 180, 360]
                          }}
                          transition={{ duration: 4, repeat: Infinity }}
                        >
                          <Flame size={35} className="text-orange-300" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* UPCOMING CELEBRATIONS HEADER */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <motion.div
              animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ repeat: Infinity, duration: 6 }}
              className="relative inline-block mb-6"
            >
              <Sparkles className="text-purple-600" size={80} />
              <motion.div
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-2 -right-2"
              >
                <Star className="text-yellow-400 fill-yellow-400" size={30} />
              </motion.div>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-6">
              {todayBirthdays.length > 0 || todayAnniversaries.length > 0 
                ? "More Upcoming Celebrations 🎊" 
                : "Upcoming Celebrations 🎉"}
            </h1>

            <p className="text-xl text-gray-700 mb-4 max-w-2xl mx-auto font-medium">
              Love, laughter, and memories — countdown to the next beautiful moments.
            </p>
          </motion.div>

          {/* COUNTDOWN CARDS */}
          <div className="space-y-12 max-w-5xl mx-auto mb-20">
            {/* First Upcoming Birthday & Anniversary */}
            <div className="grid md:grid-cols-2 gap-10">
              <CountdownCard
                title="Next Birthday"
                subtitle="Coming Soon"
                icon={<Cake size={42} />}
                member={nextBirthday}
                countdown={birthdayCountdown}
                gradient="from-pink-500 via-purple-500 to-pink-600"
                accentColor="from-yellow-400 to-orange-400"
              />

              <CountdownCard
                title="Next Anniversary"
                subtitle="Love Celebration"
                icon={<Heart size={42} />}
                member={nextAnniversary}
                countdown={anniversaryCountdown}
                gradient="from-red-500 via-pink-500 to-rose-600"
                accentColor="from-pink-400 to-red-400"
              />
            </div>

            {/* Second Upcoming Birthday & Anniversary */}
            {(secondNextBirthday || secondNextAnniversary) && (
              <div>
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-3"
                >
                  <Sunrise size={32} className="text-orange-500" />
                  Following Celebrations
                  <Sunrise size={32} className="text-orange-500" />
                </motion.h2>
                <div className="grid md:grid-cols-2 gap-10">
                  {secondNextBirthday && (
                    <CountdownCard
                      title="Second Birthday"
                      subtitle="On the Horizon"
                      icon={<Cake size={38} />}
                      member={secondNextBirthday}
                      countdown={secondBirthdayCountdown}
                      gradient="from-cyan-500 via-blue-500 to-indigo-500"
                      accentColor="from-cyan-400 to-blue-400"
                      isSecondary
                    />
                  )}

                  {secondNextAnniversary && (
                    <CountdownCard
                      title="Second Anniversary"
                      subtitle="More Love Ahead"
                      icon={<Heart size={38} />}
                      member={secondNextAnniversary}
                      countdown={secondAnniversaryCountdown}
                      gradient="from-purple-500 via-fuchsia-500 to-pink-500"
                      accentColor="from-purple-400 to-pink-400"
                      isSecondary
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-20">
            <motion.button
              whileHover={{ scale: 1.08, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('register')}
              className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white px-12 py-5 rounded-2xl text-xl font-bold shadow-2xl overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600"
                initial={{ x: '100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative z-10 flex items-center gap-3">
                <Gift size={24} />
                Register Celebration
                <Sparkles size={24} />
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.08, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate('members')}
              className="relative border-3 border-purple-600 text-purple-600 px-12 py-5 rounded-2xl text-xl font-bold bg-white/80 backdrop-blur shadow-2xl overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                initial={{ y: '100%' }}
                whileHover={{ y: 0 }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative z-10 flex items-center gap-3 group-hover:text-white transition-colors">
                <Users size={24} />
                View Members
                <Star size={24} />
              </span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* BEAUTIFUL FOOTER */}
      <Footer 
        totalMembers={totalMembers} 
        upcomingEventsCount={upcomingEventsCount}
        onNavigate={onNavigate}
      />
    </div>
  );
}

/* ------------------ COUNTDOWN CARD COMPONENT ------------------ */
function CountdownCard({ 
  title, 
  subtitle,
  icon, 
  member, 
  countdown, 
  gradient,
  accentColor,
  isSecondary = false
}: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -10, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className={`relative rounded-3xl overflow-hidden shadow-2xl ${isSecondary ? 'opacity-90' : ''}`}
    >
      {/* Gradient Border */}
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient} p-[3px]`}>
        <div className="h-full w-full bg-white/95 backdrop-blur-xl rounded-3xl" />
      </div>

      {/* Content */}
      <div className="relative p-8 text-center">
        {/* Icon */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="mb-4 flex justify-center"
        >
          <div className={`bg-gradient-to-r ${gradient} p-4 rounded-2xl text-white shadow-xl`}>
            {icon}
          </div>
        </motion.div>

        {/* Title */}
        <h3 className="text-2xl font-extrabold mb-1 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {title}
        </h3>
        <p className="text-sm text-gray-500 font-semibold mb-4">{subtitle}</p>

        {member && countdown ? (
          <>
            {/* Member Name */}
            <div className={`inline-block bg-gradient-to-r ${accentColor} px-6 py-2 rounded-full mb-4 shadow-lg`}>
              <p className="text-lg font-bold text-white">
                {member.name}
              </p>
            </div>
            
            {/* Status */}
            {member.current_status && (
              <p className="text-sm text-gray-600 mb-5 font-medium px-4">
                {member.current_status}
              </p>
            )}

            {/* Countdown */}
            <div className="grid grid-cols-3 gap-4">
              <TimeBox label="Days" value={countdown.days} gradient={gradient} />
              <TimeBox label="Hours" value={countdown.hours} gradient={gradient} />
              <TimeBox label="Mins" value={countdown.minutes} gradient={gradient} />
            </div>
          </>
        ) : (
          <div className="py-8">
            <p className="text-gray-500 font-medium">No upcoming events</p>
          </div>
        )}
      </div>

      {/* Decorative Corner Elements */}
      <div className="absolute top-2 right-2 opacity-20">
        <Sparkles size={24} className="text-gray-600" />
      </div>
      <div className="absolute bottom-2 left-2 opacity-20">
        <Star size={24} className="text-gray-600" />
      </div>
    </motion.div>
  );
}

function TimeBox({ label, value, gradient }: { label: string; value: number; gradient: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      className={`bg-gradient-to-br ${gradient} rounded-xl p-4 shadow-lg`}
    >
      <motion.p 
        className="text-4xl font-extrabold text-white mb-1"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {value}
      </motion.p>
      <p className="text-xs text-white/90 font-semibold uppercase tracking-wider">{label}</p>
    </motion.div>
  );
}

/* ------------------ FOOTER COMPONENT ------------------ */
function Footer({ 
  totalMembers, 
  upcomingEventsCount,
  onNavigate 
}: { 
  totalMembers: number; 
  upcomingEventsCount: number;
  onNavigate: (page: 'register' | 'members' | 'privacy') => void;
}) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-br from-purple-900 via-pink-900 to-orange-900 text-white overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-10">
        <motion.div 
          className="absolute top-10 left-10"
          animate={{ scale: [1, 1.2, 1], rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity }}
        >
          <Heart size={120} className="fill-current" />
        </motion.div>
        <motion.div 
          className="absolute bottom-10 right-10"
          animate={{ scale: [1, 1.3, 1], y: [0, -20, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        >
          <Cake size={120} />
        </motion.div>
        <motion.div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles size={180} />
        </motion.div>
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Top Section - Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-12 text-center">
          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border-2 border-white/30 shadow-xl"
          >
            <Users size={48} className="mx-auto mb-3 text-cyan-300" />
            <p className="text-4xl font-extrabold mb-1">{totalMembers}</p>
            <p className="text-cyan-200 font-semibold">Family Members</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border-2 border-white/30 shadow-xl"
          >
            <Calendar size={48} className="mx-auto mb-3 text-yellow-300" />
            <p className="text-4xl font-extrabold mb-1">{upcomingEventsCount}</p>
            <p className="text-yellow-200 font-semibold">Upcoming Events (30 days)</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border-2 border-white/30 shadow-xl"
          >
            <Heart size={48} className="mx-auto mb-3 text-pink-300 fill-pink-300" />
            <p className="text-4xl font-extrabold mb-1">∞</p>
            <p className="text-pink-200 font-semibold">Celebrations Forever</p>
          </motion.div>
        </div>

        {/* Middle Section - Links & Info */}
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {/* Quick Links */}
          <div>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Sparkles size={24} />
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => onNavigate('register')}
                  className="hover:text-cyan-300 transition-colors flex items-center gap-2 font-medium text-lg"
                >
                  <Gift size={18} />
                  Register Now
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onNavigate('members')}
                  className="hover:text-cyan-300 transition-colors flex items-center gap-2 font-medium text-lg"
                >
                  <Users size={18} />
                  View Members
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Mail size={24} />
              Get in Touch
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-lg">
                <Phone size={18} className="flex-shrink-0" />
                <a href="tel:9162576850" className="hover:text-cyan-300 transition-colors font-medium">
                  9162576850
                </a>
              </li>
            </ul>
          </div>

          {/* Family Motto */}
          <div>
            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Heart size={24} className="fill-pink-300" />
              Our Motto
            </h3>
            <p className="italic text-pink-200 leading-relaxed font-medium text-lg">
              "Family is not an important thing. It's everything. We celebrate every moment together." 💝
            </p>
          </div>
        </div>

        {/* Bottom Section - Copyright */}
        <div className="border-t-2 border-white/30 pt-8 text-center">
          <p className="text-pink-200 mb-3 text-lg font-semibold">
            Made with <Heart size={18} className="inline fill-pink-300 text-pink-300 animate-pulse" /> for our amazing family
          </p>
          <p className="text-base text-pink-300 font-medium mb-4">
            © {currentYear} Family Celebrations. All rights reserved. 🎉
          </p>
          <div className="mt-4 flex justify-center gap-6 text-base">
            <button
              onClick={() => onNavigate('privacy')}
              className="hover:text-cyan-300 transition-colors font-semibold underline hover:no-underline"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>
    </footer>
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
