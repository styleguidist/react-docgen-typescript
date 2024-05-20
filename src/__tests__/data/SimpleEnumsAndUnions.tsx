type SampleUnion = 'h1' | 'h6' | 'h2' | 'h4' | 'h5' | 'h3';
enum SampleEnum {
  Z = 'Z',
  C = 'C',
  B = 'B',
  A = 'A',
  X = 'X',
  Y = 'Y'
}

interface Props {
  /** sampleUnionProp description */
  sampleUnionProp: SampleUnion;
  /** sampleEnumProp description */
  sampleEnumProp: SampleEnum;
}

export const SimpleEnumsAndUnions = (props: Props) => <div />;
