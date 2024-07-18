import * as React from 'react';

export interface StatelessWithDefaultValueAndDescriptionJsDocProps {
  /**
   * The content
   *
   * @defaultValue hello
   */
  myProp: string;
}
/** StatelessWithDefaultValueAndDescriptionJsDoc description */
export const StatelessWithDefaultValueAndDescriptionJsDoc: React.StatelessComponent<StatelessWithDefaultValueAndDescriptionJsDocProps> = props => (
  <div>My Property = {props.myProp}</div>
);
