import { FileDoc, InterfaceDoc, MemberDoc } from './model';
import { StyleguidistComponent, StyleguidistProps, PropItem } from './propTypesParser';

export function convertToDocgen(doc: FileDoc): StyleguidistComponent | null {
    const components = doc.components;

    if (components.length === 0) {
        return null;
    }
    const comp = components[0];
    
    if (!comp.propInterface) {
        console.warn('REACT-DOCGEN-TYPESCRIPT It seems that your props type is not exported. Add \'export\' keyword to your props definition.');
    }

    return {
		displayName: comp.name,
        description: comp.comment,
        props: comp.propInterface ? getProps(comp.propInterface) : {}
    };
}

function getProps(props: InterfaceDoc): StyleguidistProps {
    return props.members.reduce((acc, i) => {
        const item: PropItem = {
            description: i.comment,
            type: {name: i.type},
            defaultValue: null,
            required: i.isRequired
        };
        if (i.values && i.values.length > 0) {
            item.description = item.description + ' (one of the following:' + i.values.join(',') + ')';
        }

        acc[i.name] = item;
        return acc;
    }, ({} as any));
}