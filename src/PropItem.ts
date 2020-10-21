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
    name: 'boolean';
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

export interface ShapePropItem {
  name: string;
  required: boolean;
  type: {
    name: 'shape';
    /**
     * NOTE: shapes are by default limited to 5 levels of expansion
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

export interface EnumPropItem {
  name: string;
  required: boolean;
  type: {
    name: 'enum';
    /**
     * - string values will be wrapped in quotes (ie. `{ value: '"string"',`)
     * - number values will be numbers (ie. `{ value: 10,`)
     * - other primitive values will strings without quotes (ie. `{ value: boolean,`)
     * - other types are not currently handled, and will be the type string (ie. `{ value: '{foo: boolean}',`)
     */
    value: { value: string | number; raw: string }[];
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
  | ShapePropItem
  | EnumPropItem
  | NonBasicOrLiteralPropItem
  | JSDocTypeTagPropItem;
