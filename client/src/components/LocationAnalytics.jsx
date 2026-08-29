import React, { useState, useEffect } from 'react';
import { MapPin, Users, Award, TrendingUp, BarChart2, CheckCircle2, DollarSign, Target, HelpCircle, FileText, Download } from 'lucide-react';
import { exportToPDF } from '../utils/exportUtils';

export default function LocationAnalytics() {
  const [locations, setLocations] = useState([]);
  const [mktExecs, setMktExecs] = useState([]);
  const [teleExecs, setTeleExecs] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-yellow-500" /> Location-wise Marketing & Conversion Matrix
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase">
              <tr>
                <th className="p-3.5">Territory / Location</th>
                <th className="p-3.5 text-center">Total Agents</th>
                <th className="p-3.5 text-center">Visits Logged</th>
                <th className="p-3.5 text-center">Query-Giving Agents</th>
                <th className="p-3.5 text-center">Active Agents</th>
                <th className="p-3.5 text-center">Conversion %</th>
                <th className="p-3.5 text-right">Total Revenue (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {locations.map((loc, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="p-3.5 font-bold text-slate-100 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sky-400" /> {loc.location}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Marketing Visit → Query Conversion Analysis (User Requested Core Report!) */}
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

    </div>
  );
}
