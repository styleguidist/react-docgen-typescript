import { assert } from 'chai';
import * as path from 'path';
import { getFileDocumentation } from '../getFileDocumentation';

describe('getFileDocumentation', () => {
    it('Should parse class-based components', () => {
        const fileName = path.join(__dirname, '../../src/__tests__/data/Column.tsx'); // it's running in ./temp
        const result = getFileDocumentation(fileName);
        assert.ok(result.components);
        assert.equal(1, result.components.length);

        const c = result.components[0];
        assert.equal('Column', c.name);
        assert.equal('Form column.', c.comment);
        assert.equal('Component', c.extends);
        assert.isNotNull(c.propInterface);

        const i = c.propInterface;
        assert.equal('IColumnProps', i.name);
        assert.equal('Column properties.', i.comment);
        assert.equal(4, i.members.length);
        assert.equal('prop1', i.members[0].name);
        assert.equal('prop1 description', i.members[0].comment);
        assert.equal(false, i.members[0].isRequired);

        assert.equal('prop2', i.members[1].name);
        assert.equal('prop2 description', i.members[1].comment);
        assert.equal(true, i.members[1].isRequired);

        assert.equal('prop3', i.members[2].name);
        assert.equal('prop3 description', i.members[2].comment);
        assert.equal(true, i.members[2].isRequired);

        assert.equal('prop4', i.members[3].name);
        assert.equal('prop4 description', i.members[3].comment);
        assert.equal(true, i.members[3].isRequired);
    });

    it('Should parse class-based components with unexported props interface', () => {
        const fileName = path.join(__dirname, '../../src/__tests__/data/ColumnWithoutExportedProps.tsx'); // it's running in ./temp    
        const result = getFileDocumentation(fileName);
        assert.ok(result.components);
        assert.equal(1, result.components.length);

        const c = result.components[0];
        assert.equal('Column', c.name);
        assert.equal('Form column.', c.comment);
        assert.equal('Component', c.extends);
        assert.isNotNull(c.propInterface);

        const i = c.propInterface;
        assert.equal('IColumnProps', i.name);
        assert.equal('Column properties.', i.comment);
        assert.equal(4, i.members.length);
        assert.equal('prop1', i.members[0].name);
        assert.equal('prop1 description', i.members[0].comment);
        assert.equal(false, i.members[0].isRequired);

        assert.equal('prop2', i.members[1].name);
        assert.equal('prop2 description', i.members[1].comment);
        assert.equal(true, i.members[1].isRequired);

        assert.equal('prop3', i.members[2].name);
        assert.equal('prop3 description', i.members[2].comment);
        assert.equal(true, i.members[2].isRequired);

        assert.equal('prop4', i.members[3].name);
        assert.equal('prop4 description', i.members[3].comment);
        assert.equal(true, i.members[3].isRequired);
    });

    it('Should parse functional components', () => {
        const fileName = path.join(__dirname, '../../src/__tests__/data/Row.tsx'); // it's running in ./temp
        const result = getFileDocumentation(fileName);
        assert.ok(result.components);
        assert.equal(1, result.components.length);

        const c = result.components[0];
        assert.equal('Row', c.name);
        assert.equal('Form row.', c.comment);
        assert.equal('StatelessComponent', c.extends);
        assert.isNotNull(c.propInterface)

        const i = c.propInterface;
        assert.equal('IRowProps', i.name);
        assert.equal('Row properties.', i.comment);
        assert.equal(4, i.members.length);
        assert.equal('prop1', i.members[0].name);
        assert.equal('prop1 description', i.members[0].comment);
        assert.equal(false, i.members[0].isRequired);

        assert.equal('prop2', i.members[1].name);
        assert.equal('prop2 description', i.members[1].comment);
        assert.equal(true, i.members[1].isRequired);

        assert.equal('prop3', i.members[2].name);
        assert.equal('prop3 description', i.members[2].comment);
        assert.equal(true, i.members[2].isRequired);

        assert.equal('prop4', i.members[3].name);
        assert.equal('prop4 description', i.members[3].comment);
        assert.equal(true, i.members[3].isRequired);
    });

    it('Should parse class-based pure components', () => {
        const fileName = path.join(__dirname, '../../src/__tests__/data/PureRow.tsx'); // it's running in ./temp
        const result = getFileDocumentation(fileName);

        assert.ok(result.components);
        assert.equal(1, result.components.length);

        const c = result.components[0];
        assert.equal('Row', c.name);
        assert.equal('Form row.', c.comment);
        assert.equal('PureComponent', c.extends);
        assert.isNotNull(c.propInterface);

        const i = c.propInterface
        assert.equal('IRowProps', i.name);
        assert.equal('Row properties.', i.comment);
        assert.equal(4, i.members.length);
        assert.equal('prop1', i.members[0].name);
        assert.equal('prop1 description', i.members[0].comment);
        assert.equal(false, i.members[0].isRequired);

        assert.equal('prop2', i.members[1].name);
        assert.equal('prop2 description', i.members[1].comment);
        assert.equal(true, i.members[1].isRequired);

        assert.equal('prop3', i.members[2].name);
        assert.equal('prop3 description', i.members[2].comment);
        assert.equal(true, i.members[2].isRequired);

        assert.equal('prop4', i.members[3].name);
        assert.equal('prop4 description', i.members[3].comment);
        assert.equal(true, i.members[3].isRequired);
    });

    it('Should avoid parsing exported objects as components', () => {
        const fileName = path.join(__dirname, '../../src/__tests__/data/ConstExport.tsx'); // it's running in ./temp
        const result = getFileDocumentation(fileName);
        assert.ok(result.components);        
        assert.equal(1, result.components.length);

        const c = result.components[0];
        assert.equal('Row', c.name);
        assert.equal('Form row.', c.comment);
        assert.equal('StatelessComponent', c.extends);
        assert.isNotNull(c);

        const i = c.propInterface;
        assert.equal('IRowProps', i.name);
        assert.equal('Row properties.', i.comment);
        assert.equal(4, i.members.length);
        assert.equal('prop1', i.members[0].name);
        assert.equal('prop1 description', i.members[0].comment);
        assert.equal(false, i.members[0].isRequired);

        assert.equal('prop2', i.members[1].name);
        assert.equal('prop2 description', i.members[1].comment);
        assert.equal(true, i.members[1].isRequired);

        assert.equal('prop3', i.members[2].name);
        assert.equal('prop3 description', i.members[2].comment);
        assert.equal(true, i.members[2].isRequired);

        assert.equal('prop4', i.members[3].name);
        assert.equal('prop4 description', i.members[3].comment);
        assert.equal(true, i.members[3].isRequired);
    });

    it('Should parse higher order components', () => {
        const fileName = path.join(__dirname, '../../src/__tests__/data/ColumnHigherOrderComponent.tsx'); // it's running in ./temp        
        const result = getFileDocumentation(fileName);
        assert.ok(result.components);
        assert.equal(6, result.components.length);

        const r1 = result.components[0];
        assert.equal('ColumnHigherOrderComponent1', r1.name);
        assert.equal('ColumnHigherOrderComponent1 specific comment', r1.comment);
        assert.equal('Column', r1.extends);
        assert.isNotNull(r1.propInterface);

        const p1 = r1.propInterface;
        assert.equal('IColumnProps', p1.name);
        assert.equal('Column properties.', p1.comment);
        assert.equal(4, p1.members.length);
        assert.equal('prop1', p1.members[0].name);
        assert.equal('prop1 description', p1.members[0].comment);
        assert.equal(false, p1.members[0].isRequired);

        assert.equal('prop2', p1.members[1].name);
        assert.equal('prop2 description', p1.members[1].comment);
        assert.equal(true, p1.members[1].isRequired);

        assert.equal('prop3', p1.members[2].name);
        assert.equal('prop3 description', p1.members[2].comment);
        assert.equal(true, p1.members[2].isRequired);

        assert.equal('prop4', p1.members[3].name);
        assert.equal('prop4 description', p1.members[3].comment);
        assert.equal(true, p1.members[3].isRequired);

        const r2 = result.components[1];
        assert.equal('ColumnHigherOrderComponent2', r2.name);
        assert.equal('Form column.', r2.comment);
        assert.equal('Column', r2.extends);
        assert.isNotNull(r2.propInterface);
        const p2 = r2.propInterface;
        assert.equal('IColumnProps', p2.name);

        const r3 = result.components[2];
        assert.equal('ColumnExternalHigherOrderComponent', r3.name);
        assert.equal('Form column.', r3.comment);
        assert.equal('Column', r3.extends);
        assert.isNotNull(r3.propInterface);
        const p3 = r3.propInterface;
        assert.equal('IColumnProps', p3.name);

        const r4 = result.components[3];
        assert.equal('RowHigherOrderComponent1', r4.name);
        assert.equal('RowHigherOrderComponent1 specific comment', r4.comment);
        assert.equal('Row', r4.extends);
        assert.isNotNull(r4.propInterface);
        const p4 = r4.propInterface;
        assert.equal('IRowProps', p4.name);

        const r5 = result.components[4];
        assert.equal('RowHigherOrderComponent2', r5.name);
        assert.equal('Form row.', r5.comment);
        assert.equal('Row', r5.extends);
        assert.isNotNull(r5.propInterface);
        const p5 = r5.propInterface;
        assert.equal('IRowProps', p5.name);  

        const r6 = result.components[5];
        assert.equal('RowExternalHigherOrderComponent', r6.name);
        assert.equal('Form row.', r6.comment);
        assert.equal('Row', r6.extends);
        assert.isNotNull(r6.propInterface);
        const p6 = r6.propInterface;
        assert.equal('IRowProps', p6.name);       
    });
});