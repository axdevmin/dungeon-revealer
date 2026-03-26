import {
  getMediaTypeFromExtension,
  validateMediaTypeExtension,
  isValidVideoUrl,
} from "./media-types";

describe("media-types", () => {
  describe("getMediaTypeFromExtension", () => {
    it("should detect image types", () => {
      expect(getMediaTypeFromExtension("png")).toBe("image");
      expect(getMediaTypeFromExtension("jpg")).toBe("image");
      expect(getMediaTypeFromExtension("jpeg")).toBe("image");
      expect(getMediaTypeFromExtension("webp")).toBe("image");
    });

    it("should detect gif type", () => {
      expect(getMediaTypeFromExtension("gif")).toBe("gif");
    });

    it("should detect video types", () => {
      expect(getMediaTypeFromExtension("mp4")).toBe("video");
      expect(getMediaTypeFromExtension("webm")).toBe("video");
      expect(getMediaTypeFromExtension("ogg")).toBe("video");
      expect(getMediaTypeFromExtension("mov")).toBe("video");
    });

    it("should be case-insensitive", () => {
      expect(getMediaTypeFromExtension("PNG")).toBe("image");
      expect(getMediaTypeFromExtension("GIF")).toBe("gif");
      expect(getMediaTypeFromExtension("MP4")).toBe("video");
    });

    it("should return null for unknown types", () => {
      expect(getMediaTypeFromExtension("xyz")).toBe(null);
    });
  });

  describe("validateMediaTypeExtension", () => {
    it("should validate image extensions", () => {
      expect(validateMediaTypeExtension("image", "png")).toBe(true);
      expect(validateMediaTypeExtension("image", "jpg")).toBe(true);
      expect(validateMediaTypeExtension("image", "gif")).toBe(false);
    });

    it("should validate gif extensions", () => {
      expect(validateMediaTypeExtension("gif", "gif")).toBe(true);
      expect(validateMediaTypeExtension("gif", "png")).toBe(false);
    });

    it("should validate video extensions", () => {
      expect(validateMediaTypeExtension("video", "mp4")).toBe(true);
      expect(validateMediaTypeExtension("video", "webm")).toBe(true);
      expect(validateMediaTypeExtension("video", "png")).toBe(false);
    });

    it("should allow video-url with any extension", () => {
      expect(validateMediaTypeExtension("video-url", "mp4")).toBe(true);
      expect(validateMediaTypeExtension("video-url", "png")).toBe(true);
      expect(validateMediaTypeExtension("video-url", "xyz")).toBe(true);
    });
  });

  describe("isValidVideoUrl", () => {
    it("should validate HTTP URLs", () => {
      expect(isValidVideoUrl("http://example.com/video.mp4")).toBe(true);
      expect(isValidVideoUrl("https://youtube.com/watch?v=xyz")).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(isValidVideoUrl("not a url")).toBe(false);
      expect(isValidVideoUrl("ftp://example.com")).toBe(false);
    });
  });
});
