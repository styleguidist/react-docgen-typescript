import { assert, expect } from 'chai';
import { buildFilter } from '../buildFilter';
import { ParserOptions, PropItem, Props } from '../parser';

function createProp(
  name: string,
  required: boolean = false,
  defaultValue?: any,
  description: string = '',
  type = { name: 'string' }
): PropItem {
  return {
    defaultValue,
    description,
    name,
    required,
    type
  };
}

describe('buildFilter', () => {
  describe('default behaviour', () => {
    it('should skip "children" property if no description is set', () => {
      const prop1 = createProp('prop1', false, undefined, 'prop1 description');
      const prop2 = createProp('prop2', false, undefined, 'prop2 description');
      const children = createProp('children', false, undefined, '');
      const opts: ParserOptions = {};
      const filterFn = buildFilter(opts);
      expect(
        [prop1, prop2, children].filter(prop =>
          filterFn(prop, { name: prop.name })
        )
      ).to.eql([prop1, prop2]);
    });
    it('should not skip "children" property if description is set', () => {
      const prop1 = createProp('prop1', false, undefined, 'prop1 description');
      const prop2 = createProp('prop2', false, undefined, 'prop2 description');
      const children = createProp(
        'children',
        false,
        undefined,
        'children description'
      );
      const opts: ParserOptions = {};
      const filterFn = buildFilter(opts);
      expect(
        [prop1, prop2, children].filter(prop =>
          filterFn(prop, { name: prop.name })
        )
      ).to.eql([prop1, prop2, children]);
    });
  });

  describe('static prop filter', () => {
    describe('skipPropsWithName', () => {
      it('should skip single prop by name', () => {
        const prop1 = createProp(
          'prop1',
          false,
          undefined,
          'prop1 description'
        );
        const prop2 = createProp(
          'prop2',
          false,
          undefined,
          'prop2 description'
        );
        const opts: ParserOptions = {
          propFilter: { skipPropsWithName: 'prop1' }
        };
        const filterFn = buildFilter(opts);
        expect(
          [prop1, prop2].filter(prop => filterFn(prop, { name: prop.name }))
        ).to.eql([prop2]);
      });
      it('should skip multiple props by name', () => {
        const prop1 = createProp(
          'prop1',
          false,
          undefined,
          'prop1 description'
        );
        const prop2 = createProp(
          'prop2',
          false,
          undefined,
          'prop2 description'
        );
        const prop3 = createProp(
          'prop3',
          false,
          undefined,
          'prop3 description'
        );
        const opts: ParserOptions = {
          propFilter: { skipPropsWithName: ['prop1', 'prop3'] }
        };
        const filterFn = buildFilter(opts);
        expect(
          [prop1, prop2, prop3].filter(prop =>
            filterFn(prop, { name: prop.name })
          )
        ).to.eql([prop2]);
      });
    });

    describe('skipPropsWithoutDoc', () => {
      it('should skip children props with no documentation', () => {
        const prop1 = createProp(
          'prop1',
          false,
          undefined,
          'prop1 description'
        );
        const prop2 = createProp('prop2', false, undefined, '');
        const opts: ParserOptions = {
          propFilter: { skipPropsWithoutDoc: true }
        };
        const filterFn = buildFilter(opts);
        expect(
          [prop1, prop2].filter(prop => filterFn(prop, { name: prop.name }))
        ).to.eql([prop1]);
      });
    });
  });

  describe('dynamic prop filter', () => {
    it('should skip props based on dynamic filter rule', () => {
      const prop1 = createProp('foo', false, undefined, 'foo description');
      const prop2 = createProp('bar', false, undefined, 'bar description');
      const prop3 = createProp(
        'foobar',
        false,
        undefined,
        'foobar description'
      );
      const opts: ParserOptions = {
        propFilter: (prop, component) => prop.name.indexOf('foo') === -1
      };
      const filterFn = buildFilter(opts);
      expect(
        [prop1, prop2, prop3].filter(prop =>
          filterFn(prop, { name: prop.name })
        )
      ).to.eql([prop2]);
    });

    it('should get be possible to filter by component name', () => {
      const prop1 = createProp('foo', false, undefined, 'foo description');
      const prop2 = createProp('bar', false, undefined, 'bar description');
      const prop3 = createProp(
        'foobar',
        false,
        undefined,
        'foobar description'
      );
      const opts: ParserOptions = {
        propFilter: (prop, component) => component.name.indexOf('BAR') === -1
      };
      const filterFn = buildFilter(opts);
      expect(
        [prop1, prop2, prop3].filter(prop =>
          filterFn(prop, { name: prop.name.toUpperCase() })
        )
      ).to.eql([prop1]);
    });
  });
});
