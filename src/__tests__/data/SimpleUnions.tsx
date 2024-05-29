type SampleUnion = 'h1' | 'h6' | 'h2' | 'h4' | 'h5' | 'h3';

interface Props {
  /** sampleUnionProp description */
  sampleUnionProp: SampleUnion;
}

export const SimpleUnions = (props: Props) => <div />;
