import React, {PureComponent} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import {TouchableOpacity, StyleSheet, ActivityIndicator, ViewStyle, View} from 'react-native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {colors} from '../../foundations';
import Text from '../Text';
import Icon from '../Icons/Icon';
import {IApplicationState} from '../../types';

interface ButtonOwnProps {
    light?: boolean;
    onPress: () => void;
    text: string;
    width?: number | string;
    border?: boolean;
    color?: string | null;
    marginTop?: number;
    fontSize?: number;
    height?: number;
    style?: ViewStyle;
    textColor?: string | null;
    fullWidth?: boolean;
    testID?: string;
    id?: string;
    icon?: string;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps & ButtonOwnProps;

class Button extends PureComponent<Props> {
    static defaultProps = {
        light: false,
        width: 100,
        height: 48,
        border: false,
        color: null,
        marginTop: 24,
        textColor: null,
    };

    render() {
        const {
            light,
            onPress,
            text,
            width,
            border,
            color,
            marginTop,
            fontSize,
            height,
            style,
            textColor,
            fullWidth,
            testID,
            isLoading,
            icon,
        } = this.props;

        return (
            <TouchableOpacity
                activeOpacity={1}
                onPress={onPress}
                style={[
                    s.container,
                    {
                        backgroundColor: color || (light ? '#fff' : colors.black),
                        width: fullWidth ? w('90%') : (width as number),
                        borderWidth: border ? 1 : 0,
                        marginTop,
                        height,
                    },
                    style,
                ]}
                testID={testID}>
                {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                ) : (
                    <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                        {icon && <Icon name={icon} color="#ffffff" style={{marginRight: 8}} />}
                        <Text
                            testID={`${testID}-text`}
                            style={[
                                s.text,
                                {
                                    color: textColor || (light ? '#6060FF' : '#fff'),
                                    fontSize,
                                    fontWeight: 'bold',
                                },
                            ]}>
                            {text}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    }
}

const s = StyleSheet.create({
    container: {
        borderRadius: 40,
        alignSelf: 'center',
        borderColor: '#6060FF',
        backgroundColor: '#6060FF',
        padding: 0,
        justifyContent: 'center',
    },
    text: {
        textAlign: 'center',
        color: '#fff',
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: ButtonOwnProps) => {
    return {
        isLoading: state.appTemp.buttonIdLoading === ownProps.id,
    };
};

const connector = connect(mapStateToProps);

export default connector(Button);
