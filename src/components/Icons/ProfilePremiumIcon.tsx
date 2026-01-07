import React, {FC} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import PremiumIcon from './PremiumIcon';
import type {IApplicationState, TUser} from '@/src/types';

const mapStateToProps = (state: IApplicationState) => ({
    subscription: state.auth.user ? (state.auth.user as TUser).subscription : 'basic',
});

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux;

const ProfilePremiumIcon: FC<Props> = (props) => {
    if (props.subscription === 'basic') return null;
    return <PremiumIcon />;
};

export default connector(ProfilePremiumIcon);
