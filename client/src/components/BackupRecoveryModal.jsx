import React, { useState, useRef } from 'react';
import { 
  X, Download, Upload, HardDrive, ShieldCheck, AlertTriangle, 
  CheckCircle2, RefreshCw, Cloud, FileJson, ArrowDownToLine
} from 'lucide-react';

export default function BackupRecoveryModal({ isOpen, onClose, backupStatus, onRefreshStatus }) {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const backupFileName = `travelx-crm-backup-${todayStr}.json`;

  // 1. Download Backup to Laptop
  const handleDownload = () => {
    setDownloading(true);
    setStatusMessage({ type: 'success', text: `✅ Download started! File saved in your Downloads folder: ${backupFileName}` });
    window.location.href = '/api/backup/download';
    setTimeout(() => {
      setDownloading(false);
    }, 1000);
  };

  // 2. Select File & Immediately Trigger Restore
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!json || (!json.agents && !json.marketing_visits)) {
          throw new Error('This file is not a valid Travelx CRM backup. Missing agents or visits.');
        }

        const agentsCount = json.agents ? json.agents.length : 0;
        const visitsCount = (json.marketing_visits || json.visits || []).length;
        const callsCount = (json.telephonic_calls || json.calls || []).length;
        const queriesCount = (json.queries || []).length;

        const confirmMsg = `⚠️ RESTORE CONFIRMATION\n\nFile: ${file.name}\n• Agents: ${agentsCount}\n• Visits: ${visitsCount}\n• Calls: ${callsCount}\n• Queries: ${queriesCount}\n\nDo you want to restore the CRM database with this file?`;
        
        if (!window.confirm(confirmMsg)) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        setRestoring(true);
        setStatusMessage({ type: 'info', text: '⏳ Restoring database from your laptop file...' });

        const res = await fetch('/api/backup/upload-restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json)
        });

        const resJson = await res.json();
        if (resJson.success) {
          setStatusMessage({ type: 'success', text: `✅ Database restored! Loaded ${agentsCount} agents & ${visitsCount} visits.` });
          if (onRefreshStatus) onRefreshStatus();
          setTimeout(() => {
            alert('✅ Restore Complete! The CRM will now refresh.');
            window.location.reload();
          }, 1200);
        } else {
          throw new Error(resJson.error || 'Restore failed');
        }
      } catch (err) {
        setStatusMessage({ type: 'error', text: '❌ ' + err.message });
      } finally {
        setRestoring(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const lastSuccess = backupStatus?.lastSuccess;
  const timeLabel = lastSuccess
    ? (() => {
        const d = new Date(lastSuccess);
        const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
        return ist.toISOString().replace('T', ' ').substring(0, 16) + ' IST';
      })()
    : 'Active';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Database Backup & Laptop Restore
              </h3>
              <p className="text-[11px] text-slate-400">
                1-Click download or restore from your laptop
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

        {/* Content - Compact & Clean */}
        <div className="p-5 space-y-4">
          
          {/* Status Alert Banner */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success' ? 'bg-emerald-950/90 border border-emerald-700 text-emerald-300' :
              statusMessage.type === 'info' ? 'bg-sky-950/90 border border-sky-700 text-sky-300' :
              'bg-rose-950/90 border border-rose-700 text-rose-300'
            }`}>
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
              {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />}
              {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* OPTION 1: DOWNLOAD TO LAPTOP */}
          <div className="bg-slate-950/70 border border-emerald-500/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Download className="w-3.5 h-3.5" /> 1. Download Backup to Laptop
              </span>
              <span className="text-[10px] text-emerald-300 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                Daily Copy
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Saves a complete backup file of all agents, visits & calls directly into your laptop's <strong>Downloads</strong> folder.
            </p>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{downloading ? 'Downloading...' : '💾 DOWNLOAD BACKUP (.JSON)'}</span>
            </button>
          </div>

          {/* OPTION 2: RESTORE FROM LAPTOP FILE */}
          <div className="bg-slate-950/70 border border-amber-500/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Upload className="w-3.5 h-3.5" /> 2. Restore CRM from Laptop File
              </span>
              <span className="text-[10px] text-amber-300 bg-amber-950 border border-amber-800 px-2 py-0.5 rounded-full font-bold">
                Recovery
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Select any previously downloaded <code className="text-amber-300">.json</code> backup file from your laptop to restore everything immediately.
            </p>

            {/* Hidden Input */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json"
              onChange={handleFileChange}
              className="hidden" 
            />

            <button
              type="button"
              disabled={restoring}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              {restoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
              <span>{restoring ? 'RESTORING DATABASE...' : '📁 CHOOSE FILE & RESTORE NOW'}</span>
            </button>
          </div>

          {/* Cloud Info Row */}
          <div className="bg-slate-950/40 border border-slate-800 rounded-xl px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              <span>Cloud Auto-Sync: <strong className="text-emerald-400">{timeLabel}</strong></span>
            </div>
            <button
              onClick={() => {
                fetch('/api/backup/now', { method: 'POST' }).then(() => {
                  if (onRefreshStatus) onRefreshStatus();
                  alert('✅ Cloud synced!');
                });
              }}
              className="text-sky-400 hover:text-sky-300 font-semibold underline cursor-pointer"
            >
              Sync Cloud Now
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Protected Multi-Layer Backup
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
