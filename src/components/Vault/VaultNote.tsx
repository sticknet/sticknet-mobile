import React, {FC} from 'react';
import {View, StyleSheet, Pressable, StyleProp, ViewStyle} from 'react-native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import Text from '@/src/components/Text';
import {formatAMPM, formatMessageDate, nav} from '@/src/utils';
import {colors} from '@/src/foundations';
import ActionsMenu from '@/src/components/ActionsMenu';
import type {TVaultNote} from '@/src/types';
import type {VaultStackParamList} from '@/src/navigators/types';

interface VaultNoteProps {
    note: TVaultNote;
    style?: StyleProp<ViewStyle>;
}

const VaultNote: FC<VaultNoteProps> = (props) => {
    const {note, style} = props;
    const navigation = useNavigation<NavigationProp<VaultStackParamList>>();

    return (
        <Pressable style={[s.container, style]} onPress={() => nav(navigation, 'CreateNote', {note})}>
            <View>
                <Text numberOfLines={2} style={s.text}>
                    {note.text}
                </Text>
                <Text style={s.date}>{`${formatMessageDate(note.timestamp)}, ${formatAMPM(note.timestamp)}`}</Text>
            </View>
            <ActionsMenu item={note as TVaultNote} type="note" />
        </Pressable>
    );
};

const s = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    text: {
        fontWeight: '500',
        maxWidth: w('80%'),
        color: colors.black,
        fontSize: 15,
    },
    date: {
        color: colors.silver,
        marginTop: 4,
    },
});

export default VaultNote;
