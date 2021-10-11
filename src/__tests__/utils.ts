import { assert } from 'chai';
import { trimFileName } from '../utils';

describe('utils', () => {
  it('should trim file name for simple path', () => {
    const input =
      '/home/user/projects/react-docgen-typescript/src/__tests__/data/ExportsPropTypeImport.tsx';
    assert.equal(
      trimFileName(input),
      'react-docgen-typescript/src/__tests__/data/ExportsPropTypeImport.tsx'
    );
  });
  it('should trim file name for complex path', () => {
    const input =
      '/home/user/projects/react-docgen-typescript/react-docgen-typescript/src/__tests__/data/ExportsPropTypeImport.tsx';
    assert.equal(
      trimFileName(input),
      'react-docgen-typescript/src/__tests__/data/ExportsPropTypeImport.tsx'
    );
  });
});
