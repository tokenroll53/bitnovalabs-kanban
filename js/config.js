/* Bitnova Kanban — config: constants and static data */

export const COLUMNS = [
  { id: 'backlog',     title: 'Backlog / Leads',       color: 'var(--col-backlog)',   wip: 0 },
  { id: 'analysis',   title: 'En Análisis',            color: 'var(--col-analysis)',  wip: 5 },
  { id: 'development',title: 'En Desarrollo',          color: 'var(--col-dev)',       wip: 4 },
  { id: 'testing',    title: 'Testing / Revisión',     color: 'var(--col-testing)',   wip: 3 },
  { id: 'done',       title: 'Desplegado / Cerrado',   color: 'var(--col-done)',      wip: 0 },
];

export const LABELS = [
  { id: 'frontend', name: 'Frontend', class: 'label-frontend' },
  { id: 'backend',  name: 'Backend',  class: 'label-backend'  },
  { id: 'bug',      name: 'Bug',      class: 'label-bug'      },
  { id: 'feature',  name: 'Feature',  class: 'label-feature'  },
  { id: 'sales',    name: 'Ventas',   class: 'label-sales'    },
  { id: 'support',  name: 'Soporte',  class: 'label-support'  },
  { id: 'devops',   name: 'DevOps',   class: 'label-devops'   },
  { id: 'design',   name: 'Diseño',   class: 'label-design'   },
];

export const PRIORITIES = ['urgent', 'high', 'medium', 'low'];

export const AVATAR_PALETTE = [
  '#3b82f6','#10b981','#f59e0b','#8b5cf6','#ec4899',
  '#06b6d4','#f97316','#14b8a6','#6366f1','#f43f5e',
  '#84cc16','#a855f7',
];

export function isMobile() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export const PROJECT_TYPES = [
  { id: 'web_app',     label: 'Aplicación Web' },
  { id: 'mobile_app',  label: 'App Móvil' },
  { id: 'ecommerce',   label: 'E-commerce' },
  { id: 'landing',     label: 'Landing / Sitio Corporativo' },
  { id: 'automation',  label: 'Automatización / Integración' },
  { id: 'consulting',  label: 'Consultoría / Asesoría' },
  { id: 'maintenance', label: 'Mantenimiento / Soporte' },
  { id: 'chatbot',     label: 'Asistente Digital (Chatbot)' },
];

export const PROJECT_CODE_PREFIX = 'BL';
export const REUSE_PROJECT_CODE_GAPS = true;

export const SNAPSHOT_TIMESPAN_OPTIONS = [
  { label: '15 minutos', ms: 15 * 60 * 1000 },
  { label: '30 minutos', ms: 30 * 60 * 1000 },
  { label: '1 hora',     ms: 60 * 60 * 1000 },
  { label: '2 horas',    ms: 2 * 60 * 60 * 1000 },
  { label: '6 horas',    ms: 6 * 60 * 60 * 1000 },
  { label: '24 horas',   ms: 24 * 60 * 60 * 1000 },
  { label: '3 días',     ms: 3 * 24 * 60 * 60 * 1000 },
  { label: '7 días',     ms: 7 * 24 * 60 * 60 * 1000 },
];
export const SNAPSHOT_DEFAULT_VP = 100;
