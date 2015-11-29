import {parse, generate} from './queryString';

describe('Query string utility', () => {
  it('parses empty query string', ()=> {
    expect(parse('')).toEqual({});
  });

  it('generates empty query string from empty object', ()=> {
    expect(generate({})).toEqual('');
  });

  it('parses query string with one param', ()=> {
    expect(parse('a=b')).toEqual({a: 'b'});
  });

  it('generates query string from object with one param', ()=> {
    expect(generate({a: 'b'})).toEqual('a=b');
  });

  it('parses query string with few params', ()=> {
    expect(parse('a=b&c=d')).toEqual({a: 'b', c: 'd'});
  });

  it('generates query string from object with few params', ()=> {
    expect(generate({a: 'b', c: 'd'})).toEqual('a=b&c=d');
  });

  it('parses query string with boolean param', ()=> {
    expect(parse('a=b&c')).toEqual({a: 'b', c: true});
  });

  it('parses query string with boolean param', ()=> {
    expect(parse('a=b', ['a', 'c'])).toEqual({a: 'b', c: false});
  });

  it('generates string with boolean param === true', ()=> {
    expect(generate({a: 'b', c: true})).toEqual('a=b&c');
  });

  it('generates string with boolean param === false', ()=> {
    expect(generate({a: 'b', c: false})).toEqual('a=b');
  });

  it('ignores params not specified in keys while parsing', ()=> {
    expect(parse('a=b&c=d', ['a'])).toEqual({a: 'b'});
  });

  it('ignores params not specified in keys when generating', ()=> {
    expect(generate({a: 'b', c: 'd'}, ['a'])).toEqual('a=b');
  });

  it('generates query string from object with empty string param', ()=> {
    expect(generate({a: 'b', c: ''})).toEqual('a=b&c=');
  });

  it('parses query string with empty string param', ()=> {
    expect(parse('a=b&c=')).toEqual({a: 'b', c: ''});
  });
});
