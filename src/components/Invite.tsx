import React, {PureComponent} from 'react';
import {Text, TouchableOpacity, View, StyleSheet, StyleProp, ViewStyle, TextStyle} from 'react-native';
import {connect} from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import {profile} from '@/src/actions';
import {IProfileActions} from '@/src/actions/profile';

interface InviteProps extends IProfileActions {
    small?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
}

class Invite extends PureComponent<InviteProps> {
    render() {
        const {small, style, textStyle} = this.props;
        const circleWidth = small ? 40 : 80;
        const heartSize = small ? 24 : 48;
        const iconSize = small ? 13 : 26;
        return (
            <TouchableOpacity onPress={() => this.props.invite()} style={[s.inviteContainer, style]} activeOpacity={1}>
                <View style={[s.circleContainer, {width: circleWidth}]}>
                    <View style={[s.heartContainer, {width: heartSize, height: heartSize}]}>
                        <Icon name="ios-heart" color="#ffffff" size={iconSize} />
                    </View>
                </View>
                <Text style={[s.tell, textStyle]}>Tell a Friend</Text>
            </TouchableOpacity>
        );
    }
}

const s = StyleSheet.create({
    circleContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    inviteContainer: {
        flexDirection: 'row',
        borderWidth: 0.75,
        borderColor: 'lightgrey',
        borderRadius: 8,
        paddingTop: 12,
        paddingBottom: 12,
        marginRight: 16,
        marginBottom: 8,
    },
    tell: {
        fontSize: 18,
        fontWeight: '500',
        marginLeft: 16,
        top: 12,
    },
    heartContainer: {
        borderRadius: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#6060FF',
    },
});

export default connect(null, {...profile})(Invite);
