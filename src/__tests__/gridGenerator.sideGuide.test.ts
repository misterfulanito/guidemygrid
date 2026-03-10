import { generateSideGuide } from '../services/gridGenerator';

describe('generateSideGuide — canvas (no selection)', () => {
  const params = { containerWidth: 1920, containerHeight: 1080, offsetX: 0, offsetY: 0 };

  test('left → x=0, vertical', () => {
    expect(generateSideGuide('left', params)).toEqual({ position: 0, orientation: 'vertical' });
  });
  test('center-v → x=960, vertical', () => {
    expect(generateSideGuide('center-v', params)).toEqual({ position: 960, orientation: 'vertical' });
  });
  test('right → x=1920, vertical', () => {
    expect(generateSideGuide('right', params)).toEqual({ position: 1920, orientation: 'vertical' });
  });
  test('top → y=0, horizontal', () => {
    expect(generateSideGuide('top', params)).toEqual({ position: 0, orientation: 'horizontal' });
  });
  test('center-h → y=540, horizontal', () => {
    expect(generateSideGuide('center-h', params)).toEqual({ position: 540, orientation: 'horizontal' });
  });
  test('bottom → y=1080, horizontal', () => {
    expect(generateSideGuide('bottom', params)).toEqual({ position: 1080, orientation: 'horizontal' });
  });
});

describe('generateSideGuide — selection (with offset)', () => {
  const params = { containerWidth: 800, containerHeight: 600, offsetX: 100, offsetY: 50 };

  test('left → x=100', () => {
    expect(generateSideGuide('left', params)).toEqual({ position: 100, orientation: 'vertical' });
  });
  test('center-v → x=500', () => {
    expect(generateSideGuide('center-v', params)).toEqual({ position: 500, orientation: 'vertical' });
  });
  test('right → x=900', () => {
    expect(generateSideGuide('right', params)).toEqual({ position: 900, orientation: 'vertical' });
  });
  test('top → y=50', () => {
    expect(generateSideGuide('top', params)).toEqual({ position: 50, orientation: 'horizontal' });
  });
  test('center-h → y=350', () => {
    expect(generateSideGuide('center-h', params)).toEqual({ position: 350, orientation: 'horizontal' });
  });
  test('bottom → y=650', () => {
    expect(generateSideGuide('bottom', params)).toEqual({ position: 650, orientation: 'horizontal' });
  });
});
