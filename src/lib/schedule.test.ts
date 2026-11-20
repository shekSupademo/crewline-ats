import { describe, expect, it } from "vitest";
import type { Interview } from "../data/types";
import { nextWeekdays, slotsForDay } from "./schedule";

const at = (day: string, time: string) => new Date(`${day}T${time}`);
const interview = (
  start: Date,
  durationMin: number,
  interviewerIds: string[],
): Interview => ({
  id: "i",
  candidateId: "c",
  interviewerIds,
  start: start.toISOString(),
  durationMin,
  kind: "Technical",
  location: "",
});

describe("slotsForDay", () => {
  const day = "2026-12-01";
  const now = at("2026-11-30", "12:00");

  it("offers 30-minute slots from 9:00 that end by 18:00", () => {
    const slots = slotsForDay(day, 60, [], [], now);
    expect(slots[0].time).toBe("09:00");
    expect(slots.at(-1)?.time).toBe("17:00");
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it("blocks slots that overlap a selected interviewer's interview", () => {
    const busy = [interview(at(day, "10:00"), 60, ["m_leo"])];
    const slots = slotsForDay(day, 45, busy, ["m_leo"], now);
    const byTime = Object.fromEntries(slots.map((s) => [s.time, s]));
    expect(byTime["09:00"].available).toBe(true);
    expect(byTime["09:30"]).toMatchObject({
      available: false,
      busy: ["m_leo"],
    });
    expect(byTime["10:30"].available).toBe(false);
    expect(byTime["11:00"].available).toBe(true);
  });

  it("ignores interviews of people who aren't selected", () => {
    const busy = [interview(at(day, "10:00"), 60, ["m_sam"])];
    expect(
      slotsForDay(day, 30, busy, ["m_leo"], now).every((s) => s.available),
    ).toBe(true);
  });

  it("blocks slots in the past", () => {
    const slots = slotsForDay("2026-11-30", 30, [], [], now);
    expect(slots.find((s) => s.time === "11:30")).toMatchObject({
      available: false,
      past: true,
    });
    expect(slots.find((s) => s.time === "12:00")?.available).toBe(true);
  });
});

describe("nextWeekdays", () => {
  it("skips weekends and starts today when today is a weekday", () => {
    expect(nextWeekdays(at("2026-11-27", "10:00"), 3)).toEqual([
      "2026-11-27",
      "2026-11-30",
      "2026-12-01",
    ]);
  });
});
