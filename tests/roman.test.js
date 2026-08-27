import { describe, it, expect } from 'vitest';
import { roman } from '../js/roman.js';

describe('roman', () => {
  it('tek harfli temel değerleri çevirir', () => {
    expect(roman(1)).toBe('I');
    expect(roman(5)).toBe('V');
    expect(roman(10)).toBe('X');
    expect(roman(50)).toBe('L');
    expect(roman(100)).toBe('C');
  });

  it('çıkarma kurallarını uygular', () => {
    expect(roman(4)).toBe('IV');
    expect(roman(9)).toBe('IX');
    expect(roman(40)).toBe('XL');
    expect(roman(90)).toBe('XC');
    expect(roman(400)).toBe('CD');
    expect(roman(900)).toBe('CM');
  });

  it('uygulamada geçecek sayıları çevirir', () => {
    expect(roman(3)).toBe('III');
    expect(roman(7)).toBe('VII');
    expect(roman(14)).toBe('XIV');
    expect(roman(20)).toBe('XX');
    expect(roman(48)).toBe('XLVIII');
    expect(roman(1987)).toBe('MCMLXXXVII');
  });

  it('geçersiz girdide RangeError fırlatır', () => {
    expect(() => roman(0)).toThrow(RangeError);
    expect(() => roman(-3)).toThrow(RangeError);
    expect(() => roman(2.5)).toThrow(RangeError);
    expect(() => roman('X')).toThrow(RangeError);
  });
});
