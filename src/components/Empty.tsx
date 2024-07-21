import {Text, View, StyleSheet} from 'react-native';
import React from 'react';

interface EmptyProps {
    text: string;
}

const Empty: React.FC<EmptyProps> = ({text}) => {
    return (
        <View style={s.emptyContainer}>
            <Text style={s.empty}>{text}</Text>
        </View>
    );
};

const s = StyleSheet.create({
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 100,
    },
    empty: {
        fontWeight: 'bold',
        color: 'grey',
        fontSize: 16,
    },
});

export default Empty;
