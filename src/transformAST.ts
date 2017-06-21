import * as ts from 'typescript';
import { navigate } from './nodeUtils';
import {
    MemberType,
    VariableEntry,
    VeriableKind,
    InterfaceEntry,
    ClassEntry,
    PropertyEntry,
    BaseClassEntry
} from './model';
import { simplePrint, syntaxKindToName, flagsToText, symbolFlagsToText, nodeFlagsToText } from "./printUtils";

/**
 * Checks if the node is exported. 
 */
function isNodeExported(node: ts.Node): boolean {
    // Parse the modifier array for the export keyword. If it is found
    // and the node.parent is a sourcefile, return true
    // This only returns top level exports
    const { modifiers } = node;
    if (modifiers) {
        for (let i = 0; i < (modifiers as Array<any>).length; i++) {
            if (modifiers[i].kind === ts.SyntaxKind.ExportKeyword) {
                return node.parent !== undefined && node.parent.kind === ts.SyntaxKind.SourceFile
            }
        }
    }
    return false;
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

function getType(prop: ts.PropertySignature): MemberType {
    const unionType = prop.type as ts.UnionTypeNode;
    if (unionType && unionType.types) {
        return {
            type: 'string',
            values: (unionType.types as Array<any>).map(i => i.getText()),
        }
    }
    //noinspection TypeScriptUnresolvedFunction
    return {
        type: unionType.getText(),
    }
}

function getMethods(checker: ts.TypeChecker, type: ts.Type, classDeclaratinNode: ts.ClassDeclaration) {
    return classDeclaratinNode.members
        .filter(x => x.name !== undefined)
        .map(i => ({ name: i.name ? i.name.getText() : 'unknown' }));
}

function getProperties(checker: ts.TypeChecker, type: ts.Type, parent: ts.Node): PropertyEntry[] {
    const baseTypes = type.getBaseTypes() || [];
    const inheritedProperties = baseTypes
            .reduce((acc, bt) => [
                ...acc, 
                ...bt.getProperties().map(p => p.getName())
            ], [] as string[]);    
     
    return type.getProperties() 
        .filter(i => i.valueDeclaration)
        .map(i => {
            if (i.valueDeclaration === undefined || i.valueDeclaration === null) {
                throw Error('The valueDeclaration does not exist')
            }
            
            const symbol = checker.getSymbolAtLocation(i.valueDeclaration.name);
            const prop = i.valueDeclaration as ts.PropertySignature;                  
            const typeInfo = getType(prop);

            const propertyName = i.getName();
            return {
                name: propertyName,
                isOwn: inheritedProperties.indexOf(propertyName) === -1,
                type: typeInfo.type,
                values: typeInfo.values || [],
                isRequired: !prop.questionToken,
                comment: getFullJsDocComment(symbol),
            };
        });
}

function findAllNodes(rootNode: ts.Node, result: ts.Node[]) {
    result.push(rootNode);
    ts.forEachChild(rootNode, (node) => {
        findAllNodes(node, result);
    });
}

/** 
 * Transform source file AST (abstract syntax tree) to our 
 * model (classes, interfaces, variables, methods).
 */
export function transformAST(sourceFile: ts.SourceFile, checker: ts.TypeChecker) {    
    const nodes: ts.Node[] = [];
    findAllNodes(sourceFile, nodes);
    
    const variables: VariableEntry[] = nodes
        .filter(i => i.kind === ts.SyntaxKind.VariableStatement)
        .map(i => i as ts.VariableStatement)
        .filter(i => i.declarationList.declarations 
            && i.declarationList.declarations.length === 1
            && i.declarationList.declarations[0].name.kind === ts.SyntaxKind.Identifier
            && i.declarationList.declarations[0].initializer)
        .map(i => {
            const d = i.declarationList.declarations[0] as ts.VariableDeclaration;
            const identifier = d.name as ts.Identifier;

            if (!d.initializer) {
                throw Error('The initializer property does not exist')
            }

            const symbol = checker.getSymbolAtLocation(identifier);
            let arrowFunctionType: string = 'undefined';                
            let kind: VeriableKind = 'unknown';
            const varType = checker.getTypeAtLocation(d);

            const initializerType = checker.getTypeAtLocation(d.initializer);
            const initializerFlags = initializerType.flags;
            let arrowFunctionParams: string[] = [];
            let callExpressionArguments: string[] = [];
            
            if (!d.initializer) {
                kind = 'unknown';
            } else if (d.initializer.kind === ts.SyntaxKind.ArrowFunction) {
                const arrowFunc = d.initializer as ts.ArrowFunction; 
                if (arrowFunc.parameters) {
                    arrowFunctionParams = arrowFunc
                        .parameters
                        .map(p => p.type ? p.type.getText() : 'unknown')
                }
                arrowFunctionType = arrowFunc.type ? arrowFunc.type.getText() : 'undefined';
                kind = 'arrowFunction'
            } else if (d.initializer.kind === ts.SyntaxKind.FirstLiteralToken) {
                const literal = d.initializer as ts.LiteralExpression;                    
                kind = 'literal';
            } else if (d.initializer.kind === ts.SyntaxKind.CallExpression) {
                kind = 'callExpression';
                const callExpresson = d.initializer as ts.CallExpression;
                if (callExpresson.arguments) {
                    callExpressionArguments = callExpresson.arguments.map(i => i.getText());
                }
            }

            return { 
                name: identifier.text,
                exported: isNodeExported(i),
                comment: getFullJsDocComment(symbol),
                type: varType.symbol ? varType.symbol.getName() : 'unknown',
                kind,
                arrowFunctionType,
                arrowFunctionParams,
                callExpressionArguments,
                initializerFlags,
            };
        });
    
    const interfaces: InterfaceEntry[] = nodes
        .filter(i => i.kind === ts.SyntaxKind.InterfaceDeclaration)
        .map(i => i as ts.InterfaceDeclaration)
        .map(i => {
            const symbol = checker.getSymbolAtLocation(i.name);
            const type = checker.getTypeAtLocation(i.name);
            return {
                name: symbol.name,
                comment: getFullJsDocComment(symbol),
                exported: isNodeExported(i),
                properties: getProperties(checker, type, i),
            };
        });

    const types: InterfaceEntry[] = nodes
        .filter(i => i.kind === ts.SyntaxKind.TypeAliasDeclaration)
        .map(i => i as ts.TypeAliasDeclaration)
        .map(i => {
            const type = checker.getTypeAtLocation(i.name) as ts.IntersectionType;                
            const properties: PropertyEntry[] = [];

            if (type.types) {                
                type.types.forEach(t => {
                    const props = (t as any).properties;
                    let ownProperties: string[] = [];
                    if (props) {
                        ownProperties = props
                            .map((p: ts.Symbol) => p.getName());
                    }
                    properties.push(...getProperties(checker, t, i));

                    properties
                        .forEach(p => p.isOwn = ownProperties.indexOf(p.name) > -1);
                });
            }

            const symbol = checker.getSymbolAtLocation(i.name);
            return {
                name: i.name.getText(),
                properties,
                exported: isNodeExported(i),
                comment: getFullJsDocComment(symbol)
            };
        });

    const classes: ClassEntry[] = nodes
        .filter(i => i.kind === ts.SyntaxKind.ClassDeclaration)
        .map(i => i as ts.ClassDeclaration)
        .map(i => {
            const symbol = checker.getSymbolAtLocation(i.name);
            const type = checker.getTypeAtLocation(i.name);
            const baseTypes = type.getBaseTypes();
            let baseType: BaseClassEntry = {
                name: 'unknown',
                typeArguments: [],
            };
            
            if (baseTypes.length) {
                const t = baseTypes[0];
                const typeArguments = navigate(i,
                    ts.SyntaxKind.HeritageClause,
                    ts.SyntaxKind.ExpressionWithTypeArguments) as ts.ExpressionWithTypeArguments;

                 

                if (typeArguments && typeArguments.typeArguments) {
                    typeArguments.typeArguments.forEach(ta => {
                        const taType = checker.getTypeAtLocation(ta);
                        if (taType && taType.symbol) {
                            const taTypeName = taType.symbol.getName();
                            // check if the type is defined in another file
                            if (interfaces.every(int => int.name !== taTypeName)
                                && taTypeName !== '__type') {
                                // in that case we need to include the interface explicitly
                                interfaces.push({
                                    name: taType.symbol.name,
                                    comment: getFullJsDocComment(taType.symbol),
                                    exported: true, // it has to be exported in order to be used,
                                    properties: getProperties(checker, taType, null),
                                });
                            }                            
                        }
                    })
                }

                baseType = {
                    name: t.symbol ? t.symbol.getName() : 'unknown',
                    typeArguments: typeArguments && typeArguments.typeArguments ? 
                        typeArguments.typeArguments.map(t => t.getText()) : []
                };
            }

            return {
                name: symbol.name,
                exported: isNodeExported(i),
                baseType: baseType,
                comment: getFullJsDocComment(symbol),
                methods: getMethods(checker, type, i),
            };
        });

        return {
            classes,
            interfaces,
            variables,
            types: types,
        }
}
