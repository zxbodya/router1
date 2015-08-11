import compileExpression from './compile.js';
import generatorFromExpression from './createGenerator.js';

describe('Router, generator from expression', function () {
  it('it generates strings without params', ()=> {
    let expression = compileExpression('aaaaa');
    let generator = generatorFromExpression(expression);

    expect(generator()).toBe('aaaaa');
    expect(generator({})).toBe('aaaaa');
    expect(generator({a: 123, b: 321})).toBe('aaaaa');
  });

  it('it generates strings with one param', ()=> {
    let expression = compileExpression('aaaaa<a>');
    let generator = generatorFromExpression(expression);

    expect(generator({a: 123})).toBe('aaaaa123');
    expect(generator({a: 321})).toBe('aaaaa321');
    expect(generator({a: 321, b: 444})).toBe('aaaaa321');
  });

  it('it generates strings with few params', ()=> {
    let expression = compileExpression('aaaaa<a>-<b>');
    let generator = generatorFromExpression(expression);

    expect(generator({a: 321, b: 1})).toBe('aaaaa321-1');
    expect(generator({a: 321, b: 444})).toBe('aaaaa321-444');
  });

  it('throws when parameters are missing', ()=> {
    let expression = compileExpression('aaaaa<a>-<b>');
    let generator = generatorFromExpression(expression);

    expect(()=>generator({a: 321, b: 1})).not.toThrow();
    expect(()=>generator({a: 321})).toThrow();
    expect(()=>generator({b: 1})).toThrow();
    expect(()=>generator({})).toThrow();
  });
});
