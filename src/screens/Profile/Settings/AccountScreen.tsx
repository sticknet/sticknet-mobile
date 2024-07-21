import React, {Component} from 'react';
import {FlatList, StatusBar} from 'react-native';
import {connect} from 'react-redux';
import {NavigationProp} from '@react-navigation/native';

import {SettingsItem, Icon} from '../../../components';
import type {ProfileStackParamList} from '../../../navigators/types';

interface AccountScreenProps {
    navigation: NavigationProp<ProfileStackParamList>;
}

class AccountScreen extends Component<AccountScreenProps> {
    navListener: any;

    componentDidMount() {
        this.navListener = this.props.navigation.addListener('focus', () => {
            StatusBar.setBarStyle('dark-content', true);
        });
    }

    componentWillUnmount() {
        if (this.navListener) this.navListener();
    }

    renderItem = ({
        item,
    }: {
        item: {text: string; description: string; action: () => void; icon: JSX.Element; separate?: boolean};
    }) => <SettingsItem item={item} />;

    render() {
        const {
            navigation: {navigate},
        } = this.props;
        const data = [
            {
                text: 'Backup Password',
                description: '',
                action: () => navigate('BackupPassword'),
                icon: <Icon name="lock-keyhole" />,
            },
            {
                text: 'Recover Password',
                description: '',
                action: () => navigate('RecoverPassword'),
                icon: <Icon name="key" />,
            },
            {
                text: 'Change Password',
                description: '',
                action: () => navigate('ChangePassword'),
                icon: <Icon name="key-skeleton-left-right" />,
                separate: true,
            },
            {
                text: 'Folder Icon',
                description: '',
                action: () => navigate('FolderIcon'),
                icon: <Icon name="folder" />,
                separate: true,
            },
            {
                text: 'More options',
                description: 'Locking options',
                action: () => navigate('MoreOptions'),
                icon: <Icon name="ellipsis" />,
                separate: true,
            },
        ];
        return <FlatList data={data} renderItem={this.renderItem} keyExtractor={(item) => item.text} />;
    }
}

export default connect(null, null)(AccountScreen);
