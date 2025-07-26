// Settings management with localStorage persistence

export interface AppSettings {
  replicateApiKey: string;
  replicateModel: string;
  geminiApiKey: string;
  geminiModel: string;
}

export const defaultSettings: AppSettings = {
  replicateApiKey: 'r8_1IMPNwx80t3o09mSFNgpxVE15CHZnRa3bJQju',
  replicateModel: 'openai/whisper:cdd97b257f93cb89dede1c7584e3f3dfc969571b357dbcee08e793740bedd854',
  geminiApiKey: 'AIzaSyAUHP34aS7UPglJDl64pub4kR7m59IZcTw',
  geminiModel: 'gemini-2.0-flash'
};

const SETTINGS_KEY = 'atlas-ai-settings';

export const loadSettings = (): AppSettings => {
  return defaultSettings;
};

export const saveSettings = (settings: AppSettings): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

export const validateSettings = (settings: AppSettings): string[] => {
  return []; // Always return empty array since keys are hardcoded
};