import {View} from 'react-native';
import React, {FC} from 'react';
import Icon from './Icon';

const CloudVaultIcon: FC = () => {
    return (
        <View style={{justifyContent: 'center', alignItems: 'center'}}>
            <Icon name="cloud" size={25} thin />
            <Icon name="vault" size={12} style={{position: 'absolute', bottom: 5}} />
        </View>
    );
};

export default CloudVaultIcon;
