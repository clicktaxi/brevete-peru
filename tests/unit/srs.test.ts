import { describe, expect, it } from "vitest";
import { dailyPortion, isDue, nextSrs, type QuestionStats } from "@/lib/progress";

const DAY = 86_400_000;
const now = 1_700_000_000_000;

describe("SM-2", () => {
  it("grows intervals 1 → 6 → ease-scaled on correct answers", () => {
    const a = nextSrs(undefined, 5, now);
    expect(a.interval).toBe(1);
    expect(a.due).toBe(now + DAY);
    const b = nextSrs(a, 5, now);
    expect(b.interval).toBe(6);
    const c = nextSrs(b, 5, now);
    expect(c.interval).toBeGreaterThan(6);
    expect(c.ease).toBeGreaterThan(2.5);
  });

  it("resets to one day on a wrong answer and lowers ease", () => {
    const s = nextSrs({ ease: 2.5, interval: 15, due: now, reps: 3 }, 1, now);
    expect(s.interval).toBe(1);
    expect(s.reps).toBe(0);
    expect(s.ease).toBeCloseTo(2.3);
  });

  it("builds the daily portion from due then unseen questions", () => {
    const stats: Record<string, QuestionStats> = {
      "a1-001": { seen: 1, correctCount: 1, wrongCount: 0, streak: 1, srs: { ease: 2.5, interval: 1, due: now - DAY } },
      "a1-002": { seen: 1, correctCount: 1, wrongCount: 0, streak: 1, srs: { ease: 2.5, interval: 6, due: now + DAY } },
      "a1-003": { seen: 1, correctCount: 0, wrongCount: 1, streak: 0, srs: { ease: 2.3, interval: 1, due: now - 2 * DAY } },
    };
    expect(isDue(stats["a1-001"], now)).toBe(true);
    expect(isDue(stats["a1-002"], now)).toBe(false);
    expect(dailyPortion(["a1-001", "a1-002", "a1-003", "a1-004", "a1-005"], stats, 3, now)).toEqual(["a1-003", "a1-001", "a1-004"]);
  });
});
