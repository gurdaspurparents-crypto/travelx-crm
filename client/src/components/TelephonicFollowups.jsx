import React, { useState, useEffect } from 'react';
import { Phone, Plus, Calendar, FileText, CheckCircle2, AlertCircle, PhoneCall, PhoneOff, Eye, Trash2, Filter, X, Download, MapPin, Clock } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';

export default function TelephonicFollowups({ onOpenModal, onOpenAgentDrawer }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [execFilter, setExecFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Bikramjit Physical Visit Queue for Simranjit Next-Day Feedback
  const [visitQueue, setVisitQueue] = useState([]);
  const [showQueue, setShowQueue] = useState(true);

  // Location Coverage Matrix State (Visited vs Unvisited Agents by City)
  const [coverageData, setCoverageData] = useState(null);
  const [selectedCityCoverage, setSelectedCityCoverage] = useState('');
  const [coverageFilter, setCoverageFilter] = useState('all');
  const [showCoverageCard, setShowCoverageCard] = useState(true);

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
      if (resultFilter) params.append('result', resultFilter);
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
        alert('Call log deleted successfully');
        fetchCalls();
      }
    } catch (err) {
      alert('Error deleting call log');
    }
  };

  const clearDateFilters = () => {
    setDateFilter('');
    setFromDate('');
    setToDate('');
  };

  const filteredCalls = calls.filter(c => {
    if (!resultFilter) return true;
    const resStr = (c.call_result || '').toLowerCase();
    const filterLower = resultFilter.toLowerCase();

    if (filterLower === 'not interested') {
      return resStr.includes('not interested') || resStr.includes("don't call");
    }
    if (filterLower === 'interested') {
      return resStr.includes('interested') && !resStr.includes('not interested');
    }
    if (filterLower === 'call again') {
      return resStr.includes('call again') || resStr.includes('follow-up') || resStr.includes('followup');
    }
    if (filterLower === 'requirement received') {
      return resStr.includes('requirement') || resStr.includes('received');
    }
    return resStr.includes(filterLower);
  });

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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Phone className="w-6 h-6 text-blue-500" /> Stage 2 – Telephonic Follow-up Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Office telephonic queue for calling visited travel agents and capturing immediate requirements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/export/calls"
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
            onClick={() => onOpenModal('log_call')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition shadow-lg shadow-blue-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Log Call Outcome
          </button>
        </div>
      </div>

      {/* 🚗 Visited Agents Queue for Telephonic Follow-up (Bikramjit Field Visits Queue for Simranjit Next-Day Feedback) */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/40 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-0.5">
              <MapPin className="w-4 h-4" /> Next-Day Feedback Call Queue
            </div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              🚗 Visited Travel Agents Queue (Bikramjit Physical Visits)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Agencies visited by Bikramjit Singh in date-wise order. Simranjit Kaur can call for next-day feedback & capture response!
            </p>
          </div>

          <button
            onClick={() => setShowQueue(!showQueue)}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 self-start sm:self-auto"
          >
            {showQueue ? 'Hide Queue' : `Show Queue (${visitQueue.length})`}
          </button>
        </div>

        {showQueue && (
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-3">Visit Date</th>
                  <th className="p-3">Visited Agency & Contact</th>
                  <th className="p-3">Location & Area</th>
                  <th className="p-3">Bikramjit Pitched & Remarks</th>
                  <th className="p-3">Follow-up Status</th>
                  <th className="p-3 text-right">Action for Simranjit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                {visitQueue.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-6 text-center text-slate-500">
                      No recent physical visits logged yet. Physical visits logged by Bikramjit will appear here automatically!
                    </td>
                  </tr>
                ) : (
                  visitQueue.map((v) => {
                    const isCalled = !!v.call_id;
                    let pitched = [];
                    try { pitched = typeof v.products_pitched === 'string' ? JSON.parse(v.products_pitched) : (v.products_pitched || []); } catch(e){}

                    return (
                      <tr key={v.visit_id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-slate-200">{v.visit_date}</td>
                        <td className="p-3">
                          <div className="font-bold text-sky-400 text-sm">{v.company_name}</div>
                          <div className="text-slate-300 font-medium">{v.person_met} &bull; <span className="font-mono text-slate-400">{v.contact_mobile}</span></div>
                        </td>
                        <td className="p-3">
                          <div className="text-slate-200">{v.agent_city}</div>
                          <div className="text-slate-400 text-[11px]">{v.agent_area}</div>
                        </td>
                        <td className="p-3 max-w-xs">
                          <div className="flex flex-wrap gap-1 mb-1">
                            {pitched.map((p, i) => (
                              <span key={i} className="bg-slate-800 text-slate-300 text-[10px] px-1.5 py-0.5 rounded border border-slate-700">
                                {p}
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-slate-400 truncate">{v.visit_remarks}</div>
                        </td>
                        <td className="p-3">
                          {isCalled ? (
                            <div>
                              <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Call Logged ({v.call_result})
                              </span>
                              {v.call_feedback && <div className="text-[11px] text-slate-400 mt-1 italic max-w-xs">"{v.call_feedback}"</div>}
                            </div>
                          ) : (
                            <span className="bg-amber-950 text-amber-400 border border-amber-800 px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> 🟡 Pending Next-Day Call
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onOpenModal('log_call', {
                              agent_id: v.agent_id,
                              visit_id: v.visit_id,
                              company_name: v.company_name,
                              name: v.person_met,
                              mobile: v.contact_mobile,
                              city: v.agent_city
                            })}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow flex items-center gap-1.5 ml-auto ${
                              isCalled
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 animate-pulse'
                            }`}
                          >
                            <Phone className="w-3.5 h-3.5" /> {isCalled ? 'Update Call Log' : '📞 Log Next-Day Feedback'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 📍 City-Wise Bikramjit Visit & Missed Agent Tracker (For Simranjit) */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/40 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-0.5">
              <Eye className="w-4 h-4" /> Full City Coverage Tracking
            </div>
            <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
              📍 City-Wise Agent Visit Matrix (Bikramjit Visited vs Missed Agents)
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select any city to see ALL travel agents. See who Bikramjit MET (🟢) and who he MISSED (🔴) so Simranjit can follow up with 100% coverage!
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* City Selector */}
            <select
              value={selectedCityCoverage}
              onChange={(e) => {
                setSelectedCityCoverage(e.target.value);
                fetchLocationCoverage(e.target.value, coverageFilter);
              }}
              className="bg-slate-950 border border-indigo-500 text-indigo-300 font-extrabold rounded-xl text-xs p-2 focus:outline-none"
            >
              {(coverageData?.cities || ['Gurdaspur']).map(c => (
                <option key={c} value={c}>📍 City: {c}</option>
              ))}
            </select>

            <button
              onClick={() => setShowCoverageCard(!showCoverageCard)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700"
            >
              {showCoverageCard ? 'Hide Matrix' : 'Show Matrix'}
            </button>
          </div>
        </div>

        {showCoverageCard && (
          <div className="space-y-3">
            {/* City Summary Badges & Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="text-slate-300 bg-slate-900 px-3 py-1 rounded-full border border-slate-700">
                  🏙️ Total Agents in {coverageData?.selectedCity}: <strong className="text-white">{coverageData?.stats?.total_agents || 0}</strong>
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

      {/* Filter Bar with Date Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap gap-4 items-center">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filters:
        </span>

        {/* Executive Filter */}
        <select
          value={execFilter}
          onChange={(e) => setExecFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-sm p-2.5 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Telephonic Executives</option>
          <option value="Simranjit Kaur">Simranjit Kaur</option>
        </select>

        {/* Call Result Filter Dropdown */}
        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="bg-slate-950 border border-blue-500/60 text-blue-300 font-bold rounded-xl text-sm p-2.5 focus:outline-none focus:border-blue-400"
        >
          <option value="">📞 All Call Results (Everything)</option>
          <option value="Interested">🔥 Interested / Hot</option>
          <option value="Not Interested">🚫 Not Interested / Don't Call</option>
          <option value="Requirement Received">⚡ Requirement Received</option>
          <option value="Call Again">🔄 Call Again / Follow-up</option>
          <option value="Not Picked">📵 Not Picked / Ringing</option>
          <option value="Wrong Number">❌ Wrong Number / Switched Off</option>
        </select>

        {/* Single Date Picker */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-400 font-semibold">Call Date:</span>
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

      {/* 1-Click Quick Filter Pills */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setResultFilter('')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition shadow ${
            !resultFilter ? 'bg-sky-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          All Calls ({calls.length})
        </button>
        <button
          onClick={() => setResultFilter('Interested')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition shadow ${
            resultFilter === 'Interested' ? 'bg-amber-500 text-slate-950' : 'bg-amber-950/60 text-amber-300 hover:bg-amber-900 border border-amber-800/60'
          }`}
        >
          🔥 Interested / Hot
        </button>
        <button
          onClick={() => setResultFilter('Not Interested')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition shadow ${
            resultFilter === 'Not Interested' ? 'bg-rose-500 text-white' : 'bg-rose-950/60 text-rose-300 hover:bg-rose-900 border border-rose-800/60'
          }`}
        >
          🚫 Not Interested / Don't Call
        </button>
        <button
          onClick={() => setResultFilter('Requirement Received')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition shadow ${
            resultFilter === 'Requirement Received' ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900 border border-emerald-800/60'
          }`}
        >
          ⚡ Requirement Received
        </button>
        <button
          onClick={() => setResultFilter('Call Again')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold transition shadow ${
            resultFilter === 'Call Again' ? 'bg-blue-500 text-white' : 'bg-blue-950/60 text-blue-300 hover:bg-blue-900 border border-blue-800/60'
          }`}
        >
          🔄 Call Again / Follow-up
        </button>
      </div>

      {/* Calls Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Filtered Telephonic Calls Logged: <strong className="text-sky-400 font-bold">{filteredCalls.length}</strong> / {calls.length} Total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase">
              <tr>
                <th className="p-3.5">Call Date</th>
                <th className="p-3.5">Telephonic Executive</th>
                <th className="p-3.5">Agent & Mobile</th>
                <th className="p-3.5">Connectivity</th>
                <th className="p-3.5">Call Result</th>
                <th className="p-3.5">Payment Terms</th>
                <th className="p-3.5">Captured Requirement</th>
                <th className="p-3.5">Call Remarks</th>
                <th className="p-3.5 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center p-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </td>
                </tr>
              ) : filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center p-8 text-slate-500">
                    No telephonic follow-up calls found for selected filters.
                  </td>
                </tr>
              ) : (
                filteredCalls.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono text-slate-300 font-bold">{c.call_date}</td>
                    <td className="p-3.5 font-semibold text-slate-200">{c.executive_name}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-sky-400">{c.company_name}</div>
                      <div className="text-xs text-slate-400 font-mono">{c.agent_mobile} ({c.agent_city})</div>
                    </td>
                    <td className="p-3.5">
                      {c.is_connected ? (
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 w-fit">
                          <PhoneCall className="w-3 h-3" /> Connected
                        </span>
                      ) : (
                        <span className="bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 w-fit">
                          <PhoneOff className="w-3 h-3" /> Not Connected
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        c.call_result === 'Requirement Received' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        c.call_result === 'Followup Scheduled' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {c.call_result}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {c.payment_terms ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          c.payment_terms.includes('Advance') ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          c.payment_terms.includes('Credit') || c.payment_terms.includes('After') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {c.payment_terms}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">-</span>
                      )}
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <div className="text-xs text-slate-200 font-medium">{c.agent_requirement || '—'}</div>
                      <div className="text-[11px] text-slate-500 truncate">{c.services_discussed}</div>
                    </td>
                    <td className="p-3.5 max-w-xs text-xs text-slate-400 truncate">{c.remarks}</td>
                    <td className="p-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        {c.call_result === 'Requirement Received' && (
                          <button
                            onClick={() => onOpenModal('create_query', { id: c.agent_id, company_name: c.company_name, name: c.agent_name })}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition flex items-center gap-1 shadow"
                          >
                            <FileText className="w-3 h-3" /> Create Query
                          </button>
                        )}
                        <button
                          onClick={() => onOpenAgentDrawer(c.agent_id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition border border-slate-700"
                        >
                          View 360°
                        </button>
                        <button
                          onClick={() => handleDeleteCall(c.id)}
                          title="Delete Wrong Call Entry"
                          className="p-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 rounded text-xs transition border border-rose-800/60"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
