import React, { useState, useEffect } from 'react';
import { X, MapPin, Phone, FileText, UserPlus, CheckCircle2, Search, Plus, Clock, PhoneCall, XCircle, Calendar, ArrowRight } from 'lucide-react';

// Searchable Combobox Component for selecting agency by typing
function AgentCombobox({ agentsList, selectedAgentId, onSelectAgent }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedAgent = agentsList.find(a => a.id === selectedAgentId);

  // Filter matching agents
  const filtered = query.trim() === '' 
    ? agentsList.slice(0, 100) 
    : agentsList.filter(a => {
        const q = query.toLowerCase();
        return (
          (a.company_name && a.company_name.toLowerCase().includes(q)) ||
          (a.name && a.name.toLowerCase().includes(q)) ||
          (a.mobile && a.mobile.includes(q)) ||
          (a.id && a.id.toLowerCase().includes(q)) ||
          (a.city && a.city.toLowerCase().includes(q)) ||
          (a.area && a.area.toLowerCase().includes(q))
        );
      }).slice(0, 100);

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-slate-400 mb-1">
        Selected Travel Agency (Auto-filled on 1-Click Visit Log)
      </label>

      {selectedAgent ? (
        <div className={`flex items-center justify-between p-2.5 rounded-xl text-sm font-semibold border ${
          selectedAgent.is_query_active 
            ? 'bg-emerald-950/40 border-emerald-500/70 text-emerald-300' 
            : 'bg-slate-950 border-slate-800 text-slate-300'
        }`}>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span>{selectedAgent.company_name}</span>
              {selectedAgent.is_query_active ? (
                <span className="text-[10px] font-extrabold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                  🟢 Active ({selectedAgent.query_month_label || 'Recent Query'})
                </span>
              ) : (
                <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider border border-slate-700">
                  ⚪ Non-Active (No Query)
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 font-mono ml-0.5">({selectedAgent.id} &bull; {selectedAgent.name} &bull; {selectedAgent.city})</span>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelectAgent(null);
              setQuery('');
              setIsOpen(true);
            }}
            className="text-slate-400 hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Type Agency Firm Name (e.g. Royal Travels, Batala, 9876...)"
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:border-sky-500"
            />
          </div>

          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-3 text-xs text-slate-400 text-center">
                  No agency matching "{query}". You can type agency details in the fields below or add a new agency in Agent Master.
                </div>
              ) : (
                filtered.map(ag => (
                  <div
                    key={ag.id}
                    onClick={() => {
                      onSelectAgent(ag);
                      setIsOpen(false);
                    }}
                    className="p-2.5 hover:bg-slate-800 cursor-pointer border-b border-slate-800/40 text-xs transition flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-100 flex-wrap">
                        <span>{ag.company_name}</span>
                        {ag.is_query_active ? (
                          <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded-full">
                            🟢 Active ({ag.query_month_label || 'Query'})
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.2 rounded-full">
                            ⚪ Non-Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{ag.name} &bull; 📱 {ag.mobile} &bull; 📍 {ag.city} ({ag.area})</div>
                    </div>
                    <span className="font-mono text-[10px] font-bold bg-sky-950 text-sky-400 px-2 py-0.5 rounded border border-sky-800">
                      {ag.id}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 🎯 Smart Pitch Alert & Guidance Banner for Field Visits & Telephonic Calling
function AgentPitchBanner({ agent }) {
  if (!agent) return null;

  const isActive = Boolean(agent.is_query_active || (agent.recent_queries_count > 0));

  if (!isActive) {
    return (
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-400 flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            ⚪ Standard Prospect (No query in last/current month)
          </span>
          {agent.city && <span className="text-[10px] text-slate-500 font-mono">📍 {agent.city}</span>}
        </div>
        <div className="text-[11px] text-slate-400 leading-relaxed">
          🎯 <strong>Recommended Pitch:</strong> Introduce TravelX core inventory — Domestic & International Flight tickets, Group PNRs, Dubai/Thailand Fixed Packages & instant Visa assistance.
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
          <span className="flex items-center gap-1">
            📍 Last Visit: {agent.last_visit_date ? <strong className="text-slate-200 font-mono">{agent.last_visit_date}</strong> : <span className="text-amber-400/90 font-medium">No Visit Recorded (Pending)</span>}
          </span>
          {agent.last_visit_date && (
            <span className="text-[10px] text-slate-300">
              By: <strong className="text-white">{agent.last_visit_executive || agent.assigned_marketing_exec || 'Marketing'}</strong>
              {agent.last_visit_person_met ? ` (Met: ${agent.last_visit_person_met})` : ''}
            </span>
          )}
        </div>
      </div>
    );
  }

  const queryStatus = agent.latest_query_status || 'In-Progress';
  const isConverted = queryStatus === 'Converted';
  const isLost = queryStatus === 'Rejected' || queryStatus === 'Lost';

  return (
    <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/50 border border-emerald-500/60 rounded-xl p-3.5 shadow-lg shadow-emerald-950/40 space-y-2.5">
      {/* Header Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-black text-emerald-300 tracking-wide uppercase flex items-center gap-1">
            🔥 ACTIVE AGENT &bull; {agent.query_month_label || 'RECENT'} QUERY
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
            {agent.recent_queries_count || 1} Queries
          </span>
          {(agent.recent_bookings_count > 0 || isConverted) && (
            <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40">
              ✅ Booked Client
            </span>
          )}
        </div>
      </div>

      {/* 📍 Marketing Visit Summary */}
      <div className="bg-sky-950/40 border border-sky-500/30 rounded-lg p-2 text-xs flex items-center justify-between">
        <span className="text-sky-300 font-semibold flex items-center gap-1.5 text-[11px]">
          📍 Last Visit: <span className="font-mono text-white font-bold">{agent.last_visit_date || 'No Visit Recorded'}</span>
        </span>
        <span className="text-slate-300 text-[10px]">
          {agent.last_visit_date ? (
            <>By: <span className="font-medium text-slate-100">{agent.last_visit_executive || agent.assigned_marketing_exec || 'Marketing'}</span>{agent.last_visit_person_met ? ` (Met: ${agent.last_visit_person_met})` : ''}</>
          ) : (
            <span className="text-rose-400 font-mono">Visit Pending</span>
          )}
        </span>
      </div>

      {/* Latest Query Details Card */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2.5 text-xs space-y-1">
        <div className="flex items-center justify-between font-bold text-slate-100">
          <span className="flex items-center gap-1.5 text-sky-300">
            ✈️ {agent.latest_query_product || 'Recent Travel Inquiry'}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold ${
            isConverted ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' :
            isLost ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50' :
            'bg-amber-500/30 text-amber-300 border border-amber-500/50'
          }`}>
            {queryStatus}
          </span>
        </div>

        {agent.latest_query_details && (
          <div className="text-[11px] text-slate-300 leading-snug">
            <span className="text-slate-400 font-semibold">Route/Details: </span>
            {agent.latest_query_details}
          </div>
        )}

        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
          <span>Date: {agent.latest_query_date || 'Recent'}</span>
          {agent.latest_quoted_amount > 0 && (
            <span className="text-amber-300 font-bold">Quoted: ₹{Number(agent.latest_quoted_amount).toLocaleString('en-IN')}</span>
          )}
          {agent.latest_booking_ref && (
            <span className="text-emerald-400 font-bold">Booking: {agent.latest_booking_ref}</span>
          )}
        </div>

        {agent.latest_rejection_reason && (
          <div className="text-[10px] text-rose-300 pt-0.5">
            <strong>Lost Reason:</strong> {agent.latest_rejection_reason}
          </div>
        )}
      </div>

      {/* 🎯 Actionable Pitch Strategy */}
      <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-2.5 text-xs">
        <div className="font-bold text-amber-300 flex items-center gap-1 mb-1">
          <span>🎯 Recommended Pitch Strategy:</span>
        </div>
        <div className="text-slate-200 text-[11px] leading-relaxed">
          {isConverted ? (
            <span>
              🌟 <strong>Repeat/Converted Buyer:</strong> Thank them for booking <em>{agent.latest_booking_ref || agent.latest_query_product}</em>! Pitch upcoming festive fixed departures & ask for their fresh passenger travel requirements.
            </span>
          ) : isLost ? (
            <span>
              ⚡ <strong>Win-Back Opportunity:</strong> Previous inquiry for <em>{agent.latest_query_product} ({agent.latest_query_details || 'recent inquiry'})</em> was lost{agent.latest_rejection_reason ? ` (${agent.latest_rejection_reason})` : ''}. Pitch our unbeatable net B2B fares & guaranteed seat holding to win their next booking!
            </span>
          ) : (
            <span>
              🔥 <strong>Hot Follow-Up:</strong> Active inquiry in progress for <em>{agent.latest_query_product} ({agent.latest_query_details || 'recent inquiry'})</em> quoted on {agent.latest_query_date || 'recently'}. Check client confirmation & close the booking!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function EntryModals({ modalType, prefillData, prefilledData, onClose, onSuccess }) {
  const data = prefillData || prefilledData;
  const [agentsList, setAgentsList] = useState([]);
  
  // Log Visit Form State
  const [visitForm, setVisitForm] = useState({
    visit_date: new Date().toISOString().split('T')[0],
    agent_id: data?.id || '',
    executive_name: 'Bikramjit Singh',
    person_met: data?.name || '',
    mobile: data?.mobile || '',
    is_new_agent: false,
    products_pitched: ['Domestic Flight', 'Visa Services'],
    response_level: 'Interested / Warm',
    remarks: '',
    next_followup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    location: data?.city || 'Gurdaspur',
    gps_latitude: '',
    gps_longitude: '',
    gps_address: ''
  });

  const captureGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setVisitForm(prev => ({
            ...prev,
            gps_latitude: String(lat),
            gps_longitude: String(lng),
            gps_address: `Lat: ${lat}, Long: ${lng}`
          }));
        },
        (error) => {
          console.warn('GPS Error:', error.message);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  // Log Call Form State
  const isInitialEdit = modalType === 'edit_call';
  const [callForm, setCallForm] = useState({
    id: isInitialEdit ? (data?.call_id || data?.id || null) : null,
    call_date: data?.call_date || new Date().toISOString().split('T')[0],
    agent_id: data?.agent_id || (!isInitialEdit ? data?.id : '') || '',
    visit_id: data?.visit_id || null,
    executive_name: data?.executive_name || data?.call_executive || 'Simranjit Kaur',
    is_connected: data?.is_connected !== undefined ? !!data.is_connected : true,
    services_discussed: ['Domestic Flight', 'Tour Packages'],
    agent_requirement: data?.agent_requirement || '',
    interest_level: data?.interest_level || 'Interested / Warm',
    call_result: data?.call_result || 'Requirement Received',
    payment_terms: data?.payment_terms || 'Advance Payment',
    remarks: data?.remarks || data?.call_feedback || '',
    next_followup_date: data?.next_followup_date || new Date(Date.now() + 172800000).toISOString().split('T')[0]
  });

  useEffect(() => {
    if ((modalType === 'log_call' || modalType === 'edit_call') && data) {
      let parsedServices = ['Domestic Flight', 'Tour Packages'];
      if (Array.isArray(data.services_discussed)) {
        parsedServices = data.services_discussed;
      } else if (typeof data.services_discussed === 'string') {
        try { parsedServices = JSON.parse(data.services_discussed); } catch (e) { parsedServices = [data.services_discussed]; }
      }

      const isEditModal = modalType === 'edit_call';
      const callRecordId = isEditModal ? (data.call_id || data.id || null) : null;
      const targetAgentId = data.agent_id || (!isEditModal ? data.id : '') || '';

      setCallForm({
        id: callRecordId,
        call_date: data.call_date || new Date().toISOString().split('T')[0],
        agent_id: targetAgentId,
        visit_id: data.visit_id || null,
        executive_name: data.executive_name || data.call_executive || 'Simranjit Kaur',
        is_connected: data.is_connected !== undefined ? !!data.is_connected : true,
        services_discussed: parsedServices,
        agent_requirement: data.agent_requirement || '',
        interest_level: data.interest_level || 'Interested / Warm',
        call_result: data.call_result || 'Requirement Received',
        payment_terms: data.payment_terms || 'Advance Payment',
        remarks: data.remarks || data.call_feedback || '',
        next_followup_date: data.next_followup_date || new Date(Date.now() + 172800000).toISOString().split('T')[0]
      });
    }
  }, [modalType, data]);

  // Create Query Form State
  const [queryForm, setQueryForm] = useState({
    query_date: new Date().toISOString().split('T')[0],
    agent_id: data?.id || '',
    product: 'International Flight',
    query_details: '',
    travel_date: new Date(Date.now() + 1296000000).toISOString().split('T')[0],
    pax_details: '2 Adults',
    estimated_value: '',
    quoted_amount: '',
    handling_employee: 'Simranjit Kaur',
    followup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  });

  // New Agent Form State
  const [agentForm, setAgentForm] = useState({
    id: data?.id || '',
    name: data?.name || '',
    company_name: data?.company_name || '',
    mobile: data?.mobile || '',
    city: data?.city || 'Gurdaspur',
    area: data?.area || 'Main Market',
    agent_type: data?.agent_type || 'Retail Travel Agent',
    assigned_marketing_exec: data?.assigned_marketing_exec || 'Bikramjit Singh',
    assigned_telephonic_exec: data?.assigned_telephonic_exec || 'Simranjit Kaur'
  });

  useEffect(() => {
    if (modalType === 'edit_agent' && data) {
      setAgentForm({
        id: data.id || '',
        name: data.name || '',
        company_name: data.company_name || '',
        mobile: data.mobile || '',
        city: data.city || '',
        area: data.area || '',
        agent_type: data.agent_type || 'Retail Travel Agent',
        assigned_marketing_exec: data.assigned_marketing_exec || 'Bikramjit Singh',
        assigned_telephonic_exec: data.assigned_telephonic_exec || 'Simranjit Kaur'
      });
    }
  }, [modalType, data]);

  useEffect(() => {
    if (modalType) {
      // Fetch full agents dropdown list (limit 5000, newest first)
      fetch('/api/agents?limit=5000')
        .then(res => res.json())
        .then(json => {
          if (json.success) setAgentsList(json.agents);
        });
    }
  }, [modalType]);

  // Sync prefilled data whenever an agent is selected for 1-Click Visit Log!
  useEffect(() => {
    if (data) {
      setVisitForm(prev => ({
        ...prev,
        agent_id: data.id || prev.agent_id,
        person_met: data.name || prev.person_met,
        mobile: data.mobile || prev.mobile,
        location: data.city || prev.location,
        executive_name: 'Bikramjit Singh'
      }));

      if (modalType === 'log_call' || modalType === 'edit_call') {
        let services = ['Domestic Flight', 'Tour Packages'];
        if (data.services_discussed) {
          if (Array.isArray(data.services_discussed)) services = data.services_discussed;
          else if (typeof data.services_discussed === 'string') {
            try {
              const p = JSON.parse(data.services_discussed);
              if (Array.isArray(p)) services = p;
              else services = [data.services_discussed];
            } catch (e) {
              services = data.services_discussed.split(',').map(s => s.trim());
            }
          }
        }
        setCallForm({
          id: data.call_id || data.id || null,
          call_date: data.call_date || new Date().toISOString().split('T')[0],
          agent_id: data.agent_id || data.id || '',
          visit_id: data.visit_id || null,
          executive_name: data.executive_name || data.call_executive || 'Simranjit Kaur',
          is_connected: data.is_connected !== undefined ? !!data.is_connected : true,
          services_discussed: services,
          agent_requirement: data.agent_requirement || '',
          interest_level: data.interest_level || 'Interested / Warm',
          call_result: data.call_result || 'Call Connected / In Discussion',
          payment_terms: data.payment_terms || 'Advance Payment',
          remarks: data.remarks || data.call_feedback || '',
          next_followup_date: data.next_followup_date || new Date(Date.now() + 86400000).toISOString().split('T')[0]
        });
      } else {
        setCallForm(prev => ({
          ...prev,
          agent_id: data.agent_id || data.id || prev.agent_id,
          executive_name: data.executive_name || prev.executive_name || 'Simranjit Kaur'
        }));
      }

      setQueryForm(prev => ({
        ...prev,
        agent_id: data.id || prev.agent_id,
        handling_employee: 'Simranjit Kaur'
      }));
    }
  }, [data, modalType]);

  useEffect(() => {
    if (modalType === 'log_visit') {
      captureGPS();
    }
  }, [modalType]);

  const handleVisitSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitForm)
      });
      const json = await res.json();
      if (json.success) {
        alert('✅ Marketing visit logged successfully!');
        onSuccess();
        onClose();
      }
    } catch (err) {
      alert('Error logging visit');
    }
  };

  const handleCallSubmit = async (e, forceNew = false) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      const isEdit = !forceNew && modalType === 'edit_call' && !!callForm.id;
      const url = isEdit ? `/api/calls/${callForm.id}` : '/api/calls';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = { ...callForm };
      if (!isEdit) {
        delete payload.id;
      }
      if (forceNew) {
        payload.call_date = new Date().toISOString().split('T')[0];
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) {
        alert(isEdit ? '✅ Telephonic call updated successfully!' : '✅ Telephonic follow-up call logged successfully!');
        onSuccess();
        onClose();
      } else {
        alert(json.error || 'Failed to save call');
      }
    } catch (err) {
      alert('Error saving call: ' + err.message);
    }
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(queryForm)
      });
      const json = await res.json();
      if (json.success) {
        alert('✅ Agent query created successfully!');
        onSuccess();
        onClose();
      } else {
        alert('❌ Error saving query: ' + (json.error || 'Unknown error. Please try again.'));
      }
    } catch (err) {
      alert('❌ Network error creating query: ' + err.message);
    }
  };

  const handleAgentSubmit = async (e) => {
    e.preventDefault();
    try {
      const isEdit = modalType === 'edit_agent';
      const url = isEdit ? `/api/agents/${agentForm.id}` : '/api/agents';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agentForm)
      });
      const json = await res.json();
      if (json.success) {
        alert(isEdit ? '✅ Agent details updated successfully!' : `✅ New Travel Agent (${json.agent_id}) added to Master Database!`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(json.error || 'Error saving agent details');
      }
    } catch (err) {
      alert('Error saving agent details');
    }
  };

  if (!modalType) return null;

  const productsList = ['Domestic Flight', 'International Flight', 'Tour Packages', 'Hotel Booking', 'Visa Services', 'Forex', 'Travel Insurance', 'Bus Booking', 'Cruise', 'Money Transfer'];
  const activeAgentId = modalType === 'log_visit' ? visitForm.agent_id : (modalType === 'create_query' ? queryForm.agent_id : callForm.agent_id);
  const currentAgent = agentsList.find(a => a.id === activeAgentId) || (data && (data.id === activeAgentId || data.agent_id === activeAgentId) ? data : (data || null));
  const selectedAgent = currentAgent;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 my-8">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            {modalType === 'log_visit' && <><MapPin className="w-5 h-5 text-yellow-500" /> Stage 1: Log Marketing Visit</>}
            {(modalType === 'log_call' || modalType === 'edit_call') && <><Phone className="w-5 h-5 text-blue-500" /> {modalType === 'edit_call' ? '✏️ Edit Telephonic Call' : 'Stage 2: Log Telephonic Call'}</>}
            {modalType === 'create_query' && <><FileText className="w-5 h-5 text-amber-500" /> Stage 3: Create Agent Query</>}
            {modalType === 'create_agent' && <><UserPlus className="w-5 h-5 text-sky-500" /> Add New Travel Agency</>}
            {modalType === 'edit_agent' && <><UserPlus className="w-5 h-5 text-sky-500" /> ✏️ Edit Agent Details ({agentForm.id})</>}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOG MARKETING VISIT FORM */}
        {modalType === 'log_visit' && (
          <form onSubmit={handleVisitSubmit} className="space-y-4">
            {/* Agency Current Visit & Query Status Strip */}
            {currentAgent && (
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 font-semibold">Visit:</span>
                  {currentAgent.last_visit_date ? (
                    <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      ✅ Visited ({currentAgent.last_visit_date})
                    </span>
                  ) : (
                    <span className="text-rose-400 font-bold bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800 animate-pulse">
                      🔴 Pending Visit
                    </span>
                  )}
                </div>
                <div>
                  {currentAgent.is_query_active ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span>🟢 Active ({currentAgent.query_month_label || 'Recent Query'})</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      ⚪ Non-Active (No Query)
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Visit Date</label>
                <input
                  type="date"
                  value={visitForm.visit_date}
                  onChange={e => setVisitForm({ ...visitForm, visit_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Marketing Executive</label>
                <select
                  value={visitForm.executive_name}
                  onChange={e => setVisitForm({ ...visitForm, executive_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm font-bold text-yellow-400"
                >
                  <option value="Bikramjit Singh">Bikramjit Singh</option>
                </select>
              </div>
            </div>

            {/* GPS Live Location Verification Box */}
            <div className="bg-slate-950 border border-yellow-500/40 p-3 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-yellow-400 animate-bounce" />
                <div>
                  <span className="font-bold text-slate-200">GPS Visit Proof Verification:</span>
                  {visitForm.gps_latitude ? (
                    <p className="text-[11px] text-emerald-400 font-mono font-semibold">
                      ✅ Live GPS Coordinates Captured ({visitForm.gps_latitude}, {visitForm.gps_longitude})
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-400 font-semibold">
                      📍 Capturing mobile GPS coordinates...
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={captureGPS}
                className="px-2.5 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg text-[11px] font-bold transition shadow"
              >
                {visitForm.gps_latitude ? 'Re-capture GPS' : '📍 Capture GPS'}
              </button>
            </div>

            {/* Smart Search Combobox */}
            <AgentCombobox
              agentsList={agentsList}
              selectedAgentId={visitForm.agent_id}
              onSelectAgent={(ag) => {
                if (ag) {
                  setVisitForm({
                    ...visitForm,
                    agent_id: ag.id,
                    person_met: ag.name || visitForm.person_met,
                    mobile: ag.mobile || visitForm.mobile,
                    location: ag.city || visitForm.location
                  });
                } else {
                  setVisitForm({ ...visitForm, agent_id: '' });
                }
              }}
            />

            {/* 🎯 Smart Pitch & Active Query Alert */}
            {currentAgent && <AgentPitchBanner agent={currentAgent} />}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Person Met</label>
                <input
                  type="text"
                  value={visitForm.person_met}
                  onChange={e => setVisitForm({ ...visitForm, person_met: e.target.value })}
                  placeholder="Owner / Agent Name"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Mobile</label>
                <input
                  type="text"
                  value={visitForm.mobile}
                  onChange={e => setVisitForm({ ...visitForm, mobile: e.target.value })}
                  placeholder="9876543210"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Products & Services Pitched</label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                {productsList.map(prod => (
                  <label key={prod} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visitForm.products_pitched.includes(prod)}
                      onChange={e => {
                        if (e.target.checked) {
                          setVisitForm({ ...visitForm, products_pitched: [...visitForm.products_pitched, prod] });
                        } else {
                          setVisitForm({ ...visitForm, products_pitched: visitForm.products_pitched.filter(p => p !== prod) });
                        }
                      }}
                      className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
                    />
                    {prod}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Agent Response / Interest Level</label>
              <select
                value={visitForm.response_level}
                onChange={e => setVisitForm({ ...visitForm, response_level: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm font-semibold"
              >
                <option value="Very Interested / Hot">Very Interested / Hot 🔥</option>
                <option value="Interested / Warm">Interested / Warm 🟡</option>
                <option value="Not Very Interested / Cold">Not Very Interested / Cold 🔵</option>
                <option value="Not Interested">Not Interested 🔴</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Visit Remarks & Free-text Notes</label>
              <textarea
                rows="2"
                value={visitForm.remarks}
                onChange={e => setVisitForm({ ...visitForm, remarks: e.target.value })}
                placeholder="Example: Agent deals in Dubai flights & Canada packages..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm"
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-yellow-600/30"
            >
              ✅ Save Marketing Visit Record
            </button>
          </form>
        )}

        {/* LOG TELEPHONIC CALL FORM */}
        {(modalType === 'log_call' || modalType === 'edit_call') && (
          <form onSubmit={handleCallSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Call Date</label>
                <input
                  type="date"
                  value={callForm.call_date}
                  onChange={e => setCallForm({ ...callForm, call_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Telephonic Executive</label>
                <select
                  value={callForm.executive_name}
                  onChange={e => setCallForm({ ...callForm, executive_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm font-bold text-sky-400"
                >
                  <option value="Simranjit Kaur">Simranjit Kaur</option>
                  <option value="Yug">Yug (Calling Exec)</option>
                </select>
              </div>
            </div>

            {/* Smart Search Combobox */}
            <AgentCombobox
              agentsList={agentsList}
              selectedAgentId={callForm.agent_id}
              onSelectAgent={(ag) => {
                if (ag) {
                  setCallForm({ ...callForm, agent_id: ag.id });
                } else {
                  setCallForm({ ...callForm, agent_id: '' });
                }
              }}
            />

            {/* 🎯 Smart Pitch & Active Query Alert */}
            {currentAgent && <AgentPitchBanner agent={currentAgent} />}

            {/* 3-WAY QUICK ACTION BUTTONS: Calling / Closed / Again Call */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Select Follow-up Action:</span>
                {selectedAgent?.mobile && (
                  <a
                    href={`tel:${selectedAgent.mobile}`}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono font-bold flex items-center gap-1 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800"
                  >
                    <PhoneCall className="w-3 h-3" /> Dial {selectedAgent.mobile}
                  </a>
                )}
              </label>

              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                {/* 📞 Calling Option */}
                <button
                  type="button"
                  onClick={() => {
                    setCallForm(prev => ({
                      ...prev,
                      call_result: 'Call Connected / In Discussion',
                      is_connected: true,
                      call_date: new Date().toISOString().split('T')[0]
                    }));
                  }}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    (callForm.call_result || '').toLowerCase().includes('connected') || (callForm.call_result || '').toLowerCase().includes('discussion')
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <PhoneCall className="w-3.5 h-3.5 text-sky-300" />
                  <span>📞 Calling / Done</span>
                </button>

                {/* 🔄 Again Call Option */}
                <button
                  type="button"
                  onClick={() => {
                    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                    setCallForm(prev => ({
                      ...prev,
                      call_result: 'Call Again Later',
                      is_connected: true,
                      next_followup_date: prev.next_followup_date || tomorrow
                    }));
                  }}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    (callForm.call_result || '').toLowerCase().includes('again') || (callForm.call_result || '').toLowerCase().includes('later')
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>🔄 Again Call</span>
                </button>

                {/* ❌ Closed Option */}
                <button
                  type="button"
                  onClick={() => {
                    setCallForm(prev => ({
                      ...prev,
                      call_result: 'Closed - Not Interested',
                      next_followup_date: '',
                      remarks: prev.remarks || 'Follow-up marked as Closed'
                    }));
                  }}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    (callForm.call_result || '').toLowerCase().includes('closed')
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-300" />
                  <span>❌ Closed</span>
                </button>
              </div>

              {/* Quick Presets for "Again Call" */}
              {((callForm.call_result || '').toLowerCase().includes('again') || (callForm.call_result || '').toLowerCase().includes('later')) && (
                <div className="mt-2 p-2 bg-amber-950/30 border border-amber-800/40 rounded-lg flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Quick Reschedule:
                  </span>
                  {[
                    { label: 'Tomorrow (+1d)', days: 1 },
                    { label: 'In 2 Days', days: 2 },
                    { label: 'In 3 Days', days: 3 },
                    { label: 'Next Week (+7d)', days: 7 }
                  ].map(p => {
                    const targetDate = new Date(Date.now() + p.days * 86400000).toISOString().split('T')[0];
                    const isSelected = callForm.next_followup_date === targetDate;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setCallForm(prev => ({ ...prev, next_followup_date: targetDate }))}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                          isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-300 hover:bg-amber-900/60'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Quick Sub-reasons for "Closed" */}
              {(callForm.call_result || '').toLowerCase().includes('closed') && (
                <div className="mt-2 p-2 bg-rose-950/30 border border-rose-800/40 rounded-lg flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Closing Status:
                  </span>
                  {[
                    'Closed - Not Interested',
                    'Closed - Converted / Won',
                    'Closed - Follow-up Completed'
                  ].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setCallForm(prev => ({ ...prev, call_result: opt, next_followup_date: '' }))}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${
                        callForm.call_result === opt ? 'bg-rose-500 text-white' : 'bg-slate-800 text-rose-300 hover:bg-rose-900/60'
                      }`}
                    >
                      {opt.replace('Closed - ', '')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Call Result (Full Status)</label>
              <select
                value={callForm.call_result}
                onChange={e => setCallForm({ ...callForm, call_result: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm font-semibold"
              >
                <option value="Call Connected / In Discussion">📞 Calling: Connected / In Discussion</option>
                <option value="Call Again Later">⏰ Again Call: Call Again Later / Reschedule</option>
                <option value="Closed - Not Interested">❌ Closed: Not Interested</option>
                <option value="Closed - Converted / Won">🏆 Closed: Converted / Won</option>
                <option value="Closed - Follow-up Completed">📁 Closed: Follow-up Completed</option>
                <option value="Requirement Received">🎯 Requirement Received</option>
                <option value="Interested">👍 Interested</option>
                <option value="Follow-up Required">📞 Follow-up Required</option>
                <option value="No Response">🔴 No Response / Ringing</option>
                <option value="Not Interested">🚫 Not Interested / Don't Call</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">💳 Agent Payment Terms (Advance / Credit / After)</label>
              <select
                value={callForm.payment_terms || 'Advance Payment'}
                onChange={e => setCallForm({ ...callForm, payment_terms: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm font-bold text-emerald-400"
              >
                <option value="Advance Payment">⚡ Advance Payment (Pehle Payment Leni Hai)</option>
                <option value="After Booking / Credit">💳 After Booking / Credit (Booking ke Baad Payment)</option>
                <option value="50% Advance / 50% Credit">🌗 50% Advance / 50% Balance (Aadhi Advance)</option>
                <option value="Not Discussed">❓ Not Discussed / Pending</option>
              </select>
              <p className="text-[10px] text-emerald-400/80 mt-1">
                ✨ Simranjit: Ye select karne par Agent Master & CRM Me automatically status update ho jayega!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Remarks / Customer Feedback</label>
                <input
                  type="text"
                  value={callForm.remarks}
                  onChange={e => setCallForm({ ...callForm, remarks: e.target.value })}
                  placeholder="Conversation notes..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Next Follow-up Date</label>
                <input
                  type="date"
                  value={callForm.next_followup_date || ''}
                  onChange={e => setCallForm({ ...callForm, next_followup_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Captured Requirement / Notes</label>
              <textarea
                rows="2"
                value={callForm.agent_requirement}
                onChange={e => setCallForm({ ...callForm, agent_requirement: e.target.value })}
                placeholder="Details of what agent asked for on call..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm"
              ></textarea>
            </div>

            {(modalType === 'edit_call' && callForm.id) ? (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={(e) => handleCallSubmit(e, true)}
                  className="py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-sky-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Logs a fresh call entry today for this follow-up, keeping call history intact"
                >
                  <PhoneCall className="w-4 h-4" /> 📞 Log As New Call Today
                </button>
                <button
                  type="submit"
                  className="py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-amber-600/30 flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Overwrites / edits this existing call record"
                >
                  <span>💾 Update Existing Record</span>
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>✅ Save Telephonic Call Log</span>
              </button>
            )}
          </form>
        )}

        {/* CREATE AGENT QUERY FORM */}
        {modalType === 'create_query' && (
          <form onSubmit={handleQuerySubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Query Date</label>
                <input
                  type="date"
                  value={queryForm.query_date}
                  onChange={e => setQueryForm({ ...queryForm, query_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Product</label>
                <select
                  value={queryForm.product}
                  onChange={e => setQueryForm({ ...queryForm, product: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm font-semibold text-amber-400"
                >
                  {productsList.map(prod => (
                    <option key={prod} value={prod}>{prod}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Smart Search Combobox */}
            <AgentCombobox
              agentsList={agentsList}
              selectedAgentId={queryForm.agent_id}
              onSelectAgent={(ag) => {
                if (ag) {
                  setQueryForm({ ...queryForm, agent_id: ag.id });
                } else {
                  setQueryForm({ ...queryForm, agent_id: '' });
                }
              }}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Requirement Details</label>
              <textarea
                rows="2"
                value={queryForm.query_details}
                onChange={e => setQueryForm({ ...queryForm, query_details: e.target.value })}
                placeholder="Flight route, pax details, hotel category, preferred dates..."
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm"
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Estimated Value (₹)</label>
                <input
                  type="number"
                  value={queryForm.estimated_value}
                  onChange={e => setQueryForm({ ...queryForm, estimated_value: e.target.value, quoted_amount: e.target.value })}
                  placeholder="e.g. 50000"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm font-bold text-sky-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Quoted Amount (₹)</label>
                <input
                  type="number"
                  value={queryForm.quoted_amount}
                  onChange={e => setQueryForm({ ...queryForm, quoted_amount: e.target.value })}
                  placeholder="e.g. 48500"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm font-bold text-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-amber-600/30"
            >
              ✅ Create Agent Query
            </button>
          </form>
        )}

        {/* ADD / EDIT AGENT FORM */}
        {(modalType === 'create_agent' || modalType === 'edit_agent') && (
          <form onSubmit={handleAgentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Agency / Firm Name</label>
              <input
                type="text"
                value={agentForm.company_name}
                onChange={e => setAgentForm({ ...agentForm, company_name: e.target.value })}
                placeholder="e.g. Royal Travels & Holidays"
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm font-bold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Contact Person Name</label>
                <input
                  type="text"
                  value={agentForm.name}
                  onChange={e => setAgentForm({ ...agentForm, name: e.target.value })}
                  placeholder="Owner / Contact Person"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={agentForm.mobile}
                  onChange={e => setAgentForm({ ...agentForm, mobile: e.target.value })}
                  placeholder="9876543210"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">City / Location</label>
                <input
                  type="text"
                  value={agentForm.city}
                  onChange={e => setAgentForm({ ...agentForm, city: e.target.value })}
                  placeholder="e.g. Gurdaspur"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Area</label>
                <input
                  type="text"
                  value={agentForm.area}
                  onChange={e => setAgentForm({ ...agentForm, area: e.target.value })}
                  placeholder="e.g. Main Market"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Agent Type</label>
              <select
                value={agentForm.agent_type}
                onChange={e => setAgentForm({ ...agentForm, agent_type: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm"
              >
                <option value="Retail Travel Agent">Retail Travel Agent</option>
                <option value="Flight Specialist">Flight Specialist</option>
                <option value="Package Specialist">Package Specialist</option>
                <option value="Corporate Agent">Corporate Agent</option>
                <option value="Forex & Visa Agent">Forex & Visa Agent</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-sky-600/30"
            >
              {modalType === 'edit_agent' ? '✅ Save Updated Agent Details' : '✅ Add Agent to Master Database'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
