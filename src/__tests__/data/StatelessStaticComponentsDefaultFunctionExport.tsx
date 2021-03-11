import * as React from 'react';

interface LabelProps {
  /** title description */
  title: string;
}

/** StatelessStaticComponentsDefaultFunctionExport.Label description */
const SubComponent = (props: LabelProps) => (
  <div>My Property = {props.title}</div>
);

interface StatelessStaticComponentsDefaultFunctionExportProps {
  /** myProp description */
  myProp: string;
}

/** StatelessStaticComponentsDefaultFunctionExport description */
export default function StatelessStaticComponentsDefaultFunctionExport(
  props: StatelessStaticComponentsDefaultFunctionExportProps
) {
  return <div>My Property = {props.myProp}</div>;
}

StatelessStaticComponentsDefaultFunctionExport.Label = SubComponent;
