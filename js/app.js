/* Bitnova Kanban — app: entry point, wires all event listeners */

import './auth.js';       // self-initializing: registers onAuthStateChanged, handles URL params
import { renderBoard } from './board.js';
import { renderAnalytics } from './analytics.js';
import { renderArchive } from './archive.js';
import { renderProjects } from './projects.js';
import { renderSnapshots, startListTicker, stopListTicker } from './snapshot.js';
import { exportData } from './ui.js';
import {
  setCurrentView,
  setCurrentFilter, setSearchQuery,
  isSwimlaneEnabled, setSwimlaneEnabled,
} from './state.js';
import {
  openAdminPanel, closeAdminPanel,
  sendInvitation,
} from './admin.js';
import { openNewCardModal } from './board.js';
import { closeModal } from './modal.js';
import {
  loginWithEmail, loginWithGoogle, sendLoginLink,
  showForgotPassword, toggleLinkSection,
  submitSetup, submitPasswordReset, goToSignIn,
  submitEmailConfirm, logout,
} from './auth.js';

// ====== LOGIN SCREEN ======
document.getElementById('btnEmailLogin').addEventListener('click', loginWithEmail);
document.getElementById('btnForgotPassword').addEventListener('click', showForgotPassword);
document.getElementById('btnGoogle').addEventListener('click', loginWithGoogle);
document.getElementById('btnToggleLink').addEventListener('click', toggleLinkSection);
document.getElementById('btnSendLink').addEventListener('click', sendLoginLink);

// ====== SETUP SCREEN ======
document.getElementById('setupBtn').addEventListener('click', submitSetup);

// ====== PASSWORD RESET SCREEN ======
document.getElementById('resetBtn').addEventListener('click', submitPasswordReset);
document.getElementById('btnGoToSignIn').addEventListener('click', goToSignIn);

// ====== EMAIL CONFIRM OVERLAY ======
document.getElementById('emailConfirmBtn').addEventListener('click', submitEmailConfirm);
document.getElementById('emailConfirmInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitEmailConfirm();
});

// ====== ADMIN PANEL ======
document.getElementById('adminModal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeAdminPanel();
});
document.getElementById('btnCloseAdmin').addEventListener('click', closeAdminPanel);
document.getElementById('btnSendInvite').addEventListener('click', sendInvitation);
document.getElementById('inviteEmail').addEventListener('keydown', e => {
  if (e.key === 'Enter') sendInvitation();
});

// ====== HEADER BUTTONS ======
document.getElementById('adminBtn').addEventListener('click', openAdminPanel);
document.getElementById('btnExport').addEventListener('click', exportData);
document.getElementById('btnNewCard').addEventListener('click', () => openNewCardModal());
document.getElementById('btnLogout').addEventListener('click', logout);

// ====== CARD MODAL OVERLAY ======
document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeModal();
});

// ====== NAVIGATION (nav tabs) ======
document.querySelectorAll('.nav-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const currentView = tab.dataset.view;
    setCurrentView(currentView);

    document.getElementById('boardWrapper').classList.add('hidden');
    document.getElementById('analyticsView').classList.remove('active');
    document.getElementById('archiveView').classList.remove('active');
    document.getElementById('projectsView').classList.remove('active');
    document.getElementById('snapshotView').classList.remove('active');
    document.querySelector('.toolbar').style.display = currentView === 'board' ? '' : 'none';
    stopListTicker();

    if (currentView === 'board') {
      document.getElementById('boardWrapper').classList.remove('hidden');
    } else if (currentView === 'analytics') {
      document.getElementById('analyticsView').classList.add('active');
      renderAnalytics();
    } else if (currentView === 'archive') {
      document.getElementById('archiveView').classList.add('active');
      renderArchive();
    } else if (currentView === 'projects') {
      document.getElementById('projectsView').classList.add('active');
      renderProjects();
    } else if (currentView === 'snapshot') {
      document.getElementById('snapshotView').classList.add('active');
      renderSnapshots();
      startListTicker();
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
document.getElementById('searchInput').addEventListener('input', () => {
  setSearchQuery(document.getElementById('searchInput').value.toLowerCase());
  renderBoard();
});

// ====== SWIMLANES TOGGLE ======
document.getElementById('swimlaneBtn').addEventListener('click', () => {
  setSwimlaneEnabled(!isSwimlaneEnabled());
  document.getElementById('swimlaneBtn').classList.toggle('active');
  renderBoard();
});

// ====== PWA SERVICE WORKER ======
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => { });
}

