import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { parseUpload, UploadValidationError } from "./parse-upload";

function createMultipartRequest(
  file?: { name: string; type: string; content: string },
  extras?: Record<string, string>
): NextRequest {
  const formData = new FormData();
  if (file) {
    const blob = new Blob([file.content], { type: file.type });
    formData.append("file", blob, file.name);
  }
  if (extras) {
    for (const [key, value] of Object.entries(extras)) {
      formData.append(key, value);
    }
  }
  return new NextRequest("http://localhost/api/ingestion", {
    method: "POST",
    body: formData,
  });
}

describe("parseUpload", () => {
  it("should parse a valid PDF upload", async () => {
    const req = createMultipartRequest({
      name: "form106.pdf",
      type: "application/pdf",
      content: "fake-pdf-content",
    });

    const result = await parseUpload(req);

    expect(result.fileName).toBe("form106.pdf");
    expect(result.file).toBeInstanceOf(Buffer);
    expect(result.file.length).toBeGreaterThan(0);
    expect(result.wizardState).toBeUndefined();
  });

  it("should parse wizardState JSON when provided", async () => {
    const wizardState = { personalCredits: ["test"] };
    const req = createMultipartRequest(
      {
        name: "form106.pdf",
        type: "application/pdf",
        content: "fake-pdf",
      },
      { wizardState: JSON.stringify(wizardState) }
    );

    const result = await parseUpload(req);
    expect(result.wizardState).toEqual(wizardState);
  });

  it("should ignore malformed wizardState JSON", async () => {
    const req = createMultipartRequest(
      {
        name: "form106.pdf",
        type: "application/pdf",
        content: "fake-pdf",
      },
      { wizardState: "not-valid-json{" }
    );

    const result = await parseUpload(req);
    expect(result.wizardState).toBeUndefined();
  });

  it("should throw MISSING_FILE when no file provided", async () => {
    const req = createMultipartRequest();

    await expect(parseUpload(req)).rejects.toThrow(UploadValidationError);
    await expect(parseUpload(createMultipartRequest())).rejects.toMatchObject({
      code: "MISSING_FILE",
    });
  });

  it("should throw INVALID_FILE_TYPE for non-PDF MIME type", async () => {
    const makeReq = () =>
      createMultipartRequest({
        name: "image.jpg",
        type: "image/jpeg",
        content: "fake-image",
      });

    await expect(parseUpload(makeReq())).rejects.toThrow(UploadValidationError);
    await expect(parseUpload(makeReq())).rejects.toMatchObject({
      code: "INVALID_FILE_TYPE",
    });
  });

  it("should throw FILE_TOO_LARGE for files over 10MB", async () => {
    const largeContent = "x".repeat(11 * 1024 * 1024); // 11MB string
    const req = createMultipartRequest({
      name: "large.pdf",
      type: "application/pdf",
      content: largeContent,
    });

    await expect(parseUpload(req)).rejects.toThrow(UploadValidationError);
    await expect(
      parseUpload(
        createMultipartRequest({
          name: "large.pdf",
          type: "application/pdf",
          content: largeContent,
        })
      )
    ).rejects.toMatchObject({ code: "FILE_TOO_LARGE" });
  });
});
