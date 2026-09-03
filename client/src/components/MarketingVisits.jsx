import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Calendar, CheckCircle2, User, Phone, Tag, FileText, Filter, X, Trash2, Download, AlertCircle, Navigation, Search, Gauge, DollarSign, Flag, Clock, UserPlus, Edit, Compass, Sparkles } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';
import BikramPwaInstallBanner from './BikramPwaInstallBanner';
import RoutePlannerTester from './RoutePlannerTester';

export default function MarketingVisits({ onOpenModal, onOpenAgentDrawer, role }) {
  const isAdmin = role === 'Admin / Owner' || !role;
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [execFilter, setExecFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Location Agent Checklist state for field marketing route
  const [availableLocations, setAvailableLocations] = useState({ cities: [], areas: [] });
  const [selectedLocation, setSelectedLocation] = useState('');
  const [locationAgents, setLocationAgents] = useState([]);
  const [loadingLocationAgents, setLoadingLocationAgents] = useState(false);
  const [checklistStatusFilter, setChecklistStatusFilter] = useState('all'); // 'all' | 'visited' | 'pending'
  const [checklistFromDate, setChecklistFromDate] = useState('');
  const [checklistToDate, setChecklistToDate] = useState('');

  // Odometer & Conveyance Field Trip state
  const [fieldTrips, setFieldTrips] = useState([]);
  const [dayReport, setDayReport] = useState([]);
  const [startKmInput, setStartKmInput] = useState('');
  const [endKmInput, setEndKmInput] = useState('');

  // Safe Beta Tester state for Nearby Agents Route Planner
  const [showRouteTester, setShowRouteTester] = useState(false);

  useEffect(() => {
    fetchVisits();
    fetchFieldTrips();
    fetchDayReport();
  }, [execFilter, cityFilter, dateFilter, fromDate, toDate]);

  useEffect(() => {
    // Fetch dynamic cities & areas from actual imported agents DB
    fetch('/api/agents/locations')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setAvailableLocations(json);
          if (!selectedLocation) {
            setSelectedLocation('ALL');
          }
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchLocationAgents(selectedLocation, checklistFromDate, checklistToDate);
  }, [selectedLocation, visits, checklistFromDate, checklistToDate]);

  const fetchLocationAgents = async (loc = selectedLocation, fDate = checklistFromDate, tDate = checklistToDate) => {
    setLoadingLocationAgents(true);
    try {
      let url = `/api/agents?limit=1500`;
      if (loc && loc !== 'ALL' && loc !== 'All Locations') {
        url += `&location=${encodeURIComponent(loc)}`;
      }
      if (fDate) url += `&visit_from_date=${encodeURIComponent(fDate)}`;
      if (tDate) url += `&visit_to_date=${encodeURIComponent(tDate)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setLocationAgents(json.agents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLocationAgents(false);
    }
  };

  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const setChecklistPreset = (preset) => {
    const today = new Date();

    if (preset === 'all') {
      setChecklistFromDate('');
      setChecklistToDate('');
    } else if (preset === 'today') {
      const dateStr = formatLocalDate(today);
      setChecklistFromDate(dateStr);
      setChecklistToDate(dateStr);
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const dateStr = formatLocalDate(y);
      setChecklistFromDate(dateStr);
      setChecklistToDate(dateStr);
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setChecklistFromDate(formatLocalDate(firstDay));
      setChecklistToDate(formatLocalDate(today));
    }
  };

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (execFilter) params.append('executive', execFilter);
      if (cityFilter) params.append('city', cityFilter);
      if (dateFilter) params.append('date', dateFilter);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);

      const res = await fetch(`/api/visits?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setVisits(json.visits);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFieldTrips = async () => {
    try {
      const res = await fetch('/api/field-trips');
      const json = await res.json();
      if (json.success) {
        setFieldTrips(json.trips);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDayReport = async () => {
    try {
      const res = await fetch('/api/field-trips/report');
      const json = await res.json();
      if (json.success) {
        setDayReport(json.report);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartTrip = async (e) => {
    e.preventDefault();
    if (!startKmInput || isNaN(startKmInput)) {
      alert('Please enter valid Start Meter Reading KM');
      return;
    }
    try {
      const res = await fetch('/api/field-trips/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_date: new Date().toISOString().split('T')[0],
          executive_name: 'Bikramjit Singh',
          start_meter_reading: parseFloat(startKmInput),
          start_location: 'Office Departure',
          rate_per_km: 3.0
        })
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setStartKmInput('');
        fetchFieldTrips();
        fetchDayReport();
      }
    } catch (err) {
      alert('Error starting field trip');
    }
  };

  const handleEndTrip = async (e, tripId) => {
    e.preventDefault();
    if (!endKmInput || isNaN(endKmInput)) {
      alert('Please enter valid End Meter Reading KM');
      return;
    }
    try {
      const res = await fetch(`/api/field-trips/end/${tripId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          end_meter_reading: parseFloat(endKmInput),
          end_location: 'Office Return'
        })
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setEndKmInput('');
        fetchFieldTrips();
        fetchDayReport();
      }
    } catch (err) {
      alert('Error ending field trip');
    }
  };

  const handleClearAllConveyance = async () => {
    if (!isAdmin) {
      alert('🔒 Access Denied: Only Admin can clear conveyance trip records!');
      return;
    }
    if (!window.confirm('⚠️ Are you sure you want to CLEAR ALL conveyance trip records? This action is for Admin only!')) return;
    try {
      const res = await fetch('/api/field-trips/clear-all', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchFieldTrips();
        fetchDayReport();
      }
    } catch (err) {
      alert('Error clearing conveyance logs');
    }
  };

  const handleDeleteTrip = async (tripId) => {
    if (!isAdmin) {
      alert('🔒 Access Denied: Only Admin can delete conveyance trip logs!');
      return;
    }
    if (!window.confirm('🗑️ Delete this trip log?')) return;
    try {
      const res = await fetch(`/api/field-trips/${tripId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        fetchFieldTrips();
        fetchDayReport();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVisit = async (visitId) => {
    if (!isAdmin) {
      alert('🔒 Access Denied: Only Admin can delete marketing visit records!');
      return;
    }
    if (!window.confirm('🗑️ Are you sure you want to delete this marketing visit record?')) return;
    try {
      const res = await fetch(`/api/visits/${visitId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert('Marketing visit deleted successfully');
        fetchVisits();
      }
    } catch (err) {
      alert('Error deleting visit');
    }
  };

  const clearDateFilters = () => {
    setDateFilter('');
    setFromDate('');
    setToDate('');
  };

  const handleExportPDF = () => {
    const headers = ['Visit Date', 'Executive', 'Agency Firm', 'City', 'Person Met', 'Mobile', 'Interest Level', 'Remarks'];
    const rows = visits.map(v => [
      v.visit_date,
      v.executive_name,
      v.company_name,
      v.agent_city,
      v.person_met,
      v.mobile,
      v.response_level,
      v.remarks
    ]);
    exportToPDF('Stage 1 – Field Marketing Visits Report', 'Physical Agency Visits Logged Location-wise', headers, rows);
  };

  // Active ongoing trip
  const activeTrip = fieldTrips.find(t => t.status === 'Ongoing');
  const completedTrips = fieldTrips.filter(t => t.status === 'Completed');
  const totalKmSum = completedTrips.reduce((acc, t) => acc + (t.total_km || 0), 0);
  const totalConveyanceSum = completedTrips.reduce((acc, t) => acc + (t.conveyance_amount || 0), 0);

  // Location Agent Checklist Summary Statistics
  const totalInCity = locationAgents.length;
  const visitedInCity = locationAgents.filter(a => Boolean(a.last_visit_date)).length;
  const pendingInCity = totalInCity - visitedInCity;

  // Filtered Checklist agents based on status filter (all / visited / pending)
  const filteredLocationAgents = locationAgents.filter(ag => {
    const isVisited = Boolean(ag.last_visit_date);
    if (checklistStatusFilter === 'visited') return isVisited;
    if (checklistStatusFilter === 'pending') return !isVisited;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* PWA Install Banner specifically for Bikramjit */}
      <BikramPwaInstallBanner role={role} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-yellow-500" /> Stage 1 – Field Marketing Visits
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track daily physical agency visits & motorcycle odometer conveyance (Bikramjit Singh)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/export/visits"
            className="px-3.5 py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white font-medium rounded-xl text-xs transition shadow flex items-center gap-1.5 border border-emerald-600"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel (.xlsx)
          </a>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-sky-700/80 hover:bg-sky-600 text-white font-medium rounded-xl text-xs transition shadow flex items-center gap-1.5 border border-sky-600"
          >
            <FileText className="w-3.5 h-3.5" /> Download PDF
          </button>
          <button
            onClick={() => setShowRouteTester(!showRouteTester)}
            className={`px-3.5 py-2 font-extrabold rounded-xl text-xs transition shadow-lg flex items-center gap-1.5 border cursor-pointer ${
              showRouteTester
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                : 'bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 border-emerald-600/70 shadow-emerald-950/40'
            }`}
          >
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>{showRouteTester ? '✕ Close Route Planner' : '🧪 Test: Route Planner'}</span>
          </button>
          <button
            onClick={() => onOpenModal('create_agent')}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-sky-600/20 flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" /> Add New Agent
          </button>
          <button
            onClick={() => onOpenModal('log_visit')}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-yellow-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Log Marketing Visit
          </button>
        </div>
      </div>

      {/* 🧪 SAFE BETA TESTER: Nearby Agents Route Planner */}
      {showRouteTester && (
        <RoutePlannerTester
          onClose={() => setShowRouteTester(false)}
          onOpenModal={onOpenModal}
          onOpenAgentDrawer={onOpenAgentDrawer}
        />
      )}

      {/* 🏍️ ODOMETER & CONVEYANCE TRACKER CARD */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/40 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-indigo-300 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-indigo-400" /> 🏍️ Motorcycle Odometer & Conveyance Tracker (Bikramjit Singh)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Log motorcycle meter reading on leaving & returning to office for 100% exact conveyance calculation!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-full border border-emerald-800">
              Total KM: {totalKmSum} KM
            </span>
            <span className="text-xs font-bold text-amber-400 bg-amber-950 px-2.5 py-1 rounded-full border border-amber-800">
              Total Conveyance: ₹{totalConveyanceSum.toLocaleString('en-IN')}
            </span>
            {isAdmin && (
              <button
                onClick={handleClearAllConveyance}
                className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-full text-xs transition border border-rose-800 flex items-center gap-1 font-semibold"
                title="Admin Only: Clear all conveyance trip logs"
              >
                <Trash2 className="w-3 h-3" /> Clear Conveyance
              </button>
            )}
          </div>
        </div>

        {/* 2-SECTION ENTRY FORMS (Departure Start KM & Return End KM) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Section 1: Morning Office Departure (Start KM) */}
          <form onSubmit={handleStartTrip} className="bg-emerald-950/20 border border-emerald-800/50 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" /> 1. Office Departure (Start KM)
              </h4>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Morning Departure
              </span>
            </div>
            <p className="text-xs text-slate-400">Enter speedometer reading before leaving office</p>

            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="Start KM (e.g. 12450)..."
                value={startKmInput}
                onChange={e => setStartKmInput(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-emerald-400 w-full"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow flex items-center gap-1.5 whitespace-nowrap"
              >
                <Gauge className="w-4 h-4" /> Start Field Trip
              </button>
            </div>
          </form>

          {/* Section 2: Evening Office Return (End KM) */}
          <form
            onSubmit={(e) => {
              if (activeTrip) {
                handleEndTrip(e, activeTrip.id);
              } else if (fieldTrips.length > 0) {
                handleEndTrip(e, fieldTrips[0].id);
              } else {
                alert('Please log Start KM departure first!');
              }
            }}
            className={`p-4 rounded-xl space-y-3 border transition ${
              activeTrip ? 'bg-rose-950/30 border-rose-800 animate-pulse' : 'bg-slate-950/40 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-rose-300 text-sm flex items-center gap-1.5">
                <Flag className="w-4 h-4 text-rose-400" /> 2. Office Return (End KM)
              </h4>
              {activeTrip ? (
                <span className="text-[10px] text-rose-300 font-bold bg-rose-950 px-2 py-0.5 rounded border border-rose-800 animate-bounce">
                  🚀 Trip Active ({activeTrip.start_time})
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  Evening Return
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {activeTrip ? `Start Odometer was: ${activeTrip.start_meter_reading} KM. Enter final meter reading.` : 'Enter speedometer reading upon returning back to office'}
            </p>

            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                placeholder="End KM (e.g. 12512)..."
                value={endKmInput}
                onChange={e => setEndKmInput(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-100 font-mono text-sm px-3 py-2 rounded-xl focus:outline-none focus:border-rose-400 w-full"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow flex items-center gap-1.5 whitespace-nowrap"
              >
                <Flag className="w-4 h-4" /> End Trip & Calculate
              </button>
            </div>
          </form>

        </div>

        {/* 📊 DAY-WISE ADMIN CONVEYANCE REPORT SUMMARY TABLE */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Day-Wise Admin Conveyance Report Summary:
          </h4>

          {dayReport.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No completed trip reports yet. Log Start & End KM above!</p>
          ) : (
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Executive</th>
                    <th className="p-2.5">Day Start KM</th>
                    <th className="p-2.5">Day End KM</th>
                    <th className="p-2.5">Total Distance (KM)</th>
                    <th className="p-2.5">Rate / KM</th>
                    <th className="p-2.5">Day Conveyance Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {dayReport.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-mono font-bold text-slate-200">{r.trip_date}</td>
                      <td className="p-2.5 font-semibold text-slate-300">{r.executive_name}</td>
                      <td className="p-2.5 font-mono text-emerald-400">{r.day_start_km || '--'} KM</td>
                      <td className="p-2.5 font-mono text-rose-400">{r.day_end_km || '--'} KM</td>
                      <td className="p-2.5 font-bold font-mono text-sky-400">{r.total_day_km || 0} KM</td>
                      <td className="p-2.5 text-slate-400 font-mono">₹3.00 / KM</td>
                      <td className="p-2.5 font-extrabold font-mono text-amber-400">₹{(r.total_day_conveyance || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* 📍 Field Location Route & Agent Checklist */}
      <div className="bg-slate-900 border border-yellow-500/40 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-yellow-400 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-yellow-500" /> 📍 Field Location Agent Checklist (Zero Missed Visits)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select or type any Location/City/Area from your agent database to view all registered travel agencies for that route!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Location Select Dropdown from DB */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-slate-950 border border-yellow-500/60 text-yellow-300 font-bold rounded-xl text-xs px-3 py-2 focus:outline-none focus:border-yellow-400"
            >
              <option value="ALL">🌐 All Locations / All Cities</option>
              {availableLocations.cities.map((c, i) => (
                <option key={i} value={c}>📍 {c}</option>
              ))}
            </select>

            {/* Type custom location / area search input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Type City / Area..."
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-yellow-400 w-36 sm:w-44 font-medium"
              />
            </div>
          </div>
        </div>

        {/* 🔍 DATE RANGE & STATUS FILTERS TOOLBAR */}
        <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* 📅 Date Range Filter */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-yellow-400" /> Visit Date Range:
              </span>

              {/* From Date */}
              <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                <span className="text-[11px] text-slate-400">From:</span>
                <input
                  type="date"
                  value={checklistFromDate}
                  onChange={(e) => setChecklistFromDate(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs focus:outline-none font-medium"
                />
              </div>

              {/* To Date */}
              <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                <span className="text-[11px] text-slate-400">To:</span>
                <input
                  type="date"
                  value={checklistToDate}
                  onChange={(e) => setChecklistToDate(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs focus:outline-none font-medium"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(() => {
                  const todayStr = formatLocalDate(new Date());
                  const yest = new Date();
                  yest.setDate(yest.getDate() - 1);
                  const yestStr = formatLocalDate(yest);
                  const isTodayActive = checklistFromDate === todayStr && checklistToDate === todayStr;
                  const isYesterdayActive = checklistFromDate === yestStr && checklistToDate === yestStr;

                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => setChecklistPreset('all')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition ${
                          !checklistFromDate && !checklistToDate
                            ? 'bg-yellow-500 text-slate-950 shadow'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        All Time
                      </button>
                      <button
                        type="button"
                        onClick={() => setChecklistPreset('today')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition ${
                          isTodayActive
                            ? 'bg-yellow-500 text-slate-950 shadow'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setChecklistPreset('yesterday')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition ${
                          isYesterdayActive
                            ? 'bg-yellow-500 text-slate-950 shadow'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        Yesterday
                      </button>
                      <button
                        type="button"
                        onClick={() => setChecklistPreset('month')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition ${
                          checklistFromDate && !isTodayActive && !isYesterdayActive
                            ? 'bg-yellow-500 text-slate-950 shadow'
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        This Month
                      </button>

                      {/* Day-Wise Specific Date Picker */}
                      <div className="flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                        <Calendar className="w-3 h-3 text-yellow-400" />
                        <span className="text-[10px] text-slate-400 font-bold hidden sm:inline">Pick Day:</span>
                        <input
                          type="date"
                          value={checklistFromDate === checklistToDate ? checklistFromDate : ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setChecklistFromDate(val);
                            setChecklistToDate(val);
                          }}
                          className="bg-slate-950 text-yellow-300 text-[11px] font-bold border-none focus:outline-none cursor-pointer"
                        />
                      </div>
                    </>
                  );
                })()}
                {(checklistFromDate || checklistToDate) && (
                  <button
                    type="button"
                    onClick={() => setChecklistPreset('all')}
                    className="p-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-md transition border border-rose-800/60"
                    title="Clear Date Filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* 🏷️ Status Filter Tabs (All / Visited / Pending) */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setChecklistStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  checklistStatusFilter === 'all'
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({totalInCity})
              </button>
              <button
                type="button"
                onClick={() => setChecklistStatusFilter('visited')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  checklistStatusFilter === 'visited'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-emerald-400 hover:bg-emerald-950/40'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Visited ({visitedInCity})
              </button>
              <button
                type="button"
                onClick={() => setChecklistStatusFilter('pending')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  checklistStatusFilter === 'pending'
                    ? 'bg-rose-600 text-white shadow'
                    : 'text-rose-400 hover:bg-rose-950/40'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" /> Pending ({pendingInCity})
              </button>
            </div>

          </div>
        </div>

        {/* Location Summary Cards (Interactive Filter Triggers) */}
        {selectedLocation && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setChecklistStatusFilter('all')}
              className={`text-left bg-slate-950/80 p-3 rounded-xl flex items-center justify-between border transition cursor-pointer ${
                checklistStatusFilter === 'all'
                  ? 'border-sky-500 ring-1 ring-sky-500 shadow-lg shadow-sky-500/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <p className="text-xs text-slate-400 font-semibold">Agencies in "{selectedLocation === 'ALL' || !selectedLocation ? 'All Locations' : selectedLocation}"</p>
                <p className="text-xl font-extrabold text-slate-100">{totalInCity}</p>
              </div>
              <MapPin className="w-6 h-6 text-sky-400" />
            </button>

            <button
              type="button"
              onClick={() => setChecklistStatusFilter('visited')}
              className={`text-left bg-emerald-950/20 p-3 rounded-xl flex items-center justify-between border transition cursor-pointer ${
                checklistStatusFilter === 'visited'
                  ? 'border-emerald-500 ring-1 ring-emerald-500 shadow-lg shadow-emerald-500/10'
                  : 'border-emerald-800/50 hover:border-emerald-700/60'
              }`}
            >
              <div>
                <p className="text-xs text-emerald-400 font-semibold">
                  ✅ Visited Agencies {checklistFromDate || checklistToDate ? '(Selected Period)' : ''}
                </p>
                <p className="text-xl font-extrabold text-emerald-400">{visitedInCity}</p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </button>

            <button
              type="button"
              onClick={() => setChecklistStatusFilter('pending')}
              className={`text-left bg-rose-950/20 p-3 rounded-xl flex items-center justify-between border transition cursor-pointer ${
                checklistStatusFilter === 'pending'
                  ? 'border-rose-500 ring-1 ring-rose-500 shadow-lg shadow-rose-500/10'
                  : 'border-rose-800/50 hover:border-rose-700/60'
              }`}
            >
              <div>
                <p className="text-xs text-rose-400 font-semibold">
                  🔴 Pending Field Visits {checklistFromDate || checklistToDate ? '(Selected Period)' : ''}
                </p>
                <p className="text-xl font-extrabold text-rose-400">{pendingInCity}</p>
              </div>
              <AlertCircle className="w-6 h-6 text-rose-400" />
            </button>
          </div>
        )}

        {/* Location Agents Checklist Cards Grid */}
        {loadingLocationAgents ? (
          <div className="text-center py-6 text-slate-400 text-xs">Loading agencies in "{selectedLocation}"...</div>
        ) : filteredLocationAgents.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800/50">
            {selectedLocation
              ? `No agencies found matching location "${selectedLocation}" with filter "${checklistStatusFilter}".`
              : 'Select or type a location above to see agencies.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-1">
            {filteredLocationAgents.map((ag) => {
              const isVisited = Boolean(ag.last_visit_date);
              return (
                <div key={ag.id} className={`p-3 rounded-xl border text-xs space-y-2 transition ${
                  isVisited ? 'bg-slate-950/60 border-slate-800' : 'bg-rose-950/10 border-rose-900/40 hover:border-rose-700/60'
                }`}>
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm line-clamp-1">{ag.company_name}</h4>
                      <p className="text-slate-400 text-[11px] font-medium">{ag.name} &bull; 📍 {ag.city} ({ag.area})</p>
                    </div>
                    {isVisited ? (
                      <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap" title={`Visited on: ${ag.last_visit_date}`}>
                        ✅ Visited ({ag.last_visit_date})
                      </span>
                    ) : (
                      <span className="bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap animate-pulse">
                        🔴 Pending Visit
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/60 pt-2">
                    <a
                      href={`tel:${ag.mobile}`}
                      className="text-sky-400 font-mono font-semibold hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" /> {ag.mobile}
                    </a>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onOpenModal('edit_agent', ag)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                        title="Edit Agent Details"
                      >
                        <Edit className="w-3 h-3 text-sky-400" /> Edit
                      </button>
                      <button
                        onClick={() => onOpenModal('log_visit', { id: ag.id, company_name: ag.company_name, name: ag.name, mobile: ag.mobile, city: ag.city })}
                        className="px-2.5 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-[11px] font-semibold transition flex items-center gap-1 shadow"
                      >
                        <Plus className="w-3 h-3" /> Log Visit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* General Filters with Date Selection */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap gap-4 items-center">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Logged Visits History Filter:
        </span>

        {/* Executive Filter */}
        <select
          value={execFilter}
          onChange={(e) => setExecFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-sm p-2.5 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Field Executives</option>
          <option value="Bikramjit Singh">Bikramjit Singh</option>
        </select>

        {/* Single Date Picker */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-400 font-semibold">Visit Date:</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setFromDate('');
              setToDate('');
            }}
            className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Date Range Option (From - To) */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold">From:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setDateFilter('');
            }}
            className="bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-2 rounded-xl text-xs focus:outline-none focus:border-sky-500"
          />
          <span className="text-xs text-slate-400 font-semibold">To:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setDateFilter('');
            }}
            className="bg-slate-950 border border-slate-800 text-slate-200 px-2.5 py-2 rounded-xl text-xs focus:outline-none focus:border-sky-500"
          />
        </div>

        {(dateFilter || fromDate || toDate) && (
          <button
            onClick={clearDateFilters}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition border border-slate-700 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Clear Date
          </button>
        )}
      </div>

      {/* Logged Visits History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Logged Physical Visits History: <strong className="text-slate-100">{visits.length}</strong></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase">
              <tr>
                <th className="p-3.5">Visit Date</th>
                <th className="p-3.5">Field Executive</th>
                <th className="p-3.5">Agent & Location</th>
                <th className="p-3.5">Person Met</th>
                <th className="p-3.5">Products Pitched</th>
                <th className="p-3.5">Interest Level</th>
                <th className="p-3.5">Remarks Notes</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center p-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                  </td>
                </tr>
              ) : visits.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-slate-500">
                    No marketing visit logs found matching selected date/filters. Use the checklist above to log visits!
                  </td>
                </tr>
              ) : (
                visits.map((v) => {
                  let pitched = [];
                  try { pitched = JSON.parse(v.products_pitched || '[]'); } catch(e){}
                  return (
                    <tr key={v.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono text-slate-300 font-bold">{v.visit_date}</td>
                      <td className="p-3.5 font-semibold text-slate-200">{v.executive_name}</td>
                      <td className="p-3.5">
                        <div className="font-semibold text-sky-400">{v.company_name}</div>
                        <div className="text-xs text-slate-400">{v.agent_city}</div>
                        {v.gps_latitude && v.gps_longitude ? (
                          <a
                            href={`https://www.google.com/maps?q=${v.gps_latitude},${v.gps_longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded text-[10px] font-bold hover:underline shadow"
                            title="Click to view exact physical GPS location pin on Google Maps"
                          >
                            <Navigation className="w-3 h-3 text-emerald-400" /> GPS Verified (Maps)
                          </a>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">📍 Manual Entry</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <div className="text-slate-200">{v.person_met}</div>
                        <div className="text-xs text-slate-500 font-mono">{v.mobile}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {pitched.map((p, idx) => (
                            <span key={idx} className="bg-slate-800 text-slate-300 text-[11px] px-2 py-0.5 rounded border border-slate-700">
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          v.response_level?.includes('Hot') ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                          v.response_level?.includes('Warm') ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                          'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {v.response_level}
                        </span>
                      </td>
                      <td className="p-3.5 max-w-xs text-xs text-slate-400 truncate">{v.remarks}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => onOpenModal('log_call', { id: v.agent_id, company_name: v.company_name, name: v.person_met, mobile: v.mobile, city: v.agent_city })}
                            className="px-2.5 py-1 bg-blue-700/80 hover:bg-blue-600 text-white rounded text-xs transition border border-blue-600 flex items-center gap-1 shadow font-semibold"
                            title="Log Telephonic Call Follow-up for Simranjit Kaur"
                          >
                            <Phone className="w-3 h-3" /> Log Call
                          </button>
                          <button
                            onClick={() => onOpenModal('edit_agent', { id: v.agent_id, name: v.person_met, company_name: v.company_name, mobile: v.mobile, city: v.agent_city })}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition border border-slate-700 flex items-center gap-1 font-semibold"
                            title="Edit Agent Details"
                          >
                            <Edit className="w-3 h-3 text-sky-400" /> Edit Agent
                          </button>
                          <button
                            onClick={() => onOpenAgentDrawer(v.agent_id)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition border border-slate-700"
                          >
                            View 360°
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteVisit(v.id)}
                              title="Admin Only: Delete Wrong Visit Entry"
                              className="p-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 rounded text-xs transition border border-rose-800/60"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
