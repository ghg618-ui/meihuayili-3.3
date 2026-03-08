/**
 * User Auth & Registry Storage
 */
import { hashPassword } from '../utils/hashing.js';
import makeLogger from '../utils/logger.js';

const log = makeLogger('Auth');

export function getRegisteredUsers() {
    try {
        return JSON.parse(localStorage.getItem('meihua_users') || '{}');
    } catch (e) {
        log.error('Failed to parse users registry', e);
        return {};
    }
}

export function saveRegisteredUsers(users) {
    localStorage.setItem('meihua_users', JSON.stringify(users));
}

export function loginUser(name, password) {
    const users = getRegisteredUsers();
    const hp = hashPassword(password);
    const user = users[name];
    if (user && (user.password === hp || user.passwordHash === hp)) {
        const currentUser = { name };
        localStorage.setItem('meihua_current_user', JSON.stringify(currentUser));
        return currentUser;
    }
    return null;
}

export function registerUser(name, password) {
    const users = getRegisteredUsers();
    if (users[name]) return { error: '用户已存在' };

    users[name] = {
        name,
        password: hashPassword(password),
        created: new Date().toISOString()
    };
    saveRegisteredUsers(users);

    const user = { name };
    localStorage.setItem('meihua_current_user', JSON.stringify(user));
    return user;
}

export function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('meihua_current_user') || 'null');
    } catch (e) {
        return null;
    }
}

export function logoutUser() {
    localStorage.removeItem('meihua_current_user');
}

/**
 * 检查用户是否有专业版权限
 * 目前支持：管理员账户、付费用户（未来扩展）
 * @returns {boolean}
 */
export function hasProAccess() {
    const user = getCurrentUser();
    if (!user) return false;
    
    const users = getRegisteredUsers();
    const userData = users[user.name];
    if (!userData) return false;
    
    // 管理员白名单（可在这里添加管理员账号）
    const adminList = ['admin', 'gonghg'];  // 示例：管理员账号
    if (adminList.includes(user.name)) return true;
    
    // 检查是否是付费用户（未来扩展：检查订阅状态、到期时间等）
    if (userData.isPro || userData.subscription) {
        // 这里可以进一步检查订阅是否过期
        return true;
    }
    
    return false;
}
