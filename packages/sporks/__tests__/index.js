/* @flow */

import { parse } from '../src';

describe('parse', () => {
  it('parses #=', () => {
    expect(parse('#= hello world')).toMatchInlineSnapshot(`
      {
        "directives": [
          {
            "args": [
              "world",
            ],
            "directive": "hello",
            "loc": {
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
      {
        "directives": [
          {
            "args": [
              "world",
            ],
            "directive": "hello",
            "loc": {
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
      {
        "directives": [
          {
            "args": [
              "world",
            ],
            "directive": "hello",
            "loc": {
              "line": 1,
              "start": 0,
            },
            "source": "#= hello world",
          },
          {
            "args": [
              "mars",
            ],
            "directive": "hello",
            "loc": {
              "line": 2,
              "start": 0,
            },
            "source": "#= hello mars",
          },
          {
            "args": [
              "venus",
            ],
            "directive": "hello",
            "loc": {
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
