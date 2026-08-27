import { defineConfig } from 'vitest/config';

// Varsayılan node. DOM gereken tek dosya olan editable.test.js
// kendi başına `// @vitest-environment jsdom` satırıyla belirtiyor.
// db.test.js için jsdom gerekmiyor: fake-indexeddb node'da da çalışıyor.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js']
  }
});
