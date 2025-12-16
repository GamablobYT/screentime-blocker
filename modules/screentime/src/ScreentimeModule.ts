import { NativeModule, requireNativeModule } from 'expo';

import { ScreentimeModuleEvents } from './Screentime.types';

declare class ScreentimeModule extends NativeModule<ScreentimeModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ScreentimeModule>('Screentime');
