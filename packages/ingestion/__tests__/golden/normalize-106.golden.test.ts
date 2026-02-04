import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { ingest106Stub } from "../../src/pipelines/ingest-106";

describe("normalize-106 golden tests", () => {
  it("should produce deterministic output matching expected fixture", () => {
    const result = ingest106Stub();

    expect(result.success).toBe(true);
    if (!result.success) return;

    const fixturePath = path.resolve(
      __dirname,
      "../../../../fixtures/106/normalized/stub.expected.json"
    );
    const expected = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));

    expect(result.data).toEqual(expected);
  });

  it("should be deterministic across multiple runs", () => {
    const result1 = ingest106Stub();
    const result2 = ingest106Stub();

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);

    if (result1.success && result2.success) {
      expect(result1.data).toEqual(result2.data);
      expect(result1.parserVersion).toEqual(result2.parserVersion);
    }
  });
});
