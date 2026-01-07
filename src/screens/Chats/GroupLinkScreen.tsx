import React, {Component} from 'react';
import {Alert, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import SimpleIcon from '@sticknet/react-native-vector-icons/SimpleLineIcons';
import EvilIcon from '@sticknet/react-native-vector-icons/EvilIcons';
import Icon from '@sticknet/react-native-vector-icons/Ionicons';
import Share from 'react-native-share';
import Clipboard from '@react-native-clipboard/clipboard';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';

import type {RouteProp} from '@react-navigation/native';
import {app, groups} from '@/src/actions';
import type {IApplicationState, TGroup, TUser} from '@/src/types';
import type {CommonStackParamList} from '@/src/navigators/types';

type ReduxProps = ConnectedProps<typeof connector>;

interface GroupLinkScreenOwnProps {
    route: RouteProp<CommonStackParamList, 'GroupLink'>;
}

type Props = ReduxProps & GroupLinkScreenOwnProps;

interface GroupLinkScreenState {
    linkEnabled: boolean;
    linkApproval: boolean;
    isAdmin: boolean;
}

class GroupLinkScreen extends Component<Props, GroupLinkScreenState> {
    constructor(props: Props) {
        super(props);
        this.state = {
            linkEnabled: this.props.group.linkEnabled,
            linkApproval: this.props.group.linkApproval,
            isAdmin: this.props.group.admins.includes(this.props.user.id),
        };
    }

    toggleApproval = () => {
        if (this.state.isAdmin) {
            this.setState({linkApproval: !this.state.linkApproval});
            this.props.toggleGroupLinkApproval({group: this.props.group});
        } else {
            Alert.alert('Only group admins can change this option');
        }
    };

    toggleLink = async () => {
        if (this.state.isAdmin) {
            this.setState({linkEnabled: !this.state.linkEnabled});
            if (!this.props.group.link)
                await this.props.updateGroupLink({group: this.props.group, linkApproval: this.state.linkApproval});
            else this.props.toggleGroupLink({group: this.props.group});
        } else {
            Alert.alert('Only group admins can enable or disable the group link');
        }
    };

    resetLink = () => {
        if (this.state.isAdmin) {
            this.props.updateGroupLink({group: this.props.group, linkApproval: this.state.linkApproval});
        } else {
            Alert.alert('Only group admins can reset the group link');
        }
    };

    shareLink = () => {
        Share.open({url: this.props.group.link?.text}).catch((err) => console.log('ERROR SHARE', err));
    };

    copyLink = () => {
        this.props.updated({text: 'Link Copied!'});
        Clipboard.setString(this.props.group.link?.text || '');
    };

    render() {
        const {group} = this.props;
        const {linkEnabled, linkApproval} = this.state;
        return (
            <View style={s.view}>
                <View style={s.box}>
                    <View style={s.switchContainer}>
                        <Text style={s.mainText}>Group Link</Text>
                        <Switch
                            testID="link-switch"
                            onValueChange={this.toggleLink}
                            value={linkEnabled}
                            trackColor={{false: '#767577', true: '#6060FF'}}
                            thumbColor={linkEnabled ? '#ffffff' : '#ffffff'}
                        />
                    </View>
                    {linkEnabled && (
                        <View style={s.linkContainer}>
                            <Text style={s.link} testID="group-link">
                                {group.link ? group.link.text : ''}
                            </Text>
                        </View>
                    )}
                </View>
                {linkEnabled && (
                    <View style={[s.box, {padding: 0}]}>
                        <TouchableOpacity style={s.button} onPress={this.shareLink}>
                            <View style={{flexDirection: 'row'}}>
                                <View style={s.icon}>
                                    <SimpleIcon name="share" size={20} />
                                </View>
                                <Text style={s.mainText}>Share Link</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.button} onPress={this.copyLink}>
                            <View style={{flexDirection: 'row'}}>
                                <View style={s.icon}>
                                    <Icon size={20} name="md-copy" />
                                </View>
                                <Text style={s.mainText}>Copy Link</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.button, {borderBottomWidth: 0}]} onPress={this.resetLink}>
                            <View style={{flexDirection: 'row'}}>
                                <View style={s.icon}>
                                    <EvilIcon name="refresh" size={32} />
                                </View>
                                <Text style={s.mainText}>Reset Link</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
                <View style={s.box}>
                    <View style={s.switchContainer}>
                        <Text style={s.mainText}>Approve New Members</Text>
                        <Switch
                            testID="approval-switch"
                            onValueChange={this.toggleApproval}
                            value={linkApproval}
                            trackColor={{false: '#767577', true: '#6060FF'}}
                            thumbColor={linkEnabled ? '#ffffff' : '#ffffff'}
                        />
                    </View>
                </View>
                <Text style={s.text}>Require an admin to approve new members joining through the group link.</Text>
            </View>
        );
    }
}

const s = StyleSheet.create({
    view: {
        alignItems: 'center',
    },
    box: {
        width: w('90%'),
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'lightgrey',
        borderRadius: 20,
        marginTop: 16,
        justifyContent: 'center',
        padding: 16,
    },
    text: {
        width: 328,
        color: 'grey',
        fontSize: 12,
        marginTop: 8,
    },
    mainText: {
        fontSize: 18,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    linkContainer: {
        borderTopWidth: 0.75,
        borderColor: 'lightgrey',
        marginTop: 8,
        paddingTop: 8,
    },
    link: {
        color: 'grey',
    },
    button: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'lightgrey',
        padding: 16,
        paddingLeft: 0,
        marginLeft: 16,
        width: w('80%'),
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    icon: {
        width: 24,
        alignItems: 'center',
        marginRight: 12,
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: GroupLinkScreenOwnProps) => ({
    user: state.auth.user as TUser,
    group: state.groups[ownProps.route.params.id] as TGroup,
});

const connector = connect(mapStateToProps, {...groups, ...app});

export default connector(GroupLinkScreen);
