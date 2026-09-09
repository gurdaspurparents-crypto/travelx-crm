import React, { useState, useEffect } from 'react';
import { Users, MapPin, Phone, FileText, CheckCircle2, AlertTriangle, ArrowDown, TrendingUp, Sparkles, Filter, ChevronRight, DollarSign, Gauge, Calendar, Download, Edit3, Trash2, X, Check } from 'lucide-react';

export default function ManagementDashboard({ onNavigate, onOpenAgentDrawer, onOpenModal, role }) {
  const [data, setData] = useState(null);
  const [conveyanceReport, setConveyanceReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Edit Modal State
  const [editingRow, setEditingRow] = useState(null);
  const [editStartKm, setEditStartKm] = useState('');
  const [editEndKm, setEditEndKm] = useState('');

  useEffect(() => {
    fetchDashboardData(selectedDate);
    fetchConveyanceReport();
  }, [selectedDate]);

  const fetchConveyanceReport = async () => {
    try {
      const res = await fetch('/api/field-trips/report');
      const json = await res.json();
      if (json.success) setConveyanceReport(json.report);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDashboardData = async (date = selectedDate) => {
    try {
      const res = await fetch(`/api/dashboard?date=${date}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllConveyance = async () => {
    if (!window.confirm('⚠️ Are you sure you want to CLEAR ALL conveyance trip records? This action is for Admin only!')) return;
    try {
      const res = await fetch('/api/field-trips/clear-all', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchConveyanceReport();
      }
    } catch (err) {
      alert('Error clearing conveyance logs');
    }
  };

  const handleStartEditRow = (row) => {
    setEditingRow(row);
    setEditStartKm(row.day_start_km || '');
    setEditEndKm(row.day_end_km || '');
  };

  const handleSaveEditRow = async (e) => {
    e.preventDefault();
    if (!editingRow) return;
    try {
      const res = await fetch('/api/field-trips/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trip_date: editingRow.trip_date,
          executive_name: editingRow.executive_name || 'Bikramjit Singh',
          start_meter_reading: parseFloat(editStartKm),
          start_location: 'Office Departure',
          rate_per_km: 3.0
        })
      });
      const startJson = await res.json();
      if (startJson.success) {
        await fetch(`/api/field-trips/end/${startJson.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            end_meter_reading: parseFloat(editEndKm),
            end_location: 'Office Return'
          })
        });
        alert('✅ Conveyance record updated successfully!');
        setEditingRow(null);
        fetchConveyanceReport();
      }
    } catch (err) {
      alert('Error saving updated conveyance entry');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  const { today, funnel } = data || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Welcome & Role Banner (Linear-Style Header) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-950/40 via-[#0c1322] to-indigo-950/40 border border-white/[0.09] p-6 shadow-xl backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Executive Management Portal
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              B2B Lead Conversion & Agent CRM
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>Active Profile:</span>
              <span className="font-mono text-sky-300 font-semibold px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">{role}</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-slate-400">Total B2B Network: ~700 Agencies</span>
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onOpenModal('log_visit')}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-amber-900/20 flex items-center gap-1.5 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" /> Log Visit
            </button>
            <button
              onClick={() => onOpenModal('log_call')}
              className="px-3.5 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-sky-900/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5" /> Log Call
            </button>
            <button
              onClick={() => onOpenModal('create_query')}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-indigo-900/20 flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" /> New Query
            </button>
          </div>
        </div>
      </div>

      {/* Activity Metrics Bar with Date Filter */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span> Live Activity Metrics
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {selectedDate === todayStr ? '⚡ Today' : `📅 ${selectedDate}`}
            </span>
          </div>

          {/* 1-Click Date Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                setSelectedDate(todayStr);
                fetchDashboardData(todayStr);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                const yStr = y.toISOString().split('T')[0];
                setSelectedDate(yStr);
                fetchDashboardData(yStr);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                (() => {
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  return selectedDate === y.toISOString().split('T')[0];
                })()
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
              }`}
            >
              Yesterday
            </button>
            <div className="flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-lg text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={e => {
                  setSelectedDate(e.target.value);
                  fetchDashboardData(e.target.value);
                }}
                className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 6-Card Activity Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          
          {/* Card 1: Marketing Visits */}
          <div 
            onClick={() => onNavigate && onNavigate('visits')}
            className="bg-[#0b101e]/90 hover:bg-[#0f172a] border border-white/[0.07] hover:border-amber-500/40 p-4 rounded-xl cursor-pointer transition-all duration-150 relative overflow-hidden group shadow-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500/40 group-hover:bg-amber-500 transition-all"></div>
            <span className="text-[11px] text-slate-400 font-medium">Field Visits</span>
            <p className="text-2xl font-extrabold font-mono text-slate-100 mt-1 tracking-tight">{today?.visits || 0}</p>
            <span className="text-[11px] text-amber-400 font-medium">{today?.new_agents || 0} New Agencies</span>
          </div>

          {/* Card 2: Yug's Calling Desk */}
          <div 
            onClick={() => onNavigate && onNavigate('yug_desk')}
            className="bg-[#0b101e]/90 hover:bg-[#0f172a] border border-emerald-500/30 hover:border-emerald-500/60 p-4 rounded-xl cursor-pointer transition-all duration-150 relative overflow-hidden group shadow-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/70 group-hover:bg-emerald-400 transition-all"></div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 font-bold">📱 Yug Calling</span>
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">DESK</span>
            </div>
            <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-1 tracking-tight">{today?.yug_calls || 0}</p>
            <span className="text-[11px] text-emerald-300/80 font-medium">{today?.yug_connected || 0} Connected</span>
          </div>

          {/* Card 3: Total Calls */}
          <div 
            onClick={() => onNavigate && onNavigate('calls')}
            className="bg-[#0b101e]/90 hover:bg-[#0f172a] border border-white/[0.07] hover:border-blue-500/40 p-4 rounded-xl cursor-pointer transition-all duration-150 relative overflow-hidden group shadow-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/40 group-hover:bg-blue-500 transition-all"></div>
            <span className="text-[11px] text-slate-400 font-medium">Total Calls</span>
            <p className="text-2xl font-extrabold font-mono text-blue-400 mt-1 tracking-tight">{today?.calls || 0}</p>
            <span className="text-[11px] text-slate-400 font-medium">All Executives</span>
          </div>

          {/* Card 4: Queries */}
          <div 
            onClick={() => onNavigate && onNavigate('queries')}
            className="bg-[#0b101e]/90 hover:bg-[#0f172a] border border-white/[0.07] hover:border-amber-500/40 p-4 rounded-xl cursor-pointer transition-all duration-150 relative overflow-hidden group shadow-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500/40 group-hover:bg-amber-400 transition-all"></div>
            <span className="text-[11px] text-slate-400 font-medium">Queries Recd</span>
            <p className="text-2xl font-extrabold font-mono text-amber-400 mt-1 tracking-tight">{today?.queries || 0}</p>
            <span className="text-[11px] text-amber-400 font-medium">{today?.pending || 0} In Progress</span>
          </div>

          {/* Card 5: Bookings */}
          <div 
            onClick={() => onNavigate && onNavigate('queries')}
            className="bg-[#0b101e]/90 hover:bg-[#0f172a] border border-white/[0.07] hover:border-emerald-500/40 p-4 rounded-xl cursor-pointer transition-all duration-150 relative overflow-hidden group shadow-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/40 group-hover:bg-emerald-400 transition-all"></div>
            <span className="text-[11px] text-slate-400 font-medium">Bookings Won</span>
            <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-1 tracking-tight">{today?.converted || 0}</p>
            <span className="text-[11px] text-emerald-400 font-medium">Stage 4 Active</span>
          </div>

          {/* Card 6: Revenue */}
          <div className="bg-[#0b101e]/90 border border-white/[0.07] p-4 rounded-xl relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/40"></div>
            <span className="text-[11px] text-slate-400 font-medium">Sales Revenue</span>
            <p className="text-2xl font-extrabold font-mono text-emerald-300 mt-1 tracking-tight">₹{(today?.revenue || 0).toLocaleString('en-IN')}</p>
            <span className="text-[11px] text-slate-400 font-medium">Booking Total</span>
          </div>

        </div>
      </div>

      {/* Visual Agent Conversion Funnel (Management Core) */}
      <div className="bg-[#0c1322]/90 border border-white/[0.08] p-6 rounded-2xl shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-white/[0.06] gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-400" /> B2B Agent Conversion Funnel
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Click any stage below to inspect filtered travel agencies in Agent Master
            </p>
          </div>
          <span className="px-3 py-1 bg-white/[0.04] border border-white/[0.08] text-xs font-mono font-semibold text-slate-300 rounded-full w-fit">
            Total Database: {funnel?.total || 700} Agents
          </span>
        </div>

        {/* Interactive Funnel Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          
          {/* Step 1 */}
          <div 
            onClick={() => onNavigate('agents', { stage: 'Visited' })}
            className="group cursor-pointer bg-[#0e1628]/80 hover:bg-[#121c33] border border-yellow-500/20 hover:border-yellow-500/50 p-5 rounded-xl transition-all duration-150 shadow-md relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500"></div>
            <span className="text-[11px] font-mono font-bold text-yellow-400 uppercase tracking-wider">Stage 1</span>
            <h4 className="text-base font-bold text-slate-100 mt-1 group-hover:text-yellow-300 transition">Visited</h4>
            <p className="text-3xl font-extrabold font-mono text-yellow-400 mt-2">{funnel?.visited || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Field visits logged</p>
            <ChevronRight className="w-4 h-4 text-slate-500 absolute bottom-3 right-3 group-hover:translate-x-1 transition" />
          </div>

          {/* Step 2 */}
          <div 
            onClick={() => onNavigate('agents', { stage: 'Followup' })}
            className="group cursor-pointer bg-[#0e1628]/80 hover:bg-[#121c33] border border-blue-500/20 hover:border-blue-500/50 p-5 rounded-xl transition-all duration-150 shadow-md relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500"></div>
            <span className="text-[11px] font-mono font-bold text-blue-400 uppercase tracking-wider">Stage 2</span>
            <h4 className="text-base font-bold text-slate-100 mt-1 group-hover:text-blue-300 transition">Follow-up Done</h4>
            <p className="text-3xl font-extrabold font-mono text-blue-400 mt-2">{funnel?.followup || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Office call connected</p>
            <ChevronRight className="w-4 h-4 text-slate-500 absolute bottom-3 right-3 group-hover:translate-x-1 transition" />
          </div>

          {/* Step 3 */}
          <div 
            onClick={() => onNavigate('agents', { stage: 'QueryReceived' })}
            className="group cursor-pointer bg-[#0e1628]/80 hover:bg-[#121c33] border border-amber-500/20 hover:border-amber-500/50 p-5 rounded-xl transition-all duration-150 shadow-md relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
            <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">Stage 3</span>
            <h4 className="text-base font-bold text-slate-100 mt-1 group-hover:text-amber-300 transition">Query Giving</h4>
            <p className="text-3xl font-extrabold font-mono text-amber-400 mt-2">{funnel?.query_giving || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Active requirements</p>
            <ChevronRight className="w-4 h-4 text-slate-500 absolute bottom-3 right-3 group-hover:translate-x-1 transition" />
          </div>

          {/* Step 4 */}
          <div 
            onClick={() => onNavigate('agents', { stage: 'Active' })}
            className="group cursor-pointer bg-[#0e1628]/80 hover:bg-[#121c33] border border-emerald-500/30 hover:border-emerald-500/60 p-5 rounded-xl transition-all duration-150 shadow-md relative overflow-hidden col-span-1 md:col-span-2"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Stage 4 &bull; Target Goal</span>
                <h4 className="text-lg font-bold text-slate-100 mt-1 group-hover:text-emerald-300 transition">Active Booking Agents</h4>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold px-2.5 py-1 rounded-full">
                {Math.round(((funnel?.active || 0) / (funnel?.total || 1)) * 100)}% Conversion
              </span>
            </div>
            <p className="text-4xl font-black font-mono text-emerald-400 mt-3">{funnel?.active || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Agencies with 1+ converted bookings</p>
            <ChevronRight className="w-5 h-5 text-emerald-500 absolute bottom-4 right-4 group-hover:translate-x-1 transition" />
          </div>

        </div>

      </div>

      {/* 🏍️ Day-Wise Executive Conveyance & Odometer Audit Card (Owner Admin View) */}
      <div className="bg-[#0c1322]/90 border border-white/[0.08] rounded-2xl p-6 shadow-xl space-y-4 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Gauge className="w-4 h-4" /> Owner Field Expenses Audit
            </div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              🏍️ Day-Wise Executive Conveyance & Odometer Report
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily motorcycle odometer log & exact conveyance payable (at ₹3/KM rate) for Bikramjit Singh
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/api/export/conveyance"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" /> Export Excel (.xlsx)
            </a>
            <button
              onClick={handleClearAllConveyance}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold rounded-xl text-xs transition border border-rose-500/20 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Admin Only: Clear all conveyance trip logs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Clear Conveyance
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-white/[0.08] rounded-xl">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#090e1a] text-slate-400 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Executive Name</th>
                <th className="p-3">Day Start Odometer</th>
                <th className="p-3">Day End Odometer</th>
                <th className="p-3 font-bold text-sky-400">Total Distance</th>
                <th className="p-3 font-bold text-amber-400">Conveyance (₹3/KM)</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] bg-[#0b101e]/60">
              {conveyanceReport.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-slate-500">
                    No field trips logged yet. Daily trip readings logged by Bikramjit Singh will appear here automatically!
                  </td>
                </tr>
              ) : (
                conveyanceReport.map((r, idx) => {
                  const isEditingThis = editingRow && editingRow.trip_date === r.trip_date;
                  return (
                    <tr key={idx} className="hover:bg-white/[0.03] transition">
                      <td className="p-3 font-mono font-bold text-slate-200">{r.trip_date}</td>
                      <td className="p-3 font-semibold text-slate-300">{r.executive_name}</td>

                      {isEditingThis ? (
                        <>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.1"
                              value={editStartKm}
                              onChange={e => setEditStartKm(e.target.value)}
                              className="w-28 bg-[#070b14] border border-emerald-500 text-emerald-400 font-mono p-1.5 rounded-lg text-xs"
                              placeholder="Start KM..."
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="0.1"
                              value={editEndKm}
                              onChange={e => setEditEndKm(e.target.value)}
                              className="w-28 bg-[#070b14] border border-rose-500 text-rose-400 font-mono p-1.5 rounded-lg text-xs"
                              placeholder="End KM..."
                            />
                          </td>
                          <td className="p-3 font-bold font-mono text-sky-400">
                            {Math.max(0, parseFloat(editEndKm || 0) - parseFloat(editStartKm || 0))} KM
                          </td>
                          <td className="p-3 font-extrabold font-mono text-amber-400 text-sm">
                            ₹{Math.round(Math.max(0, parseFloat(editEndKm || 0) - parseFloat(editStartKm || 0)) * 3.0)}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={handleSaveEditRow}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Save
                              </button>
                              <button
                                onClick={() => setEditingRow(null)}
                                className="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 rounded-lg text-xs font-medium transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" /> Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 font-mono text-emerald-400">{r.day_start_km || '--'} KM</td>
                          <td className="p-3 font-mono text-rose-400">{r.day_end_km || '--'} KM</td>
                          <td className="p-3 font-bold font-mono text-sky-400">{r.total_day_km || 0} KM</td>
                          <td className="p-3 font-extrabold font-mono text-amber-400 text-sm">
                            ₹{(r.total_day_conveyance || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleStartEditRow(r)}
                                className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                                title="Edit Start / End KM"
                              >
                                <Edit3 className="w-3 h-3" /> Edit
                              </button>
                              <button
                                onClick={handleClearAllConveyance}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-lg text-xs transition cursor-pointer"
                                title="Delete / Reset Conveyance"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Agent Activation Breakdown & Management Priority Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Agent Category Summary Table */}
        <div className="lg:col-span-2 bg-[#0c1322]/90 border border-white/[0.08] p-6 rounded-2xl shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-100">Management Activation Category Summary</h3>
            <button
              onClick={() => onNavigate('focus')}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
            >
              Open Focus List Center <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto border border-white/[0.06] rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#090e1a] text-[11px] text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Agent Category</th>
                  <th className="p-3 text-center">Count</th>
                  <th className="p-3 text-center">% of Total</th>
                  <th className="p-3 text-right">Action Needed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                <tr className="hover:bg-white/[0.02] transition">
                  <td className="p-3 font-semibold text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active Booking Agents
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-100">{funnel?.active || 0}</td>
                  <td className="p-3 text-center font-mono text-slate-400">{Math.round(((funnel?.active || 0) / (funnel?.total || 1)) * 100)}%</td>
                  <td className="p-3 text-right text-xs text-emerald-400 font-medium">Maintain Service Level</td>
                </tr>
                <tr className="hover:bg-white/[0.02] bg-amber-500/5 font-semibold">
                  <td className="p-3 text-amber-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> 🎯 Visited Agents Who Gave Queries
                  </td>
                  <td className="p-3 text-center font-mono font-black text-amber-300 text-sm">{funnel?.query_giving || 0}</td>
                  <td className="p-3 text-center font-mono text-amber-300">
                    {Math.round(((funnel?.query_giving || 0) / (funnel?.visited || 1)) * 100)}% of Visited
                  </td>
                  <td className="p-3 text-right text-xs text-amber-300 font-medium">Marketing Visit Success</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition">
                  <td className="p-3 font-semibold text-yellow-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Visited but No Query
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-100">{funnel?.visited_no_query || 0}</td>
                  <td className="p-3 text-center font-mono text-slate-400">{Math.round(((funnel?.visited_no_query || 0) / (funnel?.visited || 1)) * 100)}% of Visited</td>
                  <td className="p-3 text-right text-xs text-yellow-400 font-medium">Telephonic Re-engagement</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition">
                  <td className="p-3 font-semibold text-rose-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Visited / Called - No Response
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-100">{funnel?.no_response || 0}</td>
                  <td className="p-3 text-center font-mono text-slate-400">{Math.round(((funnel?.no_response || 0) / (funnel?.total || 1)) * 100)}%</td>
                  <td className="p-3 text-right text-xs text-rose-400 font-medium">Re-visit by Senior Exec</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition">
                  <td className="p-3 font-semibold text-orange-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> Previously Active (Dormant)
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-100">{funnel?.dormant || 0}</td>
                  <td className="p-3 text-center font-mono text-slate-400">{Math.round(((funnel?.dormant || 0) / (funnel?.total || 1)) * 100)}%</td>
                  <td className="p-3 text-right text-xs text-orange-400 font-bold">HIGH PRIORITY ATTENTION</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Focus Action Box */}
        <div className="bg-[#0c1322]/90 border border-white/[0.08] p-6 rounded-2xl shadow-xl flex flex-col justify-between backdrop-blur-md">
          <div>
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4" /> Management Priority Alert
            </div>
            <h4 className="text-base font-bold text-slate-100">100 Agents Giving Queries with 0 Bookings</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              These travel agents are actively reaching out to Travelx for flight and package quotes but are dropping off at the quotation stage.
            </p>
            <div className="mt-4 p-3.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-xs space-y-1.5">
              <p className="text-slate-300"><strong>Main Lost Reason:</strong> Competitor Rate (42%)</p>
              <p className="text-slate-300"><strong>Top Territory:</strong> Gurdaspur & Batala</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('focus')}
            className="w-full mt-6 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            Review Focus Agents List <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

    </div>
  );
}
