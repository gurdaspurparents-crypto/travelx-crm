import React, { useState, useEffect } from 'react';
import { MapPin, Users, Award, TrendingUp, BarChart2, CheckCircle2, DollarSign, Target, HelpCircle, FileText, Download, X, Search, Phone, Eye, Edit, Trash2, Plus, ExternalLink } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';

export default function LocationAnalytics({ role, onOpenModal, onOpenAgentDrawer }) {
  const [locations, setLocations] = useState([]);
  const [mktExecs, setMktExecs] = useState([]);
  const [teleExecs, setTeleExecs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Location Agencies breakdown modal state
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [locAgencies, setLocAgencies] = useState([]);
  const [loadingLocAgencies, setLoadingLocAgencies] = useState(false);
  const [agencySearch, setAgencySearch] = useState('');
  const [agencyStatusFilter, setAgencyStatusFilter] = useState('all');
  const [locSortOrder, setLocSortOrder] = useState('name_asc'); // 'name_asc' (A to Z), 'name_desc' (Z to A), 'agents_desc', 'revenue_desc'

  const canEditOrDelete = role === 'Admin / Owner' || role === 'Telephonic Executive' || !role;

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [resLoc, resEmp] = await Promise.all([
        fetch('/api/analytics/location'),
        fetch('/api/analytics/employee')
      ]);

      const jsonLoc = await resLoc.json();
      const jsonEmp = await resEmp.json();

      if (jsonLoc.success) setLocations(jsonLoc.locations);
      if (jsonEmp.success) {
        setMktExecs(jsonEmp.marketing);
        setTeleExecs(jsonEmp.telephonic);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocAgencies = async (locName) => {
    setLoadingLocAgencies(true);
    try {
      const res = await fetch(`/api/agents?location=${encodeURIComponent(locName)}&limit=500`);
      const json = await res.json();
      if (json.success) {
        setLocAgencies(json.agents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLocAgencies(false);
    }
  };

  const handleOpenLocation = (locName) => {
    setSelectedLoc(locName);
    setAgencySearch('');
    setAgencyStatusFilter('all');
    fetchLocAgencies(locName);
  };

  const handleDeleteAgent = async (agentId, companyName) => {
    if (!canEditOrDelete) {
      alert('🔒 Access Denied: Only Admin/Owner and Simranjit Kaur (Telephonic) can edit or delete agent records!');
      return;
    }

    if (!window.confirm(`⚠️ Are you sure you want to DELETE agency "${companyName}" (ID: ${agentId})?\n\nThis will permanently remove the agency and all associated visits, calls, and query records!`)) {
      return;
    }

    try {
      const res = await fetch(`/api/agents/${agentId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert(`✅ Agency "${companyName}" deleted successfully!`);
        if (selectedLoc) fetchLocAgencies(selectedLoc);
        fetchAnalytics();
      } else {
        alert(`Error deleting agent: ${json.error || 'Failed'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting agent');
    }
  };

  const handleExportPDF = () => {
    const headers = ['Marketing Executive', 'Agents Visited', 'Query Giving Visited Agents', 'Visited (No Query)', 'Visit -> Query Rate', 'Active Booking Agents', 'Revenue (₹)'];
    const rows = mktExecs.map(e => [
      e.name,
      e.unique_agents_visited,
      e.query_giving_agents,
      e.visited_no_query_agents || 0,
      `${e.visit_to_query_pct}%`,
      e.active_converted_agents,
      `₹${(e.total_revenue || 0).toLocaleString('en-IN')}`
    ]);
    exportToPDF('Marketing Executive Visit -> Query Conversion Scoreboard', 'Field Marketing Conversion and Revenue Matrix', headers, rows);
  };

  // Filter agencies inside selected location modal
  const visitedLocCount = locAgencies.filter(a => Boolean(a.last_visit_date)).length;
  const pendingLocCount = locAgencies.length - visitedLocCount;

  const filteredLocAgencies = locAgencies.filter(ag => {
    const isVisited = Boolean(ag.last_visit_date);
    if (agencyStatusFilter === 'visited' && !isVisited) return false;
    if (agencyStatusFilter === 'pending' && isVisited) return false;

    if (agencySearch) {
      const q = agencySearch.toLowerCase();
      const matchName = (ag.company_name || '').toLowerCase().includes(q);
      const matchPerson = (ag.name || '').toLowerCase().includes(q);
      const matchMobile = (ag.mobile || '').includes(q);
      const matchArea = (ag.area || '').toLowerCase().includes(q);
      return matchName || matchPerson || matchMobile || matchArea;
    }
    return true;
  });

  const sortedFilteredLocAgencies = [...filteredLocAgencies].sort((a, b) => 
    (a.company_name || '').localeCompare(b.company_name || '', undefined, { sensitivity: 'base' })
  );

  const sortedLocations = [...locations].sort((a, b) => {
    if (locSortOrder === 'name_asc') {
      return (a.location || '').localeCompare(b.location || '', undefined, { sensitivity: 'base' });
    }
    if (locSortOrder === 'name_desc') {
      return (b.location || '').localeCompare(a.location || '', undefined, { sensitivity: 'base' });
    }
    if (locSortOrder === 'agents_desc') {
      return b.total_agents - a.total_agents;
    }
    if (locSortOrder === 'revenue_desc') {
      return (b.total_revenue || 0) - (a.total_revenue || 0);
    }
    return (a.location || '').localeCompare(b.location || '');
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <MapPin className="w-6 h-6 text-sky-400" /> Location Performance & Employee Scoreboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Geographic territory analysis and marketing visit-to-query conversion tracking
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
            <FileText className="w-3.5 h-3.5" /> Download PDF Report
          </button>
        </div>
      </div>

      {/* Location Performance Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-yellow-500" /> Location-wise Marketing & Conversion Matrix
            </h3>
            <span className="text-xs text-sky-400 font-semibold mt-0.5 inline-block">
              💡 Click any location row to open, edit, or delete agencies
            </span>
          </div>

          {/* Sorting controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Sort By:</span>
            <button
              onClick={() => setLocSortOrder(prev => prev === 'name_asc' ? 'name_desc' : 'name_asc')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 border ${
                locSortOrder === 'name_asc' || locSortOrder === 'name_desc'
                  ? 'bg-sky-600 text-white border-sky-500 shadow'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              🔤 Location ({locSortOrder === 'name_asc' ? 'A → Z' : 'Z → A'})
            </button>
            <button
              onClick={() => setLocSortOrder('agents_desc')}
              className={`px-3 py-1.5 rounded-xl font-bold transition border ${
                locSortOrder === 'agents_desc'
                  ? 'bg-sky-600 text-white border-sky-500 shadow'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              👥 Total Agents
            </button>
            <button
              onClick={() => setLocSortOrder('revenue_desc')}
              className={`px-3 py-1.5 rounded-xl font-bold transition border ${
                locSortOrder === 'revenue_desc'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              💰 Revenue
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase">
              <tr>
                <th
                  onClick={() => setLocSortOrder(prev => prev === 'name_asc' ? 'name_desc' : 'name_asc')}
                  className="p-3.5 cursor-pointer hover:text-sky-300 transition"
                  title="Click to sort A to Z or Z to A"
                >
                  Territory / Location {locSortOrder === 'name_asc' ? '▲ (A-Z)' : locSortOrder === 'name_desc' ? '▼ (Z-A)' : ''}
                </th>
                <th className="p-3.5 text-center">Total Agents</th>
                <th className="p-3.5 text-center">Visits Logged</th>
                <th className="p-3.5 text-center">Query-Giving Agents</th>
                <th className="p-3.5 text-center">Active Agents</th>
                <th className="p-3.5 text-center">Conversion %</th>
                <th className="p-3.5 text-right">Total Revenue (₹)</th>
                <th className="p-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedLocations.map((loc, idx) => (
                <tr
                  key={idx}
                  onClick={() => handleOpenLocation(loc.location)}
                  className="hover:bg-sky-950/30 transition cursor-pointer group"
                >
                  <td className="p-3.5 font-bold text-slate-100 flex items-center gap-2 group-hover:text-sky-300">
                    <MapPin className="w-4 h-4 text-sky-400 group-hover:scale-110 transition" /> {loc.location}
                  </td>
                  <td className="p-3.5 text-center font-semibold text-slate-200">{loc.total_agents}</td>
                  <td className="p-3.5 text-center text-yellow-400 font-semibold">{loc.visited_count}</td>
                  <td className="p-3.5 text-center text-amber-400 font-semibold">{loc.query_agents}</td>
                  <td className="p-3.5 text-center text-emerald-400 font-bold">{loc.active_agents}</td>
                  <td className="p-3.5 text-center">
                    <span className="bg-sky-950 text-sky-300 border border-sky-800 px-2.5 py-1 rounded-full text-xs font-bold">
                      {loc.conversion_rate}%
                    </span>
                  </td>
                  <td className="p-3.5 text-right font-bold text-emerald-400">
                    ₹{(loc.total_revenue || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenLocation(loc.location); }}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition shadow flex items-center gap-1 mx-auto"
                    >
                      <Eye className="w-3.5 h-3.5" /> Open & Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Marketing Visit → Query Conversion Analysis */}
      <div className="bg-slate-900 border border-amber-900/40 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-500" /> Marketing Executive Visit → Query Conversion Scoreboard
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Shows how many agents visited by each executive submitted queries to Travelx
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase">
              <tr>
                <th className="p-3.5">Marketing Executive</th>
                <th className="p-3.5 text-center">Agents Visited</th>
                <th className="p-3.5 text-center">Agents Who Gave Queries</th>
                <th className="p-3.5 text-center">Visited (No Query)</th>
                <th className="p-3.5 text-center">Visit → Query Rate</th>
                <th className="p-3.5 text-center">Active Booking Agents</th>
                <th className="p-3.5 text-right">Revenue Generated (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {mktExecs.map((exec, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="p-3.5 font-bold text-slate-100">{exec.name}</td>
                  <td className="p-3.5 text-center font-bold text-yellow-400">{exec.unique_agents_visited}</td>
                  <td className="p-3.5 text-center font-bold text-amber-400 text-base bg-amber-950/20">
                    {exec.query_giving_agents}
                  </td>
                  <td className="p-3.5 text-center text-slate-400">{exec.visited_no_query_agents || 0}</td>
                  <td className="p-3.5 text-center">
                    <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2.5 py-1 rounded-full text-xs font-bold">
                      {exec.visit_to_query_pct}%
                    </span>
                  </td>
                  <td className="p-3.5 text-center font-bold text-emerald-400">{exec.active_converted_agents}</td>
                  <td className="p-3.5 text-right font-bold text-emerald-400">
                    ₹{(exec.total_revenue || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Telephonic Office Executives */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-blue-400" /> Telephonic Follow-up Executive Performance
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {teleExecs.map((exec, idx) => (
            <div key={idx} className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-100 text-sm">{exec.name}</h4>
              </div>
              <div className="space-y-1 text-xs text-slate-300 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Calls Connected:</span>
                  <strong className="text-blue-300">{exec.calls_connected}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Queries Handled:</span>
                  <strong className="text-amber-300">{exec.queries_handled}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Converted Bookings:</span>
                  <strong className="text-emerald-400">{exec.converted_bookings}</strong>
                </div>
                <div className="flex justify-between border-t border-slate-700/60 pt-1.5 mt-1">
                  <span className="text-slate-400">Total Sales:</span>
                  <strong className="text-emerald-400">₹{(exec.total_revenue || 0).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 📍 LOCATION AGENCIES BREAKDOWN MODAL (EDIT & DELETE OPTIONS FOR ADMIN & SIMRAN) */}
      {selectedLoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-sky-400" /> Registered Agencies in "{selectedLoc}"
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Total {locAgencies.length} travel agencies registered in {selectedLoc}. Click edit or delete to manage agency details.
                </p>
              </div>
              <button
                onClick={() => setSelectedLoc(null)}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search & Filter Bar */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/50 flex flex-wrap items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder={`Search agency in ${selectedLoc}...`}
                  value={agencySearch}
                  onChange={e => setAgencySearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
                <button
                  onClick={() => setAgencyStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg transition ${agencyStatusFilter === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  All ({locAgencies.length})
                </button>
                <button
                  onClick={() => setAgencyStatusFilter('visited')}
                  className={`px-3 py-1 rounded-lg transition ${agencyStatusFilter === 'visited' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:bg-emerald-950/40'}`}
                >
                  Visited ({visitedLocCount})
                </button>
                <button
                  onClick={() => setAgencyStatusFilter('pending')}
                  className={`px-3 py-1 rounded-lg transition ${agencyStatusFilter === 'pending' ? 'bg-rose-600 text-white' : 'text-rose-400 hover:bg-rose-950/40'}`}
                >
                  Pending ({pendingLocCount})
                </button>
              </div>
            </div>

            {/* Agencies List Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-3">
              {loadingLocAgencies ? (
                <div className="text-center py-12 text-slate-400 text-xs">Loading agencies in {selectedLoc}...</div>
              ) : sortedFilteredLocAgencies.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">No agencies found matching your filters.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sortedFilteredLocAgencies.map((ag) => {
                    const isVisited = Boolean(ag.last_visit_date);
                    return (
                      <div key={ag.id} className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-xl space-y-3 hover:border-slate-700 transition">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-100 text-sm line-clamp-1">{ag.company_name}</h4>
                              <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                                {ag.id}
                              </span>
                            </div>
                            <p className="text-slate-400 text-xs mt-0.5 font-medium">
                              👤 {ag.name} &bull; 📍 {ag.city} ({ag.area || 'Main Area'})
                            </p>
                          </div>

                          {isVisited ? (
                            <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap">
                              ✅ Visited ({ag.last_visit_date})
                            </span>
                          ) : (
                            <span className="bg-rose-950 text-rose-400 border border-rose-800 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap">
                              🔴 Pending Visit
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-2.5 text-xs">
                          <a href={`tel:${ag.mobile}`} className="text-sky-400 font-mono font-semibold hover:underline flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> {ag.mobile}
                          </a>

                          <div className="flex items-center gap-1.5">
                            {/* View 360 */}
                            {onOpenAgentDrawer && (
                              <button
                                onClick={() => { setSelectedLoc(null); onOpenAgentDrawer(ag.id); }}
                                className="px-2 py-1 bg-indigo-950 hover:bg-indigo-900 text-indigo-300 border border-indigo-800 rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                                title="View Agent 360 Profile"
                              >
                                <Eye className="w-3 h-3" /> View 360
                              </button>
                            )}

                            {/* Edit Agent */}
                            {onOpenModal && (
                              <button
                                onClick={() => onOpenModal('edit_agent', ag)}
                                className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800/80 rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                                title="Edit Agent Details"
                              >
                                <Edit className="w-3 h-3 text-amber-400" /> Edit
                              </button>
                            )}

                            {/* Delete Agent (Owner & Simranjit) */}
                            {canEditOrDelete && (
                              <button
                                onClick={() => handleDeleteAgent(ag.id, ag.company_name)}
                                className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                                title="Delete Agent Record"
                              >
                                <Trash2 className="w-3 h-3 text-rose-400" /> Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
