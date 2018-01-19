import { assert } from 'chai';
import { check } from "./testUtils";
import { PropsFilter } from '../parser';

describe('parser', () => {

    const children = { type: 'ReactNode', required: false, description: '', };

    it('should parse simple react class component', function() {
        check('Column', {
            Column: {
                children,
                prop1: { type: 'string', required: false },
                prop2: { type: 'number' },
                prop3: { type: '() => void'},
                prop4: { type: '"option1" | "option2" | "option3"' },
            }
        });
    });

    it('should parse simple react class component as default export', function() {
        check('ColumnWithDefaultExport', {
            Column: {
                children,
                prop1: { type: 'string', required: false },
                prop2: { type: 'number' },
                prop3: { type: '() => void'},
                prop4: { type: '"option1" | "option2" | "option3"' },
            }
        });
    });
    
    it('should parse simple react class component as default export only', function() {
        check('ColumnWithDefaultExportOnly', {
            ColumnWithDefaultExportOnly: {
                children,
                prop1: { type: 'string', required: false },
                prop2: { type: 'number' },
                prop3: { type: '() => void'},
                prop4: { type: '"option1" | "option2" | "option3"' },
            }
        });
    });

    it('should parse simple react class component as default anonymous export', function() {
        check('ColumnWithDefaultAnonymousExportOnly', {
            ColumnWithDefaultAnonymousExportOnly: {
                children,
                prop1: { type: 'string', required: false },
                prop2: { type: 'number' },
                prop3: { type: '() => void'},
                prop4: { type: '"option1" | "option2" | "option3"' },
            }
        });
    });

    it('should parse simple react class component with state', () => {
        check('AppMenu', {
            AppMenu: {
                children,
                menu: { type: 'any' },
            }
        });
    });

    it('should parse simple react class component with picked properties', function() {
        // we are not able to get correct descriptions for prop1,prop2
        check('ColumnWithPick', {
            Column: {
                children,
                prop1: { type: 'string', required: false, description: '' },
                prop2: { type: 'number', description: '' },
                propx: { type: 'number' },
            }
        });
    });

    it('should parse HOCs', function() {
        check('ColumnHigherOrderComponent', {
            ColumnHigherOrderComponent1: {
                children,
                prop1: { type: 'string' },
            },
            ColumnHigherOrderComponent2: {
                children,
                prop1: { type: 'string' },
            },
            RowHigherOrderComponent1: {
                prop1: { type: 'string' },
            },
            RowHigherOrderComponent2: {
                prop1: { type: 'string' },
            },
            ColumnExternalHigherOrderComponent: {
                children,
                prop1: { type: 'string' },
            },
            RowExternalHigherOrderComponent: {
                prop1: { type: 'string' },
            }
        });
    });

    it('should parse component with inherited properties HtmlAttributes<any>', function(){
        check('ColumnWithHtmlAttributes', {
            Column: {
                children,
                prop1: { type: 'string', required: false },
                prop2: { type: 'number' },
                // HtmlAttributes
                defaultChecked: {
                    type: 'boolean',
                    required: false,
                    description: ''
                }
                // ...
            }
        }, false);
    });

    it('should parse component without exported props interface', function(){
        check('ColumnWithoutExportedProps', {
            Column: {
                children,
                prop1: { type: 'string', required: false },
                prop2: { type: 'number' },
            }
        });
    });

    it('should parse functional component exported as const', function(){
        check('ConstExport', {
            Row: {
                prop1: { type: 'string', required: false },
                prop2: { type: 'number' },
            },
            // TODO: this wasn't there before, i would guess that that's correct
            test: {
            }
        }, false);
    });

    it('should parse react component with properties defined in external file', function(){
        check('ExternalPropsComponent', {
            ExternalPropsComponent: {
                children,
                prop1: { type: 'string' },
            }
        });
    });

    it('should parse react component with properties extended from an external .tsx file', function(){
        check('ExtendsExternalPropsComponent', {
            ExtendsExternalPropsComponent: {
                children,
                prop1: { type: 'number', required: false, description: 'prop1' },
                prop2: { type: 'string', required: false, description: 'prop2' },
            }
        });
    });

    it('should parse react component with properties defined as type', function(){
        check('FlippableImage', {
            FlippableImage: {
                children,
                isFlippedX: { type: 'boolean', required: false },
                isFlippedY: { type: 'boolean', required: false },
            }
        }, false);
    });

    it('should parse react component with const definitions', function(){
        check('InlineConst', {
            MyComponent: {
                children,
                foo: { type: 'any' },
            }
        });
    });

    it('should parse react component with default props', function(){
        check('ComponentWithDefaultProps', {
            ComponentWithDefaultProps: {
                children,
                sampleDefaultFromJSDoc: { type: '"hello" | "goodbye"', required: true, defaultValue: "hello", description: 'sample with default value' },
                sampleTrue: { type: "boolean", required: false, defaultValue: "true" },
                sampleFalse: { type: "boolean", required: false, defaultValue: "false" },
                sampleString: { type: "string", required: false, defaultValue: "hello" },
                sampleObject: { type: "{ [key: string]: any; }", required: false, defaultValue: "{ a: '1', b: 2, c: true, d: false, e: undefined, f: null, g: { a: '1' } }" },
                sampleNull: { type: "null", required: false, defaultValue: "null" },
                sampleUndefined: { type: "any", required: false, defaultValue: "undefined" },
            }
        });
    });

    it('should parse react PureComponent', function(){
        check('PureRow', {
            Row: {
                children,
                prop1: { type: 'string', required: false },
                prop2: { type: 'number' },
            }
        });
    });

    it('should parse react PureComponent - regression test', function(){
        check('Regression_v0_0_12', {
            Zoomable: {
                children,
                originX: { type: 'number' },
                originY: { type: 'number' },
                scaleFactor: { type: 'number' }
            }
        }, false);
    });

    it('should parse react functional component', function(){
        check('Row', {
            Row: {
                prop1: { type: 'string', required: false },
                prop2: { type: 'number' },
            }
        });
    });

    it('should parse react stateless component', function(){
        check('Stateless', {
            Stateless: {
                children,
                myProp: { type: 'string' },
            }
        });
    });

    it('should parse react stateless component with default props', function(){
        check('StatelessWithDefaultProps', {
            StatelessWithDefaultProps: {
                children,
                sampleJSDoc: { type: "string", required: false, defaultValue: "test" },
                sampleProp: { type: "string", required: false, defaultValue: "hello" },
            }
        });
    });

    it('should parse functional component component defined as function', function(){
        check('FunctionDeclaration', {
            Jumbotron: {
                prop1: { type: "string", required: true },
            }
        });
    });

    it('should parse functional component component defined as const', function(){
        check('FunctionalComponentAsConst', {
            Jumbotron: {
                prop1: { type: "string", required: true },
            }
        });
    });

    it('should parse functional component component defined as function as default export', function(){
        check('FunctionDeclarationAsDefaultExport', {
            Jumbotron: {
                prop1: { type: "string", required: true },
            }
        });
    });

    it('should parse functional component component defined as const as default export', function(){
        check('FunctionalComponentAsConstAsDefaultExport', {
            // in this case the component name is taken from the file name
            FunctionalComponentAsConstAsDefaultExport: {
                prop1: { type: "string", required: true },
            }
        }, true, 'Jumbotron description');
    });

    it('should parse functional component component defined as const as named export', function(){
        check('FunctionalComponentAsConstAsNamedExport', {
            // in this case the component name is taken from the file name
            FunctionalComponentAsConstAsNamedExport: {
                prop1: { type: "string", required: true },
            }
        }, true, 'Jumbotron description');
    });    

    describe('parser options', function() {

        describe('ignoreChildrenPropIfNoDocAvailable', function() {
            const propsFilter: PropsFilter = (prop, componentName) => prop.name && prop.description.length > 0

            it('should ignore "children" property if not documented explicitly', function() {
                check('Column', {
                    Column: {
                        prop1: { type: 'string', required: false },
                        prop2: { type: 'number' },
                        prop3: { type: '() => void'},
                        prop4: { type: '"option1" | "option2" | "option3"' },
                    }
                }, true, null, { propsFilter });
            });

            it('should not ignore "children" property if documented explicitly', function() {
                check('ColumnWithAnnotatedChildren', {
                    Column: {
                        children: { type: 'ReactNode', required: false, description: 'children description'},
                        prop1: { type: 'string', required: false },
                        prop2: { type: 'number' },
                        prop3: { type: '() => void'},
                        prop4: { type: '"option1" | "option2" | "option3"' }
                    }
                }, true, null, { propsFilter });
            });

        });

    });

});
