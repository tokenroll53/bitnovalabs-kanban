/* Bitnova Kanban — notifications: in-memory bell store */

// ====== IN-MEMORY STORE ======

const _notifications = [];  // newest first
const _ownIds = new Set();  // doc IDs written by this client — skip in docChanges

// ====== OWN-ID GUARD ======

export function registerOwnId(id) {
  _ownIds.add(String(id));
}

export function isOwnId(id) {
  return _ownIds.has(String(id));
}

// ====== STORE API ======

export function addNotification({ type, title, body }) {
  const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : String(Date.now() + Math.random());
  _notifications.unshift({ id, type, title, body, timestamp: Date.now(), read: false });
  _updateBadge();
}

export function markAllRead() {
  _notifications.forEach(n => { n.read = true; });
  _updateBadge();
  _renderPanel();
}

export function markRead(id) {
  const n = _notifications.find(n => n.id === id);
  if (n) n.read = true;
  _updateBadge();
}

export function clearNotifications() {
  _notifications.length = 0;
  _ownIds.clear();
  _updateBadge();
}

export function getNotifications() {
  return _notifications;
}

// ====== BADGE ======

function _updateBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  const count = _notifications.filter(n => !n.read).length;
  badge.textContent = count > 9 ? '9+' : String(count);
  badge.style.display = count > 0 ? '' : 'none';
}

// ====== PANEL ======

export function toggleNotificationPanel() {
  const panel = document.getElementById('notificationPanel');
  if (!panel) return;
  if (panel.classList.contains('open')) {
    panel.classList.remove('open');
  } else {
    _renderPanel();
    panel.classList.add('open');
  }
}

export function closeNotificationPanel() {
  document.getElementById('notificationPanel')?.classList.remove('open');
}

function _renderPanel() {
  const panel = document.getElementById('notificationPanel');
  if (!panel) return;

  const rows = _notifications.length
    ? _notifications.map(n => `
        <div class="notif-row${n.read ? '' : ' unread'}" data-id="${_esc(n.id)}" data-type="${_esc(n.type)}">
          <span class="notif-icon">${_icon(n.type)}</span>
          <div class="notif-content">
            <div class="notif-title">${_esc(n.title)}</div>
            <div class="notif-body">${_esc(n.body)}</div>
            <div class="notif-time">${_relTime(n.timestamp)}</div>
          </div>
        </div>`).join('')
    : '<div class="notif-empty">Sin notificaciones</div>';

  panel.innerHTML = `
    <div class="notif-header">
      <span>Notificaciones</span>
      <button class="notif-mark-all" id="notifMarkAll">Marcar todo leído</button>
    </div>
    <div class="notif-list">${rows}</div>`;
}

function _icon(type) {
  const icons = {
    'app-update':   '⬆',
    'new-card':     '🗂',
    'new-project':  '📁',
    'new-snapshot': '⏱',
  };
  return icons[type] ?? '🔔';
}

function _relTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60_000)      return 'Ahora mismo';
  if (diff < 3_600_000)   return `Hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000)  return `Hace ${Math.floor(diff / 3_600_000)} h`;
  return new Date(ts).toLocaleDateString('es');
}

function _esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
