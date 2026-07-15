import { clampWatchedSeconds, nextWatchedSecondsFromRemaining } from '../src/components/player/watchProgress';

describe('WatchPlayer timer-backed progress', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('does not increase watched seconds when only wall-clock Date.now advances', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-14T00:00:00.000Z'));

    let trackedWatchedSeconds = 0;
    const targetSeconds = 1800;

    for (let i = 0; i < 30; i += 1) {
      trackedWatchedSeconds = nextWatchedSecondsFromRemaining(targetSeconds - trackedWatchedSeconds, targetSeconds);
    }

    jest.setSystemTime(new Date('2026-07-14T03:00:00.000Z'));

    expect(clampWatchedSeconds(trackedWatchedSeconds, targetSeconds)).toBe(30);
  });

  it('passes only timer-advanced seconds to user_exit after long wall-clock background time', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-14T00:00:00.000Z'));

    let latestProgress = 0;
    const targetSeconds = 600;
    const onProgress = jest.fn((seconds: number) => {
      latestProgress = seconds;
    });
    const onExit = jest.fn();

    for (let i = 0; i < 30; i += 1) {
      const watched = nextWatchedSecondsFromRemaining(targetSeconds - latestProgress, targetSeconds);
      latestProgress = watched;
      onProgress(watched);
    }

    jest.setSystemTime(new Date('2026-07-14T06:00:00.000Z'));
    onExit('user_exit', clampWatchedSeconds(latestProgress, targetSeconds));

    expect(onProgress).toHaveBeenLastCalledWith(30);
    expect(onExit).toHaveBeenCalledWith('user_exit', 30);
  });

  it('uses the same timer-backed seconds for backgrounded and playback_error exits', () => {
    const targetSeconds = 180;
    let trackedWatchedSeconds = 0;

    for (let i = 0; i < 42; i += 1) {
      trackedWatchedSeconds = nextWatchedSecondsFromRemaining(targetSeconds - trackedWatchedSeconds, targetSeconds);
    }

    expect(clampWatchedSeconds(trackedWatchedSeconds, targetSeconds)).toBe(42);
    expect(clampWatchedSeconds(trackedWatchedSeconds, targetSeconds)).toBe(42);
  });

  it('clamps watched seconds to the 0-targetSeconds range', () => {
    expect(clampWatchedSeconds(-1, 180)).toBe(0);
    expect(clampWatchedSeconds(Number.NaN, 180)).toBe(0);
    expect(clampWatchedSeconds(181, 180)).toBe(180);
  });

  it('records targetSeconds for completion and prevents duplicate finalize callbacks', () => {
    const targetSeconds = 180;
    const onComplete = jest.fn();
    const onExit = jest.fn();
    let handled = false;
    const finishOnce = (action: () => void) => {
      if (handled) return;
      handled = true;
      action();
    };

    finishOnce(() => onComplete(targetSeconds));
    finishOnce(() => onExit('user_exit', 179));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(targetSeconds);
    expect(onExit).not.toHaveBeenCalled();
  });
});
