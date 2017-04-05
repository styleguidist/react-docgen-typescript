import { getDocumentation } from './parser';
import { convertToDocgen, StyleguidistComponent } from './docgenConverter';

/**
 * Parser given file and return documentation in format compatibe with react-docgen.
 */
export function parse(filePath: string): StyleguidistComponent {
    const doc = getDocumentation(filePath);
    return convertToDocgen(doc);		
}