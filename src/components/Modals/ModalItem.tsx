import React, {FC} from 'react';
import {TouchableOpacity, View, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import Text from '../Text';

interface ModalItemProps {
    testID?: string;
    activeOpacity?: number;
    style?: StyleProp<ViewStyle>;
    onPress: () => void;
    icon: React.ReactNode;
    text: string;
    info?: React.ReactNode;
    last?: boolean;
    danger?: boolean;
    dark?: boolean;
}

const ModalItem: FC<ModalItemProps> = (props) => {
    return (
        <TouchableOpacity
            testID={props.testID}
            activeOpacity={props.activeOpacity ?? 1}
            style={[s.button, {borderBottomWidth: !props.last ? StyleSheet.hairlineWidth : 0}, props.style]}
            onPress={props.onPress}>
            <View style={{flexDirection: 'row'}}>
                <View style={{width: 40, alignItems: 'center'}}>{props.icon}</View>
                <Text style={[s.text, {color: !props.danger ? (!props.dark ? '#0F0F28' : '#fff') : 'red'}]}>
                    {props.text}
                </Text>
            </View>
            {props.info}
        </TouchableOpacity>
    );
};

const s = StyleSheet.create({
    text: {
        fontSize: 15,
        textAlign: 'center',
        marginLeft: 8,
    },
    button: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'lightgrey',
        padding: 16,
        paddingLeft: 8,
        paddingRight: 20,
        width: w('100%'),
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
});

export default ModalItem;
