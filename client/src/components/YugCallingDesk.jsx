import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, Plus, Search, Filter, Calendar, MapPin, CheckCircle2, MessageSquare, Flame, FileText, UserCheck, AlertCircle, RefreshCw, Users, Eye, ArrowUpDown, DollarSign, Award, ChevronRight } from 'lucide-react';

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
  const [locationsList, setLocationsList] = useState([]);
  const [matrixSort, setMatrixSort] = useState('agents_desc'); // 'agents_desc', 'loc_asc', 'loc_desc', 'revenue_desc'
  
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

      {/* Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Database Agencies</div>
          <div className="text-2xl font-black text-sky-400 mt-1">{stats.totalAgenciesCount || agents.length}</div>
          <div className="text-[11px] text-sky-400/80 mt-0.5 font-semibold">All Punjab Cities</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Calls</div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{stats.todayCalls}</div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5 font-semibold">Today's Completed</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Connected Calls</div>
          <div className="text-2xl font-black text-amber-400 mt-1">{stats.connectedCount}</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5 font-semibold">Successful Connections</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Requirements Received</div>
          <div className="text-2xl font-black text-indigo-400 mt-1">{stats.requirementsCount}</div>
          <div className="text-[11px] text-indigo-400/80 mt-0.5 font-semibold">Ready for Quoting</div>
        </div>
      </div>

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
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-white text-base flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-sky-400" /> Recent Calls History (Logged by Yug)
            </h3>
            <p className="text-xs text-slate-400">Complete telephonic log records and agent responses</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Total Records: {callsHistory.length}</span>
        </div>

        {callsHistory.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-8">
            No calls recorded by Yug yet. Click "+ Log Call Result (Yug)" to record your first call.
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
                {callsHistory.slice(0, 30).map((c, i) => (
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
