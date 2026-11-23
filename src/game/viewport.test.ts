import { describe, expect, it } from "vitest";
import { courtyardZoom } from "./viewport";

describe("courtyard framing", () => {
  it("shows the full scene height on an upright phone without empty bars", () => {
    const zoom = courtyardZoom(411, 731, 1672, 941);
    expect(941 * zoom).toBeCloseTo(731);
    expect(1672 * zoom).toBeGreaterThan(411);
  });
  it("covers a landscape phone", () => {
    const zoom = courtyardZoom(731, 411, 1672, 941);
    expect(1672 * zoom).toBeGreaterThanOrEqual(731);
    expect(941 * zoom).toBeGreaterThanOrEqual(411);
  });
});