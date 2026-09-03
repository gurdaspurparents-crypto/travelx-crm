import React, { useState } from 'react';
import { 
  X, Phone, MessageSquare, PhoneCall, Calendar, MapPin, 
  AlertTriangle, Clock, CheckCircle2, Search, Filter, 
  ExternalLink, User, Building2, Tag, ArrowRight
} from 'lucide-react';

export default function FollowupAlertModal({ 
  isOpen, 
  onClose, 
  followupData, 
  onOpenModal, 
  onOpenAgentDrawer 
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  if (!isOpen || !followupData) return null;

  const { total_due = 0, counts = {}, followups = [], today } = followupData;

  // Unique cities from due followups
  const cities = Array.from(new Set(followups.map(f => f.agent_city).filter(Boolean))).sort();

  // Filter items
  const filtered = followups.filter(item => {
    if (activeFilter === 'visit' && item.source_type !== 'visit') return false;
    if (activeFilter === 'call' && item.source_type !== 'call') return false;
    if (activeFilter === 'query' && item.source_type !== 'query') return false;

    if (selectedCity && item.agent_city !== selectedCity) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchCompany = (item.company_name || '').toLowerCase().includes(q);
      const matchAgent = (item.agent_name || item.contact_person || '').toLowerCase().includes(q);
      const matchMobile = (item.mobile || '').includes(q);
      const matchCity = (item.agent_city || '').toLowerCase().includes(q);
      if (!matchCompany && !matchAgent && !matchMobile && !matchCity) return false;
    }

    return true;
  });

  const getSourceBadge = (source) => {
    switch (source) {
      case 'visit':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">🚗 Field Visit Follow-up</span>;
      case 'call':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-950 text-sky-300 border border-sky-800 flex items-center gap-1">📞 Calling Desk Follow-up</span>;
      case 'query':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">📋 Quotation / Sale Follow-up</span>;
      default:
        return null;
    }
  };

  const cleanPhone = (mobile) => {
    if (!mobile) return '';
    return mobile.replace(/\D/g, '').slice(-10);
  };

  const getWhatsAppLink = (item) => {
    const phone = cleanPhone(item.mobile);
    if (!phone) return '#';
    const name = item.contact_person || item.agent_name || 'Partner';
    const company = item.company_name || '';
    const text = `Hello ${name} (${company}),\n\nGreetings from Travelx!\nFollowing up on our recent discussion regarding your travel requirements. We have special B2B contracted fares and tour packages ready for you.\n\nPlease let us know how we can assist you today! ✈️🌍`;
    return `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Today's Due Follow-ups</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                  {total_due} DUE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scheduled for today ({today}) or pending action across field visits, calling desk, and quotations
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills & Stats Row */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/30 flex flex-wrap gap-2 items-center justify-between">
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeFilter === 'all' 
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🔥 All Due ({counts.total || 0})
            </button>
            <button
              onClick={() => setActiveFilter('visit')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeFilter === 'visit' 
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              🚗 Field Visits ({counts.visits || 0})
            </button>
            <button
              onClick={() => setActiveFilter('call')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeFilter === 'call' 
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              📞 Calls ({counts.calls || 0})
            </button>
            <button
              onClick={() => setActiveFilter('query')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeFilter === 'query' 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              📋 Quotes ({counts.queries || 0})
            </button>
          </div>

          {/* Search and City Filter */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search agency, person, mobile..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>

            {cities.length > 0 && (
              <select
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
                className="bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-sky-500"
              >
                <option value="">All Cities</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>

        </div>

        {/* Follow-up Cards List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-emerald-500/40 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-300">All Caught Up!</h3>
              <p className="text-xs text-slate-500 mt-1">No pending follow-ups match your current filter.</p>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isOverdue = item.due_date < today;
              const cleanMob = cleanPhone(item.mobile);

              return (
                <div 
                  key={`${item.source_type}-${item.id}-${idx}`}
                  className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 transition-all hover:shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  
                  {/* Left Column: Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    
                    {/* Header: Source, Due date, Stage */}
                    <div className="flex flex-wrap items-center gap-2">
                      {getSourceBadge(item.source_type)}
                      
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 ${
                        isOverdue 
                          ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {isOverdue ? `Overdue (${item.due_date})` : `Due Today (${item.due_date})`}
                      </span>

                      {item.agent_stage && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                          {item.agent_stage}
                        </span>
                      )}
                    </div>

                    {/* Agency & Contact Person */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-white text-sm hover:text-sky-400 cursor-pointer transition flex items-center gap-1.5"
                          onClick={() => onOpenAgentDrawer && onOpenAgentDrawer(item.agent_id)}>
                        <Building2 className="w-4 h-4 text-sky-400 shrink-0" />
                        {item.company_name}
                      </h4>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-300 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {item.contact_person || item.agent_name || 'Contact Person'}
                      </span>
                    </div>

                    {/* Location & Executive */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        {item.agent_area ? `${item.agent_area}, ` : ''}{item.agent_city}
                      </span>
                      <span>•</span>
                      <span>Handled by: <strong className="text-slate-300">{item.executive_name || 'Team'}</strong></span>
                      {cleanMob && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-slate-300">{cleanMob}</span>
                        </>
                      )}
                    </div>

                    {/* Previous Activity Notes / Remarks */}
                    {(item.products_pitched || item.remarks) && (
                      <div className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-2 text-xs text-slate-300 mt-2">
                        {item.products_pitched && (
                          <div className="font-medium text-sky-300 text-[11px] mb-0.5">
                            Discussion: {Array.isArray(item.products_pitched) ? item.products_pitched.join(', ') : item.products_pitched}
                          </div>
                        )}
                        {item.remarks && (
                          <div className="text-slate-400 italic text-[11px]">
                            "{item.remarks}"
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Right Column: 1-Click Action Buttons */}
                  <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto justify-end">
                    
                    {/* Call Direct */}
                    {cleanMob && (
                      <a
                        href={`tel:+91${cleanMob}`}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                        title="Direct Call"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </a>
                    )}

                    {/* WhatsApp 1-Click */}
                    {cleanMob && (
                      <a
                        href={getWhatsAppLink(item)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-xs font-bold transition"
                        title="Send WhatsApp Follow-up"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}

                    {/* Log Result Button */}
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenModal) {
                          onOpenModal('log_call', {
                            agent_id: item.agent_id,
                            company_name: item.company_name,
                            contact_person: item.contact_person || item.agent_name,
                            mobile: cleanMob
                          });
                        }
                      }}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-sm"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Log Call</span>
                    </button>

                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Showing <strong>{filtered.length}</strong> of <strong>{total_due}</strong> due follow-ups</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
