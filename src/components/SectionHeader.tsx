import React, {FC} from 'react';
import {Text, View, StyleSheet} from 'react-native';

interface SectionHeaderProps {
    title: string;
    style?: object;
}

const SectionHeader: FC<SectionHeaderProps> = ({title, style}) => {
    return (
        <View style={[s.container, style]}>
            <View style={s.line} />
            <Text style={s.header}>{title}</Text>
            <View style={s.line2} />
        </View>
    );
};

const s = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F0F28',
        paddingLeft: 8,
        paddingRight: 8,
    },
    line: {
        width: 88,
        height: 1,
        backgroundColor: 'lightgrey',
    },
    line2: {
        flex: 1,
        height: 1,
        backgroundColor: 'lightgrey',
    },
});

export default SectionHeader;
