import React, { useState, useEffect } from 'react';
import { FileText, Plus, CheckCircle2, XCircle, Clock, Filter, DollarSign, ArrowRight, Eye, AlertTriangle, Trash2, Download, Calendar, X } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';

export default function QueryManagement({ onOpenModal, onOpenAgentDrawer }) {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modals inside component
  const [convertingQuery, setConvertingQuery] = useState(null);
  const [rejectingQuery, setRejectingQuery] = useState(null);

  // Convert Form state
  const [bookingDate, setBookingDate] = useState('2026-08-29');
  const [bookingValue, setBookingValue] = useState('');
  const [bookingRefNo, setBookingRefNo] = useState('');

  // Reject Form state
  const [rejectReason, setRejectReason] = useState('Competitor Rate');
  const [rejectRemarks, setRejectRemarks] = useState('');

  useEffect(() => {
    fetchQueries();
  }, [statusFilter, productFilter, dateFilter]);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (productFilter) params.append('product', productFilter);
      if (dateFilter) params.append('date', dateFilter);

      const res = await fetch(`/api/queries?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setQueries(json.queries);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuery = async (queryId) => {
    if (!window.confirm('🗑️ Are you sure you want to delete this query?')) return;
    try {
      const res = await fetch(`/api/queries/${queryId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        alert('Query deleted successfully');
        fetchQueries();
      }
    } catch (err) {
      alert('Error deleting query');
    }
  };

  const handleExportPDF = () => {
    const headers = ['Query ID', 'Query Date', 'Agency Firm', 'Product', 'Quoted (₹)', 'Handling Exec', 'Status'];
    const rows = queries.map(q => [
      q.id,
      q.query_date,
      q.company_name,
      q.product,
      `₹${(q.quoted_amount || 0).toLocaleString('en-IN')}`,
      q.handling_employee,
      q.status
    ]);
    exportToPDF('Stage 3 & 4 – Queries & Booking Conversions Report', 'Agent Requirements and Sales Conversion Pipeline', headers, rows);
  };

  const handleConvertSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/queries/${convertingQuery.id}/convert`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_date: bookingDate,
          booking_value: parseFloat(bookingValue) || convertingQuery.quoted_amount,
          booking_ref_no: bookingRefNo || `BK-${Math.floor(1000 + Math.random() * 9000)}`,
          closing_employee: convertingQuery.handling_employee
        })
      });
      const json = await res.json();
      if (json.success) {
        alert('🎉 Booking Converted Successfully! Agent is now marked as ACTIVE.');
        setConvertingQuery(null);
        fetchQueries();
      }
    } catch (err) {
      alert('Error converting query');
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/queries/${convertingQuery?.id || rejectingQuery?.id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejection_reason: rejectReason,
          rejection_remarks: rejectRemarks,
          status: 'Rejected'
        })
      });
      const json = await res.json();
      if (json.success) {
        alert('Query marked as Rejected/Lost.');
        setRejectingQuery(null);
        fetchQueries();
      }
    } catch (err) {
      alert('Error recording rejection');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" /> Stage 3 & 4 – Agent Query & Booking Conversion
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage incoming requirements, quotations, booking closures, and lost business reasons
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/api/export/queries"
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
            onClick={() => onOpenModal('create_query')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-xl text-xs transition shadow-lg shadow-amber-600/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create New Query
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap gap-4 items-center">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filters:
        </span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-sm p-2.5 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Query Statuses</option>
          <option value="New">New</option>
          <option value="Quoted">Quoted</option>
          <option value="Follow-up">Follow-up</option>
          <option value="Pending">Pending</option>
          <option value="Converted">🟢 Converted (Booking)</option>
          <option value="Rejected">🔴 Rejected / Lost</option>
        </select>

        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-sm p-2.5 focus:outline-none focus:border-sky-500"
        >
          <option value="">All Travel Products</option>
          <option value="Domestic Flight">Domestic Flight</option>
          <option value="International Flight">International Flight</option>
          <option value="Tour Packages">Tour Packages</option>
          <option value="Hotel Booking">Hotel Booking</option>
          <option value="Visa Services">Visa Services</option>
          <option value="Forex">Forex</option>
          <option value="Travel Insurance">Travel Insurance</option>
        </select>

        {/* Date Filter Controls */}
        <div className="flex items-center gap-1.5 flex-wrap border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-3">
          <span className="text-xs font-semibold text-slate-400">Date:</span>
          <button
            onClick={() => setDateFilter(new Date().toISOString().split('T')[0])}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              dateFilter === new Date().toISOString().split('T')[0]
                ? 'bg-amber-600 text-white'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            ⚡ Today
          </button>
          <button
            onClick={() => {
              const y = new Date();
              y.setDate(y.getDate() - 1);
              setDateFilter(y.toISOString().split('T')[0]);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              (() => {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                return dateFilter === y.toISOString().split('T')[0];
              })()
                ? 'bg-amber-600 text-white'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            Yesterday
          </button>
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-2.5 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition flex items-center gap-1 border border-slate-700"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Queries Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase">
              <tr>
                <th className="p-3.5">Query ID</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5">Agent Agency</th>
                <th className="p-3.5">Product & Details</th>
                <th className="p-3.5">Quoted Amount</th>
                <th className="p-3.5">Handling Exec</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions / Conversion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center p-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                  </td>
                </tr>
              ) : queries.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center p-8 text-slate-500">
                    No queries found matching filters.
                  </td>
                </tr>
              ) : (
                queries.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-bold text-amber-400">{q.id}</td>
                    <td className="p-3.5 font-mono text-xs text-slate-400">{q.query_date}</td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-100">{q.company_name}</div>
                      <div className="text-xs text-slate-400">{q.agent_city}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-sky-400">{q.product}</div>
                      <div className="text-xs text-slate-400 max-w-xs truncate">{q.query_details}</div>
                    </td>
                    <td className="p-3.5 font-bold text-slate-200">
                      ₹{(q.quoted_amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-slate-300 text-xs">{q.handling_employee}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                        q.status === 'Converted' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        q.status === 'Rejected' || q.status === 'Lost' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                        'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        {q.status !== 'Converted' && q.status !== 'Rejected' && (
                          <>
                            <button
                              onClick={() => {
                                setConvertingQuery(q);
                                setBookingValue(q.quoted_amount || '');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition flex items-center gap-1 shadow"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Convert
                            </button>
                            <button
                              onClick={() => setRejectingQuery(q)}
                              className="px-2.5 py-1 bg-rose-900/60 hover:bg-rose-800 text-rose-300 rounded text-xs font-semibold transition border border-rose-700/50 flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => onOpenAgentDrawer(q.agent_id)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs transition border border-slate-700"
                        >
                          View 360°
                        </button>
                        <button
                          onClick={() => handleDeleteQuery(q.id)}
                          title="Delete Wrong Query Entry"
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

      {/* Convert to Booking Modal */}
      {convertingQuery && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-emerald-400 flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-6 h-6" /> Convert Query to Booking
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Query: <strong className="text-slate-200">{convertingQuery.id}</strong> ({convertingQuery.product} for {convertingQuery.company_name})
            </p>

            <form onSubmit={handleConvertSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Booking Date</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={e => setBookingDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Final Booking Value (₹)</label>
                <input
                  type="number"
                  value={bookingValue}
                  onChange={e => setBookingValue(e.target.value)}
                  placeholder="e.g. 45000"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm font-bold text-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Booking / Reference Number</label>
                <input
                  type="text"
                  value={bookingRefNo}
                  onChange={e => setBookingRefNo(e.target.value)}
                  placeholder="e.g. BK-2026-9482"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm font-mono"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConvertingQuery(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-600/30"
                >
                  Confirm & Activate Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject / Lost Reason Modal */}
      {rejectingQuery && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold text-rose-400 flex items-center gap-2 mb-2">
              <XCircle className="w-6 h-6" /> Record Query Loss Reason
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Query: <strong className="text-slate-200">{rejectingQuery.id}</strong> ({rejectingQuery.company_name})
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Reason for Rejection / Loss</label>
                <select
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm"
                  required
                >
                  <option value="Price">Price (Too High)</option>
                  <option value="Competitor Rate">Competitor Rate (Lower Local Supplier)</option>
                  <option value="Customer Cancelled">Customer Cancelled Plan</option>
                  <option value="Agent Did Not Respond">Agent Did Not Respond</option>
                  <option value="Customer Did Not Confirm">Customer Did Not Confirm</option>
                  <option value="Travel Cancelled">Travel Plan Cancelled</option>
                  <option value="Product Not Available">Product / Flight Seat Not Available</option>
                  <option value="Agent Shifted Business">Agent Shifted Business</option>
                  <option value="Other">Other Reason</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Detailed Remarks</label>
                <textarea
                  rows="3"
                  value={rejectRemarks}
                  onChange={e => setRejectRemarks(e.target.value)}
                  placeholder="Explain why Travelx lost this business..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 p-2.5 rounded-xl text-sm"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingQuery(null)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-rose-600/30"
                >
                  Save Rejection Reason
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
