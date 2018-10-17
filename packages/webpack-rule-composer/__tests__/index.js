/* @flow */

import type { RuleFn } from '../src';
import getRuleComposer from '../src';

describe('getRuleComposer', () => {
  const webpackOptions = {};
  const argv = {};
  const other = {};
  const args = [webpackOptions, argv, other];

  it('returns a function', () => {
    const ruleResolver = () => [];
    expect(typeof getRuleComposer(ruleResolver, ...args)).toBe('function');
  });

  describe('ruleComposer', () => {
    it('resolves string rule names to literal rules', () => {
      const ruleComposer = getRuleComposer(
        () => [{ test: /simple-string-result/ }],
        ...args
      );
      expect(ruleComposer('string')).toMatchSnapshot();
    });

    it('recursively resolves rule names to literal rules', () => {
      const ruleComposer = getRuleComposer(ruleName => {
        if (ruleName === 'recursive-lookup') {
          return ['look', 'harder', { test: /look-no-further/ }];
        } else if (ruleName === 'look') {
          return [{ test: /recursive-look-result/ }];
        } else {
          return [{ test: /recursive-harder-result/ }];
        }
      }, ...args);
      expect(ruleComposer('recursive-lookup')).toMatchSnapshot();
    });
  });

  it('supports functions that return literal rules', () => {
    const ruleComposer = getRuleComposer(() => [], ...args);
    expect(
      ruleComposer(() => [{ test: /simple-function-result/ }])
    ).toMatchSnapshot();
  });

  it('supports functions recursively', () => {
    const ruleComposer = getRuleComposer(() => [], ...args);
    expect(
      ruleComposer(() => () => [{ test: /recursive-function-result/ }])
    ).toMatchSnapshot();
  });

  it('recursively resolves mixed strings and functions', () => {
    const ruleComposer = getRuleComposer(ruleName => {
      if (ruleName === 'initial') {
        return ['foo', (() => 'foo': RuleFn), { test: /look-no-further/ }];
      } else if (ruleName === 'foo') {
        return [{ test: /i-show-up-twice/ }];
      } else {
        return [];
      }
    }, ...args);
    expect(ruleComposer('initial')).toMatchSnapshot();
  });
});
