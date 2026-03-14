/**
 * Shared Application State
 * Central state object accessible by all controllers
 */
const state = {
    currentUser: null,
    history: [],
    currentResult: null,
    lastRecordId: null,
    selectedModelKey: 'sf-deepseek-r1',
    selectedMode: 'simple',  // 默认简化版，管理员/付费用户可切换到'pro'
    modelAnalyses: [],
    currentAbortController: null,
    isPaused: false,
    stopCurrentThinkingProgress: null,  // cleanup fn for the active thinking timer
    // For continue-after-stop
    interruptedCtx: null,  // { targetEl, messages, partialContent, partialReasoning, question, renderHistory }
    // For comparison (model switch)
    lastAnalysisCtx: null,  // { msgEl, modelKey, question }
    pendingModelComparison: false
};

export default state;
