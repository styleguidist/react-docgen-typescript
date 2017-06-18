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
        assert.equal(c.name, 'Column');
        assert.equal(c.comment, 'Form column.');
        assert.equal(c.extends, 'Component');
        assert.isNotNull(c.propInterface);

        const i = c.propInterface;
        assert.equal(i.name, 'IColumnProps');
        assert.equal(i.comment, 'Column properties.');
        assert.equal(i.members.length, 4);
        assert.equal(i.members[0].name, 'prop1');
        assert.equal(i.members[0].comment, 'prop1 description');
        assert.equal(i.members[0].isRequired, false);

        assert.equal(i.members[1].name, 'prop2');
        assert.equal(i.members[1].comment, 'prop2 description');
        assert.equal(i.members[1].isRequired, true);

        assert.equal(i.members[2].name, 'prop3');
        assert.equal(i.members[2].comment, 'prop3 description');
        assert.equal(i.members[2].isRequired, true);

        assert.equal(i.members[3].name, 'prop4');
        assert.equal(i.members[3].comment, 'prop4 description');
        assert.equal(i.members[3].isRequired, true);
    });

    it('Should parse class-based components (2)', () => {
        const fileName = path.join(__dirname, '../../src/__tests__/data/AppMenu.tsx'); // it's running in ./temp
        const result = getFileDocumentation(fileName);
        assert.ok(result.components);
        assert.equal(1, result.components.length);

        const c = result.components[0];
        assert.equal(c.name, 'AppMenu');
        assert.equal(c.comment, 'App Menu Component');
        assert.equal(c.extends, 'Component');
        assert.isNotNull(c.propInterface);

        const i = c.propInterface;
        assert.equal(i.name, 'IAppMenuProps');
        assert.equal(i.comment, 'App Menu Props');
        assert.equal(1, i.members.length);
        assert.equal(i.members[0].name, 'menu');
        assert.equal(i.members[0].comment, 'Menu items');
    });    

    it('Should parse class-based components with unexported props interface', () => {
        const fileName = path.join(__dirname, '../../src/__tests__/data/ColumnWithoutExportedProps.tsx'); // it's running in ./temp    
        const result = getFileDocumentation(fileName);
        assert.ok(result.components);
        assert.equal(1, result.components.length);

        const c = result.components[0];
        assert.equal(c.name, 'Column');
        assert.equal(c.comment, 'Form column.');
        assert.equal(c.extends, 'Component');
        assert.isNotNull(c.propInterface);

        const i = c.propInterface;
        assert.equal(i.name, 'IColumnProps');
        assert.equal(i.comment, 'Column properties.');
        assert.equal(4, i.members.length);
        assert.equal(i.members[0].name, 'prop1');
        assert.equal(i.members[0].comment, 'prop1 description');
        assert.equal(i.members[0].isRequired, false);

        assert.equal(i.members[1].name, 'prop2');
        assert.equal(i.members[1].comment, 'prop2 description');
        assert.equal(i.members[1].isRequired, true);

        assert.equal(i.members[2].name, 'prop3');
        assert.equal(i.members[2].comment, 'prop3 description');
        assert.equal(i.members[2].isRequired, true);

        assert.equal(i.members[3].name, 'prop4');
        assert.equal(i.members[3].comment, 'prop4 description');
        assert.equal(i.members[3].isRequired, true);
    });

    it('Should parse functional components', () => {
        const fileName = path.join(__dirname, '../../src/__tests__/data/Row.tsx'); // it's running in ./temp
        const result = getFileDocumentation(fileName);
        assert.ok(result.components);
        assert.equal(1, result.components.length);

        const c = result.components[0];
        assert.equal(c.name, 'Row');
        assert.equal(c.comment, 'Form row.');
        assert.equal(c.extends, 'StatelessComponent');
        assert.isNotNull(c.propInterface)

        const i = c.propInterface;
        assert.equal(i.name, 'IRowProps');
        assert.equal(i.comment, 'Row properties.');
        assert.equal(i.members.length, 4);
        assert.equal(i.members[0].name, 'prop1');
        assert.equal(i.members[0].comment, 'prop1 description');
        assert.equal(i.members[0].isRequired, false);

        assert.equal(i.members[1].name, 'prop2');
        assert.equal(i.members[1].comment, 'prop2 description');
        assert.equal(i.members[1].isRequired, true);

        assert.equal(i.members[2].name, 'prop3');
        assert.equal(i.members[2].comment, 'prop3 description');
        assert.equal(i.members[2].isRequired, true);

        assert.equal(i.members[3].name, 'prop4');
        assert.equal(i.members[3].comment, 'prop4 description');
        assert.equal(i.members[3].isRequired, true);
    });

    it('Should parse class-based pure components', () => {
        const fileName = path.join(__dirname, '../../src/__tests__/data/PureRow.tsx'); // it's running in ./temp
        const result = getFileDocumentation(fileName);

        assert.ok(result.components);
        assert.equal(result.components.length, 1);

        const c = result.components[0];
        assert.equal(c.name, 'Row');
        assert.equal(c.comment, 'Form row.');
        assert.equal(c.extends, 'PureComponent');
        assert.isNotNull(c.propInterface);

        const i = c.propInterface
        assert.equal(i.name, 'IRowProps');
        assert.equal(i.comment, 'Row properties.');
        assert.equal(i.members.length, 4);
        assert.equal(i.members[0].name, 'prop1');
        assert.equal(i.members[0].comment, 'prop1 description');
        assert.equal(i.members[0].isRequired, false);

        assert.equal(i.members[1].name, 'prop2');
        assert.equal(i.members[1].comment, 'prop2 description');
        assert.equal(i.members[1].isRequired, true);

        assert.equal(i.members[2].name, 'prop3');
        assert.equal(i.members[2].comment, 'prop3 description');
        assert.equal(i.members[2].isRequired, true);

        assert.equal(i.members[3].name, 'prop4');
        assert.equal(i.members[3].comment, 'prop4 description');
        assert.equal(i.members[3].isRequired, true);
    });

    it('Should avoid parsing exported objects as components', () => {
        const fileName = path.join(__dirname, '../../src/__tests__/data/ConstExport.tsx'); // it's running in ./temp
        const result = getFileDocumentation(fileName);
        assert.ok(result.components);        
        assert.equal(result.components.length, 1);

        const c = result.components[0];
        assert.equal(c.name, 'Row');
        assert.equal(c.comment, 'Form row.');
        assert.equal(c.extends, 'StatelessComponent');
        assert.isNotNull(c);

        const i = c.propInterface;
        assert.equal(i.name, 'IRowProps');
        assert.equal(i.comment, 'Row properties.');
        assert.equal(i.members.length, 4);
        assert.equal(i.members[0].name, 'prop1');
        assert.equal(i.members[0].comment, 'prop1 description');
        assert.equal(i.members[0].isRequired, false);

        assert.equal(i.members[1].name, 'prop2');
        assert.equal(i.members[1].comment, 'prop2 description');
        assert.equal(i.members[1].isRequired, true);

        assert.equal(i.members[2].name, 'prop3');
        assert.equal(i.members[2].comment, 'prop3 description');
        assert.equal(i.members[2].isRequired, true);

        assert.equal(i.members[3].name, 'prop4');
        assert.equal(i.members[3].comment, 'prop4 description');
        assert.equal(i.members[3].isRequired, true);
    });

    it('Should parse higher order components', () => {
        const fileName = path.join(__dirname, '../../src/__tests__/data/ColumnHigherOrderComponent.tsx'); // it's running in ./temp        
        const result = getFileDocumentation(fileName);
        assert.ok(result.components);
        assert.equal(result.components.length, 6);

        const r1 = result.components[0];
        assert.equal(r1.name, 'ColumnHigherOrderComponent1');
        assert.equal(r1.comment, 'ColumnHigherOrderComponent1 specific comment');
        assert.equal(r1.extends, 'Column');
        assert.isNotNull(r1.propInterface);

        const p1 = r1.propInterface;
        assert.equal(p1.name, 'IColumnProps');
        assert.equal(p1.comment, 'Column properties.');
        assert.equal(p1.members.length, 4);
        assert.equal(p1.members[0].name, 'prop1');
        assert.equal(p1.members[0].comment, 'prop1 description');
        assert.equal(p1.members[0].isRequired, false);

        assert.equal(p1.members[1].name, 'prop2');
        assert.equal(p1.members[1].comment, 'prop2 description');
        assert.equal(p1.members[1].isRequired, true);

        assert.equal(p1.members[2].name, 'prop3');
        assert.equal(p1.members[2].comment, 'prop3 description');
        assert.equal(p1.members[2].isRequired, true);

        assert.equal(p1.members[3].name, 'prop4');
        assert.equal(p1.members[3].comment, 'prop4 description');
        assert.equal(p1.members[3].isRequired, true);

        const r2 = result.components[1];
        assert.equal(r2.name, 'ColumnHigherOrderComponent2');
        assert.equal(r2.comment, 'Form column.');
        assert.equal(r2.extends, 'Column');
        assert.isNotNull(r2.propInterface);
        const p2 = r2.propInterface;
        assert.equal(p2.name, 'IColumnProps');

        const r3 = result.components[2];
        assert.equal(r3.name, 'ColumnExternalHigherOrderComponent');
        assert.equal(r3.comment, 'Form column.');
        assert.equal(r3.extends, 'Column');
        assert.isNotNull(r3.propInterface);
        const p3 = r3.propInterface;
        assert.equal(p3.name, 'IColumnProps');

        const r4 = result.components[3];
        assert.equal(r4.name, 'RowHigherOrderComponent1');
        assert.equal(r4.comment, 'RowHigherOrderComponent1 specific comment');
        assert.equal(r4.extends, 'Row');
        assert.isNotNull(r4.propInterface);
        const p4 = r4.propInterface;
        assert.equal(p4.name, 'IRowProps');

        const r5 = result.components[4];
        assert.equal(r5.name, 'RowHigherOrderComponent2');
        assert.equal(r5.comment, 'Form row.');
        assert.equal(r5.extends, 'Row');
        assert.isNotNull(r5.propInterface);
        const p5 = r5.propInterface;
        assert.equal(p5.name, 'IRowProps');

        const r6 = result.components[5];
        assert.equal(r6.name, 'RowExternalHigherOrderComponent');
        assert.equal(r6.comment, 'Form row.');
        assert.equal(r6.extends, 'Row');
        assert.isNotNull(r6.propInterface);
        const p6 = r6.propInterface;
        assert.equal(p6.name, 'IRowProps');       
    });

    it('Should accept type as props', function() {
        const fileName = path.join(__dirname, '../../src/__tests__/data/FlippableImage.tsx'); // it's running in ./temp        
        const result = getFileDocumentation(fileName);
        assert.ok(result.components);
        assert.equal(1, result.components.length);
        const r1 = result.components[0];
        assert.equal(r1.name, 'FlippableImage')
        assert.isNotNull(r1.propInterface);
        const p1 = r1.propInterface;
        assert.equal(p1.name, 'Props');
        assert.equal(p1.comment, 'Props comment ');
        assert.equal(p1.members.length, 2);
        assert.equal(p1.members[0].name, 'isFlippedX');
        assert.equal(p1.members[0].comment, 'whether the image is flipped horizontally');
        assert.equal(p1.members[1].name, 'isFlippedY');
        assert.equal(p1.members[1].comment, 'whether the image is flipped vertically');
    });

    it('Should recognize props defined in different file', function() {
        const fileName = path.join(__dirname, '../../src/__tests__/data/ExternalPropsComponent.tsx'); // it's running in ./temp        
        const result = getFileDocumentation(fileName);
        assert.ok(result.components);
        assert.equal(1, result.components.length);
        const r1 = result.components[0];
        assert.equal(r1.name, 'ExternalPropsComponent')        
        assert.isNotNull(r1.propInterface);
        const p1 = r1.propInterface;
        assert.equal(p1.name, 'ExternalPropsComponentProps');
        // assert.equal(p1.comment, 'ExternalPropsComponentProps props');
    });

    it('Should parse file that worked in v0.0.11', function() {
        const fileName = path.join(__dirname, '../../src/__tests__/data/Regression_v0_0_12.tsx'); // it's running in ./temp        
        const result = getFileDocumentation(fileName);
        assert.ok(result.components);
    })

});