import { FileDoc, InterfaceDoc, MemberDoc } from './parser';

export interface StyleguidistProps {
    [key: string]: PropItem;
}

export interface StyleguidistComponent {
    displayName: string;
    description: string;
    props: StyleguidistProps;
}

export function convertToDocgen(doc: FileDoc): StyleguidistComponent {
    const reactClasses = doc.classes.filter(i => i.extends === 'Component' || i.extends === 'StatelessComponent');

    if (reactClasses.length === 0) {
        return null;
    }
    const comp = reactClasses[0];
    const reactInterfaces = doc.interfaces.filter(i => i.name === comp.propInterface);
    
    let props: any = {};
    if (reactInterfaces.length !== 0) {
        props = getProps(reactInterfaces[0]);
    } else {
        console.warn('REACT-DOCGEN-TYPESCRIPT It seems that your props type is not exported. Add \'export\' keyword to your props definition.');
    }

    return {
		displayName: comp.name,
        description: comp.comment,
        props: props
    }
}

export interface PropItemType {
    name: string;
    value?: any;
}

export interface PropItem {
    required: boolean;
    type: PropItemType;
    description: string;
    defaultValue: any;
}

export interface PropsObject {
    [key: string]: PropItem;
}

export interface Docgen {
    description: string;
    props: PropsObject;
}

function getProps(props: InterfaceDoc): StyleguidistProps {
    return props.members.reduce((acc, i) => {
        const item: PropItem = {
            description: i.comment,
            type: {name: i.type},
            defaultValue: null,
            required: i.isRequired
        };
        if (i.values) {
            item.description = item.description + ' (one of the following:' + i.values.join(',') + ')';
        }

        acc[i.name] = item;
        return acc;
    }, {});
}
/*
 {
 "props": {
 "foo": {
 "type": {
 "name": "number"
 },
 "required": false,
 "description": "Description of prop \"foo\".",
 "defaultValue": {
 "value": "42",
 "computed": false
 }
 },
 "bar": {
 "type": {
 "name": "custom"
 },
 "required": false,
 "description": "Description of prop \"bar\" (a custom validation function).",
 "defaultValue": {
 "value": "21",
 "computed": false
 }
 },
 "baz": {
 "type": {
 "name": "union",
 "value": [
 {
 "name": "number"
 },
 {
 "name": "string"
 }
 ]
 },
 "required": false,
 "description": ""
 }
 },
 "description": "General component description."
 }
 */