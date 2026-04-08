/* Bitnova Kanban — ui: pure utility functions (toast, dates, escaping, export) */

import { _escDiv, getCards, getArchivedCards, getTeam } from './state.js';
import { COLUMNS } from './config.js';

// ---- Date helpers ----

export function getDueClass(dateStr) {
  if (!dateStr) return '';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + 'T00:00:00');
  const diff = (due - today) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'overdue';
  if (diff <= 2) return 'soon';
  return '';
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es', { month: 'short', day: 'numeric' });
}

// ---- HTML escaping ----

export function escHtml(s) {
  _escDiv.textContent = s;
  return _escDiv.innerHTML;
}

// ---- Toast notifications ----

export function toast(msg) {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ---- Data export ----

export function exportData() {
  const blob = new Blob(
    [JSON.stringify({ cards: getCards(), archivedCards: getArchivedCards(), columns: COLUMNS, team: getTeam() }, null, 2)],
    { type: 'application/json' }
  );
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bitnova-kanban-export.json';
  a.click();
  toast('📥 Datos exportados');
}
