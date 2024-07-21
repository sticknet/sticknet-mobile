import React, {FC} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {colors} from '../../foundations';
import SmallLoading from '../SmallLoading';
import type {IApplicationState} from '../../types';

const mapStateToProps = (state: IApplicationState) => {
    return {
        tabBarHeight: state.appTemp.tabBarHeight || 50,
        count: Object.keys(state.upload).length,
    };
};

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux;

const UploadingView: FC<Props> = (props) => {
    if (props.count === 0) return null;
    return (
        <View style={[s.container, {bottom: 0}]} testID="uploading-view">
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <SmallLoading />
                <Text>
                    {' '}
                    Uploading {props.count} file{props.count > 1 ? 's' : ''}
                </Text>
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    container: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
        width: w('100%'),
        flex: 1,
        backgroundColor: '#ffffff',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: colors.primary,
        height: 40,
    },
});

export default connector(UploadingView);
