import * as ts from "typescript";
import { assert, describe, it } from "vitest";
import { getDefaultExportForFile } from "../../parser/utilities";

describe("getDefaultExportForFile", () => {
  it("should filter out forbidden symbols", () => {
    const result = getDefaultExportForFile({
      fileName: "a-b",
    } as ts.SourceFile);

    assert.equal(result, "ab");
  });

  it("should remove leading non-letters", () => {
    const result = getDefaultExportForFile({
      fileName: "---123aba",
    } as ts.SourceFile);

    assert.equal(result, "aba");
  });

  it("should preserve numbers in the middle", () => {
    const result = getDefaultExportForFile({
      fileName: "1Body2Text3",
    } as ts.SourceFile);

    assert.equal(result, "Body2Text3");
  });

  it("should not return empty string", () => {
    const result = getDefaultExportForFile({
      fileName: "---123",
    } as ts.SourceFile);

    assert.equal(result.length > 0, true);
  });
});
