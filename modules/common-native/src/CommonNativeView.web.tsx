import * as React from 'react';

import {CommonNativeViewProps} from './CommonNative.types';

export default function CommonNativeView(props: CommonNativeViewProps) {
    return (
        <div>
            <iframe style={{flex: 1}} src={props.url} onLoad={() => props.onLoad({nativeEvent: {url: props.url}})} />
        </div>
    );
}
