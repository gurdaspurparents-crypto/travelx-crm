import React, { useState, useEffect, useMemo } from 'react';
import { Phone, PhoneCall, Plus, Search, Filter, Calendar, MapPin, CheckCircle2, MessageSquare, Flame, FileText, UserCheck, AlertCircle, RefreshCw, Users, Eye, ArrowUpDown, DollarSign, Award, ChevronRight, X, ChevronDown, ChevronUp, Clock, Sparkles } from 'lucide-react';

export default function YugCallingDesk({ onOpenModal, onOpenAgentDrawer, role }) {
  const [agents, setAgents] = useState([]);
  const [callsHistory, setCallsHistory] = useState([]);
  const [locationsMatrix, setLocationsMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(true);
  
  // Search & Filter States
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [callDateFilter, setCallDateFilter] = useState('');
  const [locationsList, setLocationsList] = useState([]);
  const [matrixSort, setMatrixSort] = useState('agents_desc'); // 'agents_desc', 'loc_asc', 'loc_desc', 'revenue_desc'
  
  // Tracking Date Filter & Details Dropdown States
  const todayStr = new Date().toISOString().split('T')[0];
  const [trackingDate, setTrackingDate] = useState(todayStr);
  const [showCallDetails, setShowCallDetails] = useState(false);
  const [callSearchTerm, setCallSearchTerm] = useState('');
  const [callResultFilter, setCallResultFilter] = useState('all');

  // Metrics State
  const [stats, setStats] = useState({
    totalCalls: 0,
    todayCalls: 0,
    connectedCount: 0,
    requirementsCount: 0,
    totalAgenciesCount: 0
  });

  useEffect(() => {
    fetchLocationsList();
    fetchLocationMatrix();
  }, []);

  useEffect(() => {
    fetchYugDeskData();
  }, [search, selectedCity, selectedStage]);

  const fetchLocationsList = async () => {
    try {
      const res = await fetch('/api/agents/locations');
      const json = await res.json();
      if (json.success) setLocationsList(json.cities || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLocationMatrix = async () => {
    setLoadingMatrix(true);
    try {
      const res = await fetch('/api/analytics/location');
      const json = await res.json();
      if (json.success) {
        setLocationsMatrix(json.locations || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMatrix(false);
    }
  };

  const fetchYugDeskData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Agents List for Calling Queue (Limit 5000 to get ALL agencies)
      const params = new URLSearchParams({ limit: '5000' });
      if (search) params.append('search', search);
      if (selectedCity) params.append('city', selectedCity);
      if (selectedStage) params.append('stage', selectedStage);

      const agentRes = await fetch(`/api/agents?${params.toString()}`);
      const agentJson = await agentRes.json();
      if (agentJson.success) {
        setAgents(agentJson.agents || []);
        if (!selectedCity && !search && !selectedStage) {
          setStats(prev => ({ ...prev, totalAgenciesCount: agentJson.total || (agentJson.agents || []).length }));
        }
      }

      // 2. Fetch Call History Logged by Yug or All Telephonic Calls
      const callRes = await fetch(`/api/calls?executive=Yug`);
      const callJson = await callRes.json();
      
      let history = [];
      if (callJson.success && callJson.calls && callJson.calls.length > 0) {
        history = callJson.calls;
      } else {
        const allCallsRes = await fetch('/api/calls');
        const allCallsJson = await allCallsRes.json();
        if (allCallsJson.success) history = allCallsJson.calls || [];
      }
      
      setCallsHistory(history);

      // Compute statistics
      const todayStr = new Date().toISOString().split('T')[0];
      const yugCalls = history.filter(c => c.executive_name === 'Yug' || c.executive_name?.toLowerCase().includes('yug'));
      const activeHistory = yugCalls.length > 0 ? yugCalls : history;

      const todayCount = activeHistory.filter(c => c.call_date === todayStr).length;
      const connected = activeHistory.filter(c => c.is_connected || c.call_result?.includes('Connected') || c.call_result?.includes('Interested') || c.call_result?.includes('Requirement')).length;
      const requirements = activeHistory.filter(c => c.agent_requirement || c.call_result?.includes('Requirement')).length;

      setStats(prev => ({
        ...prev,
        totalCalls: activeHistory.length,
        todayCalls: todayCount,
        connectedCount: connected,
        requirementsCount: requirements
      }));

    } catch (err) {
      console.error('Error fetching Yug Calling Desk data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCityFromMatrix = (cityName) => {
    setSelectedCity(cityName);
    // Smooth scroll down to calling queue
    const queueElement = document.getElementById('calling-queue-section');
    if (queueElement) {
      queueElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Sort Location Matrix Data
  const sortedMatrix = [...locationsMatrix].sort((a, b) => {
    if (matrixSort === 'loc_asc') return (a.location || '').localeCompare(b.location || '');
    if (matrixSort === 'loc_desc') return (b.location || '').localeCompare(a.location || '');
    if (matrixSort === 'revenue_desc') return (b.total_revenue || 0) - (a.total_revenue || 0);
    return (b.total_agents || 0) - (a.total_agents || 0);
  });

  // Derived calls filtered by tracking date
  const yugOnlyCalls = useMemo(() => {
    const yCalls = callsHistory.filter(c => c.executive_name === 'Yug' || c.executive_name?.toLowerCase().includes('yug'));
    return yCalls.length > 0 ? yCalls : callsHistory;
  }, [callsHistory]);

  const dateFilteredCalls = useMemo(() => {
    return yugOnlyCalls.filter(c => {
      if (trackingDate && c.call_date !== trackingDate) return false;
      return true;
    });
  }, [yugOnlyCalls, trackingDate]);

  // Calls further filtered by search and result tab inside the dropdown
  const displayedTrackingCalls = useMemo(() => {
    return dateFilteredCalls.filter(c => {
      if (callSearchTerm) {
        const q = callSearchTerm.toLowerCase();
        const matches = (c.company_name || '').toLowerCase().includes(q) ||
                        (c.agent_name || '').toLowerCase().includes(q) ||
                        (c.agent_mobile || '').includes(q) ||
                        (c.remarks || '').toLowerCase().includes(q) ||
                        (c.call_result || '').toLowerCase().includes(q) ||
                        (c.agent_city || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (callResultFilter !== 'all') {
        if (callResultFilter === 'Interested' && !c.call_result?.toLowerCase().includes('interested')) return false;
        if (callResultFilter === 'Call Again' && !c.call_result?.toLowerCase().includes('call again')) return false;
        if (callResultFilter === 'Not Interested' && !c.call_result?.toLowerCase().includes('not interested')) return false;
      }
      return true;
    });
  }, [dateFilteredCalls, callSearchTerm, callResultFilter]);

  const dateConnectedCount = useMemo(() => {
    return dateFilteredCalls.filter(c => c.is_connected || c.call_result?.includes('Connected') || c.call_result?.includes('Interested') || c.call_result?.includes('Requirement') || c.call_result?.includes('Call Again')).length;
  }, [dateFilteredCalls]);

  const dateRequirementsCount = useMemo(() => {
    return dateFilteredCalls.filter(c => c.agent_requirement || c.call_result?.includes('Requirement')).length;
  }, [dateFilteredCalls]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 border border-sky-800/60 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <Phone className="w-64 h-64 text-sky-400" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-sky-500/20 text-sky-400 border border-sky-500/40 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 animate-pulse" /> Dedicated Telephonic Calling Head
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-[10px] font-semibold">
                🟢 Access: Admin / Owner &bull; Simran &bull; Yug
              </span>
            </div>

            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              📞 Yug's Calling Desk
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Call B2B travel agents city-by-city across Punjab, log call responses, payment terms, and capture requirements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenModal('log_call', { executive_name: 'Yug' })}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-sky-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Log Call Result (Yug)
            </button>
            <button
              onClick={() => { fetchYugDeskData(); fetchLocationMatrix(); }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition border border-slate-700"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📅 DATE FILTER & TRACKING TOOLBAR (Today / Yesterday / Custom Date Picker) */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-sky-400" />
            <span>Call Tracking Date:</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-950 text-sky-300 border border-sky-700/60">
            {trackingDate === todayStr ? '⚡ Today (' + todayStr + ')' : trackingDate ? `📅 Date: ${trackingDate}` : '🌐 All Recorded History'}
          </span>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTrackingDate(todayStr)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow ${
              trackingDate === todayStr
                ? 'bg-sky-600 text-white shadow-sky-600/30'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            ⚡ Today
          </button>
          <button
            onClick={() => {
              const y = new Date();
              y.setDate(y.getDate() - 1);
              setTrackingDate(y.toISOString().split('T')[0]);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow ${
              (() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                return trackingDate === y.toISOString().split('T')[0];
              })()
                ? 'bg-sky-600 text-white shadow-sky-600/30'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            📅 Yesterday
          </button>
          
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={trackingDate}
              onChange={e => setTrackingDate(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            />
          </div>

          {trackingDate && (
            <button
              onClick={() => setTrackingDate('')}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1"
              title="Show all recorded dates"
            >
              <X className="w-3.5 h-3.5" /> All Dates
            </button>
          )}

          {/* Toggle Details Dropdown Button */}
          <button
            onClick={() => setShowCallDetails(!showCallDetails)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 border shadow cursor-pointer ${
              showCallDetails
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-amber-500/20'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40'
            }`}
          >
            {showCallDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showCallDetails ? 'Hide Call Details ▲' : `View Calls Breakdown (${dateFilteredCalls.length}) ▼`}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 INTERACTIVE METRICS SUMMARY CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Card 1: Total Agencies */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Database Agencies</div>
          <div className="text-2xl font-black text-sky-400 mt-1">{stats.totalAgenciesCount || agents.length}</div>
          <div className="text-[11px] text-sky-400/80 mt-0.5 font-semibold">All Punjab Cities</div>
        </div>

        {/* Card 2: Today's / Selected Date Calls (Clickable to open breakdown!) */}
        <div 
          onClick={() => setShowCallDetails(!showCallDetails)}
          className="bg-slate-900 border border-emerald-500/50 hover:border-emerald-400 p-4 rounded-xl shadow cursor-pointer transition relative group"
        >
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              {trackingDate === todayStr ? "Today's Calls" : trackingDate ? "Selected Day Calls" : "Total Calls"}
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 rounded font-bold">
              {showCallDetails ? 'Hide ▲' : 'Details ▼'}
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{dateFilteredCalls.length}</div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5 font-semibold">
            {trackingDate ? `Completed on ${trackingDate}` : 'All Logged Calls'} (Click to View)
          </div>
        </div>

        {/* Card 3: Connected Calls */}
        <div 
          onClick={() => setShowCallDetails(true)}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-4 rounded-xl shadow cursor-pointer transition"
        >
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Connected Calls</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{dateConnectedCount}</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5 font-semibold">
            {trackingDate ? `Connected on ${trackingDate}` : 'Successful Connections'}
          </div>
        </div>

        {/* Card 4: Requirements Received */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Requirements Received</div>
          <div className="text-2xl font-black text-indigo-400 mt-1">{dateRequirementsCount}</div>
          <div className="text-[11px] text-indigo-400/80 mt-0.5 font-semibold">
            {trackingDate ? `Received on ${trackingDate}` : 'Ready for Quoting'}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📋 EXPANDABLE CALL TRACKING DETAILS DROPDOWN (Kisko call ki & kya remarks) */}
      {/* ========================================================================= */}
      {showCallDetails && (
        <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in duration-200">
          
          {/* Dropdown Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> CALL LOG DETAILS
                </span>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-emerald-400" />
                  <span>
                    Yug's Call Log: {trackingDate === todayStr ? "Today's Calls" : trackingDate ? `Date: ${trackingDate}` : "All Recorded Calls"}
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                यहाँ देखें Yug ने किस-किस एजेंसी को कॉल की, क्या रिस्पॉन्स मिला और क्या Remarks दर्ज किए:
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-emerald-400 font-bold">
                Total: {dateFilteredCalls.length} Calls
              </span>
              <button
                onClick={() => setShowCallDetails(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                title="Hide Details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Filters & Search inside dropdown */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
              <button
                onClick={() => setCallResultFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  callResultFilter === 'all'
                    ? 'bg-sky-600 text-white shadow'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({dateFilteredCalls.length})
              </button>
              <button
                onClick={() => setCallResultFilter('Interested')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  callResultFilter === 'Interested'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-emerald-950/40 text-emerald-400 hover:bg-emerald-950/80 border border-emerald-800/40'
                }`}
              >
                🔥 Interested ({dateFilteredCalls.filter(c => c.call_result?.toLowerCase().includes('interested')).length})
              </button>
              <button
                onClick={() => setCallResultFilter('Call Again')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  callResultFilter === 'Call Again'
                    ? 'bg-amber-600 text-white shadow'
                    : 'bg-amber-950/40 text-amber-400 hover:bg-amber-950/80 border border-amber-800/40'
                }`}
              >
                📞 Call Again ({dateFilteredCalls.filter(c => c.call_result?.toLowerCase().includes('call again')).length})
              </button>
              <button
                onClick={() => setCallResultFilter('Not Interested')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  callResultFilter === 'Not Interested'
                    ? 'bg-rose-600 text-white shadow'
                    : 'bg-rose-950/40 text-rose-400 hover:bg-rose-950/80 border border-rose-800/40'
                }`}
              >
                ❌ Not Interested ({dateFilteredCalls.filter(c => c.call_result?.toLowerCase().includes('not interested')).length})
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={callSearchTerm}
                onChange={e => setCallSearchTerm(e.target.value)}
                placeholder="Search agency, mobile, remarks..."
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Calls Table List */}
          {displayedTrackingCalls.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-950 rounded-xl border border-slate-800">
              {dateFilteredCalls.length === 0 
                ? `Iss date (${trackingDate || 'selected'}) par Yug ne koi call record nahi ki.`
                : 'Selected filter ke liye koi record nahi mila.'}
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Agency Name & Contact</th>
                    <th className="p-3">Call Result / Status</th>
                    <th className="p-3">Remarks / Customer Response</th>
                    <th className="p-3">Payment Terms</th>
                    <th className="p-3">Next Followup</th>
                    <th className="p-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/30">
                  {displayedTrackingCalls.map((call, idx) => {
                    const isInterested = call.call_result?.toLowerCase().includes('interested');
                    const isCallAgain = call.call_result?.toLowerCase().includes('call again');
                    const isNotInterested = call.call_result?.toLowerCase().includes('not interested');

                    return (
                      <tr key={call.id || idx} className="hover:bg-slate-800/50 transition">
                        <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                        <td className="p-3">
                          <div 
                            onClick={() => onOpenAgentDrawer && onOpenAgentDrawer(call.agent_id)}
                            className="font-bold text-white text-sm hover:text-sky-400 cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{call.company_name || `Agent #${call.agent_id}`}</span>
                            <Eye className="w-3 h-3 text-slate-500 hover:text-sky-400" />
                          </div>
                          <div className="text-slate-400 text-[11px] mt-0.5">
                            👤 {call.agent_name || 'Owner'} &bull; 📱 <span className="font-mono text-slate-300">{call.agent_mobile || call.mobile || 'N/A'}</span>
                            {call.agent_city && <span className="text-sky-400 font-medium"> &bull; 📍 {call.agent_city}</span>}
                          </div>
                        </td>

                        {/* Call Result */}
                        <td className="p-3">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1 border ${
                            isInterested 
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-700' 
                              : isCallAgain 
                              ? 'bg-amber-950 text-amber-300 border-amber-700' 
                              : isNotInterested
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : 'bg-sky-950 text-sky-300 border-sky-800'
                          }`}>
                            {isInterested ? '🔥' : isCallAgain ? '📞' : isNotInterested ? '❌' : '💬'} {call.call_result || 'Call Completed'}
                          </span>
                          {call.interest_level && call.interest_level !== call.call_result && (
                            <div className="text-[10px] text-slate-400 mt-1 font-semibold">
                              Interest: <span className="text-slate-200">{call.interest_level}</span>
                            </div>
                          )}
                        </td>

                        {/* Remarks (The user specifically asked: 'remarks kya aaya hai') */}
                        <td className="p-3 max-w-xs">
                          {call.remarks || call.agent_requirement ? (
                            <div className="bg-slate-900/90 border border-slate-800 p-2 rounded-lg text-slate-200 text-xs">
                              <span className="text-amber-400 font-bold text-[10px] uppercase block mb-0.5">Yug's Remarks:</span>
                              "{call.remarks || call.agent_requirement}"
                            </div>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">No specific remarks noted</span>
                          )}
                        </td>

                        {/* Payment Terms */}
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                            {call.payment_terms || 'Advance'}
                          </span>
                        </td>

                        {/* Next Followup */}
                        <td className="p-3">
                          {call.next_followup_date ? (
                            <span className="text-amber-300 font-mono text-xs flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-amber-400" /> {call.next_followup_date}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Quick Actions */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {call.agent_mobile && (
                              <>
                                <a
                                  href={`tel:${call.agent_mobile}`}
                                  className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow"
                                  title="Call again"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                </a>
                                <a
                                  href={`https://wa.me/91${call.agent_mobile.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow"
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              </>
                            )}
                            <button
                              onClick={() => onOpenModal('log_call', { ...call, id: call.agent_id, executive_name: 'Yug' })}
                              className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] transition shadow cursor-pointer"
                              title="Update Followup"
                            >
                              Follow-up
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* 📍 SCREENSHOT INTERFACE: LOCATION-WISE MARKETING & CONVERSION MATRIX TABLE */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        
        {/* Matrix Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" /> Location-wise Marketing & Conversion Matrix
            </h3>
            <p className="text-xs text-amber-400/90 mt-1 flex items-center gap-1">
              💡 Click any location row or "Open & Manage" button to filter and call agencies city-by-city
            </p>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <span className="text-slate-400 font-medium">Sort By:</span>
            <button
              onClick={() => setMatrixSort(matrixSort === 'loc_asc' ? 'loc_desc' : 'loc_asc')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 border ${
                matrixSort.startsWith('loc') ? 'bg-sky-950 text-sky-400 border-sky-800' : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <ArrowUpDown className="w-3 h-3" /> Location ({matrixSort === 'loc_asc' ? 'A → Z' : 'Z → A'})
            </button>

            <button
              onClick={() => setMatrixSort('agents_desc')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 border ${
                matrixSort === 'agents_desc' ? 'bg-sky-600 text-white border-sky-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Users className="w-3 h-3" /> Total Agents
            </button>

            <button
              onClick={() => setMatrixSort('revenue_desc')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 border ${
                matrixSort === 'revenue_desc' ? 'bg-amber-950 text-amber-400 border-amber-800' : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <DollarSign className="w-3 h-3" /> Revenue
            </button>
          </div>
        </div>

        {/* Location Matrix Table */}
        {loadingMatrix ? (
          <div className="p-8 text-center text-slate-400 text-xs">⏳ Loading location matrix...</div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Territory / Location</th>
                  <th className="p-3.5 text-center">Total Agents</th>
                  <th className="p-3.5 text-center">Visits Logged</th>
                  <th className="p-3.5 text-center">Query-Giving Agents</th>
                  <th className="p-3.5 text-center">Active Agents</th>
                  <th className="p-3.5 text-center">Conversion %</th>
                  <th className="p-3.5 text-center">Total Revenue (₹)</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {sortedMatrix.map((loc) => {
                  const isCurrentSelected = selectedCity === loc.location;
                  return (
                    <tr
                      key={loc.location}
                      onClick={() => handleSelectCityFromMatrix(loc.location)}
                      className={`hover:bg-sky-950/40 cursor-pointer transition ${
                        isCurrentSelected ? 'bg-sky-950/60 border-l-4 border-sky-400 font-semibold' : ''
                      }`}
                    >
                      <td className="p-3.5 font-bold text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-sky-400" />
                        <span>{loc.location}</span>
                        {isCurrentSelected && (
                          <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/40">Selected</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-bold text-slate-100 text-sm">{loc.total_agents}</td>
                      <td className="p-3.5 text-center text-amber-400 font-semibold">{loc.visited_count || 0}</td>
                      <td className="p-3.5 text-center text-slate-300 font-semibold">{loc.query_agents || 0}</td>
                      <td className="p-3.5 text-center text-emerald-400 font-bold">{loc.active_agents || 0}</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-sky-950 text-sky-400 border border-sky-800">
                          {loc.conversion_rate || 0}%
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-extrabold text-emerald-400 font-mono text-sm">
                        {loc.total_revenue ? `₹${loc.total_revenue.toLocaleString('en-IN')}` : '₹0'}
                      </td>
                      <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => handleSelectCityFromMatrix(loc.location)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5 mx-auto ${
                            isCurrentSelected
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                              : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" /> {isCurrentSelected ? 'Calling This City' : 'Open & Manage'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 🏙️ CITY QUICK FILTER TABS / PILLS BAR */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-3">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-sky-400" /> Quick City Selection Bar:
          </span>
          {selectedCity && (
            <button
              onClick={() => setSelectedCity('')}
              className="text-sky-400 hover:underline text-xs font-semibold cursor-pointer"
            >
              Show All Cities ({stats.totalAgenciesCount} Agencies)
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCity('')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              !selectedCity
                ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            🌐 All Cities ({stats.totalAgenciesCount || 700})
          </button>

          {sortedMatrix.map(loc => (
            <button
              key={loc.location}
              onClick={() => setSelectedCity(loc.location)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedCity === loc.location
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30 border border-sky-400'
                  : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              📍 {loc.location} <span className="text-[10px] opacity-80 font-mono">({loc.total_agents})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SEARCH & STAGE FILTERS BAR */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-3 items-center justify-between">
        
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search Travel Agency by Name, Mobile, ID..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-10 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="bg-slate-950 border border-sky-500/60 text-sky-300 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none"
          >
            <option value="">All Cities / Locations ({stats.totalAgenciesCount})</option>
            {locationsList.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          <select
            value={selectedStage}
            onChange={e => setSelectedStage(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs font-medium focus:outline-none"
          >
            <option value="">All Agent Stages</option>
            <option value="Visited">Visited Agents</option>
            <option value="Followup">Follow-up Pending</option>
            <option value="QueryReceived">Query Received</option>
            <option value="Active">Active Booking Agents</option>
            <option value="Dormant">Dormant (&gt;30 Days)</option>
            <option value="Inactive">Inactive</option>
          </select>

          {(search || selectedCity || selectedStage) && (
            <button
              onClick={() => { setSearch(''); setSelectedCity(''); setSelectedStage(''); }}
              className="text-xs text-rose-400 hover:underline px-2 font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 📞 CALLING AGENTS QUEUE GRID (ALL AGENCIES - NO LONGER CAPPED AT 200) */}
      {/* ========================================================================= */}
      <div id="calling-queue-section" className="scroll-mt-24 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" /> B2B Agent Calling Queue ({agents.length} Agencies {selectedCity ? `in ${selectedCity}` : 'Total'})
          </h2>
          <span className="text-xs text-slate-400">Click 1-Click WhatsApp or Call Now to connect instantly</span>
        </div>

        {loading ? (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center text-slate-400 text-sm">
            ⏳ Loading agents calling queue...
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center text-slate-400 text-sm">
            No travel agencies match the selected filter criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-sky-700/60 transition shadow flex flex-col justify-between space-y-3">
                
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3
                        onClick={() => onOpenAgentDrawer && onOpenAgentDrawer(agent.id)}
                        className="font-bold text-white text-base hover:text-sky-400 cursor-pointer line-clamp-1"
                      >
                        {agent.company_name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        👤 {agent.name} &bull; 📍 {agent.city} ({agent.area})
                      </p>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                      agent.stage === 'Active' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                      agent.stage === 'QueryReceived' ? 'bg-amber-950 text-amber-400 border-amber-800' :
                      agent.stage === 'Followup' ? 'bg-sky-950 text-sky-400 border-sky-800' :
                      agent.stage === 'Dormant' ? 'bg-rose-950 text-rose-400 border-rose-800' :
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {agent.stage || 'Visited'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                    <div>
                      <span className="block text-[10px] text-slate-500 font-bold uppercase">Mobile Number</span>
                      <span className="font-mono text-slate-200 font-semibold">{agent.mobile}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] text-slate-500 font-bold uppercase">Agent Type</span>
                      <span className="text-slate-300 font-medium">{agent.agent_type || 'Retail Agent'}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-3 gap-2">
                  <a
                    href={`https://wa.me/91${(agent.mobile || '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-2 bg-emerald-700/80 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg transition text-center flex items-center justify-center gap-1"
                    title="Open WhatsApp Chat"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                  </a>

                  <a
                    href={`tel:${agent.mobile}`}
                    className="py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition text-center flex items-center justify-center gap-1"
                    title="Call Now"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>

                  <button
                    onClick={() => onOpenModal('log_call', { ...agent, executive_name: 'Yug' })}
                    className="py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold rounded-lg transition text-center flex items-center justify-center gap-1 cursor-pointer"
                    title="Log Call Result"
                  >
                    <Plus className="w-3.5 h-3.5" /> Log Call
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Yug's Recent Calls Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-sky-400" /> Recent Calls History (Logged by Yug)
            </h3>
            <p className="text-xs text-slate-400">Complete telephonic log records and agent responses</p>
          </div>

          {/* Date Filter Controls */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setCallDateFilter('')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                !callDateFilter
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-slate-800'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setCallDateFilter(new Date().toISOString().split('T')[0])}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                callDateFilter === new Date().toISOString().split('T')[0]
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              ⚡ Today
            </button>
            <button
              onClick={() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                setCallDateFilter(y.toISOString().split('T')[0]);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                (() => {
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  return callDateFilter === y.toISOString().split('T')[0];
                })()
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              Yesterday
            </button>
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2 py-1 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={callDateFilter}
                onChange={e => setCallDateFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
              />
            </div>
            {callDateFilter && (
              <button
                onClick={() => setCallDateFilter('')}
                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition border border-slate-700"
                title="Clear date filter"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <span className="text-xs text-slate-400 font-mono ml-2">
              ({callsHistory.filter(c => !callDateFilter || c.call_date === callDateFilter).length})
            </span>
          </div>
        </div>

        {callsHistory.filter(c => !callDateFilter || c.call_date === callDateFilter).length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-8">
            No calls recorded for this date filter. Click "+ Log Call Result (Yug)" to record a call.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                <tr>
                  <th className="p-3">Call Date</th>
                  <th className="p-3">Executive</th>
                  <th className="p-3">Agency Name</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3">Result</th>
                  <th className="p-3">Payment Terms</th>
                  <th className="p-3">Requirement / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {callsHistory.filter(c => !callDateFilter || c.call_date === callDateFilter).slice(0, 50).map((c, i) => (
                  <tr key={c.id || i} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-medium text-slate-300">{c.call_date}</td>
                    <td className="p-3">
                      <span className="font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 text-[10px]">
                        {c.executive_name || 'Yug'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white">{c.company_name || c.agent_id}</td>
                    <td className="p-3 font-mono text-slate-300">{c.agent_mobile || c.mobile || '-'}</td>
                    <td className="p-3 font-semibold text-amber-400">{c.call_result}</td>
                    <td className="p-3 font-semibold text-emerald-400">{c.payment_terms || 'Advance Payment'}</td>
                    <td className="p-3 max-w-xs truncate text-slate-400">{c.agent_requirement || c.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
