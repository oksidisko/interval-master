import { initDB } from './index';

export interface AppSettings {
  defaultRestTitle: string;
}

const SETTINGS_KEY = 'app-settings';

/**
 * Get app settings from IndexedDB
 * Returns default values if not found
 */
export async function getSettings(): Promise<AppSettings> {
  try {
    const db = await initDB();
    const settings = await db.get('settings', SETTINGS_KEY);

    if (settings?.value) {
      return settings.value;
    }

    // Return defaults
    return {
      defaultRestTitle: 'Rest'
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return {
      defaultRestTitle: 'Rest'
    };
  }
}

/**
 * Save app settings to IndexedDB
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    const db = await initDB();
    await db.put('settings', {
      key: SETTINGS_KEY,
      value: settings
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
}

/**
 * Update default rest title
 */
export async function updateDefaultRestTitle(title: string): Promise<void> {
  const settings = await getSettings();
  settings.defaultRestTitle = title;
  await saveSettings(settings);
}
