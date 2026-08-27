import { roman } from './roman.js';

// Geçici kanarya: font alt kümeleri doğru yüklendi mi?
// Ş, Ğ, İ harfleri latin-ext içindedir. Diğerlerinden farklı
// görünüyorlarsa latin-ext dosyası eksiktir.
document.getElementById('screen-ring').innerHTML =
  '<div style="font-family:var(--font-pixel);font-size:14px;line-height:2;padding:24px">' +
  'OVERWRITE<br>' + roman(14) + '<br>ŞİŞLİ GEZİSİ<br>ÇÖĞÜI ı</div>';
