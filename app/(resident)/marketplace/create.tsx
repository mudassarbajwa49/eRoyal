// Create Listing Screen (Resident)
// Post property for sale or rent

import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, FlatList, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { Input } from '../../../src/components/common/Input';
import { useAuth } from '../../../src/contexts/AuthContext';
import { createListing } from '../../../src/services/listingService';
import { ListingType } from '../../../src/types';

export default function CreateListingScreen() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'Rent' as ListingType,
        price: '',
        size: '',
        location: userProfile?.houseNo || '',
        contact: '',
        description: ''
    });
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.price || parseFloat(formData.price) <= 0) {
            newErrors.price = 'Please enter a valid price';
        }

        if (!formData.size.trim()) {
            newErrors.size = 'Size is required';
        }

        if (!formData.contact.trim()) {
            newErrors.contact = 'Contact number is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (selectedImages.length === 0) {
            newErrors.images = 'Please add at least one photo';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const pickImages = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission Required', 'Please allow access to your photos');
            return;
        }

        const result = await ImagePicker.launchImagePickerAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8
        });

        if (!result.canceled) {
            setSelectedImages([...selectedImages, ...result.assets.map(a => a.uri)]);
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(selectedImages.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!validateForm() || !userProfile) return;

        setLoading(true);

        const result = await createListing(
            {
                ...formData,
                price: parseFloat(formData.price),
                photoUris: selectedImages
            },
            userProfile.uid,
            userProfile.name,
            userProfile.houseNo!
        );

        setLoading(false);

        if (result.success) {
            Alert.alert(
                'Success',
                'Listing submitted for admin approval. You will be notified once approved.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } else {
            Alert.alert('Error', result.error || 'Failed to create listing');
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Post Property' }} />
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Card>
                        <Text style={styles.sectionTitle}>Property Details</Text>

                        {/* Type Selector */}
                        <View style={styles.typeSelector}>
                            <Text style={styles.label}>Listing Type *</Text>
                            <View style={styles.typeButtons}>
                                <Button
                                    title="For Rent"
                                    onPress={() => setFormData({ ...formData, type: 'Rent' })}
                                    variant={formData.type === 'Rent' ? 'primary' : 'secondary'}
                                    style={styles.typeButton}
                                />
                                <Button
                                    title="For Sale"
                                    onPress={() => setFormData({ ...formData, type: 'Sell' })}
                                    variant={formData.type === 'Sell' ? 'primary' : 'secondary'}
                                    style={styles.typeButton}
                                />
                            </View>
                        </View>

                        <Input
                            label="Price (PKR)"
                            placeholder="Enter price"
                            value={formData.price}
                            onChangeText={(value) => setFormData({ ...formData, price: value })}
                            keyboardType="numeric"
                            error={errors.price}
                            required
                        />

                        <Input
                            label="Size"
                            placeholder="e.g., 5 Marla, 10 Marla"
                            value={formData.size}
                            onChangeText={(value) => setFormData({ ...formData, size: value })}
                            error={errors.size}
                            required
                        />

                        <Input
                            label="Location"
                            placeholder="House/Plot number"
                            value={formData.location}
                            onChangeText={(value) => setFormData({ ...formData, location: value })}
                            required
                        />

                        <Input
                            label="Contact Number"
                            placeholder="03XX-XXXXXXX"
                            value={formData.contact}
                            onChangeText={(value) => setFormData({ ...formData, contact: value })}
                            keyboardType="phone-pad"
                            error={errors.contact}
                            required
                        />

                        <Input
                            label="Description"
                            placeholder="Property details, features, etc."
                            value={formData.description}
                            onChangeText={(value) => setFormData({ ...formData, description: value })}
                            multiline
                            numberOfLines={5}
                            style={{ minHeight: 100, textAlignVertical: 'top' }}
                            error={errors.description}
                            required
                        />

                        {/* Photos */}
                        <View style={styles.photoSection}>
                            <Text style={styles.label}>Photos * (Min 1)</Text>

                            {selectedImages.length > 0 && (
                                <FlatList
                                    data={selectedImages}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    renderItem={({ item, index }) => (
                                        <View style={styles.imagePreview}>
                                            <Image source={{ uri: item }} style={styles.image} />
                                            <TouchableOpacity
                                                style={styles.removeButton}
                                                onPress={() => removeImage(index)}
                                            >
                                                <Text style={styles.removeText}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                    keyExtractor={(_, index) => index.toString()}
                                    style={styles.imageList}
                                />
                            )}

                            <Button
                                title={`${selectedImages.length > 0 ? 'Add More' : 'Add'} Photos`}
                                onPress={pickImages}
                                variant="secondary"
                                fullWidth
                                style={styles.photoButton}
                            />

                            {errors.images && <Text style={styles.errorText}>{errors.images}</Text>}
                        </View>

                        <Button
                            title="Submit for Approval"
                            onPress={handleSubmit}
                            loading={loading}
                            fullWidth
                            style={styles.submitButton}
                        />

                        <Text style={styles.note}>
                            Note: Your listing will be reviewed by admin before being published
                        </Text>
                    </Card>
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA'
    },
    content: {
        padding: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 16
    },
    typeSelector: {
        marginBottom: 16
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8
    },
    typeButtons: {
        flexDirection: 'row',
        gap: 12
    },
    typeButton: {
        flex: 1
    },
    photoSection: {
        marginBottom: 16
    },
    imageList: {
        marginBottom: 12
    },
    imagePreview: {
        position: 'relative',
        marginRight: 12
    },
    image: {
        width: 120,
        height: 120,
        borderRadius: 8
    },
    removeButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0,0,0,0.7)',
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    removeText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },
    photoButton: {
        marginTop: 8
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4
    },
    submitButton: {
        marginTop: 8
    },
    note: {
        fontSize: 12,
        color: '#999',
        marginTop: 12,
        textAlign: 'center',
        fontStyle: 'italic'
    }
});
