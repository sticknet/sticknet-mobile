import React, {FC} from 'react';
import {colors} from '../../foundations';
import Icon from './Icon';

interface PremiumIconProps {
    size?: number;
}

const PremiumIcon: FC<PremiumIconProps> = (props) => {
    return <Icon name="badge-check" solid size={props.size} color={colors.primary} />;
};

export default PremiumIcon;
