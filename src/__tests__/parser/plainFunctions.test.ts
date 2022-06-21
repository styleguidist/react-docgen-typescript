import { describe, expect, it } from "vitest";
import { parse } from "../../parser";
import { check, fixturePath } from "../testUtils";

describe("parser > plain functions integration tests", () => {
  it("parses plain function", () => {
    const filePath = fixturePath("plain/function");

    const result = parse(filePath);

    expect(result).toEqual([
      {
        displayName: "add",
        params: [
          {
            description: "the magical first number",
            name: "a",
            type: "number",
          },
          {
            description: "boring second number",
            name: "b",
            type: "number",
          },
        ],
        description: "get the sum of 2 numbers",
        returns: "string",
        tags: {
          param: "a the magical first number\nb boring second number",
        },
        methods: [],
        props: {},
        filePath,
      },
    ]);
  });

  it("parses multiple plain functions but ignores those without descriptions (for backwards compatibility)", () => {
    const filePath = fixturePath("plain/functions");

    const result = parse(filePath);

    expect(result).toEqual([
      {
        displayName: "add",
        params: [
          {
            description: "the magical first number",
            name: "a",
            type: "number",
          },
          {
            description: "boring second number",
            name: "b",
            type: "number",
          },
        ],
        description: "get the sum of 2 numbers",
        returns: "string",
        tags: {
          param: "a the magical first number\nb boring second number",
        },
        methods: [],
        props: {},
        filePath,
      },
    ]);
  });

  it("parses plain function with rest parameter", () => {
    const filePath = fixturePath("plain/functionWithRestParam");

    const result = parse(filePath);

    expect(result).toEqual([
      {
        displayName: "sum",
        params: [{ name: "numbers", type: "number[]", description: "" }],
        filePath,
        methods: [],
        tags: {
          param: "numbers",
        },
        props: {},
        returns: "number",
        description: "Gets the sum of all numbers passed in",
      },
    ]);
  });

  it("should parse functional component with spread props", () => {
    check("FunctionalComponentWithSpreadProps", {
      Jumbotron: {
        prop1: { type: "string", required: true },
      },
    });
  });
});
