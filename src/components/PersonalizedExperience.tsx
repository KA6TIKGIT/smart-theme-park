'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  MapPin, 
  Zap, 
  Flame, 
  ShieldAlert, 
  CheckCircle, 
  Ticket, 
  CreditCard, 
  RefreshCw, 
  Search,
  Star,
  Users,
  Compass,
  PartyPopper,
  Info,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { UserRole } from '@/lib/auth';

interface Attraction {
  attraction_id: number;
  name: string;
  description: string;
  thrill_level: string;
  min_height_cm: number;
  hourly_capacity: number;
  current_wait_time: number;
  status: string;
  fastpass_available: boolean;
  rating: number;
  zone_id: number;
  zone_name: string;
}

interface PersonalizedExperienceProps {
  currentRole: UserRole;
  userWallet: number;
  onRefreshWallet: () => void;
}

export const PersonalizedExperience: React.FC<PersonalizedExperienceProps> = ({
  currentRole,
  userWallet,
  onRefreshWallet,
}) => {
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedThrill, setSelectedThrill] = useState('ALL');

  // Vector Search State
  const [vibeQuery, setVibeQuery] = useState('');
  const [vectorResults, setVectorResults] = useState<any[] | null>(null);
  const [vectorLoading, setVectorLoading] = useState(false);
  const [showVectorTechDetails, setShowVectorTechDetails] = useState(false);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState(2); // Default to VIP FastPass Plus
  const [ticketCount, setTicketCount] = useState(2);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // FastPass State
  const [fastpassMsg, setFastpassMsg] = useState<{ id: number; text: string; success: boolean } | null>(null);

  // Visitor Tickets & Bookings
  const [myBookings, setMyBookings] = useState<any[]>([]);

  useEffect(() => {
    fetchAttractions();
    fetchMyBookings();
  }, [selectedZone, selectedThrill]);

  const fetchAttractions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attractions?zoneId=${selectedZone}&thrill=${selectedThrill}`);
      const json = await res.json();
      if (json.success) setAttractions(json.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    try {
      const res = await fetch('/api/bookings?userId=4');
      const json = await res.json();
      if (json.success) setMyBookings(json.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVectorSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const queryToRun = customQuery || vibeQuery;
    if (!queryToRun.trim()) return;

    setVectorLoading(true);
    try {
      const res = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryToRun,
          preferredThrill: selectedThrill !== 'ALL' ? selectedThrill : undefined,
          limit: 4,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setVectorResults(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVectorLoading(false);
    }
  };

  const handleBookTickets = async () => {
    setBookingSubmitting(true);
    setBookingError(null);
    setBookingSuccess(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 4,
          tierId: selectedTierId,
          ticketCount,
          bookingDate: new Date().toISOString().split('T')[0],
        }),
      });
      const json = await res.json();
      if (json.success) {
        setBookingSuccess(json);
        onRefreshWallet();
        fetchMyBookings();
      } else {
        setBookingError(json.error || 'Failed to complete transaction');
      }
    } catch (err: any) {
      setBookingError(err.message);
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleReserveFastPass = async (attractionId: number) => {
    setFastpassMsg(null);
    try {
      const res = await fetch('/api/fastpass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: 1, // Alex Johnson's active VIP ticket
          attractionId,
          slotStart: new Date(Date.now() + 30 * 60000).toISOString(),
          slotEnd: new Date(Date.now() + 60 * 60000).toISOString(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setFastpassMsg({ id: attractionId, text: json.message, success: true });
      } else {
        setFastpassMsg({ id: attractionId, text: json.error, success: false });
      }
    } catch (err: any) {
      setFastpassMsg({ id: attractionId, text: err.message, success: false });
    }
  };

  const tierDetails: Record<number, { name: string; price: number; icon: string; perk: string; badgeColor: string }> = {
    1: { name: 'Standard Day Pass', price: 59.99, icon: '🎟️', perk: 'Full day access to all 4 realms', badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    2: { name: 'VIP FastPass Plus', price: 119.99, icon: '⚡', perk: 'Skip ride queues all day + priority seats', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    3: { name: 'Season Elite Pass', price: 249.99, icon: '👑', perk: 'Unlimited year access + free snacks & gifts', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    4: { name: 'Junior Explorer Pass', price: 39.99, icon: '🎈', perk: 'Kids under 12 & gentle family rides', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  };

  // Helper for zone badge styles & emojis
  const getZoneMeta = (zoneId: number) => {
    switch (zoneId) {
      case 1:
        return { emoji: '🎪', color: 'from-amber-500 to-orange-500', text: 'text-amber-300', bg: 'bg-amber-500/15 border-amber-500/30' };
      case 2:
        return { emoji: '🚀', color: 'from-cyan-500 to-blue-600', text: 'text-cyan-300', bg: 'bg-cyan-500/15 border-cyan-500/30' };
      case 3:
        return { emoji: '🦖', color: 'from-emerald-500 to-teal-600', text: 'text-emerald-300', bg: 'bg-emerald-500/15 border-emerald-500/30' };
      case 4:
        return { emoji: '🏰', color: 'from-fuchsia-500 to-purple-600', text: 'text-fuchsia-300', bg: 'bg-fuchsia-500/15 border-fuchsia-500/30' };
      default:
        return { emoji: '✨', color: 'from-purple-500 to-rose-500', text: 'text-purple-300', bg: 'bg-purple-500/15 border-purple-500/30' };
    }
  };

  // Helper for thrill icons
  const getThrillBadge = (thrill: string) => {
    switch (thrill) {
      case 'EXTREME':
        return { label: 'Extreme Thrill', emoji: '🔥', style: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'HIGH':
        return { label: 'High Thrill', emoji: '⚡', style: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'MODERATE':
        return { label: 'Moderate', emoji: '🎈', style: 'bg-sky-500/20 text-sky-300 border-sky-500/40' };
      default:
        return { label: 'Gentle Family', emoji: '🍦', style: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    }
  };

  return (
    <div className="space-y-10">
      
      {/* 🎪 Playful Hero: The Magic Genie AI Mood Matcher */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950 via-[#161233] to-slate-950 border-2 border-purple-600/40 p-6 sm:p-8 md:p-10 shadow-2xl shadow-purple-950/40">
        
        {/* Festive Background Decorations */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-gradient-to-br from-amber-400/15 via-rose-500/15 to-purple-500/15 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-4xl">
          
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/25 to-rose-500/25 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-4 shadow-sm animate-pulse-glow">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI Magic Genie • Semantic Vector Recommender</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            What Kind of Theme Park Thrill Are You Craving Today?
          </h1>
          
          <p className="mt-3 text-purple-200 text-sm sm:text-base leading-relaxed max-w-2xl">
            Tell our Magic Genie what mood, speed, or sensory wonder you want! Powered by real-time <span className="text-amber-300 font-bold">PostgreSQL pgvector</span> cosine distance embeddings matching 8 world-class attractions.
          </p>

          {/* Playful Interactive Mood Bubbles */}
          <div className="mt-6">
            <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5 mb-2.5">
              <span>🎯</span> Click a Mood or Type Below:
            </span>
            <div className="flex flex-wrap gap-2.5">
              {[
                { label: 'Extreme Coaster with Fast Launch! 🎢', prompt: 'Extreme roller coaster with fast launch and high adrenaline' },
                { label: 'Soak Me on a Wild Water Plunge! 🌊', prompt: 'Sub-zero water coaster where you get completely soaked' },
                { label: 'Futuristic Cyber Dark Ride & Lasers! 🚀', prompt: 'Futuristic 4D cyberspace indoor dark ride with lasers' },
                { label: 'Calm Glowing Fairy Tale Boat Cruise 🧚', prompt: 'Calm gentle fairy-tale boat cruise with glowing lights' },
                { label: 'T-Rex Prehistoric Rapids Chase! 🦖', prompt: 'Dinosaur river rapid raft escape encounter with T-Rex' },
              ].map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => {
                    setVibeQuery(chip.prompt);
                    handleVectorSearch(undefined, chip.prompt);
                  }}
                  className="bg-purple-900/40 hover:bg-gradient-to-r hover:from-amber-500 hover:to-rose-500 text-purple-100 hover:text-white border border-purple-500/40 hover:border-transparent px-3.5 py-2 rounded-2xl transition-all duration-200 text-xs font-bold shadow-md hover:scale-105 active:scale-95"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Input Box */}
          <form onSubmit={handleVectorSearch} className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={vibeQuery}
                onChange={(e) => setVibeQuery(e.target.value)}
                placeholder="e.g. 'Crazy high-speed coaster with drops' or 'Gentle scenic boat ride for toddlers'..."
                className="w-full bg-slate-950/90 border-2 border-purple-500/50 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 shadow-inner"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none">✨</span>
            </div>
            
            <button
              type="submit"
              disabled={vectorLoading}
              className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-95 text-white font-black px-7 py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-rose-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {vectorLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Casting Spell...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Find My Vibe!</span>
                </>
              )}
            </button>
          </form>

        </div>

        {/* Vector Results Showcase */}
        {vectorResults && (
          <div className="mt-8 pt-6 border-t border-purple-800/60">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎉</span>
                <h3 className="text-base sm:text-lg font-black text-amber-300">
                  Magic Genie Top Matches For You!
                </h3>
                <span className="text-xs bg-amber-400/20 text-amber-200 border border-amber-400/40 px-2.5 py-0.5 rounded-full font-bold">
                  {vectorResults.length} Attractions Found
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowVectorTechDetails(!showVectorTechDetails)}
                  className="text-xs text-purple-300 hover:text-white flex items-center gap-1 font-semibold underline underline-offset-4"
                >
                  <Info className="w-3.5 h-3.5" />
                  {showVectorTechDetails ? 'Hide pgvector Math' : 'Show pgvector Match Math'}
                </button>
                <button
                  onClick={() => setVectorResults(null)}
                  className="text-xs bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1 rounded-xl border border-purple-800"
                >
                  ✕ Clear
                </button>
              </div>
            </div>

            {/* Optional Technical Architecture Drawer */}
            {showVectorTechDetails && (
              <div className="mb-5 p-3.5 bg-slate-950/90 border border-purple-700/60 rounded-2xl text-xs text-purple-200 font-mono space-y-1">
                <div className="text-amber-400 font-bold">⚡ DBMS Level 3 Evaluation Insight:</div>
                <div>Algorithm: PostgreSQL pgvector cosine distance operator (<span className="text-emerald-400">&lt;=&gt;</span>)</div>
                <div>Dimensions: 384-dimensional dense semantic embedding vectors</div>
                <div>SQL: <span className="text-slate-400">SELECT name, 1 - (embedding &lt;=&gt; $query) AS similarity FROM attractions ORDER BY embedding &lt;=&gt; $query LIMIT 4</span></div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vectorResults.map((item, idx) => {
                const zoneMeta = getZoneMeta(item.zone_id);
                const thrillBadge = getThrillBadge(item.thrill_level);
                const matchPct = Math.round((item.similarity_score || 0.88) * 100);

                return (
                  <div
                    key={item.attraction_id}
                    className="relative bg-gradient-to-br from-slate-900/90 to-purple-950/70 border-2 border-purple-500/40 hover:border-amber-400/80 rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] shadow-xl group"
                  >
                    {/* Top Medal for #1 match */}
                    {idx === 0 && (
                      <span className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[11px] px-3 py-0.5 rounded-full shadow-md flex items-center gap-1 animate-bounce">
                        👑 Best Match
                      </span>
                    )}

                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${zoneMeta.bg} ${zoneMeta.text}`}>
                            <span>{zoneMeta.emoji}</span>
                            <span>{item.zone_name}</span>
                          </span>
                          <h4 className="font-black text-lg text-white mt-1 group-hover:text-amber-300 transition-colors">
                            {item.name}
                          </h4>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500/20 to-rose-500/20 text-amber-300 border border-amber-400/50 flex items-center gap-1 shadow-sm">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            {matchPct}% Vibe Match
                          </span>
                        </div>
                      </div>

                      <p className="mt-2.5 text-xs text-purple-200/90 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>

                      {item.match_reasons && item.match_reasons.length > 0 && (
                        <div className="mt-2.5 text-[11px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-600/50 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                          <span>✨</span> {item.match_reasons[0]}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-purple-800/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 font-black text-white bg-slate-950/80 px-2.5 py-1 rounded-lg border border-purple-900">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          {item.current_wait_time} min wait
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${thrillBadge.style}`}>
                          {thrillBadge.emoji} {thrillBadge.label}
                        </span>
                      </div>

                      <button
                        onClick={() => handleReserveFastPass(item.attraction_id)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-black text-xs transition-all shadow-md shadow-rose-500/20 flex items-center gap-1 hover:scale-105 active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
                        <span>Grab FastPass</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 🎟️ Visitor Admission Strip & Golden Ticket Booth Callout */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 p-1 shadow-2xl">
        <div className="bg-[#11162a] rounded-[22px] p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-rose-500 flex items-center justify-center text-3xl shadow-lg shadow-rose-500/30 shrink-0">
              🎟️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">Guest Explorer Account</span>
                <span className="bg-amber-400/20 text-amber-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-400/40">VIP PASS ACTIVE</span>
              </div>
              <div className="text-xl font-black text-white mt-0.5">Alex Johnson</div>
              <div className="text-xs text-purple-200 flex items-center gap-2 mt-1">
                <span>Park Wallet Balance:</span>
                <span className="text-emerald-300 font-black text-sm bg-slate-900 px-2.5 py-0.5 rounded-lg border border-purple-800 flex items-center gap-1">
                  <span>💰</span> ${userWallet.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => setBookingModalOpen(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Ticket className="w-4 h-4 text-slate-950" />
              <span>Step Up to Ticket Booth (Book Passes)</span>
            </button>
          </div>

        </div>
      </div>

      {/* FastPass Status Toast Notification */}
      {fastpassMsg && (
        <div className={`p-4 rounded-2xl border-2 text-xs font-bold flex items-center justify-between shadow-xl animate-fade-in ${
          fastpassMsg.success
            ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
            : 'bg-rose-950/90 border-rose-500 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">{fastpassMsg.success ? '🎉' : '⚠️'}</span>
            <span>{fastpassMsg.text}</span>
          </div>
          <button 
            onClick={() => setFastpassMsg(null)} 
            className="underline ml-4 text-[11px] hover:text-white font-extrabold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 🎡 Attractions Fairway: Live Queues & Realm Filters */}
      <section className="space-y-6">
        
        {/* Section Heading & Filter Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-extrabold uppercase tracking-wider mb-2">
              <span>🎡</span> Live Park Fairway
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Theme Park Attractions & Live Queues
            </h2>
            <p className="text-xs sm:text-sm text-purple-300">
              Synced with turnstiles & ride sensors • Real-time queue wait estimates
            </p>
          </div>

          {/* Realm / Zone Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'All Realms', emoji: '🌟' },
              { id: '1', label: 'Main Adventure Blvd', emoji: '🎪' },
              { id: '2', label: 'Cyberpunk Metropolis', emoji: '🚀' },
              { id: '3', label: 'Jurassic Lagoon', emoji: '🦖' },
              { id: '4', label: 'Mythic Woods', emoji: '🏰' },
            ].map((z) => (
              <button
                key={z.id}
                onClick={() => setSelectedZone(z.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  selectedZone === z.id
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-md shadow-rose-500/25 scale-105'
                    : 'bg-slate-900/80 text-purple-200 hover:text-white hover:bg-slate-800 border border-purple-900/60'
                }`}
              >
                <span>{z.emoji}</span>
                <span>{z.label}</span>
              </button>
            ))}

            {/* Thrill Level Dropdown */}
            <select
              value={selectedThrill}
              onChange={(e) => setSelectedThrill(e.target.value)}
              className="bg-slate-900 text-amber-300 text-xs font-bold rounded-xl px-3 py-1.5 border border-purple-800 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="ALL">💥 All Thrill Levels</option>
              <option value="EXTREME">🔥 Extreme Thrill</option>
              <option value="HIGH">⚡ High Thrill</option>
              <option value="MODERATE">🎈 Moderate</option>
              <option value="LOW">🍦 Gentle / Family</option>
            </select>

            <button
              onClick={fetchAttractions}
              className="p-2 rounded-xl bg-slate-900 text-purple-200 hover:text-white border border-purple-800 hover:bg-slate-800 transition-colors"
              title="Refresh Queue Times"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Attractions Grid */}
        {loading ? (
          <div className="p-16 text-center text-purple-300 text-sm bg-slate-900/60 rounded-3xl border border-purple-900/40">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-400" />
            <div className="font-extrabold text-base text-white">Connecting to Theme Park Queue Sensor Feeds...</div>
            <div className="text-xs text-purple-300 mt-1">Retrieving live wait times & FastPass availability</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {attractions.map((attr) => {
              const isMaintenance = attr.status === 'MAINTENANCE';
              const wait = attr.current_wait_time;
              const zoneMeta = getZoneMeta(attr.zone_id);
              const thrillBadge = getThrillBadge(attr.thrill_level);

              return (
                <div
                  key={attr.attraction_id}
                  className={`relative rounded-3xl border-2 p-6 flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] shadow-xl ${
                    isMaintenance
                      ? 'border-rose-900/60 bg-gradient-to-b from-slate-950 to-rose-950/20'
                      : 'border-purple-800/40 hover:border-amber-400/80 bg-gradient-to-b from-slate-900/90 to-[#12162c] shadow-purple-950/20'
                  }`}
                >
                  <div>
                    {/* Zone & Operational Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${zoneMeta.bg} ${zoneMeta.text}`}>
                        <span>{zoneMeta.emoji}</span>
                        <span>{attr.zone_name}</span>
                      </span>

                      {isMaintenance ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1 animate-pulse">
                          <ShieldAlert className="w-3 h-3" /> Pit Stop Maintenance
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Open for Rides
                        </span>
                      )}
                    </div>

                    {/* Ride Title & Rating */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-black text-white leading-tight">
                        {attr.name}
                      </h3>
                      <div className="flex items-center gap-1 text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 text-xs font-black shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{Number(attr.rating || 4.8).toFixed(1)}</span>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-purple-200/90 leading-relaxed line-clamp-3">
                      {attr.description}
                    </p>
                  </div>

                  {/* Bottom Stats & Action */}
                  <div className="mt-5 pt-4 border-t border-purple-900/60 space-y-3.5">
                    
                    {/* Stats Strip */}
                    <div className="flex items-center justify-between text-xs">
                      
                      {/* Wait Time Indicator */}
                      <div className="flex items-center gap-1.5">
                        <Clock className={`w-4 h-4 ${
                          isMaintenance 
                            ? 'text-slate-500' 
                            : wait > 30 
                              ? 'text-rose-400' 
                              : wait > 15 
                                ? 'text-amber-400' 
                                : 'text-emerald-400'
                        }`} />
                        <span className={`font-black ${
                          isMaintenance 
                            ? 'text-slate-500' 
                            : wait > 30 
                              ? 'text-rose-300' 
                              : wait > 15 
                                ? 'text-amber-300' 
                                : 'text-emerald-300'
                        }`}>
                          {isMaintenance ? 'Closed' : `${wait} min queue`}
                        </span>
                      </div>

                      {/* Thrill Badge */}
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black border ${thrillBadge.style}`}>
                        {thrillBadge.emoji} {thrillBadge.label}
                      </span>

                      {/* Height Limit */}
                      <span className="text-[11px] text-purple-300 font-semibold">
                        {attr.min_height_cm > 0 ? `📏 ${attr.min_height_cm}cm` : '👶 All ages'}
                      </span>
                    </div>

                    {/* Book FastPass Button */}
                    <button
                      onClick={() => handleReserveFastPass(attr.attraction_id)}
                      disabled={isMaintenance || !attr.fastpass_available}
                      className={`w-full py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                        isMaintenance || !attr.fastpass_available
                          ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-90 text-white shadow-lg shadow-rose-500/25 hover:scale-105 active:scale-95'
                      }`}
                    >
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>{isMaintenance ? 'Ride in Maintenance' : 'Skip the Queue (Book FastPass)'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 🎟️ Active Guest Passes: "My Souvenir Pass Wallet" */}
      {myBookings && myBookings.length > 0 && (
        <section className="bg-gradient-to-br from-slate-900 via-[#131731] to-purple-950/60 border-2 border-purple-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-extrabold uppercase tracking-wider mb-1.5">
                <span>🎟️</span> My Souvenir Pass Wallet
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">Your Confirmed Theme Park Passes</h3>
              <p className="text-xs text-purple-300">Ready to tap at turnstiles and expedited FastPass lanes</p>
            </div>
            
            <span className="text-xs font-black px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {myBookings.length} Active Booking Orders
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {myBookings.map((b) => (
              <div 
                key={b.booking_id} 
                className="ticket-left-notch ticket-right-notch bg-gradient-to-r from-slate-950 to-purple-950/80 border-2 border-dashed border-amber-400/50 rounded-2xl p-5 shadow-xl space-y-3 relative overflow-hidden"
              >
                {/* Holographic Watermark Badge */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎡</span>
                    <div>
                      <span className="font-mono text-amber-300 font-black text-sm">{b.booking_reference}</span>
                      <div className="text-[10px] text-purple-300">Date: {b.booking_date?.split('T')[0] || b.booking_date}</div>
                    </div>
                  </div>

                  <span className="text-emerald-300 font-black text-xs bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-600/60 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    {b.payment_status} (${b.total_amount})
                  </span>
                </div>

                {/* Tickets in Booking */}
                {b.tickets && b.tickets.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-dashed border-purple-700/50 space-y-2">
                    {b.tickets.map((t: any) => (
                      <div 
                        key={t.ticket_code} 
                        className="flex items-center justify-between bg-slate-900/90 px-3.5 py-2 rounded-xl text-xs border border-purple-800/60"
                      >
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-purple-300">🏷️</span>
                          <span className="font-black text-white text-[11px]">{t.ticket_code}</span>
                        </div>
                        <span className="text-amber-300 font-black">{t.tier_name}</span>
                        <span className="text-emerald-400 font-bold text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 🎪 Golden Admission Ticket Booth Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative bg-gradient-to-b from-[#151933] to-[#0d1022] border-2 border-amber-400/80 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-black uppercase tracking-wider mb-1">
                  <span>🎟️</span> Royal Ticket Booth
                </div>
                <h3 className="text-2xl font-black text-white">Purchase Admission Passes</h3>
                <p className="text-xs text-purple-300">Atomic ACID Transaction executed via PostgreSQL Stored Procedure</p>
              </div>

              <button
                onClick={() => setBookingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-purple-200 hover:text-white flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-5 bg-gradient-to-br from-emerald-950 to-slate-900 border-2 border-emerald-500 rounded-2xl space-y-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
                  🎉
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">Hooray! Passes Confirmed!</h4>
                  <p className="text-xs text-emerald-300 mt-0.5">ACID Stored Procedure sp_book_tickets executed successfully</p>
                </div>

                <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-800 text-xs font-mono text-left space-y-1 text-purple-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order Reference:</span>
                    <span className="font-bold text-amber-300">{bookingSuccess.data.out_reference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount Deducted:</span>
                    <span className="font-bold text-emerald-300">${bookingSuccess.data.out_total_price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold text-white">{bookingSuccess.data.out_status}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setBookingSuccess(null);
                    setBookingModalOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-3 rounded-2xl text-sm shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105"
                >
                  View My Passes In Wallet
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                
                {bookingError && (
                  <div className="p-3 bg-rose-950/90 border border-rose-600 rounded-xl text-rose-200 text-xs font-bold">
                    ⚠️ {bookingError}
                  </div>
                )}

                {/* Admission Tiers */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-amber-300 mb-2">
                    1. Select Admission Pass Tier
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { id: 1, name: 'Standard Day Pass', price: 59.99, icon: '🎟️', perk: 'Full day access' },
                      { id: 2, name: 'VIP FastPass Plus', price: 119.99, icon: '⚡', perk: 'Queue skip priority' },
                      { id: 3, name: 'Season Elite Pass', price: 249.99, icon: '👑', perk: 'VIP lounges & perks' },
                      { id: 4, name: 'Junior Explorer', price: 39.99, icon: '🎈', perk: 'Kids & family rides' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTierId(t.id)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all ${
                          selectedTierId === t.id
                            ? 'bg-gradient-to-br from-amber-500/20 to-purple-600/30 border-amber-400 text-white shadow-lg scale-102'
                            : 'bg-slate-950/60 border-purple-900/60 text-purple-200 hover:border-purple-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-base">{t.icon}</span>
                          <span className="text-sm font-black text-amber-300">${t.price}</span>
                        </div>
                        <div className="text-xs font-extrabold text-white mt-1 leading-tight">{t.name}</div>
                        <div className="text-[10px] text-purple-300 mt-0.5">{t.perk}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-amber-300 mb-1.5">
                    2. Number of Explorer Passes
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                      className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-lg flex items-center justify-center border border-purple-800 active:scale-95"
                    >
                      -
                    </button>
                    <span className="font-mono text-lg font-black text-white px-2">{ticketCount}</span>
                    <button
                      type="button"
                      onClick={() => setTicketCount(Math.min(10, ticketCount + 1))}
                      className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-lg flex items-center justify-center border border-purple-800 active:scale-95"
                    >
                      +
                    </button>
                    <span className="text-xs text-purple-300 ml-2">
                      ({tierDetails[selectedTierId]?.name})
                    </span>
                  </div>
                </div>

                {/* Checkout Summary Box */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-purple-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-purple-300">Total Admission: </span>
                    <span className="font-black text-lg text-amber-300 ml-1">
                      ${(tierDetails[selectedTierId]?.price * ticketCount).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-300">Wallet: </span>
                    <span className="font-black text-emerald-300 ml-1">${userWallet.toFixed(2)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingModalOpen(false)}
                    className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-purple-200 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={bookingSubmitting}
                    onClick={handleBookTickets}
                    className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-purple-600 hover:opacity-90 text-white font-black text-xs shadow-xl shadow-rose-500/25 flex items-center justify-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {bookingSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Deducting & Issuing...</span>
                      </>
                    ) : (
                      <>
                        <Ticket className="w-4 h-4" />
                        <span>Confirm & Issue Tickets</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
