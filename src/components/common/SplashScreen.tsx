import React from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { Colors } from '../../../constants/designSystem';

export const SplashScreen: React.FC = () => {
    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <Image 
                    source={require('../../../assets/images/app-logo.png')} 
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>
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
        backgroundColor: Colors.primary[600], // Exact theme teal
    },
    logoContainer: {
        width: 140,
        height: 140,
        backgroundColor: Colors.background.surface, // White circle
        borderRadius: 70, // Half of width/height for perfect circle
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 10,
    },
    logo: {
        width: 100,
        height: 100,
    },
    loaderContainer: {
        position: 'absolute',
        bottom: 80,
    }
});
