import { parse as newParse } from './parser';

/**
 * This method exists for backward compatibility only.
 * User *parse* method from *parser* file.
 */
export function parse(fileName: string) {
    return newParse(fileName);
}