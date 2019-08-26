import * as React from 'react';

enum sampleEnum {
  ONE = 'one',
  TWO = 'two',
  THREE = 'three'
}

interface ExtractLiteralValuesFromEnumProps {
  /** sampleString description */
  sampleString: string;
  /** sampleBoolean description */
  sampleBoolean: boolean;
  /** sampleEnum description */
  sampleEnum: sampleEnum;
  /** sampleStringUnion description */
  sampleStringUnion: 'string1' | 'string2';
  /** sampleComplexUnion description */
  sampleComplexUnion: number | 'string1' | 'string2';
}

export const Stateless: React.StatelessComponent<
  ExtractLiteralValuesFromEnumProps
> = props => <div>test</div>;
