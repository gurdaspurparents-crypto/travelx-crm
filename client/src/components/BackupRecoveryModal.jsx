import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Download, Upload, HardDrive, ShieldCheck, AlertTriangle, 
  CheckCircle2, RefreshCw, Cloud, Database, Clock, FileJson, ArrowDownToLine, Check
} from 'lucide-react';

export default function BackupRecoveryModal({ isOpen, onClose, backupStatus, onRefreshStatus }) {
  const [activeTab, setActiveTab] = useState('download'); // 'download' | 'restore' | 'cloud'
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [parseError, setParseError] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState(null);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('download');
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
    // Direct browser navigation triggers native file download to laptop Downloads folder
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Database Backup & Laptop Recovery
              </h3>
              <p className="text-xs text-slate-400">
                Tareeqa 2: Download daily backup to laptop & restore anytime
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('download')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'download'
                ? 'bg-slate-900 text-emerald-400 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>1. Download to Laptop</span>
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'restore'
                ? 'bg-slate-900 text-amber-400 border-amber-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>2. Restore from Laptop</span>
          </button>
          <button
            onClick={() => setActiveTab('cloud')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'cloud'
                ? 'bg-slate-900 text-sky-400 border-sky-500'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>3. Cloud Status</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* TAB 1: 1-CLICK LAPTOP DOWNLOAD */}
          {activeTab === 'download' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-950/70 border border-emerald-500/40 rounded-xl p-6 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ArrowDownToLine className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Save Backup on this Laptop</h4>
                    <p className="text-xs text-slate-400">Save a complete offline snapshot to your Downloads folder</p>
                  </div>
                </div>

                <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 my-4 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <Check className="w-4 h-4" /> Includes all 560+ Agents, Visits, Calls & Queries
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <Check className="w-4 h-4" /> Formatted in standard Travelx JSON format
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <Check className="w-4 h-4" /> Direct download to your laptop’s <span className="text-white underline">Downloads</span> folder
                  </div>
                </div>

                {/* Big Action Button */}
                <div className="pt-2">
                  <button
                    onClick={handleDownload}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2.5 transition cursor-pointer"
                  >
                    <Download className="w-5 h-5" />
                    <span>DOWNLOAD BACKUP TO LAPTOP (.JSON)</span>
                  </button>
                </div>

                <div className="text-center text-xs text-slate-400 mt-3 font-mono">
                  File name: <span className="text-emerald-300">{backupFileName}</span>
                </div>

                {downloadSuccess && (
                  <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-700 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Download started!</strong> Check your laptop’s <strong>Downloads</strong> folder for <code>{backupFileName}</code>.
                    </span>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-400 p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
                💡 <strong>Tip:</strong> Har shaam ko yeh green button daba kar ek file apne laptop mein download kar liya karein. Agar online CRM mein koi glitch ya data wipe hota hai, to aap Tab 2 ("Restore from Laptop") mein jakar is file se 5 second mein pura data wapas laa sakte hain.
              </div>
            </div>
          )}

          {/* TAB 2: RESTORE FROM LAPTOP FILE */}
          {activeTab === 'restore' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-950/70 border border-amber-500/30 rounded-xl p-5">
                <div className="space-y-1 mb-4">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <Upload className="w-4 h-4" /> 
                    Restore CRM from a Laptop File
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Select any previously downloaded <code className="text-amber-300 font-mono">.json</code> backup file from your laptop to restore the database.
                  </p>
                </div>

                {/* File Selector */}
                <div>
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
                    className="w-full border-2 border-dashed border-slate-700 hover:border-amber-500/60 bg-slate-900/50 hover:bg-slate-900 p-5 rounded-xl text-center transition cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <FileJson className="w-8 h-8 text-amber-400" />
                    <div className="text-xs text-slate-300 font-semibold">
                      {selectedFile ? (
                        <span className="text-amber-300 font-bold">Selected: {selectedFile.name}</span>
                      ) : (
                        <span>Click to choose backup file from your laptop (<span className="text-amber-300 font-mono">.json</span>)</span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">Pick from your Downloads or Documents folder</span>
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
                        className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-600/30 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
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

                {/* Restore Result */}
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
            </div>
          )}

          {/* TAB 3: CLOUD GITHUB STATUS */}
          {activeTab === 'cloud' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="bg-slate-950/70 border border-sky-500/30 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">GitHub Cloud Auto-Backup</h4>
                      <p className="text-xs text-slate-400">Automatically syncs database changes to private GitHub repo</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded-full text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Active
                  </span>
                </div>

                <div className="text-xs text-slate-300 space-y-1.5">
                  <div>Last Cloud Sync: <strong className="text-emerald-400">{timeLabel}</strong></div>
                  <div className="text-slate-400">Auto-Backup Frequency: Every 30 minutes + on every new entry</div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleCloudSync}
                    disabled={syncingCloud}
                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    {syncingCloud ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>{syncingCloud ? 'Syncing to Cloud...' : '⚡ Sync to Cloud (GitHub) Now'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

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
