import { getDocumentation } from './parser';
import { convertToDocgen } from './docgenConverter';

/**
 * Parser given file and return documentation in format compatibe with react-docgen.
 */
export function parse(filePath: string) {
    const doc = getDocumentation(filePath);
    return convertToDocgen(doc);		
}