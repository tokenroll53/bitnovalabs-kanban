/* Bitnova Kanban — auth: authentication flows and onAuthStateChanged */

import { auth, db } from './firebase.js';
import {
  setCurrentUser, getCurrentUser,
  setCards, setArchivedCards, setTeam,
  getUnsubCards, setUnsubCards,
  getUnsubArchived, setUnsubArchived,
  getUnsubProjects, setUnsubProjects, setProjects,
  getUnsubSnapshots, setUnsubSnapshots, setSnapshots, setArchivedSnapshots,
  getCurrentView, getNextAvatarColor,
} from './state.js';
import { toast } from './ui.js';
import { loadTeam } from './admin.js';
import { renderBoard } from './board.js';
import { renderAnalytics } from './analytics.js';
import { renderArchive } from './archive.js';
import { startFirestoreListeners } from './firestore.js';
import { startProjectsListener, renderProjects } from './projects.js';
import { startSnapshotsListener, renderSnapshots } from './snapshot.js';
import { isMobile } from './config.js';

// ====== HELPERS ======
export function showLoginError(msg) {
  const el = document.getElementById('loginError');
  el.textContent = msg;
  el.style.color = '';
  el.style.background = '';
  el.classList.add('show');
}

export function clearLoginError() {
  const el = document.getElementById('loginError');
  el.classList.remove('show');
  el.style.color = '';
  el.style.background = '';
}

export function getAuthError(code) {
  const errors = {
    'auth/popup-closed-by-user':             'Ventana cerrada. Intentá de nuevo.',
    'auth/popup-blocked':                    'El navegador bloqueó la ventana. Habilitá popups para este sitio.',
    'auth/cancelled-popup-request':          'Se canceló el login.',
    'auth/network-request-failed':           'Sin conexión a internet.',
    'auth/unauthorized-domain':              'Dominio no autorizado en Firebase.',
    'auth/internal-error':                   'Error de configuración en Firebase.',
    'auth/operation-not-allowed':            'Este método de login no está habilitado en Firebase.',
    'auth/user-disabled':                    'Esta cuenta fue deshabilitada.',
    'auth/account-exists-with-different-credential': 'Ya existe una cuenta con este correo usando otro método.',
    'auth/wrong-password':                   'Contraseña incorrecta.',
    'auth/user-not-found':                   'No existe una cuenta con este correo.',
    'auth/weak-password':                    'La contraseña debe tener al menos 6 caracteres.',
    'auth/invalid-action-code':              'El enlace de invitación es inválido o ya expiró. Pedí uno nuevo a tu administrador.',
    'auth/expired-action-code':              'El enlace de invitación expiró. Pedí uno nuevo a tu administrador.',
    'auth/invalid-email':                    'Por favor ingresá un correo válido.',
    'auth/too-many-requests':                'Demasiados intentos. Esperá unos minutos e intentá de nuevo.',
    'auth/email-already-in-use':             'Ya existe una cuenta con este correo.',
    'auth/missing-email':                    'Por favor ingresá un correo.',
  };
  return errors[code] || `Error inesperado (${code}).`;
}

// ====== PASSWORD RESET ======
let _isHandlingPasswordReset = false;
let _resetOobCode = null;

export function handlePasswordReset() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') !== 'resetPassword') return;

  _resetOobCode = params.get('oobCode');
  if (!_resetOobCode) return;

  _isHandlingPasswordReset = true;

  // Verify the code is valid before showing the form
  auth.verifyPasswordResetCode(_resetOobCode)
    .then(() => {
      document.getElementById('loginOverlay').style.display = 'none';
      document.getElementById('resetOverlay').classList.remove('hidden');
    })
    .catch(() => {
      document.getElementById('loginOverlay').style.display = '';
      _isHandlingPasswordReset = false;
      showLoginError('El enlace de restablecimiento es inválido o ya expiró. Solicitá uno nuevo.');
      history.replaceState(null, '', window.location.pathname);
    });
}

export async function submitPasswordReset() {
  const btn = document.getElementById('resetBtn');
  const errEl = document.getElementById('resetError');
  const password = document.getElementById('resetPassword').value;
  const confirm = document.getElementById('resetPasswordConfirm').value;

  errEl.classList.remove('show');

  if (password.length < 6) {
    errEl.textContent = 'La contraseña debe tener al menos 6 caracteres.';
    errEl.classList.add('show');
    return;
  }
  if (password !== confirm) {
    errEl.textContent = 'Las contraseñas no coinciden.';
    errEl.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    await auth.confirmPasswordReset(_resetOobCode, password);
    document.getElementById('resetPasswordConfirm').closest('.setup-field').style.display = 'none';
    document.getElementById('resetPassword').closest('.setup-field').style.display = 'none';
    btn.style.display = 'none';
    document.getElementById('resetSuccess').classList.add('show');
    history.replaceState(null, '', window.location.pathname);
  } catch (err) {
    btn.disabled = false;
    btn.textContent = 'Guardar contraseña';
    const msgs = {
      'auth/expired-action-code': 'El enlace expiró. Solicitá uno nuevo.',
      'auth/invalid-action-code': 'El enlace es inválido o ya fue usado.',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    };
    errEl.textContent = msgs[err.code] || 'Error: ' + err.message;
    errEl.classList.add('show');
  }
}

export function goToSignIn() {
  _isHandlingPasswordReset = false;
  document.getElementById('resetOverlay').classList.add('hidden');
  document.getElementById('loginOverlay').style.display = '';
}

// ====== EMAIL LINK SIGN-IN ======
let _pendingEmailLink = null; // holds the URL while waiting for email confirm

export function handleEmailLinkSignIn() {
  if (!auth.isSignInWithEmailLink(window.location.href)) return;

  const storedEmail = localStorage.getItem('emailForSignIn');
  if (storedEmail) {
    completeEmailLinkSignIn(storedEmail);
  } else {
    // No email stored — show in-app prompt instead of browser window.prompt()
    _pendingEmailLink = window.location.href;
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('emailConfirmOverlay').classList.remove('hidden');
    document.getElementById('emailConfirmInput').focus();
  }
}

export function submitEmailConfirm() {
  const btn = document.getElementById('emailConfirmBtn');
  const errEl = document.getElementById('emailConfirmError');
  const email = document.getElementById('emailConfirmInput').value.trim().toLowerCase();

  errEl.classList.remove('show');

  if (!email || !email.includes('@')) {
    errEl.textContent = 'Por favor ingresá un correo válido.';
    errEl.classList.add('show');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Verificando...';

  completeEmailLinkSignIn(email);
}

export function completeEmailLinkSignIn(email) {
  const link = _pendingEmailLink || window.location.href;
  document.getElementById('loginLoading').classList.add('show');
  auth.signInWithEmailLink(email, link)
    .then(() => {
      localStorage.removeItem('emailForSignIn');
      document.getElementById('emailConfirmOverlay').classList.add('hidden');
      history.replaceState(null, '', window.location.pathname);
      _pendingEmailLink = null;
    })
    .catch(err => {
      document.getElementById('loginLoading').classList.remove('show');
      // If called from overlay, show error there; otherwise show on login screen
      const errEl = document.getElementById('emailConfirmError');
      if (!document.getElementById('emailConfirmOverlay').classList.contains('hidden')) {
        const btn = document.getElementById('emailConfirmBtn');
        btn.disabled = false;
        btn.textContent = 'Continuar';
        errEl.textContent = getAuthError(err.code);
        errEl.classList.add('show');
      } else {
        document.getElementById('loginOverlay').classList.remove('hidden');
        showLoginError(getAuthError(err.code));
      }
    });
}

// ====== GOOGLE SIGN-IN ======
export function loginWithGoogle() {
  clearLoginError();
  document.getElementById('loginLoading').classList.add('show');
  const provider = new firebase.auth.GoogleAuthProvider();
  if (isMobile()) {
    auth.signInWithRedirect(provider);
  } else {
    auth.signInWithPopup(provider).catch(err => {
      document.getElementById('loginLoading').classList.remove('show');
      showLoginError(getAuthError(err.code));
    });
  }
}

// Handle redirect result (Google mobile sign-in)
auth.getRedirectResult().catch(err => {
  if (err.code) {
    showLoginError(getAuthError(err.code));
    document.getElementById('loginLoading').classList.remove('show');
  }
});

// ====== EMAIL + PASSWORD SIGN-IN ======
export function loginWithEmail() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  if (!email || !password) { showLoginError('Por favor ingresá tu correo y contraseña.'); return; }
  clearLoginError();
  document.getElementById('loginLoading').classList.add('show');
  auth.signInWithEmailAndPassword(email, password)
    .catch(err => {
      document.getElementById('loginLoading').classList.remove('show');
      showLoginError(getAuthError(err.code));
    });
}

// ====== SEND MAGIC LINK ======
export function sendLoginLink() {
  const email = document.getElementById('linkEmail').value.trim();
  if (!email) { showLoginError('Ingresá tu correo.'); return; }
  clearLoginError();
  const actionCodeSettings = { url: window.location.href, handleCodeInApp: true };
  auth.sendSignInLinkToEmail(email, actionCodeSettings)
    .then(() => {
      localStorage.setItem('emailForSignIn', email);
      showLoginError('✓ Enlace enviado a ' + email + '. Revisá tu bandeja de entrada.');
      document.getElementById('loginError').style.color = 'var(--accent-emerald)';
      document.getElementById('loginError').style.background = 'rgba(16,185,129,0.1)';
    })
    .catch(err => showLoginError(getAuthError(err.code)));
}

// ====== FORGOT PASSWORD ======
export function showForgotPassword() {
  const email = document.getElementById('loginEmail').value.trim();
  if (!email) { showLoginError('Ingresá tu correo arriba y luego hacé clic en este botón.'); return; }
  auth.sendPasswordResetEmail(email)
    .then(() => {
      showLoginError('✓ Correo de recuperación enviado a ' + email + '.');
      document.getElementById('loginError').style.color = 'var(--accent-emerald)';
      document.getElementById('loginError').style.background = 'rgba(16,185,129,0.1)';
    })
    .catch(err => showLoginError(getAuthError(err.code)));
}

// ====== TOGGLE MAGIC LINK SECTION ======
export function toggleLinkSection() {
  const section = document.getElementById('linkSection');
  section.classList.toggle('show');
}

// ====== LOGOUT ======
export function logout() {
  console.log('[DEBUG] logout() called');
  if (!confirm('¿Cerrar sesión?')) { console.log('[DEBUG] logout cancelled by user'); return; }
  const unsubCards = getUnsubCards();
  const unsubArchived = getUnsubArchived();
  const unsubProjects = getUnsubProjects();
  const unsubSnaps = getUnsubSnapshots();
  if (unsubCards) unsubCards();
  if (unsubArchived) unsubArchived();
  if (unsubProjects) unsubProjects();
  if (unsubSnaps) unsubSnaps();
  auth.signOut();
}

// ====== SETUP SCREEN ======
let _setupUser = null;
let _setupNeedsPassword = false;

export function showSetupScreen(user, needsPassword) {
  _setupUser = user;
  _setupNeedsPassword = needsPassword;
  document.getElementById('loginOverlay').classList.add('hidden');
  document.getElementById('setupOverlay').classList.remove('hidden');
  document.getElementById('setupPasswordFields').style.display = needsPassword ? '' : 'none';
  document.getElementById('setupName').value = user.displayName || '';
  document.getElementById('setupError').classList.remove('show');
}

export async function submitSetup() {
  const btn = document.getElementById('setupBtn');
  const errEl = document.getElementById('setupError');
  const name = document.getElementById('setupName').value.trim();
  const password = document.getElementById('setupPassword').value;
  const confirm = document.getElementById('setupPasswordConfirm').value;

  errEl.classList.remove('show');

  if (!name) { errEl.textContent = 'Por favor ingresá tu nombre.'; errEl.classList.add('show'); return; }
  if (_setupNeedsPassword) {
    if (password.length < 6) { errEl.textContent = 'La contraseña debe tener al menos 6 caracteres.'; errEl.classList.add('show'); return; }
    if (password !== confirm) { errEl.textContent = 'Las contraseñas no coinciden.'; errEl.classList.add('show'); return; }
  }

  btn.disabled = true;
  btn.textContent = 'Guardando...';

  try {
    await _setupUser.updateProfile({ displayName: name });
    if (_setupNeedsPassword) {
      await _setupUser.updatePassword(password);
    }

    const color = getNextAvatarColor();
    await db.collection('team').doc(_setupUser.uid).set({
      name,
      email: _setupUser.email,
      color,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    // Mark invite as accepted
    try {
      await db.collection('invites').doc(_setupUser.email).update({ status: 'accepted' });
    } catch(e) { /* admin users may not have invite doc */ }

    // onAuthStateChanged does NOT re-fire after updateProfile — navigate manually
    const user = auth.currentUser;
    _setupUser = null;
    _setupNeedsPassword = false;

    try {
      const adminDoc = await db.collection('admins').doc(user.email).get();
      if (adminDoc.exists) document.getElementById('adminBtn').style.display = 'inline-flex';
    } catch(e) { /* not admin */ }

    await loadTeam();
    document.getElementById('setupOverlay').classList.add('hidden');
    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('appHeader').style.display = '';
    document.getElementById('appToolbar').style.display = '';
    document.getElementById('userAvatar').src = user.photoURL || '';
    document.getElementById('userName').textContent = user.displayName || user.email;
    document.getElementById('userAvatar').alt = user.displayName || '';
    startFirestoreListeners({
      onCardsUpdate: () => {
        renderBoard();
        if (getCurrentView() === 'analytics') renderAnalytics();
      },
      onArchiveUpdate: () => {
        if (getCurrentView() === 'archive') renderArchive();
      },
    });
    const unsubProjects = startProjectsListener({
      onProjectsUpdate: () => { if (getCurrentView() === 'projects') renderProjects(); },
    });
    setUnsubProjects(unsubProjects);
    const unsubSnaps = startSnapshotsListener({
      onSnapshotsUpdate: () => { if (getCurrentView() === 'snapshot') renderSnapshots(); },
    });
    setUnsubSnapshots(unsubSnaps);
    toast('👋 Hola, ' + (user.displayName?.split(' ')[0] || 'usuario'));

  } catch(err) {
    btn.disabled = false;
    btn.textContent = 'Comenzar';
    errEl.textContent = getAuthError(err.code) || 'Error al guardar. Intentá de nuevo.';
    errEl.classList.add('show');
  }
}

// ====== AUTH STATE MACHINE ======
auth.onAuthStateChanged(async user => {
  // Don't process auth state while handling a password reset flow
  if (_isHandlingPasswordReset) return;

  setCurrentUser(user);

  if (user) {
    // --- 1. Check invite gate ---
    let isAdmin = false;
    try {
      const adminDoc = await db.collection('admins').doc(user.email).get();
      isAdmin = adminDoc.exists;
    } catch(e) { /* not admin */ }

    if (!isAdmin) {
      let inviteDoc;
      try {
        inviteDoc = await db.collection('invites').doc(user.email).get();
      } catch(e) { inviteDoc = { exists: false }; }

      if (!inviteDoc.exists) {
        auth.signOut();
        showLoginError('Acceso solo por invitación. Contactá a tu administrador.');
        return;
      }

      // --- 2. First-time setup: pending invite ----
      const isPending = inviteDoc.data().status === 'pending';
      const isEmailLink = user.providerData.some(p => p.providerId === 'password') === false
        && !user.providerData.some(p => p.providerId === 'google.com');

      if (isPending) {
        showSetupScreen(user, isEmailLink || !user.providerData.some(p => p.providerId === 'google.com'));
        return;
      }
    }

    // --- 3. First Google sign-in: no team doc yet ---
    let teamDoc;
    try {
      teamDoc = await db.collection('team').doc(user.uid).get();
    } catch(e) { teamDoc = { exists: false }; }

    if (!teamDoc.exists) {
      const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');
      showSetupScreen(user, !isGoogleUser);
      return;
    }

    // --- 4. All checks passed — show board ---
    if (isAdmin) {
      const adminBtn = document.getElementById('adminBtn');
      adminBtn.style.display = 'inline-flex';
    }

    await loadTeam();

    document.getElementById('loginOverlay').classList.add('hidden');
    document.getElementById('setupOverlay').classList.add('hidden');
    document.getElementById('appHeader').style.display = '';
    document.getElementById('appToolbar').style.display = '';

    document.getElementById('userAvatar').src = user.photoURL || '';
    document.getElementById('userName').textContent = user.displayName || user.email;
    document.getElementById('userAvatar').alt = user.displayName || '';

    startFirestoreListeners({
      onCardsUpdate: () => {
        renderBoard();
        if (getCurrentView() === 'analytics') renderAnalytics();
      },
      onArchiveUpdate: () => {
        if (getCurrentView() === 'archive') renderArchive();
      },
    });
    const unsubProjects = startProjectsListener({
      onProjectsUpdate: () => { if (getCurrentView() === 'projects') renderProjects(); },
    });
    setUnsubProjects(unsubProjects);
    const unsubSnaps = startSnapshotsListener({
      onSnapshotsUpdate: () => { if (getCurrentView() === 'snapshot') renderSnapshots(); },
    });
    setUnsubSnapshots(unsubSnaps);
    toast('👋 Hola, ' + (user.displayName?.split(' ')[0] || 'usuario'));

  } else {
    document.getElementById('loginOverlay').classList.remove('hidden');
    document.getElementById('setupOverlay').classList.add('hidden');
    document.getElementById('appHeader').style.display = 'none';
    document.getElementById('appToolbar').style.display = 'none';
    document.getElementById('adminBtn').style.display = 'none';
    document.getElementById('loginLoading').classList.remove('show');

    const unsubCards = getUnsubCards();
    const unsubArchived = getUnsubArchived();
    const unsubProjects = getUnsubProjects();
    const unsubSnaps = getUnsubSnapshots();
    if (unsubCards) { unsubCards(); setUnsubCards(null); }
    if (unsubArchived) { unsubArchived(); setUnsubArchived(null); }
    if (unsubProjects) { unsubProjects(); setUnsubProjects(null); }
    if (unsubSnaps) { unsubSnaps(); setUnsubSnapshots(null); }

    setCards([]);
    setArchivedCards([]);
    setTeam([]);
    setProjects([]);
    setSnapshots([]);
    setArchivedSnapshots([]);
    renderBoard();
  }
});

// ====== PAGE LOAD: handle URL-driven flows ======
handlePasswordReset();
handleEmailLinkSignIn();

