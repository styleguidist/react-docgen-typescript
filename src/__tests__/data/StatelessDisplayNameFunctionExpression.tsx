export interface StatelessFunctionExpressionProps {
  /** myProp description */
  myProp: string;
}

/** StatelessFunctionExpression description */
export function StatelessFunctionExpression(
  props: StatelessFunctionExpressionProps
) {
  return <div>My Property = {props.myProp}</div>;
}

StatelessFunctionExpression.displayName =
  'StatelessDisplayNameFunctionExpression';
