import React, { useState, useEffect } from 'react';
import { Flame, AlertTriangle, Clock, PhoneOff, AlertCircle, Phone, FileText, Eye, CheckCircle2, UserCheck, MapPin } from 'lucide-react';

export default function FocusLists({ onOpenAgentDrawer, onOpenModal }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('hot_opportunities');

  useEffect(() => {
    fetchFocusData();
  }, []);

  const fetchFocusData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/focus-list');
      const json = await res.json();
      if (json.success) {
        setData(json.categories);
      }
    } catch (err) {
      console.error('Failed to load focus list:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  const { hot_opportunities, query_no_booking, visited_no_query, no_engagement, dormant_active } = data || {};

  const categories = [
    { id: 'hot_opportunities', label: '🔥 Hot Opportunities', count: hot_opportunities?.length || 0, color: 'border-rose-500 text-rose-400 bg-rose-950/30' },
    { id: 'query_no_booking', label: '🟠 Query but No Closure', count: query_no_booking?.length || 0, color: 'border-amber-500 text-amber-400 bg-amber-950/30' },
    { id: 'visited_no_query', label: '🟡 Visited but No Query', count: visited_no_query?.length || 0, color: 'border-yellow-500 text-yellow-400 bg-yellow-950/30' },
    { id: 'no_engagement', label: '🔴 No Engagement', count: no_engagement?.length || 0, color: 'border-red-500 text-red-400 bg-red-950/30' },
    { id: 'dormant_active', label: '⚠️ Previously Active (Dormant)', count: dormant_active?.length || 0, color: 'border-orange-500 text-orange-400 bg-orange-950/30' },
  ];

  const getActiveList = () => {
    switch (activeCategory) {
      case 'hot_opportunities': return hot_opportunities || [];
      case 'query_no_booking': return query_no_booking || [];
      case 'visited_no_query': return visited_no_query || [];
      case 'no_engagement': return no_engagement || [];
      case 'dormant_active': return dormant_active || [];
      default: return [];
    }
  };

  const currentList = getActiveList();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-rose-500" /> Focus List - Management Priority Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Agents requiring immediate follow-up to unblock conversions and recover dormant revenue
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
              activeCategory === cat.id ? `${cat.color} font-bold ring-2 ring-sky-500/50` : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="text-xs font-semibold">{cat.label}</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-2xl font-black text-slate-100">{cat.count}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500">Agents</span>
            </div>
          </button>
        ))}
      </div>

      {/* Agents Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
          <span className="text-sm font-semibold text-slate-300">
            Showing <strong className="text-white">{currentList.length}</strong> Agents needing attention
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase">
              <tr>
                <th className="p-3">Agent ID</th>
                <th className="p-3">Firm Name & Location</th>
                <th className="p-3">Contact Person</th>
                <th className="p-3">Category Detail / Metric</th>
                <th className="p-3">Assigned Team</th>
                <th className="p-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-8 text-slate-500">
                    No agents currently flagged in this category.
                  </td>
                </tr>
              ) : (
                currentList.map((agent, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 font-mono font-bold text-sky-400">{agent.id}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-100">{agent.company_name}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" /> {agent.city} ({agent.area})
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-200">{agent.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{agent.mobile}</div>
                    </td>
                    <td className="p-3">
                      {activeCategory === 'hot_opportunities' && (
                        <div>
                          <span className="text-xs font-semibold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">
                            {agent.response_level || 'Hot Interest'}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1">Visited: {agent.visit_date}</p>
                        </div>
                      )}
                      {activeCategory === 'query_no_booking' && (
                        <div>
                          <span className="text-xs font-bold text-amber-400">
                            {agent.query_count} Queries Submitted
                          </span>
                          <p className="text-[11px] text-slate-400">0 Converted Bookings</p>
                        </div>
                      )}
                      {activeCategory === 'visited_no_query' && (
                        <div>
                          <span className="text-xs text-yellow-400">Visited {agent.visit_date}</span>
                          <p className="text-[11px] text-slate-400">By {agent.visited_by}</p>
                        </div>
                      )}
                      {activeCategory === 'no_engagement' && (
                        <div>
                          <span className="text-xs text-rose-400">{agent.call_result || 'No Response'}</span>
                          <p className="text-[11px] text-slate-400">Called: {agent.call_date}</p>
                        </div>
                      )}
                      {activeCategory === 'dormant_active' && (
                        <div>
                          <span className="text-xs font-bold text-orange-400">
                            Past Revenue: ₹{(agent.past_revenue || 0).toLocaleString('en-IN')}
                          </span>
                          <p className="text-[11px] text-slate-400">Last Booking: {agent.last_booking_date}</p>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-xs text-slate-400">
                      <div>Field: {agent.assigned_marketing_exec || 'Rahul Sharma'}</div>
                      <div>Phone: {agent.assigned_telephonic_exec || 'Pooja Rani'}</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onOpenModal('log_call', agent)}
                          className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-semibold transition border border-blue-500/30 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" /> Call
                        </button>
                        <button
                          onClick={() => onOpenModal('create_query', agent)}
                          className="px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white rounded-lg text-xs font-semibold transition border border-amber-500/30 flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" /> Query
                        </button>
                        <button
                          onClick={() => onOpenAgentDrawer(agent.id)}
                          className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition border border-slate-700 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> 360°
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
