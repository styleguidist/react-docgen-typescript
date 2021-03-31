import * as React from 'react';

const PROPERTY1_DEFAULT = 'hello';
const PROPERTY2_DEFAULT = 10;
const PROPERTY3_DEFAULT = 'goodbye';

type Props = {
  /**
   * prop1 description
   * @default 'hello'
   */
  prop1?: 'hello' | 'world';
  /**
   * prop2 description
   * @default 10
   */
  prop2?: number;
  /**
   * prop3 description
   * @default 'goodbye'
   */
  prop3?: string;
  /**
   * prop4 description
   * @default 100
   */
  prop4?: number;
};

/** FunctionalComponentWithDesctructuredProps description */
const FunctionalComponentWithDesctructuredProps: React.FC<Props> = ({
  prop1 = PROPERTY1_DEFAULT,
  prop2 = PROPERTY2_DEFAULT,
  prop3 = PROPERTY3_DEFAULT,
  prop4 = 100
}) => <div />;

export default FunctionalComponentWithDesctructuredProps;
