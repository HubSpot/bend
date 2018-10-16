/* @flow */

import shellwords from 'shellwords';

export type Directive = {
  directive: string,
  args: Array<string>,
  loc: { start: number },
  source: string,
};

export type ParseResult = {
  source: string,
  headerSource: string,
  directives: Array<Directive>,
};

// https://github.com/timmfin/sprockets-directive-loader/blob/3530b38ce7157989c65212f582eacfc04c803046/index.js#L11-L12

function extractHeader(source: string): string {
  const headerPattern = /^(?:\s*((?:\/[*](?:\s*|.+?)*?[*]\/)|(?:###\n(?:[\s\S]*)\n###)|(?:\/\/.*\n?)+|(?:#.*\n?)+)*)*/m;

  const match = headerPattern.exec(source);
  // Must be at the very beginning of the file
  if (match && match.index === 0) {
    return match[0];
  } else {
    return '';
  }
}

export function parse(source: string): ParseResult {
  source = source.toString();

  const headerSource = extractHeader(source);
  const bodySource = source.substr(headerSource.length);

  const directives = [];
  const headerLines = headerSource.split('\n').map(line => {
    const match = line.match(/^(\W*=)\s*(\w+)\s*(.*?)(\*\/)?$/);
    if (!match) {
      return line;
    }
    const directive = match[2];
    const args = shellwords.split(match[3]);
    directives.push({
      directive,
      args,
      loc: {
        // $FlowIssue https://github.com/facebook/flow/issues/3554
        start: match.index,
      },
      source: match[0],
    });
    return '';
  });

  return {
    source: headerLines.join('\n') + bodySource,
    headerSource,
    directives,
  };
}
