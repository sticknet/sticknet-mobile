import React, {Component} from 'react';
import {FlatList, StatusBar} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import type {NavigationProp} from '@react-navigation/native';

import {SettingsItem, Icon} from '@/src/components';
import type {ProfileStackParamList} from '@/src/navigators/types';
import type {IApplicationState} from '@/src/types';

interface AccountScreenProps {
    navigation: NavigationProp<ProfileStackParamList>;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps & AccountScreenProps;

class AccountScreen extends Component<Props> {
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
        let data = [
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
        if (this.props.isWallet) data = data.slice(3);
        return <FlatList data={data} renderItem={this.renderItem} keyExtractor={(item) => item.text} />;
    }
}

function mapStateToProps(state: IApplicationState) {
    return {
        isWallet: state.auth.user?.ethereumAddress,
    };
}

const connector = connect(mapStateToProps);

export default connector(AccountScreen);
