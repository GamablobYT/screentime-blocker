import { requireNativeView } from 'expo';
import * as React from 'react';

import { ScreentimeViewProps } from './Screentime.types';

const NativeView: React.ComponentType<ScreentimeViewProps> =
  requireNativeView('Screentime');

export default function ScreentimeView(props: ScreentimeViewProps) {
  return <NativeView {...props} />;
}
