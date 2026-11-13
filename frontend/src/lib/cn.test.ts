import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("merges conflicting Tailwind utility classes", () => {
    expect(cn("px-2 text-sm", false, "px-4")).toContain("px-4");
    expect(cn("px-2 text-sm", false, "px-4")).not.toContain("px-2");
  });
});
