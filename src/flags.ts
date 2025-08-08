type FeatureFlags = {
  hapticsEnabled: boolean;
  debug: boolean;
};

const STORAGE_KEY = 'vibe.flags';

const defaultFlags: FeatureFlags = {
  hapticsEnabled: true,
  debug: false,
};

function safeParse(json: string | null): Partial<FeatureFlags> {
  if (!json) return {};
  try {
    return JSON.parse(json) as Partial<FeatureFlags>;
  } catch {
    return {};
  }
}

function loadFlags(): FeatureFlags {
  if (typeof window === 'undefined') return { ...defaultFlags };
  const stored = safeParse(localStorage.getItem(STORAGE_KEY));
  return { ...defaultFlags, ...stored };
}

let flags: FeatureFlags = loadFlags();

function persist() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
  } catch {
    // ignore
  }
}

export function getFlag<K extends keyof FeatureFlags>(key: K): FeatureFlags[K] {
  return flags[key];
}

export function setFlag<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]): void {
  flags = { ...flags, [key]: value } as FeatureFlags;
  persist();
}

export function getAllFlags(): FeatureFlags {
  return { ...flags };
} 