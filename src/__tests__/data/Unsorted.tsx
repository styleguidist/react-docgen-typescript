import * as React from 'react';

export interface UnsortedProps {
  /** m description */
  m: string;
  /** a description */
  a?: string;
  /** z description */
  z: string;
}

/** Unsorted description */
export const Unsorted = (props: UnsortedProps) => (
  <div>
    My Property = {props.a} {props.z}
  </div>
);

Unsorted.displayName = 'UnsortedDisplayName';
