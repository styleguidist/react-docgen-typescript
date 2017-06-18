import * as ts from 'typescript';

const removeList = [
    'parent', 
    '_children', 
    'statements', 
    'pos', 
    'end',
    'modifierFlagsCache',
    'transformFlags',
    'flowNode',
    'parent',
];

export function syntaxKindToName(kind: ts.SyntaxKind) {
    return (<any>ts).SyntaxKind[kind];
}

export function flagsToText(kind: ts.TypeFlags) {
    return (<any>ts).TypeFlags[kind];
}
export function symbolFlagsToText(kind: ts.SymbolFlags) {
    return (<any>ts).SymbolFlags[kind];
}
export function nodeFlagsToText(kind: ts.NodeFlags) {
    return (<any>ts).NodeFlags[kind];
}

/** True if this is visible outside this file, false otherwise */
function isNodeExported(node: ts.Node): boolean {
    // Parse the modifier array for the export keyword. If it is found
    // and the node.parent is a sourcefile, return true
    // This only returns top level exports
    const { modifiers } = node;
    if (modifiers) {
        for (let i = 0; i < (modifiers as Array<any>).length; i++) {
            if (modifiers[i].kind === ts.SyntaxKind.ExportKeyword) {
                return node.parent.kind === ts.SyntaxKind.SourceFile
            }
        }
    }
    return false;
}

function symbolMapToString(map: ts.Map<ts.Symbol>): string {
    const values: string[] = [];
    map.forEach((value, key) => {
        values.push(value.name);
    });
    return values.join('; ');
}

export function simplePrint(checker: ts.TypeChecker, node: ts.Node, indent = 0) {
    const indentText = Array(indent * 4).join(' ');
    const info: string[] = [];
    
    function addSymbol(info: string[], node: ts.Node, prefix: string = '') {
        const s = checker.getSymbolAtLocation(node);    
        if (!s) {
            return;
        }    

        if (s.exports && s.exports.size > 0) {
            info.push(prefix + 'exports: ' + symbolMapToString(s.exports));
        }

        if (s.globalExports && s.globalExports.size > 0) {
            info.push(prefix + 'globalExports: ' + symbolMapToString(s.exports));
        }
    
        info.push(prefix + 'name: ' + s.name);
        const type = checker.getTypeOfSymbolAtLocation(s, node);
        if (type && type.symbol) {
            info.push(prefix + 'type: ' + type.symbol.name);
        }
        const comments = s.getDocumentationComment();
        if (comments.length > 0) {
            info.push(prefix + 'comment: \'' + comments.map(i => i.text).join('; ') + '\'');
        }
    }

    if (node.kind === ts.SyntaxKind.FunctionDeclaration) {
        const d = node as ts.FunctionDeclaration;
        info.push('name: ' + d.name.text);
        info.push('type: ' + d.type.getText());
    }

    if (node.kind === ts.SyntaxKind.ClassDeclaration) {
        const d = node as ts.ClassDeclaration;
        info.push('name: ' + d.name.text);
        info.push('members: [' + d.members.map(i => i.name ? i.name.getText() : "NAME_UNDEFINED").join(', ') + ']');
    }

    if (node.kind === ts.SyntaxKind.Identifier) {
        const d = node as ts.Identifier;
        addSymbol(info, node);
    }

    if (node.kind === ts.SyntaxKind.InterfaceDeclaration) {
        const d = node as ts.InterfaceDeclaration;
        addSymbol(info, node);
        addSymbol(info, d.name, 'name-');
    }

    if (node.kind === ts.SyntaxKind.ExportDeclaration) {
        const d = node as ts.ExportDeclaration;
        info.push('name: ' + d.name);
        addSymbol(info, node);
    }

    if (node.kind === ts.SyntaxKind.ExportAssignment) {
        const d = node as ts.ExportAssignment;
        info.push('name: ' + d.name);
        addSymbol(info, node);
    }

    if (node.kind === ts.SyntaxKind.VariableDeclaration) {
        const d = node as ts.VariableDeclaration;
        addSymbol(info, d.name, 'name-');
        addSymbol(info, node);
    }

    if (node.kind === ts.SyntaxKind.VariableStatement) {
        const d = node as ts.VariableStatement;
        if (d.declarationList && d.declarationList.declarations.length === 1) {
            const dec = d.declarationList.declarations[0];            
            info.push('declarations: ' + `(kind: ${syntaxKindToName(dec.kind)}, name: ${dec.name.getText()}, name.kind: ${syntaxKindToName(dec.name.kind)})`);
            if (dec.type) {
                info.push('declaration.type: ' + syntaxKindToName(dec.type.kind));
            }
            if (dec.initializer) {
                info.push('declaration.initializer: ' + syntaxKindToName(dec.initializer.kind));
            }            
        }
        addSymbol(info, node);
    }

    if (node.kind === ts.SyntaxKind.CallExpression) {
        const d = node as ts.CallExpression;
        info.push('arguments: ' + d.arguments.map(i => i.getText()).join(';'));        
    }

    if (isNodeExported(node)) {
        info.push('exported: true');
    }

    const infoText = info.length === 0 ? '' : `(${info.join(', ')})`
    console.log(`${indentText}${syntaxKindToName(node.kind)} ${infoText}`);
    ts.forEachChild(node, child => {
        simplePrint(checker, child, indent + 1);
    });
}