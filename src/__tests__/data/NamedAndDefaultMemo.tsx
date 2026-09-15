import React from 'react';

export interface NamedAndDefaultProps {
  /** id description */
  id?: string;
}

/** NamedAndDefaultMemo description */
export const NamedAndDefaultMemo = (props: NamedAndDefaultProps) => {
  return <div>Test</div>;
};

export default React.memo(NamedAndDefaultMemo);
