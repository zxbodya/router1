import { compile } from './compile';
import { createGenerator } from './createGenerator';

describe('Router, generator from expression', () => {
  it('it generates strings without params', () => {
    const expression = compile('aaaaa');
    const generator = createGenerator(expression);

    expect(generator()).toBe('aaaaa');
    expect(generator({})).toBe('aaaaa');
    expect(generator({ a: 123, b: 321 })).toBe('aaaaa');
  });

  it('it generates strings with one param', () => {
    const expression = compile('aaaaa<a>');
    const generator = createGenerator(expression);

    expect(generator({ a: 123 })).toBe('aaaaa123');
    expect(generator({ a: 321 })).toBe('aaaaa321');
    expect(generator({ a: 321, b: 444 })).toBe('aaaaa321');
  });

  it('it generates strings with few params', () => {
    const expression = compile('aaaaa<a>-<b>');
    const generator = createGenerator(expression);

    expect(generator({ a: 321, b: 1 })).toBe('aaaaa321-1');
    expect(generator({ a: 321, b: 444 })).toBe('aaaaa321-444');
  });

  it('it generates strings with few params', () => {
    const expression = compile('aaaaa<a:\\d+><b:\\w+>');
    const generator = createGenerator(expression);

    expect(generator({ a: 321, b: 'a' })).toBe('aaaaa321a');
    expect(generator({ a: 321, b: 'b' })).toBe('aaaaa321b');
  });

  it('throws when parameters are missing', () => {
    const expression = compile('aaaaa<a>-<b>');
    const generator = createGenerator(expression);

    expect(() => generator({ a: 321, b: 1 })).not.toThrow();
    expect(() => generator({ a: 321 })).toThrow();
    expect(() => generator({ b: 1 })).toThrow();
    expect(() => generator({})).toThrow();
  });
});
