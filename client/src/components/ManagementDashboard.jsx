import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, MapPin, Phone, FileText, CheckCircle2, AlertTriangle, TrendingUp, 
  Sparkles, Filter, ChevronRight, DollarSign, Gauge, Calendar, Download, 
  Edit3, Trash2, X, Check, Target, Compass, ArrowUpRight, Zap, Clock, 
  ShieldCheck, Flag, CheckSquare, Award, ArrowRight, BarChart3, ChevronDown, 
  ChevronUp, Navigation, RefreshCw
} from 'lucide-react';

export default function ManagementDashboard({ onNavigate, onOpenAgentDrawer, onOpenModal, role }) {
  const [data, setData] = useState(null);
  const [conveyanceReport, setConveyanceReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const currentMonthStr = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [showMonthWiseMatrix, setShowMonthWiseMatrix] = useState(true);

  // Collapsible Section Accordion States
  const [showNextMonthTargets, setShowNextMonthTargets] = useState(true);
  const [showConveyanceAudit, setShowConveyanceAudit] = useState(false);
  const [showCategorySummary, setShowCategorySummary] = useState(true);

  // Edit Modal State for Conveyance
  const [editingRow, setEditingRow] = useState(null);
  const [editStartKm, setEditStartKm] = useState('');
  const [editEndKm, setEditEndKm] = useState('');

  useEffect(() => {
    fetchDashboardData(selectedDate, selectedMonth);
    fetchConveyanceReport();
  }, [selectedDate, selectedMonth]);

  const fetchConveyanceReport = async () => {
    try {
      const res = await fetch('/api/field-trips/report');
      const json = await res.json();
      if (json.success) setConveyanceReport(json.report);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDashboardData = async (date = selectedDate, month = selectedMonth) => {
    try {
      const res = await fetch(`/api/dashboard?date=${date}&month=${month}`);
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

  const handlePlanRouteForCity = (cityName) => {
    sessionStorage.setItem('bikram_selected_location', cityName);
    if (onNavigate) {
      onNavigate('visits');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div>
        <p className="text-xs text-slate-400 font-medium">Loading executive dashboard & business results...</p>
      </div>
    );
  }

  const today = data?.today || {};
  const funnel = data?.funnel || {};
  const territoryTargets = Array.isArray(data?.territory_targets) ? data.territory_targets : [];
  const business_results = data?.business_results || {};

  const monthlyPerf = data?.monthly_performance || {};
  const monthHistory = Array.isArray(data?.month_wise_history) ? data.month_wise_history : [];

  const totalUnvisitedNextMonth = territoryTargets.reduce((acc, t) => acc + (t.unvisited_count || 0), 0);
  const winRate = (business_results.total_queries_count && business_results.total_queries_count > 0)
    ? Math.round(((business_results.converted_bookings_count || 0) / business_results.total_queries_count) * 100)
    : 0;
  const activeRate = (funnel?.total && funnel?.total > 0)
    ? Math.round(((funnel?.active || 0) / funnel?.total) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* 1. EXECUTIVE WELCOME & QUICK ACTIONS HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-[#0e172a] border border-slate-800 p-5 sm:p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Executive Management Portal &bull; Travelx B2B
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              B2B Lead Conversion & Growth Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
              <span>Active Role:</span>
              <span className="font-mono text-sky-300 font-semibold px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">{role || 'Admin / Owner'}</span>
              <span className="text-slate-600">&bull;</span>
              <span className="text-slate-300">Total B2B Agent Network: <strong>{funnel?.total || 700} Registered Agencies</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onOpenModal('log_visit')}
              className="px-3.5 py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> Log Visit
            </button>
            <button
              onClick={() => onOpenModal('log_call')}
              className="px-3.5 py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-sky-400" /> Log Call
            </button>
            <button
              onClick={() => onOpenModal('create_query')}
              className="px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-sky-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" /> Create Query
            </button>
          </div>
        </div>
      </div>

      {/* 2. FRUITFUL BUSINESS RESULTS & ROI STRIP (Result-Oriented Core Outputs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Confirmed Revenue */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg group hover:border-slate-700 transition">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Closed Gross Revenue</span>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              🟢 Confirmed ROI
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-2 tracking-tight">
            ₹{(business_results.total_revenue || 0).toLocaleString('en-IN')}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span>{business_results.converted_bookings_count || 0} Bookings Won</span>
            <span className="text-emerald-400/90 font-semibold flex items-center gap-0.5">
              Stage 4 Converted <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Win Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg group hover:border-slate-700 transition">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-indigo-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quotation Win Rate</span>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              ⚡ Conversion Efficiency
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-sky-300 mt-2 tracking-tight">
            {winRate}%
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span>{business_results.total_queries_count || 0} Total Quotes Given</span>
            <span className="text-sky-400/90 font-semibold">Target: 45%</span>
          </div>
        </div>

        {/* Card 3: Active B2B Booking Clients */}
        <div 
          onClick={() => onNavigate && onNavigate('agents', { stage: 'Active' })}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg group hover:border-emerald-500/40 cursor-pointer transition"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-amber-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Booking Clients</span>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {activeRate}% of Network
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-slate-100 mt-2 tracking-tight">
            {funnel?.active || 0} <span className="text-sm font-normal text-slate-400">Agencies</span>
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span>Regular Enquiries</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
              Inspect in Master <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Immediate Enquiries Won on Calls */}
        <div 
          onClick={() => onNavigate && onNavigate('calls')}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg group hover:border-amber-500/40 cursor-pointer transition"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Direct Enquiries Won</span>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
              🎯 Calling Fruitful Yield
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-black font-mono text-amber-300 mt-2 tracking-tight">
            {business_results.simranjit_queries_won || 0} <span className="text-sm font-normal text-slate-400">Captured</span>
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800/80">
            <span>From {business_results.bikram_unique_agents || 0} Visited Agencies</span>
            <span className="text-amber-400 font-semibold flex items-center gap-0.5">
              View Calling Desk <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* 2.5 📊 MONTH-WISE B2B FIELD COVERAGE & AGENT CONVERSION ANALYTICS (महीने के अनुसार रिपोर्ट) */}
      <div className="bg-slate-900/95 border border-sky-500/30 rounded-2xl overflow-hidden shadow-2xl space-y-0">
        {/* Header with Title and Month Controls */}
        <div 
          onClick={() => setShowMonthWiseMatrix(!showMonthWiseMatrix)}
          className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#0b1329] to-sky-950/40 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-850/80 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  📊 Month-Wise Field Coverage & Agent Conversion Analytics
                </h3>
                <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {monthlyPerf?.month_label || selectedMonth} Report
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Bikramjit Singh field visits, unvisited pending agents, active vs non-active agents, queries received & tickets issued
              </p>
            </div>
          </div>

          {/* Month Selector Pills & Picker */}
          <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
            {/* Quick Month Buttons */}
            <button
              type="button"
              onClick={() => {
                setSelectedMonth(currentMonthStr);
                fetchDashboardData(selectedDate, currentMonthStr);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedMonth === currentMonthStr
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              ⚡ This Month
            </button>
            <button
              type="button"
              onClick={() => {
                const prev = new Date();
                prev.setDate(1);
                prev.setMonth(prev.getMonth() - 1);
                const prevMonthStr = prev.toISOString().slice(0, 7);
                setSelectedMonth(prevMonthStr);
                fetchDashboardData(selectedDate, prevMonthStr);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                (() => {
                  const prev = new Date();
                  prev.setDate(1);
                  prev.setMonth(prev.getMonth() - 1);
                  return selectedMonth === prev.toISOString().slice(0, 7);
                })()
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              ⏮️ Last Month
            </button>

            {/* Custom Month Picker */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={e => {
                  if (e.target.value) {
                    setSelectedMonth(e.target.value);
                    fetchDashboardData(selectedDate, e.target.value);
                  }
                }}
                className="bg-transparent text-slate-200 font-mono text-xs focus:outline-none cursor-pointer"
              />
            </div>

            {/* Toggle Collapse */}
            <button
              type="button"
              onClick={() => setShowMonthWiseMatrix(!showMonthWiseMatrix)}
              className="p-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 transition"
              title={showMonthWiseMatrix ? "Collapse Section" : "Expand Section"}
            >
              {showMonthWiseMatrix ? <ChevronUp className="w-4 h-4 text-sky-400" /> : <ChevronDown className="w-4 h-4 text-sky-400" />}
            </button>
          </div>
        </div>

        {showMonthWiseMatrix && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* 4 Dedicated Monthly Metric Cards for Selected Month */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Bikram Visits vs Pending Agencies */}
              <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-4 relative overflow-hidden shadow">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    🚗 Bikramjit Visits & Pending
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {monthlyPerf?.coverage_pct || 0}% Coverage
                  </span>
                </div>

                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
                    {monthlyPerf?.bikram_visited_agents || 0}
                  </span>
                  <span className="text-xs text-slate-400">Visited</span>
                  <span className="text-slate-600 font-mono">/</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-rose-400">
                    {monthlyPerf?.pending_agents || 0}
                  </span>
                  <span className="text-xs text-slate-400">Pending</span>
                </div>

                {/* Visual Progress Bar */}
                <div className="w-full bg-slate-900 h-2 rounded-full mt-3 overflow-hidden border border-slate-800">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(3, monthlyPerf?.coverage_pct || 0))}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80">
                  <span>{monthlyPerf?.bikram_total_visits || 0} Total Visits Logged</span>
                  <span className="text-amber-400/90 font-semibold">Of {monthlyPerf?.total_network_agents || 0} Agents</span>
                </div>
              </div>

              {/* Card 2: Active Booking Agents vs Non-Active */}
              <div 
                onClick={() => onNavigate && onNavigate('agents', { stage: 'Active' })}
                className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 relative overflow-hidden shadow cursor-pointer hover:border-emerald-500/60 transition group"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400"></div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    🟢 Active vs Non-Active
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {monthlyPerf?.total_network_agents ? Math.round(((monthlyPerf?.active_agents || 0) / monthlyPerf?.total_network_agents) * 100) : 0}% Active
                  </span>
                </div>

                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                    {monthlyPerf?.active_agents || 0}
                  </span>
                  <span className="text-xs text-emerald-300/80 font-medium">Active</span>
                  <span className="text-slate-600 font-mono">/</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-slate-300">
                    {monthlyPerf?.non_active_agents || 0}
                  </span>
                  <span className="text-xs text-slate-400">Non-Active</span>
                </div>

                {/* Active Progress Bar */}
                <div className="w-full bg-slate-900 h-2 rounded-full mt-3 overflow-hidden border border-slate-800">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(3, monthlyPerf?.total_network_agents ? ((monthlyPerf?.active_agents || 0) / monthlyPerf?.total_network_agents) * 100 : 0))}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80">
                  <span>1+ Converted Bookings</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                    Inspect in Master <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Card 3: Queries Giving Agents vs Total Queries */}
              <div 
                onClick={() => onNavigate && onNavigate('queries')}
                className="bg-slate-950/80 border border-sky-500/30 rounded-xl p-4 relative overflow-hidden shadow cursor-pointer hover:border-sky-500/60 transition group"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 to-indigo-500"></div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    📋 Query Giving Agents
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    {monthlyPerf?.total_queries || 0} Queries
                  </span>
                </div>

                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-sky-300">
                    {monthlyPerf?.query_agents || 0}
                  </span>
                  <span className="text-xs text-slate-400">Agents Gave Enquiries</span>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 mt-3">
                  <span className="text-slate-400">Tickets Issued:</span>
                  <span className="font-mono font-bold text-emerald-400">{monthlyPerf?.tickets_issued || 0} Won ({monthlyPerf?.win_rate || 0}% Win Rate)</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80">
                  <span>Enquiry Flow</span>
                  <span className="text-sky-400 font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                    View Enquiries <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>

              {/* Card 4: Tickets Issued & Monthly Revenue */}
              <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-4 relative overflow-hidden shadow">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500"></div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    🎫 Tickets & Sales Value
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {monthlyPerf?.month_label}
                  </span>
                </div>

                <p className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-2.5 tracking-tight">
                  ₹{(monthlyPerf?.revenue || 0).toLocaleString('en-IN')}
                </p>

                <div className="flex items-center justify-between text-[11px] bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 mt-3">
                  <span className="text-slate-400">Confirmed Tickets:</span>
                  <span className="font-mono font-bold text-emerald-400">{monthlyPerf?.tickets_issued || 0} Bookings</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80">
                  <span>Avg Ticket Value:</span>
                  <span className="font-mono font-semibold text-slate-200">
                    ₹{monthlyPerf?.tickets_issued > 0 ? Math.round(monthlyPerf.revenue / monthlyPerf.tickets_issued).toLocaleString('en-IN') : '0'}
                  </span>
                </div>
              </div>

            </div>

            {/* Month-by-Month Growth & Conversion Matrix Table */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow">
              <div className="p-3.5 sm:p-4 bg-[#080d1a] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                    🗓️ Month-by-Month Performance & Conversion Matrix (महीने के अनुसार तुलनात्मक चार्ट)
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">
                  Click any row to switch active month view above
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#050811] text-[10px] text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">Month (महीना)</th>
                      <th className="p-3 text-center">Total Network</th>
                      <th className="p-3 text-center font-bold text-amber-400">Bikram Visited</th>
                      <th className="p-3 text-center font-bold text-rose-400">Pending Unvisited</th>
                      <th className="p-3 text-center font-bold text-sky-400">Coverage %</th>
                      <th className="p-3 text-center">Query Agents</th>
                      <th className="p-3 text-center">Total Queries</th>
                      <th className="p-3 text-center font-bold text-emerald-400">Active Booking Agents</th>
                      <th className="p-3 text-center">Non-Active Agents</th>
                      <th className="p-3 text-center font-bold text-indigo-400">Tickets Issued</th>
                      <th className="p-3 text-right font-bold text-emerald-400">Gross Revenue (₹)</th>
                      <th className="p-3 text-center">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {monthHistory.length === 0 ? (
                      <tr>
                        <td colSpan="12" className="p-6 text-center text-slate-500">
                          No monthly history records available yet.
                        </td>
                      </tr>
                    ) : (
                      monthHistory.map((mRow) => {
                        const isSelected = mRow.month === selectedMonth;
                        return (
                          <tr 
                            key={mRow.month}
                            onClick={() => {
                              setSelectedMonth(mRow.month);
                              fetchDashboardData(selectedDate, mRow.month);
                            }}
                            className={`cursor-pointer transition ${
                              isSelected 
                                ? 'bg-sky-500/10 hover:bg-sky-500/15 border-l-4 border-l-sky-500' 
                                : 'hover:bg-slate-850/60'
                            }`}
                          >
                            <td className="p-3 font-mono font-bold text-slate-100 flex items-center gap-2">
                              {isSelected && <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>}
                              <span>{mRow.month_label}</span>
                              {isSelected && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold">
                                  SELECTED
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono text-slate-400">{mRow.total_network_agents}</td>
                            <td className="p-3 text-center font-mono font-bold text-amber-300">
                              {mRow.bikram_visited_agents}
                              <span className="text-[10px] text-slate-500 block font-normal">({mRow.bikram_total_visits} visits)</span>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-rose-400">{mRow.pending_agents}</td>
                            <td className="p-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                <span className="font-mono font-bold text-sky-400">{mRow.coverage_pct}%</span>
                                <div className="w-16 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                  <div 
                                    className="bg-sky-500 h-full rounded-full" 
                                    style={{ width: `${Math.min(100, Math.max(3, mRow.coverage_pct))}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center font-mono text-slate-200">{mRow.query_agents}</td>
                            <td className="p-3 text-center font-mono text-sky-300">{mRow.total_queries}</td>
                            <td className="p-3 text-center font-mono font-black text-emerald-400 text-sm">
                              {mRow.active_agents}
                              {mRow.active_agents > 0 && (
                                <span className="text-[9px] font-mono px-1 rounded bg-emerald-500/20 text-emerald-300 block w-fit mx-auto mt-0.5">
                                  ACTIVE
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center font-mono text-slate-400">{mRow.non_active_agents}</td>
                            <td className="p-3 text-center font-mono font-bold text-indigo-300">{mRow.tickets_issued}</td>
                            <td className="p-3 text-right font-mono font-black text-emerald-400">
                              ₹{mRow.revenue.toLocaleString('en-IN')}
                            </td>
                            <td className="p-3 text-center font-mono text-slate-300">
                              {mRow.win_rate}%
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
        )}
      </div>

      {/* 3. 🎯 NEXT MONTH MANDATORY TARGETS & GROWTH ROADMAP (अगले महीने क्या MUST होना चाहिए) */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl overflow-hidden shadow-xl">
        {/* Clickable Header Accordion Toggle */}
        <div 
          onClick={() => setShowNextMonthTargets(!showNextMonthTargets)}
          className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none hover:bg-slate-850 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  🎯 Next Month Mandatory Targets & Growth Roadmap (अगले महीने के MUST Goals)
                </h3>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {totalUnvisitedNextMonth} Agencies Must Be Visited
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Territories with unvisited agents, operational follow-up SLAs, and mandatory executive accountabilities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowNextMonthTargets(!showNextMonthTargets);
              }}
              className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              {showNextMonthTargets ? (
                <>
                  <ChevronUp className="w-4 h-4 text-amber-400" />
                  <span>Collapse Targets</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 text-amber-400" />
                  <span>Open Next Month Targets ({totalUnvisitedNextMonth})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showNextMonthTargets && (
          <div className="p-4 sm:p-6 space-y-6 bg-slate-950/40">

            {/* Top 3 Strategic Pillars Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Pillar 1: City-Wise Field Coverage Targets (Zero Unvisited Cities) */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-amber-400" /> Pillar 1: Mandatory Territory Field Coverage
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Shahar-wise travel agencies jinhein agle mahine 100% visit karna MUST hai:
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    {territoryTargets.length} Cities Pending
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-[#090e1a] text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3">City / Route</th>
                        <th className="py-2.5 px-3 text-center">Total Agencies</th>
                        <th className="py-2.5 px-3 text-center">Visited</th>
                        <th className="py-2.5 px-3 text-center font-bold text-amber-400">Must Visit Next Month</th>
                        <th className="py-2.5 px-3 text-center">Coverage %</th>
                        <th className="py-2.5 px-3 text-right">Route Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {territoryTargets.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center p-6 text-emerald-400 font-bold">
                            🎉 100% Coverage Achieved! All registered travel agencies in all cities have been visited.
                          </td>
                        </tr>
                      ) : (
                        territoryTargets.map((t, idx) => {
                          const pct = Math.round(((t.visited_count || 0) / (t.total_agencies || 1)) * 100);
                          return (
                            <tr key={idx} className="hover:bg-slate-850/60 transition">
                              <td className="py-2.5 px-3 font-bold text-slate-100 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-sky-400" /> {t.city}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-300">
                                {t.total_agencies}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-emerald-400 font-bold">
                                {t.visited_count}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-full font-mono font-bold text-xs">
                                  {t.unvisited_count} Pending
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <div className="flex items-center gap-2 justify-center">
                                  <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                      style={{ width: `${pct}%` }}
                                    ></div>
                                  </div>
                                  <span className="font-mono text-[11px] text-slate-400">{pct}%</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => handlePlanRouteForCity(t.city)}
                                  className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                                  title={`Open ${t.city} checklist in Visits tab`}
                                >
                                  <Compass className="w-3 h-3 text-amber-400" /> Route Plan
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center justify-between text-xs text-amber-300">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Flag className="w-4 h-4 text-amber-400" /> Priority Directive:
                  </span>
                  <span>Bikramjit Singh MUST complete all <strong>{totalUnvisitedNextMonth} pending visits</strong> next month with zero missed agencies.</span>
                </div>
              </div>

              {/* Pillar 2: 4 Mandatory Operational Rules & SLAs */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3.5">
                <div className="border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sky-400" /> Pillar 2: Operational Mandates & SLAs
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Rules that the team MUST strictly execute next month:
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Mandate 1 */}
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-emerald-300 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" /> 1. 100% Next-Day Follow-Up SLA
                      </span>
                      <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        24h Max
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Har physical visit ke baad Simranjit Kaur dwara 24 ghante mein telephonic feedback call hona anivarya hai.
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      <span>Backlog: <strong className="text-amber-400">{business_results.uncontacted_visited_queue || 0} Pending</strong></span>
                      <button 
                        onClick={() => onNavigate('calls')}
                        className="text-sky-400 hover:underline font-semibold"
                      >
                        Open Queue &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Mandate 2 */}
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-amber-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" /> 2. Zero Overdue Callback Policy
                      </span>
                      <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        Exact Date
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      "Call Again Later" mark kiye gaye kisi bhi agent ki date miss nahi honi chahiye. Aaj due calls priority par call honge.
                    </p>
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      <span>Due/Overdue: <strong className="text-rose-400">{business_results.pending_callbacks_count || 0} Calls</strong></span>
                      <button 
                        onClick={() => onNavigate('calls')}
                        className="text-sky-400 hover:underline font-semibold"
                      >
                        Call Due Today &rarr;
                      </button>
                    </div>
                  </div>

                  {/* Mandate 3 */}
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-sky-300 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-sky-400" /> 3. 15-Minute Quotation Turnaround
                      </span>
                      <span className="font-mono text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">
                        Win Rate 45%
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Travel agent se query aane par 15 minute ke andar best B2B competitive rates dena, taaki competitor dropout 0 ho sake.
                    </p>
                  </div>

                  {/* Mandate 4 */}
                  <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-rose-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> 4. Dormant Agency Re-activation
                      </span>
                      <span className="font-mono text-[10px] text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded">
                        {funnel?.dormant || 0} Agents
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px]">
                      Jin agents ne 30+ din se query nahi di, unhe special B2B promotional fare update send karke wapas active karna.
                    </p>
                    <div className="flex justify-end pt-1 text-[11px]">
                      <button 
                        onClick={() => onNavigate('focus')}
                        className="text-rose-400 hover:underline font-semibold"
                      >
                        Review Dormant List &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Pillar 3: Team-Wise Accountabilities for Next Month */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-emerald-400" /> Pillar 3: Executive Accountabilities for Next Month
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* Bikramjit */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-amber-300">
                    <span>🚗 Bikramjit Singh</span>
                    <span className="text-[10px] text-amber-400 font-mono">Field Marketing</span>
                  </div>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside text-[11px]">
                    <li>Complete 60+ pending visits in Batala & Dhariwal</li>
                    <li>Daily morning & evening odometer logging</li>
                    <li>Capture accurate contact person & phone numbers</li>
                  </ul>
                </div>

                {/* Simranjit Kaur */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-sky-300">
                    <span>📞 Simranjit Kaur</span>
                    <span className="text-[10px] text-sky-400 font-mono">Telephonic Follow-ups</span>
                  </div>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside text-[11px]">
                    <li>100% next-day feedback calls for field visits</li>
                    <li>Zero overdue callback queue</li>
                    <li>Capture minimum 30 immediate enquiries</li>
                  </ul>
                </div>

                {/* Yug */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-emerald-300">
                    <span>📱 Yug</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Calling Desk</span>
                  </div>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside text-[11px]">
                    <li>Call 30 uncontacted travel agencies daily</li>
                    <li>Qualify active flight & package booking agents</li>
                    <li>Route hot interested leads to sales desk</li>
                  </ul>
                </div>

                {/* Sales & Ticketing */}
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-indigo-300">
                    <span>💼 Sales & Operations</span>
                    <span className="text-[10px] text-indigo-400 font-mono">Closing Desk</span>
                  </div>
                  <ul className="text-slate-400 space-y-1 list-disc list-inside text-[11px]">
                    <li>Target ₹15,00,000+ monthly gross booking value</li>
                    <li>Follow up on all quoted packages within 2 hours</li>
                    <li>Achieve 45%+ quotation win rate</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 4. LIVE ACTIVITY PERFORMANCE BAR (Selected Date Filter) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span> Activity Timeline Metrics
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
              {selectedDate === todayStr ? '⚡ Today' : `📅 ${selectedDate}`}
            </span>
          </div>

          {/* 1-Click Date Filter Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => {
                const curMonth = new Date().toISOString().slice(0, 7);
                setSelectedDate(curMonth);
                fetchDashboardData(curMonth);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedDate.length === 7
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              🗓️ This Month
            </button>
            <button
              onClick={() => {
                setSelectedDate(todayStr);
                fetchDashboardData(todayStr);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
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
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                (() => {
                  const y = new Date();
                  y.setDate(y.getDate() - 1);
                  return selectedDate === y.toISOString().split('T')[0];
                })()
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Yesterday
            </button>
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-xl text-xs">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Card 1: Marketing Visits */}
          <div 
            onClick={() => onNavigate && onNavigate('visits')}
            className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 p-4 rounded-xl cursor-pointer transition relative overflow-hidden group shadow-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500/40 group-hover:bg-amber-500 transition-all"></div>
            <span className="text-[11px] text-slate-400 font-medium">Field Visits</span>
            <p className="text-2xl font-black font-mono text-slate-100 mt-1 tracking-tight">{today?.visits || 0}</p>
            <span className="text-[11px] text-amber-400 font-medium">{today?.new_agents || 0} New Agencies</span>
          </div>

          {/* Card 2: Yug's Calling Desk */}
          <div 
            onClick={() => onNavigate && onNavigate('yug_desk')}
            className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 p-4 rounded-xl cursor-pointer transition relative overflow-hidden group shadow-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/40 group-hover:bg-emerald-400 transition-all"></div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 font-bold">📱 Yug Calling</span>
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">DESK</span>
            </div>
            <p className="text-2xl font-black font-mono text-emerald-400 mt-1 tracking-tight">{today?.yug_calls || 0}</p>
            <span className="text-[11px] text-emerald-300/80 font-medium">{today?.yug_connected || 0} Connected</span>
          </div>

          {/* Card 3: Total Calls */}
          <div 
            onClick={() => onNavigate && onNavigate('calls')}
            className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 p-4 rounded-xl cursor-pointer transition relative overflow-hidden group shadow-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500/40 group-hover:bg-blue-500 transition-all"></div>
            <span className="text-[11px] text-slate-400 font-medium">Total Calls</span>
            <p className="text-2xl font-black font-mono text-blue-400 mt-1 tracking-tight">{today?.calls || 0}</p>
            <span className="text-[11px] text-slate-400 font-medium">All Executives</span>
          </div>

          {/* Card 4: Queries */}
          <div 
            onClick={() => onNavigate && onNavigate('queries')}
            className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 p-4 rounded-xl cursor-pointer transition relative overflow-hidden group shadow-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500/40 group-hover:bg-amber-400 transition-all"></div>
            <span className="text-[11px] text-slate-400 font-medium">Queries Recd</span>
            <p className="text-2xl font-black font-mono text-amber-400 mt-1 tracking-tight">{today?.queries || 0}</p>
            <span className="text-[11px] text-amber-400 font-medium">{today?.pending || 0} In Progress</span>
          </div>

          {/* Card 5: Bookings */}
          <div 
            onClick={() => onNavigate && onNavigate('queries')}
            className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 p-4 rounded-xl cursor-pointer transition relative overflow-hidden group shadow-sm"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/40 group-hover:bg-emerald-400 transition-all"></div>
            <span className="text-[11px] text-slate-400 font-medium">Bookings Won</span>
            <p className="text-2xl font-black font-mono text-emerald-400 mt-1 tracking-tight">{today?.converted || 0}</p>
            <span className="text-[11px] text-emerald-400 font-medium">Stage 4 Active</span>
          </div>

          {/* Card 6: Revenue */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl relative overflow-hidden shadow-sm">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500/40"></div>
            <span className="text-[11px] text-slate-400 font-medium">Sales Revenue</span>
            <p className="text-2xl font-black font-mono text-emerald-300 mt-1 tracking-tight">₹{(today?.revenue || 0).toLocaleString('en-IN')}</p>
            <span className="text-[11px] text-slate-400 font-medium">Booking Total</span>
          </div>
        </div>
      </div>

      {/* 5. VISUAL B2B AGENT CONVERSION FUNNEL (Management Core) */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 pb-4 border-b border-slate-800 gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-400" /> B2B Agent Conversion Pipeline & Funnel
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any stage below to inspect filtered travel agencies in Agent Master
            </p>
          </div>
          <span className="px-3 py-1 bg-slate-950 border border-slate-800 text-xs font-mono font-semibold text-slate-300 rounded-full w-fit">
            Total B2B Database: <strong>{funnel?.total || 700} Agents</strong>
          </span>
        </div>

        {/* Interactive Funnel Steps */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          {/* Step 1: Visited */}
          <div 
            onClick={() => onNavigate('agents', { stage: 'Visited' })}
            className="group cursor-pointer bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 p-4 sm:p-5 rounded-xl transition duration-150 shadow-md relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/60"></div>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">Stage 1</span>
            <h4 className="text-base font-bold text-slate-100 mt-1 group-hover:text-amber-300 transition">Visited</h4>
            <p className="text-3xl font-black font-mono text-amber-400 mt-2">{funnel?.visited || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Field visits logged</p>
            <ChevronRight className="w-4 h-4 text-slate-500 absolute bottom-3 right-3 group-hover:translate-x-1 transition" />
          </div>

          {/* Step 2: Follow-up Done */}
          <div 
            onClick={() => onNavigate('agents', { stage: 'Followup' })}
            className="group cursor-pointer bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 p-4 sm:p-5 rounded-xl transition duration-150 shadow-md relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/60"></div>
            <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">Stage 2</span>
            <h4 className="text-base font-bold text-slate-100 mt-1 group-hover:text-blue-300 transition">Follow-up Done</h4>
            <p className="text-3xl font-black font-mono text-blue-400 mt-2">{funnel?.followup || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Office call connected</p>
            <ChevronRight className="w-4 h-4 text-slate-500 absolute bottom-3 right-3 group-hover:translate-x-1 transition" />
          </div>

          {/* Step 3: Query Giving */}
          <div 
            onClick={() => onNavigate('agents', { stage: 'QueryReceived' })}
            className="group cursor-pointer bg-slate-950/80 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/50 p-4 sm:p-5 rounded-xl transition duration-150 shadow-md relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/60"></div>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">Stage 3</span>
            <h4 className="text-base font-bold text-slate-100 mt-1 group-hover:text-amber-300 transition">Query Giving</h4>
            <p className="text-3xl font-black font-mono text-amber-400 mt-2">{funnel?.query_giving || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Active requirements</p>
            <ChevronRight className="w-4 h-4 text-slate-500 absolute bottom-3 right-3 group-hover:translate-x-1 transition" />
          </div>

          {/* Step 4: Active Booking Clients */}
          <div 
            onClick={() => onNavigate('agents', { stage: 'Active' })}
            className="group cursor-pointer bg-slate-950/80 hover:bg-slate-850 border border-emerald-500/30 hover:border-emerald-500/60 p-4 sm:p-5 rounded-xl transition duration-150 shadow-md relative overflow-hidden col-span-1 md:col-span-2"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Stage 4 &bull; Ultimate Goal</span>
                <h4 className="text-lg font-bold text-slate-100 mt-1 group-hover:text-emerald-300 transition">Active Booking Agencies</h4>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold px-2.5 py-1 rounded-full">
                {activeRate}% Conversion
              </span>
            </div>
            <p className="text-4xl font-black font-mono text-emerald-400 mt-3">{funnel?.active || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Agencies with 1+ converted bookings</p>
            <ChevronRight className="w-5 h-5 text-emerald-500 absolute bottom-4 right-4 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* 6. DAY-WISE EXECUTIVE CONVEYANCE AUDIT (Collapsible Accordion) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div 
          onClick={() => setShowConveyanceAudit(!showConveyanceAudit)}
          className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/30 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-850 transition"
        >
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-sky-400" /> 🏍️ Executive Conveyance & Odometer Audit (Bikramjit Singh)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily motorcycle odometer log & exact conveyance payable (₹3/KM rate)
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-500/20">
              {conveyanceReport.length} Days Logged
            </span>
            <a
              href="/api/export/conveyance"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
            >
              <Download className="w-3.5 h-3.5" /> Export Excel
            </a>
            {role === 'Admin / Owner' && (
              <button
                onClick={handleClearAllConveyance}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold rounded-xl text-xs transition border border-rose-500/20 flex items-center gap-1"
                title="Admin Only: Clear all conveyance trip logs"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowConveyanceAudit(!showConveyanceAudit)}
              className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              {showConveyanceAudit ? (
                <>
                  <ChevronUp className="w-4 h-4 text-sky-400" /> Collapse Audit
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 text-sky-400" /> Open Audit
                </>
              )}
            </button>
          </div>
        </div>

        {showConveyanceAudit && (
          <div className="p-4 sm:p-5">
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#090e1a] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Executive</th>
                    <th className="p-3">Start KM</th>
                    <th className="p-3">End KM</th>
                    <th className="p-3 font-bold text-sky-400">Total KM</th>
                    <th className="p-3 font-bold text-amber-400">Payable (₹3/KM)</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
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
                        <tr key={idx} className="hover:bg-slate-800/30 transition">
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
                                  className="w-24 bg-slate-900 border border-emerald-500 text-emerald-400 font-mono p-1 rounded-lg text-xs"
                                  placeholder="Start KM..."
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={editEndKm}
                                  onChange={e => setEditEndKm(e.target.value)}
                                  className="w-24 bg-slate-900 border border-rose-500 text-rose-400 font-mono p-1 rounded-lg text-xs"
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
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition flex items-center gap-1 shadow cursor-pointer"
                                  >
                                    <Check className="w-3 h-3" /> Save
                                  </button>
                                  <button
                                    onClick={() => setEditingRow(null)}
                                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition cursor-pointer"
                                  >
                                    <X className="w-3 h-3" /> Cancel
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
                                    className="px-2 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 rounded text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                                    title="Edit Start / End KM"
                                  >
                                    <Edit3 className="w-3 h-3" /> Edit
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
        )}
      </div>

      {/* 7. AGENT ACTIVATION CATEGORY SUMMARY & MANAGEMENT ALERT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Agent Category Summary Table */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-400" /> B2B Agent Activation Category Breakdown
            </h3>
            <button
              onClick={() => onNavigate('focus')}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
            >
              Open Focus List Center <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#090e1a] text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3">Agent Category</th>
                  <th className="p-3 text-center">Count</th>
                  <th className="p-3 text-center">% of Total</th>
                  <th className="p-3 text-right">Strategic Action Needed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                <tr className="hover:bg-slate-850/60 transition">
                  <td className="p-3 font-semibold text-emerald-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active Booking Clients
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-100">{funnel?.active || 0}</td>
                  <td className="p-3 text-center font-mono text-slate-400">{activeRate}%</td>
                  <td className="p-3 text-right text-xs text-emerald-400 font-medium">Maintain VIP Ticketing SLA</td>
                </tr>
                <tr className="hover:bg-slate-850/60 bg-amber-500/5">
                  <td className="p-3 text-amber-300 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span> 🎯 Visited Agents Who Gave Queries
                  </td>
                  <td className="p-3 text-center font-mono font-black text-amber-300 text-sm">{funnel?.query_giving || 0}</td>
                  <td className="p-3 text-center font-mono text-amber-300">
                    {Math.round(((funnel?.query_giving || 0) / (funnel?.visited || 1)) * 100)}% of Visited
                  </td>
                  <td className="p-3 text-right text-xs text-amber-300 font-medium">Direct Marketing Success</td>
                </tr>
                <tr className="hover:bg-slate-850/60 transition">
                  <td className="p-3 font-semibold text-amber-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Visited but Zero Query Yet
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-100">{funnel?.visited_no_query || 0}</td>
                  <td className="p-3 text-center font-mono text-slate-400">{Math.round(((funnel?.visited_no_query || 0) / (funnel?.visited || 1)) * 100)}%</td>
                  <td className="p-3 text-right text-xs text-amber-400 font-medium">Telephonic Re-engagement</td>
                </tr>
                <tr className="hover:bg-slate-850/60 transition">
                  <td className="p-3 font-semibold text-rose-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Called - Not Connected
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-100">{funnel?.no_response || 0}</td>
                  <td className="p-3 text-center font-mono text-slate-400">{Math.round(((funnel?.no_response || 0) / (funnel?.total || 1)) * 100)}%</td>
                  <td className="p-3 text-right text-xs text-rose-400 font-medium">Re-dial on WhatsApp / Alternate</td>
                </tr>
                <tr className="hover:bg-slate-850/60 transition">
                  <td className="p-3 font-semibold text-orange-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span> Previously Active (Dormant)
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-100">{funnel?.dormant || 0}</td>
                  <td className="p-3 text-center font-mono text-slate-400">{Math.round(((funnel?.dormant || 0) / (funnel?.total || 1)) * 100)}%</td>
                  <td className="p-3 text-right text-xs text-orange-400 font-bold">HIGH PRIORITY RE-ACTIVATION</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Action Alert Box */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" /> Management Priority Alert
            </div>
            <h4 className="text-base font-bold text-slate-100">Quotation Dropouts (Zero Bookings Won)</h4>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              These travel agents reach out to Travelx for flight and package quotes but drop off before converting.
            </p>
            <div className="mt-4 p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5">
              <p className="text-slate-300"><strong>Main Lost Reason:</strong> Competitor Rate (42%)</p>
              <p className="text-slate-300"><strong>Top Territory:</strong> Gurdaspur & Batala</p>
              <p className="text-slate-300"><strong>Resolution:</strong> Fast 15-min quotation & special gross margins</p>
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
