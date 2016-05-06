import * as path from 'path';
import 'mocha';
import { assert } from 'chai';
import { getDocumentation } from '../parser';

describe('parser', () => {
            
    it('Should parse file', () => {
        const fileName = path.join(__dirname, '../../__tests__/data/Column.tsx'); // it's running in ./temp        
        const result = getDocumentation(fileName);
        assert.ok(result.classes);
        assert.ok(result.interfaces);
        assert.equal(1, result.classes.length);
        assert.equal(1, result.interfaces.length);
        
        const c = result.classes[0];
        assert.equal('Column', c.name);
        assert.equal('Form column.', c.comment);
        
        const i = result.interfaces[0];
        assert.equal('IColumnProps', i.name);
        assert.equal('Column properties.', i.comment);
        
        
        console.log(JSON.stringify(result));
    });
    
});