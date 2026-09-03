import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, HelpCircle, Check, ArrowRight, Sparkles } from 'lucide-react';

export default function BikramPwaInstallBanner({ role }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if app is already running as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed in this session
    if (sessionStorage.getItem('bikram_pwa_dismissed') === 'true') {
      setDismissed(true);
    }

    // Capture the PWA install prompt event
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // ONLY show for Bikramjit / Marketing Executive
  if (role !== 'Marketing Executive') return null;
  if (isInstalled || dismissed) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowHelpModal(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('bikram_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* Bikramjit Mobile App Install Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl shadow-amber-900/30 border border-amber-400/40 animate-fade-in relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Left: Icon & Text */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/30 backdrop-blur-md flex items-center justify-center text-xl shrink-0 border border-white/20">
              🏍️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black tracking-tight">
                  Bikramjit Mobile App: Install on Phone
                </h3>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black/40 text-amber-200 border border-amber-300/40">
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-amber-100/90 mt-0.5">
                Phone ki Home Screen par app icon add karein — roz 1-tap me full screen khulega bina URL type kiye!
              </p>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 rounded-xl bg-black/90 hover:bg-black text-amber-300 font-extrabold text-xs transition shadow-lg flex items-center gap-1.5 cursor-pointer border border-amber-400/40 active:scale-95"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Install App (Add to Screen)</span>
            </button>
            <button
              onClick={() => setShowHelpModal(true)}
              className="px-2.5 py-2 rounded-xl bg-black/30 hover:bg-black/50 text-white font-bold text-xs transition border border-white/20"
              title="Help guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-black/30 transition"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Step-by-Step Installation Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-white text-base">Phone Par Install Kaise Karein</h3>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              
              {/* Android Instructions */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  🤖 Android (Google Chrome me):
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed pl-1">
                  <li>Chrome browser me upar right side <strong>3 dots (⋮)</strong> par tap karein.</li>
                  <li>Menu me <strong>"Add to Home screen"</strong> ya <strong>"Install app"</strong> chunein.</li>
                  <li><strong>"Add" / "Install"</strong> par click karein.</li>
                  <li>Aapke phone ke home screen par <strong>"Travelx Field"</strong> icon ban jayega!</li>
                </ol>
              </div>

              {/* iPhone Instructions */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                <div className="font-bold text-sky-400 flex items-center gap-1.5">
                  🍎 iPhone (Safari browser me):
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed pl-1">
                  <li>Safari me neeche <strong>Share icon (⎋)</strong> par tap karein.</li>
                  <li>Neeche scroll karein aur <strong>"Add to Home Screen" (+)</strong> par tap karein.</li>
                  <li>Upar <strong>"Add"</strong> par tap karein.</li>
                </ol>
              </div>

            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition"
            >
              Samajh Aa Gaya (Got it)
            </button>

          </div>
        </div>
      )}
    </>
  );
}
