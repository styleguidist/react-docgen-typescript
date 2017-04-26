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
        assert.equal(4, result.components.length);

        const r1 = result.components[0];
        assert.equal('ColumnHighOrderComponent1', r1.name);
        assert.equal('ColumnHighOrderComponent1 specific comment', r1.comment);
        assert.equal('Column', r1.extends);
        assert.isNotNull(r1.propInterface);

        const i = r1.propInterface;
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

        const r2 = result.components[1];
        assert.equal('ColumnHighOrderComponent2', r2.name);
        assert.equal('Form column.', r2.comment);
        assert.equal('Column', r2.extends);
        assert.isNotNull(r2.propInterface);

    });
});