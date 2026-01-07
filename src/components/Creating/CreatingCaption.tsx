import {TouchableOpacity, View, StyleSheet} from 'react-native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import React, {useState, FC} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import Text from '@/src/components/Text';
import {create} from '@/src/actions';
import TextModal from '@/src/components/Modals/TextModal';
import type {IApplicationState, TUser} from '@/src/types';

interface CreatingCaptionOwnProps {
    dispatchImagesState: (state: {caption?: string}) => void;
}

type ReduxProps = ConnectedProps<typeof connector>;
type Props = ReduxProps & CreatingCaptionOwnProps;

const CreatingCaption: FC<Props> = (props) => {
    const [caption, setCaption] = useState('');
    const [captionModal, setCaptionModal] = useState(false);
    return (
        <View style={{height: 40, flexDirection: 'row', marginTop: 12, marginBottom: 12}}>
            <TextModal
                visible={captionModal}
                onBackdropPress={() => setCaptionModal(false)}
                onChangeText={(caption) => setCaption(caption)}
                value={caption}
                done={() => {
                    setCaptionModal(false);
                    setTimeout(() => props.dispatchImagesState({caption}), 0);
                }}
                maxLength={500}
            />
            <TouchableOpacity style={s.input} activeOpacity={1} onPress={() => setCaptionModal(true)}>
                <Text style={[s.captionText, !caption || caption === '' ? {color: 'grey'} : {}]} numberOfLines={1}>
                    {!caption || caption === '' ? 'Caption...' : caption}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const s = StyleSheet.create({
    input: {
        width: w('85%'),
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'lightgrey',
        marginBottom: 8,
        marginLeft: 20,
    },
    captionText: {
        textAlign: 'left',
    },
});

const mapStateToProps = (state: IApplicationState) => {
    return {
        userId: (state.auth.user as TUser).id,
    };
};

const connector = connect(mapStateToProps, {...create});

export default connector(CreatingCaption);
