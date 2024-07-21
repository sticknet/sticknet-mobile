import React, {FC} from 'react';
import {View, StyleSheet} from 'react-native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import LottieView from 'lottie-react-native';
import {Text} from '../../../components';
import {computerAnimation} from '../../../../assets/lottie';

const ComputerScreen: FC = () => {
    return (
        <View>
            <LottieView source={computerAnimation} style={{width: w('100%')}} autoPlay />
            <View style={styles.textContainer}>
                <Text style={styles.title}>Access your Vault from a computer:</Text>
                <Text style={styles.step}>1. On your computer, go to: www.sticknet.org</Text>
                <Text style={styles.step}>2. On the top right, click on "Get Started"</Text>
                <Text style={styles.step}>3. Log in to your account</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    textContainer: {
        paddingHorizontal: 12,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 20,
        marginVertical: 18,
    },
    step: {
        marginVertical: 12,
        fontSize: 16,
        marginLeft: 8,
    },
});

export default ComputerScreen;
