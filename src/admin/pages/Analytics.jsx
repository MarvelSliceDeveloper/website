import { useState, useEffect } from 'react';
import { 
  FiBarChart2, FiExternalLink, FiRefreshCw, FiMaximize2, FiMinimize2, 
  FiHelpCircle, FiCheckCircle, FiUsers, FiDownload, FiMessageSquare, FiTrendingUp, FiLayers, FiShield
} from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import PageShell from '../components/ui/PageShell';

export default function Analytics() {
  const envLookerUrl = import.meta.env?.VITE_LOOKER_STUDIO_URL || '';
  const gaMeasurementId = import.meta.env?.VITE_GA_MEASUREMENT_ID || '';
  
  const [embedUrl, setEmbedUrl] = useState(() => {
    return localStorage.getItem('admin_looker_studio_url') || envLookerUrl;
  });
  const [inputUrl, setInputUrl] = useState(embedUrl);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Platform Realtime Stats from Supabase
  const [stats, setStats] = useState({
    totalChats: 0,
    totalDownloads: 0,
    totalSubmissions: 0,
    totalEnquiries: 0,
    loading: true
  });

  useEffect(() => {
    async function fetchPlatformStats() {
      try {
        const [
          { count: chatsCount },
          { count: downloadsCount },
          { count: submissionsCount },
          { count: enquiriesCount }
        ] = await Promise.all([
          supabase.from('conversations').select('*', { count: 'exact', head: true }),
          supabase.from('brochure_downloads').select('*', { count: 'exact', head: true }),
          supabase.from('form_submissions').select('*', { count: 'exact', head: true }),
          supabase.from('course_interests').select('*', { count: 'exact', head: true }),
        ]);

        setStats({
          totalChats: chatsCount || 0,
          totalDownloads: downloadsCount || 0,
          totalSubmissions: submissionsCount || 0,
          totalEnquiries: enquiriesCount || 0,
          loading: false
        });
      } catch (err) {
        console.warn('Could not load native stats:', err);
        setStats(prev => ({ ...prev, loading: false }));
      }
    }
    fetchPlatformStats();
  }, [refreshKey]);

  function handleSaveUrl(e) {
    e?.preventDefault();
    const clean = inputUrl.trim();
    setEmbedUrl(clean);
    localStorage.setItem('admin_looker_studio_url', clean);
    setShowConfigModal(false);
    setRefreshKey(k => k + 1);
  }

  function handleResetUrl() {
    setEmbedUrl(envLookerUrl);
    setInputUrl(envLookerUrl);
    localStorage.removeItem('admin_looker_studio_url');
    setShowConfigModal(false);
    setRefreshKey(k => k + 1);
  }

  return (
    <PageShell 
      title="Live Analytics & Traffic" 
      description="Real-time website visitor insights, Google Analytics 4 telemetry, and platform conversion performance."
    >
      <div className="space-y-6">
        
        {/* Top Action & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <FiBarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Google Analytics 4 &amp; Looker Studio</h3>
                {gaMeasurementId ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    GA4 Active ({gaMeasurementId})
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    GA4 ID not set in .env
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {embedUrl ? 'Live Looker Studio dashboard connected' : 'Connect your Looker Studio report below to view interactive live charts'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              <FiLayers className="w-3.5 h-3.5" />
              {embedUrl ? 'Change Embed URL' : 'Setup Embed URL'}
            </button>

            {embedUrl && (
              <>
                <button
                  type="button"
                  onClick={() => setRefreshKey(k => k + 1)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  title="Reload Report"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                  title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? <FiMinimize2 className="w-3.5 h-3.5" /> : <FiMaximize2 className="w-3.5 h-3.5" />}
                  {isFullscreen ? 'Exit' : 'Fullscreen'}
                </button>
              </>
            )}

            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#525CEB] hover:bg-[#434dbf] rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <span>Google Analytics</span>
              <FiExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Quick Platform Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Brochure Downloads</span>
              <FiDownload className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {stats.loading ? '…' : stats.totalDownloads}
            </div>
            <p className="text-[11px] text-slate-400">Total PDF brochures downloaded</p>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Live Chats</span>
              <FiMessageSquare className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {stats.loading ? '…' : stats.totalChats}
            </div>
            <p className="text-[11px] text-slate-400">Total visitor conversations</p>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Course Enquiries</span>
              <FiTrendingUp className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {stats.loading ? '…' : stats.totalEnquiries}
            </div>
            <p className="text-[11px] text-slate-400">Course admissions &amp; interests</p>
          </div>

          <div className="bg-white p-4.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <span>Form Submissions</span>
              <FiUsers className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {stats.loading ? '…' : stats.totalSubmissions}
            </div>
            <p className="text-[11px] text-slate-400">Contact &amp; application forms</p>
          </div>
        </div>

        {/* Looker Studio Report Display or Setup Guide */}
        {embedUrl ? (
          <div className="space-y-3">
            {/* Quick Access & Cookie Helper Notice */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs text-indigo-900">
              <div className="flex items-center gap-2">
                <FiHelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Tip:</strong> If Google asks for <em>third-party cookies</em> inside the embed, in Looker Studio set <strong>Share &rarr; Anyone with the link can view</strong>, or open directly:
                </span>
              </div>
              <a
                href={embedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 font-bold rounded-xl border border-indigo-200 shadow-2xs transition-all whitespace-nowrap"
              >
                <span>Open Full Report in New Tab</span>
                <FiExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className={`bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md transition-all ${
              isFullscreen ? 'fixed inset-4 z-50 rounded-2xl' : 'min-h-[720px] h-[80vh]'
            }`}>
              <iframe
                key={refreshKey}
                src={embedUrl}
                title="Google Looker Studio Analytics Dashboard"
                className="w-full h-full border-0"
                allowFullScreen
                allow="fullscreen; clipboard-read; clipboard-write; web-share"
                sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"
              />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-6 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-[#525CEB] flex items-center justify-center mx-auto border border-indigo-100 shadow-xs">
              <FiBarChart2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Connect Google Looker Studio Dashboard</h2>
              <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
                Embed your live Google Analytics charts, visitor maps, conversion funnels, and real-time traffic statistics directly inside this admin portal.
              </p>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-4 border border-slate-200/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">How to get your free embed link in 2 minutes:</h4>
              <ol className="text-xs sm:text-sm text-slate-600 space-y-2.5 list-decimal pl-4">
                <li>
                  Open <a href="https://lookerstudio.google.com" target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">Looker Studio (lookerstudio.google.com)</a> and click <strong>Create &rarr; Report</strong>.
                </li>
                <li>
                  Select <strong>Google Analytics</strong> as your data source and choose your <strong>Marvel Slice GA4 property</strong> ({gaMeasurementId || 'your GA4 ID'}).
                </li>
                <li>
                  Customize your charts (or pick Google's official GA4 Starter Template).
                </li>
                <li>
                  Click <strong>File &rarr; Embed report</strong> (or Share &rarr; Embed), check <strong>Enable embedding</strong>, select <strong>Embed URL</strong>, and copy the link.
                </li>
                <li>
                  Paste the link below or add it as <code className="bg-slate-200 px-1.5 py-0.5 rounded text-indigo-700 font-mono text-xs">VITE_LOOKER_STUDIO_URL</code> in your <code className="font-mono text-xs">.env</code> file.
                </li>
              </ol>
            </div>

            {/* Quick URL Input */}
            <form onSubmit={handleSaveUrl} className="flex flex-col sm:flex-row items-center gap-2 max-w-xl mx-auto">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://lookerstudio.google.com/embed/reporting/..."
                className="flex-1 w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#525CEB]/20 focus:border-[#525CEB] shadow-2xs"
                required
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#525CEB] to-[#6974FF] hover:brightness-105 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                Connect Dashboard
              </button>
            </form>

            <div className="pt-2 flex items-center justify-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><FiCheckCircle className="text-emerald-500" /> 100% Free &amp; Official Google Tool</span>
              <span className="flex items-center gap-1"><FiShield className="text-blue-500" /> Secure Embed</span>
            </div>
          </div>
        )}

        {/* Change Embed URL Modal */}
        {showConfigModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 sm:p-8 max-w-lg w-full space-y-5 relative">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-slate-900">Looker Studio Embed URL</h3>
                <p className="text-xs text-slate-500">
                  Update the embed link for your Google Looker Studio report.
                </p>
              </div>

              <form onSubmit={handleSaveUrl} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    EMBED URL
                  </label>
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://lookerstudio.google.com/embed/reporting/..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#525CEB]/20 focus:border-[#525CEB]"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Format: <code className="text-indigo-600">https://lookerstudio.google.com/embed/reporting/...</code>
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetUrl}
                    className="px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                  >
                    Clear / Reset
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowConfigModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#525CEB] hover:bg-[#434dbf] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Save &amp; View
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </PageShell>
  );
}
