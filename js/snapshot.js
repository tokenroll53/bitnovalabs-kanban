/* Bitnova Kanban — snapshot: time-bound voting protocol */

import { db } from './firebase.js';
import {
  getSnapshots, setSnapshots,
  getArchivedSnapshots, setArchivedSnapshots,
  getCurrentUser,
} from './state.js';
import { escHtml, toast } from './ui.js';
import { SNAPSHOT_TIMESPAN_OPTIONS, SNAPSHOT_DEFAULT_VP } from './config.js';
import { closeModal } from './modal.js';

// ====== MODULE STATE ======

let _snapshotsTab      = 'active';  // 'active' | 'archived'
let _detailSnapshotId  = null;
let _localAllocation   = {};        // { [optionId]: number } — live draft
let _countdownInterval = null;
let _votesUnsub        = null;
let _cachedVotes       = [];
let _snapshotOptionDraft = [];

// ====== LISTENER ======

export function startSnapshotsListener({ onSnapshotsUpdate }) {
  return db.collection('snapshots')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSnapshots(all.filter(s => s.status !== 'archived'));
      setArchivedSnapshots(all.filter(s => s.status === 'archived'));
      onSnapshotsUpdate();
    }, err => console.error('Firestore snapshots error:', err));
}

// ====== CRUD ======

export async function createSnapshot({ title, description, privacy, baseVP, timespan, options }) {
  const user = getCurrentUser();
  return db.collection('snapshots').add({
    title,
    description,
    privacy,
    status: 'active',
    baseVP,
    timespan,
    expiresAt: new Date(Date.now() + timespan).toISOString(),
    options,
    createdBy: user?.email ?? '',
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
  });
}

export async function archiveSnapshot(id) {
  return db.collection('snapshots').doc(id).update({ status: 'archived' });
}

export async function submitVote(snapshotId, allocation) {
  const user = getCurrentUser();
  const totalSpent = Object.values(allocation).reduce((s, v) => s + (Number(v) || 0), 0);
  return db.collection('snapshots').doc(snapshotId)
    .collection('votes').doc(user.uid).set({
      userName:    user.displayName || user.email || 'unknown',
      userEmail:   user.email,
      allocation,
      totalSpent,
      submittedAt: new Date().toISOString(),
    });
}

// ====== HELPERS ======

function _allSnaps() {
  return [...getSnapshots(), ...getArchivedSnapshots()];
}

function _isExpired(snap) {
  return Date.now() >= new Date(snap.expiresAt).getTime();
}

// ====== LIST VIEW RENDER ======

export function renderSnapshots() {
  const view = document.getElementById('snapshotView');
  if (!view) return;
  if (_snapshotsTab === 'archived') {
    _renderArchivedSnapshotsView(view);
  } else {
    _renderActiveSnapshotsView(view);
  }
}

function _renderActiveSnapshotsView(view) {
  const snaps = getSnapshots();
  view.innerHTML = `
    ${_renderSnapshotsHeaderBar()}
    <div class="snapshot-list-wrapper">
      ${snaps.length ? _renderSnapshotListTableHTML(snaps) : _renderSnapshotsEmptyHTML('active')}
    </div>
  `;
}

function _renderArchivedSnapshotsView(view) {
  const archived = getArchivedSnapshots();
  view.innerHTML = `
    ${_renderSnapshotsHeaderBar()}
    <div class="snapshot-list-wrapper">
      ${archived.length ? _renderArchivedSnapshotListTableHTML(archived) : _renderSnapshotsEmptyHTML('archived')}
    </div>
  `;
}

function _renderSnapshotsHeaderBar() {
  const activeCount   = getSnapshots().length;
  const archivedCount = getArchivedSnapshots().length;
  const isActive      = _snapshotsTab === 'active';
  return `
    <div class="snapshot-header-bar">
      <div style="display:flex;align-items:center;gap:12px">
        <h2>Snapshot</h2>
        <div class="snapshot-tab-toggle">
          <button class="snapshot-tab-btn${isActive ? ' active' : ''}"
            onclick="switchSnapshotsTab('active')">
            Activas<span class="tab-count">${activeCount}</span>
          </button>
          <button class="snapshot-tab-btn${!isActive ? ' active' : ''}"
            onclick="switchSnapshotsTab('archived')">
            Archivadas<span class="tab-count">${archivedCount}</span>
          </button>
        </div>
      </div>
      ${isActive ? `
      <button class="btn btn-primary" onclick="openNewSnapshotModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Nueva Propuesta
      </button>
      ` : ''}
    </div>
  `;
}

function _privacyBadgeHTML(privacy) {
  if (privacy === 'secret') {
    return `<span class="snapshot-privacy-badge secret">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
      Secreta
    </span>`;
  }
  return `<span class="snapshot-privacy-badge public">
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
    Pública
  </span>`;
}

function _countdownHTML(snap) {
  const remaining = new Date(snap.expiresAt).getTime() - Date.now();
  if (remaining <= 0) {
    return `<span class="snapshot-countdown rose">Finalizado</span>`;
  }
  const pct = remaining / snap.timespan;
  const cls = pct > 0.5 ? 'emerald' : pct > 0.10 ? 'amber' : 'rose pulse';
  return `<span class="snapshot-countdown ${cls}" data-expires="${escHtml(snap.expiresAt)}" data-id="${escHtml(snap.id)}">${_formatCountdown(remaining)}</span>`;
}

function _renderSnapshotListTableHTML(snaps) {
  return `
    <table class="snapshot-table">
      <thead>
        <tr>
          <th>Título</th>
          <th>Privacidad</th>
          <th>Tiempo restante</th>
          <th>VP Base</th>
          <th>Opciones</th>
          <th>Creado por</th>
          <th class="col-action"></th>
        </tr>
      </thead>
      <tbody>
        ${snaps.map(s => `
          <tr>
            <td class="snapshot-title-cell" onclick="openSnapshotDetail('${escHtml(s.id)}')">${escHtml(s.title)}</td>
            <td>${_privacyBadgeHTML(s.privacy)}</td>
            <td>${_countdownHTML(s)}</td>
            <td style="font-family:var(--font-mono);font-size:11px">${s.baseVP}</td>
            <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${(s.options || []).length}</td>
            <td style="font-size:12px;color:var(--text-muted)">${escHtml(s.createdBy || '—')}</td>
            <td class="col-action">
              <button class="snapshot-archive-btn" title="Archivar snapshot"
                onclick="confirmArchiveSnapshot('${escHtml(s.id)}')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/>
                </svg>
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function _renderArchivedSnapshotListTableHTML(snaps) {
  return `
    <table class="snapshot-table">
      <thead>
        <tr>
          <th>Título</th>
          <th>Privacidad</th>
          <th>Finalizó</th>
          <th>VP Base</th>
          <th>Creado por</th>
        </tr>
      </thead>
      <tbody>
        ${snaps.map(s => {
          const date = s.expiresAt ? new Date(s.expiresAt).toLocaleDateString('es') : '—';
          return `
            <tr>
              <td class="snapshot-title-cell" onclick="openSnapshotDetail('${escHtml(s.id)}')">${escHtml(s.title)}</td>
              <td>${_privacyBadgeHTML(s.privacy)}</td>
              <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${date}</td>
              <td style="font-family:var(--font-mono);font-size:11px">${s.baseVP}</td>
              <td style="font-size:12px;color:var(--text-muted)">${escHtml(s.createdBy || '—')}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function _renderSnapshotsEmptyHTML(tab) {
  const msg = tab === 'archived' ? 'No hay propuestas archivadas.' : 'No hay propuestas activas. Creá la primera.';
  return `
    <div class="snapshot-empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      ${msg}
    </div>
  `;
}

// ====== TAB SWITCH ======

window.switchSnapshotsTab = function(tab) {
  _snapshotsTab = tab;
  renderSnapshots();
};

// ====== LIST COUNTDOWN TICKER ======
// Ticks the countdown cells in the list view every second

let _listTickerInterval = null;

export function startListTicker() {
  stopListTicker();
  _listTickerInterval = setInterval(() => {
    document.querySelectorAll('.snapshot-countdown[data-expires]').forEach(el => {
      const remaining = new Date(el.dataset.expires).getTime() - Date.now();
      if (remaining <= 0) {
        el.textContent = 'Finalizado';
        el.className = 'snapshot-countdown rose';
        el.removeAttribute('data-expires');
        return;
      }
      const snap = _allSnaps().find(s => s.id === el.dataset.id);
      const total = snap?.timespan ?? 1;
      const pct = remaining / total;
      const cls = pct > 0.5 ? 'emerald' : pct > 0.10 ? 'amber' : 'rose pulse';
      el.className = 'snapshot-countdown ' + cls;
      el.textContent = _formatCountdown(remaining);
    });
  }, 1000);
}

export function stopListTicker() {
  if (_listTickerInterval) { clearInterval(_listTickerInterval); _listTickerInterval = null; }
}

// ====== TIMER UTILS ======

function _formatCountdown(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) {
    return `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function _getCountdownClass(remainingMs, snap) {
  const total = snap?.timespan ?? 1;
  const pct = remainingMs / total;
  if (pct > 0.5)  return 'emerald';
  if (pct > 0.10) return 'amber';
  return 'rose pulse';
}

// ====== DETAIL OVERLAY ======

window.openSnapshotDetail = async function(id) {
  _detailSnapshotId = id;
  _localAllocation  = {};

  const snap = _allSnaps().find(s => s.id === id);
  if (!snap) return;

  const overlay = document.getElementById('snapshotDetailOverlay');
  const win     = document.getElementById('snapshotDetailWindow');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  win.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-muted);font-size:13px">Cargando…</div>`;

  // Fetch user's existing vote
  const user = getCurrentUser();
  let myVote = null;
  try {
    const voteDoc = await db.collection('snapshots').doc(id)
      .collection('votes').doc(user.uid).get();
    if (voteDoc.exists) {
      myVote = voteDoc.data();
      _localAllocation = { ...myVote.allocation };
    }
  } catch { /* ignore */ }

  const expired = _isExpired(snap);
  win.innerHTML = _buildDetailHTML(snap, myVote, expired);

  if (!expired) {
    _startDetailTimer(snap);
  } else {
    _markFinalityBanner();
  }

  _startVotesListener(id, snap, expired);
};

window.closeSnapshotDetail = function() {
  _stopDetailTimer();
  if (_votesUnsub) { _votesUnsub(); _votesUnsub = null; }
  document.getElementById('snapshotDetailOverlay').classList.remove('active');
  document.getElementById('snapshotDetailWindow').innerHTML = '';
  document.body.style.overflow = '';
  _detailSnapshotId = null;
  _localAllocation  = {};
  _cachedVotes      = [];
};

function _buildDetailHTML(snap, myVote, expired) {
  const showResults = snap.privacy === 'public' || expired;

  const optionsHTML = (snap.options || []).map(o => {
    const val = _localAllocation[o.id] || 0;
    const pct = snap.baseVP > 0 ? Math.round((val / snap.baseVP) * 100) : 0;
    return `
      <div class="snapshot-option-card">
        <span class="snapshot-option-label">${escHtml(o.label)}</span>
        <input type="number" class="snapshot-alloc-input" min="0" max="${snap.baseVP}"
          value="${val}" ${expired ? 'disabled' : ''}
          oninput="updateSnapshotAllocation('${escHtml(o.id)}', this.value)">
        <span class="snapshot-weight-badge${val > 0 ? ' active' : ''}">${pct}%</span>
      </div>
    `;
  }).join('');

  const spent   = Object.values(_localAllocation).reduce((s, v) => s + (Number(v) || 0), 0);
  const balance = snap.baseVP - spent;
  const barPct  = Math.min(100, snap.baseVP > 0 ? (spent / snap.baseVP) * 100 : 0);
  const exceeded = balance < 0;

  return `
    <div class="snapshot-detail-header">
      <div class="snapshot-detail-header-left">
        ${_privacyBadgeHTML(snap.privacy)}
        <h2 class="snapshot-detail-title">${escHtml(snap.title)}</h2>
        ${snap.description ? `<p class="snapshot-detail-desc">${escHtml(snap.description)}</p>` : ''}
      </div>
      <button class="snapshot-detail-close" onclick="closeSnapshotDetail()">✕</button>
    </div>

    ${expired ? `
    <div class="snapshot-finality-banner" id="snapshotFinalityBanner">
      ⚡ Snapshot Finalizado — Estado capturado e inmutable.
    </div>
    ` : ''}

    <div class="snapshot-detail-body${expired ? ' snapshot-frozen' : ''}" id="snapshotWorkspace">

      <div class="snapshot-vp-tracker" id="snapshotVPTracker">
        <div>
          <span class="snapshot-vp-label">Tu Voting Power</span>
          <span class="snapshot-vp-value">
            <span id="snapshotVPBalance" style="color:${exceeded ? 'var(--accent-rose)' : 'var(--accent-cyan)'}">${balance}</span>
            <span style="color:var(--text-muted);font-size:12px"> / ${snap.baseVP}</span>
          </span>
        </div>
        <div class="snapshot-vp-bar-track">
          <div class="snapshot-vp-bar-fill${exceeded ? ' exceeded' : ''}" id="snapshotVPBar"
            style="width:${barPct}%"></div>
        </div>
      </div>

      <div class="snapshot-detail-columns">

        <div class="snapshot-detail-left">
          ${!expired ? `
          <div class="snapshot-countdown-block">
            <div class="snapshot-countdown-label">Tiempo restante</div>
            <div class="snapshot-countdown-display" id="snapshotCountdown">—</div>
          </div>
          ` : ''}

          <div class="snapshot-options-section">
            <div class="snapshot-section-title">Distribución de Voting Power</div>
            ${optionsHTML}
          </div>

          ${!expired ? `
          <button class="snapshot-commit-btn" id="snapshotCommitBtn"
            onclick="commitSnapshotVote('${escHtml(snap.id)}')"
            ${spent < 1 || exceeded ? 'disabled' : ''}>
            Commit Snapshot ▶
          </button>
          ` : ''}
        </div>

        <div class="snapshot-results-panel" id="snapshotResultsPanel">
          ${showResults
            ? (_cachedVotes.length ? _buildResultsHTML(snap, _cachedVotes) : `<p class="snapshot-results-empty">Sin votos aún.</p>`)
            : _buildEncryptedPlaceholderHTML()
          }
        </div>

      </div>
    </div>
  `;
}

function _buildEncryptedPlaceholderHTML() {
  return `
    <div class="snapshot-encrypted-placeholder">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
      <div class="snapshot-encrypted-title">Resultados Cifrados</div>
      <div class="snapshot-encrypted-sub">Los resultados se revelarán cuando el tiempo expire.</div>
    </div>
  `;
}

function _buildResultsHTML(snap, votes) {
  if (!votes.length) {
    return `<p class="snapshot-results-empty">Sin votos aún.</p>`;
  }

  const totals = {};
  (snap.options || []).forEach(o => { totals[o.id] = 0; });
  votes.forEach(v => {
    Object.entries(v.allocation || {}).forEach(([oid, vp]) => {
      if (totals[oid] !== undefined) totals[oid] += Number(vp) || 0;
    });
  });

  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);
  const expired    = _isExpired(snap);

  const bars = (snap.options || []).map(o => {
    const vp  = totals[o.id] || 0;
    const pct = grandTotal > 0 ? ((vp / grandTotal) * 100).toFixed(1) : '0.0';
    return `
      <div class="snapshot-result-row">
        <div class="snapshot-result-label">${escHtml(o.label)}</div>
        <div class="snapshot-result-bar-track">
          <div class="snapshot-result-bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="snapshot-result-meta">
          <span class="snapshot-result-pct">${pct}%</span>
          <span class="snapshot-result-vp">${vp} VP</span>
        </div>
      </div>
    `;
  }).join('');

  const stampHTML = expired ? `
    <div class="snapshot-stamp">
      <div class="snapshot-stamp-row">
        <span class="snapshot-stamp-label">Snapshot ID</span>
        <span class="snapshot-stamp-value">${escHtml(snap.id)}</span>
      </div>
      <div class="snapshot-stamp-row">
        <span class="snapshot-stamp-label">Timestamp of Finality</span>
        <span class="snapshot-stamp-value">${escHtml(snap.expiresAt)}</span>
      </div>
      <div class="snapshot-stamp-row">
        <span class="snapshot-stamp-label">Participantes</span>
        <span class="snapshot-stamp-value">${votes.length}</span>
      </div>
      <div class="snapshot-stamp-row">
        <span class="snapshot-stamp-label">VP Total Gastado</span>
        <span class="snapshot-stamp-value">${grandTotal}</span>
      </div>
    </div>
  ` : '';

  const sectionTitle = expired
    ? '<div class="snapshot-section-title" style="margin-bottom:14px">Resultados Finales</div>'
    : '<div class="snapshot-section-title" style="margin-bottom:14px">Resultados en Vivo</div>';

  return sectionTitle + bars + stampHTML;
}

// ====== VOTES LISTENER ======

function _startVotesListener(snapshotId, snap, expired) {
  if (_votesUnsub) { _votesUnsub(); _votesUnsub = null; }
  _votesUnsub = db.collection('snapshots').doc(snapshotId)
    .collection('votes')
    .onSnapshot(vsSnap => {
      _cachedVotes = vsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const nowExpired  = _isExpired(snap);
      const showResults = snap.privacy === 'public' || nowExpired;
      const resultsEl   = document.getElementById('snapshotResultsPanel');
      if (resultsEl && showResults) {
        resultsEl.innerHTML = _buildResultsHTML(snap, _cachedVotes);
      }
    }, err => console.error('Votes listener error:', err));
}

// ====== DETAIL TIMER ======

function _startDetailTimer(snap) {
  _stopDetailTimer();
  // Render initial value immediately
  _tickDetailTimer(snap);
  _countdownInterval = setInterval(() => _tickDetailTimer(snap), 1000);
}

function _tickDetailTimer(snap) {
  const el = document.getElementById('snapshotCountdown');
  if (!el) { _stopDetailTimer(); return; }

  const remaining = new Date(snap.expiresAt).getTime() - Date.now();
  if (remaining <= 0) {
    _stopDetailTimer();
    _triggerFinality(snap.id);
    return;
  }

  el.textContent = _formatCountdown(remaining);
  el.className   = 'snapshot-countdown-display ' + _getCountdownClass(remaining, snap);
}

function _stopDetailTimer() {
  if (_countdownInterval) { clearInterval(_countdownInterval); _countdownInterval = null; }
}

function _triggerFinality(snapshotId) {
  const win = document.getElementById('snapshotDetailWindow');
  if (win) win.classList.add('snapshot-flash');
  setTimeout(() => {
    if (win) win.classList.remove('snapshot-flash');
    _applyFinalityState(snapshotId);
  }, 800);
}

function _applyFinalityState(snapshotId) {
  const snap = _allSnaps().find(s => s.id === snapshotId);
  if (!snap) return;

  // Hide timer block
  const timerBlock = document.querySelector('.snapshot-countdown-block');
  if (timerBlock) timerBlock.remove();

  // Hide commit button
  const commitBtn = document.getElementById('snapshotCommitBtn');
  if (commitBtn) commitBtn.remove();

  // Freeze workspace
  const workspace = document.getElementById('snapshotWorkspace');
  if (workspace) workspace.classList.add('snapshot-frozen');

  // Show finality banner (inject if not already there)
  const existing = document.getElementById('snapshotFinalityBanner');
  if (!existing) {
    const banner = document.createElement('div');
    banner.className = 'snapshot-finality-banner';
    banner.id = 'snapshotFinalityBanner';
    banner.textContent = '⚡ Snapshot Finalizado — Estado capturado e inmutable.';
    const header = document.querySelector('.snapshot-detail-header');
    if (header) header.insertAdjacentElement('afterend', banner);
  }

  // Reveal results
  const resultsEl = document.getElementById('snapshotResultsPanel');
  if (resultsEl) {
    resultsEl.innerHTML = _buildResultsHTML(snap, _cachedVotes);
  }
}

function _markFinalityBanner() {
  // Already rendered in _buildDetailHTML when expired=true; nothing extra needed here.
}

// ====== VP ALLOCATION ======

window.updateSnapshotAllocation = function(optionId, rawValue) {
  const value = Math.max(0, Math.floor(Number(rawValue) || 0));
  _localAllocation[optionId] = value;
  _refreshVPTracker();
};

function _refreshVPTracker() {
  const snap = _allSnaps().find(s => s.id === _detailSnapshotId);
  if (!snap) return;

  const spent   = Object.values(_localAllocation).reduce((s, v) => s + v, 0);
  const balance = snap.baseVP - spent;
  const pct     = Math.min(100, snap.baseVP > 0 ? (spent / snap.baseVP) * 100 : 0);
  const exceeded = balance < 0;

  const balanceEl = document.getElementById('snapshotVPBalance');
  const barEl     = document.getElementById('snapshotVPBar');
  const commitBtn = document.getElementById('snapshotCommitBtn');

  if (balanceEl) {
    balanceEl.textContent = balance;
    balanceEl.style.color = exceeded ? 'var(--accent-rose)' : 'var(--accent-cyan)';
  }
  if (barEl) {
    barEl.style.width = pct + '%';
    barEl.className = 'snapshot-vp-bar-fill' + (exceeded ? ' exceeded' : '');
  }
  if (commitBtn) commitBtn.disabled = (spent < 1 || exceeded);

  // Update weight badges
  const snap2 = snap;
  document.querySelectorAll('.snapshot-option-card').forEach(card => {
    const input = card.querySelector('.snapshot-alloc-input');
    const badge = card.querySelector('.snapshot-weight-badge');
    if (!input || !badge) return;
    // Find which option this card represents by its input's oninput attribute
    const val = Number(input.value) || 0;
    const pctW = snap2.baseVP > 0 ? Math.round((val / snap2.baseVP) * 100) : 0;
    badge.textContent = pctW + '%';
    badge.classList.toggle('active', val > 0);
  });
}

window.commitSnapshotVote = async function(snapshotId) {
  const btn = document.getElementById('snapshotCommitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Registrando…'; }
  try {
    await submitVote(snapshotId, { ..._localAllocation });
    toast('✅ Voto registrado');
    if (btn) { btn.disabled = false; btn.textContent = 'Commit Snapshot ▶'; }
  } catch {
    toast('❌ Error al registrar. Intentá de nuevo.');
    if (btn) { btn.disabled = false; btn.textContent = 'Commit Snapshot ▶'; }
  }
};

// ====== ARCHIVE ======

window.confirmArchiveSnapshot = function(id) {
  const snap = getSnapshots().find(s => s.id === id);
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <div class="modal-header">
      <h2>Archivar Snapshot</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p style="color:var(--text-secondary)">
        ¿Archivar "<strong>${escHtml(snap?.title || id)}</strong>"?
        Permanecerá visible en la pestaña Archivadas.
      </p>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn"
        style="background:rgba(245,158,11,0.15);border-color:rgba(245,158,11,0.4);color:var(--accent-amber)"
        onclick="executeArchiveSnapshot('${escHtml(id)}')">Archivar</button>
    </div>
  `;
  overlay.classList.add('active');
};

window.executeArchiveSnapshot = async function(id) {
  try {
    await archiveSnapshot(id);
    closeModal();
    toast('📦 Snapshot archivado');
  } catch {
    toast('❌ Error al archivar. Intentá de nuevo.');
  }
};

// ====== CREATE MODAL ======

window.openNewSnapshotModal = function() {
  _snapshotOptionDraft = [
    { id: 'opt_' + Date.now() + '_0', label: '' },
    { id: 'opt_' + Date.now() + '_1', label: '' },
  ];
  _renderSnapshotFormModal();
};

function _renderSnapshotFormModal() {
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');

  const tsOpts = SNAPSHOT_TIMESPAN_OPTIONS.map((t, i) =>
    `<option value="${t.ms}"${i === 2 ? ' selected' : ''}>${escHtml(t.label)}</option>`
  ).join('');

  const optRows = _snapshotOptionDraft.map((o, i) => `
    <div class="snapshot-option-row">
      <input class="modal-input" placeholder="Opción ${i + 1}" value="${escHtml(o.label)}"
        oninput="_updateSnapshotOptionLabel(${i}, this.value)">
      ${_snapshotOptionDraft.length > 2 ? `
        <button class="snapshot-option-remove-btn" onclick="removeSnapshotOption(${i})">✕</button>
      ` : ''}
    </div>
  `).join('');

  content.innerHTML = `
    <div class="modal-header">
      <h2>Nueva Propuesta Snapshot</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="modal-section-title" style="margin-bottom:8px">Título *</div>
      <input class="modal-input" id="sf-title" placeholder="Título de la propuesta" maxlength="120">

      <div class="modal-section-title" style="margin:16px 0 8px">Descripción</div>
      <textarea class="modal-input" id="sf-desc"
        placeholder="Describe el contexto de esta decisión…" rows="2"
        style="min-height:60px;resize:vertical"></textarea>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px">
        <div>
          <div class="modal-section-title" style="margin-bottom:8px">Duración *</div>
          <select class="modal-input" id="sf-timespan">${tsOpts}</select>
        </div>
        <div>
          <div class="modal-section-title" style="margin-bottom:8px">VP por participante</div>
          <input class="modal-input" id="sf-basevp" type="number"
            value="${SNAPSHOT_DEFAULT_VP}" min="1" max="10000">
        </div>
      </div>

      <div style="margin-top:16px">
        <div class="modal-section-title" style="margin-bottom:8px">Privacidad</div>
        <div style="display:flex;gap:8px">
          <button class="snapshot-privacy-pill active" data-privacy="public"
            onclick="selectSnapshotPrivacy(this,'public')">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            Pública
          </button>
          <button class="snapshot-privacy-pill" data-privacy="secret"
            onclick="selectSnapshotPrivacy(this,'secret')">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            Secreta
          </button>
        </div>
      </div>

      <div style="margin-top:20px">
        <div class="modal-section-title" style="margin-bottom:8px">Opciones (mínimo 2) *</div>
        <div id="snapshotOptionsContainer">${optRows}</div>
        <button class="snapshot-add-option-btn" onclick="addSnapshotOption()">+ Agregar opción</button>
      </div>

      <div id="sf-error" style="display:none;margin-top:12px;padding:8px 12px;
        background:rgba(244,63,94,0.10);border-radius:var(--radius-sm);
        color:var(--accent-rose);font-size:12px"></div>
    </div>
    <div class="modal-footer">
      <button class="btn" id="sf-cancel-btn">Cancelar</button>
      <button class="btn btn-primary" id="sf-save-btn">Crear Snapshot</button>
    </div>
  `;
  overlay.classList.add('active');
  document.getElementById('sf-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('sf-save-btn').addEventListener('click', () => window.saveSnapshotFromModal());
}

window._updateSnapshotOptionLabel = function(idx, val) {
  if (_snapshotOptionDraft[idx]) _snapshotOptionDraft[idx].label = val;
};

window.addSnapshotOption = function() {
  _snapshotOptionDraft.push({ id: 'opt_' + Date.now(), label: '' });
  _renderSnapshotFormModal();
};

window.removeSnapshotOption = function(idx) {
  _snapshotOptionDraft.splice(idx, 1);
  _renderSnapshotFormModal();
};

window.selectSnapshotPrivacy = function(btn, value) {
  document.querySelectorAll('.snapshot-privacy-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  void value; // stored via DOM query on submit
};

window.saveSnapshotFromModal = async function() {
  console.log('[DEBUG] saveSnapshotFromModal called');
  const title      = document.getElementById('sf-title').value.trim();
  const desc       = document.getElementById('sf-desc').value.trim();
  const timespan   = parseInt(document.getElementById('sf-timespan').value, 10);
  const baseVP     = parseInt(document.getElementById('sf-basevp').value, 10) || SNAPSHOT_DEFAULT_VP;
  const privacyBtn = document.querySelector('.snapshot-privacy-pill.active');
  const privacy    = privacyBtn?.dataset.privacy || 'public';
  const errEl      = document.getElementById('sf-error');

  errEl.style.display = 'none';

  if (!title) {
    errEl.textContent = 'El título es obligatorio.';
    errEl.style.display = '';
    return;
  }
  const validOpts = _snapshotOptionDraft.filter(o => o.label.trim());
  if (validOpts.length < 2) {
    errEl.textContent = 'Se necesitan al menos 2 opciones con nombre.';
    errEl.style.display = '';
    return;
  }

  const saveBtn = document.querySelector('.modal-footer .btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Creando…'; }

  try {
    console.log('[DEBUG] calling createSnapshot...');
    await createSnapshot({
      title,
      description: desc,
      privacy,
      baseVP,
      timespan,
      options: validOpts.map(o => ({ id: o.id, label: o.label.trim() })),
    });
    console.log('[DEBUG] createSnapshot succeeded');
    closeModal();
    toast('✅ Snapshot creado');
  } catch (err) {
    console.error('saveSnapshotFromModal error:', err);
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Crear Snapshot'; }
    errEl.textContent = 'Error al crear. Intentá de nuevo.';
    errEl.style.display = '';
  }
};
