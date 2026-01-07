import type {StyleProp, ViewStyle} from 'react-native';

export type OnLoadEventPayload = {
    url: string;
};

export type CommonNativeModuleEvents = {
    onChange: (params: ChangeEventPayload) => void;
};

export type ChangeEventPayload = {
    value: string;
};

export type CommonNativeViewProps = {
    url: string;
    onLoad: (event: {nativeEvent: OnLoadEventPayload}) => void;
    style?: StyleProp<ViewStyle>;
};
