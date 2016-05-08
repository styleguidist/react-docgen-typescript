import * as path from 'path';
import * as ts from 'typescript';
import { dumpNode, navigate, getFlatChildren } from './nodeUtils';


const defaultOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest, 
    module: ts.ModuleKind.CommonJS
};

export interface ClassDoc {
    name: string;
    extends: string;
    propInterface: string;
    comment: string;    
}

export interface InterfaceDoc {
    name: string;
    members: MemberDoc[];   
    comment: string;
}

export interface MemberDoc {
    name: string;
    text: string;
    type: string;
    values?: string[];
    isRequired: boolean;
    comment: string;
}

export interface FileDoc {
    classes: ClassDoc[];
    interfaces: InterfaceDoc[];
}
/** Generate documention for all classes in a set of .ts files */
export function getDocumentation(fileName: string, options: ts.CompilerOptions = defaultOptions): FileDoc {
    
    let program = ts.createProgram([fileName], options);
    let checker = program.getTypeChecker();
        
    const classes: ClassDoc[] = [];
    const interfaces: InterfaceDoc[] = [];
    
    const sourceFile = program.getSourceFile(fileName);
    ts.forEachChild(sourceFile, visit);
    
    /** visit nodes finding exported classes */    
    function visit(node: ts.Node) {
        // Only consider exported nodes
        if (!isNodeExported(node)) {
            return;
        }

        if (node.kind === ts.SyntaxKind.ClassDeclaration) {
            const classNode = node as ts.ClassDeclaration;
            const symbol = checker.getSymbolAtLocation(classNode.name);                                   
            
            const typeArguments = navigate(classNode, 
                ts.SyntaxKind.HeritageClause, 
                ts.SyntaxKind.ExpressionWithTypeArguments);
                
            const list = getFlatChildren(typeArguments)
                .filter(i => i.kind === ts.SyntaxKind.Identifier)
                .map((i: ts.Identifier) => i.text);

            classes.push({
                name: symbol.name,
                comment: ts.displayPartsToString(symbol.getDocumentationComment()),
                extends: list.length > 0 ? list[0] : null,
                propInterface: list.length > 1 ? list[1] : null,
            });            
        }

        if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
            const interfaceDeclaration = node as ts.InterfaceDeclaration;
             if (interfaceDeclaration.parent === sourceFile) {
                                  
                const symbol = checker.getSymbolAtLocation(interfaceDeclaration.name);
                const type = checker.getTypeAtLocation(interfaceDeclaration.name);
                
                const members = type.getProperties().map(i => {
                    const symbol = checker.getSymbolAtLocation(i.valueDeclaration.name);
                    const prop = i.valueDeclaration as ts.PropertySignature;
                    const typeInfo = getType(prop);
                    return {
                        name: i.getName(),                                        
                        text: i.valueDeclaration.getText(),
                        type: typeInfo.type,
                        values: typeInfo.values,
                        isRequired: prop.questionToken === null,
                        comment: ts.displayPartsToString(symbol.getDocumentationComment()).trim(),
                    };                    
                });
                
                const interfaceDoc: InterfaceDoc = {
                    name: symbol.getName(),
                    comment: ts.displayPartsToString(symbol.getDocumentationComment()).trim(),
                    members: members,
                };
                interfaces.push(interfaceDoc);
             }
         }
        else if (node.kind === ts.SyntaxKind.ModuleDeclaration) {
            // This is a namespace, visit its children
            ts.forEachChild(node, visit);
        }
    }    

    /** True if this is visible outside this file, false otherwise */
    function isNodeExported(node: ts.Node): boolean {
        return (node.flags & ts.NodeFlags.Export) !== 0 || (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);
    }
    
    return {
        classes,
        interfaces,
    }
}

function getType(prop: ts.PropertySignature): { type: string, values?: string[]}  {
    const unionType = prop.type as ts.UnionTypeNode;
    if (unionType && unionType.types) {
        return {
            type: 'string',
            values: unionType.types.map(i => i.getText()),
        }        
    }
    return {
        type: prop.type.getText(),
    }
}
// /** Serialize a symbol into a json object */    
//     function serializeSymbol(symbol: ts.Symbol): DocEntry {
//         return {
//             name: symbol.getName(),
//             documentation: ts.displayPartsToString(symbol.getDocumentationComment()),
//             type: checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration))
//         };
//     }

//     /** Serialize a class symbol infomration */
//     function serializeClass(symbol: ts.Symbol) {
//         //console.log('flags: ', symbol.getFlags(), ' declarations:', symbol.getDeclarations());
//         let details = serializeSymbol(symbol);

//         // Get the construct signatures
//         let constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
//         details.constructors = constructorType.getConstructSignatures().map(serializeSignature);
//         return details;
//     }

//     /** Serialize a signature (call or construct) */
//     function serializeSignature(signature: ts.Signature) {
//         return {
//             parameters: signature.parameters.map(serializeSymbol),
//             returnType: checker.typeToString(signature.getReturnType()),
//             documentation: ts.displayPartsToString(signature.getDocumentationComment())
//         };
//     }
    