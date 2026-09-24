import React, { useState, useEffect, useMemo } from 'react';
import { Phone, PhoneCall, Plus, Search, Filter, Calendar, MapPin, CheckCircle2, MessageSquare, Flame, FileText, UserCheck, AlertCircle, RefreshCw, Users, Eye, ArrowUpDown, DollarSign, Award, ChevronRight, X, ChevronDown, ChevronUp, Clock, Sparkles, Target, Zap, BarChart3, Check } from 'lucide-react';

export default function YugCallingDesk({ onOpenModal, onOpenAgentDrawer, role, refreshTrigger }) {
  const [agents, setAgents] = useState([]);
  const [callsHistory, setCallsHistory] = useState([]);
  const [locationsMatrix, setLocationsMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(true);
  
  // Search & Filter States
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCityState] = useState(() => {
    return sessionStorage.getItem('yug_desk_selected_city') || '';
  });

  const setSelectedCity = (city) => {
    const val = city || '';
    setSelectedCityState(val);
    if (val) {
      sessionStorage.setItem('yug_desk_selected_city', val);
    } else {
      sessionStorage.removeItem('yug_desk_selected_city');
    }
  };

  const [selectedStage, setSelectedStage] = useState('');
  const [callDateFilter, setCallDateFilter] = useState('');
  const [locationsList, setLocationsList] = useState([]);
  const [matrixSort, setMatrixSort] = useState('pending_desc'); // default sort by highest pending so Yug knows where to call first!
  
  // Tracking Date & Monthly Filter States
  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. '2026-09'
  const todayStr = new Date().toISOString().split('T')[0];
  const [dateFilterMode, setDateFilterMode] = useState('month'); // 'month', 'today', 'yesterday', 'custom_date', 'all'
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [trackingDate, setTrackingDate] = useState('');
  
  const [executiveFilter, setExecutiveFilter] = useState('all'); // 'all' or 'yug'
  const [showCallDetails, setShowCallDetails] = useState(false);
  const [callSearchTerm, setCallSearchTerm] = useState('');
  const [callResultFilter, setCallResultFilter] = useState('all');
  const [onlyWithComments, setOnlyWithComments] = useState(false);
  const [bottomOnlyComments, setBottomOnlyComments] = useState(false);

  // Matrix Tab & City Status Filter
  const [matrixViewTab, setMatrixViewTab] = useState('calling'); // 'calling' (Yug calling coverage) or 'conversion' (Field visits & revenue)
  const [matrixCallingStatusFilter, setMatrixCallingStatusFilter] = useState('all'); // 'all', 'completed', 'in_progress', 'not_started'

  // Calling Queue Filter
  const [queueCallingFilter, setQueueCallingFilter] = useState('all'); // 'all', 'pending', 'called'

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
  }, []);

  useEffect(() => {
    fetchLocationMatrix(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    fetchYugDeskData();
  }, [search, selectedCity, selectedStage]);

  // When a modal logs a call or update occurs, re-fetch data smoothly without unmounting or losing selected city!
  useEffect(() => {
    if (refreshTrigger) {
      fetchYugDeskData();
      fetchLocationMatrix(selectedMonth);
    }
  }, [refreshTrigger]);

  const fetchLocationsList = async () => {
    try {
      const res = await fetch('/api/agents/locations');
      const json = await res.json();
      if (json.success) setLocationsList(json.cities || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLocationMatrix = async (m = selectedMonth) => {
    setLoadingMatrix(true);
    try {
      const res = await fetch(`/api/analytics/location?month=${encodeURIComponent(m || currentMonthStr)}`);
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

      // 2. Fetch Full Call History (without limit 250 truncation)
      const allCallsRes = await fetch('/api/calls?limit=10000');
      const allCallsJson = await allCallsRes.json();
      const history = (allCallsJson.success && allCallsJson.calls) ? allCallsJson.calls : [];
      setCallsHistory(history);

    } catch (err) {
      console.error('Error fetching Yug Calling Desk data:', err);
    } finally {
      setLoading(false);
    }
  };

  const allCallsCount = callsHistory.length;
  const yugCallsCount = useMemo(() => {
    return callsHistory.filter(c => c.executive_name === 'Yug' || c.executive_name?.toLowerCase().includes('yug')).length;
  }, [callsHistory]);

  const handleSelectCityFromMatrix = (cityName, filterMode = 'all') => {
    setSelectedCity(cityName);
    setQueueCallingFilter(filterMode);
    // Smooth scroll down to calling queue
    const queueElement = document.getElementById('calling-queue-section');
    if (queueElement) {
      queueElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Derived calls filtered by executive mode ('all' vs 'yug')
  const yugOnlyCalls = useMemo(() => {
    if (executiveFilter === 'yug') {
      return callsHistory.filter(c => c.executive_name === 'Yug' || c.executive_name?.toLowerCase().includes('yug'));
    }
    return callsHistory;
  }, [callsHistory, executiveFilter]);

  // Fast O(1) map of all calls made to each agent in the selected month
  const yugAgentMonthMap = useMemo(() => {
    const map = {};
    const targetMonth = selectedMonth || currentMonthStr;
    yugOnlyCalls.forEach(c => {
      if (c.call_date && c.call_date.startsWith(targetMonth)) {
        if (!map[c.agent_id]) {
          map[c.agent_id] = c;
        }
      }
    });
    return map;
  }, [yugOnlyCalls, selectedMonth, currentMonthStr]);

  // Overall database totals & monthly coverage
  const totalDbAgencies = stats.totalAgenciesCount || agents.length || 556;
  const uniqueAgenciesCalledThisMonth = useMemo(() => Object.keys(yugAgentMonthMap).length, [yugAgentMonthMap]);
  const uniqueAgenciesPendingThisMonth = Math.max(0, totalDbAgencies - uniqueAgenciesCalledThisMonth);
  const monthlyCoverageRate = totalDbAgencies > 0 ? Math.round((uniqueAgenciesCalledThisMonth / totalDbAgencies) * 100) : 0;

  // Derive calling counts per location from callsHistory and agents
  const locationCallingStats = useMemo(() => {
    const statsByCity = {};
    const targetMonth = selectedMonth || currentMonthStr;
    
    // Count called unique agents per city
    yugOnlyCalls.forEach(c => {
      if (c.call_date && c.call_date.startsWith(targetMonth) && c.agent_city) {
        const cityKey = c.agent_city.trim().toLowerCase();
        if (!statsByCity[cityKey]) {
          statsByCity[cityKey] = new Set();
        }
        statsByCity[cityKey].add(c.agent_id);
      }
    });

    const counts = {};
    Object.keys(statsByCity).forEach(k => {
      counts[k] = statsByCity[k].size;
    });
    return counts;
  }, [yugOnlyCalls, selectedMonth, currentMonthStr]);

  // Enhanced Matrix with Live Calling Counts
  const enhancedMatrix = useMemo(() => {
    return locationsMatrix.map(loc => {
      const cityKey = (loc.location || '').trim().toLowerCase();
      const serverCalled = executiveFilter === 'all' 
        ? (loc.all_called_month || loc.yug_called_month || 0) 
        : (loc.yug_called_month || 0);
      const liveCalled = locationCallingStats[cityKey];
      const called = liveCalled !== undefined ? Math.max(serverCalled, liveCalled) : serverCalled;
      const total = loc.total_agents || 0;
      const pending = Math.max(0, total - called);
      const rate = total > 0 ? Math.round((called / total) * 100) : 0;

      return {
        ...loc,
        yug_called_month: called,
        yug_pending_month: pending,
        yug_coverage_rate: rate
      };
    });
  }, [locationsMatrix, locationCallingStats, executiveFilter]);

  // Sort Location Matrix Data
  const sortedMatrix = useMemo(() => {
    return [...enhancedMatrix].sort((a, b) => {
      if (matrixSort === 'loc_asc') return (a.location || '').localeCompare(b.location || '');
      if (matrixSort === 'loc_desc') return (b.location || '').localeCompare(a.location || '');
      if (matrixSort === 'revenue_desc') return (b.total_revenue || 0) - (a.total_revenue || 0);
      if (matrixSort === 'pending_desc') return (b.yug_pending_month || 0) - (a.yug_pending_month || 0);
      if (matrixSort === 'called_desc') return (b.yug_called_month || 0) - (a.yug_called_month || 0);
      if (matrixSort === 'coverage_desc') return (b.yug_coverage_rate || 0) - (a.yug_coverage_rate || 0);
      return (b.total_agents || 0) - (a.total_agents || 0);
    });
  }, [enhancedMatrix, matrixSort]);

  // Filtered Matrix by Calling Progress Status
  const filteredMatrix = useMemo(() => {
    return sortedMatrix.filter(loc => {
      if (matrixCallingStatusFilter === 'completed') return (loc.yug_coverage_rate || 0) === 100;
      if (matrixCallingStatusFilter === 'in_progress') return (loc.yug_called_month || 0) > 0 && (loc.yug_coverage_rate || 0) < 100;
      if (matrixCallingStatusFilter === 'not_started') return (loc.yug_called_month || 0) === 0;
      return true;
    });
  }, [sortedMatrix, matrixCallingStatusFilter]);

  // Matrix status counts
  const matrixCompletedCount = useMemo(() => sortedMatrix.filter(l => (l.yug_coverage_rate || 0) === 100).length, [sortedMatrix]);
  const matrixInProgressCount = useMemo(() => sortedMatrix.filter(l => (l.yug_called_month || 0) > 0 && (l.yug_coverage_rate || 0) < 100).length, [sortedMatrix]);
  const matrixNotStartedCount = useMemo(() => sortedMatrix.filter(l => (l.yug_called_month || 0) === 0).length, [sortedMatrix]);

  // Calling Queue Filtering (Pending / Called / All for selected month)
  const filteredAgentsList = useMemo(() => {
    return agents.filter(agent => {
      const isCalled = !!yugAgentMonthMap[agent.id];
      if (queueCallingFilter === 'pending') return !isCalled;
      if (queueCallingFilter === 'called') return isCalled;
      return true;
    });
  }, [agents, queueCallingFilter, yugAgentMonthMap]);

  const queuePendingCount = useMemo(() => agents.filter(a => !yugAgentMonthMap[a.id]).length, [agents, yugAgentMonthMap]);
  const queueCalledCount = useMemo(() => agents.filter(a => !!yugAgentMonthMap[a.id]).length, [agents, yugAgentMonthMap]);

  // Helper to check if a call record has meaningful remarks or requirement comments
  const hasCallComment = (c) => {
    const r = (c?.remarks || '').trim();
    const req = (c?.agent_requirement || '').trim();
    const isMeaningful = (txt) => {
      if (!txt) return false;
      const lower = txt.toLowerCase();
      return (
        lower !== 'no specific remarks noted' &&
        lower !== 'no specific remarks' &&
        lower !== 'no remarks noted' &&
        lower !== 'no remarks' &&
        lower !== 'n/a' &&
        lower !== 'none' &&
        lower !== '-'
      );
    };
    return isMeaningful(r) || isMeaningful(req);
  };

  // Derived calls filtered by date mode
  const dateFilteredCalls = useMemo(() => {
    return yugOnlyCalls.filter(c => {
      if (dateFilterMode === 'month') {
        const m = selectedMonth || currentMonthStr;
        return c.call_date && c.call_date.startsWith(m);
      }
      if (dateFilterMode === 'today') {
        return c.call_date === todayStr;
      }
      if (dateFilterMode === 'yesterday') {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        return c.call_date === y.toISOString().split('T')[0];
      }
      if (dateFilterMode === 'custom_date') {
        return trackingDate ? c.call_date === trackingDate : true;
      }
      return true; // 'all'
    });
  }, [yugOnlyCalls, dateFilterMode, selectedMonth, currentMonthStr, todayStr, trackingDate]);

  // Calls further filtered by search and result tab inside the dropdown
  const displayedTrackingCalls = useMemo(() => {
    return dateFilteredCalls.filter(c => {
      if (callSearchTerm) {
        const q = callSearchTerm.toLowerCase();
        const matches = (c.company_name || '').toLowerCase().includes(q) ||
                        (c.agent_name || '').toLowerCase().includes(q) ||
                        (c.agent_mobile || '').includes(q) ||
                        (c.remarks || '').toLowerCase().includes(q) ||
                        (c.agent_requirement || '').toLowerCase().includes(q) ||
                        (c.call_result || '').toLowerCase().includes(q) ||
                        (c.agent_city || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (callResultFilter === 'With Comments') {
        if (!hasCallComment(c)) return false;
      } else {
        if (callResultFilter === 'Interested' && !c.call_result?.toLowerCase().includes('interested')) return false;
        if (callResultFilter === 'Call Again' && !c.call_result?.toLowerCase().includes('call again')) return false;
        if (callResultFilter === 'Not Interested' && !c.call_result?.toLowerCase().includes('not interested')) return false;
        if (onlyWithComments && !hasCallComment(c)) return false;
      }
      return true;
    });
  }, [dateFilteredCalls, callSearchTerm, callResultFilter, onlyWithComments]);

  const dateConnectedCount = useMemo(() => {
    return dateFilteredCalls.filter(c => {
      const res = (c.call_result || '').toLowerCase();
      return (
        res.includes('interested') ||
        res.includes('requirement') ||
        res.includes('call again') ||
        res.includes('follow-up') ||
        res.includes('connected')
      ) && !res.includes('not interested') && !res.includes('no response');
    }).length;
  }, [dateFilteredCalls]);

  const dateRequirementsCount = useMemo(() => {
    return dateFilteredCalls.filter(c => {
      const res = (c.call_result || '').toLowerCase();
      const req = (c.agent_requirement || '').trim().toLowerCase();
      const invalidPhrases = ['no specific remarks', 'busy', 'switch off', 'ghalat number', 'kam nhi', 'kam nahin', 'no visit', 'no call', 'ehnu call', 'cut call'];
      const hasInvalid = invalidPhrases.some(p => req.includes(p));
      return res.includes('requirement') || (req.length > 3 && !hasInvalid);
    }).length;
  }, [dateFilteredCalls]);

  const dateWithCommentsCount = useMemo(() => {
    return dateFilteredCalls.filter(hasCallComment).length;
  }, [dateFilteredCalls]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Banner & Title */}
      {/* Top Banner (Executive Calling Hub) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-950/40 via-[#0c1322] to-indigo-950/40 border border-white/[0.08] p-6 shadow-xl backdrop-blur-md">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-5 pointer-events-none">
          <Phone className="w-64 h-64 text-sky-400" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full text-xs font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 animate-pulse text-sky-400" /> Dedicated Telephonic Calling Head
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-mono font-medium">
                Live Voice Channel
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <span>📞 Yug's Calling Desk</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Call B2B travel agents city-by-city across Punjab, log call responses, payment terms, and capture requirements.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onOpenModal('log_call', { executive_name: 'Yug' })}
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-sky-900/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Log Call Result (Yug)
            </button>
            <button
              onClick={() => { fetchYugDeskData(); fetchLocationMatrix(); }}
              className="p-2 bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 rounded-xl text-xs transition border border-white/[0.08] cursor-pointer"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>


      {/* ========================================================================= */}
      {/* 📅 DATE FILTER & TRACKING TOOLBAR */}
      {/* ========================================================================= */}
      <div className="bg-[#0c1322]/90 border border-white/[0.08] p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-sky-400" />
            <span>CALL TRACKING DATE:</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sky-500/10 text-sky-300 border border-sky-500/20">
            {dateFilterMode === 'month' 
              ? `🗓️ Month: ${selectedMonth} (${dateFilteredCalls.length} Calls Recorded)`
              : dateFilterMode === 'today'
              ? `⚡ Today: ${todayStr} (${dateFilteredCalls.length} Calls)`
              : dateFilterMode === 'yesterday'
              ? `📅 Yesterday (${dateFilteredCalls.length} Calls)`
              : trackingDate
              ? `📅 Date: ${trackingDate} (${dateFilteredCalls.length} Calls)`
              : `🌐 All Recorded Calls (${dateFilteredCalls.length})`
            }
          </span>
        </div>

        {/* Date Filter Buttons — EXACTLY WHERE USER CIRCLED */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Executive Mode Switcher: All Calls vs Yug Only */}
          <div className="flex items-center bg-[#070b14] border border-white/[0.12] p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setExecutiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                executiveFilter === 'all'
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🌐 All Executives</span>
              <span className="text-[10px] font-mono px-1 rounded bg-white/[0.1]">{allCallsCount}</span>
            </button>
            <button
              onClick={() => setExecutiveFilter('yug')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                executiveFilter === 'yug'
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📱 Yug Only</span>
              <span className="text-[10px] font-mono px-1 rounded bg-white/[0.1]">{yugCallsCount}</span>
            </button>
          </div>

          {/* 1. THIS MONTH BUTTON + PICKER (Directly visible, prominent, and vibrant) */}
          <div className={`flex items-center rounded-xl overflow-hidden border transition ${
            dateFilterMode === 'month'
              ? 'border-sky-500 bg-sky-950/60 shadow-md shadow-sky-600/30 ring-1 ring-sky-500'
              : 'border-white/[0.08] bg-[#070b14] hover:border-white/[0.2]'
          }`}>
            <button
              onClick={() => { setDateFilterMode('month'); setTrackingDate(''); }}
              className={`px-3 py-1.5 text-xs font-extrabold transition flex items-center gap-1.5 cursor-pointer ${
                dateFilterMode === 'month'
                  ? 'bg-sky-600 text-white'
                  : 'bg-transparent text-slate-300 hover:bg-white/[0.05]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-white" /> 🗓️ This Month
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => {
                setSelectedMonth(e.target.value);
                setDateFilterMode('month');
                setTrackingDate('');
              }}
              className="bg-slate-900 border-l border-white/[0.1] text-sky-300 font-mono text-xs px-2 py-1 focus:outline-none cursor-pointer"
              title="Click to select any Month"
            />
          </div>

          {/* 2. TODAY BUTTON */}
          <button
            onClick={() => { setDateFilterMode('today'); setTrackingDate(todayStr); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              dateFilterMode === 'today'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08]'
            }`}
          >
            ⚡ Today
          </button>

          {/* 3. YESTERDAY BUTTON */}
          <button
            onClick={() => {
              const y = new Date();
              y.setDate(y.getDate() - 1);
              const yStr = y.toISOString().split('T')[0];
              setDateFilterMode('yesterday');
              setTrackingDate(yStr);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              dateFilterMode === 'yesterday'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08]'
            }`}
          >
            📅 Yesterday
          </button>

          {/* 4. ALL DATES / TOTAL CALLS BUTTON */}
          <button
            onClick={() => { setDateFilterMode('all'); setTrackingDate(''); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              dateFilterMode === 'all'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 font-extrabold'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08]'
            }`}
            title="Show all recorded calls across all dates (Total Calls)"
          >
            🌐 All Calls ({executiveFilter === 'all' ? allCallsCount : yugCallsCount})
          </button>
          
          {/* 5. CUSTOM DATE PICKER */}
          <div className="flex items-center gap-1.5 bg-[#070b14] border border-white/[0.08] px-2.5 py-1 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={trackingDate}
              onChange={e => {
                setTrackingDate(e.target.value);
                setDateFilterMode('custom_date');
              }}
              className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer"
            />
          </div>

          {/* 6. TOGGLE CALL DETAILS */}
          <button
            onClick={() => setShowCallDetails(!showCallDetails)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm cursor-pointer ${
              showCallDetails
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-amber-500/20'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-amber-300 border-amber-500/30'
            }`}
          >
            {showCallDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showCallDetails ? 'Hide Call Details ▲' : `View Calls Breakdown (${dateFilteredCalls.length}) ▼`}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 INTERACTIVE METRICS SUMMARY CARDS (Includes All-Time Total Calls) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Total Agencies */}
        <div className="bg-[#0c1322]/90 border border-white/[0.08] p-4 rounded-xl shadow-sm backdrop-blur-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Punjab Agencies</div>
          <div className="text-2xl font-extrabold font-mono text-sky-400 mt-1">{totalDbAgencies}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Across All Punjab Cities</div>
        </div>

        {/* Card 2: Lifetime Total Calls (ALL TIME) */}
        <div 
          onClick={() => { setDateFilterMode('all'); setTrackingDate(''); }}
          className={`bg-[#0c1322]/90 border p-4 rounded-xl shadow-sm cursor-pointer transition-all duration-150 backdrop-blur-md ${
            dateFilterMode === 'all' 
              ? 'border-sky-500 ring-2 ring-sky-400/40 bg-sky-950/30' 
              : 'border-white/[0.08] hover:border-sky-500/40'
          }`}
          title="Click to show all total calls"
        >
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">TOTAL CALLS (ALL-TIME)</div>
            <span className="text-[9px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/20 px-1.5 py-0.5 rounded font-bold">
              Lifetime
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-sky-400 mt-1">
            {executiveFilter === 'all' ? allCallsCount : yugCallsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {executiveFilter === 'all' ? 'All CRM Telephonic Calls' : 'Total Calls Logged by Yug'}
          </div>
        </div>

        {/* Card 3: Calls Logged in Selected Period (Dynamic Label for Month, Today, Yesterday, Date) */}
        <div 
          onClick={() => setShowCallDetails(!showCallDetails)}
          className="bg-[#0c1322]/90 border border-emerald-500/30 hover:border-emerald-500/60 p-4 rounded-xl shadow-sm cursor-pointer transition-all duration-150 backdrop-blur-md relative group"
        >
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              {dateFilterMode === 'month' 
                ? "THIS MONTH'S CALLS" 
                : dateFilterMode === 'today' 
                ? "TODAY'S CALLS" 
                : dateFilterMode === 'yesterday'
                ? "YESTERDAY'S CALLS"
                : trackingDate
                ? `CALLS ON ${trackingDate}`
                : "ALL RECORDED CALLS"}
            </div>
            <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
              {showCallDetails ? 'Hide ▲' : 'Breakdown ▼'}
            </span>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1 flex items-baseline gap-2">
            <span>{dateFilteredCalls.length}</span>
            {dateFilterMode === 'month' && (
              <span className="text-xs font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-700/60 font-mono">
                {monthlyCoverageRate}%
              </span>
            )}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5 font-medium">
            {dateFilterMode === 'month' 
              ? `${uniqueAgenciesCalledThisMonth} Agencies in ${selectedMonth}` 
              : 'Click to View Breakdown'}
          </div>
        </div>

        {/* Card 4: Connected Calls */}
        <div 
          onClick={() => setShowCallDetails(true)}
          className="bg-[#0c1322]/90 border border-white/[0.08] hover:border-amber-500/40 p-4 rounded-xl shadow-sm cursor-pointer transition-all duration-150 backdrop-blur-md"
        >
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Connected Calls</div>
          <div className="text-2xl font-extrabold font-mono text-amber-400 mt-1">{dateConnectedCount}</div>
          <div className="text-[11px] text-amber-400/80 mt-0.5 font-medium">
            Interested & Connected
          </div>
        </div>

        {/* Card 5: Requirements Recd */}
        <div className="bg-[#0c1322]/90 border border-white/[0.08] p-4 rounded-xl shadow-sm backdrop-blur-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Requirements Recd</div>
          <div className="text-2xl font-extrabold font-mono text-indigo-400 mt-1">{dateRequirementsCount}</div>
          <div className="text-[11px] text-indigo-400/80 mt-0.5 font-medium">
            Inquiries Captured
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap w-full lg:w-auto">
              <button
                onClick={() => { setCallResultFilter('all'); setOnlyWithComments(false); }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  callResultFilter === 'all' && !onlyWithComments
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
              <button
                onClick={() => {
                  setCallResultFilter('With Comments');
                  setOnlyWithComments(false);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  callResultFilter === 'With Comments'
                    ? 'bg-purple-600 text-white shadow shadow-purple-600/30 ring-2 ring-purple-400/50'
                    : 'bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 border border-purple-800/50'
                }`}
                title="Comment Wise Filter: Show all calls with remarks or customer comments"
              >
                💬 Comment Wise ({dateWithCommentsCount})
              </button>
            </div>

            {/* Quick Search & Only Comments Toggle */}
            <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap">
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-700 select-none hover:border-purple-500 transition whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={onlyWithComments || callResultFilter === 'With Comments'}
                  onChange={e => {
                    const checked = e.target.checked;
                    setOnlyWithComments(checked);
                    if (checked && callResultFilter === 'all') {
                      setCallResultFilter('With Comments');
                    } else if (!checked && callResultFilter === 'With Comments') {
                      setCallResultFilter('all');
                    }
                  }}
                  className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span className={`font-bold text-[11px] ${onlyWithComments || callResultFilter === 'With Comments' ? 'text-purple-300' : 'text-slate-400'}`}>
                  💬 Only Comments
                </span>
              </label>

              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={callSearchTerm}
                  onChange={e => setCallSearchTerm(e.target.value)}
                  placeholder="Search agency, mobile, remarks..."
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Calls Table List */}
          {displayedTrackingCalls.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-950 rounded-xl border border-slate-800">
              {dateFilteredCalls.length === 0 
                ? `Iss date (${trackingDate || 'selected'}) par Yug ne koi call record nahi ki.`
                : callResultFilter === 'With Comments' || onlyWithComments
                ? 'Iss date par kisi call me koi comments ya remarks darj nahi hai.'
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

                        {/* Remarks / Customer Response */}
                        <td className="p-3 max-w-xs">
                          {hasCallComment(call) ? (
                            <div className="bg-purple-950/30 border border-purple-800/60 p-2.5 rounded-xl text-slate-200 text-xs shadow-sm space-y-1.5">
                              {call.remarks && call.remarks.trim().toLowerCase() !== 'no specific remarks noted' && (
                                <div>
                                  <span className="text-purple-300 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                    <MessageSquare className="w-2.5 h-2.5 text-purple-400" /> Remarks:
                                  </span>
                                  <span className="text-slate-200 font-medium">"{call.remarks}"</span>
                                </div>
                              )}
                              {call.agent_requirement && call.agent_requirement.trim().toLowerCase() !== 'no specific remarks noted' && (
                                <div className={call.remarks && call.remarks.trim().toLowerCase() !== 'no specific remarks noted' ? "pt-1.5 border-t border-purple-800/40" : ""}>
                                  <span className="text-amber-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 mb-0.5">
                                    <Sparkles className="w-2.5 h-2.5 text-amber-400" /> Requirement:
                                  </span>
                                  <span className="text-amber-200 font-medium">"{call.agent_requirement}"</span>
                                </div>
                              )}
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
                              onClick={() => onOpenModal('log_call', { ...call, id: call.agent_id, executive_name: 'Yug', call_result: 'Call Connected / In Discussion' })}
                              className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] transition shadow cursor-pointer flex items-center gap-1"
                              title="Log Call / Follow-up"
                            >
                              <PhoneCall className="w-3 h-3" /> 📞 Follow-up
                            </button>
                            <button
                              onClick={async () => {
                                const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                                try {
                                  const res = await fetch(`/api/calls/${call.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      call_result: 'Call Again Later',
                                      next_followup_date: tomorrow,
                                      remarks: call.remarks || 'Rescheduled to Call Again Later'
                                    })
                                  });
                                  const j = await res.json();
                                  if (j.success) {
                                    fetchYugDeskData();
                                    alert(`🔄 Rescheduled Call Again Later for Tomorrow (${tomorrow})!`);
                                  }
                                } catch (e) { alert(e.message); }
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/80 font-semibold text-[11px] transition cursor-pointer flex items-center gap-1"
                              title="Reschedule to Call Tomorrow"
                            >
                              <Clock className="w-3 h-3 text-amber-400" /> 🔄 Again Call
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Mark follow-up for "${call.company_name}" as CLOSED?`)) {
                                  try {
                                    const res = await fetch(`/api/calls/${call.id}`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({
                                        call_result: 'Closed - Not Interested',
                                        next_followup_date: '',
                                        remarks: 'Marked as Closed'
                                      })
                                    });
                                    const j = await res.json();
                                    if (j.success) {
                                      fetchYugDeskData();
                                      alert('❌ Follow-up marked as Closed!');
                                    }
                                  } catch (e) { alert(e.message); }
                                }
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 font-semibold text-[11px] transition cursor-pointer flex items-center gap-1"
                              title="Mark as Closed"
                            >
                              <X className="w-3 h-3 text-rose-400" /> ❌ Closed
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
      {/* 📍 SCREENSHOT INTERFACE: LOCATION-WISE CALLING COVERAGE & CONVERSION MATRIX */}
      {/* ========================================================================= */}
      <div id="location-matrix-section" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        
        {/* Matrix Header & View Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              <h3 className="text-xl font-black text-white">
                {matrixViewTab === 'calling' 
                  ? `📞 Yug's Monthly Calling Coverage Matrix (${selectedMonth})` 
                  : '📍 Field Visits & Conversion Matrix'}
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              {matrixViewTab === 'calling'
                ? 'यहाँ देखें Yug ने किस शहर में कितने एजेंट्स को कॉल कर लिया है और कितने पेंडिंग हैं:'
                : 'Click any location row or "Open & Manage" button to filter and call agencies city-by-city'}
            </p>
          </div>

          {/* View Mode Toggle Switch */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setMatrixViewTab('calling')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                matrixViewTab === 'calling'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" /> Calling Coverage ({monthlyCoverageRate}%)
            </button>
            <button
              onClick={() => setMatrixViewTab('conversion')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                matrixViewTab === 'conversion'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" /> Field Visits & Revenue
            </button>
          </div>
        </div>

        {/* Filter & Sort Controls for Calling Matrix */}
        {matrixViewTab === 'calling' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
            {/* Calling Status Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Status:</span>
              <button
                onClick={() => setMatrixCallingStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  matrixCallingStatusFilter === 'all'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All ({sortedMatrix.length})
              </button>
              <button
                onClick={() => setMatrixCallingStatusFilter('in_progress')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  matrixCallingStatusFilter === 'in_progress'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-900 text-amber-300 hover:bg-amber-950/30 border border-amber-800/40'
                }`}
              >
                🟡 In Progress ({matrixInProgressCount})
              </button>
              <button
                onClick={() => setMatrixCallingStatusFilter('not_started')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  matrixCallingStatusFilter === 'not_started'
                    ? 'bg-rose-600 text-white'
                    : 'bg-slate-900 text-rose-300 hover:bg-rose-950/30 border border-rose-800/40'
                }`}
              >
                🔴 Not Started ({matrixNotStartedCount})
              </button>
              <button
                onClick={() => setMatrixCallingStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  matrixCallingStatusFilter === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-emerald-300 hover:bg-emerald-950/30 border border-emerald-800/40'
                }`}
              >
                🟢 100% Done ({matrixCompletedCount})
              </button>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto text-xs">
              <span className="text-slate-400 font-medium mr-1">Sort:</span>
              <button
                onClick={() => setMatrixSort(matrixSort === 'pending_desc' ? 'pending_asc' : 'pending_desc')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 border cursor-pointer ${
                  matrixSort.startsWith('pending') ? 'bg-rose-950 text-rose-300 border-rose-700 shadow-sm' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Sort by highest pending agencies"
              >
                🔴 Pending Calls
              </button>
              <button
                onClick={() => setMatrixSort(matrixSort === 'called_desc' ? 'called_asc' : 'called_desc')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 border cursor-pointer ${
                  matrixSort.startsWith('called') ? 'bg-emerald-950 text-emerald-300 border-emerald-700 shadow-sm' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
                title="Sort by highest called agencies"
              >
                🟢 Called
              </button>
              <button
                onClick={() => setMatrixSort('coverage_desc')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 border cursor-pointer ${
                  matrixSort === 'coverage_desc' ? 'bg-sky-950 text-sky-300 border-sky-700 shadow-sm' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                Coverage %
              </button>
              <button
                onClick={() => setMatrixSort(matrixSort === 'loc_asc' ? 'loc_desc' : 'loc_asc')}
                className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 border cursor-pointer ${
                  matrixSort.startsWith('loc') ? 'bg-indigo-950 text-indigo-300 border-indigo-700 shadow-sm' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                City ({matrixSort === 'loc_asc' ? 'A→Z' : 'Z→A'})
              </button>
            </div>
          </div>
        )}

        {/* Sort Controls for Conversion Matrix Tab */}
        {matrixViewTab === 'conversion' && (
          <div className="flex items-center justify-end gap-2 text-xs">
            <span className="text-slate-400 font-medium">Sort By:</span>
            <button
              onClick={() => setMatrixSort(matrixSort === 'loc_asc' ? 'loc_desc' : 'loc_asc')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 border cursor-pointer ${
                matrixSort.startsWith('loc') ? 'bg-sky-950 text-sky-400 border-sky-800' : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <ArrowUpDown className="w-3 h-3" /> Location ({matrixSort === 'loc_asc' ? 'A → Z' : 'Z → A'})
            </button>
            <button
              onClick={() => setMatrixSort('agents_desc')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 border cursor-pointer ${
                matrixSort === 'agents_desc' ? 'bg-sky-600 text-white border-sky-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <Users className="w-3 h-3" /> Total Agents
            </button>
            <button
              onClick={() => setMatrixSort('revenue_desc')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 border cursor-pointer ${
                matrixSort === 'revenue_desc' ? 'bg-amber-950 text-amber-400 border-amber-800' : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
              }`}
            >
              <DollarSign className="w-3 h-3" /> Revenue
            </button>
          </div>
        )}

        {/* Location Matrix Table */}
        {loadingMatrix ? (
          <div className="p-8 text-center text-slate-400 text-xs">⏳ Loading location matrix...</div>
        ) : matrixViewTab === 'calling' ? (
          /* ========================================================= */
          /* 📞 YUG'S MONTHLY CALLING COVERAGE TABLE */
          /* ========================================================= */
          <div className="overflow-x-auto border border-slate-800 rounded-xl shadow-inner">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Territory / Location</th>
                  <th className="p-3.5 text-center">Total Agents</th>
                  <th className="p-3.5 text-center">{executiveFilter === 'all' ? 'All Called' : 'Yug Called'} ({selectedMonth})</th>
                  <th className="p-3.5 text-center">Pending Calls</th>
                  <th className="p-3.5 text-center">Calling Coverage</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {filteredMatrix.map((loc) => {
                  const isCurrentSelected = selectedCity === loc.location;
                  const called = loc.yug_called_month || 0;
                  const pending = loc.yug_pending_month != null ? loc.yug_pending_month : Math.max(0, loc.total_agents - called);
                  const rate = loc.yug_coverage_rate || 0;
                  const isCompleted = rate === 100;
                  const isNotStarted = called === 0;

                  return (
                    <tr
                      key={loc.location}
                      onClick={() => handleSelectCityFromMatrix(loc.location, pending > 0 ? 'pending' : 'all')}
                      className={`hover:bg-sky-950/40 cursor-pointer transition ${
                        isCurrentSelected ? 'bg-sky-950/60 border-l-4 border-sky-400 font-semibold' : ''
                      }`}
                    >
                      {/* Territory / Location */}
                      <td className="p-3.5 font-bold text-white flex items-center gap-2">
                        <MapPin className={`w-4 h-4 ${isCompleted ? 'text-emerald-400' : isNotStarted ? 'text-rose-400' : 'text-amber-400'}`} />
                        <span className="text-sm">{loc.location}</span>
                        {isCurrentSelected && (
                          <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/40">Selected</span>
                        )}
                      </td>

                      {/* Total Agents */}
                      <td className="p-3.5 text-center font-bold text-slate-100 text-sm">{loc.total_agents}</td>

                      {/* Yug Called This Month */}
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-mono">
                          🟢 {called}
                        </span>
                      </td>

                      {/* Pending Calls */}
                      <td className="p-3.5 text-center">
                        {pending > 0 ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-950 text-rose-400 border border-rose-800/80 font-mono">
                            🔴 {pending} Pending
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                            0 (Done)
                          </span>
                        )}
                      </td>

                      {/* Monthly Calling Progress Bar */}
                      <td className="p-3.5 text-center min-w-[140px]">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                isCompleted ? 'bg-emerald-400' : rate > 0 ? 'bg-amber-400' : 'bg-slate-700'
                              }`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-slate-200">{rate}%</span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5 text-center">
                        {isCompleted ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/80 flex items-center justify-center gap-1 mx-auto w-max">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> 100% Complete
                          </span>
                        ) : isNotStarted ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800/80 flex items-center justify-center gap-1 mx-auto w-max">
                            <AlertCircle className="w-3 h-3 text-rose-400" /> Not Started
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-950 text-amber-300 border border-amber-700/80 flex items-center justify-center gap-1 mx-auto w-max">
                            <Clock className="w-3 h-3 text-amber-400" /> In Progress
                          </span>
                        )}
                      </td>

                      {/* 1-Click Action Button */}
                      <td className="p-3.5 text-center" onClick={e => e.stopPropagation()}>
                        {pending > 0 ? (
                          <button
                            onClick={() => handleSelectCityFromMatrix(loc.location, 'pending')}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-md shadow-rose-950/40 flex items-center gap-1.5 mx-auto transition cursor-pointer"
                            title={`Call ${pending} pending agencies in ${loc.location}`}
                          >
                            <PhoneCall className="w-3.5 h-3.5" /> Call {pending} Pending
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectCityFromMatrix(loc.location, 'all')}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60 shadow flex items-center gap-1.5 mx-auto transition cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" /> View Queue
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ========================================================= */
          /* 📍 FIELD VISITS & CONVERSION TABLE (EXISTING TAB) */
          /* ========================================================= */
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
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5 mx-auto cursor-pointer ${
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
      {/* 📞 CALLING AGENTS QUEUE GRID (PENDING & CALLED TABS + CALL STATUS BADGES) */}
      {/* ========================================================================= */}
      <div id="calling-queue-section" className="scroll-mt-24 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-400" /> B2B Agent Calling Queue ({filteredAgentsList.length} shown {selectedCity ? `in ${selectedCity}` : ''})
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click 1-Click WhatsApp, Call Now, or Log Call to record agent requirements and response
            </p>
          </div>

          {/* Queue Filter Tabs: Pending / Called / All */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setQueueCallingFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                queueCallingFilter === 'pending'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                  : 'text-rose-300 hover:text-white hover:bg-rose-950/30'
              }`}
            >
              <span>🔴 Pending ({queuePendingCount})</span>
            </button>
            <button
              onClick={() => setQueueCallingFilter('called')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                queueCallingFilter === 'called'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-emerald-300 hover:text-white hover:bg-emerald-950/30'
              }`}
            >
              <span>🟢 Called ({queueCalledCount})</span>
            </button>
            <button
              onClick={() => setQueueCallingFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                queueCallingFilter === 'all'
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>All ({agents.length})</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center text-slate-400 text-sm">
            ⏳ Loading agents calling queue...
          </div>
        ) : filteredAgentsList.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center text-slate-300 text-sm space-y-2">
            {queueCallingFilter === 'pending' ? (
              <>
                <div className="text-3xl">🎉</div>
                <div className="font-bold text-white text-base">Sabhi Agents Cover Ho Chuke Hain!</div>
                <div className="text-xs text-slate-400 max-w-md mx-auto">
                  {selectedCity ? `${selectedCity} ke sabhi travel agencies ko is mahine Yug dwara call kiya ja chuka hai.` : 'Selected filters me koi pending call nahi hai.'}
                </div>
                <button
                  onClick={() => setQueueCallingFilter('all')}
                  className="mt-3 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  View All Agencies in this City
                </button>
              </>
            ) : queueCallingFilter === 'called' ? (
              <>
                <div className="text-3xl">📞</div>
                <div className="font-bold text-white text-base">Is Filter me Abhi Koi Call Logged Nahi Hai</div>
                <div className="text-xs text-slate-400 max-w-md mx-auto">
                  Neeche ya "Pending" tab me jaakar calling shuru karein.
                </div>
                <button
                  onClick={() => setQueueCallingFilter('pending')}
                  className="mt-3 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  View Pending Agencies to Call
                </button>
              </>
            ) : (
              <div>No travel agencies match the selected filter criteria.</div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgentsList.map((agent) => {
              const monthCall = yugAgentMonthMap[agent.id];
              const isCalled = !!monthCall;

              return (
                <div 
                  key={agent.id} 
                  className={`bg-slate-900 border rounded-xl p-4 transition shadow flex flex-col justify-between space-y-3 ${
                    isCalled 
                      ? 'border-emerald-800/50 hover:border-emerald-600/80 bg-slate-900/90' 
                      : 'border-slate-800 hover:border-sky-600/80'
                  }`}
                >
                  <div>
                    {/* Monthly Calling Status Banner */}
                    <div className="mb-2.5">
                      {isCalled ? (
                        <div className="flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-[11px] font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Called: {monthCall.call_date}</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-300/90 bg-emerald-900/60 px-1.5 py-0.5 rounded">
                            {monthCall.call_result || 'Completed'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-800/60 text-rose-300 text-[11px] font-bold">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>🔴 Pending Call in {selectedMonth}</span>
                        </div>
                      )}
                    </div>

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

                    {/* Remarks snippet if available from this month's call */}
                    {monthCall && (monthCall.remarks || monthCall.agent_requirement) && (
                      <div className="mt-2 text-[11px] text-slate-300 bg-purple-950/30 border border-purple-800/40 p-2 rounded-lg space-y-1">
                        {monthCall.remarks && monthCall.remarks.trim().toLowerCase() !== 'no specific remarks noted' && (
                          <div>
                            <span className="text-purple-400 font-bold">Remarks: </span>
                            <span>"{monthCall.remarks}"</span>
                          </div>
                        )}
                        {monthCall.agent_requirement && (
                          <div>
                            <span className="text-amber-400 font-bold">Req: </span>
                            <span className="text-amber-200">"{monthCall.agent_requirement}"</span>
                          </div>
                        )}
                      </div>
                    )}
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
              );
            })}
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
            <button
              onClick={() => setBottomOnlyComments(!bottomOnlyComments)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 border ${
                bottomOnlyComments
                  ? 'bg-purple-600 text-white border-purple-500 shadow shadow-purple-600/30'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              💬 With Comments ({callsHistory.filter(c => (!callDateFilter || c.call_date === callDateFilter) && hasCallComment(c)).length})
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
              ({callsHistory.filter(c => (!callDateFilter || c.call_date === callDateFilter) && (!bottomOnlyComments || hasCallComment(c))).length})
            </span>
          </div>
        </div>

        {callsHistory.filter(c => (!callDateFilter || c.call_date === callDateFilter) && (!bottomOnlyComments || hasCallComment(c))).length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-8">
            {bottomOnlyComments 
              ? 'Selected filter me kisi call par comments ya remarks darj nahi hai.'
              : 'No calls recorded for this date filter. Click "+ Log Call Result (Yug)" to record a call.'}
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
                  <th className="p-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {callsHistory.filter(c => (!callDateFilter || c.call_date === callDateFilter) && (!bottomOnlyComments || hasCallComment(c))).slice(0, 50).map((c, i) => (
                  <tr key={c.id || i} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-medium text-slate-300">{c.call_date}</td>
                    <td className="p-3">
                      <span className="font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 text-[10px]">
                        {c.executive_name || 'Yug'}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white cursor-pointer hover:text-sky-400" onClick={() => onOpenAgentDrawer && onOpenAgentDrawer(c.agent_id)}>
                      {c.company_name || c.agent_id}
                    </td>
                    <td className="p-3 font-mono text-slate-300">{c.agent_mobile || c.mobile || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        (c.call_result || '').toLowerCase().includes('again')
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : (c.call_result || '').toLowerCase().includes('closed')
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : 'text-amber-400'
                      }`}>
                        {c.call_result}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-emerald-400">{c.payment_terms || 'Advance Payment'}</td>
                    <td className="p-3 max-w-xs truncate text-slate-400">{c.agent_requirement || c.remarks || '-'}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenModal('log_call', {
                            agent_id: c.agent_id,
                            company_name: c.company_name,
                            mobile: c.agent_mobile || c.mobile,
                            executive_name: 'Yug',
                            call_date: new Date().toISOString().split('T')[0],
                            call_result: 'Call Connected / In Discussion'
                          })}
                          className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] transition cursor-pointer"
                          title="Log New Call Today"
                        >
                          📞 Call
                        </button>
                        <button
                          onClick={() => onOpenModal('log_call', {
                            ...c,
                            call_id: c.id,
                            id: c.id,
                            agent_id: c.agent_id,
                            executive_name: c.executive_name || 'Yug'
                          })}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[10px] transition border border-slate-700 cursor-pointer"
                          title="Edit Call Record"
                        >
                          ✏️ Edit
                        </button>
                      </div>
                    </td>
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
