import { compileRoutes } from './compileRoutes';

describe('Router, compiling route collection', () => {
  it('compiles empty collection', () => {
    expect(compileRoutes([])).toEqual([]);
  });

  it('compiles flat route collection', () => {
    const compiled = compileRoutes([
      {
        name: 'route1',
        handler: {},
        url: 'aaa<param1>bbb',
      },
      {
        name: 'route2',
        handler: {},
        url: 'ccc<param2>ddd',
      },
      {
        name: 'route3',
        handler: {},
        url: 'ccc<param2>ddd?a',
      },
      {
        name: 'route4',
        handler: {},
        url: 'ccc<param2>ddd',
      },
      {
        name: 'route5',
        handler: {},
        url: 'ccc<param2>ddd?a&b',
      },
    ]);

    expect(compiled[0].name).toEqual('route1');
    expect(compiled[0].searchParams).toEqual([]);

    expect(compiled[1].name).toEqual('route2');
    expect(compiled[1].searchParams).toEqual([]);

    expect(compiled[2].name).toEqual('route3');
    expect(compiled[2].searchParams).toEqual(['a']);

    expect(compiled[3].name).toEqual('route4');
    expect(compiled[3].searchParams).toEqual([]);

    expect(compiled[4].name).toEqual('route5');
    expect(compiled[4].searchParams).toEqual(['a', 'b']);
  });

  it('compiles nested route collection', () => {
    const compiled = compileRoutes([
      {
        name: 'a',
        handler: {},
        url: 'aaa<param1>bbb',
      },
      {
        name: 'b',
        handler: {},
        url: 'ccc<param2>',
        routes: [
          {
            name: 'c',
            handler: {},
            url: 'ddd',
            routes: [
              {
                name: 'd',
                handler: {},
                url: '?a',
              },
              {
                name: 'e',
                handler: {},
                url: '?a&b',
              },
            ],
          },
        ],
      },
    ]);

    expect(compiled[0].name).toEqual('a');
    expect(compiled[0].searchParams).toEqual([]);

    expect(compiled[1].name).toEqual('b.c.d');
    expect(compiled[1].searchParams).toEqual(['a']);

    expect(compiled[2].name).toEqual('b.c.e');
    expect(compiled[2].searchParams).toEqual(['a', 'b']);
  });

  it('throws when route handler is missing', () => {
    expect(() => compileRoutes([
      { name: 'aaa' },
    ])).toThrow();
  });
  it('throws when route names are not uniq', () => {
    expect(() => compileRoutes([
      { name: 'aaa', handler: '1' },
      { name: 'aaa', handler: '2' },
    ])).toThrow();
  });

  it('allows to pass array of handlers', () => {
    const compiled = compileRoutes([
      {
        name: 'a1',
        handlers: ['0', '1'],
      },
    ]);

    expect(compiled[0].name).toEqual('a1');
    expect(compiled[0].handlers).toEqual(['0', '1']);
  });
  it('allows to pass array of handlers, prepends it with singular handler', () => {
    const compiled = compileRoutes([
      {
        name: 'a2',
        handler: '2',
        routes: [
          { name: 'a1', handlers: ['0', '1'] },
        ],
      },
    ]);

    expect(compiled[0].name).toEqual('a2.a1');
    expect(compiled[0].handlers).toEqual(['2', '0', '1']);
  });

  it('allows to pass array of handlers, appends it with singular handler', () => {
    const compiled = compileRoutes([
      {
        name: 'a3',
        handlers: ['0', '1'],
        routes: [
          { name: 'a1', handler: '2' },
        ],
      },
    ]);

    expect(compiled[0].name).toEqual('a3.a1');
    expect(compiled[0].handlers).toEqual(['0', '1', '2']);
  });

  it('allows to pass array of handlers, appends it with handlers array', () => {
    const compiled = compileRoutes([
      {
        name: 'a3',
        handlers: ['0', '1'],
        routes: [
          { name: 'a1', handlers: ['0', '1'] },
        ],
      },
    ]);

    expect(compiled[0].name).toEqual('a3.a1');
    expect(compiled[0].handlers).toEqual(['0', '1', '0', '1']);
  });
});
