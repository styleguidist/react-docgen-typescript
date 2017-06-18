import { assert } from 'chai';
import * as path from 'path';
import * as ts from 'typescript';
import { simplePrint } from '../printUtils';
import { transformAST } from '../transformAST';

const defaultOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest,
    module: ts.ModuleKind.CommonJS
};

describe('transformAST', () => {
    const fileName = path.join(__dirname, '../../src/__tests__/data/transformAST.tsx'); // it's running in ./temp
    const program = ts.createProgram([fileName], defaultOptions);
    const checker = program.getTypeChecker();
    const sourceFile = program.getSourceFile(fileName);        
    const target = transformAST(sourceFile, checker);
    
    it('should provide data about variables', () => {
        const result = target.variables;
        assert.equal(result.length, 8);

        const r1 = result[0];
        assert.equal(r1.name, 'unexportedVar');
        assert.equal(r1.exported, false);
        assert.equal(r1.kind, 'literal');
        assert.equal(r1.initializerFlags, ts.TypeFlags.NumberLiteral);

        const r2 = result[1];
        assert.equal(r2.name, 'exportedVar');
        assert.equal(r2.exported, true);
        assert.equal(r2.kind, 'literal');
        assert.equal(r2.initializerFlags, ts.TypeFlags.NumberLiteral);

        const r3 = result[2];
        assert.equal(r3.name, 'unexportedVarFunction');
        assert.equal(r3.exported, false);
        assert.equal(r3.kind, 'arrowFunction');
        assert.equal(r3.comment, 'unexportedVarFunction comment');
        assert.equal(r3.arrowFunctionType, 'number');
        assert.deepEqual(r3.arrowFunctionParams, ['string']);

        const r4 = result[3];
        assert.equal(r4.name, 'exportedVarFunction');
        assert.equal(r4.exported, true);
        assert.equal(r4.kind, 'arrowFunction');
        assert.equal(r4.comment, 'exportedVarFunction comment\n@tag1\n@tag2 partA partB partC');
        assert.equal(r4.arrowFunctionType, 'string');
        assert.deepEqual(r4.arrowFunctionParams, ['number', 'string']);

        // hoc class
        const r5 = result[4];
        assert.equal(r5.name, 'exportedHoc1');
        assert.equal(r5.exported, true);
        assert.equal(r5.type, 'ExportedClass');
        assert.equal(r5.kind, 'callExpression');
        assert.equal(r5.comment, 'exportedHoc1 comment');
        assert.deepEqual(r5.callExpressionArguments, ['ExportedClass']);

        // hoc function
        const r6 = result[5];
        assert.equal(r6.name, 'exportedHoc2');
        assert.equal(r6.exported, true);
        assert.equal(r6.type, 'exportedFunction');
        assert.equal(r6.kind, 'callExpression');
        assert.equal(r6.comment, 'exportedHoc2 comment');
        assert.deepEqual(r6.callExpressionArguments, ['exportedFunction']);

        // external hoc class
        const r7 = result[6];
        assert.equal(r7.name, 'exportedExternalHoc1');
        assert.equal(r7.exported, true);
        assert.equal(r7.type, 'ExportedClass');
        assert.equal(r7.kind, 'callExpression');
        assert.equal(r7.comment, 'exportedExternalHoc1 comment');
        assert.deepEqual(r7.callExpressionArguments, ['ExportedClass']);

        // external hoc function
        const r8 = result[7];
        assert.equal(r8.name, 'exportedExternalHoc2');
        assert.equal(r8.exported, true);
        assert.equal(r8.type, 'exportedFunction');
        assert.equal(r8.kind, 'callExpression');
        assert.equal(r8.comment, 'exportedExternalHoc2 comment');
        assert.deepEqual(r8.callExpressionArguments, ['exportedFunction']);
    });

    it('should provide data about interfaces', () => {
        const result = target.interfaces;
        assert.equal(result.length, 4);
        const r1 = result[0];
        assert.equal(r1.name, 'UnexportedInterface');
        assert.equal(r1.exported, false);
        assert.deepEqual(r1.properties, [{
                'name': 'prop1',
                'type': 'string',
                'isRequired': true,
                'isOwn': true,
                'comment': 'prop1 comment',
                'values': [],
            }, {
                'name': 'prop2',
                'type': 'string',
                'isRequired': false,
                'isOwn': true,
                'comment': 'prop2 comment\n@tag1\n@tag2 partA partB partC',
                'values': [],
            }]);

        const r2 = result[1];
        assert.equal(r2.name, 'ExportedInterface');
        assert.equal(r2.comment, 'Interface comment\n@tag1\n@tag2 partA partB partC');
        assert.equal(r2.exported, true);
        assert.deepEqual(r2.properties, [{
                'name': 'prop1',
                'type': 'string',
                'isRequired': true,
                'isOwn': true,
                'comment': 'prop1 comment',
                'values': [],
            }, {
                'name': 'prop2',
                'type': 'string',
                'isRequired': true,
                'isOwn': true,
                'comment': 'prop2 comment',
                'values': [],
            }]);
        const r3 = result[2];
        assert.equal(r3.name, 'ExportedInheritedInterface');
        assert.equal(r3.exported, true);
        assert.deepEqual(r3.properties, [{
                'name': 'ownProp1',
                'type': 'string',
                'isRequired': true,
                'isOwn': true,
                'comment': 'ownProp1 comment',
                'values': [],
            }, {
                'name': 'prop1',
                'type': 'string',
                'isRequired': true,
                'isOwn': false,
                'comment': 'prop1 comment',
                'values': [],
            }, {
                'name': 'prop2',
                'type': 'string',
                'isRequired': true,
                'isOwn': false,
                'comment': 'prop2 comment',
                'values': [],
            },
        ]);
        const r4 = result[3];
        assert.equal(r4.name, 'ExternalInterface');
        assert.equal(r4.exported, true);
        assert.equal(r4.comment, 'ExternalInterface comment\n@tag');
    });

    it('should provide data about classes', () => {        
        const result = target.classes;
        assert.equal(result.length, 4);
        const r1 = result[1];
        assert.equal(r1.name, 'UnexportedClass');
        assert.equal(r1.exported, false);
        assert.equal(r1.comment, 'UnexportedClass comment');
        assert.deepEqual(r1.methods, [{name: 'method1'}]);

        const r2 = result[2];
        assert.equal(r2.name, 'ExportedClass');
        assert.equal(r2.exported, true);
        assert.equal(r2.comment, 'ExportedClass comment\n@tag1 partA partB\n@tag2');
        assert.deepEqual(r2.methods, [{name: 'method1'}, {name: 'method2'}]);

        const r4 = result[3];
        assert.equal(r4.name, 'ExportedClassWithExternalDependency');
        assert.equal(r4.exported, true);
        assert.equal(r4.comment, 'ExportedClassWithExternalDependency comment');
        assert.deepEqual(r4.baseType.typeArguments.length, 2);
    });

    it('should provide data about types', () => {
        assert.equal(target.types.length, 1);
        const t1 = target.types[0];
        assert.equal(t1.name, 'ExportedType1');
        assert.equal(t1.comment, 'exported intersection type\n@tag1 partA partB\n@tag2');

        // because ExportedType1 inherites from built in type and can 
        // change over time we don't use exact number here
        assert.isTrue(t1.properties.length > 200);
        assert.equal(t1.properties.filter(i => i.isOwn).length, 2);
    })
});