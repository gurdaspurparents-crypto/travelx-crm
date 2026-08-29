import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';

export default function ImportExcelModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clearFirst, setClearFirst] = useState(false);
  const [resultMessage, setResultMessage] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/api/agents/sample-template', '_blank');
  };

  const handleClearData = async () => {
    if (!window.confirm('⚠️ Are you sure you want to clear all existing demo agents? This will reset the database so you can upload your clean Excel file.')) {
      return;
    }
    try {
      const res = await fetch('/api/agents/clear', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        alert('All database records cleared! You can now upload your Excel sheet.');
        onSuccess && onSuccess();
      }
    } catch (err) {
      alert('Failed to clear database');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please select an Excel (.xlsx/.xls) or CSV file first');

    setLoading(true);
    setResultMessage(null);

    try {
      if (clearFirst) {
        await fetch('/api/agents/clear', { method: 'POST' });
      }

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/agents/import', {
        method: 'POST',
        body: formData
      });

      const json = await res.json();
      if (json.success) {
        setResultMessage(`🎉 ${json.message}`);
        onSuccess && onSuccess();
      } else {
        alert(`Error: ${json.error}`);
      }
    } catch (err) {
      alert('Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
          <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" /> Import 700+ Agents from Excel / CSV
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons: Template & Clear */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" /> Download Excel Template
          </button>
          
          <button
            type="button"
            onClick={handleClearData}
            className="p-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <Trash2 className="w-4 h-4 text-rose-400" /> Clear Demo Sample Data
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleUpload} className="space-y-4">

          {/* File Drag Box */}
          <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-6 text-center bg-slate-950/50 transition">
            <Upload className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-200">
              {file ? file.name : 'Select or drag your Excel file (.xlsx, .xls, .csv)'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Accepts sheets with Agent Name, Firm Name, Mobile, City, Area</p>
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="mt-3 text-xs text-slate-400 cursor-pointer block mx-auto"
            />
          </div>

          {/* Clear toggle option */}
          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={clearFirst}
              onChange={e => setClearFirst(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
            />
            Wipe existing demo data before importing this file
          </label>

          {/* Result Alert */}
          {resultMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> {resultMessage}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !file}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
          >
            {loading ? 'Importing Agents...' : 'Upload & Import Agents into Database'}
          </button>
        </form>

      </div>
    </div>
  );
}
