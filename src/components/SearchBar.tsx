import React, {PureComponent} from 'react';
import {StyleProp, StyleSheet, TextInput, TextInputProps, TouchableOpacity, View, ViewStyle} from 'react-native';
import IoIcon from '@sticknet/react-native-vector-icons/Ionicons';
import CancelIcon from '@sticknet/react-native-vector-icons/MaterialIcons';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {colors} from '@/src/foundations';

interface SearchBarProps extends TextInputProps {
    style?: StyleProp<ViewStyle>;
    noIcon?: boolean;
    input: string;
    onChangeText: (text: string) => void;
    cancelSearch: () => void;
    onSubmit?: (param?: any) => void;
    onPress?: () => void;
}

class SearchBar extends PureComponent<SearchBarProps> {
    render() {
        return (
            <View style={[s.container, this.props.style]}>
                {!this.props.noIcon && <IoIcon name="ios-search" color="grey" size={20} style={s.search} />}
                <TextInput
                    style={[s.input, this.props.style]}
                    selectionColor={colors.primary}
                    placeholderTextColor="grey"
                    placeholder={this.props.placeholder}
                    onChangeText={this.props.onChangeText}
                    enterKeyHint={this.props.enterKeyHint || 'search'}
                    onSubmitEditing={this.props.onSubmit}
                    autoFocus={this.props.autoFocus}
                    onPressOut={this.props.onPress}
                    testID={this.props.testID}
                />
                {this.props.input.length > 0 && (
                    <TouchableOpacity
                        onPress={this.props.cancelSearch}
                        activeOpacity={1}
                        hitSlop={{
                            left: 20,
                            right: 20,
                            top: 20,
                            bottom: 20,
                        }}>
                        <CancelIcon name="cancel" color="silver" size={20} />
                    </TouchableOpacity>
                )}
            </View>
        );
    }
}

const s = StyleSheet.create({
    container: {
        backgroundColor: '#f3f3f3',
        borderRadius: 16,
        flexDirection: 'row',
        alignSelf: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
        width: w('95%'),
        marginTop: 8,
    },
    input: {
        height: 44,
        alignSelf: 'center',
        fontSize: 16,
        paddingHorizontal: 8,
        flex: 1,
    },
    search: {
        marginRight: 8,
    },
});

export default SearchBar;
