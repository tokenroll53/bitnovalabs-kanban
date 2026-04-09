/* Bitnova Kanban — modal: card modal rendering and CRUD operations */

import { COLUMNS, LABELS, PRIORITIES } from './config.js';
import { getCards, getTeam } from './state.js';
import { escHtml, toast } from './ui.js';
import { firestoreSaveCard, firestoreDeleteCard } from './firestore.js';
import { findColumn, isWipExceeded } from './board.js';

export function renderCardModal(card, defaultCol = 'backlog') {
  const isNew = !card;
  const c = card || { title: '', desc: '', labels: [], assignees: [], priority: 'medium', projectCode: '', checklist: [], due: '', blocked: false, column: defaultCol, comments: 0, attachments: 0, created: new Date().toISOString().split('T')[0], type: 'dev' };

  const TEAM = getTeam();
  const modal = document.getElementById('modalContent');
  modal.innerHTML = `
    <div class="modal-header">
      <h2>${isNew ? 'Nueva Tarjeta' : 'Editar Tarjeta'}</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="modal-section">
        <div class="modal-row">
          <div style="flex:3">
            <div class="modal-section-title">Título</div>
            <input class="modal-input" id="m-title" value="${escHtml(c.title)}" placeholder="Título de la tarjeta..." maxlength="200">
          </div>
          <div style="flex:1">
            <div class="modal-section-title">Código de Proyecto</div>
            <input class="modal-input" id="m-projectcode" value="${escHtml(c.projectCode || '')}" placeholder="Ej: BNL-101" maxlength="20" style="font-family:var(--font-mono);letter-spacing:0.5px">
          </div>
        </div>
      </div>
      <div class="modal-section">
        <div class="modal-section-title">Descripción</div>
        <textarea class="modal-textarea" id="m-desc" placeholder="Describe la tarea o necesidad..." maxlength="3000">${escHtml(c.desc)}</textarea>
      </div>
      <div class="modal-section">
        <div class="modal-row">
          <div>
            <div class="modal-section-title">Columna</div>
            <select class="modal-select" id="m-column">
              ${COLUMNS.map(col => `<option value="${col.id}" ${c.column === col.id ? 'selected' : ''}>${col.title}</option>`).join('')}
            </select>
          </div>
          <div>
            <div class="modal-section-title">Prioridad</div>
            <select class="modal-select" id="m-priority">
              ${PRIORITIES.map(p => `<option value="${p}" ${c.priority === p ? 'selected' : ''}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>`).join('')}
            </select>
          </div>
          <div>
            <div class="modal-section-title">Fecha Límite</div>
            <input type="date" class="modal-input" id="m-due" value="${c.due}">
          </div>
        </div>
      </div>
      <div class="modal-section">
        <div class="modal-section-title">Etiquetas</div>
        <div class="modal-labels-picker">
          ${LABELS.map(l => `<span class="label-option ${l.class} ${c.labels.includes(l.id) ? 'selected' : ''}" data-label="${l.id}" onclick="this.classList.toggle('selected')">${l.name}</span>`).join('')}
        </div>
      </div>
      <div class="modal-section">
        <div class="modal-section-title">Asignados</div>
        <div class="modal-labels-picker">
          ${TEAM.map(t => `<span class="label-option ${c.assignees.includes(t.id) ? 'selected' : ''}" style="background:${t.color}22;color:${t.color}" data-member="${t.id}" onclick="this.classList.toggle('selected')">${escHtml(t.name)}</span>`).join('')}
        </div>
      </div>
      <div class="modal-section">
        <div class="modal-section-title">Checklist</div>
        <div class="checklist-items" id="m-checklist">
          ${c.checklist.map((item, i) => `
            <div class="checklist-item">
              <input type="checkbox" ${item.done ? 'checked' : ''} data-idx="${i}" onchange="this.nextElementSibling.classList.toggle('done',this.checked)">
              <span class="${item.done ? 'done' : ''}">${escHtml(item.text)}</span>
              <button class="remove-item" onclick="this.parentElement.remove()">✕</button>
            </div>
          `).join('')}
        </div>
        <div class="add-checklist-row" style="margin-top:8px">
          <input type="text" id="m-newcheck" placeholder="Nueva subtarea..." maxlength="200" onkeydown="if(event.key==='Enter')addChecklistItem()">
          <button class="btn" onclick="addChecklistItem()" style="flex-shrink:0">+ Agregar</button>
        </div>
      </div>
      <div class="modal-section">
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
          <input type="checkbox" id="m-blocked" ${c.blocked ? 'checked' : ''} style="accent-color:var(--accent-rose)">
          Marcar como bloqueada
        </label>
      </div>
    </div>
    <div class="modal-footer">
      ${!isNew ? `<button class="btn" style="margin-right:auto;color:var(--accent-rose);border-color:rgba(244,63,94,0.3)" onclick="deleteCard('${c.id}')">Eliminar</button>` : ''}
      ${!isNew ? `<button class="btn" style="color:var(--accent-amber);border-color:rgba(245,158,11,0.3)" onclick="promptArchive('${c.id}')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>
        Archivar
      </button>` : ''}
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveCard('${isNew ? '' : c.id}')">${isNew ? 'Crear' : 'Guardar'}</button>
    </div>
  `;

  document.getElementById('modalOverlay').classList.add('open');
}

export function addChecklistItem() {
  const input = document.getElementById('m-newcheck');
  const text = input.value.trim();
  if (!text) return;
  const container = document.getElementById('m-checklist');
  const div = document.createElement('div');
  div.className = 'checklist-item';
  div.innerHTML = `<input type="checkbox" onchange="this.nextElementSibling.classList.toggle('done',this.checked)"><span>${escHtml(text)}</span><button class="remove-item" onclick="this.parentElement.remove()">✕</button>`;
  container.appendChild(div);
  input.value = '';
}

export function saveCard(existingId) {
  const title = document.getElementById('m-title').value.trim();
  if (!title) { toast('⚠️ El título es obligatorio'); return; }

  const labels = [...document.querySelectorAll('.label-option.selected[data-label]')].map(e => e.dataset.label);
  const assignees = [...document.querySelectorAll('.label-option.selected[data-member]')].map(e => e.dataset.member);
  const checkItems = [...document.querySelectorAll('#m-checklist .checklist-item')].map(el => ({
    text: el.querySelector('span').textContent,
    done: el.querySelector('input[type="checkbox"]').checked
  }));
  const column = document.getElementById('m-column').value;

  // Check WIP
  const col = findColumn(column);
  if (isWipExceeded(col, column, existingId)) {
    toast(`⚠️ Límite WIP alcanzado en "${col.title}" (máx: ${col.wip})`);
    return;
  }

  const data = {
    title,
    desc: document.getElementById('m-desc').value.trim(),
    labels,
    assignees,
    priority: document.getElementById('m-priority').value,
    projectCode: document.getElementById('m-projectcode').value.trim().toUpperCase(),
    checklist: checkItems,
    due: document.getElementById('m-due').value,
    blocked: document.getElementById('m-blocked').checked,
    column,
    type: labels.includes('sales') ? 'sales' : 'dev',
  };

  if (existingId) {
    firestoreSaveCard({ id: existingId, ...data })
      .then(() => toast('✅ Tarjeta actualizada'))
      .catch(err => toast('❌ Error al guardar: ' + err.message));
  } else {
    const newId = 'c' + Date.now();
    firestoreSaveCard({ id: newId, ...data, comments: 0, attachments: 0, created: new Date().toISOString().split('T')[0] })
      .then(() => toast('✅ Tarjeta creada'))
      .catch(err => toast('❌ Error al crear: ' + err.message));
  }

  closeModal();
}

export function deleteCard(id) {
  if (!confirm('¿Eliminar esta tarjeta?')) return;
  firestoreDeleteCard(id);
  closeModal();
  toast('🗑️ Tarjeta eliminada');
}

export function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

// Expose to window — called via onclick in dynamically generated modal HTML
window.renderCardModal = renderCardModal;
window.saveCard = saveCard;
window.deleteCard = deleteCard;
window.closeModal = closeModal;
window.addChecklistItem = addChecklistItem;
