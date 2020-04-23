interface StackBaseProps<T> {
  as: T;
  hasWrap?: boolean;
}

interface StackJustifyProps {
  foo?: 'blue';
  /** You cannot use gap when using a "space" justify property */
  gap?: never;
}

interface StackGapProps {
  foo?: 'red';
  /** The space between children */
  gap?: number;
}

type StackProps<T> = StackBaseProps<T> & (StackGapProps | StackJustifyProps);

/** ComplexGenericUnionIntersection description */
export const ComplexGenericUnionIntersection = <T extends any>(
  props: StackProps<T>
) => <div />;
