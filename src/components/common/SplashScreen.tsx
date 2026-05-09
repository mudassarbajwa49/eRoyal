import React from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { Colors } from '../../../constants/designSystem';

export const SplashScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <Image 
                source={require('../../../assets/images/app-logo.png')} 
                style={styles.logo}
                resizeMode="contain"
            />
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0f766e', // Matches our brand teal in app.json
    },
    logo: {
        width: 200,
        height: 200,
    },
    loaderContainer: {
        position: 'absolute',
        bottom: 80,
    }
});
