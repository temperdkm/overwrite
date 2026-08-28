/**
 * Kalıcı depolama ister. iOS 17+ destekliyor ve WebKit izni verirken
 * "ana ekran uygulaması olarak açılmış mı" kriterine bakıyor.
 * İzin verilirse tarayıcı depolama baskısında bu veriyi silmez.
 */
export async function requestPersistence() {
  if (!navigator.storage || !navigator.storage.persist) {
    return { supported: false, granted: false };
  }
  try {
    const already = await navigator.storage.persisted();
    if (already) return { supported: true, granted: true };
    const granted = await navigator.storage.persist();
    return { supported: true, granted };
  } catch {
    return { supported: true, granted: false };
  }
}

/** Ana ekrandan mı açıldı (adres çubuğu yok)? */
export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}
