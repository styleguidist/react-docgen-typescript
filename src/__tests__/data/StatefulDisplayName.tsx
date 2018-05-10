import * as React from 'react';

export interface StatefullProps {
  /** myProp description */
  myProp: string;
}

/** Statefull description */
export class Statefull extends React.Component<StatefullProps> {
  static displayName = 'i am stateful displayName';
  render() {
    return <div>My Property = {this.props.myProp}</div>;
  }
}
