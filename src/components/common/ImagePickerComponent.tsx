// Image Picker Component
// Reusable component for selecting multiple images

import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ImagePickerComponentProps {
    images: string[];
    onImagesChange: (images: string[]) => void;
    maxImages?: number;
    imageSize?: number;
}

export const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
    images,
    onImagesChange,
    maxImages = 5,
    imageSize = 100,
}) => {
    const [loading, setLoading] = useState(false);

    const pickImages = async () => {
        try {
            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
                return;
            }

            // Check if we've reached max images
            if (images.length >= maxImages) {
                Alert.alert('Limit Reached', `You can only upload up to ${maxImages} images.`);
                return;
            }

            setLoading(true);

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                quality: 0.8,
                selectionLimit: maxImages - images.length,
            });

            if (!result.canceled && result.assets) {
                const newImages = result.assets.map((asset) => asset.uri);
                const updatedImages = [...images, ...newImages].slice(0, maxImages);
                onImagesChange(updatedImages);
            }
        } catch (error) {
            console.error('Error picking images:', error);
            Alert.alert('Error', 'Failed to pick images');
        } finally {
            setLoading(false);
        }
    };

    const removeImage = (index: number) => {
        const updatedImages = images.filter((_, i) => i !== index);
        onImagesChange(updatedImages);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Images (Optional)</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                {images.map((uri, index) => (
                    <View key={index} style={[styles.imageContainer, { width: imageSize, height: imageSize }]}>
                        <Image source={{ uri }} style={styles.image} />
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => removeImage(index)}
                        >
                            <Text style={styles.removeButtonText}>×</Text>
                        </TouchableOpacity>
                    </View>
                ))}

                {images.length < maxImages && (
                    <TouchableOpacity
                        style={[styles.addButton, { width: imageSize, height: imageSize }]}
                        onPress={pickImages}
                        disabled={loading}
                    >
                        <Text style={styles.addButtonIcon}>+</Text>
                        <Text style={styles.addButtonText}>
                            {loading ? 'Loading...' : 'Add Image'}
                        </Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            <Text style={styles.helperText}>
                {images.length} / {maxImages} images
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    imagesScroll: {
        marginBottom: 8,
    },
    imageContainer: {
        marginRight: 12,
        borderRadius: 8,
        position: 'relative',
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    removeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        lineHeight: 20,
    },
    addButton: {
        borderWidth: 2,
        borderColor: '#007AFF',
        borderStyle: 'dashed',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    addButtonIcon: {
        fontSize: 32,
        color: '#007AFF',
        marginBottom: 4,
    },
    addButtonText: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
    },
    helperText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
});
