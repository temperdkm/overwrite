import * as backend from './db.js';
import { createStore } from './store.js';
import { createRingScreen } from './ring.js';

const store = createStore(backend);

async function boot() {
  await store.load();
  createRingScreen({
    root: document.getElementById('screen-ring'),
    store,
    onOpen: (id) => { console.log('timeline açılacak:', id); }
  }).render();
}

boot();
