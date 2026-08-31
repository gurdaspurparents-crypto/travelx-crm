import React, { useState, useEffect } from 'react';
import { X, MapPin, Phone, User, Calendar, CheckCircle2, AlertCircle, Clock, TrendingUp, Tag, FileText, ArrowRight } from 'lucide-react';

export default function Agent360Drawer({ agentId, onClose, onAction }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (agentId) {
      fetchAgentDetails();
    }
  }, [agentId]);

  const fetchAgentDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agents/${agentId}`);
      const json = await res.json();
      if (json.success) {
        setData(json.agent);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!agentId) return null;

  const getStageBadge = (stage) => {
    switch (stage) {
      case 'Active':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> 🟢 ACTIVE AGENT</span>;
      case 'QueryReceived':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 🟠 QUERY RECEIVED</span>;
      case 'Followup':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> 🔵 FOLLOW-UP DONE</span>;
      case 'Visited':
        return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> 🟡 VISITED</span>;
      case 'Dormant':
        return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> ⚠️ PREVIOUSLY ACTIVE (DORMANT)</span>;
      default:
        return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"><X className="w-3.5 h-3.5" /> 🔴 INACTIVE / NO ENGAGEMENT</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between sticky top-0 z-10 backdrop-blur">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                {agentId}
              </span>
              {data && getStageBadge(data.stage)}
            </div>
            <h2 className="text-2xl font-bold text-slate-100">{data?.company_name || 'Loading Agent Profile...'}</h2>
            <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
              <User className="w-4 h-4 text-slate-500" /> {data?.name} &bull; <Phone className="w-4 h-4 text-slate-500" /> {data?.mobile} &bull; <MapPin className="w-4 h-4 text-slate-500" /> {data?.city} ({data?.area})
            </p>
            {data && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-slate-400 font-semibold">💳 Payment Terms:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  data.payment_terms?.includes('Advance') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                  data.payment_terms?.includes('Credit') || data.payment_terms?.includes('After') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                  'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {data.payment_terms || 'Not Discussed'}
                </span>
              </div>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500"></div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Total Queries</span>
                <p className="text-2xl font-bold text-slate-100 mt-1">{data?.total_queries || 0}</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Converted Bookings</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{data?.total_bookings || 0}</p>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                <span className="text-xs text-slate-400 font-medium">Total Business Value</span>
                <p className="text-2xl font-bold text-sky-400 mt-1">₹{(data?.total_business_value || 0).toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onAction && onAction('edit_agent', data)}
                className="py-2.5 px-3 bg-amber-950/80 hover:bg-amber-900 text-amber-300 font-medium rounded-lg text-sm transition flex items-center justify-center gap-1.5 border border-amber-800 font-bold"
                title="Edit Agent Name, Mobile Number, City & Address"
              >
                ✏️ Edit Details
              </button>
              <button
                onClick={() => onAction && onAction('log_call', data)}
                className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-sm transition flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" /> Log Call
              </button>
              <button
                onClick={() => onAction && onAction('create_query', data)}
                className="flex-1 py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg text-sm transition flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" /> Create Query
              </button>
              <button
                onClick={() => onAction && onAction('log_visit', data)}
                className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg text-sm transition flex items-center justify-center gap-2 border border-slate-700"
              >
                <MapPin className="w-4 h-4" /> Record Visit
              </button>
            </div>

            {/* Agent Info Meta */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Agent Type:</span>
                <span className="font-medium text-slate-200">{data?.agent_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Field Executive:</span>
                <span className="font-medium text-slate-200">{data?.assigned_marketing_exec}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Telephonic Executive:</span>
                <span className="font-medium text-slate-200">{data?.assigned_telephonic_exec}</span>
              </div>
            </div>

            {/* Activity History Timeline */}
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sky-400" /> Complete Activity Timeline
                </h3>
                <div className="flex gap-1 bg-slate-800 p-1 rounded-lg text-xs">
                  {['all', 'visits', 'calls', 'queries', 'bookings'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-2.5 py-1 rounded capitalize transition ${
                        activeTab === tab ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline Stream */}
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">

                {/* Bookings */}
                {(activeTab === 'all' || activeTab === 'bookings') && data?.bookings?.map((b, idx) => (
                  <div key={`bk-${idx}`} className="relative pl-8 group">
                    <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center"></div>
                    <div className="bg-emerald-950/30 border border-emerald-800/50 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Converted Booking ({b.booking_ref_no})
                        </span>
                        <span className="text-xs font-mono text-slate-400">{b.booking_date}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-100">{b.product} &bull; Final Value: <span className="text-emerald-400">₹{b.booking_value?.toLocaleString('en-IN')}</span></p>
                      <p className="text-xs text-slate-400 mt-1">Closed by: {b.closing_employee}</p>
                    </div>
                  </div>
                ))}

                {/* Queries */}
                {(activeTab === 'all' || activeTab === 'queries') && data?.queries?.map((q, idx) => (
                  <div key={`qr-${idx}`} className="relative pl-8">
                    <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-amber-500 border-2 border-slate-900"></div>
                    <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-mono font-semibold text-amber-400">{q.id} &bull; {q.product}</span>
                        <span className="text-xs text-slate-400">{q.query_date}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{q.query_details}</p>
                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-700/50 text-xs">
                        <span className="text-slate-400">Quoted: <strong className="text-slate-200">₹{q.quoted_amount?.toLocaleString('en-IN')}</strong></span>
                        <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${
                          q.status === 'Converted' ? 'bg-emerald-900/60 text-emerald-300' :
                          q.status === 'Rejected' || q.status === 'Lost' ? 'bg-rose-900/60 text-rose-300' :
                          'bg-amber-900/60 text-amber-300'
                        }`}>
                          {q.status}
                        </span>
                      </div>
                      {q.rejection_reason && (
                        <div className="mt-2 text-xs text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-900/40">
                          Reason: <strong>{q.rejection_reason}</strong> &bull; {q.rejection_remarks}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Telephonic Calls */}
                {(activeTab === 'all' || activeTab === 'calls') && data?.calls?.map((c, idx) => (
                  <div key={`cl-${idx}`} className="relative pl-8">
                    <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-900"></div>
                    <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-blue-400 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> Call Log ({c.executive_name})
                        </span>
                        <span className="text-xs text-slate-400">{c.call_date}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-200">{c.call_result}</p>
                      <p className="text-xs text-slate-400 mt-1">{c.remarks}</p>
                      {c.agent_requirement && (
                        <p className="text-xs text-amber-300 mt-2 bg-amber-950/30 p-2 rounded border border-amber-900/30">
                          Requirement: {c.agent_requirement}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Marketing Visits */}
                {(activeTab === 'all' || activeTab === 'visits') && data?.visits?.map((v, idx) => (
                  <div key={`mv-${idx}`} className="relative pl-8">
                    <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-yellow-500 border-2 border-slate-900"></div>
                    <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-yellow-400 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" /> Marketing Visit ({v.executive_name})
                        </span>
                        <span className="text-xs text-slate-400">{v.visit_date}</span>
                      </div>
                      <p className="text-xs text-slate-300">Met: <strong>{v.person_met}</strong> &bull; Response: <span className="text-amber-300">{v.response_level}</span></p>
                      <p className="text-xs text-slate-400 mt-2">{v.remarks}</p>
                    </div>
                  </div>
                ))}

              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
