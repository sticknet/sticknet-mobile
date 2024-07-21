import {Text, View, StyleSheet} from 'react-native';
import React, {FC} from 'react';
import Invite from './Invite';

const EmptyUserSearch: FC = () => {
    return (
        <View>
            <Text style={s.nousers}>You have no connections</Text>
            <Invite small style={s.invite} textStyle={[s.nousers, {marginTop: 0, top: 2}]} />
        </View>
    );
};

const s = StyleSheet.create({
    nousers: {
        textAlign: 'center',
        fontWeight: 'bold',
        color: 'silver',
        fontSize: 16,
        marginTop: 40,
    },
    invite: {
        width: 160,
        alignSelf: 'center',
        marginTop: 16,
        marginRight: 0,
    },
});

export default EmptyUserSearch;
