import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import PageShell from '../components/ui/PageShell';
import SaveBar from '../components/SaveBar';
import SaveCancelBar from '../components/SaveCancelBar';
import useDirty from '../hooks/useDirty';
import {
  FiCpu, FiKey, FiEye, FiEyeOff, FiExternalLink, FiSliders, FiCheckCircle,
  FiAlertCircle, FiLoader, FiShield, FiRefreshCw, FiLayers
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import {
  GEMINI_MODEL_GROUPS,
  OPENROUTER_MODEL_GROUPS,
  DEFAULT_AI_CONFIG,
  getAIConfig,
  saveAIConfig,
  testGeminiKey,
  testOpenRouterKey,
  getAIStatus
} from '../../lib/aiService';

export default function AISettings() {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState(DEFAULT_AI_CONFIG);
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Key Visibility
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);

  // Testing States
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiResult, setGeminiResult] = useState(null);

  const [testingOpenRouter, setTestingOpenRouter] = useState(false);
  const [openRouterResult, setOpenRouterResult] = useState(null);

  // Save States
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const { dirty, reset } = useDirty([config], loading);

  useEffect(() => {
    async function loadData() {
      try {
        const { data, error } = await supabase.from('site_settings').select('id, ai_config').maybeSingle();
        let settingsData = data;
        if (!settingsData && error?.code === 'PGRST116') {
          const { data: rows } = await supabase.from('site_settings').select('id, ai_config').limit(1);
          settingsData = rows?.[0] || null;
        }

        if (settingsData) {
          setSettingsId(settingsData.id);
          if (settingsData.ai_config && typeof settingsData.ai_config === 'object') {
            setConfig({
              ...DEFAULT_AI_CONFIG,
              ...settingsData.ai_config,
              gemini: { ...DEFAULT_AI_CONFIG.gemini, ...(settingsData.ai_config.gemini || {}) },
              openrouter: { ...DEFAULT_AI_CONFIG.openrouter, ...(settingsData.ai_config.openrouter || {}) },
            });
          } else {
            const cached = await getAIConfig();
            setConfig(cached);
          }
        } else {
          const cached = await getAIConfig();
          setConfig(cached);
        }
      } catch (err) {
        console.warn('Error loading AI settings from DB:', err);
        const cached = await getAIConfig();
        setConfig(cached);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const status = getAIStatus(config);

  async function handleTestGemini() {
    const key = config.gemini?.api_key;
    const model = config.gemini?.model === 'custom' ? config.gemini?.custom_model : config.gemini?.model;
    if (!key?.trim()) {
      setGeminiResult({ success: false, message: 'Please enter a Gemini API Key.' });
      return;
    }
    setTestingGemini(true);
    setGeminiResult(null);
    try {
      const res = await testGeminiKey(key, model || 'gemini-3.7-flash');
      const msg = res.switched
        ? `Connected! Model ${res.model} is active (auto-switched from ${res.attemptedModel} due to temporary high demand).`
        : `Connected! Model ${res.model} is ready.`;
      setGeminiResult({ success: true, message: msg });
    } catch (err) {
      setGeminiResult({ success: false, message: err.message || 'Gemini connection failed.' });
    } finally {
      setTestingGemini(false);
    }
  }

  async function handleTestOpenRouter() {
    const key = config.openrouter?.api_key;
    const model = config.openrouter?.model === 'custom' ? config.openrouter?.custom_model : config.openrouter?.model;
    if (!key?.trim()) {
      setOpenRouterResult({ success: false, message: 'Please enter an OpenRouter API Key.' });
      return;
    }
    setTestingOpenRouter(true);
    setOpenRouterResult(null);
    try {
      const res = await testOpenRouterKey(key, model || 'openai/gpt-4o-mini');
      const msg = res.switched
        ? `Connected! Model ${res.model} is active (auto-switched from ${res.attemptedModel}).`
        : `Connected! Model ${res.model} is ready.`;
      setOpenRouterResult({ success: true, message: msg });
    } catch (err) {
      setOpenRouterResult({ success: false, message: err.message || 'OpenRouter connection failed.' });
    } finally {
      setTestingOpenRouter(false);
    }
  }

  async function handleSave(e) {
    if (e) e.preventDefault();
    setSaving(true);
    setSaved(false);
    setSaveError('');

    try {
      await saveAIConfig(config, settingsId);
      queryClient.invalidateQueries({ queryKey: ['siteSettings'] });
      setSaved(true);
      reset();
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Error saving AI config:', err);
      setSaveError(err.message || 'Failed to save AI configuration');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <PageShell
      backTo="/admin"
      title="AI Settings"
      subtitle="Select your AI platform (Google Gemini or OpenRouter) and configure top models or auto-model selection"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="p-2 rounded-lg border border-admin-200 bg-white text-neutral-600 hover:text-neutral-800 hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
            title="Reload settings"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <SaveBar saving={saving} saved={saved} saveError={saveError} onSave={handleSave} label="AI Settings" top />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Platform Selection */}
        <div className="bg-white border border-admin-200 rounded-2xl p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <FiLayers className="w-4 h-4 text-brand-orange" /> Choose AI Platform
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select which AI platform to use for brochure generation and automated tasks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Google Gemini Platform */}
            <button
              type="button"
              onClick={() => setConfig(p => ({ ...p, active_provider: 'gemini' }))}
              className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
                config.active_provider === 'gemini'
                  ? 'bg-blue-50/60 border-brand-blue ring-2 ring-brand-blue/20 shadow-xs'
                  : 'bg-white border-admin-200 hover:border-admin-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  config.active_provider === 'gemini' ? 'bg-brand-blue text-white' : 'bg-blue-100 text-brand-blue'
                }`}>
                  <HiSparkles className="w-5 h-5" />
                </div>
                {status.hasGemini && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Key Ready
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-neutral-900">Google Gemini</p>
              <p className="text-xs text-neutral-500 mt-1 leading-snug">
                Official Google AI API (Gemini 2.5 Pro / Flash, 2.0 &amp; 1.5 stable models).
              </p>
            </button>

            {/* 2. OpenRouter Platform */}
            <button
              type="button"
              onClick={() => setConfig(p => ({ ...p, active_provider: 'openrouter' }))}
              className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
                config.active_provider === 'openrouter'
                  ? 'bg-purple-50/60 border-purple-600 ring-2 ring-purple-600/20 shadow-xs'
                  : 'bg-white border-admin-200 hover:border-admin-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  config.active_provider === 'openrouter' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600'
                }`}>
                  <FiCpu className="w-5 h-5" />
                </div>
                {status.hasOpenRouter && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Key Ready
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-neutral-900">OpenRouter</p>
              <p className="text-xs text-neutral-500 mt-1 leading-snug">
                Multi-model hub with Claude 3.7 Sonnet, GPT-4o, DeepSeek, and Free models.
              </p>
            </button>

            {/* 3. Disabled */}
            <button
              type="button"
              onClick={() => setConfig(p => ({ ...p, active_provider: 'disabled' }))}
              className={`p-5 rounded-xl border text-left transition-all cursor-pointer ${
                config.active_provider === 'disabled'
                  ? 'bg-neutral-100 border-neutral-700 ring-2 ring-neutral-700/20 shadow-xs'
                  : 'bg-white border-admin-200 hover:border-admin-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  config.active_provider === 'disabled' ? 'bg-neutral-700 text-white' : 'bg-neutral-200 text-neutral-600'
                }`}>
                  <FiShield className="w-5 h-5" />
                </div>
              </div>
              <p className="text-sm font-bold text-neutral-900">Disabled</p>
              <p className="text-xs text-neutral-500 mt-1 leading-snug">
                Disables automated AI text processing.
              </p>
            </button>
          </div>
        </div>

        {/* 2-Column Platform Detail Configuration */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* 1. Google Gemini Config Card */}
          <div className={`bg-white border rounded-2xl p-6 shadow-xs space-y-4 transition-all ${
            config.active_provider === 'gemini'
              ? 'border-brand-blue ring-1 ring-brand-blue/30'
              : 'border-admin-200 opacity-90'
          }`}>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-admin-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center font-bold text-sm">
                  <HiSparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Google Gemini Settings</h3>
                  <p className="text-xs text-neutral-500">Configure key, auto mode &amp; models</p>
                </div>
              </div>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline"
              >
                <span>Get Key</span>
                <FiExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Gemini API Key
              </label>
              <div className="relative">
                <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type={showGeminiKey ? 'text' : 'password'}
                  value={config.gemini?.api_key || ''}
                  onChange={e => setConfig(p => ({
                    ...p,
                    gemini: { ...p.gemini, api_key: e.target.value }
                  }))}
                  className="w-full pl-9 pr-20 py-2 border border-admin-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                  placeholder="AIzaSy..."
                />
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  title={showGeminiKey ? 'Hide Key' : 'Show Key'}
                >
                  {showGeminiKey ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Model Selection with Auto Option */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                Gemini Model Selection
              </label>
              <select
                value={config.gemini?.model || 'auto'}
                onChange={e => setConfig(p => ({
                  ...p,
                  gemini: { ...p.gemini, model: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all cursor-pointer"
              >
                {GEMINI_MODEL_GROUPS.map((group, gIdx) => (
                  <optgroup key={gIdx} label={group.group}>
                    {group.models.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.desc}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value="custom">-- Custom Model Identifier --</option>
              </select>
            </div>

            {/* Custom Model Input */}
            {config.gemini?.model === 'custom' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                  Custom Gemini Model Name
                </label>
                <input
                  type="text"
                  value={config.gemini?.custom_model || ''}
                  onChange={e => setConfig(p => ({
                    ...p,
                    gemini: { ...p.gemini, custom_model: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-admin-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
                  placeholder="e.g. gemini-2.5-pro or models/gemini-2.0-flash-exp"
                />
              </div>
            )}

            {/* Advanced Tuning */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1 uppercase tracking-wider">
                  Temperature: {config.gemini?.temperature ?? 0.7}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.gemini?.temperature ?? 0.7}
                  onChange={e => setConfig(p => ({
                    ...p,
                    gemini: { ...p.gemini, temperature: parseFloat(e.target.value) }
                  }))}
                  className="w-full accent-brand-blue cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1 uppercase tracking-wider">
                  Max Tokens: {config.gemini?.max_tokens ?? 4096}
                </label>
                <input
                  type="number"
                  min="512"
                  max="8192"
                  step="256"
                  value={config.gemini?.max_tokens ?? 4096}
                  onChange={e => setConfig(p => ({
                    ...p,
                    gemini: { ...p.gemini, max_tokens: parseInt(e.target.value) || 4096 }
                  }))}
                  className="w-full px-2 py-1 border border-admin-200 rounded-md text-xs bg-white"
                />
              </div>
            </div>

            {/* Test Connection Button & Result */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestGemini}
                disabled={testingGemini || !config.gemini?.api_key}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-xs disabled:opacity-40 cursor-pointer active:scale-95"
              >
                {testingGemini ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiCheckCircle className="w-3.5 h-3.5" />}
                <span>{testingGemini ? 'Testing Connection...' : 'Test Gemini Connection'}</span>
              </button>

              {geminiResult && (
                <div className={`mt-2.5 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  geminiResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {geminiResult.success ? (
                    <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span className="truncate">{geminiResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. OpenRouter Config Card */}
          <div className={`bg-white border rounded-2xl p-6 shadow-xs space-y-4 transition-all ${
            config.active_provider === 'openrouter'
              ? 'border-purple-600 ring-1 ring-purple-600/30'
              : 'border-admin-200 opacity-90'
          }`}>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-admin-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                  <FiCpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">OpenRouter Settings</h3>
                  <p className="text-xs text-neutral-500">Configure key, auto mode &amp; models</p>
                </div>
              </div>
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 hover:underline"
              >
                <span>Get Key</span>
                <FiExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                OpenRouter API Key
              </label>
              <div className="relative">
                <FiKey className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type={showOpenRouterKey ? 'text' : 'password'}
                  value={config.openrouter?.api_key || ''}
                  onChange={e => setConfig(p => ({
                    ...p,
                    openrouter: { ...p.openrouter, api_key: e.target.value }
                  }))}
                  className="w-full pl-9 pr-20 py-2 border border-admin-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="sk-or-v1-..."
                />
                <button
                  type="button"
                  onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  title={showOpenRouterKey ? 'Hide Key' : 'Show Key'}
                >
                  {showOpenRouterKey ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Model Selection with Auto Options */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                OpenRouter Model Selection
              </label>
              <select
                value={config.openrouter?.model || 'auto'}
                onChange={e => setConfig(p => ({
                  ...p,
                  openrouter: { ...p.openrouter, model: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-admin-200 rounded-lg text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all cursor-pointer"
              >
                {OPENROUTER_MODEL_GROUPS.map((group, gIdx) => (
                  <optgroup key={gIdx} label={group.group}>
                    {group.models.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} — {m.desc}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <option value="custom">-- Custom Model Identifier --</option>
              </select>
            </div>

            {/* Custom Model Input */}
            {config.openrouter?.model === 'custom' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5 uppercase tracking-wider">
                  Custom OpenRouter Model Identifier
                </label>
                <input
                  type="text"
                  value={config.openrouter?.custom_model || ''}
                  onChange={e => setConfig(p => ({
                    ...p,
                    openrouter: { ...p.openrouter, custom_model: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-admin-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="e.g. anthropic/claude-3.7-sonnet"
                />
              </div>
            )}

            {/* Advanced Tuning */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1 uppercase tracking-wider">
                  Temperature: {config.openrouter?.temperature ?? 0.7}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.openrouter?.temperature ?? 0.7}
                  onChange={e => setConfig(p => ({
                    ...p,
                    openrouter: { ...p.openrouter, temperature: parseFloat(e.target.value) }
                  }))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 mb-1 uppercase tracking-wider">
                  Max Tokens: {config.openrouter?.max_tokens ?? 4096}
                </label>
                <input
                  type="number"
                  min="512"
                  max="8192"
                  step="256"
                  value={config.openrouter?.max_tokens ?? 4096}
                  onChange={e => setConfig(p => ({
                    ...p,
                    openrouter: { ...p.openrouter, max_tokens: parseInt(e.target.value) || 4096 }
                  }))}
                  className="w-full px-2 py-1 border border-admin-200 rounded-md text-xs bg-white"
                />
              </div>
            </div>

            {/* Test Connection Button & Result */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleTestOpenRouter}
                disabled={testingOpenRouter || !config.openrouter?.api_key}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold transition-all shadow-xs disabled:opacity-40 cursor-pointer active:scale-95"
              >
                {testingOpenRouter ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiCheckCircle className="w-3.5 h-3.5" />}
                <span>{testingOpenRouter ? 'Testing Connection...' : 'Test OpenRouter Connection'}</span>
              </button>

              {openRouterResult && (
                <div className={`mt-2.5 p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  openRouterResult.success
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {openRouterResult.success ? (
                    <FiCheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <FiAlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span className="truncate">{openRouterResult.message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      <SaveCancelBar
        saving={saving}
        saved={saved}
        saveError={saveError}
        onSave={handleSave}
        onDiscard={() => window.location.reload()}
      />
    </PageShell>
  );
}
