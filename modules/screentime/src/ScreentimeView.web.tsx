import * as React from 'react';

import { ScreentimeViewProps } from './Screentime.types';

export default function ScreentimeView(props: ScreentimeViewProps) {
  return (
    <div>
      <iframe
        style={{ flex: 1 }}
        src={props.url}
        onLoad={() => props.onLoad({ nativeEvent: { url: props.url } })}
      />
    </div>
  );
}
