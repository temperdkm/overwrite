/* INK!SANS — kapıdan girilen evrenin sahibi.
   Not yazılırken ağzı konuşuyormuş gibi oynuyor, gözlerindeki mürekkep
   şekilleri renk değiştiriyor.

   Kendi çizimimiz, hazır görsel değil: ağzın açılıp kapanması ve gözlerin
   renk döngüsü ancak parçalara ayrılmış bir çizimle yapılabilir. Ayrıca
   çevrimdışı çalışan bir uygulamada birkaç kilobayttan fazla yer tutmuyor
   ve her ekran boyutunda net kalıyor.

   id KULLANILMIYOR. Ekranda tek Ink var ama kural her yerde aynı tutuluyor:
   bu dosyadaki çizim ileride birden çok kez basılırsa (ör. glitch şeritleri)
   tekrarlanan id'ler sessizce bozulmaya yol açardı. */

const CIZIM =
  '<svg class="ink-svg" viewBox="0 0 100 118" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +

    /* Gövde: omuzdan aşağı hafif daralan bir palto. İlk denemede aşağı doğru
       AÇILIYORDU ve etek gibi duruyordu; gövde yukarıda geniş, aşağıda dar. */
    '<path d="M20 76 Q 50 90 80 76 L76 118 L24 118 Z" fill="#6E4A2C"/>' +
    '<path d="M20 76 Q 35 84 50 87 L50 118 L24 118 Z" fill="#7E5734"/>' +
    /* Yaka — gövdeyi düz bir kütle olmaktan çıkaran V */
    '<path d="M38 74 L50 88 L62 74 Q 50 80 38 74 Z" fill="#4E331C"/>' +

    /* Atkının sola savrulan ucu (gövdenin arkasından çıkıyor) */
    '<path d="M27 71 Q 12 84 7 112 L19 116 Q 22 90 34 78 Z" fill="#A5652F"/>' +
    /* Boyna dolanan kalın bant */
    '<path d="M28 62 Q 50 76 72 62 L75 74 Q 50 88 25 74 Z" fill="#C07C3E"/>' +
    '<path d="M28 62 Q 50 74 72 62 L72.8 65 Q 50 77 27.2 65 Z" fill="#D89A5C"/>' +

    /* Kafatası — atkının ÜSTÜNE çiziliyor, çene atkının içine giriyor */
    '<path d="M50 6 C 69 6, 80 19, 80 37 C 80 55, 69 66, 50 66 ' +
            'C 31 66, 20 55, 20 37 C 20 19, 31 6, 50 6 Z" fill="#F3EFE4"/>' +
    /* Sağ yanak gölgesi — kontur yerine iki dolgunun sınırı */
    '<path d="M50 6 C 69 6, 80 19, 80 37 C 80 55, 69 66, 50 66 ' +
            'C 61 58, 67 48, 67 35 C 67 21, 61 11, 50 6 Z" fill="#E2DCCC"/>' +

    /* Göz çukurları */
    '<ellipse cx="37" cy="34" rx="9.5" ry="10.5" fill="#191520"/>' +
    '<ellipse cx="63" cy="34" rx="9.5" ry="10.5" fill="#191520"/>' +

    /* Mürekkep şekilleri — Ink'in imzası, sürekli renk değiştirir.
       Sol dört köşeli yıldız, sağ daire. */
    '<path class="ink-goz ink-goz-sol" d="M37 26.5 L39.6 31.4 L44.5 34 L39.6 36.6 ' +
          'L37 41.5 L34.4 36.6 L29.5 34 L34.4 31.4 Z"/>' +
    '<circle class="ink-goz ink-goz-sag" cx="63" cy="34" r="5.2"/>' +

    /* AĞIZ. İki hâl üst üste duruyor; konuşurken CSS ikisini sırayla
       gösteriyor. Tek şekli deforme etmek yerine iki ayrı şekil kullanmak
       hem daha net görünüyor hem de steps() ile piksel oyunu hissi veriyor. */
    '<path class="ink-agiz-kapali" d="M35 49 Q 50 60 65 49" ' +
          'stroke="#191520" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
    '<path class="ink-agiz-acik" d="M35 48 Q 50 65 65 48 Q 50 55 35 48 Z" fill="#191520"/>' +

    /* Boya sıçramaları */
    '<circle cx="14" cy="96" r="2.6" fill="#4FB0E8" opacity=".85"/>' +
    '<circle cx="86" cy="88" r="2" fill="#E85A6B" opacity=".85"/>' +
    '<circle cx="83" cy="108" r="2.3" fill="#5CC98C" opacity=".8"/>' +
  '</svg>';

/** Ink'in DOM'unu kurar. */
export function makeInk() {
  const el = document.createElement('div');
  el.className = 'ink';
  el.innerHTML = CIZIM;               // kullanıcı metni İÇERMEZ, sabit çizim
  return el;
}

/**
 * Konuşma hâlini açıp kapatır. Yazarken açılır, yazı durunca kapanır —
 * çağıran taraf gecikmeyi kendisi yönetiyor.
 */
export function inkKonusuyor(el, aktif) {
  el.classList.toggle('konusuyor', !!aktif);
}
