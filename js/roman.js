const TABLE = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
];

/** Pozitif tam sayıyı Roma rakamına çevirir. */
export function roman(n) {
  if (!Number.isInteger(n) || n < 1) {
    throw new RangeError('roman: 1 veya daha büyük tam sayı gerekli, gelen: ' + n);
  }
  let rest = n;
  let out = '';
  for (const [value, letters] of TABLE) {
    while (rest >= value) {
      out += letters;
      rest -= value;
    }
  }
  return out;
}
