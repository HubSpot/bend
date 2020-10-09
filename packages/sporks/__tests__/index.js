/* @flow */

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
        "line": 1,
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
        "line": 1,
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

  it('parses multiple lines', () => {
    expect(parse('#= hello world\n#= hello mars\n#\n\n#= hello venus\n\n'))
      .toMatchInlineSnapshot(`
Object {
  "directives": Array [
    Object {
      "args": Array [
        "world",
      ],
      "directive": "hello",
      "loc": Object {
        "line": 1,
        "start": 0,
      },
      "source": "#= hello world",
    },
    Object {
      "args": Array [
        "mars",
      ],
      "directive": "hello",
      "loc": Object {
        "line": 2,
        "start": 0,
      },
      "source": "#= hello mars",
    },
    Object {
      "args": Array [
        "venus",
      ],
      "directive": "hello",
      "loc": Object {
        "line": 5,
        "start": 0,
      },
      "source": "#= hello venus",
    },
  ],
  "headerSource": "#= hello world
#= hello mars
#

#= hello venus

",
  "source": "

#



",
}
`);
  });
});
