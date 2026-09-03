import { supabase } from './supabaseClient';

export const GEMINI_MODEL_GROUPS = [
  {
    group: 'Auto Model Selection',
    models: [
      { id: 'auto', name: '⚡ Auto (Best Performance & Speed)', desc: 'Auto-selects latest top Gemini 3 model (3.7 Flash / 3.6 Flash with fallback)' },
    ],
  },
  {
    group: 'Gemini 3 (Stable)',
    models: [
      { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (New Stable)', desc: 'Latest & most capable Flash model for complex coding & multi-step execution' },
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Stable)', desc: 'Balanced speed and multimodal capabilities across everyday tasks' },
      { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Stable)', desc: 'High-throughput execution with foundational performance' },
      { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite (Stable)', desc: 'Fastest, most cost-effective 3.5 model for high-throughput' },
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite (Stable)', desc: 'Frontier-class performance at a fraction of the cost' },
    ],
  },
  {
    group: 'Gemini 3 (Preview)',
    models: [
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Preview)', desc: 'Advanced intelligence, complex reasoning & problem-solving' },
      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)', desc: 'Frontier-class lightweight performance' },
    ],
  },
];

export const OPENROUTER_MODEL_GROUPS = [
  {
    group: 'Auto Model Selection',
    models: [
      { id: 'auto', name: '⚡ Auto (Top Flagship Quality)', desc: 'Auto-selects best available flagship model (Claude 3.7 / GPT-4o / Gemini 3.7)' },
      { id: 'auto_free', name: '⚡ Auto (Best Free Tier Model)', desc: 'Auto-selects best free available model (Gemini 2.0 Flash Free / DeepSeek R1 Free)' },
    ],
  },
  {
    group: 'Top Flagship Models',
    models: [
      { id: 'anthropic/claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', desc: 'Hybrid reasoning & benchmark leader' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', desc: 'Top tier coding & document synthesis' },
      { id: 'openai/gpt-4o', name: 'GPT-4o', desc: 'OpenAI flagship multimodal omni model' },
      { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Fast, efficient & low-cost model' },
      { id: 'openai/o3-mini', name: 'OpenAI o3-mini', desc: 'Specialized logical reasoning & STEM' },
      { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro (via OpenRouter)', desc: 'Advanced Google model on OpenRouter' },
      { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (via OpenRouter)', desc: 'Fast Google model on OpenRouter' },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (671B)', desc: 'High-power open-weights reasoning model' },
      { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', desc: '671B MoE model with fast generation' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', desc: 'Meta open-source flagship' },
      { id: 'mistralai/mistral-large-2411', name: 'Mistral Large 2', desc: 'Mistral top reasoning model' },
      { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen 2.5 72B', desc: 'High-capability multilingual model' },
    ],
  },
  {
    group: 'Free & Budget Stable Models',
    models: [
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', desc: '100% Free Google experimental model' },
      { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', desc: 'Free tier of DeepSeek reasoning model' },
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', desc: 'Free tier Llama 3.3' },
      { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B (Free)', desc: 'Free lightweight fast model' },
      { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)', desc: 'Free compact European model' },
      { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder 32B (Free)', desc: 'Free coding specialist model' },
    ],
  },
];

export const DEFAULT_AI_CONFIG = {
  active_provider: 'gemini', // 'gemini' | 'openrouter' | 'disabled'
  gemini: {
    api_key: '',
    model: 'auto', // Default to auto model selection for Gemini
    custom_model: '',
    temperature: 0.7,
    max_tokens: 4096,
  },
  openrouter: {
    api_key: '',
    model: 'auto', // Default to auto model selection for OpenRouter
    custom_model: '',
    temperature: 0.7,
    max_tokens: 4096,
    site_url: 'https://marvelslice.com',
    site_name: 'Marvel Slice Academy',
  },
};

const LOCAL_STORAGE_KEY = 'marvel_ai_config';

/**
 * Loads AI configuration from site_settings (with localStorage fallback).
 */
export async function getAIConfig() {
  try {
    const { data } = await supabase
      .from('site_settings')
      .select('ai_config')
      .maybeSingle();

    if (data?.ai_config && typeof data.ai_config === 'object') {
      const merged = {
        ...DEFAULT_AI_CONFIG,
        ...data.ai_config,
        gemini: { ...DEFAULT_AI_CONFIG.gemini, ...(data.ai_config.gemini || {}) },
        openrouter: { ...DEFAULT_AI_CONFIG.openrouter, ...(data.ai_config.openrouter || {}) },
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch (err) {
    console.warn('Could not load ai_config from DB, trying localStorage:', err);
  }

  // Fallback to localStorage
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      return {
        ...DEFAULT_AI_CONFIG,
        ...parsed,
        gemini: { ...DEFAULT_AI_CONFIG.gemini, ...(parsed.gemini || {}) },
        openrouter: { ...DEFAULT_AI_CONFIG.openrouter, ...(parsed.openrouter || {}) },
      };
    }
  } catch {}

  return DEFAULT_AI_CONFIG;
}

/**
 * Saves AI configuration to site_settings (and caches in localStorage).
 */
export async function saveAIConfig(config, settingsId = null) {
  const cleanConfig = {
    ...DEFAULT_AI_CONFIG,
    ...config,
    gemini: { ...DEFAULT_AI_CONFIG.gemini, ...(config.gemini || {}) },
    openrouter: { ...DEFAULT_AI_CONFIG.openrouter, ...(config.openrouter || {}) },
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanConfig));
  } catch {}

  try {
    if (settingsId) {
      await supabase
        .from('site_settings')
        .update({ ai_config: cleanConfig, updated_at: new Date().toISOString() })
        .eq('id', settingsId);
    } else {
      const { data: existing } = await supabase.from('site_settings').select('id').maybeSingle();
      if (existing?.id) {
        await supabase
          .from('site_settings')
          .update({ ai_config: cleanConfig, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      }
    }
  } catch (err) {
    console.warn('Could not save ai_config to DB column:', err);
  }

  return cleanConfig;
}

/**
 * Evaluates provider availability and active route
 */
export function getAIStatus(config) {
  const hasGemini = Boolean(config?.gemini?.api_key?.trim());
  const hasOpenRouter = Boolean(config?.openrouter?.api_key?.trim());
  const activeProvider = config?.active_provider || 'gemini';

  let activeModelDisplay = 'Auto Select';
  let isReady = false;

  if (activeProvider === 'gemini') {
    isReady = hasGemini;
    const model = config?.gemini?.model || 'auto';
    if (model === 'auto') activeModelDisplay = 'Auto (Gemini 3.7 Flash / 3.6 Flash)';
    else if (model === 'custom') activeModelDisplay = config?.gemini?.custom_model || 'Custom Gemini Model';
    else activeModelDisplay = model;
  } else if (activeProvider === 'openrouter') {
    isReady = hasOpenRouter;
    const model = config?.openrouter?.model || 'auto';
    if (model === 'auto') activeModelDisplay = 'Auto (Claude 3.7 / GPT-4o / Gemini 3.7)';
    else if (model === 'auto_free') activeModelDisplay = 'Auto (Best Free Models)';
    else if (model === 'custom') activeModelDisplay = config?.openrouter?.custom_model || 'Custom OpenRouter Model';
    else activeModelDisplay = model;
  } else {
    activeModelDisplay = 'Disabled';
  }

  return {
    hasGemini,
    hasOpenRouter,
    activeProvider,
    activeModelDisplay,
    isReady,
  };
}

/**
 * Test Google Gemini API connection with automatic model failover
 */
export async function testGeminiKey(apiKey, model = 'gemini-3.7-flash') {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('API Key is required');
  }

  const primaryModel = (!model || model === 'auto') ? 'gemini-3.7-flash' : model;
  const fallbackCandidates = [
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview',
  ];

  const modelsToTry = [
    primaryModel,
    ...fallbackCandidates.filter(m => m !== primaryModel),
  ];

  let lastError = null;
  for (const modelToTest of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTest}:generateContent?key=${apiKey.trim()}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Respond with "OK".' }] }],
          generationConfig: { maxOutputTokens: 10, temperature: 0.1 },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `Gemini API Error: ${response.status} ${response.statusText}`);
      }

      return {
        success: true,
        model: modelToTest,
        switched: modelToTest !== primaryModel,
        attemptedModel: primaryModel,
        response: data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Connected',
      };
    } catch (err) {
      console.warn(`Gemini test on ${modelToTest} encountered: "${err.message}". Auto-switching to next model...`);
      lastError = err;
    }
  }

  throw lastError || new Error('Gemini connection test failed.');
}

/**
 * Test OpenRouter API connection with automatic model failover
 */
export async function testOpenRouterKey(apiKey, model = 'openai/gpt-4o-mini') {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('API Key is required');
  }

  let selectedModel = model;
  if (!selectedModel || selectedModel === 'auto') selectedModel = 'openai/gpt-4o-mini';
  if (selectedModel === 'auto_free') selectedModel = 'google/gemini-2.0-flash-exp:free';

  const modelsToTry = [
    selectedModel,
    'openai/gpt-4o-mini',
    'anthropic/claude-3.7-sonnet',
    'google/gemini-2.0-flash-exp:free',
    'deepseek/deepseek-chat',
  ];

  let lastError = null;
  for (const modelToTest of modelsToTry) {
    try {
      const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
          'HTTP-Referer': 'https://marvelslice.com',
          'X-Title': 'Marvel Slice Academy',
        },
        body: JSON.stringify({
          model: modelToTest,
          messages: [{ role: 'user', content: 'Respond with "OK".' }],
          max_tokens: 10,
          temperature: 0.1,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `OpenRouter API Error: ${response.status} ${response.statusText}`);
      }

      return {
        success: true,
        model: modelToTest,
        switched: modelToTest !== selectedModel,
        attemptedModel: selectedModel,
        response: data?.choices?.[0]?.message?.content?.trim() || 'Connected',
      };
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('OpenRouter connection test failed.');
}

/**
 * Executes Gemini call with intelligent auto-model resolution and high-demand auto-switching
 */
async function callGemini(prompt, config, overrideOptions = {}) {
  const key = overrideOptions.apiKey || config.gemini?.api_key;
  if (!key?.trim()) throw new Error('Gemini API key is not configured in AI Settings.');

  let configuredModel = overrideOptions.model || config.gemini?.model || 'auto';
  if (configuredModel === 'custom') configuredModel = config.gemini?.custom_model || 'gemini-3.7-flash';

  const defaultSequence = [
    'gemini-3.7-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.1-pro-preview',
  ];

  // If user selected a specific model, try it first; if it fails (e.g. High Demand / 429), auto-switch to remaining models
  const candidateModels = (configuredModel === 'auto')
    ? defaultSequence
    : [configuredModel, ...defaultSequence.filter(m => m !== configuredModel)];

  let lastError = null;
  for (const modelToTry of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelToTry}:generateContent?key=${key.trim()}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: overrideOptions.temperature ?? config.gemini?.temperature ?? 0.7,
            maxOutputTokens: overrideOptions.maxTokens ?? config.gemini?.max_tokens ?? 4096,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `Gemini Error ${response.status}`);
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return {
        text,
        provider: 'Google Gemini',
        model: modelToTry,
        isAutoSelected: configuredModel === 'auto' || modelToTry !== configuredModel,
      };
    } catch (err) {
      console.warn(`Gemini model ${modelToTry} attempt failed: ${err.message}. Auto-switching to next candidate model...`);
      lastError = err;
    }
  }

  throw lastError || new Error('Gemini generation failed on all available models.');
}

/**
 * Executes OpenRouter call with intelligent auto-model resolution
 */
async function callOpenRouter(prompt, config, overrideOptions = {}) {
  const key = overrideOptions.apiKey || config.openrouter?.api_key;
  if (!key?.trim()) throw new Error('OpenRouter API key is not configured in AI Settings.');

  let configuredModel = overrideOptions.model || config.openrouter?.model || 'auto';
  if (configuredModel === 'custom') configuredModel = config.openrouter?.custom_model || 'google/gemini-2.5-flash';

  // Candidate models sequence
  let candidateModels = [configuredModel];
  if (configuredModel === 'auto') {
    candidateModels = [
      'google/gemini-2.5-flash',
      'anthropic/claude-3.7-sonnet',
      'openai/gpt-4o-mini',
      'deepseek/deepseek-chat',
    ];
  } else if (configuredModel === 'auto_free') {
    candidateModels = [
      'google/gemini-2.0-flash-exp:free',
      'deepseek/deepseek-r1:free',
      'meta-llama/llama-3.3-70b-instruct:free',
    ];
  }

  let lastError = null;
  for (const modelToTry of candidateModels) {
    try {
      const endpoint = 'https://openrouter.ai/api/v1/chat/completions';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key.trim()}`,
          'HTTP-Referer': config.openrouter?.site_url || 'https://marvelslice.com',
          'X-Title': config.openrouter?.site_name || 'Marvel Slice Academy',
        },
        body: JSON.stringify({
          model: modelToTry,
          messages: [{ role: 'user', content: prompt }],
          temperature: overrideOptions.temperature ?? config.openrouter?.temperature ?? 0.7,
          max_tokens: overrideOptions.maxTokens ?? config.openrouter?.max_tokens ?? 4096,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `OpenRouter Error ${response.status}`);
      }

      const text = data?.choices?.[0]?.message?.content || '';
      return {
        text,
        provider: 'OpenRouter',
        model: modelToTry,
        isAutoSelected: configuredModel === 'auto' || configuredModel === 'auto_free',
      };
    } catch (err) {
      console.warn(`OpenRouter model ${modelToTry} attempt failed: ${err.message}. Trying next candidate...`);
      lastError = err;
    }
  }

  throw lastError || new Error('OpenRouter generation failed.');
}

/**
 * Unified generation based on platform chosen by the user
 */
export async function generateContentWithAI(prompt, options = {}) {
  const config = await getAIConfig();
  const provider = options.provider || config.active_provider || 'gemini';

  if (provider === 'disabled') {
    throw new Error('AI generation is disabled in AI Settings.');
  }

  if (provider === 'gemini') {
    return await callGemini(prompt, config, options);
  }

  if (provider === 'openrouter') {
    return await callOpenRouter(prompt, config, options);
  }

  throw new Error(`Unknown AI Platform: ${provider}`);
}
