import * as React from 'react';

export interface StatelessWithDefaultValueOnlyJsDocProps {
  /**
   * @defaultValue hello
   */
  myProp: string;
}
/** StatelessWithDefaultValueOnlyJsDoc description */
export const StatelessWithDefaultValueOnlyJsDoc: React.StatelessComponent<StatelessWithDefaultValueOnlyJsDocProps> = props => (
  <div>My Property = {props.myProp}</div>
);
