import {StyleSheet, View} from 'react-native';
import React, {FC} from 'react';

const ChatItemSeparator: FC = () => {
    return (
        <View style={{flexDirection: 'row', height: 20, alignItems: 'center'}}>
            <View style={{width: 48}} />
            <View
                style={{
                    height: StyleSheet.hairlineWidth,
                    flex: 1,
                    backgroundColor: 'lightgrey',
                }}
            />
        </View>
    );
};

export default ChatItemSeparator;
