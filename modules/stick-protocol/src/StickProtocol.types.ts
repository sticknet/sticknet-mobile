import type {StyleProp, ViewStyle} from 'react-native';

export type OnLoadEventPayload = {
    url: string;
};

export type StickProtocolModuleEvents = {
    KeysProgress: (keysEvent: {progress: number; total: number}) => void;
};

export type ChangeEventPayload = {
    value: string;
};

export type StickProtocolViewProps = {
    url: string;
    onLoad: (event: {nativeEvent: OnLoadEventPayload}) => void;
    style?: StyleProp<ViewStyle>;
};
