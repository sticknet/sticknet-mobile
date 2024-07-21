import React, {FC} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import * as Progress from 'react-native-progress';
import {colors} from '../../../foundations';
import {IApplicationState} from '../../../types';

interface DownloadProgressOwnProps {
    uriKey: string;
    width: number;
}

const DownloadProgress: FC<Props> = ({width, downloadProgress}) => {
    return (
        <Progress.Bar
            style={{bottom: 0, position: 'absolute', borderWidth: 0}}
            height={4}
            width={width}
            color={colors.primary}
            borderRadius={0}
            unfilledColor="lightgrey"
            progress={downloadProgress ? downloadProgress / 100 : 0}
        />
    );
};

const mapStateToProps = (state: IApplicationState, ownProps: DownloadProgressOwnProps) => {
    return {
        downloadProgress: state.download[ownProps.uriKey] ? state.download[ownProps.uriKey].progress : null,
    };
};

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & DownloadProgressOwnProps;

export default connector(DownloadProgress);
