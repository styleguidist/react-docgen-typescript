import * as React from 'react';

interface LabelProps {
  /** title description */
  title: string;
}

/** StatelessStaticComponents.Label description */
const SubComponent = (props: LabelProps) => (
  <div>My Property = {props.title}</div>
);

interface StatelessStaticComponentsProps {
  /** myProp description */
  myProp: string;
}

/** StatelessStaticComponents description */
function StatelessStaticComponents(props: StatelessStaticComponentsProps) {
  return <div>My Property = {props.myProp}</div>;
}

StatelessStaticComponents.Label = SubComponent;

export { StatelessStaticComponents };
