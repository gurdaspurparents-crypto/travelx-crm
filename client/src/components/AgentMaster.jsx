import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Eye, CheckCircle2, Phone, MapPin, Clock, AlertCircle, X, ChevronLeft, ChevronRight, FileSpreadsheet, Trash2, Download, FileText, Edit3 } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';

export default function AgentMaster({ onOpenAgentDrawer, onOpenModal, onOpenImportExcel, initialStage, role }) {
  const isAdmin = role === 'Admin / Owner' || !role;
  const [agents, setAgents] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedStage, setSelectedStage] = useState(initialStage || '');
  const [selectedType, setSelectedType] = useState('');
  const [availableLocations, setAvailableLocations] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 25;

  useEffect(() => {
    fetchAgents();
  }, [search, selectedCity, selectedStage, selectedType, page]);

  useEffect(() => {
    fetch('/api/agents/locations')
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          const allLocs = Array.from(new Set([...(json.cities || []), ...(json.areas || [])])).filter(Boolean).sort();
          setAvailableLocations(allLocs);
        }
      })
      .catch(console.error);
  }, []);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit,
        offset: (page - 1) * limit
      });

      if (search) params.append('search', search);
      if (selectedCity) params.append('city', selectedCity);
      if (selectedStage) params.append('stage', selectedStage);
      if (selectedType) params.append('agent_type', selectedType);

      const res = await fetch(`/api/agents?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setAgents(json.agents);
        setTotalCount(json.total);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'Active':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> ACTIVE</span>;
      case 'QueryReceived':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> QUERY GIVING</span>;
      case 'Followup':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><Phone className="w-3 h-3" /> FOLLOW-UP</span>;
      case 'Visited':
        return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><MapPin className="w-3 h-3" /> VISITED</span>;
      case 'Dormant':
        return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> DORMANT</span>;
      default:
        return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1"><X className="w-3 h-3" /> INACTIVE</span>;
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!window.confirm(`🗑️ Are you sure you want to delete Agent ${agentId} and all associated history?`)) return;
    try {
      const res = await fetch(`/api/agents/${agentId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert('Agent deleted successfully');
        fetchAgents();
      }
    } catch (err) {
      alert('Error deleting agent');
    }
  };

  const handleExportPDF = () => {
    const headers = ['Agent ID', 'Company Name', 'Contact Person', 'Mobile', 'City', 'Stage', 'Queries', 'Bookings', 'Revenue (₹)'];
    const rows = agents.map(a => [
      a.id,
      a.company_name,
      a.name,
      a.mobile,
      a.city,
      a.stage,
      a.total_queries || 0,
      a.total_bookings || 0,
      `₹${(a.total_business_value || 0).toLocaleString('en-IN')}`
    ]);
    exportToPDF('Agent Master Database Report', 'Complete List of B2B Travel Agency Partners', headers, rows);
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header & Add/Import Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            Agent Master Database <span className="text-xs font-mono font-normal text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">{totalCount} Agencies</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Central repository of all Travelx B2B travel agency partners
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/export/agents"
            className="px-3.5 py-2.5 bg-emerald-700/80 hover:bg-emerald-600 text-white font-medium rounded-xl text-xs transition shadow flex items-center gap-1.5 border border-emerald-600"
          >
            <Download className="w-3.5 h-3.5" /> Export Excel (.xlsx)
          </a>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2.5 bg-sky-700/80 hover:bg-sky-600 text-white font-medium rounded-xl text-xs transition shadow flex items-center gap-1.5 border border-sky-600"
          >
            <FileText className="w-3.5 h-3.5" /> Download PDF
          </button>
          <button
            onClick={onOpenImportExcel}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs transition border border-slate-700 flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Import Excel / CSV
          </button>
          <button
            onClick={() => onOpenModal('create_agent')}
            className="px-3.5 py-2.5 bg-yellow-600 hover:bg-yellow-500 text-white font-medium rounded-xl text-xs transition shadow flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Agent
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search by ID, Agency Firm Name, Contact, Mobile..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* City Filter */}
        <select
          value={selectedCity}
          onChange={(e) => { setSelectedCity(e.target.value); setPage(1); }}
          className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-sm p-2.5 focus:outline-none focus:border-sky-500 max-w-xs"
        >
          <option value="">All Locations ({availableLocations.length > 0 ? `${availableLocations.length} Cities/Areas` : 'Cities'})</option>
          {availableLocations.map((loc, idx) => (
            <option key={idx} value={loc}>📍 {loc}</option>
          ))}
        </select>

        {/* Stage Filter */}
        <select
          value={selectedStage}
          onChange={(e) => { setSelectedStage(e.target.value); setPage(1); }}
          className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-sm p-2.5 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Stages</option>
          <option value="Active">🟢 Active Agent</option>
          <option value="QueryReceived">🟠 Query Received</option>
          <option value="Followup">🔵 Follow-up Done</option>
          <option value="Visited">🟡 Visited</option>
          <option value="Dormant">⚠️ Dormant Active</option>
          <option value="Inactive">🔴 Inactive</option>
        </select>

        {/* Agent Type */}
        <select
          value={selectedType}
          onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
          className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-sm p-2.5 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Agent Types</option>
          <option value="Retail Travel Agent">Retail Travel Agent</option>
          <option value="Flight Specialist">Flight Specialist</option>
          <option value="Package Specialist">Package Specialist</option>
          <option value="Corporate Agent">Corporate Agent</option>
          <option value="Forex & Visa Agent">Forex & Visa Agent</option>
        </select>

      </div>

      {/* Agents Database Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase">
              <tr>
                <th className="p-3.5">Agent ID</th>
                <th className="p-3.5">Company / Firm Name</th>
                <th className="p-3.5">Contact Person</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5">Current Stage</th>
                <th className="p-3.5">Payment Terms</th>
                <th className="p-3.5 text-center">Queries</th>
                <th className="p-3.5 text-center">Bookings</th>
                <th className="p-3.5 text-right">Business Value</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center p-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
                  </td>
                </tr>
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center p-8 text-slate-500">
                    No travel agents found matching filters.
                  </td>
                </tr>
              ) : (
                agents.map((ag) => (
                  <tr key={ag.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-bold text-sky-400">{ag.id}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-100">{ag.company_name}</div>
                      <div className="text-xs text-slate-400">{ag.agent_type}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-200">{ag.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{ag.mobile}</div>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <div>{ag.city}</div>
                      <div className="text-xs text-slate-500">{ag.area}</div>
                    </td>
                    <td className="p-3.5">{getStageBadge(ag.stage)}</td>
                    <td className="p-3.5">
                      {ag.payment_terms?.includes('Advance') ? (
                        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold rounded-lg text-xs inline-flex items-center gap-1">
                          ⚡ Advance
                        </span>
                      ) : ag.payment_terms?.includes('Credit') || ag.payment_terms?.includes('After') ? (
                        <span className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold rounded-lg text-xs inline-flex items-center gap-1">
                          💳 After / Credit
                        </span>
                      ) : ag.payment_terms?.includes('50%') ? (
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold rounded-lg text-xs inline-flex items-center gap-1">
                          🌗 50% Advance
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs">
                          ❓ Pending
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-bold text-slate-200">{ag.total_queries || 0}</td>
                    <td className="p-3.5 text-center font-bold text-emerald-400">{ag.total_bookings || 0}</td>
                    <td className="p-3.5 text-right font-bold text-sky-300">
                      ₹{(ag.total_business_value || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onOpenAgentDrawer(ag.id)}
                          className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white rounded-lg text-xs font-semibold transition border border-sky-500/30 flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" /> 360° History
                        </button>
                        <button
                          onClick={() => onOpenModal('edit_agent', ag)}
                          className="px-2.5 py-1.5 bg-amber-950/60 hover:bg-amber-900 text-amber-300 rounded-lg text-xs font-semibold transition border border-amber-800 flex items-center gap-1"
                          title="Edit Agent Name, Mobile Number, City & Address"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteAgent(ag.id)}
                            title="Admin Only: Delete Agent Record"
                            className="p-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 rounded-lg text-xs transition border border-rose-800/60"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong>{(page - 1) * limit + 1}</strong> to <strong>{Math.min(page * limit, totalCount)}</strong> of <strong>{totalCount}</strong> Agents
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-200">Page {page} of {totalPages || 1}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
