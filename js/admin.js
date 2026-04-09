/* Bitnova Kanban — admin: team loading and admin panel */

import { auth, db } from './firebase.js';
import { getTeam, setTeam, getCurrentUser, getNextAvatarColor } from './state.js';
import { escHtml, toast } from './ui.js';

// ====== TEAM LOADING ======
export async function loadTeam() {
  try {
    const snapshot = await db.collection('team').get();
    setTeam(snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })));
  } catch(e) {
    console.warn('Could not load team:', e);
    setTeam([]);
  }
}

// ====== ADMIN PANEL ======
export function openAdminPanel() {
  document.getElementById('adminModal').classList.add('open');
  document.getElementById('inviteFeedback').textContent = '';
  document.getElementById('inviteEmail').value = '';
  loadInviteList();
}

export function closeAdminPanel() {
  document.getElementById('adminModal').classList.remove('open');
}

export async function sendInvitation() {
  const emailInput = document.getElementById('inviteEmail');
  const feedback = document.getElementById('inviteFeedback');
  const email = emailInput.value.trim().toLowerCase();

  feedback.textContent = '';
  feedback.className = 'invite-feedback';

  if (!email || !email.includes('@')) {
    feedback.textContent = 'Ingresá un correo válido.';
    feedback.classList.add('err');
    return;
  }

  // Check for duplicate
  try {
    const existing = await db.collection('invites').doc(email).get();
    if (existing.exists) {
      feedback.textContent = 'Ya existe una invitación para ' + email + '.';
      feedback.classList.add('err');
      return;
    }
  } catch(e) { /* proceed */ }

  try {
    const currentUser = getCurrentUser();
    await db.collection('invites').doc(email).set({
      invitedBy: currentUser.email,
      invitedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    });

    const actionCodeSettings = { url: window.location.href, handleCodeInApp: true };
    await auth.sendSignInLinkToEmail(email, actionCodeSettings);

    feedback.textContent = '✓ Invitación enviada a ' + email;
    feedback.classList.add('ok');
    emailInput.value = '';
    loadInviteList();
  } catch(err) {
    feedback.textContent = 'Error al enviar: ' + (getAuthError(err.code) || err.message);
    feedback.classList.add('err');
  }
}

export async function loadInviteList() {
  const container = document.getElementById('inviteList');
  container.innerHTML = '<div class="invite-empty">Cargando...</div>';
  try {
    const snapshot = await db.collection('invites').orderBy('invitedAt', 'desc').get();
    if (snapshot.empty) {
      container.innerHTML = '<div class="invite-empty">No hay invitaciones aún.</div>';
      return;
    }
    let html = '<table class="invite-table"><thead><tr>'
      + '<th>Correo</th><th>Invitado por</th><th>Fecha</th><th>Estado</th><th></th>'
      + '</tr></thead><tbody>';
    const TEAM = getTeam();
    snapshot.docs.forEach(doc => {
      const d = doc.data();
      const date = d.invitedAt?.toDate ? d.invitedAt.toDate().toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' }) : '—';
      const badge = d.status === 'accepted'
        ? '<span class="badge-accepted">Activo</span>'
        : '<span class="badge-pending">Pendiente</span>';
      const teamColor = TEAM.find(t => t.email === doc.id)?.color || '#8b9dc3';
      html += `<tr>
        <td class="email-cell"><span class="color-dot" style="background:${escHtml(teamColor)}"></span>${escHtml(doc.id)}</td>
        <td>${escHtml(d.invitedBy || '—')}</td>
        <td style="font-family:var(--font-mono);font-size:11px">${escHtml(date)}</td>
        <td>${badge}</td>
        <td><button class="btn-revoke" onclick="revokeInvite('${escHtml(doc.id)}')">Revocar</button></td>
      </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = '<div class="invite-empty">Error al cargar invitaciones.</div>';
    console.error(e);
  }
}

export async function revokeInvite(email) {
  if (!confirm('¿Revocar acceso para ' + email + '? Esta persona no podrá entrar a la app.')) return;
  try {
    await db.collection('invites').doc(email).delete();
    // Also remove from team collection if exists
    const teamSnap = await db.collection('team').where('email', '==', email).get();
    const batch = db.batch();
    teamSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    // Refresh team in memory
    setTeam(getTeam().filter(t => t.email !== email));
    loadInviteList();
    toast('Acceso revocado para ' + email);
  } catch(err) {
    toast('Error al revocar: ' + err.message);
    console.error(err);
  }
}

// Inline auth error helper needed by sendInvitation — mirrors getAuthError from auth.js
// (admin.js is imported before auth.js, so we define a minimal version here)
function getAuthError(code) {
  const errors = {
    'auth/invalid-email': 'Por favor ingresá un correo válido.',
    'auth/too-many-requests': 'Demasiados intentos. Esperá unos minutos e intentá de nuevo.',
  };
  return errors[code] || (code ? `Error (${code}).` : null);
}

// Expose revokeInvite to window — called via onclick in dynamically generated invite table rows
window.revokeInvite = revokeInvite;
