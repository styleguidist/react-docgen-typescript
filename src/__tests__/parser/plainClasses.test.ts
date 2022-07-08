import { string } from "prop-types";
import { describe, expect, it } from "vitest";
import { parse } from "../../parser";
import { fixturePath } from "../testUtils";

describe.only("parser > integration tests for plain classes", () => {
  it.only("parses a plain class", () => {
    const result = parse(fixturePath("plain/class"));

    expect(result).toEqual([
      {
        displayName: "class",
        description: "Calculator!",
        filePath:
          "/Users/johncollett/src/github.com/JaKXz/react-docgen-typescript/src/__tests__/data/plain/class.tsx",
        methods: [
          {
            description: "Add two numbers",
            docblock: `Add two numbers
@aCustomTag
@param a
@param b`,
            name: "add",
            modifiers: [],
            params: [
              {
                description: null,
                name: "a",
                type: {
                  name: "number",
                },
              },
              {
                description: null,
                name: "b",
                type: {
                  name: "number",
                },
              },
            ],
            returns: null,
          },
          {
            description: "Subtract two numbers",
            docblock: `Subtract two numbers
@someCoolTag
@param a
@param b`,
            name: "sub",
            modifiers: [],
            params: [
              {
                description: null,
                name: "a",
                type: {
                  name: "number",
                },
              },
              {
                description: null,
                name: "b",
                type: {
                  name: "number",
                },
              },
            ],
            returns: null,
          },
        ],
        props: {},
        tags: {},
      },
    ]);
  });
});
