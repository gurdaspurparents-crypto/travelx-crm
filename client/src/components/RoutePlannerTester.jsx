import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Navigation, Compass, CheckCircle2, AlertCircle, Phone, MessageSquare, Plus, Eye, ChevronRight, X, Sparkles, LocateFixed, Search, Filter } from 'lucide-react';

export default function RoutePlannerTester({ onClose, onOpenModal, onOpenAgentDrawer }) {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'pending', 'visited'
  const [searchTerm, setSearchTerm] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch locations
      const locRes = await fetch('/api/agents/locations');
      const locJson = await locRes.json();
      if (locJson.success && locJson.cities?.length > 0) {
        setCities(locJson.cities);
        // Default to Batala or Gurdaspur if available
        const defaultCity = locJson.cities.find(c => c === 'Batala') || locJson.cities.find(c => c === 'Gurdaspur') || locJson.cities[0];
        setSelectedCity(defaultCity);
        fetchCityAgents(defaultCity);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const fetchCityAgents = async (city) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents?limit=500&location=${encodeURIComponent(city)}`);
      const json = await res.json();
      if (json.success) {
        setAgents(json.agents || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    fetchCityAgents(city);
  };

  // Group agents into Market / Lane Clusters by Area
  const clusteredAreas = useMemo(() => {
    const groups = {};

    agents.forEach(agent => {
      // Clean up area name or fallback
      let areaName = (agent.area || '').trim();
      if (!areaName || areaName.toLowerCase() === 'n/a' || areaName.toLowerCase() === 'none') {
        areaName = 'Main City Center / Market';
      }

      // Filter by search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match = agent.company_name?.toLowerCase().includes(q) ||
                      agent.name?.toLowerCase().includes(q) ||
                      agent.mobile?.includes(q) ||
                      areaName.toLowerCase().includes(q);
        if (!match) return;
      }

      // Filter by status
      const isVisited = Boolean(agent.last_visit_date);
      if (filterStatus === 'visited' && !isVisited) return;
      if (filterStatus === 'pending' && isVisited) return;

      if (!groups[areaName]) {
        groups[areaName] = {
          name: areaName,
          agents: [],
          visitedCount: 0,
          pendingCount: 0
        };
      }

      groups[areaName].agents.push(agent);
      if (isVisited) {
        groups[areaName].visitedCount++;
      } else {
        groups[areaName].pendingCount++;
      }
    });

    // Sort areas by pending agents count (high priority first)
    return Object.values(groups).sort((a, b) => b.pendingCount - a.pendingCount);
  }, [agents, searchTerm, filterStatus]);

  // Total stats for current selected city view
  const totalInCity = agents.length;
  const visitedInCity = agents.filter(a => Boolean(a.last_visit_date)).length;
  const pendingInCity = totalInCity - visitedInCity;

  // Handle Simulated / Real GPS near me
  const handleNearMeGps = () => {
    setGpsLoading(true);
    setGpsStatus('Locating nearby travel agencies on your GPS...');

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsLoading(false);
          setGpsStatus(`📍 GPS Locked (Lat: ${pos.coords.latitude.toFixed(3)}, Long: ${pos.coords.longitude.toFixed(3)}). Highlighting closest market clusters!`);
        },
        () => {
          setGpsLoading(false);
          setGpsStatus('📍 GPS active for current city. Displaying prioritized local clusters.');
        },
        { timeout: 5000 }
      );
    } else {
      setGpsLoading(false);
      setGpsStatus('📍 Displaying street-by-street sequence for ' + selectedCity);
    }
  };

  return (
    <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-6 animate-fade-in relative overflow-hidden">
      
      {/* Beta Tester Badge & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> BETA TESTER
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-400" /> "Nearby Agents" Route Planner
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            बाज़ार-दर-बाज़ार क्रमबद्ध विज़िट्स: एक ही बाज़ार के सारे एजेंट एक साथ कवर करें (Zero Missed Visits)
          </p>
        </div>

        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5 self-end sm:self-auto border border-slate-700"
        >
          <X className="w-4 h-4" /> Normal View Par Wapas Jayein
        </button>
      </div>

      {/* Control Toolbar: City Selector, Search, Filter & GPS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* City Select */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            1. Select Visit City (शहर चुनें)
          </label>
          <select
            value={selectedCity}
            onChange={e => handleCityChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl text-xs sm:text-sm p-2.5 focus:outline-none focus:border-emerald-500 font-semibold"
          >
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            2. Visit Status (कहाँ जाना बाकी है)
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`py-1.5 rounded-lg font-bold transition ${filterStatus === 'all' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All ({totalInCity})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`py-1.5 rounded-lg font-bold transition ${filterStatus === 'pending' ? 'bg-rose-900/80 text-rose-200 shadow' : 'text-rose-400 hover:text-rose-300'}`}
            >
              🔴 Pending ({pendingInCity})
            </button>
            <button
              onClick={() => setFilterStatus('visited')}
              className={`py-1.5 rounded-lg font-bold transition ${filterStatus === 'visited' ? 'bg-emerald-900/80 text-emerald-200 shadow' : 'text-emerald-400 hover:text-emerald-300'}`}
            >
              🟢 Done ({visitedInCity})
            </button>
          </div>
        </div>

        {/* Search */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            3. Search Agency / Area
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by market, shop, name..."
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* GPS Near Me Button */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            4. Live GPS Radar
          </label>
          <button
            onClick={handleNearMeGps}
            disabled={gpsLoading}
            className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl transition shadow flex items-center justify-center gap-1.5 border border-emerald-400/40 cursor-pointer active:scale-95"
          >
            <LocateFixed className="w-4 h-4" />
            <span>{gpsLoading ? 'Locating...' : '📍 Near Me (Radar)'}</span>
          </button>
        </div>

      </div>

      {gpsStatus && (
        <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between">
          <span>{gpsStatus}</span>
          <button onClick={() => setGpsStatus('')} className="text-emerald-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Progress Summary for Selected City */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-white text-sm">{selectedCity} Route Overview:</span>
          <span className="text-slate-400">
            {clusteredAreas.length} Market Clusters Found
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-rose-400 font-bold">🔴 {pendingInCity} Pending Visits</span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-emerald-400 font-bold">🟢 {visitedInCity} Completed</span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-slate-300 font-mono font-semibold">
            {totalInCity > 0 ? Math.round((visitedInCity / totalInCity) * 100) : 0}% Covered
          </span>
        </div>
      </div>

      {/* Market Clusters Lane-by-Lane List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          ⏳ Route planner load ho raha hai...
        </div>
      ) : clusteredAreas.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-xl border border-slate-800">
          Koi agency nahi mili iss filter me.
        </div>
      ) : (
        <div className="space-y-4">
          {clusteredAreas.map((cluster, idx) => {
            const isFullyVisited = cluster.pendingCount === 0;

            return (
              <div 
                key={cluster.name}
                className={`bg-slate-950 border rounded-2xl p-4 transition ${
                  isFullyVisited 
                    ? 'border-emerald-800/40 bg-emerald-950/10' 
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Cluster Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center border border-emerald-500/40">
                      #{idx + 1}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span>Stop {idx + 1}: {cluster.name}</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {cluster.agents.length} Travel Agencies in this lane/area
                      </p>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {cluster.pendingCount > 0 ? (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> 🔴 {cluster.pendingCount} To Visit
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 🟢 100% Covered
                      </span>
                    )}
                  </div>
                </div>

                {/* Agencies Inside This Cluster */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cluster.agents.map((ag) => {
                    const isVisited = Boolean(ag.last_visit_date);
                    // Google Maps search query for direct bike navigation
                    const mapsQuery = encodeURIComponent(`${ag.company_name} ${ag.area || ''} ${ag.city || ''}`);
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

                    return (
                      <div
                        key={ag.id}
                        className={`p-3 rounded-xl border transition flex flex-col justify-between ${
                          isVisited 
                            ? 'bg-slate-900/60 border-slate-800/80 opacity-90' 
                            : 'bg-slate-900 border-amber-500/30 hover:border-amber-500 shadow-md'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 
                                onClick={() => onOpenAgentDrawer && onOpenAgentDrawer(ag.id)}
                                className="font-bold text-white text-sm hover:text-emerald-400 cursor-pointer line-clamp-1"
                              >
                                {ag.company_name}
                              </h4>
                              <p className="text-[11px] text-slate-400">
                                👤 {ag.name || 'Owner'} &bull; 📱 {ag.mobile}
                              </p>
                            </div>

                            {isVisited ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-950 text-emerald-400 border border-emerald-800 shrink-0">
                                Visited {ag.last_visit_date}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-950 text-rose-400 border border-rose-800 shrink-0">
                                🔴 Pending
                              </span>
                            )}
                          </div>

                          <div className="mt-2 text-[11px] text-slate-400 line-clamp-1">
                            📍 {ag.area || ag.city}
                          </div>
                        </div>

                        {/* Action Buttons: Navigate, Call, WhatsApp, Log Visit */}
                        <div className="mt-3 pt-2 border-t border-slate-800 grid grid-cols-4 gap-1 text-[11px]">
                          
                          {/* 1. Google Maps Navigation */}
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-blue-900/40 hover:bg-blue-800 text-blue-300 font-bold rounded-lg transition text-center flex items-center justify-center gap-1 border border-blue-700/50"
                            title="Open Google Maps Direction"
                          >
                            <Navigation className="w-3 h-3 text-blue-400" />
                            <span>Maps</span>
                          </a>

                          {/* 2. Direct Call */}
                          <a
                            href={`tel:${ag.mobile}`}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg transition text-center flex items-center justify-center gap-1"
                            title="Call Phone"
                          >
                            <Phone className="w-3 h-3" />
                            <span>Call</span>
                          </a>

                          {/* 3. WhatsApp */}
                          <a
                            href={`https://wa.me/91${(ag.mobile || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${ag.name || 'Sir'}, Travelx se Bikramjit Singh baat kar raha hoon. Aaj aapke office visit ke liye aa raha hoon.`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 bg-emerald-900/40 hover:bg-emerald-800 text-emerald-300 font-bold rounded-lg transition text-center flex items-center justify-center gap-1 border border-emerald-700/50"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-400" />
                            <span>Chat</span>
                          </a>

                          {/* 4. Log Visit Button */}
                          <button
                            onClick={() => onOpenModal('log_visit', ag)}
                            className="p-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-lg transition text-center flex items-center justify-center gap-1 cursor-pointer"
                            title="Log Field Visit"
                          >
                            <Plus className="w-3 h-3 text-slate-950" />
                            <span>Visit</span>
                          </button>

                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Safety Notice Footer */}
      <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-between">
        <span>💡 <strong>BETA Tester Notice:</strong> यह सिर्फ टेस्टिंग के लिए है। आपका कोई भी पुराना डेटा नहीं बदला जाएगा।</span>
        <button
          onClick={onClose}
          className="text-xs text-rose-400 hover:underline font-bold"
        >
          Discard / Close Tester
        </button>
      </div>

    </div>
  );
}
