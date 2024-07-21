import React, {Component, createRef} from 'react';
import {Text, View, TextInput, StyleSheet, Platform, TextInputProps, ViewStyle} from 'react-native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {colors} from '../foundations';

interface InputProps extends TextInputProps {
    focus?: boolean;
    multiHeight?: number;
    width?: number;
    style?: ViewStyle;
    color?: string;
    password?: boolean;
    label?: string;
    testID?: string;
    inputStyle?: ViewStyle;
    multiline?: boolean;
    maxLength?: number;
    onSubmitEditing?: () => void;
    onChange?: () => void;
}

class Input extends Component<InputProps> {
    static defaultProps = {
        multiline: false,
        multiHeight: 96,
        width: w('90%'),
        style: () => {},
        focus: false,
        color: colors.primary,
        password: false,
        maxLength: 1000,
        onSubmitEditing: () => {},
        onChange: () => {},
    };

    inputRef: React.RefObject<TextInput>;

    constructor(props: InputProps) {
        super(props);
        this.inputRef = createRef<TextInput>();
    }

    componentDidMount() {
        if (this.props.focus && Platform.OS === 'android') {
            this.inputRef.current?.blur();
            setTimeout(() => this.inputRef.current?.focus(), 300);
        }
    }

    render() {
        const {
            width,
            style,
            maxLength,
            color,
            password,
            returnKeyType,
            onSubmitEditing,
            onFocus,
            onBlur,
            onChange,
            label,
            testID,
            inputStyle,
            placeholder,
            onChangeText,
            value,
            defaultValue,
            multiline,
            selection,
        } = this.props;

        const secondStyle = !multiline
            ? {
                  height: 44,
                  borderRadius: 40,
              }
            : {
                  height: this.props.multiHeight,
                  borderRadius: 20,
                  paddingTop: 12,
                  paddingBottom: 12,
              };

        const backgroundColor = '#fff';
        const textColor = '#0F0F28';
        const borderColor = colors.black;
        return (
            <View style={[{marginBottom: 0}, style]}>
                {label && <Text style={[s.label, {color}]}>{label}</Text>}
                <TextInput
                    ref={this.inputRef}
                    style={[s.input, secondStyle, {width, color: textColor, backgroundColor, borderColor}, inputStyle]}
                    placeholder={placeholder}
                    onChangeText={onChangeText}
                    onChange={onChange}
                    secureTextEntry={password}
                    selectionColor={colors.primary}
                    autoFocus={this.props.focus && Platform.OS === 'ios'}
                    value={value}
                    defaultValue={defaultValue}
                    multiline={multiline}
                    selection={selection}
                    maxLength={maxLength}
                    returnKeyType={returnKeyType}
                    onSubmitEditing={onSubmitEditing}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    testID={testID}
                />
            </View>
        );
    }
}

const s = StyleSheet.create({
    label: {
        fontSize: 17,
        marginBottom: 8,
        marginLeft: 12,
    },
    input: {
        fontSize: 15,
        backgroundColor: '#fff',
        borderWidth: StyleSheet.hairlineWidth,
        textAlignVertical: 'top',
        paddingLeft: 12,
        paddingRight: 12,
    },
});
export default Input;
