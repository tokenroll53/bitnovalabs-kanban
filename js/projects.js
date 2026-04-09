/* Bitnova Kanban — projects: listing, CRUD, Firestore listener, export */

import { db } from './firebase.js';
import { getProjects, setProjects, getArchivedProjects, setArchivedProjects, getCurrentUser, getCurrentView } from './state.js';
import { escHtml, toast } from './ui.js';
import { PROJECT_TYPES, PROJECT_CODE_PREFIX, REUSE_PROJECT_CODE_GAPS } from './config.js';
import { renderCardModal } from './modal.js';
import { closeModal } from './modal.js';

// ====== FILTER STATE (module-level) ======
let _projectSearch = '';
let _selectedCodes = new Set();
let _projectsTab   = 'active'; // 'active' | 'archived'

export const getProjectSearch  = () => _projectSearch;
export const getSelectedCodes  = () => _selectedCodes;

// ====== CODE GENERATION ======

export async function generateProjectCode() {
  const yr = new Date().getFullYear() % 100;
  const prefix = `${PROJECT_CODE_PREFIX}${yr.toString().padStart(2, '0')}-`;

  try {
    const snapshot = await db.collection('projects')
      .orderBy('correlative', 'asc')
      .get();

    const thisYearDocs = snapshot.docs.filter(d => d.id.startsWith(prefix));

    if (thisYearDocs.length === 0) {
      return { code: `${prefix}01`, correlative: 1 };
    }

    if (REUSE_PROJECT_CODE_GAPS) {
      const used = new Set(thisYearDocs.map(d => d.data().correlative));
      let next = 1;
      while (used.has(next)) next++;
      return { code: `${prefix}${next.toString().padStart(2, '0')}`, correlative: next };
    } else {
      const max = Math.max(...thisYearDocs.map(d => d.data().correlative));
      const next = max + 1;
      return { code: `${prefix}${next.toString().padStart(2, '0')}`, correlative: next };
    }
  } catch {
    // Fallback if index not ready: use timestamp-based correlative
    const ts = Date.now() % 100;
    return { code: `${prefix}${ts.toString().padStart(2, '0')}`, correlative: ts };
  }
}

// ====== FIRESTORE LISTENER ======

export function startProjectsListener({ onProjectsUpdate }) {
  return db.collection('projects')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProjects(all.filter(p => !p.archived));
      setArchivedProjects(all.filter(p => p.archived));
      onProjectsUpdate();
    }, err => console.error('Firestore projects error:', err));
}

// ====== CRUD ======

export async function saveProject(data) {
  const ref = db.collection('projects').doc(data.code);
  return db.runTransaction(async tx => {
    const existing = await tx.get(ref);
    if (existing.exists && !data._isEdit) throw new Error('CODE_CONFLICT');
    tx.set(ref, data, { merge: !!data._isEdit });
  });
}

export async function deleteProject(code) {
  return db.collection('projects').doc(code).delete();
}

export async function batchDeleteProjects(codes) {
  const batch = db.batch();
  codes.forEach(code => batch.delete(db.collection('projects').doc(code)));
  return batch.commit();
}

export async function archiveProject(code, reason) {
  const user = getCurrentUser();
  return db.collection('projects').doc(code).update({
    archived: true,
    archivedAt: new Date().toISOString(),
    archivedBy: user?.displayName || user?.email || 'unknown',
    archiveReason: reason,
  });
}

export async function batchArchiveProjects(codes, reason) {
  const user = getCurrentUser();
  const batch = db.batch();
  const meta = {
    archived: true,
    archivedAt: new Date().toISOString(),
    archivedBy: user?.displayName || user?.email || 'unknown',
    archiveReason: reason,
  };
  codes.forEach(code => batch.update(db.collection('projects').doc(code), meta));
  return batch.commit();
}

export async function restoreProject(code) {
  return db.collection('projects').doc(code).update({
    archived: false,
    archivedAt: window.firebase.firestore.FieldValue.delete(),
    archivedBy: window.firebase.firestore.FieldValue.delete(),
    archiveReason: window.firebase.firestore.FieldValue.delete(),
  });
}

// Expose selected codes for inline onclick handlers in the selection bar
function _selectedProjectCodes() { return _selectedCodes; }
window._selectedProjectCodes = _selectedProjectCodes;

// ====== FILTERING ======

function getFilteredProjects() {
  const q = _projectSearch.toLowerCase();
  if (!q) return getProjects();
  return getProjects().filter(p =>
    (p.code       || '').toLowerCase().includes(q) ||
    (p.name       || '').toLowerCase().includes(q) ||
    (p.type       || '').toLowerCase().includes(q) ||
    (p.contact    || '').toLowerCase().includes(q) ||
    (p.salesman   || '').toLowerCase().includes(q) ||
    (p.teamLeader || '').toLowerCase().includes(q)
  );
}

// ====== HELPERS ======

function typeLabel(id) {
  return PROJECT_TYPES.find(t => t.id === id)?.label ?? id ?? '—';
}

function fmtDate(ts) {
  return ts?.toDate?.()?.toLocaleDateString('es') ?? '—';
}

// ====== RENDER ======

export function renderProjects() {
  const view = document.getElementById('projectsView');
  if (!view) return;

  if (_projectsTab === 'archived') {
    _renderArchivedProjectsView(view);
  } else {
    _renderActiveProjectsView(view);
  }
}

function _renderActiveProjectsView(view) {
  const projects = getFilteredProjects();
  const total    = getProjects().length;

  view.innerHTML = `
    ${renderProjectsHeaderBar(total)}
    ${renderProjectsToolbarHTML()}
    <div class="projects-selection-bar${_selectedCodes.size ? ' visible' : ''}" id="projectsSelectionBar">
      <span class="projects-selection-count">${_selectedCodes.size} proyecto${_selectedCodes.size !== 1 ? 's' : ''} seleccionado${_selectedCodes.size !== 1 ? 's' : ''}</span>
      <button class="btn" onclick="clearProjectSelection()">Deseleccionar todo</button>
      <button class="btn" style="background:rgba(245,158,11,0.08);border-color:rgba(245,158,11,0.25);color:var(--accent-amber)"
        onclick="confirmArchiveProjects([..._selectedProjectCodes()])">Archivar seleccionados</button>
      <button class="btn" style="background:rgba(244,63,94,0.08);border-color:rgba(244,63,94,0.25);color:var(--accent-rose)"
        onclick="confirmBatchDelete()">Eliminar seleccionados</button>
    </div>
    <div class="projects-table-wrapper">
      ${projects.length ? renderProjectsTableHTML(projects) : renderProjectsEmptyHTML()}
    </div>
  `;

  // Wire search after render
  const searchInput = document.getElementById('projectSearchInput');
  if (searchInput) {
    searchInput.value = _projectSearch;
    searchInput.addEventListener('input', () => {
      _projectSearch = searchInput.value;
      renderProjects();
    });
  }
}

function _renderArchivedProjectsView(view) {
  const archived = getArchivedProjects();
  view.innerHTML = `
    ${renderProjectsHeaderBar(getProjects().length)}
    <div class="projects-table-wrapper">
      ${archived.length ? renderArchivedProjectsTableHTML(archived) : renderProjectsEmptyHTML('archived')}
    </div>
  `;
}

function renderProjectsHeaderBar(activeTotal) {
  const archivedTotal = getArchivedProjects().length;
  const isActive      = _projectsTab === 'active';
  return `
    <div class="projects-header-bar">
      <div style="display:flex;align-items:center;gap:12px">
        <h2>Proyectos</h2>
        <div class="projects-tab-toggle">
          <button class="projects-tab-btn${isActive ? ' active' : ''}"
            onclick="switchProjectsTab('active')">
            Activos<span class="tab-count">${activeTotal}</span>
          </button>
          <button class="projects-tab-btn${!isActive ? ' active' : ''}"
            onclick="switchProjectsTab('archived')">
            Archivados<span class="tab-count">${archivedTotal}</span>
          </button>
        </div>
      </div>
      ${isActive ? `
      <div style="display:flex;gap:8px">
        <button class="btn" onclick="exportProjectsCSV()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          CSV
        </button>
        <button class="btn" onclick="exportProjectsJSON()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          JSON
        </button>
        <button class="btn btn-primary" onclick="openNewProjectModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Nuevo Proyecto
        </button>
      </div>
      ` : ''}
    </div>
  `;
}

window.switchProjectsTab = function(tab) {
  _projectsTab = tab;
  _projectSearch = '';
  _selectedCodes.clear();
  renderProjects();
};

function renderProjectsToolbarHTML() {
  return `
    <div class="projects-toolbar">
      <div class="projects-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input type="text" id="projectSearchInput" placeholder="Buscar por código, nombre, tipo, contacto, vendedor…">
      </div>
    </div>
  `;
}

function renderProjectsTableHTML(projects) {
  const allSelected = projects.length > 0 && projects.every(p => _selectedCodes.has(p.code));
  return `
    <table class="projects-table">
      <thead>
        <tr>
          <th class="col-check">
            <input type="checkbox" id="projectSelectAll" ${allSelected ? 'checked' : ''}
              onchange="toggleSelectAllProjects()">
          </th>
          <th>Código</th>
          <th>Nombre</th>
          <th>Tipo</th>
          <th>Contacto</th>
          <th class="col-phone">Teléfono</th>
          <th class="col-email">E-mail</th>
          <th>Vendedor</th>
          <th>Team Leader</th>
          <th>Creado</th>
          <th class="col-action" title="Crear tarjeta"></th>
        </tr>
      </thead>
      <tbody>
        ${projects.map(p => renderProjectRowHTML(p)).join('')}
      </tbody>
    </table>
  `;
}

function renderProjectRowHTML(p) {
  const sel = _selectedCodes.has(p.code);
  return `
    <tr class="${sel ? 'selected' : ''}">
      <td class="col-check">
        <input type="checkbox" ${sel ? 'checked' : ''}
          onchange="toggleProjectSelection('${escHtml(p.code)}')">
      </td>
      <td><span class="project-code-badge">${escHtml(p.code)}</span></td>
      <td class="project-name-cell">${escHtml(p.name || '—')}</td>
      <td><span class="project-type-badge">${escHtml(typeLabel(p.type))}</span></td>
      <td>${escHtml(p.contact || '—')}</td>
      <td class="col-phone">${escHtml(p.phone || '—')}</td>
      <td class="col-email">${escHtml(p.email || '—')}</td>
      <td>${escHtml(p.salesman || '—')}</td>
      <td>${escHtml(p.teamLeader || '—')}</td>
      <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${fmtDate(p.createdAt)}</td>
      <td class="col-action">
        <button class="project-link-btn" title="Crear tarjeta para este proyecto"
          onclick="openCardFromProject('${escHtml(p.code)}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>
        <button class="project-archive-btn" title="Archivar proyecto"
          onclick="confirmArchiveProjects(['${escHtml(p.code)}'])">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/>
          </svg>
        </button>
      </td>
    </tr>
  `;
}

function renderProjectsEmptyHTML(tab = 'active') {
  const msg = tab === 'archived'
    ? 'No hay proyectos archivados.'
    : (_projectSearch ? 'No hay proyectos que coincidan con la búsqueda.' : 'Todavía no hay proyectos. Creá el primero.');
  return `
    <div class="projects-empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>
      ${msg}
    </div>
  `;
}

function renderArchivedProjectsTableHTML(projects) {
  const reasonLabel = { completed: 'Completado', cancelled: 'Cancelado' };
  return `
    <table class="projects-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Nombre</th>
          <th>Tipo</th>
          <th>Motivo</th>
          <th>Archivado por</th>
          <th>Fecha</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>
        ${projects.map(p => {
          const reason = p.archiveReason || '';
          const label  = reasonLabel[reason] || reason;
          const date   = p.archivedAt ? new Date(p.archivedAt).toLocaleDateString('es') : '—';
          return `
            <tr>
              <td><span class="project-code-badge">${escHtml(p.code)}</span></td>
              <td class="project-name-cell">${escHtml(p.name || '—')}</td>
              <td><span class="project-type-badge">${escHtml(typeLabel(p.type))}</span></td>
              <td><span class="project-archive-reason ${escHtml(reason)}">${escHtml(label)}</span></td>
              <td>${escHtml(p.archivedBy || '—')}</td>
              <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${date}</td>
              <td class="col-action" style="width:auto;text-align:right;padding-right:14px">
                <button class="btn-restore-project" onclick="restoreProjectAction('${escHtml(p.code)}')">
                  Restaurar
                </button>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// ====== SELECTION ======

window.toggleProjectSelection = function(code) {
  if (_selectedCodes.has(code)) {
    _selectedCodes.delete(code);
  } else {
    _selectedCodes.add(code);
  }
  renderProjects();
};

window.toggleSelectAllProjects = function() {
  const projects = getFilteredProjects();
  const allSelected = projects.every(p => _selectedCodes.has(p.code));
  if (allSelected) {
    projects.forEach(p => _selectedCodes.delete(p.code));
  } else {
    projects.forEach(p => _selectedCodes.add(p.code));
  }
  renderProjects();
};

window.clearProjectSelection = function() {
  _selectedCodes.clear();
  renderProjects();
};

// ====== DELETE WITH CONFIRMATION ======

window.confirmBatchDelete = function() {
  if (_selectedCodes.size === 0) return;

  const codes = [..._selectedCodes];
  const projects = getProjects();
  const list = codes.map(code => {
    const p = projects.find(x => x.code === code);
    return `<li style="margin:4px 0;color:var(--text-secondary)">
      <span class="project-code-badge">${escHtml(code)}</span>
      ${p ? ' — ' + escHtml(p.name) : ''}
    </li>`;
  }).join('');

  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <div class="modal-header">
      <h2>Eliminar proyectos</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p style="color:var(--text-secondary);margin-bottom:12px">
        ¿Eliminar ${codes.length} proyecto${codes.length !== 1 ? 's' : ''}?
        Esta acción <strong style="color:var(--accent-rose)">no se puede deshacer</strong>.
      </p>
      <ul style="list-style:none;padding:0;margin:0 0 8px">
        ${list}
      </ul>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn" style="background:rgba(244,63,94,0.15);border-color:rgba(244,63,94,0.4);color:var(--accent-rose)"
        onclick="executeBatchDelete()">Eliminar</button>
    </div>
  `;
  overlay.classList.add('active');
};

window.executeBatchDelete = async function() {
  const codes = [..._selectedCodes];
  try {
    await batchDeleteProjects(codes);
    _selectedCodes.clear();
    closeModal();
    toast(`🗑️ ${codes.length} proyecto${codes.length !== 1 ? 's' : ''} eliminado${codes.length !== 1 ? 's' : ''}`);
  } catch {
    toast('❌ Error al eliminar. Intentá de nuevo.');
  }
};

// ====== ARCHIVE / RESTORE ======

window.confirmArchiveProjects = function(codes) {
  if (!codes || codes.length === 0) return;

  const projects = getProjects();
  const list = codes.map(code => {
    const p = projects.find(x => x.code === code);
    return `<li style="margin:4px 0;color:var(--text-secondary)">
      <span class="project-code-badge">${escHtml(code)}</span>
      ${p ? ' — ' + escHtml(p.name) : ''}
    </li>`;
  }).join('');

  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  content.dataset.archiveCodes = JSON.stringify(codes);
  content.dataset.archiveReason = '';

  content.innerHTML = `
    <div class="modal-header">
      <h2>Archivar proyecto${codes.length !== 1 ? 's' : ''}</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p style="color:var(--text-secondary);margin-bottom:12px">
        ¿Archivar ${codes.length} proyecto${codes.length !== 1 ? 's' : ''}?
      </p>
      <ul style="list-style:none;padding:0;margin:0 0 20px">
        ${list}
      </ul>
      <div class="modal-section-title" style="margin-bottom:8px">Motivo</div>
      <div style="display:flex;gap:8px">
        <button class="archive-reason-pill" data-reason="completed"
          onclick="selectProjectArchiveReason(this,'completed')">
          Completado
        </button>
        <button class="archive-reason-pill" data-reason="cancelled"
          onclick="selectProjectArchiveReason(this,'cancelled')">
          Cancelado
        </button>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn" id="archiveConfirmBtn" disabled
        style="background:rgba(245,158,11,0.15);border-color:rgba(245,158,11,0.4);color:var(--accent-amber)"
        onclick="executeArchiveProjects()">
        Archivar
      </button>
    </div>
  `;
  overlay.classList.add('active');
};

window.selectProjectArchiveReason = function(btn, reason) {
  document.querySelectorAll('.archive-reason-pill').forEach(p => p.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('modalContent').dataset.archiveReason = reason;
  document.getElementById('archiveConfirmBtn').disabled = false;
};

window.executeArchiveProjects = async function() {
  const content = document.getElementById('modalContent');
  const codes  = JSON.parse(content.dataset.archiveCodes || '[]');
  const reason = content.dataset.archiveReason;
  if (!codes.length || !reason) return;

  const btn = document.getElementById('archiveConfirmBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Archivando…'; }

  try {
    await batchArchiveProjects(codes, reason);
    _selectedCodes.clear();
    closeModal();
    toast(`📦 ${codes.length} proyecto${codes.length !== 1 ? 's' : ''} archivado${codes.length !== 1 ? 's' : ''}`);
  } catch {
    if (btn) { btn.disabled = false; btn.textContent = 'Archivar'; }
    toast('❌ Error al archivar. Intentá de nuevo.');
  }
};

window.restoreProjectAction = async function(code) {
  try {
    await restoreProject(code);
    toast(`✅ Proyecto ${code} restaurado`);
  } catch {
    toast('❌ Error al restaurar. Intentá de nuevo.');
  }
};

// ====== NEW / EDIT PROJECT MODAL ======

export function openNewProjectModal() {
  _renderProjectForm(null);
}

window.openNewProjectModal = openNewProjectModal;

function _renderProjectForm(existing) {
  const isEdit = !!existing;
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');

  const typeOptions = PROJECT_TYPES.map(t =>
    `<option value="${t.id}" ${existing?.type === t.id ? 'selected' : ''}>${escHtml(t.label)}</option>`
  ).join('');

  content.innerHTML = `
    <div class="modal-header">
      <h2>${isEdit ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      ${isEdit ? `
        <div class="modal-section" style="margin-bottom:16px">
          <div class="modal-section-title">Código</div>
          <span class="project-code-badge" style="font-size:13px">${escHtml(existing.code)}</span>
        </div>
      ` : ''}
      <div class="project-form-grid">
        <div class="project-form-full">
          <div class="modal-section-title">Nombre del Proyecto *</div>
          <input class="modal-input" id="pf-name" value="${escHtml(existing?.name || '')}"
            placeholder="Nombre del proyecto" maxlength="120">
        </div>
        <div>
          <div class="modal-section-title">Tipo *</div>
          <select class="modal-input" id="pf-type">
            <option value="">— Seleccioná un tipo —</option>
            ${typeOptions}
          </select>
        </div>
        <div>
          <div class="modal-section-title">Vendedor (Salesman)</div>
          <input class="modal-input" id="pf-salesman" value="${escHtml(existing?.salesman || '')}"
            placeholder="Nombre del vendedor" maxlength="80">
        </div>
        <div>
          <div class="modal-section-title">Contacto</div>
          <input class="modal-input" id="pf-contact" value="${escHtml(existing?.contact || '')}"
            placeholder="Nombre del contacto" maxlength="80">
        </div>
        <div>
          <div class="modal-section-title">Team Leader</div>
          <input class="modal-input" id="pf-teamleader" value="${escHtml(existing?.teamLeader || '')}"
            placeholder="Nombre del team leader" maxlength="80">
        </div>
        <div>
          <div class="modal-section-title">Teléfono</div>
          <input class="modal-input" id="pf-phone" type="tel" value="${escHtml(existing?.phone || '')}"
            placeholder="+54 9 11 1234-5678" maxlength="30">
        </div>
        <div>
          <div class="modal-section-title">E-mail</div>
          <input class="modal-input" id="pf-email" type="email" value="${escHtml(existing?.email || '')}"
            placeholder="contacto@empresa.com" maxlength="120">
        </div>
      </div>
      <div id="pf-error" style="display:none;margin-top:12px;padding:8px 12px;
        background:rgba(244,63,94,0.10);border-radius:var(--radius-sm);
        color:var(--accent-rose);font-size:12px"></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveProjectFromModal(${isEdit ? `'${escHtml(existing.code)}'` : ''})">
        ${isEdit ? 'Guardar cambios' : 'Crear Proyecto'}
      </button>
    </div>
  `;
  overlay.classList.add('active');
}

window.saveProjectFromModal = async function(existingCode) {
  const name       = document.getElementById('pf-name').value.trim();
  const type       = document.getElementById('pf-type').value;
  const contact    = document.getElementById('pf-contact').value.trim();
  const phone      = document.getElementById('pf-phone').value.trim();
  const email      = document.getElementById('pf-email').value.trim();
  const salesman   = document.getElementById('pf-salesman').value.trim();
  const teamLeader = document.getElementById('pf-teamleader').value.trim();
  const errEl      = document.getElementById('pf-error');

  errEl.style.display = 'none';

  if (!name) { errEl.textContent = 'El nombre del proyecto es obligatorio.'; errEl.style.display = ''; return; }
  if (!type) { errEl.textContent = 'Seleccioná un tipo de proyecto.'; errEl.style.display = ''; return; }

  const saveBtn = document.querySelector('.modal-footer .btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Guardando…'; }

  try {
    let code, correlative;
    const isEdit = !!existingCode;

    if (isEdit) {
      code = existingCode;
      correlative = getProjects().find(p => p.code === existingCode)?.correlative ?? 0;
    } else {
      const generated = await generateProjectCode();
      code = generated.code;
      correlative = generated.correlative;
    }

    const user = getCurrentUser();
    const data = {
      code, name, type, contact, phone, email,
      salesman, teamLeader, correlative,
      createdBy: user?.email ?? '',
      ...(isEdit ? { _isEdit: true } : {
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
      }),
    };

    await saveProject(data);
    closeModal();
    toast(isEdit ? `✅ Proyecto ${code} actualizado` : `✅ Proyecto ${code} creado`);
  } catch (err) {
    console.error('saveProjectFromModal error:', err);
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = existingCode ? 'Guardar cambios' : 'Crear Proyecto'; }
    if (err.message === 'CODE_CONFLICT') {
      errEl.textContent = 'Conflicto de código. Intentá de nuevo.';
    } else {
      errEl.textContent = 'Error al guardar. Intentá de nuevo.';
    }
    errEl.style.display = '';
  }
};

// ====== CREATE CARD FROM PROJECT ======

window.openCardFromProject = function(code) {
  renderCardModal(null, 'backlog');
  requestAnimationFrame(() => {
    const input = document.getElementById('m-projectcode');
    if (input) input.value = code;
  });
};

// ====== EXPORT ======

window.exportProjectsJSON = function() {
  const data = JSON.stringify(getProjects().map(p => ({
    code: p.code, name: p.name, type: typeLabel(p.type),
    contact: p.contact, phone: p.phone, email: p.email,
    salesman: p.salesman, teamLeader: p.teamLeader,
    createdAt: fmtDate(p.createdAt), createdBy: p.createdBy,
  })), null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  a.download = `bitnova-proyectos-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  toast('📥 Proyectos exportados (JSON)');
};

window.exportProjectsCSV = function() {
  const headers = ['Código', 'Nombre', 'Tipo', 'Contacto', 'Teléfono', 'E-mail', 'Vendedor', 'Team Leader', 'Creado'];
  const rows = getProjects().map(p => [
    p.code, p.name, typeLabel(p.type),
    p.contact, p.phone, p.email,
    p.salesman, p.teamLeader, fmtDate(p.createdAt),
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`));
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `bitnova-proyectos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  toast('📥 Proyectos exportados (CSV)');
};
