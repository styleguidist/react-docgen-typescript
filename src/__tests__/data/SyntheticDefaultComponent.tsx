import React from 'react';

export interface Props {
  /** prop1 description */
  prop1: boolean;
  /** prop2 description */
  prop2: string;
}

/**
 * SyntheticDefaultComponent description
 */
export default class SimpleComponent extends React.Component<Props> {
  render() {
    return <div>{this.props.prop1 && this.props.prop2}</div>;
  }
}
