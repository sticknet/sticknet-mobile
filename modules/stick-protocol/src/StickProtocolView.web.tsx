import * as React from 'react';

import {StickProtocolViewProps} from './StickProtocol.types';

export default function StickProtocolView(props: StickProtocolViewProps) {
    return (
        <div>
            <iframe style={{flex: 1}} src={props.url} onLoad={() => props.onLoad({nativeEvent: {url: props.url}})} />
        </div>
    );
}
