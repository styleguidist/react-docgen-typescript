import * as React from 'react';

interface IPropsSource {
  foo: string;
}

interface IPropsExtended {
  bar: string;
}

type IProps = IPropsSource & IPropsExtended;

export class IntersectionPropsComponent extends React.Component<IProps, {}> {
  public render() {
    const { foo, bar } = this.props;

    return <div />;
  }
}
