import { registerWebModule, NativeModule } from 'expo';

import { ChangeEventPayload } from './Screentime.types';

type ScreentimeModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
}

class ScreentimeModule extends NativeModule<ScreentimeModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
};

export default registerWebModule(ScreentimeModule, 'ScreentimeModule');
