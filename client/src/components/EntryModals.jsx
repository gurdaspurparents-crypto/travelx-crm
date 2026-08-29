import React, { useState, useEffect } from 'react';
import { X, MapPin, Phone, FileText, UserPlus, CheckCircle2, Search, Plus } from 'lucide-react';

// Searchable Combobox Component for selecting agency by typing
function AgentCombobox({ agentsList, selectedAgentId, onSelectAgent }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedAgent = agentsList.find(a => a.id === selectedAgentId);

  // Filter matching agents
  const filtered = query.trim() === '' 
    ? agentsList.slice(0, 50) 
    : agentsList.filter(a => {
        const q = query.toLowerCase();
        return (
          (a.company_name && a.company_name.toLowerCase().includes(q)) ||
          (a.name && a.name.toLowerCase().includes(q)) ||
          (a.mobile && a.mobile.includes(q)) ||
          (a.id && a.id.toLowerCase().includes(q)) ||
          (a.city && a.city.toLowerCase().includes(q))
        );
      }).slice(0, 50);

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-slate-400 mb-1">
        Selected Travel Agency (Auto-filled on 1-Click Visit Log)
      </label>

      {selectedAgent ? (
        <div className="flex items-center justify-between bg-slate-950 border border-sky-500/60 p-2.5 rounded-xl text-sm font-semibold text-sky-300">
          <div>
            <span>{selectedAgent.company_name}</span>
            <span className="text-xs text-slate-400 font-mono ml-2">({selectedAgent.id} &bull; {selectedAgent.name} &bull; {selectedAgent.city})</span>
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
                      <div className="font-bold text-slate-100">{ag.company_name}</div>
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
  const [callForm, setCallForm] = useState({
    call_date: new Date().toISOString().split('T')[0],
    agent_id: data?.agent_id || data?.id || '',
    visit_id: data?.visit_id || null,
    executive_name: 'Simranjit Kaur',
    is_connected: true,
    services_discussed: ['Domestic Flight', 'Tour Packages'],
    agent_requirement: '',
    interest_level: 'Interested / Warm',
    call_result: 'Requirement Received',
    remarks: '',
    next_followup_date: new Date(Date.now() + 172800000).toISOString().split('T')[0]
  });

  useEffect(() => {
    if (modalType === 'log_call' && data) {
      setCallForm(prev => ({
        ...prev,
        agent_id: data.agent_id || data.id || prev.agent_id,
        visit_id: data.visit_id || null
      }));
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
    // Fetch quick agents dropdown list
    fetch('/api/agents?limit=700')
      .then(res => res.json())
      .then(json => {
        if (json.success) setAgentsList(json.agents);
      });
  }, []);

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

      setCallForm(prev => ({
        ...prev,
        agent_id: data.id || prev.agent_id,
        executive_name: 'Simranjit Kaur'
      }));

      setQueryForm(prev => ({
        ...prev,
        agent_id: data.id || prev.agent_id,
        handling_employee: 'Simranjit Kaur'
      }));
    }
  }, [data]);

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

  const handleCallSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callForm)
      });
      const json = await res.json();
      if (json.success) {
        alert('✅ Telephonic follow-up call logged successfully!');
        onSuccess();
        onClose();
      }
    } catch (err) {
      alert('Error logging call');
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
      }
    } catch (err) {
      alert('Error creating query');
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 my-8">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            {modalType === 'log_visit' && <><MapPin className="w-5 h-5 text-yellow-500" /> Stage 1: Log Marketing Visit</>}
            {modalType === 'log_call' && <><Phone className="w-5 h-5 text-blue-500" /> Stage 2: Log Telephonic Call</>}
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
        {modalType === 'log_call' && (
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

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Call Result</label>
              <select
                value={callForm.call_result}
                onChange={e => setCallForm({ ...callForm, call_result: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm font-semibold"
              >
                <option value="Requirement Received">Requirement Received 🎯</option>
                <option value="Interested">Interested 👍</option>
                <option value="Follow-up Required">Follow-up Required 📞</option>
                <option value="No Response">No Response / Not Connected 🔴</option>
                <option value="Call Again Later">Call Again Later ⏰</option>
                <option value="Not Interested">Not Interested ❌</option>
              </select>
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

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-blue-600/30"
            >
              ✅ Save Call Log
            </button>
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
