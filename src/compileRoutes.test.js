'use strict';
import compileRoutes from './compileRoutes.js';
import compileExpression from './expressions/compile.js';

describe('Router, compiling route collection', function () {
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

    expect(compiled[0][0].name).toEqual('route1');
    expect(compiled[0][0].path).toEqual(compileExpression('aaa<param1>bbb'));
    expect(compiled[0][0].searchParams).toEqual([]);

    expect(compiled[1][0].name).toEqual('route2');
    expect(compiled[1][0].path).toEqual(compileExpression('ccc<param2>ddd'));
    expect(compiled[1][0].searchParams).toEqual([]);

    expect(compiled[2][0].name).toEqual('route3');
    expect(compiled[2][0].path).toEqual(compileExpression('ccc<param2>ddd'));
    expect(compiled[2][0].searchParams).toEqual(['a']);

    expect(compiled[3][0].name).toEqual('route4');
    expect(compiled[3][0].path).toEqual(compileExpression('ccc<param2>ddd'));
    expect(compiled[3][0].searchParams).toEqual([]);

    expect(compiled[4][0].name).toEqual('route5');
    expect(compiled[4][0].path).toEqual(compileExpression('ccc<param2>ddd'));
    expect(compiled[4][0].searchParams).toEqual(['a', 'b']);
  });

  it('compiles route collection with nested routes', ()=> {
    let compiled = compileRoutes([
      {
        name: 'route1',
        url: 'aaa<param1>bbb',
        handler: {},
        routes: [
          {
            name: 'route2',
            handler: {},
            url: 'ccc<param2>ddd'
          },
          {
            name: 'route3',
            handler: {},
            url: 'ccc<param2>ddd?a',
            routes: [
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
            ]
          }
        ]
      }
    ]);

    expect(compiled[0][0].name).toEqual('route1');
    expect(compiled[0][0].path).toEqual(compileExpression('aaa<param1>bbb'));
    expect(compiled[0][0].searchParams).toEqual([]);

    expect(compiled[0][1].name).toEqual('route2');
    expect(compiled[0][1].path).toEqual(compileExpression('ccc<param2>ddd'));
    expect(compiled[0][1].searchParams).toEqual([]);

    expect(compiled[1][0].name).toEqual('route1');
    expect(compiled[1][0].path).toEqual(compileExpression('aaa<param1>bbb'));
    expect(compiled[1][0].searchParams).toEqual([]);

    expect(compiled[1][1].name).toEqual('route3');
    expect(compiled[1][1].path).toEqual(compileExpression('ccc<param2>ddd'));
    expect(compiled[1][1].searchParams).toEqual(['a']);

    expect(compiled[1][2].name).toEqual('route4');
    expect(compiled[1][2].path).toEqual(compileExpression('ccc<param2>ddd'));
    expect(compiled[1][2].searchParams).toEqual([]);


    expect(compiled[2][0].name).toEqual('route1');
    expect(compiled[2][0].path).toEqual(compileExpression('aaa<param1>bbb'));
    expect(compiled[2][0].searchParams).toEqual([]);

    expect(compiled[2][1].name).toEqual('route3');
    expect(compiled[2][1].path).toEqual(compileExpression('ccc<param2>ddd'));
    expect(compiled[2][1].searchParams).toEqual(['a']);

    expect(compiled[2][2].name).toEqual('route5');
    expect(compiled[2][2].path).toEqual(compileExpression('ccc<param2>ddd'));
    expect(compiled[2][2].searchParams).toEqual(['a', 'b']);
  });

  it('throws when route name is missing', ()=> {
    expect(()=>compileRoutes([
      {}
    ])).toThrow();
  });

  it('throws when route name is contains dots or slashes', ()=> {
    expect(()=>compileRoutes([
      {name: 'asdf/asdf'}
    ])).toThrow();

    expect(()=>compileRoutes([
      {name: 'asdf.asdf'}
    ])).toThrow();
  });

});