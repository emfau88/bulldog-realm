/* Bulldog Realm — State + Save/Load (mobile-safe)
   - Single source of truth: one state object used by app.js
   - Persists to localStorage (with versioning)
   - Autosaves on mobile-friendly events + debounced saves after actions
*/
(function () {
  'use strict';

  const STORAGE_KEY = 'bulldogRealm_save_v2';
  const SAVE_VERSION = 2;

  let _state = null;
  let _saveTimer = null;

  function _deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function _sanitizeForSave(state) {
    // Don't persist derived fields that can be recomputed.
    const copy = _deepClone(state);
    delete copy.charData;
    return copy;
  }

  function _mergeInto(target, source) {
    if (!source || typeof source !== 'object') return target;
    for (const k of Object.keys(source)) {
      const sv = source[k];
      const tv = target[k];
      if (sv && typeof sv === 'object' && !Array.isArray(sv)) {
        if (!tv || typeof tv !== 'object' || Array.isArray(tv)) target[k] = {};
        _mergeInto(target[k], sv);
      } else {
        target[k] = sv;
      }
    }
    return target;
  }

  function loadRaw() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.v !== SAVE_VERSION || !parsed.data) return null;
      return parsed.data;
    } catch (e) {
      return null;
    }
  }

  function saveNow() {
    if (!_state) return;
    try {
      const payload = {
        v: SAVE_VERSION,
        ts: Date.now(),
        data: _sanitizeForSave(_state),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // ignore (quota / private mode)
    }
  }

  function saveSoon(delayMs = 250) {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
      _saveTimer = null;
      saveNow();
    }, delayMs);
  }

  function init(defaultState) {
    // Keep reference stable: app.js uses the returned object directly.
    _state = _deepClone(defaultState);

    const loaded = loadRaw();
    if (loaded) _mergeInto(_state, loaded);

    // Mobile-safe autosave hooks
    window.addEventListener('pagehide', () => saveNow(), { capture: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') saveNow();
    });
    window.addEventListener('beforeunload', () => saveNow());

    return _state;
  }

  function getState() {
    return _state;
  }

  // Expose
  window.BRState = {
    init,
    getState,
    saveNow,
    saveSoon,
    loadRaw,
    STORAGE_KEY,
    SAVE_VERSION,
  };
})();
