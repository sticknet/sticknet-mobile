import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import React, {FC} from 'react';
import Input from '../Input';

interface InputModalProps {
    visible: boolean;
    cancel: () => void;
    title: string;
    testID?: string;
    placeholder?: string;
    doneText?: string;
    onPress: () => void;
    onChangeText: (text: string) => void;
    defaultValue?: string;
    selection?: {start: number; end?: number};
}

const InputModal: FC<InputModalProps> = ({
    visible,
    cancel,
    title,
    testID,
    placeholder,
    doneText,
    onPress,
    onChangeText,
    defaultValue,
    selection,
}) => {
    return (
        <Modal
            avoidKeyboard
            isVisible={visible}
            useNativeDriver
            hideModalContentWhileAnimating
            backdropOpacity={0.5}
            onBackdropPress={cancel}
            onBackButtonPress={cancel}
            animationIn="fadeIn"
            animationOut="fadeOut">
            <View style={s.modal}>
                <View style={s.headerContainer}>
                    <Text style={s.header}>{title}</Text>
                </View>
                <Input
                    testID={`${testID}-input`}
                    placeholder={placeholder}
                    maxLength={60}
                    width={w('80%')}
                    style={s.input}
                    focus
                    inputStyle={{borderColor: '#0F0F28'}}
                    onChangeText={onChangeText}
                    defaultValue={defaultValue}
                    selection={selection}
                />
                <View style={s.buttonsContainer}>
                    <TouchableOpacity testID={`${testID}-cancel`} style={s.button} onPress={cancel}>
                        <Text style={s.doneText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity testID={`${testID}-done`} style={s.button} onPress={onPress}>
                        <Text style={s.doneText}>{doneText}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    modal: {
        width: w('90%'),
        borderRadius: 20,
        overflow: 'hidden',
        borderColor: '#fff',
        backgroundColor: '#ffffff',
    },
    headerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F0F28',
    },
    header: {
        fontSize: 16,
        fontWeight: '500',
        padding: 8,
        color: '#fff',
    },
    button: {
        justifyContent: 'center',
        width: 100,
        fontSize: 15,
        borderRadius: 40,
        height: 32,
        alignSelf: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        marginBottom: 16,
        borderColor: '#0F0F28',
        marginHorizontal: 8,
    },
    doneText: {
        textAlign: 'center',
        color: '#0F0F28',
        fontSize: 16,
    },
    input: {
        alignSelf: 'center',
        marginTop: 16,
        marginBottom: 16,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
});

export default InputModal;
