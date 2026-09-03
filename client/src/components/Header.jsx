import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Flame, Users, MapPin, Phone, PhoneCall, FileText, BarChart3, Sparkles, Bell, Shield, X, AlertTriangle, Clock } from 'lucide-react';
import FollowupAlertModal from './FollowupAlertModal';

export default function Header({ activeTab, onSelectTab, role, onRoleChange, onOpenAgentDrawer, onOpenModal }) {
  const [notifications, setNotifications] = useState({ unread_count: 0, alerts: [] });
  const [followupData, setFollowupData] = useState(null);
  const [showFollowupModal, setShowFollowupModal] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchFollowups();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchFollowups();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

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
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Top Navbar Row */}
        <div className="flex items-center justify-between h-16 border-b border-slate-800/60">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-600/30">
              Tx
            </div>
            <div>
              <span className="text-lg font-black text-white tracking-tight">TRAVEL<span className="text-sky-400">X</span></span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                {role === 'Admin / Owner' ? 'B2B CRM (Owner Admin)' : role === 'Marketing Executive' ? 'Field Marketing App' : role === 'Yug (Calling Executive)' ? "Yug's Calling Desk" : 'Telephonic App'}
              </span>
            </div>
          </div>

          {/* Right Controls: Due Followups, Role Switcher & Notifications */}
          <div className="flex items-center gap-2.5">
            
            {/* Today's Due Follow-ups Alert Badge */}
            {followupData && followupData.total_due > 0 && (
              <button
                onClick={() => setShowFollowupModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-rose-600 via-amber-600 to-rose-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-lg shadow-rose-600/30 animate-pulse transition"
                title="Click to view today's due follow-ups"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{followupData.total_due} Follow-ups Due</span>
              </button>
            )}

            {/* Role Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-slate-400 hidden md:inline">Mode:</span>
              <select
                value={role}
                onChange={e => handleRoleSelect(e.target.value)}
                className="bg-transparent font-bold text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="Admin / Owner" className="bg-slate-900 text-slate-200">👑 Admin / Owner Mode</option>
                <option value="Yug (Calling Executive)" className="bg-slate-900 text-slate-200">📱 Yug (Calling Exec)</option>
                <option value="Telephonic Executive" className="bg-slate-900 text-slate-200">📞 Telephonic Exec (Simran)</option>
                <option value="Marketing Executive" className="bg-slate-900 text-slate-200">🚗 Field Marketing Exec</option>
              </select>
            </div>

            {/* Notification Bell */}
            <button
              onClick={() => setShowFollowupModal(true)}
              className="relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Today's Follow-ups & Alerts"
            >
              <Bell className="w-4 h-4" />
              {followupData && followupData.total_due > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center animate-pulse">
                  {followupData.total_due}
                </span>
              )}
            </button>

          </div>

        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 relative ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${
                    tab.badge === 'AI' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' :
                    tab.badge === 'YUG CALLING' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 animate-pulse font-black' :
                    'bg-rose-950 text-rose-400 border border-rose-800'
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

    </header>
  );
}
