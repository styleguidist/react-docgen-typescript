import * as React from 'react';

interface LabelProps {
  /** title description */
  title: string;
}

/** StatelessStaticComponentsDefaultExport.Label description */
const SubComponent = (props: LabelProps) => (
  <div>My Property = {props.title}</div>
);

interface StatelessStaticComponentsDefaultExportProps {
  /** myProp description */
  myProp: string;
}

/** StatelessStaticComponentsDefaultExport description */
const StatelessStaticComponentsDefaultExport = (
  props: StatelessStaticComponentsDefaultExportProps
) => {
  return <div>My Property = {props.myProp}</div>;
};

StatelessStaticComponentsDefaultExport.Label = SubComponent;

export default StatelessStaticComponentsDefaultExport;
