import {requireNativeView} from 'expo';
import * as React from 'react';

import {StickProtocolViewProps} from './StickProtocol.types';

const NativeView: React.ComponentType<StickProtocolViewProps> = requireNativeView('StickProtocol');

export default function StickProtocolView(props: StickProtocolViewProps) {
    return <NativeView {...props} />;
}
