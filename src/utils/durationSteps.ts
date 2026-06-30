
export const LONG_DURATION_MIN_MINUTES = 1;
export const LONG_DURATION_SHORT_MAX_MINUTES = 30;
export const LONG_DURATION_MAX_MINUTES = 120;
export const LONG_DURATION_DEFAULT_MINUTES = 3;

// 1〜30分区間にスライダー幅の多めを割り当て、短い時間を選びやすくする。
const SHORT_SEGMENT_RATIO = 0.62;

function buildDurationSteps(): number[] {
  const steps: number[] = [];
  for (let minutes = LONG_DURATION_MIN_MINUTES; minutes <= LONG_DURATION_SHORT_MAX_MINUTES; minutes += 1) {
    steps.push(minutes);
  }
  for (let minutes = LONG_DURATION_SHORT_MAX_MINUTES + 5; minutes <= LONG_DURATION_MAX_MINUTES; minutes += 5) {
    steps.push(minutes);
  }
  return steps;
}

export const DURATION_STEPS = buildDurationSteps();

const SHORT_STEP_COUNT = LONG_DURATION_SHORT_MAX_MINUTES;
const LONG_STEP_COUNT = DURATION_STEPS.length - SHORT_STEP_COUNT;

export function snapToDurationStep(minutes: number): number {
  let nearest = DURATION_STEPS[0];
  let minDiff = Math.abs(minutes - nearest);
  for (const step of DURATION_STEPS) {
    const diff = Math.abs(minutes - step);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = step;
    }
  }
  return nearest;
}

export function ratioToMinutes(ratio: number): number {
  const clamped = Math.max(0, Math.min(1, ratio));

  if (clamped <= SHORT_SEGMENT_RATIO) {
    const local = SHORT_STEP_COUNT <= 1 ? 0 : clamped / SHORT_SEGMENT_RATIO;
    const index = Math.round(local * (SHORT_STEP_COUNT - 1));
    return DURATION_STEPS[Math.max(0, Math.min(SHORT_STEP_COUNT - 1, index))];
  }

  const local = (clamped - SHORT_SEGMENT_RATIO) / (1 - SHORT_SEGMENT_RATIO);
  const longIndex = Math.round(local * (LONG_STEP_COUNT - 1));
  const globalIndex = SHORT_STEP_COUNT + Math.max(0, Math.min(LONG_STEP_COUNT - 1, longIndex));
  return DURATION_STEPS[globalIndex];
}

export function minutesToRatio(minutes: number): number {
  const snapped = snapToDurationStep(minutes);
  const index = DURATION_STEPS.indexOf(snapped);
  if (index < 0) {
    return 0;
  }

  if (index < SHORT_STEP_COUNT) {
    if (SHORT_STEP_COUNT <= 1) {
      return 0;
    }
    return (index / (SHORT_STEP_COUNT - 1)) * SHORT_SEGMENT_RATIO;
  }

  const longIndex = index - SHORT_STEP_COUNT;
  if (LONG_STEP_COUNT <= 1) {
    return 1;
  }
  return SHORT_SEGMENT_RATIO + (longIndex / (LONG_STEP_COUNT - 1)) * (1 - SHORT_SEGMENT_RATIO);
}

export function randomDurationMinutes(): number {
  return DURATION_STEPS[Math.floor(Math.random() * DURATION_STEPS.length)];
}

export function formatDurationMinutes(minutes: number): string {
  return `${minutes}分`;
}
