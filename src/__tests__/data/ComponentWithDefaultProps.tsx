import * as React from 'react';

/** IComponentWithDefaultPropsProps props */
export interface IComponentWithDefaultPropsProps {
  /**
   * sample with default value
   * @default hello
   */
  sampleDefaultFromJSDoc: 'hello' | 'goodbye';
  /** sampleTrue description */
  sampleTrue?: boolean;
  /** sampleFalse description */
  sampleFalse?: boolean;
  /** sampleString description */
  sampleString?: string;
  /** sampleObject description */
  sampleObject?: { [key: string]: any; };
  /** sampleNull description */
  sampleNull?: null;
  /** sampleUndefined description */
  sampleUndefined?: any;
}

/** ComponentWithDefaultProps description */
export class ComponentWithDefaultProps extends React.Component<IComponentWithDefaultPropsProps, {}> {
  static defaultProps: Partial<IComponentWithDefaultPropsProps> = {
    sampleTrue: true,
    sampleFalse: false,
    sampleString: 'hello',
    sampleObject: { a: '1', b: 2, c: true, d: false, e: undefined, f: null, g: { a: '1' } },
    sampleNull: null,
    sampleUndefined: undefined
  }

  render() {
    return (
      <div>test</div>
    );
  }
}
