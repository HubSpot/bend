export type RuleRef = string;
export type RuleFn = (...args: Array<any>) => Rule;
export type ConcreteRule = {};

export type AbstractRule = RuleRef | RuleFn;
export type Rule = AbstractRule | Array<AbstractRule | ConcreteRule>;
export type RuleResolver = (ruleName: string) => Rule;

export default function getRuleComposer(
  ruleResolver: RuleResolver,
  ...args: Array<any>
): (rules: Rule) => Array<ConcreteRule>
