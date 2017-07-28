import { assert } from 'chai';
import * as ts from 'typescript';

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
    // this is not required by styleguidist
    name: string;
}

export interface PropItemType {
    name: string;
    value?: any;
}

/**
 * Rebuilds a full JsDoc comment symbol, reconsitituting
 * from the parts that TypeScript has broken it into.
 */
function getFullJsDocComment(symbol: ts.Symbol) {
    if (!symbol) {
        return '';
    }

    const mainComment = ts.displayPartsToString(symbol.getDocumentationComment());
    const tags = symbol.getJsDocTags() || [];

    // Transform { name: 'tag', text: 'text1 text2' } into
    // '@tag text1 text2'
    const tagComments = tags.map(t => {
        let result = '@' + t.name;
        if (t.text) {
            result += ' ' + t.text;
        }
        return result;
    });

    const fullComment = mainComment + '\n' + tagComments.join('\n');
    return fullComment.trim();
}

function getType(checker: ts.TypeChecker, propType: ts.Type, prop: ts.PropertySignature): PropItemType {
    const name = checker.typeToString(propType);
    const unionType = prop && prop.type as ts.UnionTypeNode;
    if (unionType && unionType.types) {
        return {
            name: name,
            value: (unionType.types as Array<any>).map(i => i.getText()),
        }
    }
    return {
        name: name,
    }
}


function getProperties(checker: ts.TypeChecker, type: ts.Type, propsObj: ts.Symbol): PropItem[] {
    // const baseTypes = type.getBaseTypes() || [];
    // const inheritedProperties = baseTypes
    //         .reduce((acc, bt) => [
    //             ...acc, 
    //             ...bt.getProperties().map(p => p.getName())
    //         ], [] as string[]);    
     
    return type.getProperties() 
        .map(prop => {
            // const symbol = checker.getSymbolAtLocation(prop.valueDeclaration.name);
            const propSigniture = prop.valueDeclaration as ts.PropertySignature;           
            const propType = checker.getTypeOfSymbolAtLocation(prop, propsObj.valueDeclaration);
            const typeInfo = getType(checker, propType, propSigniture);

            // could we use this?
            // const isOwn = inheritedProperties.indexOf(propertyName) === -1,
            const propertyName = prop.getName();
            const tmp: PropItem = {
                name: propertyName,
                type: typeInfo,
                required: propSigniture && !propSigniture.questionToken,
                description: getFullJsDocComment(prop), // TODO: this doesn't work
                defaultValue: null,
            };
            return tmp;
        });
}

function getComponentInfo(checker: ts.TypeChecker, name: string, propsSymbol: ts.Symbol): StyleguidistComponent {
    const propsType = checker.getTypeOfSymbolAtLocation(propsSymbol, propsSymbol.valueDeclaration);
    const propertiesOfProps = getProperties(checker, propsType, propsSymbol);
    const result: StyleguidistComponent = {
        displayName: name,
        description: '',
        props: propertiesOfProps.reduce((acc, i) => {
            acc[i.name] = i;
            return acc;
        }, {} as StyleguidistProps)
    };
    return result;
}

const defaultOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.CommonJS
};

/**
 * Parser given file and return documentation in format compatibe with react-docgen.
 */
export function parse(fileName: string): StyleguidistComponent[] {
    
    let program = ts.createProgram([fileName], defaultOptions);
    let checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(fileName);
    // Find the actual exports from the source file; we don't care about
    // anything that isn't exported.
    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    const exports = checker.getExportsOfModule(moduleSymbol);
    const result: StyleguidistComponent[] = [];
    for (const exportItem of exports) {
        const type = checker.getTypeOfSymbolAtLocation(exportItem, exportItem.valueDeclaration);
        const componentName = exportItem.name;

        // We don't really know what we have at this point. Could be a constant, or an interface,
        // or anything.
        const callSignatures = type.getCallSignatures();
        const constructSignatures = type.getConstructSignatures();

        for (const sig of callSignatures) {
            const params = sig.getParameters();
            if (params.length === 1) {
                // This still can be component without props
                // TODO: check return type?
            }
            if (params.length !== 1) {
                continue;
            }

            // We've found an exported function with a single parameter.
            // Might be a stateless component. For now this is fine, but we could
            // theoretically check its return type to see if it's ReactElement or friends.

            const propsParam = params[0];
            result.push(getComponentInfo(checker, componentName, propsParam));
        }

        for (const sig of constructSignatures) {
            const instanceType = sig.getReturnType();
            const props = instanceType.getProperty('props');

            if (!props) {
                // No props. Not a React component!
                continue;
            }

            result.push(getComponentInfo(checker, componentName, props));
        }
    }	

    return result;
}
