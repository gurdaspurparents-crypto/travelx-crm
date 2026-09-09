import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Flame, Users, MapPin, Phone, PhoneCall, FileText, BarChart3, Sparkles, Bell, Shield, X, AlertTriangle, Clock } from 'lucide-react';
import FollowupAlertModal from './FollowupAlertModal';
import BackupRecoveryModal from './BackupRecoveryModal';

export default function Header({ activeTab, onSelectTab, role, onRoleChange, onOpenAgentDrawer, onOpenModal }) {
  const [notifications, setNotifications] = useState({ unread_count: 0, alerts: [] });
  const [followupData, setFollowupData] = useState(null);
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupStatus, setBackupStatus] = useState(null);

  useEffect(() => {
    fetchNotifications();
    fetchFollowups();
    fetchBackupStatus();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchFollowups();
      fetchBackupStatus();
    }, 60000); // refresh every 60 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchBackupStatus = async () => {
    try {
      const res = await fetch('/api/backup/status');
      const json = await res.json();
      if (json.success) setBackupStatus(json.status);
    } catch (err) {
      console.error(err);
    }
  };


  const fetchFollowups = async () => {
    try {
      const res = await fetch('/api/followups/due');
      const json = await res.json();
      if (json.success) {
        setFollowupData(json);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      if (json.success) {
        setNotifications(json);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleSelect = (newRole) => {
    if (newRole === 'Admin / Owner' && role !== 'Admin / Owner') {
      const pin = window.prompt('🔒 Enter Admin Security PIN to access Owner Mode:', '');
      if (pin !== '1234') {
        alert('❌ Incorrect Admin Security PIN! Access denied.');
        return;
      }
    }
    onRoleChange(newRole);
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'yug_desk', label: "Yug's Calling Desk", icon: PhoneCall, badge: 'YUG CALLING' },
    { id: 'focus', label: 'Focus Lists', icon: Flame, badge: 'Priority' },
    { id: 'agents', label: 'Agent Master', icon: Users },
    { id: 'visits', label: 'Marketing Visits', icon: MapPin },
    { id: 'calls', label: 'Follow-ups', icon: Phone },
    { id: 'queries', label: 'Queries & Sales', icon: FileText },
    { id: 'analytics', label: 'Territory & Reports', icon: BarChart3 },
    { id: 'ai', label: 'AI Assistant', icon: Sparkles, badge: 'AI' }
  ];

  const visibleTabs = tabs.filter(tab => {
    if (role === 'Marketing Executive') {
      return tab.id === 'visits' || tab.id === 'agents' || tab.id === 'yug_desk';
    }
    if (role === 'Telephonic Executive') {
      return tab.id === 'agents' || tab.id === 'visits' || tab.id === 'calls' || tab.id === 'queries' || tab.id === 'analytics' || tab.id === 'yug_desk';
    }
    if (role === 'Yug (Calling Executive)') {
      return tab.id === 'yug_desk' || tab.id === 'agents' || tab.id === 'calls' || tab.id === 'queries';
    }
    return true;
  });

  return (
    <header className="sticky top-0 z-40 bg-[#070b14]/85 backdrop-blur-xl border-b border-white/[0.08] shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between h-16 border-b border-white/[0.06]">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 via-[#0d1527] to-slate-900 border border-white/[0.15] flex items-center justify-center text-white font-black text-base shadow-md">
                <span className="bg-gradient-to-r from-sky-400 via-indigo-200 to-white bg-clip-text text-transparent">Tx</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-base font-extrabold text-white tracking-tight leading-none">
                  TRAVEL<span className="text-sky-400">X</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-0.5">
                  Enterprise B2B CRM
                </span>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 ml-2 text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/[0.08]">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                {role === 'Admin / Owner' ? 'Executive Portal' : role === 'Marketing Executive' ? 'Field Marketing' : role === 'Yug (Calling Executive)' ? "Yug's Calling Desk" : 'Telephonic App'}
              </span>
            </div>
          </div>

          {/* Right Controls: Backup Badge, Due Followups, Role Switcher & Notifications */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* ✅ BACKUP STATUS BADGE — always visible */}
            {(() => {
              if (!backupStatus) return null;
              const lastSuccess = backupStatus.lastSuccess;
              const minutesAgo = lastSuccess
                ? Math.floor((Date.now() - new Date(lastSuccess).getTime()) / 60000)
                : null;
              const isStale = minutesAgo === null || minutesAgo > 60;
              const timeLabel = lastSuccess
                ? (() => {
                    const d = new Date(lastSuccess);
                    // Convert UTC to IST (+5:30)
                    const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
                    return ist.toISOString().replace('T', ' ').substring(0, 16) + ' IST';
                  })()
                : 'Never';
              return (
                <button
                  onClick={() => setShowBackupModal(true)}
                  title={`Backup Status: ${timeLabel}. Click to download backup to laptop or restore.`}
                  className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] font-mono font-medium border transition-all cursor-pointer ${
                    isStale
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20 shadow-sm shadow-rose-950'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/30'
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isStale ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isStale ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                  </span>
                  <span className="hidden md:inline">
                    {isStale
                      ? `Backup: Stale (${timeLabel})`
                      : `Cloud Sync: ${timeLabel}`}
                  </span>
                  <span className="md:hidden">
                    {isStale ? 'Sync !' : 'Cloud OK'}
                  </span>
                </button>
              );
            })()}

            {/* Today's Due Follow-ups Alert Badge */}
            {followupData && followupData.total_due > 0 && (
              <button
                onClick={() => setShowFollowupModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-rose-500/20 via-amber-500/20 to-rose-500/20 hover:from-rose-500/30 hover:to-amber-500/30 text-amber-200 border border-amber-500/30 hover:border-amber-400/50 shadow-sm transition-all cursor-pointer"
                title="Click to view today's due follow-ups"
              >
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="font-mono font-bold text-amber-300">{followupData.total_due}</span>
                <span className="hidden sm:inline text-amber-200/90">Due</span>
              </button>
            )}

            {/* Role Switcher */}
            <div className="flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition-all">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-400 hidden lg:inline font-medium">Role:</span>
              <select
                value={role}
                onChange={e => handleRoleSelect(e.target.value)}
                className="bg-transparent font-semibold text-slate-200 focus:outline-none cursor-pointer text-xs"
              >
                <option value="Admin / Owner" className="bg-[#0b1120] text-slate-200">👑 Admin / Owner</option>
                <option value="Yug (Calling Executive)" className="bg-[#0b1120] text-slate-200">📱 Yug Calling Desk</option>
                <option value="Telephonic Executive" className="bg-[#0b1120] text-slate-200">📞 Telephonic Desk (Simran)</option>
                <option value="Marketing Executive" className="bg-[#0b1120] text-slate-200">🚗 Field Marketing (Bikram)</option>
              </select>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setShowFollowupModal(true)}
              className="relative p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Today's Follow-ups & Alerts"
            >
              <Bell className="w-4 h-4" />
              {followupData && followupData.total_due > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono font-bold text-[9px] flex items-center justify-center shadow-sm">
                  {followupData.total_due}
                </span>
              )}
            </button>

          </div>

        </div>

        {/* Navigation Tabs (Linear Segmented Pills) */}
        <nav className="flex items-center space-x-1.5 overflow-x-auto py-2.5 scrollbar-none">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-2 relative cursor-pointer ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 border border-sky-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded ${
                    tab.badge === 'AI' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                    tab.badge === 'YUG CALLING' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black' :
                    'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

      </div>

      {/* Today's Due Follow-ups Alert Modal */}
      <FollowupAlertModal
        isOpen={showFollowupModal}
        onClose={() => setShowFollowupModal(false)}
        followupData={followupData}
        onOpenModal={onOpenModal}
        onOpenAgentDrawer={onOpenAgentDrawer}
      />

      {/* Backup & Laptop Recovery Center Modal */}
      <BackupRecoveryModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        backupStatus={backupStatus}
        onRefreshStatus={fetchBackupStatus}
      />

    </header>
  );
}
