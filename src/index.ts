export {
  parse,
  Parser,
  withCompilerOptions,
  withCustomConfig,
  withDefaultConfig,
} from "./parser";
export { defaultCompilerOptions } from "./parser/utilities";

export type { ParserOptions } from "./parser";

export type {
  FileParser,
  PropItem,
  PropItemType,
  Props,
  ComponentDoc,
} from "./parser/types";
