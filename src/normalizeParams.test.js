import { normalizeParams } from './normalizeParams';

describe('normalizeParams', () => {
  it('converts path params to string', () => {
    expect(
      normalizeParams([], { a: 1, b: {}, c: false, d: true })
    ).toMatchSnapshot();
  });
  it('preserves boolean values in search params', () => {
    expect(
      normalizeParams(['c', 'd'], { a: 1, b: {}, c: false, d: true })
    ).toMatchSnapshot();
  });
});
