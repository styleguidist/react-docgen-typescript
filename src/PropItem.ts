export type Props = Record<string, PropItem>;

export interface ParentType {
  name: string;
  fileName: string;
}

export type PropItemType = PropItem['type'];

export interface BooleanPropItem {
  name: string;
  required: boolean;
  type: {
    name: 'bool';
    raw: string;
  };
  description: string;
  defaultValue?: any;
  parent?: ParentType;
}

export interface BooleanLiteralPropItem {
  name: string;
  required: boolean;
  type: {
    name: 'false' | 'true';
    raw: string;
  };
  description: string;
  defaultValue?: any;
  parent?: ParentType;
}

export interface NumericPropItem {
  name: string;
  required: boolean;
  type: {
    name: 'number';
    raw: string;
  };
  description: string;
  defaultValue?: any;
  parent?: ParentType;
}

export interface NumericLiteralPropItem {
  name: string;
  required: boolean;
  type: {
    name: number;
    raw: string;
  };
  description: string;
  defaultValue?: any;
  parent?: ParentType;
}

export interface StringPropItem {
  name: string;
  required: boolean;
  type: {
    name: 'string';
    raw: string;
  };
  description: string;
  defaultValue?: any;
  parent?: ParentType;
}

export interface StringLiteralPropItem {
  name: string;
  required: boolean;
  type: {
    // TODO in a future version of typescript
    // The name of this type can be distinguished from other types,
    // using template literal types.
    // https://github.com/microsoft/TypeScript/pull/40336
    name: string;
    raw: string;
  };
  description: string;
  defaultValue?: any;
  parent?: ParentType;
}

export interface ArrayOfPropItem {
  name: string;
  required: boolean;
  type: {
    name: 'arrayOf';
    /**
     * NOTE: shapes/arrayOfs are by default limited to 8 levels of expansion
     * This is to avoid issues with recursive types, there is likely a
     * better way to handle this.
     *
     * The configuration option to change this is
     * `maxValueFromObjectExtractionDepth`.
     **/
    value?: PropItemType[];
    raw: string;
  };
  description: string;
  defaultValue?: any;
  parent?: ParentType;
}

export interface ShapePropItem {
  name: string;
  required: boolean;
  type: {
    name: 'shape';
    /**
     * NOTE: shapes/arrayOfs are by default limited to 8 levels of expansion
     * This is to avoid issues with recursive types, there is likely a
     * better way to handle this.
     *
     * The configuration option to change this is
     * `maxValueFromObjectExtractionDepth`.
     **/
    value?: Props;
    raw: string;
  };
  description: string;
  defaultValue?: any;
  parent?: ParentType;
}

export interface StringEnumPropItem {
  name: string;
  required: boolean;
  type: {
    name: 'enum';
    membersType: 'string';
    /**
     * - string values are wrapped in quotes (ie. `{ value: '"string"',`)
     */
    value: { value: string; raw: string; type: 'string' }[];
    raw: string;
  };
  description: string;
  defaultValue?: any;
  parent?: ParentType;
}

export interface NumericEnumPropItem {
  name: string;
  required: boolean;
  type: {
    name: 'enum';
    membersType: 'number';
    value: { value: number; raw: string; type: 'number' }[];
    raw: string;
  };
  description: string;
  defaultValue?: any;
  parent?: ParentType;
}
/**
 * highly unlikely this would be intentional
 *
 * result of `propName: undefined[]`
 **/
export interface UndefinedEnumPropItem {
  name: string;
  required: boolean;
  type: {
    name: 'enum';
    membersType: 'undefined';
    value: { value: undefined; raw: string; type: 'undefined' }[];
    raw: string;
  };
  description: string;
  defaultValue?: any;
  parent?: ParentType;
}

export interface HeterogeneousEnumPropItem {
  name: string;
  required: boolean;
  type: {
    name: 'enum';
    membersType: 'heterogeneous';
    /**
     * - string values will be wrapped in quotes (ie. `{ value: '"string"',`)
     * - number values will be numbers (ie. `{ value: 10,`)
     * - boolean values will be a boolean (ie. `{ value: false,`)
     * - undefined values will be undefined (ie. `{ value: undefined,`)
     * - other types are not currently handled, and will result in a UnionPropItem
     */
    value: {
      value: number | string | boolean | undefined;
      raw: string;
      type: 'number' | 'string' | 'boolean' | 'undefined';
    }[];
    raw: string;
  };
  description: string;
  defaultValue?: any;
  parent?: ParentType;
}

export type EnumPropItem =
  | StringEnumPropItem
  | NumericEnumPropItem
  | UndefinedEnumPropItem
  | HeterogeneousEnumPropItem;

export interface UnionPropItem {
  name: string;
  required: boolean;
  type: {
    name: 'union';
    /**
     * - string values will be wrapped in quotes (ie. `{ value: '"string"',`)
     * - number values will be numbers (ie. `{ value: 10,`)
     * - boolean values will be a boolean (ie. `{ value: false,`)
     * - undefined values will be undefined (ie. `{ value: undefined,`)
     * - other types are not currently handled, and will have an empty value
     */
    value: (
      | {
          value: string | number | undefined;
          raw: string;
          type: 'number' | 'string' | 'boolean' | 'undefined' | 'other';
        }
      | {
          // currently not implemented due to recursive type issues
          value?: PropItemType;
          raw: string;
          type: 'other';
        }
    )[];
    raw: string;
  };
  description: string;
  defaultValue?: any;
  parent?: ParentType;
}

// Basic and Literal refers to the types listed in the following
// typescript documentation pages.
// - https://www.typescriptlang.org/docs/handbook/basic-types.html
// - https://www.typescriptlang.org/docs/handbook/literal-types.html
export interface NonBasicOrLiteralPropItem {
  name: string;
  required: boolean;
  type: {
    name: string;
    raw: string;
  };
  description: string;
  defaultValue?: any;
  parent?: ParentType;
}

export interface JSDocTypeTagPropItem {
  name: string;
  required: boolean;
  type: {
    name: string;
    raw: string;
    source: 'JSDoc type tag';
  };
  description: string;
  defaultValue?: any;
  parent?: ParentType;
}

export type PropItem =
  | BooleanPropItem
  | BooleanLiteralPropItem
  | NumericPropItem
  | NumericLiteralPropItem
  | StringPropItem
  | StringLiteralPropItem
  | ArrayOfPropItem
  | ShapePropItem
  | EnumPropItem
  | UnionPropItem
  | NonBasicOrLiteralPropItem
  | JSDocTypeTagPropItem;
