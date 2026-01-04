import React, {FC} from 'react';
import Text from './Text';

interface SticknetProps {
    fontSize?: number;
    style?: object;
}

const Sticknet: FC<SticknetProps> = ({fontSize = 28, style}) => {
    return <Text style={[{fontSize, fontFamily: 'SirinStencil-Regular'}, style]}>Sticknet</Text>;
};

export default Sticknet;
