import React, {Component} from 'react';
import {FlatList, StatusBar, StyleSheet} from 'react-native';
import {NavigationProp} from '@react-navigation/native';
import {SettingsItem, Icon} from '@/src/components';
import type {ProfileStackParamList} from '@/src/navigators/types';

interface PrivacyScreenProps {
    navigation: NavigationProp<ProfileStackParamList>;
}

class PrivacyScreen extends Component<PrivacyScreenProps> {
    navListener: any;

    componentDidMount() {
        this.navListener = this.props.navigation.addListener('focus', () => {
            StatusBar.setBarStyle('dark-content', true);
        });
    }

    componentWillUnmount() {
        if (this.navListener) this.navListener();
    }

    renderItem = ({item}: {item: any}) => <SettingsItem item={item} />;

    render() {
        const {
            navigation: {navigate},
        } = this.props;

        const data = [
            {
                text: 'Blocked Accounts',
                action: () => navigate('Blocked'),
                icon: <Icon name="ban" style={s.icon} />,
            },
        ];

        return <FlatList data={data} renderItem={this.renderItem} keyExtractor={(item) => item.text} />;
    }
}

const s = StyleSheet.create({
    icon: {
        width: 40,
    },
});

export default PrivacyScreen;
