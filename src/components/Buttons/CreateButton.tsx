import React, {FC} from 'react';
import {Pressable} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import Icon from '../Icons/Icon';
import {app} from '../../actions';

interface CreateButtonProps extends PropsFromRedux {
    color: string;
}

const CreateButton: FC<CreateButtonProps> = (props) => {
    return (
        <Pressable
            onPress={() => props.openModal({modalName: 'create'})}
            hitSlop={{left: 24, right: 24, bottom: 24, top: 24}}>
            <Icon name="circle-plus" size={32} color={props.color} style={{top: 4}} />
        </Pressable>
    );
};

const connector = connect(null, {...app});

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(CreateButton);
