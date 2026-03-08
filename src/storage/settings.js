/**
 * Provider & Model Settings Storage
 */

// ⚠️ 运营密钥（临时方案）——在下方填入您的硅基流动 API Key
// 注意：前端代码可通过 F12 查看，请务必在硅基流动后台设置每日消费限额防止滥用
const _BUILTIN_KEY = '';  // 👈 在此填入 sk-xxxx 密钥

export const PROVIDER_DEFAULTS = {
    deepseek: { endpoint: 'https://api.deepseek.com/chat/completions' },
    kimi: { endpoint: 'https://api.moonshot.cn/v1/chat/completions' },
    qwen: { endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions' },
    gemini: { endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions' },
    siliconflow: { endpoint: 'https://api.siliconflow.cn/v1/chat/completions' },
};

export const MODEL_REGISTRY = {
    'deepseek-combined': {
        provider: 'deepseek',
        model: 'deepseek-reasoner',
        label: '推演引擎 · 主线',
        supportsReasoning: true,
    },
    'sf-deepseek-r1': {
        provider: 'siliconflow',
        model: 'deepseek-ai/DeepSeek-R1',
        label: '推演引擎 · 备线',
        supportsReasoning: true,
    },
    'sf-qwen3-5': {
        provider: 'siliconflow',
        model: 'Qwen/Qwen3.5-397B-A17B',
        label: '推演引擎 · 增强',
        supportsReasoning: true,
    }
};

export function loadProviderConfigs() {
    try {
        const saved = localStorage.getItem('meihua_provider_configs');
        const configs = saved ? JSON.parse(saved) : {};

        // Ensure endpoint defaults exist
        if (!configs.deepseek?.endpoint) {
            configs.deepseek = { ...configs.deepseek, endpoint: PROVIDER_DEFAULTS.deepseek.endpoint };
        }
        if (!configs.siliconflow?.endpoint) {
            configs.siliconflow = { ...configs.siliconflow, endpoint: PROVIDER_DEFAULTS.siliconflow.endpoint };
        }

        // 如果用户未自行配置 siliconflow key，使用内置运营密钥
        if (!configs.siliconflow?.key && _BUILTIN_KEY) {
            configs.siliconflow = { ...configs.siliconflow, key: _BUILTIN_KEY };
        }

        return configs;
    } catch (e) {
        return {};
    }
}

/**
 * Check if any provider has a valid API key configured
 */
export function hasAnyApiKey() {
    if (_BUILTIN_KEY) return true; // 有内置密钥时始终可用
    const configs = loadProviderConfigs();
    return Object.values(configs).some(c => c?.key && c.key.trim().length > 0);
}

export function saveProviderConfigs(configs) {
    localStorage.setItem('meihua_provider_configs', JSON.stringify(configs));
}

export function getSelectedModel() {
    const saved = localStorage.getItem('selected_model');
    if (saved && MODEL_REGISTRY[saved]) {
        return saved;
    }
    return 'sf-deepseek-r1';
}

export function setSelectedModel(modelKey) {
    localStorage.setItem('selected_model', modelKey);
}
