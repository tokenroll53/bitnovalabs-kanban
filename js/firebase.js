/* Bitnova Kanban — firebase: init + exports auth and db instances */
// window.firebase is available from CDN <script> tags loaded before this module.

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBhkkxyxKvepFMzsAoZMEBNltyBJ7zfjA0",
  authDomain:        "bitnova-kanban.firebaseapp.com",
  projectId:         "bitnova-kanban",
  storageBucket:     "bitnova-kanban.firebasestorage.app",
  messagingSenderId: "1041942076502",
  appId:             "1:1041942076502:web:494ec7d03b04ce82232ff7",
  measurementId:     "G-PLMFD6NMYD",
};

firebase.initializeApp(FIREBASE_CONFIG);

export const auth = firebase.auth();
export const db   = firebase.firestore();

// Enable offline persistence (best-effort — fails silently on unsupported browsers)
db.enablePersistence({ synchronizeTabs: true }).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence: multiple tabs open');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence: browser not supported');
  }
});
