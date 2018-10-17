import { parse } from '../src';

describe('parse', () => {
  it('parses #=', () => {
    expect(parse('#= hello world')).toMatchInlineSnapshot(`
Object {
  "directives": Array [
    Object {
      "args": Array [
        "world",
      ],
      "directive": "hello",
      "loc": Object {
        "start": 0,
      },
      "source": "#= hello world",
    },
  ],
  "headerSource": "#= hello world",
  "source": "",
}
`);
  });

  it('parses //=', () => {
    expect(parse('//= hello world')).toMatchInlineSnapshot(`
Object {
  "directives": Array [
    Object {
      "args": Array [
        "world",
      ],
      "directive": "hello",
      "loc": Object {
        "start": 0,
      },
      "source": "//= hello world",
    },
  ],
  "headerSource": "//= hello world",
  "source": "",
}
`);
  });
});
