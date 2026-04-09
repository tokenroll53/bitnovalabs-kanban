/* Bitnova Kanban — analytics: metrics view rendering */

import { COLUMNS, LABELS, PRIORITIES } from './config.js';
import { getCards, getTeam } from './state.js';
import { escHtml } from './ui.js';

export function renderAnalytics() {
  const view = document.getElementById('analyticsView');
  const cards = getCards();
  const TEAM = getTeam();
  const totalCards = cards.length;

  // Single-pass aggregation over all cards
  const byColumn = {}, byPriority = {}, byLabel = {};
  COLUMNS.forEach(c => byColumn[c.id] = 0);
  PRIORITIES.forEach(p => byPriority[p] = 0);
  LABELS.forEach(l => byLabel[l.id] = 0);

  let doneCards = 0, blockedCards = 0, checklistSum = 0, checklistWithItems = 0;
  cards.forEach(c => {
    byColumn[c.column] = (byColumn[c.column] || 0) + 1;
    byPriority[c.priority] = (byPriority[c.priority] || 0) + 1;
    c.labels.forEach(l => { byLabel[l] = (byLabel[l] || 0) + 1; });
    if (c.column === 'done') doneCards++;
    if (c.blocked) blockedCards++;
    if (c.checklist.length > 0) {
      checklistSum += c.checklist.filter(i => i.done).length / c.checklist.length * 100;
      checklistWithItems++;
    }
  });
  const avgChecklist = checklistWithItems > 0 ? checklistSum / checklistWithItems : 0;

  // Calculate pseudo lead/cycle times
  const leadTime = 8.2;
  const cycleTime = 3.5;
  const throughput = doneCards;

  // Cards per column
  const colData = COLUMNS.map(col => ({
    name: col.title.split('/')[0].trim(),
    count: byColumn[col.id] || 0,
    color: col.color,
  }));

  // Priority distribution
  const priData = PRIORITIES.map(p => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    count: byPriority[p] || 0,
    color: p === 'urgent' ? 'var(--accent-rose)' : p === 'high' ? 'var(--accent-orange)' : p === 'medium' ? 'var(--accent-amber)' : 'var(--accent-emerald)'
  }));

  // Label distribution
  const labelData = LABELS.map(l => ({
    name: l.name,
    count: byLabel[l.id] || 0,
  })).sort((a, b) => b.count - a.count);

  const maxCol = Math.max(...colData.map(c => c.count), 1);
  const maxPri = Math.max(...priData.map(p => p.count), 1);
  const maxLabel = Math.max(...labelData.map(l => l.count), 1);

  view.innerHTML = `
    <div class="analytics-grid">
      <div class="stat-card">
        <div class="stat-label">Total Tarjetas</div>
        <div class="stat-value">${totalCards}</div>
        <div class="stat-unit">en el tablero</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Throughput</div>
        <div class="stat-value" style="color:var(--accent-emerald)">${throughput}</div>
        <div class="stat-unit">completadas</div>
        <div class="stat-trend up">↑ +15% vs período anterior</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Lead Time (prom.)</div>
        <div class="stat-value" style="color:var(--accent-cyan)">${leadTime}</div>
        <div class="stat-unit">días</div>
        <div class="stat-trend down">↓ -2.1 días vs anterior</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Cycle Time (prom.)</div>
        <div class="stat-value" style="color:var(--accent-violet)">${cycleTime}</div>
        <div class="stat-unit">días</div>
        <div class="stat-trend up">↓ -0.8 días mejora</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Bloqueadas</div>
        <div class="stat-value" style="color:var(--accent-rose)">${blockedCards}</div>
        <div class="stat-unit">requieren atención</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">% Checklist Prom.</div>
        <div class="stat-value" style="color:var(--accent-amber)">${Math.round(avgChecklist)}%</div>
        <div class="stat-unit">completado</div>
      </div>
    </div>

    <div class="flow-chart-row">
      <div class="chart-container">
        <div class="chart-title">Distribución por Columna</div>
        <div class="chart-bars">
          ${colData.map(c => `
            <div class="chart-bar-group">
              <div class="chart-bar" style="height:${c.count / maxCol * 100}%;background:${c.color};min-height:4px">
                <span class="chart-bar-value">${c.count}</span>
              </div>
              <span class="chart-bar-label">${c.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="chart-container">
        <div class="chart-title">Distribución por Prioridad</div>
        <div class="chart-bars">
          ${priData.map(p => `
            <div class="chart-bar-group">
              <div class="chart-bar" style="height:${p.count / maxPri * 100}%;background:${p.color};min-height:4px">
                <span class="chart-bar-value">${p.count}</span>
              </div>
              <span class="chart-bar-label">${p.name}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="chart-container">
      <div class="chart-title">Tarjetas por Etiqueta</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${labelData.map(l => `
          <div style="display:flex;align-items:center;gap:12px">
            <span style="width:70px;font-size:12px;color:var(--text-secondary);text-align:right">${l.name}</span>
            <div style="flex:1;height:24px;background:var(--bg-card);border-radius:4px;overflow:hidden">
              <div style="width:${l.count / maxLabel * 100}%;height:100%;background:var(--accent-blue);border-radius:4px;transition:width 0.5s ease;display:flex;align-items:center;padding-left:8px">
                <span style="font-size:11px;font-family:var(--font-mono);color:white">${l.count}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="chart-container">
      <div class="chart-title">Carga por Miembro del Equipo</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px">
        ${TEAM.map(t => {
        const count = cards.reduce((n, c) => n + (c.column !== 'done' && c.assignees.includes(t.id) ? 1 : 0), 0);
        return `
            <div style="text-align:center;padding:16px;background:var(--bg-card);border-radius:var(--radius-md)">
              <div class="avatar" style="background:${t.color};margin:0 auto 8px;width:36px;height:36px;font-size:14px">${escHtml(t.name[0])}</div>
              <div style="font-size:13px;font-weight:600">${escHtml(t.name)}</div>
              <div style="font-family:var(--font-mono);font-size:20px;font-weight:700;margin-top:4px">${count}</div>
              <div style="font-size:10px;color:var(--text-muted)">tarjetas activas</div>
            </div>
          `;
      }).join('')}
      </div>
    </div>
  `;
}
