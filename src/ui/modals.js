/**
 * Modal Management
 */
import { $ } from '../utils/dom.js';

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export function openModal(id) {
    const el = $(`#${id}`);
    if (el) {
        el.classList.remove('hidden');
    }
}

export function closeModal(id) {
    const el = $(`#${id}`);
    if (el) {
        el.classList.add('hidden');
    }
}

export function initModals() {
    // 修复 iOS/微信 Autofill 后输入框无法再次点击弹出的 Bug (WebKit 触控错位以及重绘丢失问题)
    if (isIOS) {
        document.addEventListener('focusout', (e) => {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
                // 当输入框失去焦点（比如因密码管理器自动填充完成而关闭键盘）时，强制重绘页面修正触控点击位置
                setTimeout(() => {
                    window.scrollTo({ left: window.scrollX, top: window.scrollY, behavior: 'auto' });
                }, 100);
            }
        });

        document.addEventListener('touchstart', (e) => {
            const t = e.target;
            // 如果点中了输入框，强制聚焦并恢复可能假死的光标
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) {
                if (document.activeElement === t) {
                    return;
                }
                // 确保层级或失焦再聚焦能够重新触发键盘
                setTimeout(() => t.focus(), 10);
            }
        }, { passive: true });
    }

    // Global close button listener
    document.addEventListener('click', (e) => {
        if (e.target.matches('.modal-bg') || e.target.matches('.btn-close-modal')) {
            const modal = e.target.closest('.modal-container');
            if (modal) modal.classList.add('hidden');
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const visibleModals = document.querySelectorAll('.modal-container:not(.hidden)');
            visibleModals.forEach(m => m.classList.add('hidden'));
        }
    });
}
