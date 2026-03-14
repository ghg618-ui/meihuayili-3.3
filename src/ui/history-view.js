/**
 * History List View
 * 左滑 → 删除按钮，右滑 → 打开按钮，轻触不做任何操作
 */
import { $, $$, escapeHtml } from '../utils/dom.js';

export function renderHistoryList(container, history, currentId, onSelect, onDelete) {
    if (!container) return;

    if (history.length === 0) {
        container.innerHTML = '<div class="history-empty">暂无回响，请先起卦</div>';
        return;
    }

    const SWIPE_WIDTH = 60;

    container.innerHTML = history.map(item => {
        const name = item.result?.original?.name || '未知卦象';
        const time = (item.timestamp || '').split(' ')[0] || '';
        return `
        <div class="history-item ${String(currentId) === String(item.id) ? 'active' : ''}" data-id="${item.id}">
            <button class="history-open-btn" type="button">打开</button>
            <div class="history-item-surface">
                <div class="history-item-top">
                    <span class="history-item-name">${escapeHtml(name)}</span>
                    <span class="history-item-time" style="font-size: 0.75rem; color: var(--text-tertiary); font-weight: normal;">${escapeHtml(time)}</span>
                </div>
                <div class="history-item-desc">${escapeHtml(item.question || '未设问')}</div>
            </div>
            <button class="history-delete-btn" type="button" title="删除记录">删除</button>
        </div>
    `;
    }).join('');

    // --- Swipe interaction ---
    // States: default | swiped-left (delete visible) | swiped-right (open visible)
    let openedItem = null;
    let openedDir = null; // 'left' | 'right'

    const closeOpenedItem = () => {
        if (!openedItem) return;
        const s = openedItem.querySelector('.history-item-surface');
        openedItem.classList.remove('swiped-left', 'swiped-right');
        if (s) s.style.transform = '';
        const delBtn = openedItem.querySelector('.history-delete-btn');
        if (delBtn) { delBtn.dataset.confirming = 'false'; delBtn.textContent = '删除'; }
        openedItem = null;
        openedDir = null;
    };

    container.querySelectorAll('.history-item').forEach(el => {
        let startX = null;
        let startY = 0;
        let deltaX = 0;
        let dragging = false;
        const surface = el.querySelector('.history-item-surface');

        const setOffset = (px) => {
            if (surface) surface.style.transform = `translateX(${px}px)`;
        };

        // Tap on the surface area → close any opened item, nothing else
        el.addEventListener('click', (e) => {
            if (e.target.closest('.history-delete-btn') || e.target.closest('.history-open-btn')) return;
            if (openedItem) closeOpenedItem();
        });

        el.addEventListener('pointerdown', (e) => {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            if (openedItem && openedItem !== el) closeOpenedItem();
            startX = e.clientX;
            startY = e.clientY;
            deltaX = 0;
            dragging = false;
        });

        el.addEventListener('pointermove', (e) => {
            if (startX === null) return;
            deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            // Need clear horizontal intent (> 18px) before entering drag mode
            if (!dragging && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 18) {
                dragging = true;
            }
            if (!dragging) return;
            e.preventDefault();

            const isSwipedLeft = el.classList.contains('swiped-left');
            const isSwipedRight = el.classList.contains('swiped-right');

            if (isSwipedLeft) {
                // Currently showing delete, allow dragging back toward 0
                setOffset(Math.max(-SWIPE_WIDTH, Math.min(0, -SWIPE_WIDTH + deltaX)));
            } else if (isSwipedRight) {
                // Currently showing open, allow dragging back toward 0
                setOffset(Math.min(SWIPE_WIDTH, Math.max(0, SWIPE_WIDTH + deltaX)));
            } else {
                // Neutral state: clamp between -SWIPE_WIDTH and +SWIPE_WIDTH
                setOffset(Math.max(-SWIPE_WIDTH, Math.min(SWIPE_WIDTH, deltaX)));
            }
        });

        const finishSwipe = () => {
            if (startX === null) return;
            if (!dragging) { startX = null; deltaX = 0; return; }

            const isSwipedLeft = el.classList.contains('swiped-left');
            const isSwipedRight = el.classList.contains('swiped-right');
            const threshold = 32;

            if (!isSwipedLeft && !isSwipedRight) {
                // From neutral
                if (deltaX < -threshold) {
                    // Left swipe → show delete
                    el.classList.add('swiped-left');
                    setOffset(-SWIPE_WIDTH);
                    openedItem = el; openedDir = 'left';
                } else if (deltaX > threshold) {
                    // Right swipe → show open
                    el.classList.add('swiped-right');
                    setOffset(SWIPE_WIDTH);
                    openedItem = el; openedDir = 'right';
                } else {
                    setOffset(0);
                }
            } else if (isSwipedLeft) {
                if (deltaX > 22) { closeOpenedItem(); } else { setOffset(-SWIPE_WIDTH); }
            } else if (isSwipedRight) {
                if (deltaX < -22) { closeOpenedItem(); } else { setOffset(SWIPE_WIDTH); }
            }

            startX = null; deltaX = 0; dragging = false;
        };

        el.addEventListener('pointerup', finishSwipe);
        el.addEventListener('pointercancel', () => {
            const isLeft = el.classList.contains('swiped-left');
            const isRight = el.classList.contains('swiped-right');
            setOffset(isLeft ? -SWIPE_WIDTH : isRight ? SWIPE_WIDTH : 0);
            startX = null; deltaX = 0; dragging = false;
        });

        // --- Open button ---
        const openBtn = el.querySelector('.history-open-btn');
        if (openBtn) {
            openBtn.onclick = (e) => {
                e.stopPropagation();
                const id = el.dataset.id;
                closeOpenedItem();
                if (onSelect) onSelect(id);
            };
        }

        // --- Delete button ---
        const delBtn = el.querySelector('.history-delete-btn');
        if (delBtn) {
            delBtn.onclick = (e) => {
                e.stopPropagation();
                const id = el.dataset.id;
                if (delBtn.dataset.confirming === 'true') {
                    closeOpenedItem();
                    if (onDelete) onDelete(id);
                } else {
                    delBtn.dataset.confirming = 'true';
                    delBtn.textContent = '确认';
                    setTimeout(() => {
                        delBtn.dataset.confirming = 'false';
                        delBtn.textContent = '删除';
                    }, 3000);
                }
            };
        }
    });
}
