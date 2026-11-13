import { describe, expect, it } from "vitest";
import { pagination, paginationSchema } from "./pagination.js";

describe("pagination", () => {
  it("applies safe defaults", () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });
  it("caps the page size", () => {
    expect(() => paginationSchema.parse({ pageSize: 101 })).toThrow();
  });
  it("calculates the database window", () => {
    expect(pagination(3, 25)).toEqual({ skip: 50, take: 25 });
  });
});

