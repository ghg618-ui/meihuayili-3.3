/**
 * Divination History Storage
 * 本地 localStorage + 云端同步
 */
import makeLogger from '../utils/logger.js';

const log = makeLogger('History');

const API_BASE = 'https://api.meihuayili.com';

export function getUserHistoryKey(userName) {
    return userName ? `meihua_history_${userName}` : null;
}

export function loadHistory(userName) {
    const key = getUserHistoryKey(userName);
    if (!key) return [];
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (e) {
        log.error('Failed to load history', e);
        return [];
    }
}

export function saveHistory(userName, history) {
    const key = getUserHistoryKey(userName);
    if (!key) return;
    try {
        localStorage.setItem(key, JSON.stringify(history));
    } catch (e) {
        // Storage quota exceeded — trim oldest records and retry
        log.warn('Storage quota exceeded, trimming old records');
        while (history.length > 3) {
            history.pop();
            try {
                localStorage.setItem(key, JSON.stringify(history));
                return;
            } catch (_) { /* keep trimming */ }
        }
        throw e;
    }
    // 异步同步到云端（不阻塞本地操作）
    syncHistoryToCloud(userName, history);
}

export function addHistoryRecord(userName, record) {
    const history = loadHistory(userName);
    history.unshift(record);
    if (history.length > 50) history.pop();
    saveHistory(userName, history);
    return history;
}

export function deleteHistoryRecord(userName, recordId) {
    let history = loadHistory(userName);
    history = history.filter(r => String(r.id) !== String(recordId));
    saveHistory(userName, history);
    return history;
}

// ===== 云端同步 =====

/** 把本地历史上传到服务器 */
function syncHistoryToCloud(userName, records) {
    fetch(`${API_BASE}/api/history/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userName, records }),
    }).catch(e => log.warn('云端同步失败', e));
}

/** 登录后从服务器拉取历史，与本地合并（去重） */
export async function mergeCloudHistory(userName) {
    try {
        const resp = await fetch(`${API_BASE}/api/history/load?username=${encodeURIComponent(userName)}`);
        const data = await resp.json();
        if (!data.success || !data.records?.length) return loadHistory(userName);

        const local = loadHistory(userName);
        const localIds = new Set(local.map(r => String(r.id)));
        // 云端有而本地没有的记录追加进来
        for (const r of data.records) {
            if (!localIds.has(String(r.id))) {
                local.push(r);
            }
        }
        // 按时间倒序
        local.sort((a, b) => (b.id || 0) - (a.id || 0));
        if (local.length > 50) local.length = 50;
        // 保存合并结果
        const key = getUserHistoryKey(userName);
        if (key) localStorage.setItem(key, JSON.stringify(local));
        return local;
    } catch (e) {
        log.warn('拉取云端历史失败', e);
        return loadHistory(userName);
    }
}

// ============================================
// Feedback Storage (Self-Iteration Learning)
// ============================================
const FEEDBACK_KEY_PREFIX = 'meihua_feedback_';
const MAX_FEEDBACK = 30;

export function loadFeedback(userName) {
    if (!userName) return [];
    try {
        return JSON.parse(localStorage.getItem(FEEDBACK_KEY_PREFIX + userName) || '[]');
    } catch (e) {
        log.error('Failed to load feedback', e);
        return [];
    }
}

export function saveFeedback(userName, feedbackList) {
    if (!userName) return;
    try {
        localStorage.setItem(FEEDBACK_KEY_PREFIX + userName, JSON.stringify(feedbackList));
    } catch (e) {
        log.warn('Feedback storage quota exceeded, trimming');
        while (feedbackList.length > 5) {
            feedbackList.pop();
            try {
                localStorage.setItem(FEEDBACK_KEY_PREFIX + userName, JSON.stringify(feedbackList));
                return;
            } catch (_) { /* keep trimming */ }
        }
    }
}

export function addFeedbackRecord(userName, record) {
    const list = loadFeedback(userName);
    list.unshift(record);
    if (list.length > MAX_FEEDBACK) list.pop();
    saveFeedback(userName, list);
    return list;
}
