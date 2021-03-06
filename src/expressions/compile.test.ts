import { compile } from './compile';

describe('Router, expression parsing', () => {
  const tests = [
    {
      expression: 'aaaaaaa',
      expected: ['aaaaaaa', ['aaaaaaa'], []],
      description: 'parses expression without params',
    },
    {
      expression: '-[]/{}()*+?.\\^$|',
      expected: [
        '-\\[\\]/\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|',
        ['-[]/{}()*+?.\\^$|'],
        [],
      ],
      description: 'it escapes regexp special symbols in text',
    },
    {
      expression: '<aaaaaaa>',
      expected: ['(.*)', ['', null, ''], ['aaaaaaa']],
      description: 'parses expression from one param with default regexp',
    },
    {
      expression: '<aaaaaaa:\\d+>',
      expected: ['(\\d+)', ['', null, ''], ['aaaaaaa']],
      description: 'parses expression from one param with custom regexp',
    },
    {
      expression: '<a1:\\d+><a2:\\d+><a3>',
      expected: [
        '(\\d+)(\\d+)(.*)',
        ['', null, '', null, '', null, ''],
        ['a1', 'a2', 'a3'],
      ],
      description: 'parses expression from few params',
    },
    {
      expression: '123<a1:\\d+>456<a2:\\d+>789<a3>0',
      expected: [
        '123(\\d+)456(\\d+)789(.*)0',
        ['123', null, '456', null, '789', null, '0'],
        ['a1', 'a2', 'a3'],
      ],
      description: 'parses expression from few params with text aroud them',
    },
  ];

  tests.forEach((test, testIndex) => {
    const { expression, expected, description } = test;

    it(description || `passes test #${testIndex}`, () => {
      const compiled = compile(expression);
      expect(compiled).toEqual(expected);
    });
  });

  it('throws for incorrect expression', () => {
    expect(() => compile('aaaa<aaaa')).toThrow();
    expect(() => compile('aaaa>aaaa')).toThrow();
    expect(() => compile('aaaa<>aaaa')).toThrow();
    expect(() => compile('aaaa<<>>aaaa')).toThrow();
    expect(() => compile('aaaa<aaaa:>aaaa')).toThrow();
    expect(() => compile('aaaa<:\\d+>aaaa')).toThrow();
  });

  it('throws for incorrect param regexp', () => {
    expect(() => compile('aaaa<a:(\\d+)>aaaa')).toThrow();
    expect(() => compile('aaaa<a:(?:\\d+)>aaaa')).not.toThrow();
    expect(() => compile('aaaa<a:(?!\\ad+)>aaaa')).not.toThrow();
    expect(() => compile('aaaa<a:(?=\\d+)>aaaa')).not.toThrow();
  });

  it('throws for incorrect expression', () => {
    expect(() =>
      compile('/cart/<tab:items|delivery>|login|payment>')
    ).toThrow();
    //                         problem is here ------------^
    // /^(?:(?:[^<>:])*(?:<([^>:]+?)(?::([^>]+))?>)*(?:[^<>:])*)*$/.test(expression)
    // had timeout there
  });
});
