import React, {FC} from 'react';
import {View, StyleSheet, Pressable} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import * as Progress from 'react-native-progress';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import Text from '@/src/components/Text';
import FileLabel from '@/src/components/Vault/FileLabel';
import {colors} from '@/src/foundations';
import type {IApplicationState, TMessage} from '@/src/types';
import type {ChatStackParamList} from '@/src/navigators/types';

interface DocumentFileOwnProps {
    fileId: string;
    message: TMessage;
    index: number;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps & DocumentFileOwnProps;

const DocumentFile: FC<Props> = (props) => {
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
    const {file, uploading, index} = props;
    if (!file) return null;
    return (
        <Pressable
            style={s.container}
            onPress={() => {
                navigation.navigate('FileView', {
                    context: 'chat',
                    index,
                    imagesIds: props.message.files,
                });
            }}
        >
            <FileLabel file={file} />
            <View style={{marginLeft: 8, marginRight: 8, flex: 1}}>
                <Text numberOfLines={1} style={{fontSize: 15, color: uploading ? 'lightgrey' : colors.black}}>
                    {file.name}
                </Text>
                {uploading ? (
                    <Progress.Bar
                        height={4}
                        width={w('60%')}
                        color={colors.primary}
                        borderRadius={0}
                        borderColor="#fff"
                        unfilledColor="lightgrey"
                        progress={uploading}
                    />
                ) : null}
            </View>
        </Pressable>
    );
};

const s = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'lightgrey',
        borderRadius: 4,
        width: w('75%'),
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: DocumentFileOwnProps) => {
    const file = state.chatFiles[ownProps.fileId];
    return {
        file,
        uploading: state.upload[file?.uriKey],
    };
};

const connector = connect(mapStateToProps);

export default connector(DocumentFile);
