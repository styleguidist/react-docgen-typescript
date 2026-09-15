import React from 'react';

export interface NamedAndDefaultProps {
  /** id description */
  id?: string;
}

/** NamedAndDefaultForwardRef description */
export const NamedAndDefaultForwardRef = (props: NamedAndDefaultProps) => {
  return <div>Test</div>;
};

export default React.forwardRef(NamedAndDefaultForwardRef);
