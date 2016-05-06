"use strict";
var path = require('path');
require('mocha');
var chai_1 = require('chai');
var parser_1 = require('../parser');
describe('parser', function () {
    it('Should parse file', function () {
        var fileName = path.join(__dirname, '../../__tests__/data/Column.tsx'); // it's running in ./temp        
        var result = parser_1.getDocumentation(fileName);
        chai_1.assert.ok(result.classes);
        chai_1.assert.ok(result.interfaces);
        chai_1.assert.equal(1, result.classes.length);
        chai_1.assert.equal(1, result.interfaces.length);
        var c = result.classes[0];
        chai_1.assert.equal('Column', c.name);
        chai_1.assert.equal('Form column.', c.comment);
        var i = result.interfaces[0];
        chai_1.assert.equal('IColumnProps', i.name);
        chai_1.assert.equal('Column properties.', i.comment);
        console.log(JSON.stringify(result));
    });
});
