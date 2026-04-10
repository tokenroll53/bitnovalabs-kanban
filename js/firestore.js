/* Bitnova Kanban — firestore: persistence layer (Firestore listeners + CRUD) */

import { auth, db } from './firebase.js';
import {
  setCards, setArchivedCards,
  getCurrentUser, getCurrentView,
  getArchivedCards,
  setUnsubCards, setUnsubArchived,
} from './state.js';
import { toast } from './ui.js';
import { addNotification, isOwnId, registerOwnId } from './notifications.js';

// ====== FIRESTORE LISTENERS ======
// Accepts a callbacks object to avoid circular deps with render modules.
// onCardsUpdate() — called when cards collection changes
// onArchiveUpdate() — called when archivedCards collection changes
export function startFirestoreListeners({ onCardsUpdate, onArchiveUpdate }) {
  const syncEl = document.getElementById('syncStatus');
  let _cardsInitialized = false;

  // Listen to cards collection
  const unsubCards = db.collection('cards').orderBy('created', 'desc')
    .onSnapshot(snapshot => {
      if (_cardsInitialized) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added' &&
              !change.doc.metadata.hasPendingWrites &&
              !isOwnId(change.doc.id)) {
            const card = change.doc.data();
            addNotification({
              type: 'new-card',
              title: 'Nueva tarjeta',
              body: card.title || '(sin título)',
            });
          }
        });
      }
      _cardsInitialized = true;
      setCards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      onCardsUpdate();
      syncEl.className = 'sync-status';
      syncEl.title = 'Sincronizado';
    }, err => {
      console.error('Firestore cards error:', err);
      syncEl.className = 'sync-status error';
      syncEl.title = 'Error de sincronización';
    });

  setUnsubCards(unsubCards);

  // Listen to archivedCards collection
  const unsubArchived = db.collection('archivedCards').orderBy('archivedAt', 'desc')
    .onSnapshot(snapshot => {
      setArchivedCards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      onArchiveUpdate();
    }, err => {
      console.error('Firestore archive error:', err);
    });

  setUnsubArchived(unsubArchived);
}

// Online/offline status — registered once at module load
window.addEventListener('online', () => {
  const syncEl = document.getElementById('syncStatus');
  if (syncEl) { syncEl.className = 'sync-status'; syncEl.title = 'Sincronizado'; }
});
window.addEventListener('offline', () => {
  const syncEl = document.getElementById('syncStatus');
  if (syncEl) { syncEl.className = 'sync-status offline'; syncEl.title = 'Sin conexión (cambios se sincronizarán al reconectar)'; }
});

// ====== PERSISTENCE (Firestore) ======
export function firestoreSaveCard(card) {
  const { id, ...data } = card;
  const user = getCurrentUser();
  data.updatedAt = window.firebase.firestore.FieldValue.serverTimestamp();
  data.updatedBy = user?.displayName || user?.email || 'unknown';
  registerOwnId(id);
  return db.collection('cards').doc(id).set(data, { merge: true });
}

export function firestoreDeleteCard(cardId) {
  return db.collection('cards').doc(cardId).delete();
}

export function firestoreArchiveCard(archivedCard) {
  const { id, ...data } = archivedCard;
  const user = getCurrentUser();
  data.archivedBy = user?.displayName || user?.email || 'unknown';
  // Save to archive collection and delete from cards
  const batch = db.batch();
  batch.set(db.collection('archivedCards').doc(id), data);
  batch.delete(db.collection('cards').doc(id));
  return batch.commit();
}

export function firestoreRestoreCard(cardId) {
  const archivedCards = getArchivedCards();
  const archived = archivedCards.find(c => c.id === cardId);
  if (!archived) return Promise.resolve();
  const { archivedAt, archiveReason, archiveNote, columnAtArchive, columnNameAtArchive, archivedBy, ...cardData } = archived;
  const batch = db.batch();
  batch.set(db.collection('cards').doc(cardId), cardData);
  batch.delete(db.collection('archivedCards').doc(cardId));
  return batch.commit();
}

export function firestoreDeleteArchived(cardId) {
  return db.collection('archivedCards').doc(cardId).delete();
}
