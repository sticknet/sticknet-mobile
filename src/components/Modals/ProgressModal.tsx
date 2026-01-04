import React, {Component} from 'react';
import Modal from 'react-native-modal';
import {NativeEventEmitter, NativeModules, Platform, Text, View, StyleSheet} from 'react-native';
import * as Progress from 'react-native-progress';
import FontistoIcon from '@expo/vector-icons/Fontisto';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import StickProtocol from '@/modules/stick-protocol';
interface ProgressModalProps {
    isVisible: boolean;
    text: string;
}

interface ProgressModalState {
    keysEvent: {progress: number; total: number};
}

class ProgressModal extends Component<ProgressModalProps, ProgressModalState> {
    eventListener: any;

    constructor(props: ProgressModalProps) {
        super(props);
        this.state = {
            keysEvent: {progress: 0, total: 1},
        };
    }

    componentDidMount() {
        this.eventListener = StickProtocol.addListener(
            'KeysProgress',
            (keysEvent: {progress: number; total: number}) => {
                this.setState({keysEvent});
            },
        );
    }

    componentWillUnmount() {
        if (this.eventListener) {
            this.eventListener.remove();
        }
    }

    render() {
        const {keysEvent} = this.state;
        const {isVisible, text} = this.props;
        return (
            <Modal isVisible={isVisible} useNativeDriver hideModalContentWhileAnimating>
                <View style={s.modal}>
                    <Text style={s.text}>
                        <FontistoIcon name="locked" size={16} color="#000" /> {text}
                    </Text>
                    <Progress.Bar
                        height={4}
                        width={w('80%')}
                        color="#6060FF"
                        borderColor="#fff"
                        unfilledColor="lightgrey"
                        progress={keysEvent.progress / keysEvent.total}
                        style={{marginTop: 24}}
                    />
                </View>
            </Modal>
        );
    }
}

const s = StyleSheet.create({
    modal: {
        width: w('90%'),
        backgroundColor: 'white',
        borderRadius: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 20,
    },
    text: {
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ProgressModal;
