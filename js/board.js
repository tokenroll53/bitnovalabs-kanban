/* Bitnova Kanban — board: board rendering and drag-drop */

import { COLUMNS, LABELS, PRIORITIES } from './config.js';
import {
  getCards, getTeam,
  getCurrentFilter, getSearchQuery, isSwimlaneEnabled,
} from './state.js';
import { getDueClass, formatDate, escHtml, toast } from './ui.js';
import { firestoreSaveCard } from './firestore.js';

// ====== RENDER BOARD ======
export function renderBoard() {
  const board = document.getElementById('board');
  board.innerHTML = '';

  COLUMNS.forEach(col => {
    const colCards = getFilteredCards(col.id);
    const isOverWip = isWipExceeded(col, col.id);

    const colEl = document.createElement('div');
    colEl.className = 'column';
    colEl.dataset.column = col.id;

    colEl.innerHTML = `
      <div class="column-header">
        <div class="column-indicator" style="background:${col.color}"></div>
        <div class="column-title">${col.title}</div>
        <span class="column-count ${isOverWip ? 'over-wip' : ''}">${colCards.length}</span>
        ${col.wip > 0 ? `<span class="wip-indicator">/ ${col.wip}</span>` : ''}
      </div>
      <div class="column-body" data-column="${col.id}"
        ondragover="handleDragOver(event)" ondrop="handleDrop(event, '${col.id}')"
        ondragenter="this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')">
      </div>
      <button class="add-card-btn" onclick="openNewCardModal('${col.id}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        Agregar tarjeta
      </button>
    `;

    const body = colEl.querySelector('.column-body');

    if (isSwimlaneEnabled()) {
      renderSwimlanes(body, colCards);
    } else {
      colCards.forEach(card => body.appendChild(createCardElement(card)));
    }

    board.appendChild(colEl);
  });
}

export function getFilteredCards(columnId) {
  const cards = getCards();
  const currentFilter = getCurrentFilter();
  const searchQuery = getSearchQuery();
  return cards.filter(c => {
    if (c.column !== columnId) return false;
    if (currentFilter !== 'all' && !c.labels.includes(currentFilter)) return false;
    if (searchQuery && !c.title.toLowerCase().includes(searchQuery) && !c.desc.toLowerCase().includes(searchQuery) && !(c.projectCode && c.projectCode.toLowerCase().includes(searchQuery))) return false;
    return true;
  });
}

export function renderSwimlanes(body, colCards) {
  const groups = { urgent: [], high: [], medium: [], low: [] };
  colCards.forEach(c => groups[c.priority]?.push(c));
  const names = { urgent: '🔴 Urgente / Expedite', high: '🟠 Alta', medium: '🟡 Media', low: '🟢 Baja' };

  for (const [pri, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    const section = document.createElement('div');
    section.className = 'swimlane-section';
    section.innerHTML = `
      <div class="swimlane-header" onclick="this.nextElementSibling.classList.toggle('collapsed');this.querySelector('.arrow').classList.toggle('collapsed')">
        <span class="arrow">▼</span>
        ${names[pri]} (${items.length})
      </div>
      <div class="swimlane-cards"></div>
    `;
    const container = section.querySelector('.swimlane-cards');
    items.forEach(card => container.appendChild(createCardElement(card)));
    body.appendChild(section);
  }
}

export function createCardElement(card) {
  const el = document.createElement('div');
  el.className = `card${card.blocked ? ' blocked' : ''}`;
  el.draggable = true;
  el.dataset.id = card.id;
  el.ondragstart = (e) => { e.dataTransfer.setData('text/plain', card.id); el.classList.add('dragging'); };
  el.ondragend = () => el.classList.remove('dragging');
  el.onclick = () => openCardDetail(card.id);

  const { done: checkDone, total: checkTotal, pct } = getChecklistProgress(card.checklist);
  const dueClass = getDueClass(card.due);
  const dueFormatted = formatDate(card.due);

  el.innerHTML = `
    <div class="card-priority-bar ${card.priority}"></div>
    <div class="card-labels">
      ${renderLabels(card.labels)}
      ${card.projectCode ? `<span class="card-project-code">${escHtml(card.projectCode)}</span>` : ''}
    </div>
    <div class="card-title">${escHtml(card.title)}</div>
    <div class="card-desc">${escHtml(card.desc)}</div>
    ${checkTotal > 0 ? `
    <div class="card-checklist">
      <div class="checklist-bar"><div class="checklist-fill" style="width:${pct}%"></div></div>
      <span class="checklist-text">${checkDone}/${checkTotal} completadas</span>
    </div>` : ''}
    <div class="card-footer">
      <div class="card-assignees">
        ${renderAssigneeAvatars(card.assignees)}
      </div>
      <div class="card-meta">
        ${card.comments > 0 ? `<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>${card.comments}</span>` : ''}
        ${card.attachments > 0 ? `<span class="meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>${card.attachments}</span>` : ''}
        <span class="card-due ${dueClass}">${dueFormatted}</span>
      </div>
    </div>
  `;
  return el;
}

// ====== HELPERS: LOOKUPS & RENDERING ======
export function findColumn(columnId) {
  return COLUMNS.find(c => c.id === columnId);
}

export function findTeamMember(memberId) {
  return getTeam().find(t => t.id === memberId);
}

export function renderLabels(labelIds) {
  return labelIds.map(l => {
    const lb = LABELS.find(x => x.id === l);
    return lb ? `<span class="label ${lb.class}">${lb.name}</span>` : '';
  }).join('');
}

export function renderAssigneeAvatars(assigneeIds) {
  return assigneeIds.map(a => {
    const m = findTeamMember(a);
    return m ? `<div class="avatar" style="background:${m.color}" title="${escHtml(m.name)}">${escHtml(m.name[0])}</div>` : '';
  }).join('');
}

export function renderAssigneeNames(assigneeIds) {
  return assigneeIds.map(a => escHtml(findTeamMember(a)?.name || a)).join(', ') || '—';
}

export function getChecklistProgress(checklist) {
  const done = checklist.filter(i => i.done).length;
  const total = checklist.length;
  return { done, total, pct: total > 0 ? done / total * 100 : 0 };
}

// ====== HELPERS: WIP ======
export function getColumnCards(columnId, excludeId = null) {
  return getCards().filter(c => c.column === columnId && (!excludeId || c.id !== excludeId));
}

export function isWipExceeded(col, columnId, excludeId = null) {
  return col.wip > 0 && getColumnCards(columnId, excludeId).length > col.wip;
}

// ====== DRAG & DROP ======
export function handleDragOver(e) { e.preventDefault(); }

export function handleDrop(e, columnId) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const cardId = e.dataTransfer.getData('text/plain');
  const card = getCards().find(c => c.id === cardId);
  if (!card) return;

  const col = findColumn(columnId);
  if (isWipExceeded(col, columnId) && card.column !== columnId) {
    toast(`⚠️ Límite WIP alcanzado en "${col.title}" (máx: ${col.wip})`);
    return;
  }

  card.column = columnId;
  firestoreSaveCard(card);
  toast(`Tarjeta movida a "${col.title}"`);
}

// ====== MODAL OPENERS ======
export function openNewCardModal(defaultCol = 'backlog') {
  // renderCardModal is in modal.js — imported there and also exposed globally
  window.renderCardModal(null, defaultCol);
}

export function openCardDetail(cardId) {
  const card = getCards().find(c => c.id === cardId);
  if (card) window.renderCardModal(card);
}

// Expose to window for onclick attributes in dynamically generated HTML
window.openNewCardModal = openNewCardModal;
window.openCardDetail = openCardDetail;
window.handleDragOver = handleDragOver;
window.handleDrop = handleDrop;
