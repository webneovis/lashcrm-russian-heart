import { describe, it, expect } from "vitest";
import { formatRemaining } from "./next-client";
describe("formatRemaining", () => {
  it("1 мин", () => expect(formatRemaining(1)).toEqual({ verb: "осталась", text: "1 мин" }));
  it("25 мин", () => expect(formatRemaining(25).text).toBe("25 мин"));
  it("1 час", () => expect(formatRemaining(60).text).toBe("1 час"));
  it("2 часа 15 мин", () => expect(formatRemaining(135).text).toBe("2 часа 15 мин"));
  it("5 часов", () => expect(formatRemaining(300).text).toBe("5 часов"));
});
