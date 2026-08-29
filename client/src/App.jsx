import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ManagementDashboard from './components/ManagementDashboard';
import FocusLists from './components/FocusLists';
import AgentMaster from './components/AgentMaster';
import MarketingVisits from './components/MarketingVisits';
import TelephonicFollowups from './components/TelephonicFollowups';
import QueryManagement from './components/QueryManagement';
import LocationAnalytics from './components/LocationAnalytics';
import ManagementReports from './components/ManagementReports';
import AIAssistant from './components/AIAssistant';
import Agent360Drawer from './components/Agent360Drawer';
import EntryModals from './components/EntryModals';
import ImportExcelModal from './components/ImportExcelModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [role, setRole] = useState('Admin / Owner');
  
  // Drawer & Modal State
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [modalPrefill, setModalPrefill] = useState(null);
  const [agentFilterStage, setAgentFilterStage] = useState('');
  const [showImportExcel, setShowImportExcel] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Permanent LocalStorage Session Retention (No repeated logins required)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role') || urlParams.get('mode');
    
    if (roleParam === 'field' || roleParam === 'marketing') {
      setRole('Marketing Executive');
      setActiveTab('visits');
      localStorage.setItem('travelx_crm_role', 'Marketing Executive');
      localStorage.setItem('travelx_crm_tab', 'visits');
    } else if (roleParam === 'telephonic' || roleParam === 'calling') {
      setRole('Telephonic Executive');
      setActiveTab('calls');
      localStorage.setItem('travelx_crm_role', 'Telephonic Executive');
      localStorage.setItem('travelx_crm_tab', 'calls');
    } else {
      const savedRole = localStorage.getItem('travelx_crm_role');
      const savedTab = localStorage.getItem('travelx_crm_tab');
      if (savedRole) {
        setRole(savedRole);
        if (savedTab) setActiveTab(savedTab);
      }
    }
  }, []);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    localStorage.setItem('travelx_crm_role', newRole);
    if (newRole === 'Marketing Executive') {
      setActiveTab('visits');
      localStorage.setItem('travelx_crm_tab', 'visits');
    } else if (newRole === 'Telephonic Executive') {
      setActiveTab('calls');
      localStorage.setItem('travelx_crm_tab', 'calls');
    } else {
      setActiveTab('dashboard');
      localStorage.setItem('travelx_crm_tab', 'dashboard');
    }
  };

  const handleNavigate = (tab, params = {}) => {
    if (params.stage) {
      setAgentFilterStage(params.stage);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenModal = (type, prefillData = null) => {
    setModalPrefill(prefillData);
    setModalType(type);
  };

  const handleDrawerAction = (actionType, agentData) => {
    setSelectedAgentId(null);
    if (actionType === 'log_call') {
      handleOpenModal('log_call', agentData);
    } else if (actionType === 'create_query') {
      handleOpenModal('create_query', agentData);
    } else if (actionType === 'log_visit') {
      handleOpenModal('log_visit', agentData);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setAgentFilterStage('');
          setActiveTab(tab);
        }}
        role={role}
        onRoleChange={handleRoleChange}
        onOpenAgentDrawer={setSelectedAgentId}
      />

      {/* Main App Workspace View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {activeTab === 'dashboard' && role === 'Admin / Owner' && (
          <ManagementDashboard
            key={refreshKey}
            onNavigate={handleNavigate}
            onOpenAgentDrawer={setSelectedAgentId}
            onOpenModal={handleOpenModal}
            role={role}
          />
        )}

        {activeTab === 'focus' && role === 'Admin / Owner' && (
          <FocusLists
            key={refreshKey}
            onOpenAgentDrawer={setSelectedAgentId}
            onOpenModal={handleOpenModal}
          />
        )}

        {activeTab === 'agents' && (role === 'Admin / Owner' || role === 'Telephonic Executive') && (
          <AgentMaster
            key={refreshKey}
            role={role}
            onOpenAgentDrawer={setSelectedAgentId}
            onOpenModal={handleOpenModal}
            onOpenImportExcel={() => setShowImportExcel(true)}
            initialStage={agentFilterStage}
          />
        )}

        {activeTab === 'visits' && (
          <MarketingVisits
            key={refreshKey}
            role={role}
            onOpenModal={handleOpenModal}
            onOpenAgentDrawer={setSelectedAgentId}
          />
        )}

        {activeTab === 'calls' && (
          <TelephonicFollowups
            key={refreshKey}
            role={role}
            onOpenModal={handleOpenModal}
            onOpenAgentDrawer={setSelectedAgentId}
          />
        )}

        {activeTab === 'queries' && (
          <QueryManagement
            key={refreshKey}
            role={role}
            onOpenModal={handleOpenModal}
            onOpenAgentDrawer={setSelectedAgentId}
          />
        )}

        {activeTab === 'analytics' && role === 'Admin / Owner' && (
          <LocationAnalytics
            key={refreshKey}
            role={role}
          />
        )}

        {activeTab === 'ai' && role === 'Admin / Owner' && (
          <AIAssistant
            key={refreshKey}
            onOpenModal={handleOpenModal}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        Travelx B2B Agent Marketing & Lead Conversion CRM • Active Role: <strong className="text-slate-300">{role}</strong>
      </footer>

      {/* Slide-over 360 Agent Profile Drawer */}
      {selectedAgentId && (
        <Agent360Drawer
          agentId={selectedAgentId}
          onClose={() => setSelectedAgentId(null)}
          onAction={handleDrawerAction}
        />
      )}

      {/* Entry Modals (Log Visit, Log Call, Create Query) */}
      {modalType && (
        <EntryModals
          modalType={modalType}
          prefillData={modalPrefill}
          onClose={() => setModalType(null)}
          onSuccess={() => {
            setRefreshKey(k => k + 1);
            setModalType(null);
          }}
        />
      )}

      {/* Import Excel / CSV Modal */}
      {showImportExcel && (
        <ImportExcelModal
          onClose={() => setShowImportExcel(false)}
          onSuccess={() => {
            setRefreshKey(k => k + 1);
            setShowImportExcel(false);
          }}
        />
      )}

    </div>
  );
}
