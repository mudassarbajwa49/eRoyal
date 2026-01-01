// Create Complaint Screen (Resident)
// Submit new complaint with optional photo

import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { Input } from '../../../src/components/common/Input';
import { useAuth } from '../../../src/contexts/AuthContext';
import { createComplaint } from '../../../src/services/ComplaintManagementService';
import { ComplaintCategory } from '../../../src/types';

const categories: ComplaintCategory[] = ['Water', 'Electricity', 'Maintenance', 'Security', 'Other'];

export default function CreateComplaintScreen() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'Maintenance' as ComplaintCategory
    });
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission Required', 'Please allow access to your photos');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!validateForm() || !userProfile) return;

        setLoading(true);

        const result = await createComplaint(
            {
                ...formData,
                photoUri: selectedImage || undefined
            },
            userProfile.uid,
            userProfile.name,
            userProfile.houseNo!
        );

        setLoading(false);

        if (result.success) {
            Alert.alert(
                'Success',
                'Complaint submitted successfully! Admin will review it soon.'
            );

            // Navigate back immediately (web-friendly)
            setTimeout(() => {
                router.back();
            }, 100);
        } else {
            Alert.alert('Error', result.error || 'Failed to submit complaint');
        }
    };

    return (
        <>
            <Stack.Screen options={{ title: 'Submit Complaint' }} />
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Card>
                        <Text style={styles.sectionTitle}>Complaint Details</Text>

                        <Input
                            label="Title"
                            placeholder="Brief description of the issue"
                            value={formData.title}
                            onChangeText={(value) => setFormData({ ...formData, title: value })}
                            error={errors.title}
                            required
                        />

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Category *</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value as ComplaintCategory })}
                                    style={styles.picker}
                                >
                                    {categories.map(cat => (
                                        <Picker.Item key={cat} label={cat} value={cat} />
                                    ))}
                                </Picker>
                            </View>
                        </View>

                        <Input
                            label="Description"
                            placeholder="Detailed explanation of the issue"
                            value={formData.description}
                            onChangeText={(value) => setFormData({ ...formData, description: value })}
                            multiline
                            numberOfLines={5}
                            style={{ minHeight: 100, textAlignVertical: 'top' }}
                            error={errors.description}
                            required
                        />

                        <View style={styles.photoSection}>
                            <Text style={styles.label}>Photo (Optional)</Text>

                            {selectedImage ? (
                                <>
                                    <Image source={{ uri: selectedImage }} style={styles.preview} />
                                    <Button
                                        title="Change Photo"
                                        onPress={pickImage}
                                        variant="secondary"
                                        fullWidth
                                        style={styles.photoButton}
                                    />
                                </>
                            ) : (
                                <TouchableOpacity style={styles.photoPlaceholder} onPress={pickImage}>
                                    <Text style={styles.photoIcon}>📷</Text>
                                    <Text style={styles.photoText}>Tap to add photo</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <Button
                            title="Submit Complaint"
                            onPress={handleSubmit}
                            loading={loading}
                            fullWidth
                            style={styles.submitButton}
                        />
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
    inputContainer: {
        marginBottom: 16
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        backgroundColor: '#FFFFFF'
    },
    picker: {
        height: 48
    },
    photoSection: {
        marginBottom: 16
    },
    photoPlaceholder: {
        height: 150,
        borderWidth: 2,
        borderColor: '#DDD',
        borderRadius: 8,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9F9F9'
    },
    photoIcon: {
        fontSize: 48,
        marginBottom: 8
    },
    photoText: {
        fontSize: 14,
        color: '#666'
    },
    preview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 12
    },
    photoButton: {
        marginTop: 8
    },
    submitButton: {
        marginTop: 8
    }
});
