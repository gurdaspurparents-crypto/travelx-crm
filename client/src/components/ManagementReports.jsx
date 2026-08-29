import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Printer, Download, Calendar, Filter, PieChart, BarChart } from 'lucide-react';

export default function ManagementReports() {
  const [reportType, setReportType] = useState('weekly');
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('2026-08');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, [reportType, selectedMonth]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      if (reportType === 'weekly') {
        const res = await fetch('/api/reports/weekly');
        const json = await res.json();
        if (json.success) setWeeklyData(json.weekly);
      } else {
        const res = await fetch(`/api/reports/monthly?month=${selectedMonth}`);
        const json = await res.json();
        if (json.success) setMonthlyData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    alert('📥 Exporting Management Report to CSV file...');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" /> Weekly & Monthly Management Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Structured executive summaries and loss reason analytics
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs transition border border-slate-700 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-xl text-xs transition shadow flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>
      </div>

      {/* Report Switcher & Month Selector */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap justify-between items-center gap-4">
        <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setReportType('weekly')}
            className={`px-4 py-2 rounded-lg transition ${reportType === 'weekly' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Weekly Executive Summary
          </button>
          <button
            onClick={() => setReportType('monthly')}
            className={`px-4 py-2 rounded-lg transition ${reportType === 'monthly' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Monthly Management Report
          </button>
        </div>

        {reportType === 'monthly' && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Select Month:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 px-3 py-1.5 rounded-lg text-xs"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : reportType === 'weekly' ? (
        
        /* WEEKLY REPORT VIEW */
        <div className="space-y-6">

          {/* Core Weekly Activation Matrix (Most Important Report in Section 9) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-400" /> Executive Weekly Agent Activation Summary
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase">
                  <tr>
                    <th className="p-3.5">Agent Category</th>
                    <th className="p-3.5 text-center">Number of Agents</th>
                    <th className="p-3.5">Executive Status / Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {weeklyData?.activation_table?.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-semibold text-slate-200">{row.category}</td>
                      <td className="p-3.5 text-center font-bold text-emerald-400 text-base">{row.count}</td>
                      <td className="p-3.5 text-xs text-slate-400">
                        {row.category.includes('Booking') ? '🟢 Target Converted Accounts' :
                         row.category.includes('Query but No') ? '🟠 High Potential Drop-off' :
                         row.category.includes('Visited but No') ? '🟡 Follow-up Required' : 'Tracked by Management'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product-wise Query Distribution */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Product-wise Query & Conversion Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {weeklyData?.product_breakdown?.map((prod, idx) => (
                <div key={idx} className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-sky-400">{prod.product}</span>
                  <div className="text-2xl font-black text-slate-100">{prod.count} Queries</div>
                  <div className="flex justify-between text-xs text-slate-400 pt-1">
                    <span>Converted: <strong className="text-emerald-400">{prod.converted}</strong></span>
                    <span>Revenue: <strong className="text-slate-200">₹{(prod.revenue || 0).toLocaleString('en-IN')}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      ) : (

        /* MONTHLY REPORT VIEW */
        <div className="space-y-6">

          {/* Executive Performance Table (Section 10) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-100 mb-4">
              Monthly Executive Performance Comparison ({selectedMonth})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase">
                  <tr>
                    <th className="p-3.5">Executive</th>
                    <th className="p-3.5 text-center">Agents Visited</th>
                    <th className="p-3.5 text-center">Follow-ups</th>
                    <th className="p-3.5 text-center">Query Agents</th>
                    <th className="p-3.5 text-center">Active Agents</th>
                    <th className="p-3.5 text-center">Total Queries</th>
                    <th className="p-3.5 text-center">Converted</th>
                    <th className="p-3.5 text-center">Lost</th>
                    <th className="p-3.5 text-right">Total Revenue (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {monthlyData?.executives?.map((exec, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40">
                      <td className="p-3.5 font-bold text-slate-100">{exec.executive}</td>
                      <td className="p-3.5 text-center font-semibold text-yellow-400">{exec.agents_visited}</td>
                      <td className="p-3.5 text-center text-blue-400">{exec.followups_done}</td>
                      <td className="p-3.5 text-center font-semibold text-amber-400">{exec.query_giving_agents}</td>
                      <td className="p-3.5 text-center font-bold text-emerald-400">{exec.active_agents}</td>
                      <td className="p-3.5 text-center text-slate-200">{exec.total_queries}</td>
                      <td className="p-3.5 text-center font-bold text-emerald-400">{exec.converted}</td>
                      <td className="p-3.5 text-center font-bold text-rose-400">{exec.lost}</td>
                      <td className="p-3.5 text-right font-bold text-emerald-400">
                        ₹{(exec.total_sales || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lost Reason Analytics */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-rose-400 mb-4">
              Lost Business Reason Analysis (Why Travelx is losing business)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthlyData?.lost_reasons?.map((reason, idx) => (
                <div key={idx} className="bg-slate-800/60 border border-rose-900/40 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-slate-200 text-sm">{reason.reason}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Rejected Query Count</p>
                  </div>
                  <span className="text-2xl font-black text-rose-400">{reason.count}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      )}

    </div>
  );
}
