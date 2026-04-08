/* Bitnova Kanban — app: entry point, wires all event listeners */

import './auth.js';       // self-initializing: registers onAuthStateChanged, handles URL params
import { renderBoard } from './board.js';
import { renderAnalytics } from './analytics.js';
import { renderArchive } from './archive.js';
import { exportData } from './ui.js';
import {
  setCurrentView, getCurrentView,
  setCurrentFilter, setSearchQuery,
  isSwimlaneEnabled, setSwimlaneEnabled,
} from './state.js';
import { openAdminPanel } from './admin.js';
import { openNewCardModal } from './board.js';

// ====== NAVIGATION (nav tabs) ======
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    setCurrentView(tab.dataset.view);
    const currentView = tab.dataset.view;

    document.getElementById('boardWrapper').classList.add('hidden');
    document.getElementById('analyticsView').classList.remove('active');
    document.getElementById('archiveView').classList.remove('active');
    document.querySelector('.toolbar').style.display = currentView === 'board' ? '' : 'none';

    if (currentView === 'board') {
      document.getElementById('boardWrapper').classList.remove('hidden');
    } else if (currentView === 'analytics') {
      document.getElementById('analyticsView').classList.add('active');
      renderAnalytics();
    } else if (currentView === 'archive') {
      document.getElementById('archiveView').classList.add('active');
      renderArchive();
    }
  });
});

// ====== FILTER CHIPS ======
document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    setCurrentFilter(chip.dataset.filter);
    renderBoard();
  });
});

// ====== SEARCH ======
function filterCards() {
  setSearchQuery(document.getElementById('searchInput').value.toLowerCase());
  renderBoard();
}
// Expose for oninput attribute (kept in HTML for now)
window.filterCards = filterCards;

// ====== SWIMLANES TOGGLE ======
function toggleSwimlanes() {
  setSwimlaneEnabled(!isSwimlaneEnabled());
  document.getElementById('swimlaneBtn').classList.toggle('active');
  renderBoard();
}
// Expose for onclick attribute (kept in HTML for now)
window.toggleSwimlanes = toggleSwimlanes;

// ====== HEADER BUTTONS ======
// Admin panel button
const adminBtn = document.getElementById('adminBtn');
if (adminBtn) {
  adminBtn.addEventListener('click', openAdminPanel);
}

// Export button — find by its SVG content (download icon)
document.querySelectorAll('.header-actions .btn').forEach(btn => {
  if (btn.textContent.trim().includes('Exportar')) {
    btn.addEventListener('click', exportData);
  }
});

// Nueva Tarjeta button
document.querySelectorAll('.header-actions .btn.btn-primary').forEach(btn => {
  if (btn.textContent.trim().includes('Nueva Tarjeta')) {
    btn.addEventListener('click', () => openNewCardModal());
  }
});

// ====== PWA SERVICE WORKER ======
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => { });
}
