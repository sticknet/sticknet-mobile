import React, {FC} from 'react';
import FAIcon from '@sticknet/react-native-vector-icons/FontAwesome6Pro';
import {colors} from '@/src/foundations';

interface IconProps {
    name: string;
    size?: number;
    color?: string;
    regular?: boolean;
    solid?: boolean;
    thin?: boolean;
    style?: object;
    space?: boolean;
}

const Icon: FC<IconProps> = ({name, size, color, regular, style, solid, thin, space}) => {
    return (
        <FAIcon
            light={!regular && !solid && !thin}
            solid={solid}
            thin={thin}
            name={name}
            size={size || 20}
            color={color || colors.black}
            style={[style, space ? {marginRight: 8} : {}]}
        />
    );
};

export default Icon;
