import * as ts from 'typescript';
import { navigate, getFlatChildren } from './nodeUtils';
import { transformAST } from './transformAST';
import {
    ClassEntry,
    InterfaceEntry,
    VariableEntry,
    InterfaceDoc,
    ComponentDoc,
    FileDoc
} from './model';
import { simplePrint } from "./printUtils";

const defaultOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.CommonJS
};

function isClassComponent(entry: ClassEntry, exportedOnly = true): boolean {
    return (exportedOnly === false || entry.exported)
        && entry.baseType
        && entry.baseType.name.indexOf('Component') > -1
        && entry.methods.some(j => j.name === 'render');
}

function isVarComponent(
    entry: VariableEntry, 
    interfaces: InterfaceEntry[],
    exportedOnly = true): boolean {

    return (exportedOnly === false || entry.exported)
        && entry.kind === 'arrowFunction'
        && entry.arrowFunctionParams.length === 1
        && interfaces.some(i => i.name === entry.arrowFunctionParams[0]);
}

function isHocClassComponent(entry: VariableEntry, classes: ClassEntry[]): boolean {
    return entry.exported
        && entry.kind === 'callExpression'
        // quick fix for external hoc - && entry.type !== null
        && entry.callExpressionArguments.length === 1
        && classes
            .filter(i => isClassComponent(i, false))
            .some(i => i.name === entry.callExpressionArguments[0]);
}

function isHocVarComponent(
    entry: VariableEntry, 
    variables: VariableEntry[],
    interfaces: InterfaceEntry[]): boolean {

    return entry.exported
        && entry.kind === 'callExpression'
        // quick fix for external hoc - && entry.type === '__function'
        && entry.callExpressionArguments.length === 1
        && variables
            .filter(i => isVarComponent(i, interfaces, false))
            .some(i => i.name === entry.callExpressionArguments[0]);
}


function getInterfaceDoc(entry: InterfaceEntry): InterfaceDoc {
    return {
        name: entry.name,
        comment: entry.comment,
        members: entry.properties
    }
}

function getClassPropInterface(interfaces: InterfaceEntry[], classEntry: ClassEntry): InterfaceDoc {
    if (classEntry.baseType.typeArguments.length === 0) {
        return {
            name: 'none',
            comment: '',
            members: [],
        };
    }

    const propInterfaceName = classEntry.baseType.typeArguments[0];
    return getPropInterface(interfaces, propInterfaceName);
}

function getVarPropInterface(interfaces: InterfaceEntry[], varEntry: VariableEntry): InterfaceDoc {
    const propInterfaceName = varEntry.arrowFunctionParams[0];
    return getPropInterface(interfaces, varEntry.arrowFunctionParams[0]);
}

function getPropInterface(interfaces: InterfaceEntry[], propInterfaceName: string): InterfaceDoc {
    const matchedInterfaces = interfaces.filter(j => j.name === propInterfaceName);
    if (matchedInterfaces.length === 0) {
        console.warn(`Property interface ${propInterfaceName} cannot be found`)
        return {
            name: propInterfaceName,
            comment: '',
            members: [],
        };
    }

    return getInterfaceDoc(matchedInterfaces[0]);
}
/** Generate documention for all classes in a set of .ts files */
export function getFileDocumentation(fileName: string, options: ts.CompilerOptions = defaultOptions): FileDoc {
    const components: ComponentDoc[] = [];        
    let program = ts.createProgram([fileName], options);
    let checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(fileName);
    const model = transformAST(program.getSourceFile(fileName), checker);
    const { interfaces, classes, variables, types } = model;
    
    // let's treat types as interfaces here both can include valid props definition
    const allInterfaces = [...interfaces, ...types];
    allInterfaces.forEach(i => {
        i.properties = i.properties.filter(j => j.isOwn);
    });

    const classComponents: ComponentDoc[] = classes
        .filter(i => isClassComponent(i))
        .map(i => ({
            name: i.name,
            extends: i.baseType.name,
            comment: i.comment,
            propInterface: getClassPropInterface(allInterfaces, i),            
        }));    

    const varComponents = variables
        .filter(i => isVarComponent(i, allInterfaces))
        .map(i => ({
            name: i.name,
            extends: 'StatelessComponent',
            comment: i.comment,
            propInterface: getVarPropInterface(allInterfaces, i),            
        }));

    const hocClassComponents = variables
        .filter(i => isHocClassComponent(i, classes))
        .map(i => ({ 
            variable: i, 
            origin: classes.filter(c => c.name === i.callExpressionArguments[0])[0] 
        }))
        .map(i => ({
            name: i.variable.name,
            extends: i.variable.callExpressionArguments[0],
            comment: i.variable.comment || i.origin.comment,
            propInterface: getClassPropInterface(allInterfaces, i.origin),            
        }));

    const hocVarComponents = variables
        .filter(i => isHocVarComponent(i, variables, allInterfaces))
        .map(i => ({ 
            variable: i, 
            origin: variables.filter(c => c.name === i.callExpressionArguments[0])[0] 
        }))
        .map(i => ({
            name: i.variable.name,
            extends: i.variable.callExpressionArguments[0],
            comment: i.variable.comment || i.origin.comment,
            propInterface: getVarPropInterface(allInterfaces, i.origin),            
        }));

    return { 
        components: [
            ...classComponents,
            ...varComponents,
            ...hocClassComponents,
            ...hocVarComponents,
        ]
    };
}
    