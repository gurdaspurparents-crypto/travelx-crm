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
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> ACTIVE</span>;
      case 'QueryReceived':
        return <span className="bg-amber-500/10 text-amber-300 border border-amber-500/25 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold flex items-center gap-1"><Clock className="w-3 h-3" /> QUERIES</span>;
      case 'Followup':
        return <span className="bg-blue-500/10 text-blue-300 border border-blue-500/25 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold flex items-center gap-1"><Phone className="w-3 h-3" /> FOLLOW-UP</span>;
      case 'Visited':
        return <span className="bg-yellow-500/10 text-yellow-300 border border-yellow-500/25 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold flex items-center gap-1"><MapPin className="w-3 h-3" /> VISITED</span>;
      case 'Dormant':
        return <span className="bg-orange-500/10 text-orange-300 border border-orange-500/25 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> DORMANT</span>;
      default:
        return <span className="bg-rose-500/10 text-rose-300 border border-rose-500/25 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-semibold flex items-center gap-1"><X className="w-3 h-3" /> INACTIVE</span>;
    }
  };

  const handleDeleteAgent = async (agentId, companyName) => {
    if (!window.confirm(`🗑️ Are you sure you want to delete "${companyName || agentId}" (ID: ${agentId}) and all associated visits, calls, and queries?`)) return;
    try {
      const res = await fetch(`/api/agents/${agentId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert('✅ Agent deleted successfully');
        fetchAgents();
      } else {
        alert(`❌ Failed to delete agent: ${json.error || 'Server error'}`);
      }
    } catch (err) {
      alert('❌ Error deleting agent: ' + err.message);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-tight">
            Agent Master Database <span className="text-xs font-mono font-medium text-sky-300 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">{totalCount} Agencies</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Central repository of all Travelx B2B travel agency partners
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/export/agents"
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
            onClick={onOpenImportExcel}
            className="px-3.5 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.1] font-semibold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Import Excel / CSV
          </button>
          <button
            onClick={() => onOpenModal('create_agent')}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold rounded-xl text-xs transition shadow-md shadow-amber-900/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Agent
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-[#0c1322]/90 border border-white/[0.08] p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 backdrop-blur-md">
        
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by ID, Agency Firm Name, Contact, Mobile..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-[#070b14] border border-white/[0.08] rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* City Filter */}
        <select
          value={selectedCity}
          onChange={(e) => { setSelectedCity(e.target.value); setPage(1); }}
          className="bg-[#070b14] border border-white/[0.08] text-slate-300 rounded-xl text-xs p-2 focus:outline-none focus:border-sky-500 max-w-xs cursor-pointer"
        >
          <option value="">All Locations ({availableLocations.length > 0 ? `${availableLocations.length} Cities/Areas` : 'Cities'})</option>
          {availableLocations.map((loc, idx) => (
            <option key={idx} value={loc} className="bg-[#090e1a] text-slate-200">📍 {loc}</option>
          ))}
        </select>

        {/* Stage Filter */}
        <select
          value={selectedStage}
          onChange={(e) => { setSelectedStage(e.target.value); setPage(1); }}
          className="bg-[#070b14] border border-white/[0.08] text-slate-300 rounded-xl text-xs p-2 focus:outline-none focus:border-sky-500 cursor-pointer"
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
          className="bg-[#070b14] border border-white/[0.08] text-slate-300 rounded-xl text-xs p-2 focus:outline-none focus:border-sky-500 cursor-pointer"
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
      <div className="bg-[#0c1322]/90 border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#090e1a] text-[11px] text-slate-400 uppercase tracking-wider">
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
            <tbody className="divide-y divide-white/[0.04]">
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
                  <tr key={ag.id} className="hover:bg-white/[0.02] transition">
                    <td className="p-3.5 font-mono font-bold text-sky-400">{ag.id}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-100 text-sm">{ag.company_name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{ag.agent_type}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-200 font-medium">{ag.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{ag.mobile}</div>
                    </td>
                    <td className="p-3.5 text-slate-300">
                      <div className="font-medium">{ag.city}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{ag.area}</div>
                    </td>
                    <td className="p-3.5">{getStageBadge(ag.stage)}</td>
                    <td className="p-3.5">
                      {ag.payment_terms?.includes('Advance') ? (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 border border-emerald-500/25 font-mono text-[11px] font-semibold rounded-lg inline-flex items-center gap-1">
                          ⚡ Advance
                        </span>
                      ) : ag.payment_terms?.includes('Credit') || ag.payment_terms?.includes('After') ? (
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/25 font-mono text-[11px] font-semibold rounded-lg inline-flex items-center gap-1">
                          💳 Credit
                        </span>
                      ) : ag.payment_terms?.includes('50%') ? (
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 border border-blue-500/25 font-mono text-[11px] font-semibold rounded-lg inline-flex items-center gap-1">
                          🌗 50% Adv
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-white/[0.04] text-slate-400 rounded-lg text-[11px]">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-slate-200">{ag.total_queries || 0}</td>
                    <td className="p-3.5 text-center font-mono font-bold text-emerald-400">{ag.total_bookings || 0}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-sky-300">
                      ₹{(ag.total_business_value || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onOpenAgentDrawer(ag.id)}
                          className="px-2.5 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 hover:text-white rounded-lg text-xs font-semibold transition border border-sky-500/20 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> 360°
                        </button>
                        <button
                          onClick={() => onOpenModal('edit_agent', ag)}
                          className="px-2 py-1 bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 rounded-lg text-xs font-medium transition border border-white/[0.08] flex items-center gap-1 cursor-pointer"
                          title="Edit Agent Name, Mobile Number, City & Address"
                        >
                          <Edit3 className="w-3 h-3 text-sky-400" /> Edit
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteAgent(ag.id, ag.company_name)}
                            title="Admin Only: Delete Agent Record"
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-xs transition border border-rose-500/20 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
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
        <div className="p-3.5 bg-[#090e1a] border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong className="text-slate-200 font-mono">{(page - 1) * limit + 1}</strong> to <strong className="text-slate-200 font-mono">{Math.min(page * limit, totalCount)}</strong> of <strong className="text-slate-200 font-mono">{totalCount}</strong> Agents
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 text-slate-200 transition border border-white/[0.06] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-300 text-xs font-semibold">Page {page} of {totalPages || 1}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 text-slate-200 transition border border-white/[0.06] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
