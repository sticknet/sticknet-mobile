import React, {Component} from 'react';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {Text, TouchableOpacity, View, Alert, StyleSheet} from 'react-native';
import Icon from '@expo/vector-icons/Ionicons';
import Button from '@/src/components/Buttons/Button';
import BottomModal from './BottomModal';

interface ReportModalProps {
    isVisible: boolean;
    hideModal: () => void;
    reportUser: (reason: string) => void;
    type: 'user' | 'content';
}

interface ReportModalState {
    reason: 'A' | 'B' | 'C' | 'Z' | null;
}

class ReportModal extends Component<ReportModalProps, ReportModalState> {
    state: ReportModalState = {
        reason: null,
    };

    report = () => {
        if (!this.state.reason) {
            Alert.alert('No reason reason', 'Please select a reason why you are reporting this user.');
        } else {
            this.props.hideModal();
            setTimeout(() => {
                this.props.reportUser(this.state.reason!);
            }, 300);
        }
    };

    render() {
        const {reason} = this.state;
        const {type} = this.props;
        return (
            <BottomModal isVisible={this.props.isVisible} hideModal={this.props.hideModal}>
                <View style={s.headerContainer}>
                    <Text style={s.header}>Report</Text>
                </View>
                <View style={s.view}>
                    <Text style={s.title}>Select a reason why you are reporting this {type}</Text>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={s.itemContainer}
                        onPress={() => this.setState({reason: 'A'})}
                    >
                        <Text style={s.item}>Fake account</Text>
                        <Icon
                            name={`ios-radio-button-${reason === 'A' ? 'on' : 'off'}`}
                            size={20}
                            color={reason === 'A' ? '#6060FF' : 'lightgrey'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={s.itemContainer}
                        onPress={() => this.setState({reason: 'B'})}
                    >
                        <Text style={s.item}>
                            {type === 'user' ? 'Posting inappropriate content' : 'Inappropriate content'}
                        </Text>
                        <Icon
                            name={`ios-radio-button-${reason === 'B' ? 'on' : 'off'}`}
                            size={20}
                            color={reason === 'B' ? '#6060FF' : 'lightgrey'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={s.itemContainer}
                        onPress={() => this.setState({reason: 'C'})}
                    >
                        <Text style={s.item}>
                            {type === 'user' ? 'Harassment and bullying' : 'Contains harassment and bullying'}
                        </Text>
                        <Icon
                            name={`ios-radio-button-${reason === 'C' ? 'on' : 'off'}`}
                            size={20}
                            color={reason === 'C' ? '#6060FF' : 'lightgrey'}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={s.itemContainer}
                        onPress={() => this.setState({reason: 'Z'})}
                    >
                        <Text style={s.item}>Something else</Text>
                        <Icon
                            name={`ios-radio-button-${reason === 'Z' ? 'on' : 'off'}`}
                            size={20}
                            color={reason === 'Z' ? '#6060FF' : 'lightgrey'}
                        />
                    </TouchableOpacity>
                </View>
                <Button
                    text="Submit Report"
                    fontSize={17}
                    width={340}
                    height={32}
                    style={{marginBottom: 16}}
                    onPress={this.report}
                />
            </BottomModal>
        );
    }
}

const s = StyleSheet.create({
    headerContainer: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: 'lightgrey',
        width: w('100%'),
    },
    header: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
        marginTop: 8,
        marginBottom: 8,
    },
    view: {
        paddingLeft: 20,
        paddingRight: 20,
    },
    item: {},
    itemContainer: {
        flexDirection: 'row',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: 'lightgrey',
        paddingTop: 8,
        paddingBottom: 8,
        justifyContent: 'space-between',
        width: 340,
    },
});

export default ReportModal;
