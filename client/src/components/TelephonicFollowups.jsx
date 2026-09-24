import React, { useState, useEffect, useMemo } from 'react';
import { 
  Phone, Plus, Calendar, FileText, CheckCircle2, AlertCircle, PhoneCall, PhoneOff, 
  Eye, Trash2, Filter, X, Download, MapPin, Clock, MessageSquare, Zap, ArrowRight, 
  Target, Sparkles, UserCheck, XCircle, ChevronDown, ChevronUp, Search, SlidersHorizontal 
} from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';

export default function TelephonicFollowups({ onOpenModal, onOpenAgentDrawer }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [execFilter, setExecFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Search & Column Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [connectivityFilter, setConnectivityFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  // Collapsible Dropdown Section Headers
  const [showKpiStrip, setShowKpiStrip] = useState(true);
  const [showCallsDesk, setShowCallsDesk] = useState(true);

  // Bikramjit Physical Visit Queue for Simranjit Next-Day Feedback
  const [visitQueue, setVisitQueue] = useState([]);
  const [showQueue, setShowQueue] = useState(true);
  const [queueTab, setQueueTab] = useState('pending'); // 'pending', 'completed', 'all'
  const [quickReqVisit, setQuickReqVisit] = useState(null);
  const [quickReqText, setQuickReqText] = useState('');
  const [quickPaymentTerms, setQuickPaymentTerms] = useState('Advance Payment');

  // Location Coverage Matrix State (Visited vs Unvisited Agents by City)
  const [coverageData, setCoverageData] = useState(null);
  const [selectedCityCoverage, setSelectedCityCoverage] = useState('');
  const [coverageFilter, setCoverageFilter] = useState('all');
  const [showCoverageCard, setShowCoverageCard] = useState(false);

  useEffect(() => {
    fetchCalls();
    fetchVisitQueue();
    fetchLocationCoverage();
  }, [execFilter, resultFilter, dateFilter, fromDate, toDate]);

  const fetchLocationCoverage = async (city = selectedCityCoverage, filter = coverageFilter) => {
    try {
      const params = new URLSearchParams();
      if (city) params.append('city', city);
      if (filter) params.append('filter', filter);
      const res = await fetch(`/api/location-coverage?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCoverageData(json);
        if (!selectedCityCoverage) setSelectedCityCoverage(json.selectedCity);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVisitQueue = async () => {
    try {
      const res = await fetch('/api/visits/pending-followup');
      const json = await res.json();
      if (json.success) setVisitQueue(json.queue);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (execFilter) params.append('executive', execFilter);
      if (resultFilter && resultFilter.toLowerCase() !== 'due today') params.append('result', resultFilter);
      if (dateFilter) params.append('date', dateFilter);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);

      const res = await fetch(`/api/calls?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCalls(json.calls);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCall = async (callId) => {
    if (!window.confirm('🗑️ Are you sure you want to delete this call log record?')) return;
    try {
      const res = await fetch(`/api/calls/${callId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert('✅ Call log deleted successfully');
        fetchCalls();
        fetchVisitQueue();
      } else {
        alert(json.error || 'Failed to delete call');
      }
    } catch (err) {
      alert('Error deleting call log');
    }
  };

  const handleDeleteVisit = async (visitId, companyName) => {
    if (!window.confirm(`🗑️ Are you sure you want to delete the physical visit record for "${companyName || 'this agency'}"? This will remove this entry from the pending follow-up queue.`)) return;
    try {
      const res = await fetch(`/api/visits/${visitId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert('✅ Visit record deleted successfully');
        fetchVisitQueue();
        fetchLocationCoverage();
      } else {
        alert(json.error || 'Failed to delete visit');
      }
    } catch (err) {
      alert('Error deleting visit: ' + err.message);
    }
  };

  const handleDeleteCallFromQueue = async (callId, companyName) => {
    if (!window.confirm(`🗑️ Are you sure you want to delete the call log for "${companyName || 'this agency'}"? The visit will revert to "Pending Next-Day Call".`)) return;
    try {
      const res = await fetch(`/api/calls/${callId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert('✅ Call log deleted successfully');
        fetchVisitQueue();
        fetchCalls();
      } else {
        alert(json.error || 'Failed to delete call log');
      }
    } catch (err) {
      alert('Error deleting call: ' + err.message);
    }
  };

  const handleQuickLog = async (visit, resultType, customRequirement = '', paymentTerms = 'Advance Payment') => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    let isConnected = resultType !== 'not_picked';
    let callResult = 'Requirement Received';
    let interestLevel = 'Very Interested / Hot';
    let remarks = '';
    let nextDate = today;

    if (resultType === 'requirement') {
      callResult = 'Requirement Received';
      interestLevel = 'Very Interested / Hot';
      remarks = customRequirement ? `Requirement Captured: ${customRequirement}` : 'Immediate inquiry received on follow-up call';
      nextDate = today;
    } else if (resultType === 'call_tomorrow') {
      callResult = 'Call Again Later';
      interestLevel = 'Interested / Warm';
      remarks = 'Agent busy, requested to call back tomorrow';
      nextDate = tomorrow;
    } else if (resultType === 'not_picked') {
      callResult = 'Not Picked / Ringing';
      interestLevel = 'Interested / Warm';
      remarks = 'Phone ringing / call not picked up';
      nextDate = tomorrow;
    } else if (resultType === 'not_interested') {
      callResult = 'Not Interested';
      interestLevel = 'Not Interested';
      remarks = 'Agent currently not interested in B2B services';
      nextDate = '';
    }

    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_date: today,
          agent_id: visit.agent_id,
          visit_id: visit.visit_id,
          executive_name: 'Simranjit Kaur',
          is_connected: isConnected,
          services_discussed: visit.products_pitched || ['Domestic Flight'],
          interest_level: interestLevel,
          call_result: callResult,
          agent_requirement: customRequirement || (resultType === 'requirement' ? 'Requirement captured' : ''),
          remarks: remarks,
          next_followup_date: nextDate,
          payment_terms: paymentTerms
        })
      });

      const json = await res.json();
      if (json.success) {
        fetchVisitQueue();
        fetchCalls();
        if (resultType === 'requirement') {
          if (window.confirm('🎉 Direct Requirement Saved! Agent stage upgraded to "Query Received".\n\nWould you like to open "Create Query" to generate an official booking quote right now?')) {
            onOpenModal('create_query', {
              agent_id: visit.agent_id,
              company_name: visit.company_name,
              handling_employee: 'Simranjit Kaur',
              notes: customRequirement
            });
          }
        }
      } else {
        alert(json.error || 'Failed to log call outcome');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const clearDateFilters = () => {
    setDateFilter('');
    setFromDate('');
    setToDate('');
  };

  const resetAllFilters = () => {
    setExecFilter('');
    setResultFilter('');
    setDateFilter('');
    setFromDate('');
    setToDate('');
    setSearchTerm('');
    setConnectivityFilter('');
    setPaymentFilter('');
    setCityFilter('');
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const distinctCities = useMemo(() => {
    const set = new Set();
    calls.forEach(c => {
      if (c.agent_city && c.agent_city.trim()) set.add(c.agent_city.trim());
    });
    return Array.from(set).sort();
  }, [calls]);

  const dueTodayCalls = useMemo(() => {
    return calls.filter(c => {
      const isCallAgain = (c.call_result || '').toLowerCase().includes('again') || (c.call_result || '').toLowerCase().includes('later') || (c.call_result || '').toLowerCase().includes('follow');
      return isCallAgain && c.next_followup_date && c.next_followup_date <= todayStr;
    });
  }, [calls, todayStr]);

  const filteredCalls = useMemo(() => {
    return calls.filter(c => {
      if (resultFilter) {
        const resStr = (c.call_result || '').toLowerCase();
        const filterLower = resultFilter.toLowerCase();

        if (filterLower === 'due today') {
          const isCallAgain = resStr.includes('again') || resStr.includes('later') || resStr.includes('follow');
          if (!isCallAgain || !c.next_followup_date || c.next_followup_date > todayStr) return false;
        } else if (filterLower === 'not interested') {
          if (!resStr.includes('not interested') && !resStr.includes("don't call")) return false;
        } else if (filterLower === 'closed') {
          if (!resStr.includes('closed')) return false;
        } else if (filterLower === 'interested') {
          if (!resStr.includes('interested') || resStr.includes('not interested') || resStr.includes('closed')) return false;
        } else if (filterLower === 'call again') {
          if (!resStr.includes('call again') && !resStr.includes('again') && !resStr.includes('follow-up') && !resStr.includes('followup') && !resStr.includes('later')) return false;
        } else if (filterLower === 'requirement received') {
          if (!resStr.includes('requirement') && !resStr.includes('received')) return false;
        } else if (!resStr.includes(filterLower)) {
          return false;
        }
      }

      if (connectivityFilter) {
        if (connectivityFilter === 'connected' && !c.is_connected) return false;
        if (connectivityFilter === 'not_connected' && c.is_connected) return false;
      }

      if (paymentFilter) {
        if (!(c.payment_terms || '').toLowerCase().includes(paymentFilter.toLowerCase())) return false;
      }

      if (cityFilter) {
        if ((c.agent_city || '').toLowerCase() !== cityFilter.toLowerCase()) return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches = 
          (c.company_name || '').toLowerCase().includes(q) ||
          (c.agent_name || '').toLowerCase().includes(q) ||
          (c.agent_mobile || '').toLowerCase().includes(q) ||
          (c.agent_city || '').toLowerCase().includes(q) ||
          (c.remarks || '').toLowerCase().includes(q) ||
          (c.agent_requirement || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [calls, resultFilter, connectivityFilter, paymentFilter, cityFilter, searchTerm, todayStr]);

  const handleExportPDF = () => {
    const headers = ['Call Date', 'Executive', 'Agency Firm', 'Mobile', 'Connectivity', 'Result', 'Captured Requirement', 'Remarks'];
    const rows = filteredCalls.map(c => [
      c.call_date,
      c.executive_name,
      c.company_name,
      c.agent_mobile || c.mobile,
      c.is_connected ? 'Connected' : 'Not Connected',
      c.call_result,
      c.agent_requirement || c.services_discussed || '-',
      c.remarks || '-'
    ]);
    exportToPDF('Stage 2 - Telephonic Follow-up Call Logs Report', headers, rows, 'Travelx_Telephonic_Calls_Report.pdf');
  };

  const renderPitchedServices = (services) => {
    if (!services) return null;
    let list = [];
    if (Array.isArray(services)) {
      list = services;
    } else if (typeof services === 'string') {
      try {
        const parsed = JSON.parse(services);
        if (Array.isArray(parsed)) list = parsed;
        else list = [services];
      } catch (e) {
        list = services.split(',').map(s => s.trim());
      }
    }
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {list.map((s, idx) => (
          <span key={idx} className="bg-slate-800/90 text-sky-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-700/80">
            {s}
          </span>
        ))}
      </div>
    );
  };

  const handleQuickReschedule = async (callItem) => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const newDate = window.prompt(`🔄 Reschedule "Call Again Later" for ${callItem.company_name}:\n\nEnter next follow-up date (YYYY-MM-DD):`, tomorrow);
    if (!newDate) return;
    try {
      const res = await fetch(`/api/calls/${callItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_result: 'Call Again Later',
          next_followup_date: newDate.trim(),
          remarks: callItem.remarks ? `${callItem.remarks} | Rescheduled` : 'Rescheduled to Call Again Later'
        })
      });
      const j = await res.json();
      if (j.success) {
        fetchCalls();
        fetchVisitQueue();
        alert(`✅ Rescheduled callback for ${newDate.trim()} successfully!`);
      } else {
        alert(j.error || 'Failed to reschedule');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleQuickClose = async (callItem) => {
    if (!window.confirm(`Are you sure you want to mark follow-up for "${callItem.company_name}" as CLOSED / NOT INTERESTED?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/calls/${callItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_result: 'Closed - Not Interested',
          next_followup_date: '',
          remarks: callItem.remarks ? `${callItem.remarks} | Marked Closed` : 'Marked Closed by executive'
        })
      });
      const j = await res.json();
      if (j.success) {
        fetchCalls();
        fetchVisitQueue();
        alert(`❌ Follow-up for "${callItem.company_name}" marked as Closed!`);
      } else {
        alert(j.error || 'Failed to close call');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
            <Phone className="w-5 h-5 text-blue-400" /> Stage 2 – Telephonic Follow-up Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Office telephonic queue for calling visited travel agents and capturing immediate requirements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/export/calls"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel (.xlsx)
          </a>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1] font-semibold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" /> Download PDF
          </button>
          <button
            onClick={() => onOpenModal('log_call')}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-900/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Log Call Outcome
          </button>
        </div>
      </div>

      {/* 🎯 Executive Target & Work-Focus Command Bar */}
      {(() => {
        const pendingQueue = visitQueue.filter(v => !v.call_id);
        const calledQueue = visitQueue.filter(v => !!v.call_id);
        const requirementsCount = calls.filter(c => (c.call_result || '').toLowerCase().includes('requirement')).length;
        const connectedCallsCount = calls.filter(c => c.is_connected).length;
        const scheduledCallbacksCount = calls.filter(c => (c.call_result || '').toLowerCase().includes('again') || (c.call_result || '').toLowerCase().includes('follow') || (c.call_result || '').toLowerCase().includes('later')).length;

        const displayedQueue = queueTab === 'pending'
          ? pendingQueue
          : (queueTab === 'completed' ? calledQueue : visitQueue);

        return (
          <>
            {/* Quick Target Mode Focus Bar */}
            <div className="bg-[#0b1120] border border-white/[0.08] p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-lg">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold pl-1">
                <Target className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Active Target Focus:</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-1.5">
                {/* 1. Due Today Callbacks */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCallsDesk(true);
                    setResultFilter('Due Today');
                    setDateFilter('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    resultFilter === 'Due Today'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-white/[0.04] hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                  title="Filter to callbacks scheduled for Today or Overdue"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>⏰ Due Callbacks ({dueTodayCalls.length})</span>
                </button>

                {/* 2. Field Handover Pending */}
                <button
                  type="button"
                  onClick={() => {
                    setShowQueue(true);
                    setQueueTab('pending');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    showQueue && queueTab === 'pending'
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'bg-white/[0.04] hover:bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  }`}
                  title="View Visited Agents Waiting for Simranjit Calling"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>🚗 Visited Queue ({pendingQueue.length})</span>
                </button>

                {/* 3. Won Enquiries */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCallsDesk(true);
                    setResultFilter('Requirement Received');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    resultFilter === 'Requirement Received'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'bg-white/[0.04] hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                  title="View requirements captured / won"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⚡ Won Enquiries ({requirementsCount})</span>
                </button>

                {/* 4. City Coverage Matrix */}
                <button
                  type="button"
                  onClick={() => setShowCoverageCard(!showCoverageCard)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    showCoverageCard
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white/[0.04] hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}
                  title="View City-Wise Visited vs Missed Agent Matrix"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>📍 City Matrix</span>
                </button>

                {/* 5. All Calls History */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCallsDesk(true);
                    setResultFilter('');
                    setSearchTerm('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    showCallsDesk && !resultFilter && !searchTerm
                      ? 'bg-slate-700 text-white'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08]'
                  }`}
                  title="View All Telephonic Follow-up Call Logs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>📞 All Calls ({calls.length})</span>
                </button>
              </div>
            </div>

            {/* 🎯 Section 1: KPI Targets Strip (Collapsible Accordion) */}
            <div className="bg-[#0b1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-lg transition-all">
              <div 
                onClick={() => setShowKpiStrip(!showKpiStrip)}
                className="p-4 bg-[#080d19] hover:bg-[#0d1627] flex items-center justify-between cursor-pointer border-b border-white/[0.04] transition select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      🎯 Daily Telephonic Conversion Targets & Performance KPIs
                    </h2>
                    <p className="text-[11px] text-slate-400">Track inquiries won, pending callbacks, and successful agent discussions</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                    ⚡ {requirementsCount} Won
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/80">
                    ⏰ {pendingQueue.length} Pending
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/[0.05] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1">
                    {showKpiStrip ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span>{showKpiStrip ? 'Collapse' : 'Open'}</span>
                  </span>
                </div>
              </div>

              {showKpiStrip && (
                <div className="p-4 border-t border-white/[0.04] grid grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0a0f1d]/60">
                  <div className="bg-[#0c1322] border border-emerald-500/30 p-3.5 rounded-xl flex items-center justify-between shadow-lg shadow-emerald-950/20">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" /> Queries / Enquiries Won
                      </span>
                      <div className="text-2xl font-extrabold text-white font-mono mt-0.5">{requirementsCount}</div>
                      <span className="text-[11px] text-emerald-400/80 font-medium">Direct B2B Business Generated</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Target className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-[#0c1322] border border-amber-500/30 p-3.5 rounded-xl flex items-center justify-between shadow-lg shadow-amber-950/20">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" /> Pending Action Today
                      </span>
                      <div className="text-2xl font-extrabold text-white font-mono mt-0.5">{pendingQueue.length}</div>
                      <span className="text-[11px] text-amber-400/80 font-medium">Visited Agents To Call</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-[#0c1322] border border-blue-500/30 p-3.5 rounded-xl flex items-center justify-between shadow-lg shadow-blue-950/20">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> Connected Calls Logged
                      </span>
                      <div className="text-2xl font-extrabold text-white font-mono mt-0.5">{connectedCallsCount}</div>
                      <span className="text-[11px] text-blue-400/80 font-medium">Successful Interactions</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Phone className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="bg-[#0c1322] border border-white/[0.08] p-3.5 rounded-xl flex items-center justify-between shadow-lg">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Total Handed-Over Visits
                      </span>
                      <div className="text-2xl font-extrabold text-white font-mono mt-0.5">{visitQueue.length}</div>
                      <span className="text-[11px] text-slate-400 font-medium">From Bikramjit's Field Route</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-300">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 🚗 Section 2: Visited Agents Queue (Collapsible Accordion) */}
            <div className="bg-[#0b1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl transition-all">
              <div 
                onClick={() => setShowQueue(!showQueue)}
                className="p-4 bg-[#080d19] hover:bg-[#0d1627] flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer border-b border-white/[0.04] transition select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      🚗 Visited Travel Agents Queue (Bikramjit ➔ Simranjit Handover)
                    </h2>
                    <p className="text-[11px] text-slate-400">Call agents visited yesterday by Bikramjit to capture inquiries and lock bookings</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto" onClick={e => e.stopPropagation()}>
                  {/* Queue Filter Tabs */}
                  <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-xl border border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => { setQueueTab('pending'); setShowQueue(true); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        queueTab === 'pending'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>Pending ({pendingQueue.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setQueueTab('completed'); setShowQueue(true); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                        queueTab === 'completed'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Logged ({calledQueue.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setQueueTab('all'); setShowQueue(true); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        queueTab === 'all'
                          ? 'bg-white/[0.1] text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      All ({visitQueue.length})
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowQueue(!showQueue)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {showQueue ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    <span>{showQueue ? 'Collapse' : 'Open'}</span>
                  </button>
                </div>
              </div>

              {showQueue && (
                <div className="p-4 border-t border-white/[0.04]">
                <div className="overflow-x-auto border border-white/[0.06] rounded-xl">
                  <table className="w-full table-fixed min-w-[1100px] text-left text-xs text-slate-300 border-collapse">
                    <colgroup>
                      <col className="w-[105px]" />
                      <col className="w-[230px]" />
                      <col className="w-[140px]" />
                      <col className="w-[200px]" />
                      <col className="w-[170px]" />
                      <col className="w-[255px]" />
                    </colgroup>
                    <thead className="bg-[#090e1a] text-[11px] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3 whitespace-nowrap">Visit Date</th>
                        <th className="p-3 whitespace-nowrap">Visited Agency & 1-Click Connect</th>
                        <th className="p-3 whitespace-nowrap">Location & Area</th>
                        <th className="p-3">Bikramjit Pitched & Remarks</th>
                        <th className="p-3 whitespace-nowrap">Result / Status</th>
                        <th className="p-3 text-right whitespace-nowrap sticky right-0 bg-[#090e1a] z-20 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.7)] border-b border-slate-800">Result Action for Simranjit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                      {displayedQueue.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-400">
                            {queueTab === 'pending' ? (
                              <div className="space-y-1">
                                <span className="text-2xl">🎉</span>
                                <p className="font-bold text-emerald-400 text-sm">All caught up! Zero pending calls.</p>
                                <p className="text-xs text-slate-500">Every visited agent has been called and feedback logged.</p>
                              </div>
                            ) : (
                              'No records found for selected filter.'
                            )}
                          </td>
                        </tr>
                      ) : (
                        displayedQueue.map((v) => {
                          const isCalled = !!v.call_id;
                          let pitched = [];
                          try { pitched = typeof v.products_pitched === 'string' ? JSON.parse(v.products_pitched) : (v.products_pitched || []); } catch(e){}
                          const cleanMobile = (v.contact_mobile || '').replace(/\D/g, '');
                          const waGreeting = encodeURIComponent(`Hello ${v.person_met || 'Sir'}, Bikramjit from TravelX visited your office yesterday. Do you have any flight ticket or tour package requirement today?`);

                          return (
                            <tr key={v.visit_id} className="hover:bg-slate-800/30 transition group">
                              <td className="p-3 font-mono font-bold text-slate-200 whitespace-nowrap align-middle">{v.visit_date}</td>
                              <td className="p-3 align-middle">
                                <div className="font-bold text-sky-400 text-sm">{v.company_name}</div>
                                <div className="text-slate-300 font-medium">{v.person_met}</div>
                                
                                {/* 1-Click Dial & WhatsApp Shortcuts */}
                                <div className="flex items-center gap-1.5 mt-1.5 whitespace-nowrap">
                                  {v.contact_mobile && (
                                    <>
                                      <a
                                        href={`tel:${v.contact_mobile}`}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-[11px] font-mono transition"
                                        title="Click to dial"
                                      >
                                        <Phone className="w-3 h-3 text-sky-400" /> {v.contact_mobile}
                                      </a>
                                      {cleanMobile && (
                                        <a
                                          href={`https://wa.me/91${cleanMobile}?text=${waGreeting}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold transition"
                                          title="Send WhatsApp greeting"
                                        >
                                          <MessageSquare className="w-3 h-3 text-emerald-400" /> WA
                                        </a>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 whitespace-nowrap align-middle">
                                <div className="text-slate-200 font-medium">{v.agent_city}</div>
                                <div className="text-slate-400 text-[11px]">{v.agent_area}</div>
                              </td>
                              <td className="p-3 max-w-xs align-middle">
                                <div className="flex flex-wrap gap-1 mb-1">
                                  {pitched.map((p, i) => (
                                    <span key={i} className="bg-slate-800/80 text-slate-300 text-[10px] px-1.5 py-0.5 rounded border border-slate-700/60 font-medium">
                                      {p}
                                    </span>
                                  ))}
                                </div>
                                <div className="text-xs text-slate-400 truncate" title={v.visit_remarks}>{v.visit_remarks || 'No notes'}</div>
                              </td>
                              <td className="p-3 whitespace-nowrap align-middle">
                                {isCalled ? (
                                  <div className="space-y-1">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 border whitespace-nowrap ${
                                      (v.call_result || '').includes('Requirement')
                                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                        : (v.call_result || '').includes('Not')
                                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                                        : 'bg-blue-950 text-blue-300 border-blue-800'
                                    }`}>
                                      <CheckCircle2 className="w-3 h-3" /> {v.call_result}
                                    </span>
                                    {v.call_feedback && <div className="text-[11px] text-slate-400 italic max-w-xs">"{v.call_feedback}"</div>}
                                  </div>
                                ) : (
                                  <span className="bg-amber-950/80 text-amber-300 border border-amber-800/80 px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 whitespace-nowrap">
                                    <Clock className="w-3 h-3 text-amber-400" /> 🟡 Call Pending
                                  </span>
                                )}
                              </td>
                              <td className="p-2.5 text-right whitespace-nowrap align-middle sticky right-0 bg-[#070b14] group-hover:bg-[#0f172a] transition-colors z-10 shadow-[-8px_0_12px_-4px_rgba(0,0,0,0.7)]">
                                {isCalled ? (
                                  <div className="flex flex-col gap-1 items-end">
                                    {/* Row 1: Calling, Again, Closed */}
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => onOpenModal('log_call', {
                                          agent_id: v.agent_id,
                                          visit_id: v.visit_id,
                                          company_name: v.company_name,
                                          name: v.person_met,
                                          mobile: v.contact_mobile,
                                          city: v.agent_city,
                                          call_date: new Date().toISOString().split('T')[0],
                                          executive_name: 'Simranjit Kaur',
                                          call_result: 'Call Connected / In Discussion'
                                        })}
                                        className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold shadow-sm transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                        title="Call Agent Again / Log New Call Today"
                                      >
                                        <PhoneCall className="w-3 h-3" /> Calling
                                      </button>

                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                                          try {
                                            const res = await fetch(`/api/calls/${v.call_id}`, {
                                              method: 'PUT',
                                              headers: { 'Content-Type': 'application/json' },
                                              body: JSON.stringify({
                                                call_result: 'Call Again Later',
                                                next_followup_date: tomorrow,
                                                remarks: 'Scheduled to Call Again Later'
                                              })
                                            });
                                            const j = await res.json();
                                            if (j.success) {
                                              fetchVisitQueue();
                                              fetchCalls();
                                              alert(`🔄 Rescheduled Call Again Later for Tomorrow (${tomorrow})!`);
                                            }
                                          } catch (e) { alert(e.message); }
                                        }}
                                        className="px-2 py-1 rounded text-[11px] font-bold bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-800/80 transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                        title="Quick Reschedule: Call Tomorrow"
                                      >
                                        <Clock className="w-3 h-3 text-amber-400" /> Again
                                      </button>

                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (window.confirm(`Mark follow-up for "${v.company_name}" as CLOSED?`)) {
                                            try {
                                              const res = await fetch(`/api/calls/${v.call_id}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                  call_result: 'Closed - Not Interested',
                                                  next_followup_date: '',
                                                  remarks: 'Follow-up marked as Closed'
                                                })
                                              });
                                              const j = await res.json();
                                              if (j.success) {
                                                fetchVisitQueue();
                                                fetchCalls();
                                                alert('❌ Follow-up closed successfully!');
                                              }
                                            } catch (e) { alert(e.message); }
                                          }
                                        }}
                                        className="px-2 py-1 rounded text-[11px] font-bold bg-rose-950/90 hover:bg-rose-900 text-rose-300 border border-rose-800/80 transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                        title="Mark as Closed / Not Interested"
                                      >
                                        <XCircle className="w-3 h-3 text-rose-400" /> Closed
                                      </button>
                                    </div>

                                    {/* Row 2: Secondary Utilities (Query, Edit, 360, Delete) */}
                                    <div className="flex items-center gap-1 text-[10px]">
                                      {(v.call_result || '').includes('Requirement') && (
                                        <button
                                          type="button"
                                          onClick={() => onOpenModal('create_query', {
                                            agent_id: v.agent_id,
                                            company_name: v.company_name,
                                            handling_employee: 'Simranjit Kaur',
                                            notes: v.agent_requirement || v.call_feedback || ''
                                          })}
                                          className="px-1.5 py-0.5 rounded font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition flex items-center gap-0.5 whitespace-nowrap"
                                          title="Convert directly to Stage 3 Sales Query"
                                        >
                                          <Zap className="w-2.5 h-2.5" /> Query
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => onOpenModal('log_call', {
                                          id: v.call_id,
                                          call_id: v.call_id,
                                          agent_id: v.agent_id,
                                          visit_id: v.visit_id,
                                          company_name: v.company_name,
                                          name: v.person_met,
                                          mobile: v.contact_mobile,
                                          city: v.agent_city,
                                          call_date: v.call_date,
                                          executive_name: v.call_executive,
                                          call_result: v.call_result,
                                          remarks: v.call_feedback,
                                          agent_requirement: v.agent_requirement,
                                          payment_terms: v.payment_terms,
                                          services_discussed: v.services_discussed,
                                          is_connected: v.is_connected,
                                          next_followup_date: v.next_followup_date
                                        })}
                                        className="px-1.5 py-0.5 rounded font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                                        title="Edit Call Log"
                                      >
                                        ✏️ Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => onOpenAgentDrawer(v.agent_id)}
                                        className="px-1.5 py-0.5 rounded font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                                        title="View 360 Agent Profile"
                                      >
                                        👁️ 360°
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCallFromQueue(v.call_id, v.company_name)}
                                        className="p-1 rounded font-bold bg-rose-950/40 hover:bg-rose-900 text-rose-400 border border-rose-800/60 transition"
                                        title="Delete Call Log (Revert to Pending)"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-1 items-end">
                                    {/* Row 1: Fast Log Buttons */}
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setQuickReqVisit(v);
                                          setQuickReqText('');
                                          setQuickPaymentTerms('Advance Payment');
                                        }}
                                        className="px-2 py-1 rounded text-[11px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                        title="Agent shared enquiry/requirement"
                                      >
                                        <Zap className="w-3 h-3 text-amber-300" /> Got Query
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleQuickLog(v, 'call_tomorrow')}
                                        className="px-2 py-1 rounded text-[11px] font-bold bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-800/80 transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                        title="Agent asked to call back tomorrow"
                                      >
                                        <Clock className="w-3 h-3 text-amber-400" /> Tomorrow
                                      </button>
                                    </div>

                                    {/* Row 2: Secondary Options */}
                                    <div className="flex items-center gap-1 text-[10px]">
                                      <button
                                        type="button"
                                        onClick={() => handleQuickLog(v, 'not_picked')}
                                        className="px-1.5 py-0.5 rounded font-medium bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-800/70 transition flex items-center gap-0.5 cursor-pointer whitespace-nowrap"
                                        title="Phone ringing / Not answered"
                                      >
                                        <PhoneOff className="w-2.5 h-2.5 text-rose-400" /> No Answer
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => onOpenModal('log_call', {
                                          agent_id: v.agent_id,
                                          visit_id: v.visit_id,
                                          company_name: v.company_name,
                                          name: v.person_met,
                                          mobile: v.contact_mobile,
                                          city: v.agent_city
                                        })}
                                        className="px-1.5 py-0.5 rounded font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition flex items-center gap-0.5"
                                        title="Open Full Form"
                                      >
                                        <Plus className="w-2.5 h-2.5" /> Full Log
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => onOpenAgentDrawer(v.agent_id)}
                                        className="px-1.5 py-0.5 rounded font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                                        title="View 360 Agent Profile"
                                      >
                                        👁️ 360°
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteVisit(v.visit_id, v.company_name)}
                                        className="p-1 rounded font-bold bg-rose-950/40 hover:bg-rose-900 text-rose-400 border border-rose-800/60 transition"
                                        title="Delete Visit"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </td>
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

            {/* 🎯 FAST RESULT MODAL: CAPTURE REQUIREMENT */}
            {quickReqVisit && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#0c1322] border border-emerald-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in-95">
                  <div className="flex justify-between items-start border-b border-white/[0.08] pb-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Direct Query Capture
                      </span>
                      <h3 className="text-lg font-extrabold text-white mt-0.5">
                        {quickReqVisit.company_name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {quickReqVisit.person_met} &bull; {quickReqVisit.agent_city} &bull; <span className="font-mono text-slate-300">{quickReqVisit.contact_mobile}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => setQuickReqVisit(null)}
                      className="p-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        What ticket / package did the agent ask for? 🎯
                      </label>
                      <textarea
                        rows="3"
                        autoFocus
                        value={quickReqText}
                        onChange={(e) => setQuickReqText(e.target.value)}
                        placeholder="e.g. 2 Tickets Delhi to Dubai on 15th Sep, looking for group rate or Thailand 4 Pax package..."
                        className="w-full bg-[#070b14] border border-white/[0.1] focus:border-emerald-500 text-slate-200 p-3 rounded-xl text-xs focus:outline-none"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Payment Terms (पेमेंट कैसे देगा?)
                      </label>
                      <select
                        value={quickPaymentTerms}
                        onChange={(e) => setQuickPaymentTerms(e.target.value)}
                        className="w-full bg-[#070b14] border border-white/[0.1] text-emerald-300 font-bold p-2.5 rounded-xl text-xs focus:outline-none"
                      >
                        <option value="Advance Payment">⚡ Advance Payment (Pehle Payment)</option>
                        <option value="50% Advance / 50% Balance">🌗 50% Advance / 50% Balance</option>
                        <option value="After Booking / Credit">💳 After Booking / Credit</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setQuickReqVisit(null)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!quickReqText.trim()}
                      onClick={async () => {
                        const v = quickReqVisit;
                        const req = quickReqText.trim();
                        const terms = quickPaymentTerms;
                        setQuickReqVisit(null);
                        await handleQuickLog(v, 'requirement', req, terms);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5" /> Save & Lock Enquiry 🚀
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* 📍 Section 3: City-Wise Bikramjit Visit & Missed Agent Tracker (Collapsible Accordion) */}
      <div className="bg-[#0b1120] border border-indigo-500/30 rounded-2xl overflow-hidden shadow-xl transition-all">
        <div 
          onClick={() => setShowCoverageCard(!showCoverageCard)}
          className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 hover:from-slate-800 hover:to-indigo-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer border-b border-indigo-500/20 transition select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                📍 City-Wise Agent Visit Matrix (Bikramjit Visited vs Missed Agents)
              </h2>
              <p className="text-[11px] text-slate-400">See who Bikramjit MET (🟢) and who he MISSED (🔴) in each city for 100% market coverage</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto" onClick={e => e.stopPropagation()}>
            {/* City Selector */}
            <select
              value={selectedCityCoverage}
              onChange={(e) => {
                setSelectedCityCoverage(e.target.value);
                fetchLocationCoverage(e.target.value, coverageFilter);
              }}
              className="bg-slate-950 border border-indigo-500/60 text-indigo-300 font-bold rounded-xl text-xs px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="ALL">🌐 All Locations / All Cities</option>
              {(coverageData?.cities || ['Gurdaspur']).map(c => (
                <option key={c} value={c}>📍 City: {c}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowCoverageCard(!showCoverageCard)}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              {showCoverageCard ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showCoverageCard ? 'Collapse' : 'Open Matrix'}</span>
            </button>
          </div>
        </div>

        {showCoverageCard && (
          <div className="p-4 border-t border-indigo-500/10 space-y-3 bg-[#0a0f1d]/60">
            {/* City Summary Badges & Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="text-slate-300 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                  🏙️ Total Agents in {coverageData?.selectedCity === 'ALL' || !coverageData?.selectedCity ? 'All Locations' : coverageData?.selectedCity}: <strong className="text-white">{coverageData?.stats?.total_agents || 0}</strong>
                </span>
                <span className="text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
                  🟢 Visited by Bikramjit: <strong className="text-white">{coverageData?.stats?.visited_agents || 0}</strong>
                </span>
                <span className="text-rose-400 bg-rose-950 px-3 py-1 rounded-full border border-rose-800">
                  🔴 Missed / Pending Visit: <strong className="text-white">{coverageData?.stats?.unvisited_agents || 0}</strong>
                </span>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => { setCoverageFilter('all'); fetchLocationCoverage(selectedCityCoverage, 'all'); }}
                  className={`px-3 py-1 rounded-lg font-bold transition ${coverageFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
                >
                  All ({coverageData?.stats?.total_agents || 0})
                </button>
                <button
                  onClick={() => { setCoverageFilter('visited'); fetchLocationCoverage(selectedCityCoverage, 'visited'); }}
                  className={`px-3 py-1 rounded-lg font-bold transition ${coverageFilter === 'visited' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-emerald-400 hover:bg-slate-800'}`}
                >
                  🟢 Visited (Mila) ({coverageData?.stats?.visited_agents || 0})
                </button>
                <button
                  onClick={() => { setCoverageFilter('unvisited'); fetchLocationCoverage(selectedCityCoverage, 'unvisited'); }}
                  className={`px-3 py-1 rounded-lg font-bold transition ${coverageFilter === 'unvisited' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-rose-400 hover:bg-slate-800'}`}
                >
                  🔴 Missed (Nahi Mila) ({coverageData?.stats?.unvisited_agents || 0})
                </button>
              </div>
            </div>

            {/* City Agency Table */}
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Agency Name & Contact</th>
                    <th className="p-3">Location Area</th>
                    <th className="p-3">Bikramjit Visit Status</th>
                    <th className="p-3">Simranjit Call Status</th>
                    <th className="p-3 text-right">Follow-Up Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {(!coverageData?.agents || coverageData.agents.length === 0) ? (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-slate-500">
                        No agencies found for selected city filter.
                      </td>
                    </tr>
                  ) : (
                    coverageData.agents.map((ag) => {
                      const isVisited = !!ag.visit_id;
                      const isCalled = !!ag.call_id;

                      return (
                        <tr key={ag.agent_id} className="hover:bg-slate-800/40">
                          <td className="p-3">
                            <div className="font-bold text-slate-100 text-sm">{ag.company_name}</div>
                            <div className="text-slate-400 text-[11px] font-mono">{ag.contact_person || 'Owner'} &bull; 📱 {ag.mobile}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-200">{ag.city}</div>
                            <div className="text-slate-400 text-[11px]">{ag.area}</div>
                          </td>
                          <td className="p-3">
                            {isVisited ? (
                              <div>
                                <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> 🟢 Visited on {ag.visit_date}
                                </span>
                                <div className="text-[11px] text-slate-400 mt-0.5">Met: {ag.person_met} &bull; "{ag.visit_remarks || 'No remarks'}"</div>
                              </div>
                            ) : (
                              <span className="bg-rose-950/80 text-rose-300 border border-rose-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-rose-400" /> 🔴 NOT VISITED (Pending Field Visit)
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            {isCalled ? (
                              <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                                🟢 Call Done ({ag.call_result})
                              </span>
                            ) : (
                              <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
                                ⚪ Call Pending
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => onOpenModal('log_call', {
                                agent_id: ag.agent_id,
                                visit_id: ag.visit_id || null,
                                company_name: ag.company_name,
                                name: ag.contact_person,
                                mobile: ag.mobile,
                                city: ag.city
                              })}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow flex items-center gap-1 ml-auto ${
                                isVisited
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                                  : 'bg-sky-700 hover:bg-sky-600 text-white'
                              }`}
                            >
                              <Phone className="w-3 h-3" /> {isVisited ? '📞 Call Visited Feedback' : '📞 Call Unvisited Agent'}
                            </button>
                          </td>
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

      {/* SECTION 4: TELEPHONIC CALLING DESK & ACTION LOGS (Collapsible Section Accordion) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Clickable Header Accordion Toggle */}
        <div 
          onClick={() => setShowCallsDesk(!showCallsDesk)}
          className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/30 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-850 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Telephonic Calling Desk & Action Logs
                </h3>
                <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {filteredCalls.length} Showing / {calls.length} Total
                </span>
                {dueTodayCalls.length > 0 && (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> {dueTodayCalls.length} Due Today
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full call registry with table header dropdowns, live search, 1-click dials & follow-up reschedules
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(execFilter || resultFilter || dateFilter || fromDate || toDate || searchTerm || connectivityFilter || paymentFilter || cityFilter) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  resetAllFilters();
                }}
                className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow"
              >
                <X className="w-3.5 h-3.5" /> Reset Filters
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleExportPDF();
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 shadow"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" /> Export PDF
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowCallsDesk(!showCallsDesk);
              }}
              className="px-3.5 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              {showCallsDesk ? (
                <>
                  <ChevronUp className="w-4 h-4 text-sky-400" />
                  <span>Collapse Desk</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 text-sky-400" />
                  <span>Open Desk ({filteredCalls.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showCallsDesk && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Live Search & Quick Target Focus Toolbar */}
            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Instant live search by Agency Name, Contact Person, Mobile, City, Requirements, Remarks..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none transition shadow-inner"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Target Filter Pills */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                    <Target className="w-3 h-3 text-sky-400" /> Status:
                  </span>

                  <button
                    onClick={() => setResultFilter('')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition shadow ${
                      !resultFilter ? 'bg-sky-500 text-slate-950 font-black' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    All Calls ({calls.length})
                  </button>

                  <button
                    onClick={() => setResultFilter('Due Today')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition shadow flex items-center gap-1 ${
                      resultFilter === 'Due Today'
                        ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-400/50'
                        : 'bg-amber-950/60 text-amber-300 hover:bg-amber-900 border border-amber-800/60'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-amber-400" /> ⏰ Due Today ({dueTodayCalls.length})
                  </button>

                  <button
                    onClick={() => setResultFilter('Requirement Received')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition shadow flex items-center gap-1 ${
                      resultFilter === 'Requirement Received'
                        ? 'bg-emerald-500 text-slate-950 font-black'
                        : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/60'
                    }`}
                  >
                    <Zap className="w-3 h-3 text-emerald-400" /> ⚡ Got Query ({calls.filter(c => (c.call_result || '').toLowerCase().includes('requirement')).length})
                  </button>

                  <button
                    onClick={() => setResultFilter('Call Again')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition shadow flex items-center gap-1 ${
                      resultFilter === 'Call Again'
                        ? 'bg-blue-500 text-white font-black'
                        : 'bg-blue-950/60 text-blue-300 hover:bg-blue-900 border border-blue-800/60'
                    }`}
                  >
                    🔄 Call Again ({calls.filter(c => (c.call_result || '').toLowerCase().includes('again') || (c.call_result || '').toLowerCase().includes('follow')).length})
                  </button>

                  <button
                    onClick={() => setResultFilter('Interested')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition shadow ${
                      resultFilter === 'Interested'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-amber-950/60 text-amber-300 hover:bg-amber-900 border border-amber-800/60'
                    }`}
                  >
                    🔥 Interested
                  </button>

                  <button
                    onClick={() => setResultFilter('Closed')}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition shadow ${
                      resultFilter === 'Closed'
                        ? 'bg-rose-500 text-white font-black'
                        : 'bg-rose-950/60 text-rose-300 hover:bg-rose-900 border border-rose-800/60'
                    }`}
                  >
                    ❌ Closed ({calls.filter(c => (c.call_result || '').toLowerCase().includes('closed') || (c.call_result || '').toLowerCase().includes('not interested')).length})
                  </button>
                </div>

                {/* Date Controls */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <button
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      setDateFilter(today);
                      setFromDate('');
                      setToDate('');
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      dateFilter === new Date().toISOString().split('T')[0]
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const y = new Date();
                      y.setDate(y.getDate() - 1);
                      const yStr = y.toISOString().split('T')[0];
                      setDateFilter(yStr);
                      setFromDate('');
                      setToDate('');
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      (() => {
                        const y = new Date();
                        y.setDate(y.getDate() - 1);
                        return dateFilter === y.toISOString().split('T')[0];
                      })()
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    Yesterday
                  </button>

                  <div className="flex items-center gap-1 text-slate-400">
                    <span>Date:</span>
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => {
                        setDateFilter(e.target.value);
                        setFromDate('');
                        setToDate('');
                      }}
                      className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded-lg text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="flex items-center gap-1 text-slate-400">
                    <span>From:</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => {
                        setFromDate(e.target.value);
                        setDateFilter('');
                      }}
                      className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded-lg text-xs focus:outline-none focus:border-sky-500"
                    />
                    <span>To:</span>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => {
                        setToDate(e.target.value);
                        setDateFilter('');
                      }}
                      className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded-lg text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {(dateFilter || fromDate || toDate) && (
                    <button
                      onClick={clearDateFilters}
                      className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition border border-slate-700"
                      title="Clear Date Filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Calling Table with Dropdown Filter Headers */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
              <div className="p-2.5 bg-slate-950 border-b border-slate-800/80 flex justify-between items-center text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-sky-400" />
                  <span>Filtered Calls: <strong className="text-sky-400 font-bold">{filteredCalls.length}</strong> / {calls.length} Total</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Tip: Use column dropdowns to filter directly on table headers
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full table-fixed min-w-[1480px] text-left text-xs text-slate-300 border-collapse">
                  <colgroup>
                    <col className="w-[105px]" />
                    <col className="w-[145px]" />
                    <col className="w-[215px]" />
                    <col className="w-[130px]" />
                    <col className="w-[185px]" />
                    <col className="w-[130px]" />
                    <col className="w-[185px]" />
                    <col />
                    <col className="w-[225px]" />
                  </colgroup>
                  <thead className="bg-[#090e1a] text-xs text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                    <tr>
                      {/* Call Date Header */}
                      <th className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">Call Date</span>
                        <span className="text-[11px] font-mono text-slate-300 font-bold">
                          {dateFilter ? dateFilter : 'Latest First'}
                        </span>
                      </th>

                      {/* Executive Dropdown Header */}
                      <th className="py-2 px-2.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Executive</span>
                          <select
                            value={execFilter}
                            onChange={(e) => setExecFilter(e.target.value)}
                            className="bg-slate-900 border border-slate-700/80 text-sky-300 font-semibold rounded-lg text-xs py-1 px-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
                          >
                            <option value="">All Execs</option>
                            <option value="Simranjit Kaur">Simranjit Kaur</option>
                            <option value="Yug">Yug</option>
                          </select>
                        </div>
                      </th>

                      {/* Agent & City Dropdown Header */}
                      <th className="py-2 px-2.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Agent & City</span>
                          <select
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            className="bg-slate-900 border border-slate-700/80 text-sky-300 font-semibold rounded-lg text-xs py-1 px-1.5 focus:outline-none focus:border-sky-500 cursor-pointer max-w-[200px] truncate"
                          >
                            <option value="">All Cities ({distinctCities.length})</option>
                            {distinctCities.map((ct) => (
                              <option key={ct} value={ct}>{ct}</option>
                            ))}
                          </select>
                        </div>
                      </th>

                      {/* Connectivity Dropdown Header */}
                      <th className="py-2 px-2.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Connectivity</span>
                          <select
                            value={connectivityFilter}
                            onChange={(e) => setConnectivityFilter(e.target.value)}
                            className="bg-slate-900 border border-slate-700/80 text-sky-300 font-semibold rounded-lg text-xs py-1 px-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
                          >
                            <option value="">All Calls</option>
                            <option value="connected">Connected</option>
                            <option value="not_connected">Not Connected</option>
                          </select>
                        </div>
                      </th>

                      {/* Result / Due Dropdown Header */}
                      <th className="py-2 px-2.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Result / Due</span>
                          <select
                            value={resultFilter}
                            onChange={(e) => setResultFilter(e.target.value)}
                            className="bg-slate-900 border border-amber-500/60 text-amber-300 font-semibold rounded-lg text-xs py-1 px-1.5 focus:outline-none focus:border-amber-400 cursor-pointer max-w-[175px] truncate"
                          >
                            <option value="">All Results</option>
                            <option value="Due Today">⏰ Due Today ({dueTodayCalls.length})</option>
                            <option value="Call Again">🔄 Call Again / Later</option>
                            <option value="Requirement Received">⚡ Requirement Won</option>
                            <option value="Interested">🔥 Interested</option>
                            <option value="Not Interested">🚫 Not Interested</option>
                            <option value="Closed">❌ Closed</option>
                            <option value="Not Picked">📵 Not Picked</option>
                            <option value="Wrong Number">⚠️ Wrong / Switched Off</option>
                          </select>
                        </div>
                      </th>

                      {/* Payment Terms Dropdown Header */}
                      <th className="py-2 px-2.5 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Payment</span>
                          <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className="bg-slate-900 border border-slate-700/80 text-sky-300 font-semibold rounded-lg text-xs py-1 px-1.5 focus:outline-none focus:border-sky-500 cursor-pointer"
                          >
                            <option value="">All Terms</option>
                            <option value="advance">Advance</option>
                            <option value="credit">Credit / After</option>
                            <option value="50%">50% Advance</option>
                          </select>
                        </div>
                      </th>

                      {/* Requirement Header */}
                      <th className="py-2.5 px-3 whitespace-nowrap">
                        <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">Requirement</span>
                        <span className="text-[11px] text-emerald-400 font-bold">Services & Enquiries</span>
                      </th>

                      {/* Remarks Header */}
                      <th className="py-2.5 px-3">
                        <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">Remarks</span>
                        <span className="text-[11px] text-slate-500 font-normal">Discussion Log</span>
                      </th>

                      {/* Quick Actions Sticky Header */}
                      <th className="py-2.5 px-3 text-right whitespace-nowrap sticky right-0 bg-[#090e1a] z-20 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.8)] border-b border-slate-800">
                        <span className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase block">Quick Actions</span>
                        <span className="text-[11px] text-slate-300 font-bold">Calling & Follow-up</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {loading ? (
                      <tr>
                        <td colSpan="9" className="text-center p-8">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </td>
                      </tr>
                    ) : filteredCalls.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center p-8 text-slate-500">
                          <p className="font-semibold text-slate-400">No telephonic follow-up calls found matching active filters.</p>
                          <button
                            onClick={resetAllFilters}
                            className="mt-2 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition shadow"
                          >
                            Reset All Filters
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredCalls.map((c) => {
                        const isCallAgain = (c.call_result || '').toLowerCase().includes('again') || (c.call_result || '').toLowerCase().includes('later') || (c.call_result || '').toLowerCase().includes('follow');
                        const isDueToday = isCallAgain && c.next_followup_date && c.next_followup_date === todayStr;
                        const isOverdue = isCallAgain && c.next_followup_date && c.next_followup_date < todayStr;

                        return (
                          <tr 
                            key={c.id} 
                            className={`hover:bg-slate-800/40 transition group ${
                              isDueToday 
                                ? 'bg-amber-950/20 border-l-4 border-l-amber-500' 
                                : isOverdue 
                                ? 'bg-rose-950/15 border-l-4 border-l-rose-500' 
                                : ''
                            }`}
                          >
                            <td className="py-3 px-3 font-mono text-slate-200 font-bold whitespace-nowrap align-middle truncate">
                              {c.call_date}
                            </td>

                            <td className="py-3 px-2.5 font-semibold text-slate-200 whitespace-nowrap align-middle truncate" title={c.executive_name || 'Simranjit Kaur'}>
                              {c.executive_name || 'Simranjit Kaur'}
                            </td>

                            <td className="py-3 px-2.5 align-middle truncate">
                              <button
                                type="button"
                                onClick={() => onOpenAgentDrawer(c.agent_id)}
                                className="font-bold text-sky-400 hover:text-sky-300 text-left hover:underline block truncate max-w-full cursor-pointer"
                                title={c.company_name}
                              >
                                {c.company_name}
                              </button>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] whitespace-nowrap">
                                {c.agent_mobile && (
                                  <a
                                    href={`tel:${c.agent_mobile}`}
                                    className="text-emerald-400 hover:text-emerald-300 font-mono font-semibold flex items-center gap-0.5"
                                    title="Click to dial"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-400 shrink-0" /> {c.agent_mobile}
                                  </a>
                                )}
                                {c.agent_city && (
                                  <span className="text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[85px]">
                                    {c.agent_city}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-2.5 whitespace-nowrap align-middle">
                              {c.is_connected ? (
                                <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1">
                                  <PhoneCall className="w-3 h-3" /> Connected
                                </span>
                              ) : (
                                <span className="bg-rose-950/80 text-rose-400 border border-rose-800/80 px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1">
                                  <PhoneOff className="w-3 h-3" /> Not Connected
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-2.5 whitespace-nowrap align-middle">
                              {isDueToday ? (
                                <div className="space-y-1">
                                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/50 px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 animate-pulse shadow-sm whitespace-nowrap">
                                    <Clock className="w-3 h-3 text-amber-400 shrink-0" /> ⏰ Due Today
                                  </span>
                                  <div className="text-[10px] font-mono text-amber-400/90 font-bold whitespace-nowrap">
                                    Follow-up Today
                                  </div>
                                </div>
                              ) : isOverdue ? (
                                <div className="space-y-1">
                                  <span className="bg-rose-500/20 text-rose-300 border border-rose-500/50 px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 shadow-sm whitespace-nowrap">
                                    <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" /> ⚠️ Overdue
                                  </span>
                                  <div className="text-[10px] font-mono text-rose-400/90 font-bold whitespace-nowrap">
                                    Due: {c.next_followup_date}
                                  </div>
                                </div>
                              ) : isCallAgain ? (
                                <div className="space-y-1">
                                  <span className="bg-amber-950/90 text-amber-300 border border-amber-800/90 px-2 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 shadow-sm whitespace-nowrap">
                                    <Clock className="w-3 h-3 text-amber-400 shrink-0" /> Call Again
                                  </span>
                                  {c.next_followup_date && (
                                    <div className="text-[10px] font-mono text-amber-400/90 flex items-center gap-0.5 font-semibold whitespace-nowrap">
                                      <Calendar className="w-2.5 h-2.5 shrink-0" /> Due: {c.next_followup_date}
                                    </div>
                                  )}
                                </div>
                              ) : (c.call_result || '').toLowerCase().includes('closed') ? (
                                <span className="bg-rose-950/90 text-rose-300 border border-rose-800/90 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" /> {c.call_result}
                                </span>
                              ) : (c.call_result || '').toLowerCase().includes('requirement') ? (
                                <span className="bg-emerald-950/90 text-emerald-300 border border-emerald-800/90 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-sm whitespace-nowrap">
                                  <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> Requirement Won
                                </span>
                              ) : (
                                <span className="bg-slate-800/90 text-slate-300 border border-slate-700/80 px-2 py-0.5 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap">
                                  {c.call_result || 'Call Logged'}
                                </span>
                              )}
                            </td>

                            <td className="py-3 px-2.5 whitespace-nowrap align-middle">
                              {c.payment_terms ? (
                                <span className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap ${
                                  c.payment_terms.includes('Advance') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                  c.payment_terms.includes('Credit') || c.payment_terms.includes('After') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                  'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}>
                                  {c.payment_terms}
                                </span>
                              ) : (
                                <span className="text-slate-500 text-xs">—</span>
                              )}
                            </td>

                            <td className="py-3 px-3 align-middle overflow-hidden">
                              {c.agent_requirement && (
                                <div className="text-xs text-emerald-300 font-semibold mb-1 flex items-center gap-1 truncate" title={c.agent_requirement}>
                                  <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="truncate">{c.agent_requirement}</span>
                                </div>
                              )}
                              {renderPitchedServices(c.services_discussed)}
                              {!c.agent_requirement && !c.services_discussed && (
                                <span className="text-slate-500 text-xs">—</span>
                              )}
                            </td>

                            <td className="py-3 px-3 align-middle text-xs text-slate-300 overflow-hidden">
                              <div className="line-clamp-2 break-words" title={c.remarks}>{c.remarks || '—'}</div>
                            </td>

                            <td className="py-2.5 px-3 text-right whitespace-nowrap align-middle sticky right-0 bg-[#070b14] group-hover:bg-[#0f172a] transition-colors z-10 shadow-[-12px_0_15px_-4px_rgba(0,0,0,0.8)]">
                              <div className="flex flex-col gap-1 items-end">
                                {/* Row 1: Primary 3 Follow-up Action Buttons */}
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => onOpenModal('log_call', {
                                      agent_id: c.agent_id,
                                      company_name: c.company_name,
                                      name: c.agent_name,
                                      mobile: c.agent_mobile,
                                      city: c.agent_city,
                                      call_date: new Date().toISOString().split('T')[0],
                                      executive_name: c.executive_name || 'Simranjit Kaur',
                                      call_result: 'Call Connected / In Discussion'
                                    })}
                                    title="Start Calling: Log Fresh Call Today"
                                    className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[11px] font-bold transition flex items-center gap-1 shadow cursor-pointer whitespace-nowrap"
                                  >
                                    <PhoneCall className="w-3 h-3" /> Calling
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleQuickReschedule(c)}
                                    title="Reschedule Next Call"
                                    className="px-2 py-1 bg-amber-950/90 hover:bg-amber-900 text-amber-300 border border-amber-800/80 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  >
                                    <Clock className="w-3 h-3 text-amber-400" /> Again
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleQuickClose(c)}
                                    title="Mark Follow-up Closed / Not Interested"
                                    className="px-2 py-1 bg-rose-950/90 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded text-[11px] font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                  >
                                    <XCircle className="w-3 h-3 text-rose-400" /> Closed
                                  </button>
                                </div>

                                {/* Row 2: Secondary Utilities (Query, Edit, 360, Delete) */}
                                <div className="flex items-center gap-1 text-[10px]">
                                  {c.call_result === 'Requirement Received' && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenModal('create_query', { id: c.agent_id, company_name: c.company_name, name: c.agent_name })}
                                      className="px-1.5 py-0.5 bg-amber-600 hover:bg-amber-500 text-white rounded font-bold transition flex items-center gap-0.5 whitespace-nowrap"
                                      title="Create Stage 3 Sales Query"
                                    >
                                      <FileText className="w-2.5 h-2.5" /> Query
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onOpenModal('log_call', {
                                      ...c,
                                      call_id: c.id,
                                      id: c.id,
                                      agent_id: c.agent_id,
                                      visit_id: c.visit_id
                                    })}
                                    title="Edit Full Call Details"
                                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium border border-slate-700 transition"
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onOpenAgentDrawer(c.agent_id)}
                                    title="View 360 Agent Profile"
                                    className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium border border-slate-700 transition"
                                  >
                                    👁️ 360°
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCall(c.id)}
                                    title="Delete Wrong Call Entry"
                                    className="p-1 bg-rose-950/40 hover:bg-rose-900 text-rose-400 rounded border border-rose-800/60 transition"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
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
        )}
      </div>

    </div>
  );
}
