/* @flow */

export type RuleRef = string;
export type RuleFn = (...args: Array<any>) => Rule;
export type ConcreteRule = {};

export type AbstractRule = RuleRef | RuleFn;
export type Rule = AbstractRule | Array<AbstractRule | ConcreteRule>;
export type RuleResolver = (ruleName: string) => Rule;

export default function getRuleComposer(
  ruleResolver: RuleResolver,
  ...args: Array<any>
) {
  return function composeRulesRec(rules: Rule): Array<ConcreteRule> {
    if (typeof rules === 'string') {
      return composeRulesRec(ruleResolver(rules));
    } else if (typeof rules === 'function') {
      return composeRulesRec(rules(...args));
    } else if (Array.isArray(rules)) {
      return [].concat(
        ...rules.map(rule => {
          if (typeof rule === 'string') {
            return composeRulesRec(rule);
          } else if (typeof rule === 'function') {
            return composeRulesRec(rule(...args));
          } else {
            return [rule];
          }
        })
      );
    }
    throw new Error(
      `Rule is not an array or cannot be further resolved: ${JSON.stringify(
        rules,
        null,
        2
      )}`
    );
  }
}
