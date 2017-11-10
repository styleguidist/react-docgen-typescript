import * as React from "react";

export interface StatelessWithDefaultPropsProps {
  /** sampleJSDoc description
   * @default test
   */
  sampleJSDoc?: string;
  /** sampleProp description */
  sampleProp?: string;
}

/** StatelessWithDefaultProps description */
export const StatelessWithDefaultProps: React.StatelessComponent<StatelessWithDefaultPropsProps> = props =>
  <div>test</div>;

StatelessWithDefaultProps.defaultProps = {
  sampleProp: 'test'
};

export default StatelessWithDefaultProps;
