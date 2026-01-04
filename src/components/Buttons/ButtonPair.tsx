import React, {FC} from 'react';
import {Text, TouchableOpacity, View, StyleSheet, ViewStyle} from 'react-native';

interface ButtonPairProps {
    parentTestID?: string;
    decline: () => void;
    accept: () => void;
    declineText?: string;
    acceptText?: string;
    style?: ViewStyle;
}

const ButtonPair: FC<ButtonPairProps> = (props) => {
    return (
        <View style={s.buttons}>
            <TouchableOpacity
                testID={`${props.parentTestID}-decline`}
                onPress={props.decline}
                style={[s.button, s.decline, props.style]}
            >
                <Text style={[s.buttonText, {color: 'red'}]}>{props.declineText || 'Decline'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                testID={`${props.parentTestID}-stick-in`}
                onPress={props.accept}
                style={[s.button, s.accept, props.style]}
            >
                <Text style={[s.buttonText, {color: '#6060FF'}]}>{props.acceptText || 'Accept'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const s = StyleSheet.create({
    button: {
        paddingTop: 4,
        paddingBottom: 4,
        justifyContent: 'center',
        width: 100,
        fontSize: 16,
        borderRadius: 40,
        alignSelf: 'center',
    },
    buttonText: {
        textAlign: 'center',
        fontSize: 16,
    },
    accept: {
        marginLeft: 40,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#6060FF',
    },
    decline: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'red',
    },
    buttons: {
        flexDirection: 'row',
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 12,
    },
});

export default ButtonPair;
