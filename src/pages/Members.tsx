import { useState, useEffect } from 'react';
import { Search, Users, Loader, Sparkles } from 'lucide-react';
import { supabase, Member } from '../lib/supabase';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-maroon-50 via-white to-maroon-100">
        <div className="text-center">
          <Loader className="animate-spin text-maroon-800 mx-auto mb-4" size={48} />
          <p className="text-maroon-700 font-medium">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-maroon-50 via-white to-maroon-100 py-10 px-4">
      <div className="container mx-auto max-w-7xl">

        {/* 🎉 Today Banner */}
        {todayCelebrations.length > 0 && (
          <div className="mb-10 bg-gradient-to-r from-maroon-800 to-maroon-600 text-white rounded-3xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles size={28} />
              <h2 className="text-2xl font-bold">
                Today’s Celebrations
              </h2>
            </div>

            <div className="flex flex-wrap gap-3">
              {todayCelebrations.map((m) => (
                <span
                  key={m.id}
                  className="bg-white/15 px-4 py-2 rounded-full font-semibold backdrop-blur-sm"
                >
                  🎉 {m.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-maroon-800 flex items-center gap-3">
                <Users />
                Community Members
              </h1>
              <p className="text-maroon-600 mt-2">
                A beautiful list of people celebrating together
              </p>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-maroon-400" size={18} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                className="w-full pl-12 pr-4 py-3 border-2 border-maroon-200 rounded-xl focus:border-maroon-700 focus:outline-none"
              />
            </div>
          </div>

          <p className="mt-6 text-maroon-700 font-medium">
            Total Members: <span className="font-bold">{filteredMembers.length}</span>
          </p>
        </div>

        {/* Members Grid */}
        {filteredMembers.length === 0 ? (
          <div className="bg-white rounded-3xl p-14 text-center shadow-xl">
            <p className="text-maroon-600 text-lg">
              No members found.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMembers.map((member) => (
              <div
  key={member.id}
  className="group bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-maroon-100"
>
  {/* Header */}
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-2xl font-bold text-maroon-800">
      {member.name}
    </h3>

    {(isTodayBirthday(member.dob) ||
      isTodayAnniversary(member.anniversary)) && (
      <span className="text-2xl animate-bounce">🎉</span>
    )}
  </div>

  {/* Info Section */}
  <div className="space-y-3 text-sm text-maroon-700">

    <div className="flex justify-between border-b border-maroon-100 pb-2">
      <span className="font-semibold">📧 Email</span>
      <span className="text-right break-words max-w-[60%]">
        {member.email}
      </span>
    </div>

    <div className="flex justify-between border-b border-maroon-100 pb-2">
      <span className="font-semibold">📱 Phone</span>
      <span>{member.phone || "Not Provided"}</span>
    </div>

    <div className="flex justify-between border-b border-maroon-100 pb-2">
      <span className="font-semibold">🎓 Qualification</span>
      <span>{member.qualification || "Not Provided"}</span>
    </div>

    <div className="flex justify-between">
      <span className="font-semibold">💼 Current Status</span>
      <span className="text-right max-w-[60%]">
        {member.current_status || "Not Provided"}
      </span>
    </div>

  </div>

  {/* Joined */}
  <div className="mt-6 text-xs text-maroon-500">
    Joined on{" "}
    {new Date(member.created_at).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}
  </div>

  {/* Hover Line */}
  <div className="mt-6 h-1 w-full bg-maroon-100 rounded-full overflow-hidden">
    <div className="h-full w-1/3 bg-maroon-600 rounded-full group-hover:w-full transition-all duration-500"></div>
  </div>
</div>

            ))}
          </div>
        )}
      </div>
    </div>
  );
}
