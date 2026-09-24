import React from 'react';
import { AlertTriangle, RotateCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CRITICAL CRM COMPONENT ERROR:', error, errorInfo);
  }

  handleReload = () => {
    if ('caches' in window) {
      caches.keys().then((keys) => {
        return Promise.all(keys.map((k) => caches.delete(k)));
      }).then(() => {
        window.location.reload();
      });
    } else {
      window.location.reload();
    }
  };

  handleReset = () => {
    localStorage.removeItem('travelx_crm_tab');
    window.location.href = '/?role=admin';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[500px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900/90 border border-rose-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-white">Temporary Component Issue</h3>
              <p className="text-xs text-slate-400 mt-1">
                An unexpected error occurred while loading this section. Your data is safe.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-left">
                <p className="text-[11px] font-mono text-rose-400/90 break-all">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-sky-600/20 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" /> Reload Portal
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" /> Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
