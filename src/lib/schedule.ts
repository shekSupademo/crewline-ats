import { isoDay } from "../data/seed";
import type { Interview } from "../data/types";

export type Slot = {
  time: string;
  available: boolean;
  past: boolean;
  busy: string[];
};

const DAY_START = 9 * 60;
const DAY_END = 18 * 60;
const STEP = 30;

export function slotsForDay(
  day: string,
  durationMin: number,
  interviews: Interview[],
  interviewerIds: string[],
  now: Date,
): Slot[] {
  const slots: Slot[] = [];
  for (let m = DAY_START; m + durationMin <= DAY_END; m += STEP) {
    const time = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    const start = new Date(`${day}T${time}`).getTime();
    const end = start + durationMin * 60000;
    const busy = [
      ...new Set(
        interviews
          .filter((i) => {
            const s = new Date(i.start).getTime();
            return s < end && s + i.durationMin * 60000 > start;
          })
          .flatMap((i) =>
            i.interviewerIds.filter((id) => interviewerIds.includes(id)),
          ),
      ),
    ];
    const past = start < now.getTime();
    slots.push({ time, available: !past && busy.length === 0, past, busy });
  }
  return slots;
}

export function nextWeekdays(from: Date, count: number) {
  const days: string[] = [];
  const d = new Date(from);
  while (days.length < count) {
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(isoDay(d));
    d.setDate(d.getDate() + 1);
  }
  return days;
}
