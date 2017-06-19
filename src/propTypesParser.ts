import { convertToDocgen } from './docgenConverter';
import { getFileDocumentation } from './getFileDocumentation';

export interface StyleguidistComponent {
    displayName: string;
    description: string;
    props: StyleguidistProps;
}

export interface StyleguidistProps {
    [key: string]: PropItem;
}

export interface PropItem {
    required: boolean;
    type: PropItemType;
    description: string;
    defaultValue: any;
}

export interface PropItemType {
    name: string;
    value?: any;
}

/**
 * Parser given file and return documentation in format compatibe with react-docgen.
 */
export function parse(filePath: string): StyleguidistComponent {
    const doc = getFileDocumentation(filePath);
    return convertToDocgen(filePath, doc);		
}