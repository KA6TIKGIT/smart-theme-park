'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, MapPin, Zap, Flame, ShieldAlert, CheckCircle, Ticket, CreditCard, ChevronRight, RefreshCw } from 'lucide-react';
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

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState(1);
  const [ticketCount, setTicketCount] = useState(1);
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

  const tierPrices: Record<number, number> = { 1: 59.99, 2: 119.99, 3: 249.99, 4: 39.99 };

  return (
    <div className="space-y-8">
      
      {/* Hero & Personalized AI Vector Vibe Finder */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-900/40 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Vector Database & AI Recommendation Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Personalized Theme Park Experience Engine
          </h1>
          <p className="mt-2 text-slate-300 text-sm md:text-base leading-relaxed">
            Search naturally by mood, adrenaline level, or sensory elements. Our PostgreSQL <span className="text-indigo-400 font-mono">pgvector</span> engine matches your query vector against attraction embeddings in real-time using cosine distance.
          </p>

          {/* Natural Language Vector Query Input */}
          <form onSubmit={handleVectorSearch} className="mt-5 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={vibeQuery}
                onChange={(e) => setVibeQuery(e.target.value)}
                placeholder="e.g. 'Crazy high-speed coaster with steep drops and loops' or 'Gentle scenic boat ride for family'..."
                className="w-full bg-slate-950/80 border border-indigo-800/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              disabled={vectorLoading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {vectorLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Find My Vibe
            </button>
          </form>

          {/* Quick Prompts Chips */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Try:</span>
            {[
              'Extreme roller coaster with fast launch and high adrenaline',
              'Sub-zero water coaster where you get completely soaked',
              'Futuristic 4D cyberspace indoor dark ride with lasers',
              'Calm gentle fairy-tale boat cruise with glowing lights',
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setVibeQuery(chip);
                  handleVectorSearch(undefined, chip);
                }}
                className="bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg transition-all text-[11px]"
              >
                &ldquo;{chip}&rdquo;
              </button>
            ))}
          </div>
        </div>

        {/* Vector Results Showcase */}
        {vectorResults && (
          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Top Semantic Vector Matches (pgvector Cosine Search)
              </h3>
              <button
                onClick={() => setVectorResults(null)}
                className="text-xs text-slate-400 hover:text-white"
              >
                Clear Results
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vectorResults.map((item) => (
                <div
                  key={item.attraction_id}
                  className="bg-slate-950/70 border border-indigo-900/60 rounded-2xl p-4 flex flex-col justify-between hover:border-indigo-500/50 transition-all shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold text-indigo-400">{item.zone_name}</span>
                        <h4 className="font-extrabold text-base text-white">{item.name}</h4>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {Math.round((item.similarity_score || 0.85) * 100)}% Match
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Cosine Similarity</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-300 line-clamp-2">{item.description}</p>
                    {item.match_reasons && item.match_reasons.length > 0 && (
                      <div className="mt-2 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 rounded-lg p-2">
                        ✨ {item.match_reasons[0]}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-slate-400">
                      <span className="flex items-center gap-1 font-semibold text-white">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {item.current_wait_time} min wait
                      </span>
                      <span className="capitalize text-slate-400 font-medium">{item.thrill_level.toLowerCase()} thrill</span>
                    </div>
                    <button
                      onClick={() => handleReserveFastPass(item.attraction_id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md"
                    >
                      Reserve FastPass
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Visitor Action Strip: Book Admission & Check Wallet */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-2xl gap-4 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Active Visitor Account</div>
            <div className="text-base font-extrabold text-white">Alex Johnson (VIP Explorer)</div>
            <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <span>Park Wallet Balance:</span>
              <span className="text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">${userWallet.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setBookingModalOpen(true)}
          className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
        >
          <CreditCard className="w-4 h-4" />
          Book Admission Tickets (ACID Transaction)
        </button>
      </div>

      {/* FastPass Status Toast */}
      {fastpassMsg && (
        <div className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between ${
          fastpassMsg.success
            ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
            : 'bg-rose-950/80 border-rose-700 text-rose-200'
        }`}>
          <span>{fastpassMsg.text}</span>
          <button onClick={() => setFastpassMsg(null)} className="underline ml-4 text-[11px]">Dismiss</button>
        </div>
      )}

      {/* Attractions Catalog with Live Wait Times & Filters */}
      <section className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Park Attractions & Live Queues</h2>
            <p className="text-xs text-slate-400">Real-time status synced with IoT turnstiles and operator sensor feeds</p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="bg-slate-900 text-white text-xs font-medium rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Park Zones</option>
              <option value="1">Main Adventure Blvd</option>
              <option value="2">Cyberpunk Metropolis</option>
              <option value="3">Jurassic Lagoon</option>
              <option value="4">Enchanted Mythic Woods</option>
            </select>

            <select
              value={selectedThrill}
              onChange={(e) => setSelectedThrill(e.target.value)}
              className="bg-slate-900 text-white text-xs font-medium rounded-lg px-3 py-2 border border-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="ALL">All Thrill Levels</option>
              <option value="EXTREME">Extreme Thrill</option>
              <option value="HIGH">High Thrill</option>
              <option value="MODERATE">Moderate</option>
              <option value="LOW">Low / Family</option>
            </select>

            <button
              onClick={fetchAttractions}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
              title="Refresh Queue Times"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Attractions Grid */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
            Loading real-time park attraction status...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {attractions.map((attr) => {
              const isMaintenance = attr.status === 'MAINTENANCE';
              const wait = attr.current_wait_time;

              return (
                <div
                  key={attr.attraction_id}
                  className={`relative rounded-2xl bg-slate-900 border p-5 flex flex-col justify-between transition-all ${
                    isMaintenance
                      ? 'border-rose-900/50 bg-rose-950/10'
                      : 'border-slate-800 hover:border-slate-700 shadow-lg hover:shadow-indigo-950/20'
                  }`}
                >
                  <div>
                    {/* Header: Zone & Status Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {attr.zone_name}
                      </span>
                      {isMaintenance ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Maintenance
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Operational
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-white leading-snug">{attr.name}</h3>
                    <p className="mt-1.5 text-xs text-slate-400 line-clamp-3 leading-relaxed">{attr.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      {/* Wait Time Indicator */}
                      <div className="flex items-center gap-1.5">
                        <Clock className={`w-3.5 h-3.5 ${
                          isMaintenance ? 'text-slate-500' : wait > 30 ? 'text-rose-400' : wait > 15 ? 'text-amber-400' : 'text-emerald-400'
                        }`} />
                        <span className={`font-extrabold ${
                          isMaintenance ? 'text-slate-500' : wait > 30 ? 'text-rose-300' : wait > 15 ? 'text-amber-300' : 'text-emerald-300'
                        }`}>
                          {isMaintenance ? 'Closed' : `${wait} min wait`}
                        </span>
                      </div>

                      {/* Thrill Badge */}
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-300">
                        <Flame className="w-3 h-3 text-amber-500" />
                        {attr.thrill_level}
                      </div>

                      {/* Min Height */}
                      <div className="text-[11px] text-slate-400">
                        {attr.min_height_cm > 0 ? `${attr.min_height_cm}cm min` : 'All ages'}
                      </div>
                    </div>

                    {/* Reserve FastPass Action */}
                    <button
                      onClick={() => handleReserveFastPass(attr.attraction_id)}
                      disabled={isMaintenance || !attr.fastpass_available}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isMaintenance || !attr.fastpass_available
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-indigo-600/80 hover:bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      {isMaintenance ? 'Unavailable (Maintenance)' : 'Book FastPass Queue Skip'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Visitor Active Bookings & Passes Section */}
      {myBookings && myBookings.length > 0 && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-white">My Active Theme Park Passes</h3>
              <p className="text-xs text-slate-400">Stored in PostgreSQL with ACID relational foreign key integrity</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {myBookings.length} Booking Records
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myBookings.map((b) => (
              <div key={b.booking_id} className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-indigo-400 font-bold">{b.booking_reference}</span>
                  <span className="text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {b.payment_status} (${b.total_amount})
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">Date: {b.booking_date}</div>

                {b.tickets && b.tickets.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800/80 space-y-1.5">
                    {b.tickets.map((t: any) => (
                      <div key={t.ticket_code} className="flex items-center justify-between bg-slate-900/90 px-3 py-1.5 rounded-lg text-xs">
                        <span className="font-mono text-slate-300 text-[11px]">{t.ticket_code}</span>
                        <span className="text-amber-400 font-semibold">{t.tier_name}</span>
                        <span className="text-emerald-400 font-bold text-[10px]">{t.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ticket Purchase Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-white">Purchase Park Admission</h3>
                <p className="text-xs text-slate-400">Demonstrates Atomic Transaction via Stored Procedure <span className="font-mono text-indigo-400">sp_book_tickets</span></p>
              </div>
              <button
                onClick={() => setBookingModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div className="p-4 bg-emerald-950/80 border border-emerald-700 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ACID Booking Transaction Committed!
                </div>
                <div className="text-xs text-slate-300 font-mono space-y-1">
                  <div>Reference: {bookingSuccess.data.out_reference}</div>
                  <div>Total Deducted: ${bookingSuccess.data.out_total_price}</div>
                  <div>Status: {bookingSuccess.data.out_status}</div>
                </div>
                <button
                  onClick={() => {
                    setBookingSuccess(null);
                    setBookingModalOpen(false);
                  }}
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookingError && (
                  <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-300 text-xs font-semibold">
                    {bookingError}
                  </div>
                )}

                {/* Tier Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Select Admission Tier</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 1, name: 'Standard Day Pass', price: 59.99 },
                      { id: 2, name: 'VIP FastPass Plus', price: 119.99 },
                      { id: 3, name: 'Season Elite Pass', price: 249.99 },
                      { id: 4, name: 'Junior Explorer', price: 39.99 },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTierId(t.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedTierId === t.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-extrabold text-white">{t.name}</div>
                        <div className="text-sm font-black text-amber-400 mt-1">${t.price}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Number of Tickets</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                      className="w-9 h-9 rounded-lg bg-slate-800 text-white font-bold text-lg flex items-center justify-center border border-slate-700"
                    >
                      -
                    </button>
                    <span className="font-mono text-base font-extrabold text-white">{ticketCount}</span>
                    <button
                      type="button"
                      onClick={() => setTicketCount(Math.min(10, ticketCount + 1))}
                      className="w-9 h-9 rounded-lg bg-slate-800 text-white font-bold text-lg flex items-center justify-center border border-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Transaction Total & Balance Check */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Total Purchase: </span>
                    <span className="font-black text-base text-amber-400 ml-1">
                      ${(tierPrices[selectedTierId] * ticketCount).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Wallet: </span>
                    <span className="font-bold text-emerald-400">${userWallet.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={bookingSubmitting}
                    onClick={handleBookTickets}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                  >
                    {bookingSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Confirm Purchase
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
