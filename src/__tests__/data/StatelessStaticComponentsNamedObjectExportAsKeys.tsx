import * as React from 'react';

interface LabelProps {
  /** title description */
  title: string;
}

/** SubComponent description */
const SubComponent = (props: LabelProps) => (
  <div>My Property = {props.title}</div>
);

interface StatelessStaticComponentsProps {
  /** myProp description */
  myProp: string;
}

/** StatelessStaticComponents description */
const StatelessStaticComponents = (props: StatelessStaticComponentsProps) => (
  <div>My Property = {props.myProp}</div>
);

export const Record = {
  Comp1: StatelessStaticComponents,
  Comp2: SubComponent
};
