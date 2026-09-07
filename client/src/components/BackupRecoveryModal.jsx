import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Download, Upload, HardDrive, ShieldCheck, AlertTriangle, 
  CheckCircle2, RefreshCw, Cloud, Database, Clock, FileJson, ArrowDownToLine
} from 'lucide-react';

export default function BackupRecoveryModal({ isOpen, onClose, backupStatus, onRefreshStatus }) {
  const [downloading, setDownloading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState(null);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setParsedData(null);
      setParseError('');
      setRestoreResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1. Download Backup to Laptop
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/backup/download');
      if (!res.ok) throw new Error('Download request failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `travelx-crm-backup-${todayStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('❌ Failed to download backup: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  // 2. Select & Parse Laptop File
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setParseError('');
    setParsedData(null);
    setRestoreResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!json || (!json.agents && !json.marketing_visits)) {
          throw new Error('File does not appear to be a valid Travelx CRM backup. Missing agents or visits data.');
        }
        setParsedData({
          agentsCount: json.agents ? json.agents.length : 0,
          visitsCount: (json.marketing_visits || json.visits || []).length,
          callsCount: (json.telephonic_calls || json.calls || []).length,
          queriesCount: (json.queries || []).length,
          backupDate: json.backed_up_at || 'Unknown Date',
          rawData: json
        });
      } catch (err) {
        setParseError('❌ Invalid File: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  // 3. Restore to CRM from Laptop File
  const handleRestoreFromLaptop = async () => {
    if (!parsedData || !parsedData.rawData) return;
    const confirmMsg = `⚠️ ARE YOU SURE?\n\nYou are about to restore:\n• ${parsedData.agentsCount} Agents\n• ${parsedData.visitsCount} Visits\n• ${parsedData.callsCount} Calls\n• ${parsedData.queriesCount} Queries\n\nThis will update all CRM records with this file's data.`;
    if (!window.confirm(confirmMsg)) return;

    setRestoring(true);
    setRestoreResult(null);

    try {
      const res = await fetch('/api/backup/upload-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData.rawData)
      });
      const json = await res.json();
      if (json.success) {
        setRestoreResult({
          success: true,
          message: json.message || 'Database successfully restored!'
        });
        if (onRefreshStatus) onRefreshStatus();
        setTimeout(() => {
          alert('✅ Database restored successfully! The page will now reload.');
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(json.error || 'Restore failed');
      }
    } catch (err) {
      setRestoreResult({
        success: false,
        message: '❌ Restore Error: ' + err.message
      });
    } finally {
      setRestoring(false);
    }
  };

  // 4. Manual Cloud Sync
  const handleCloudSync = async () => {
    setSyncingCloud(true);
    try {
      const res = await fetch('/api/backup/now', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        if (onRefreshStatus) onRefreshStatus();
        alert('✅ Cloud Backup Completed successfully to GitHub!');
      } else {
        alert('❌ Cloud sync error: ' + (json.error || 'Failed'));
      }
    } catch (e) {
      alert('❌ Error: ' + e.message);
    } finally {
      setSyncingCloud(false);
    }
  };

  const lastSuccess = backupStatus?.lastSuccess;
  const timeLabel = lastSuccess
    ? (() => {
        const d = new Date(lastSuccess);
        const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
        return ist.toISOString().replace('T', ' ').substring(0, 16) + ' IST';
      })()
    : 'No recent backup';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Database Backup & Laptop Recovery
              </h3>
              <p className="text-xs text-slate-400">
                1-Click download to your laptop & disaster recovery
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Card 1: 1-Click Laptop Download */}
          <div className="bg-slate-950/70 border border-emerald-500/30 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <ArrowDownToLine className="w-4 h-4" /> 
                  Tareeqa 2: Download Full Backup to Laptop
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Click the button below to download the entire database (all 550+ Agents, Visits, Calls, and Queries) as a <code className="text-emerald-300 font-mono">.json</code> file to your laptop's <strong className="text-white">Downloads</strong> folder.
                </p>
                <div className="text-[11px] text-slate-400 pt-1 flex items-center gap-1">
                  💡 <span>Recommended: Download once daily at end of day for complete peace of mind.</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between flex-wrap gap-3">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {downloading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{downloading ? 'Preparing Download...' : '💾 Download Backup to Laptop (.json)'}</span>
              </button>

              <span className="text-[11px] text-slate-400">
                File: <span className="text-slate-200 font-mono">travelx-crm-backup-{new Date().toISOString().split('T')[0]}.json</span>
              </span>
            </div>
          </div>

          {/* Card 2: Restore from Laptop File */}
          <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Upload className="w-4 h-4" /> 
                Restore Database from Laptop Backup File
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                If online data is ever lost or missing, select any previously downloaded backup file from your laptop to restore everything immediately.
              </p>
            </div>

            {/* File Selector */}
            <div className="mt-4">
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".json"
                onChange={handleFileChange}
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-900/50 hover:bg-slate-900 p-4 rounded-xl text-center transition cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <FileJson className="w-7 h-7 text-amber-400" />
                <div className="text-xs text-slate-300 font-semibold">
                  {selectedFile ? (
                    <span className="text-amber-300 font-bold">Selected: {selectedFile.name}</span>
                  ) : (
                    <span>Click to choose backup file from your laptop (<span className="text-amber-300 font-mono">.json</span>)</span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500">Only official Travelx CRM JSON backup files</span>
              </button>
            </div>

            {/* Error Message */}
            {parseError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {/* File Preview & Confirmation */}
            {parsedData && (
              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-amber-500/40 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="text-slate-400">File Verification:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Valid Backup File
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Agents</span>
                    <span className="text-sm font-black text-sky-400">{parsedData.agentsCount}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Visits</span>
                    <span className="text-sm font-black text-emerald-400">{parsedData.visitsCount}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Calls</span>
                    <span className="text-sm font-black text-amber-400">{parsedData.callsCount}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Queries</span>
                    <span className="text-sm font-black text-purple-400">{parsedData.queriesCount}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] text-slate-400">
                    Date in File: <span className="text-slate-200">{parsedData.backupDate}</span>
                  </span>
                  <button
                    onClick={handleRestoreFromLaptop}
                    disabled={restoring}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-600/30 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    {restoring ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>{restoring ? 'Restoring Database...' : '⚡ Restore CRM from this File'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Restore Success Banner */}
            {restoreResult && (
              <div className={`mt-3 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                restoreResult.success 
                  ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/80 border-rose-800 text-rose-300'
              }`}>
                {restoreResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{restoreResult.message}</span>
              </div>
            )}
          </div>

          {/* Section 3: Cloud GitHub Status */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">Cloud Auto-Backup (GitHub)</span>
                <span className="text-[11px] text-slate-400">
                  Last Cloud Sync: <span className="text-emerald-400 font-semibold">{timeLabel}</span>
                </span>
              </div>
            </div>

            <button
              onClick={handleCloudSync}
              disabled={syncingCloud}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-600/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {syncingCloud ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{syncingCloud ? 'Syncing...' : 'Sync Cloud Now'}</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Protected with Multi-Layer Storage
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
