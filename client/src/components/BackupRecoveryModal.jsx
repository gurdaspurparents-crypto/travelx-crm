import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Download, Upload, HardDrive, ShieldCheck, AlertTriangle, 
  CheckCircle2, RefreshCw, Cloud, Database, Clock, FileJson, ArrowDownToLine, Check
} from 'lucide-react';

export default function BackupRecoveryModal({ isOpen, onClose, backupStatus, onRefreshStatus }) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState(null);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const fileInputRef = useRef(null);
  const restoreSectionRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setDownloadSuccess(false);
      setSelectedFile(null);
      setParsedData(null);
      setParseError('');
      setRestoreResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const backupFileName = `travelx-crm-backup-${todayStr}.json`;

  // 1. Direct Browser Download
  const handleDownload = () => {
    setDownloadSuccess(true);
    window.location.href = '/api/backup/download';
    setTimeout(() => {
      alert(`✅ Download started!\n\nFile aapke laptop ke "Downloads" folder mein save ho gayi hai:\n📁 ${backupFileName}`);
    }, 600);
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
          throw new Error('File is not a valid Travelx CRM backup. Missing agents or visits data.');
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm p-3 sm:p-6 flex justify-center items-start animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-4 sm:my-8 flex flex-col">
        
        {/* Header - Always visible at top */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Database Backup & Laptop Restore
              </h3>
              <p className="text-xs text-slate-400">
                1-Click download to laptop & restore from file
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6">
          
          {/* SECTION 1: DOWNLOAD BACKUP TO LAPTOP */}
          <div className="bg-slate-950/70 border-2 border-emerald-500/40 rounded-xl p-4 sm:p-5 relative">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-emerald-400 font-black text-sm uppercase tracking-wide">
                <ArrowDownToLine className="w-4 h-4" /> 
                Step 1: Download Backup to Laptop
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                Daily Save
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Click the green button below to save all <strong className="text-white">560+ Agents, Visits, Calls & Queries</strong> as a <code className="text-emerald-300 font-mono">.json</code> file to your laptop’s <strong>Downloads</strong> folder.
            </p>

            <button
              onClick={handleDownload}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>DOWNLOAD BACKUP TO LAPTOP (.JSON)</span>
            </button>

            {downloadSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-950/90 border border-emerald-700 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Download started!</strong> File saved in your Downloads folder: <code>{backupFileName}</code>
                </span>
              </div>
            )}
          </div>

          {/* SECTION 2: RESTORE FROM LAPTOP FILE */}
          <div ref={restoreSectionRef} className="bg-slate-950/70 border-2 border-amber-500/40 rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase tracking-wide">
                <Upload className="w-4 h-4" /> 
                Step 2: Restore CRM from Laptop Backup File
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                Disaster Recovery
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-3">
              Agar online data kabhi gayab ho jaye, to apne laptop se backup file (<code className="text-amber-300 font-mono">.json</code>) select karke yahan se <strong>1-click mein pura CRM restore</strong> karein:
            </p>

            {/* Hidden Input & Choose File Button */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json"
              onChange={handleFileChange}
              className="hidden" 
            />

            {!selectedFile ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-amber-500/40 hover:border-amber-400 bg-amber-500/5 hover:bg-amber-500/10 p-5 rounded-xl text-center transition cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <FileJson className="w-8 h-8 text-amber-400" />
                <span className="text-xs font-bold text-amber-300">
                  📁 Click Here to Choose Backup File from your Laptop (.json)
                </span>
                <span className="text-[11px] text-slate-400">
                  Select <code className="text-amber-200">{backupFileName}</code> from your Downloads folder
                </span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-300 flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-amber-400" />
                    <strong>Selected:</strong> {selectedFile.name}
                  </span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-amber-400 hover:text-amber-300 text-[11px] underline cursor-pointer"
                  >
                    Change File
                  </button>
                </div>

                {/* File Preview Card */}
                {parsedData && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 space-y-3">
                    <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                      <span className="text-slate-400">File Verification:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> File Valid & Ready
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

                    <div className="pt-2">
                      {/* THIS IS THE RESTORE BUTTON */}
                      <button
                        onClick={handleRestoreFromLaptop}
                        disabled={restoring}
                        className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
                      >
                        {restoring ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                        )}
                        <span>{restoring ? 'RESTORING DATABASE...' : '⚡ RESTORE CRM FROM THIS FILE NOW'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {parseError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {restoreResult && (
              <div className={`mt-3 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                restoreResult.success 
                  ? 'bg-emerald-950/90 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/90 border-rose-800 text-rose-300'
              }`}>
                {restoreResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{restoreResult.message}</span>
              </div>
            )}
          </div>

          {/* SECTION 3: CLOUD STATUS */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2.5">
              <Cloud className="w-4 h-4 text-sky-400" />
              <span className="text-slate-300">
                Cloud Auto-Backup: <span className="text-emerald-400 font-bold">{timeLabel}</span>
              </span>
            </div>
            <button
              onClick={handleCloudSync}
              disabled={syncingCloud}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-600/30 rounded-lg font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {syncingCloud ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              <span>Sync Cloud Now</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Multi-Layer Protected
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
