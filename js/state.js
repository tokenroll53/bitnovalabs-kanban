/* Bitnova Kanban — state: shared mutable state with getters/setters */

import { AVATAR_PALETTE } from './config.js';

let _cards          = [];
let _archivedCards  = [];
let _team           = [];
let _currentUser    = null;
let _currentView    = 'board';
let _currentFilter  = 'all';
let _searchQuery    = '';
let _swimlanesEnabled = false;
let _unsubCards     = null;
let _unsubArchived  = null;

// Reuse a single element for HTML escaping (avoids repeated DOM allocations)
export const _escDiv = document.createElement('div');

export const getCards          = () => _cards;
export const setCards          = (v) => { _cards = v; };

export const getArchivedCards  = () => _archivedCards;
export const setArchivedCards  = (v) => { _archivedCards = v; };

export const getTeam           = () => _team;
export const setTeam           = (v) => { _team = v; };

export const getCurrentUser    = () => _currentUser;
export const setCurrentUser    = (v) => { _currentUser = v; };

export const getCurrentView    = () => _currentView;
export const setCurrentView    = (v) => { _currentView = v; };

export const getCurrentFilter  = () => _currentFilter;
export const setCurrentFilter  = (v) => { _currentFilter = v; };

export const getSearchQuery    = () => _searchQuery;
export const setSearchQuery    = (v) => { _searchQuery = v; };

export const isSwimlaneEnabled = () => _swimlanesEnabled;
export const setSwimlaneEnabled = (v) => { _swimlanesEnabled = v; };

export const getUnsubCards     = () => _unsubCards;
export const setUnsubCards     = (v) => { _unsubCards = v; };

export const getUnsubArchived  = () => _unsubArchived;
export const setUnsubArchived  = (v) => { _unsubArchived = v; };

let _projects       = [];
let _unsubProjects  = null;

export const getProjects       = () => _projects;
export const setProjects       = (v) => { _projects = v; };
export const getUnsubProjects  = () => _unsubProjects;
export const setUnsubProjects  = (v) => { _unsubProjects = v; };;

export function getNextAvatarColor() {
  const usedColors = new Set(_team.map(t => t.color));
  const unused = AVATAR_PALETTE.find(c => !usedColors.has(c));
  return unused ?? AVATAR_PALETTE[_team.length % AVATAR_PALETTE.length];
}
