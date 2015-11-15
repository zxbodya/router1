import compileRoutes from './compileRoutes.js';
import compileExpression from './expressions/compile.js';

describe('Router, compiling route collection', function() {
  it('compiles empty collection', ()=> {
    expect(compileRoutes([])).toEqual([]);
  });

  it('compiles flat route collection', ()=> {
    let compiled = compileRoutes([
      {
        name: 'route1',
        handler: {},
        url: 'aaa<param1>bbb'
      },
      {
        name: 'route2',
        handler: {},
        url: 'ccc<param2>ddd'
      },
      {
        name: 'route3',
        handler: {},
        url: 'ccc<param2>ddd?a'
      },
      {
        name: 'route4',
        handler: {},
        url: 'ccc<param2>ddd'
      },
      {
        name: 'route5',
        handler: {},
        url: 'ccc<param2>ddd?a&b'
      }
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


  it('throws when route name is missing', ()=> {
    expect(()=>compileRoutes([
      {}
    ])).toThrow();
  });

});
