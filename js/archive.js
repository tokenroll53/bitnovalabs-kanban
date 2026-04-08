/* Bitnova Kanban — archive: archive view rendering and archive operations */

import { getCards, getArchivedCards } from './state.js';
import { escHtml, formatDate, toast } from './ui.js';
import { firestoreArchiveCard, firestoreRestoreCard, firestoreDeleteArchived } from './firestore.js';
import { renderLabels, renderAssigneeNames, getChecklistProgress, findColumn } from './board.js';
import { closeModal } from './modal.js';

export function renderArchive() {
  const view = document.getElementById('archiveView');
  const archivedCards = getArchivedCards();
  const archiveSearchEl = view.querySelector('input[type="text"]');
  const archiveSearch = archiveSearchEl ? archiveSearchEl.value.toLowerCase() : '';
  const filtered = archivedCards.filter(c => {
    if (!archiveSearch) return true;
    return c.title.toLowerCase().includes(archiveSearch) || c.desc.toLowerCase().includes(archiveSearch) || (c.projectCode && c.projectCode.toLowerCase().includes(archiveSearch));
  });

  view.innerHTML = `
    <div class="archive-header-bar">
      <h2>📦 Tarjetas Archivadas</h2>
      <span class="archive-count">${archivedCards.length} tarjeta${archivedCards.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="archive-search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input type="text" placeholder="Buscar en archivo..." value="${escHtml(archiveSearch)}" oninput="renderArchive()">
    </div>
    ${filtered.length === 0 ? `
      <div class="archive-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>
        <p>${archivedCards.length === 0 ? 'No hay tarjetas archivadas aún.' : 'No se encontraron resultados.'}</p>
        <p style="font-size:12px;margin-top:6px;color:var(--text-muted)">Las tarjetas archivadas aparecerán aquí cuando las archives desde el tablero.</p>
      </div>
    ` : `
      <div class="archive-list">
        ${filtered.map(card => {
        const archDate = new Date(card.archivedAt);
        const dateStr = archDate.toLocaleDateString('es', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        const { done: checkDone, total: checkTotal, pct: pctRaw } = getChecklistProgress(card.checklist);
        const pct = Math.round(pctRaw);

        return `
          <div class="archive-item" id="arch-${card.id}">
            <div class="archive-item-header" onclick="toggleArchiveDetail('${card.id}')">
              <span class="archive-expand-icon" id="arch-icon-${card.id}">▶</span>
              <div class="card-labels" style="margin:0">
                ${renderLabels(card.labels)}
              </div>
              <span class="archive-item-title">${card.projectCode ? `<span style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted);margin-right:8px;letter-spacing:0.5px">${escHtml(card.projectCode)}</span>` : ''}${escHtml(card.title)}</span>
              <div class="archive-item-meta">
                <span class="archive-reason ${card.archiveReason}">${card.archiveReason === 'completed' ? '✅ Completada' : '⏸️ Suspendida'}</span>
                <span class="archive-date">${dateStr}</span>
              </div>
            </div>
            <div class="archive-detail" id="arch-detail-${card.id}">
              <div class="archive-detail-desc">${escHtml(card.desc) || '<em style="color:var(--text-muted)">Sin descripción</em>'}</div>
              <div class="archive-detail-grid">
                <div class="archive-detail-field">
                  <label>Código de Proyecto</label>
                  <span class="value" style="font-family:var(--font-mono);letter-spacing:0.5px">${card.projectCode ? escHtml(card.projectCode) : '—'}</span>
                </div>
                <div class="archive-detail-field">
                  <label>Columna al archivar</label>
                  <span class="value">${escHtml(card.columnNameAtArchive)}</span>
                </div>
                <div class="archive-detail-field">
                  <label>Prioridad</label>
                  <span class="value" style="text-transform:capitalize">${card.priority}</span>
                </div>
                <div class="archive-detail-field">
                  <label>Asignados</label>
                  <span class="value">${renderAssigneeNames(card.assignees)}</span>
                </div>
                <div class="archive-detail-field">
                  <label>Fecha límite</label>
                  <span class="value">${card.due ? formatDate(card.due) : '—'}</span>
                </div>
                <div class="archive-detail-field">
                  <label>Creada</label>
                  <span class="value">${card.created ? formatDate(card.created) : '—'}</span>
                </div>
                <div class="archive-detail-field">
                  <label>Checklist</label>
                  <span class="value">${checkTotal > 0 ? checkDone + '/' + checkTotal + ' (' + pct + '%)' : '—'}</span>
                </div>
              </div>
              ${checkTotal > 0 ? `
              <div class="archive-detail-checklist">
                ${card.checklist.map(item => `
                  <div class="ck-item">
                    <span class="${item.done ? 'ck-done' : 'ck-pending'}">${item.done ? '☑' : '☐'}</span>
                    <span class="${item.done ? 'done-text' : ''}">${escHtml(item.text)}</span>
                  </div>
                `).join('')}
              </div>` : ''}
              ${card.archiveNote ? `
              <div style="padding:10px 14px;background:var(--bg-card);border-radius:var(--radius-sm);margin-bottom:14px">
                <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);margin-bottom:4px">Nota de archivo</div>
                <div style="font-size:13px;color:var(--text-secondary)">${escHtml(card.archiveNote)}</div>
              </div>` : ''}
              <div class="archive-actions">
                <button class="btn" style="color:var(--accent-emerald);border-color:rgba(16,185,129,0.3)" onclick="restoreCard('${card.id}')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                  Restaurar al tablero
                </button>
                <button class="btn" style="color:var(--accent-rose);border-color:rgba(244,63,94,0.3)" onclick="deleteArchivedCard('${card.id}')">
                  Eliminar permanente
                </button>
              </div>
            </div>
          </div>`;
      }).join('')}
      </div>
    `}
  `;
}

export function promptArchive(cardId) {
  const card = getCards().find(c => c.id === cardId);
  if (!card) return;
  closeModal();

  const modal = document.getElementById('modalContent');
  modal.innerHTML = `
    <div class="modal-header">
      <h2>Archivar Tarjeta</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p style="font-size:14px;margin-bottom:16px;color:var(--text-secondary)">
        La tarjeta <strong>"${escHtml(card.title)}"</strong> será removida del tablero y guardada en el archivo. Podrás consultarla o restaurarla en cualquier momento.
      </p>
      <div class="modal-section">
        <div class="modal-section-title">Razón de archivo</div>
        <div style="display:flex;gap:8px">
          <button class="btn" id="arch-completed" onclick="selectArchiveReason(this,'completed')" style="flex:1;justify-content:center;border-color:var(--accent-emerald);color:var(--accent-emerald)">
            ✅ Completada
          </button>
          <button class="btn" id="arch-suspended" onclick="selectArchiveReason(this,'suspended')" style="flex:1;justify-content:center;border-color:var(--accent-amber);color:var(--accent-amber)">
            ⏸️ Suspendida
          </button>
        </div>
      </div>
      <div class="modal-section">
        <div class="modal-section-title">Nota de archivo (opcional)</div>
        <textarea class="modal-textarea" id="arch-note" placeholder="Razón adicional o contexto..." rows="2" maxlength="500"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" id="arch-confirm-btn" onclick="confirmArchive('${card.id}')" disabled style="opacity:0.5">Archivar</button>
    </div>
  `;
  document.getElementById('modalOverlay').classList.add('open');
  document.getElementById('modalContent').dataset.archiveReason = '';
}

export function selectArchiveReason(btn, reason) {
  document.getElementById('modalContent').dataset.archiveReason = reason;
  document.querySelectorAll('#arch-completed,#arch-suspended').forEach(b => {
    b.style.background = 'none';
  });
  btn.style.background = reason === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)';
  const confirmBtn = document.getElementById('arch-confirm-btn');
  confirmBtn.disabled = false;
  confirmBtn.style.opacity = '1';
}

export function confirmArchive(cardId) {
  const card = getCards().find(c => c.id === cardId);
  const reason = document.getElementById('modalContent').dataset.archiveReason;
  if (!card || !reason) return;

  const archivedCard = {
    ...JSON.parse(JSON.stringify(card)),
    archivedAt: new Date().toISOString(),
    archiveReason: reason,
    archiveNote: document.getElementById('arch-note')?.value?.trim() || '',
    columnAtArchive: card.column,
    columnNameAtArchive: findColumn(card.column)?.title || card.column,
  };

  firestoreArchiveCard(archivedCard);
  closeModal();
  toast(`📦 Tarjeta archivada como ${reason === 'completed' ? 'completada' : 'suspendida'}`);
}

export function restoreCard(cardId) {
  firestoreRestoreCard(cardId);
  toast('♻️ Tarjeta restaurada al tablero');
}

export function deleteArchivedCard(cardId) {
  if (!confirm('¿Eliminar permanentemente esta tarjeta del archivo?')) return;
  firestoreDeleteArchived(cardId);
  toast('🗑️ Tarjeta eliminada del archivo');
}

export function toggleArchiveDetail(cardId) {
  const detail = document.getElementById('arch-detail-' + cardId);
  const icon = document.getElementById('arch-icon-' + cardId);
  if (detail && icon) {
    detail.classList.toggle('open');
    icon.classList.toggle('open');
  }
}

// Expose to window — called via onclick in dynamically generated archive and modal HTML
window.renderArchive = renderArchive;
window.promptArchive = promptArchive;
window.selectArchiveReason = selectArchiveReason;
window.confirmArchive = confirmArchive;
window.restoreCard = restoreCard;
window.deleteArchivedCard = deleteArchivedCard;
window.toggleArchiveDetail = toggleArchiveDetail;
