import * as backend from './db.js';
import { createStore } from './store.js';
import { createRingScreen } from './ring.js';
import { createTimelineScreen } from './timeline.js';
import { requestPersistence, isStandalone } from './platform.js';

const store = createStore(backend);
const ringRoot = document.getElementById('screen-ring');
const tlRoot   = document.getElementById('screen-timeline');

let ring, timeline;

function showRing() {
  tlRoot.setAttribute('hidden', '');
  ringRoot.removeAttribute('hidden');
  ring.render();
}

function showTimeline(id) {
  ringRoot.setAttribute('hidden', '');
  tlRoot.removeAttribute('hidden');
  timeline.open(id);
}

async function boot() {
  await store.load();
  ring = createRingScreen({ root: ringRoot, store, onOpen: showTimeline });
  timeline = createTimelineScreen({ root: tlRoot, store, onBack: showRing });
  ring.render();

  // Sayfa gizlenirken bekleyen yazma varsa hemen diske yaz
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') store.flush();
  });
  window.addEventListener('pagehide', () => store.flush());

  const { supported, granted } = await requestPersistence();
  console.log('kalıcı depolama:', { supported, granted, standalone: isStandalone() });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err =>
      console.warn('service worker kaydedilemedi:', err));
  }
}

boot();
