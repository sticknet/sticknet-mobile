import React, {Component} from 'react';
import {Text, View, TouchableOpacity, Platform, StyleSheet} from 'react-native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import CalendarIcon from '@sticknet/react-native-vector-icons/FontAwesome';
import CustomModal from 'react-native-modal';
import DateTimePicker from '@react-native-community/datetimepicker';
import {colors} from '../foundations';

interface DatePickerProps {
    date?: Date;
    birthDate?: boolean;
    dateString?: string;
    onDateChange: (event: any, date?: Date) => void;
    row?: boolean;
    style?: object;
}

interface DatePickerState {
    today: Date;
    modalVisible: boolean;
}

class DatePicker extends Component<DatePickerProps, DatePickerState> {
    static defaultProps = {
        row: true,
        birthDate: false,
    };

    constructor(props: DatePickerProps) {
        super(props);
        const date = new Date();
        this.state = {
            today: date,
            modalVisible: false,
        };
    }

    renderDateModal() {
        if (Platform.OS === 'ios')
            return (
                <CustomModal
                    isVisible={this.state.modalVisible}
                    useNativeDriver
                    hideModalContentWhileAnimating
                    onBackdropPress={() => this.setState({modalVisible: false})}
                    onBackButtonPress={() => this.setState({modalVisible: false})}>
                    <View style={s.dateModal}>
                        <DateTimePicker
                            value={this.props.date || new Date(2013, 0, 1)}
                            mode="date"
                            maximumDate={!this.props.birthDate ? this.state.today : new Date(2013, 11, 31)}
                            onChange={this.props.onDateChange}
                            display="spinner"
                        />
                        <View style={s.button}>
                            <Text
                                style={[s.dateModalText, {color: '#6060FF'}]}
                                onPress={() => this.setState({modalVisible: false})}>
                                Ok
                            </Text>
                        </View>
                    </View>
                </CustomModal>
            );
        if (this.state.modalVisible)
            return (
                <DateTimePicker
                    style={s.dateModal}
                    value={this.props.date || new Date()}
                    mode="date"
                    maximumDate={this.state.today}
                    onChange={(e, date) => {
                        this.setState({modalVisible: false});
                        this.props.onDateChange(e, date);
                    }}
                    display="spinner"
                    dateFormat="day month year"
                />
            );
        return null;
    }

    render() {
        const {row, style, birthDate, dateString} = this.props;
        return (
            <View style={style}>
                <TouchableOpacity
                    testID="date-picker"
                    onPress={() => this.setState({modalVisible: true})}
                    style={[s.dateContainer, {flexDirection: row ? 'row' : 'column'}]}
                    activeOpacity={1}>
                    <Text style={row ? s.rowDateIcon : s.colDateIcon}>
                        {!birthDate && <CalendarIcon name="calendar-o" size={32} color="#6060FF" />}
                        <Text style={s.dateText}>{row ? '' : !birthDate ? '  Date' : 'Birth Day'}</Text>
                    </Text>
                    <View style={[s.dateTextContainer, {width: row ? w('80%') : w('90%')}]}>
                        <Text style={[s.date, {textAlign: dateString ? 'center' : 'left'}]}>
                            {dateString || 'Add your birthday'}
                        </Text>
                    </View>
                </TouchableOpacity>
                {this.renderDateModal()}
            </View>
        );
    }
}

const s = StyleSheet.create({
    date: {
        textAlign: 'center',
        color: 'silver',
    },
    dateTextContainer: {
        padding: 12,
        width: w('80%'),
        height: 44,
        borderColor: colors.black,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 40,
        justifyContent: 'center',
    },
    dateText: {
        fontSize: 16,
        color: '#6060FF',
    },
    rowDateIcon: {
        left: -10,
        top: 8,
    },
    colDateIcon: {
        left: 8,
        marginBottom: 8,
    },
    dateContainer: {
        width: w('100%'),
        justifyContent: 'center',
    },
    dateModal: {
        backgroundColor: '#fff',
        borderRadius: 20,
    },
    button: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    dateModalText: {
        fontSize: 18,
        padding: 20,
        fontWeight: '500',
        color: '#6060FF',
    },
});

export default DatePicker;
