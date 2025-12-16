// Reexport the native module. On web, it will be resolved to ScreentimeModule.web.ts
// and on native platforms to ScreentimeModule.ts
export * from './src/Screentime.types';
export { default as ScreentimeView } from './src/ScreentimeView';
import ScreenTimeModule from './src/ScreentimeModule';

export type UsageRow = {
    packageName: string;
    label: string;
    totalTimeInForeground: number;
}

export const hasUsageAccess = async (): Promise<boolean> => {
    return await ScreenTimeModule.hasUsageAccess();
}

export const openUsageAccessSettings = async (): Promise<boolean> => {
    return await ScreenTimeModule.openUsageAccessSettings();
}

export const getTodayUsage = async (): Promise<UsageRow[]> => {
    return await ScreenTimeModule.getTodayUsage();
}