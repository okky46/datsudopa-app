
type ScreenOrientationModule = {
  OrientationLock: {
    LANDSCAPE: number;
    PORTRAIT_UP: number;
  };
  lockAsync: (orientation: number) => Promise<void>;
  unlockAsync: () => Promise<void>;
};

function loadScreenOrientation(): ScreenOrientationModule | null {
  try {
    return require('expo-screen-orientation') as ScreenOrientationModule;
  } catch {
    return null;
  }
}

export class OrientationService {
  static async lockLandscape(): Promise<void> {
    const orientation = loadScreenOrientation();
    if (!orientation) {
      return;
    }
    await orientation.lockAsync(orientation.OrientationLock.LANDSCAPE);
  }

  static async lockPortrait(): Promise<void> {
    const orientation = loadScreenOrientation();
    if (!orientation) {
      return;
    }
    await orientation.lockAsync(orientation.OrientationLock.PORTRAIT_UP);
  }

  static async unlock(): Promise<void> {
    const orientation = loadScreenOrientation();
    if (!orientation) {
      return;
    }
    await orientation.unlockAsync();
  }
}
