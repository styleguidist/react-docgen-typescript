import { assert } from 'chai';
import * as path from 'path';
import { parse, PropFilter, withCustomConfig } from '../parser';
import { check, fixturePath } from './testUtils';

describe('parser', () => {
  const children = { type: 'ReactNode', required: false, description: '' };

  it('should parse simple react class component', () => {
    check('Column', {
      Column: {
        prop1: { type: 'string', required: false },
        prop2: { type: 'number' },
        prop3: { type: '() => void' },
        prop4: { type: '"option1" | "option2" | "option3"' }
      }
    });
  });

  it('should parse simple react class component as default export', () => {
    check('ColumnWithDefaultExport', {
      Column: {
        prop1: { type: 'string', required: false },
        prop2: { type: 'number' },
        prop3: { type: '() => void' },
        prop4: { type: '"option1" | "option2" | "option3"' }
      }
    });
  });

  it('should parse simple react class component as default export only', () => {
    check('ColumnWithDefaultExportOnly', {
      ColumnWithDefaultExportOnly: {
        prop1: { type: 'string', required: false },
        prop2: { type: 'number' },
        prop3: { type: '() => void' },
        prop4: { type: '"option1" | "option2" | "option3"' }
      }
    });
  });

  it('should parse simple react class component as default anonymous export', () => {
    check('ColumnWithDefaultAnonymousExportOnly', {
      ColumnWithDefaultAnonymousExportOnly: {
        prop1: { type: 'string', required: false },
        prop2: { type: 'number' },
        prop3: { type: '() => void' },
        prop4: { type: '"option1" | "option2" | "option3"' }
      }
    });
  });

  it('should parse simple react class component with state', () => {
    check('AppMenu', {
      AppMenu: {
        menu: { type: 'any' }
      }
    });
  });

  it('should parse simple react class component with picked properties', () => {
    // we are not able to get correct descriptions for prop1,prop2
    check('ColumnWithPick', {
      Column: {
        prop1: { type: 'string', required: false, description: '' },
        prop2: { type: 'number', description: '' },
        propx: { type: 'number' }
      }
    });
  });

  it('should parse HOCs', () => {
    check('ColumnHigherOrderComponent', {
      ColumnExternalHigherOrderComponent: {
        prop1: { type: 'string' }
      },
      ColumnHigherOrderComponent1: {
        prop1: { type: 'string' }
      },
      ColumnHigherOrderComponent2: {
        prop1: { type: 'string' }
      },
      RowExternalHigherOrderComponent: {
        prop1: { type: 'string' }
      },
      RowHigherOrderComponent1: {
        prop1: { type: 'string' }
      },
      RowHigherOrderComponent2: {
        prop1: { type: 'string' }
      }
    });
  });

  it('should parse component with inherited properties HtmlAttributes<any>', () => {
    check(
      'ColumnWithHtmlAttributes',
      {
        Column: {
          // tslint:disable:object-literal-sort-keys
          prop1: { type: 'string', required: false },
          prop2: { type: 'number' },
          // HtmlAttributes
          defaultChecked: {
            type: 'boolean',
            required: false,
            description: ''
          }
          // ...
          // tslint:enable:object-literal-sort-keys
        }
      },
      false
    );
  });

  it('should parse component without exported props interface', () => {
    check('ColumnWithoutExportedProps', {
      Column: {
        prop1: { type: 'string', required: false },
        prop2: { type: 'number' }
      }
    });
  });

  it('should parse functional component exported as const', () => {
    check(
      'ConstExport',
      {
        Row: {
          prop1: { type: 'string', required: false },
          prop2: { type: 'number' }
        },
        // TODO: this wasn't there before, i would guess that that's correct
        test: {}
      },
      false
    );
  });

  it('should parse react component with properties defined in external file', () => {
    check('ExternalPropsComponent', {
      ExternalPropsComponent: {
        prop1: { type: 'string' }
      }
    });
  });

  it('should parse react component with properties extended from an external .tsx file', () => {
    check('ExtendsExternalPropsComponent', {
      ExtendsExternalPropsComponent: {
        prop1: { type: 'number', required: false, description: 'prop1' },
        prop2: { type: 'string', required: false, description: 'prop2' }
      }
    });
  });

  it('should parse react component with properties defined as type', () => {
    check(
      'FlippableImage',
      {
        FlippableImage: {
          isFlippedX: { type: 'boolean', required: false },
          isFlippedY: { type: 'boolean', required: false }
        }
      },
      false
    );
  });

  it('should parse react component with const definitions', () => {
    check('InlineConst', {
      MyComponent: {
        foo: { type: 'any' }
      }
    });
  });

  describe('component with default props', () => {
    const expectation = {
      ComponentWithDefaultProps: {
        sampleDefaultFromJSDoc: {
          defaultValue: 'hello',
          description: 'sample with default value',
          required: true,
          type: '"hello" | "goodbye"'
        },
        sampleFalse: {
          defaultValue: 'false',
          required: false,
          type: 'boolean'
        },
        sampleNull: { type: 'null', required: false, defaultValue: 'null' },
        sampleNumber: { type: 'number', required: false, defaultValue: '-1' },
        sampleObject: {
          defaultValue: `{ a: '1', b: 2, c: true, d: false, e: undefined, f: null, g: { a: '1' } }`,
          required: false,
          type: '{ [key: string]: any; }'
        },
        sampleString: {
          defaultValue: 'hello',
          required: false,
          type: 'string'
        },
        sampleTrue: { type: 'boolean', required: false, defaultValue: 'true' },
        sampleUndefined: {
          defaultValue: 'undefined',
          required: false,
          type: 'any'
        }
      }
    };

    it('should parse defined props', () => {
      check('ComponentWithDefaultProps', expectation);
    });

    it('should parse referenced props', () => {
      check('ComponentWithReferencedDefaultProps', expectation);
    });
  });

  it('should parse react PureComponent', () => {
    check('PureRow', {
      Row: {
        prop1: { type: 'string', required: false },
        prop2: { type: 'number' }
      }
    });
  });

  it('should parse react PureComponent - regression test', () => {
    check(
      'Regression_v0_0_12',
      {
        Zoomable: {
          originX: { type: 'number' },
          originY: { type: 'number' },
          scaleFactor: { type: 'number' }
        }
      },
      false
    );
  });

  it('should parse react functional component', () => {
    check('Row', {
      Row: {
        prop1: { type: 'string', required: false },
        prop2: { type: 'number' }
      }
    });
  });

  it('should parse react stateless component', () => {
    check('Stateless', {
      Stateless: {
        myProp: { type: 'string' }
      }
    });
  });

  describe('stateless component with default props', () => {
    const expectation = {
      StatelessWithDefaultProps: {
        sampleDefaultFromJSDoc: {
          defaultValue: 'hello',
          description: 'sample with default value',
          required: true,
          type: '"hello" | "goodbye"'
        },
        sampleFalse: {
          defaultValue: 'false',
          required: false,
          type: 'boolean'
        },
        sampleNull: { type: 'null', required: false, defaultValue: 'null' },
        sampleNumber: { type: 'number', required: false, defaultValue: '-1' },
        sampleObject: {
          defaultValue: `{ a: '1', b: 2, c: true, d: false, e: undefined, f: null, g: { a: '1' } }`,
          required: false,
          type: '{ [key: string]: any; }'
        },
        sampleString: {
          defaultValue: 'hello',
          required: false,
          type: 'string'
        },
        sampleTrue: { type: 'boolean', required: false, defaultValue: 'true' },
        sampleUndefined: {
          defaultValue: 'undefined',
          required: false,
          type: 'any'
        }
      }
    };

    it('should parse defined props', () => {
      check('StatelessWithDefaultProps', expectation);
    });

    it('should parse referenced props', () => {
      check('StatelessWithReferencedDefaultProps', expectation);
    });

    it('supports spread props', () => {
      check('StatelessWithSpreadDefaultProps', expectation);
    });
  });

  it('should parse functional component component defined as function', () => {
    check('FunctionDeclaration', {
      Jumbotron: {
        prop1: { type: 'string', required: true }
      }
    });
  });

  it('should parse functional component component defined as const', () => {
    check('FunctionalComponentAsConst', {
      Jumbotron: {
        prop1: { type: 'string', required: true }
      }
    });
  });

  it('should parse React.SFC component defined as const', () => {
    check('ReactSFCAsConst', {
      Jumbotron: {
        prop1: { type: 'string', required: true }
      }
    });
  });

  it('should parse functional component component defined as function as default export', () => {
    check('FunctionDeclarationAsDefaultExport', {
      Jumbotron: {
        prop1: { type: 'string', required: true }
      }
    });
  });

  it('should parse functional component component defined as const as default export', () => {
    check(
      'FunctionalComponentAsConstAsDefaultExport',
      {
        // in this case the component name is taken from the file name
        FunctionalComponentAsConstAsDefaultExport: {
          prop1: { type: 'string', required: true }
        }
      },
      true,
      'Jumbotron description'
    );
  });

  it('should parse React.SFC component defined as const as default export', () => {
    check(
      'ReactSFCAsConstAsDefaultExport',
      {
        // in this case the component name is taken from the file name
        ReactSFCAsConstAsDefaultExport: {
          prop1: { type: 'string', required: true }
        }
      },
      true,
      'Jumbotron description'
    );
  });

  it('should parse functional component component defined as const as named export', () => {
    check(
      'FunctionalComponentAsConstAsNamedExport',
      {
        // in this case the component name is taken from the file name
        FunctionalComponentAsConstAsNamedExport: {
          prop1: { type: 'string', required: true }
        }
      },
      true,
      'Jumbotron description'
    );
  });

  it('should parse React.SFC component defined as const as named export', () => {
    check(
      'ReactSFCAsConstAsNamedExport',
      {
        // in this case the component name is taken from the file name
        ReactSFCAsConstAsNamedExport: {
          prop1: { type: 'string', required: true }
        }
      },
      true,
      'Jumbotron description'
    );
  });

  describe('displayName', () => {
    it('should be taken from stateless component `displayName` property (using named export)', () => {
      const [parsed] = parse(fixturePath('StatelessDisplayName'));
      assert.equal(parsed.displayName, 'StatelessDisplayName');
    });

    it('should be taken from stateful component `displayName` property (using named export)', () => {
      const [parsed] = parse(fixturePath('StatefulDisplayName'));
      assert.equal(parsed.displayName, 'StatefulDisplayName');
    });

    it('should be taken from stateless component `displayName` property (using default export)', () => {
      const [parsed] = parse(fixturePath('StatelessDisplayNameDefaultExport'));
      assert.equal(parsed.displayName, 'StatelessDisplayNameDefaultExport');
    });

    it('should be taken from stateful component `displayName` property (using default export)', () => {
      const [parsed] = parse(fixturePath('StatefulDisplayNameDefaultExport'));
      assert.equal(parsed.displayName, 'StatefulDisplayNameDefaultExport');
    });

    it('should be taken from named export when default export is an HOC', () => {
      const [parsed] = parse(fixturePath('StatelessDisplayNameHOC'));
      assert.equal(parsed.displayName, 'StatelessDisplayName');
    });

    it('should be taken from named export when default export is an HOC', () => {
      const [parsed] = parse(fixturePath('StatefulDisplayNameHOC'));
      assert.equal(parsed.displayName, 'StatefulDisplayName');
    });

    it('should be taken from stateless component folder name if file name is "index"', () => {
      const [parsed] = parse(fixturePath('StatelessDisplayNameFolder/index'));
      assert.equal(parsed.displayName, 'StatelessDisplayNameFolder');
    });

    it('should be taken from stateful component folder name if file name is "index"', () => {
      const [parsed] = parse(fixturePath('StatefulDisplayNameFolder/index'));
      assert.equal(parsed.displayName, 'StatefulDisplayNameFolder');
    });
  });

  describe('Parser options', () => {
    describe('Property filtering', () => {
      describe('children', () => {
        it('should ignore property "children" if not explicitly documented', () => {
          check(
            'Column',
            {
              Column: {
                prop1: { type: 'string', required: false },
                prop2: { type: 'number' },
                prop3: { type: '() => void' },
                prop4: { type: '"option1" | "option2" | "option3"' }
              }
            },
            true
          );
        });

        it('should not ignore any property that is documented explicitly', () => {
          check(
            'ColumnWithAnnotatedChildren',
            {
              Column: {
                children: {
                  description: 'children description',
                  required: false,
                  type: 'ReactNode'
                },
                prop1: { type: 'string', required: false },
                prop2: { type: 'number' },
                prop3: { type: '() => void' },
                prop4: { type: '"option1" | "option2" | "option3"' }
              }
            },
            true
          );
        });
      });

      describe('propsFilter method', () => {
        it('should apply filter function and filter components accordingly', () => {
          const propFilter: PropFilter = (prop, component) =>
            prop.name !== 'prop1';
          check(
            'Column',
            {
              Column: {
                prop2: { type: 'number' },
                prop3: { type: '() => void' },
                prop4: { type: '"option1" | "option2" | "option3"' }
              }
            },
            true,
            undefined,
            { propFilter }
          );
        });

        it('should apply filter function and filter components accordingly', () => {
          const propFilter: PropFilter = (prop, component) => {
            if (component.name === 'Column') {
              return prop.name !== 'prop1';
            }
            return true;
          };
          check(
            'Column',
            {
              Column: {
                prop2: { type: 'number' },
                prop3: { type: '() => void' },
                prop4: { type: '"option1" | "option2" | "option3"' }
              }
            },
            true,
            undefined,
            { propFilter }
          );
          check(
            'AppMenu',
            {
              AppMenu: {
                menu: { type: 'any' }
              }
            },
            true,
            undefined,
            { propFilter }
          );
        });
      });

      describe('skipPropsWithName', () => {
        it('should skip a single property in skipPropsWithName', () => {
          const propFilter = { skipPropsWithName: 'prop1' };
          check(
            'Column',
            {
              Column: {
                prop2: { type: 'number' },
                prop3: { type: '() => void' },
                prop4: { type: '"option1" | "option2" | "option3"' }
              }
            },
            true,
            undefined,
            { propFilter }
          );
        });

        it('should skip multiple properties in skipPropsWithName', () => {
          const propFilter = { skipPropsWithName: ['prop1', 'prop2'] };
          check(
            'Column',
            {
              Column: {
                prop3: { type: '() => void' },
                prop4: { type: '"option1" | "option2" | "option3"' }
              }
            },
            true,
            undefined,
            { propFilter }
          );
        });
      });

      describe('skipPropsWithoutDoc', () => {
        it('should skip a properties without documentation', () => {
          const propFilter = { skipPropsWithoutDoc: false };
          check(
            'ColumnWithUndocumentedProps',
            {
              Column: {
                prop1: { type: 'string', required: false },
                prop2: { type: 'number' }
              }
            },
            true,
            undefined,
            { propFilter }
          );
        });
      });
    });
  });

  describe('withCustomConfig', () => {
    it('should accept tsconfigs that typescript accepts', () => {
      assert.ok(
        withCustomConfig(
          // need to navigate to root because tests run on compiled tests
          // and tsc does not include json files
          path.join(__dirname, '../../src/__tests__/data/tsconfig.json'),
          {}
        )
      );
    });
  });
});
