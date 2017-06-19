import { assert } from 'chai';
import * as path from 'path';
import { getFileDocumentation } from '../getFileDocumentation';
import { convertToDocgen } from '../docgenConverter';
import { StyleguidistComponent } from '../propTypesParser';

describe('docgenConverter', () => {
    it('Should work with class Component', () => {
        const result = convertToDocgen('', {
            components: [
                { 
                    name: 'name1',
                    comment: 'comment1',
                    extends: 'Component',
                    propInterface: {
                        name: 'PropsInterface',
                        comment: 'props comment',
                        members: [{
                                name: 'prop1',
                                comment: 'prop1 comment',
                                isRequired: true,
                                type: 'prop1 type'
                            }]},
                }]
        });

        assert.isNotNull(result);
        assert.equal('name1', result.displayName);
        assert.equal('comment1', result.description);
        const prop1Result = result.props['prop1'];
        assert.equal('prop1 type', prop1Result.type.name);
        assert.equal('prop1 comment', prop1Result.description);
        assert.equal(true, prop1Result.required);
    });

    it('Should work with functional StatelessComponent', () => {
        const result = convertToDocgen('', {
            components: [
                { 
                    name: 'name1',
                    comment: 'comment1',
                    extends: 'StatelessComponent',
                    propInterface: {
                        name: 'PropsInterface',
                        comment: 'props comment',
                        members: [{
                                name: 'prop1',
                                comment: 'prop1 comment',
                                isRequired: true,
                                type: 'prop1 type'
                            }]}
                }]
        });

        assert.equal('name1', result.displayName);
        assert.equal('comment1', result.description);
        const prop1Result = result.props['prop1'];
        assert.equal('prop1 type', prop1Result.type.name);
        assert.equal('prop1 comment', prop1Result.description);
        assert.equal(true, prop1Result.required);
    });

    it('Should work without props interface', () => {
        let result: StyleguidistComponent = null;
        const originalWarn = console.warn;
        let warnCallCount = 0;
        console.warn = () => warnCallCount++;
        try {
            result = convertToDocgen('', {
                components: [
                    { 
                        name: 'name1',
                        comment: 'comment1',
                        extends: 'Component',
                        propInterface: null,
                    }
                ]
            });
        } finally {
            console.warn = originalWarn;
        }

        assert.equal(1, warnCallCount);
        assert.equal('name1', result.displayName);
        assert.equal('comment1', result.description);
    });

    it('Should work with class PureComponent', () => {
        let result: StyleguidistComponent = null;
        const originalWarn = console.warn;
        let warnCallCount = 0;
        console.warn = () => warnCallCount++;
        try {
            result = convertToDocgen('', {
                components: [
                    { 
                        name: 'name1',
                        comment: 'comment1',
                        extends: 'PureComponent',
                        propInterface: null,
                    }
                ]
            });
        } finally {
            console.warn = originalWarn;
        }

        assert.equal(1, warnCallCount);
        assert.equal('name1', result.displayName);
        assert.equal('comment1', result.description);
    });

    it('Should return empty object if there are no components', () => {
        const result = convertToDocgen('/root/MyComponent.tsx', { components: [] });
        assert.isOk(result);
        assert.equal(result.displayName, 'MyComponent');
    })
});