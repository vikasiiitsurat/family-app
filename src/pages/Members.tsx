import { useState, useEffect } from 'react';
import { Search, Cake, Heart, Calendar, MessageCircle, Loader } from 'lucide-react';
import { supabase, Member } from '../lib/supabase';
import {
  isTodayBirthday,
  isTodayAnniversary,
  getDaysUntilBirthday,
  formatDate,
  getAge,
} from '../lib/dateUtils';

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'upcoming'>('name');
  const [loading, setLoading] = useState(true);
  const [todayCelebrations, setTodayCelebrations] = useState<Member[]>([]);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    filterAndSortMembers();
  }, [members, searchQuery, sortBy]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMembers(data || []);

      const celebrations = (data || []).filter(
        (member) => isTodayBirthday(member.dob) || isTodayAnniversary(member.anniversary)
      );
      setTodayCelebrations(celebrations);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortMembers = () => {
    let filtered = members.filter((member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === 'upcoming') {
      filtered = filtered.sort(
        (a, b) => getDaysUntilBirthday(a.dob) - getDaysUntilBirthday(b.dob)
      );
    } else {
      filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    setFilteredMembers(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-maroon-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-maroon-800 mx-auto mb-4" size={48} />
          <p className="text-gray-600 text-lg">Loading members...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-maroon-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        {todayCelebrations.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-maroon-800 to-maroon-600 text-white rounded-2xl shadow-2xl p-6 md:p-8 animate-fadeIn animate-glow">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-3">
              <Cake size={32} />
              Today's Celebrations!
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayCelebrations.map((member) => (
                <div
                  key={member.id}
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4"
                >
                  <p className="font-semibold text-lg">{member.name}</p>
                  <p className="text-sm">
                    {isTodayBirthday(member.dob) && `🎂 Birthday - ${getAge(member.dob)} years old!`}
                    {isTodayAnniversary(member.anniversary) && '💕 Anniversary!'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 animate-fadeIn">
          <h1 className="text-3xl md:text-4xl font-bold text-maroon-800 mb-6">
            Community Members
          </h1>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:border-maroon-800 focus:outline-none transition-colors"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'upcoming')}
              className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-maroon-800 focus:outline-none transition-colors"
            >
              <option value="name">Sort by Name</option>
              <option value="upcoming">Sort by Upcoming Birthday</option>
            </select>
          </div>

          <p className="text-gray-600 mb-4">
            Total Members: <span className="font-semibold text-maroon-800">{filteredMembers.length}</span>
          </p>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <p className="text-gray-600 text-lg">
              {searchQuery ? 'No members found matching your search.' : 'No members registered yet.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 p-6 animate-fadeIn"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{member.name}</h3>
                  {(isTodayBirthday(member.dob) || isTodayAnniversary(member.anniversary)) && (
                    <span className="text-2xl">🎉</span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Cake size={18} className="text-maroon-800" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold">Birthday</p>
                      <p className="text-sm">{formatDate(member.dob)}</p>
                      <p className="text-xs text-maroon-800 font-semibold">
                        {isTodayBirthday(member.dob)
                          ? `🎂 Today! (${getAge(member.dob)} years old)`
                          : `in ${getDaysUntilBirthday(member.dob)} days`}
                      </p>
                    </div>
                  </div>

                  {member.anniversary && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Heart size={18} className="text-maroon-800" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold">Anniversary</p>
                        <p className="text-sm">{formatDate(member.anniversary)}</p>
                        {isTodayAnniversary(member.anniversary) && (
                          <p className="text-xs text-maroon-800 font-semibold">💕 Today!</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={18} className="text-maroon-800" />
                    <div className="flex-1">
                      <p className="text-sm">
                        Joined {new Date(member.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {member.message && (
                    <div className="flex items-start gap-2 text-gray-600 pt-3 border-t">
                      <MessageCircle size={18} className="text-maroon-800 mt-1 flex-shrink-0" />
                      <p className="text-sm italic">{member.message}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
