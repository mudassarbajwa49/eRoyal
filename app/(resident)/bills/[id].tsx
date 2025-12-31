// Bill Detail & Payment Upload (Resident)
// Upload payment proof for a specific bill

import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { db } from '../../../firebaseConfig';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { StatusBadge } from '../../../src/components/common/StatusBadge';
import { uploadPaymentProof } from '../../../src/services/billService';
import { Bill } from '../../../src/types';

export default function BillDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [bill, setBill] = useState<Bill | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        loadBill();
    }, [id]);

    const loadBill = async () => {
        if (!id) return;

        try {
            const billDoc = await getDoc(doc(db, 'bills', id as string));
            if (billDoc.exists()) {
                setBill({ id: billDoc.id, ...billDoc.data() } as Bill);
            }
        } catch (error) {
            console.error('Error loading bill:', error);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            Alert.alert('Permission Required', 'Please allow access to your photos');
            return;
        }

        const result = await ImagePicker.launchImagePickerAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const handleUpload = async () => {
        if (!selectedImage || !bill?.id) return;

        setUploading(true);

        const result = await uploadPaymentProof(bill.id, selectedImage);

        setUploading(false);

        if (result.success) {
            Alert.alert(
                'Success',
                'Payment proof uploaded successfully! Admin will verify it soon.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } else {
            Alert.alert('Error', result.error || 'Failed to upload payment proof');
        }
    };

    const formatDate = (timestamp: any): string => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    if (loading) {
        return <LoadingSpinner message="Loading bill..." />;
    }

    if (!bill) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Bill not found</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: bill.month }} />
            <ScrollView style={styles.container}>
                <View style={styles.content}>
                    <Card>
                        <View style={styles.header}>
                            <Text style={styles.month}>{bill.month}</Text>
                            <StatusBadge status={bill.status} />
                        </View>

                        <View style={styles.amountContainer}>
                            <Text style={styles.label}>Amount Due</Text>
                            <Text style={styles.amount}>Rs. {bill.amount.toLocaleString()}</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.label}>Due Date:</Text>
                            <Text style={styles.value}>{formatDate(bill.dueDate)}</Text>
                        </View>

                        {bill.proofUploadedAt && (
                            <View style={styles.infoRow}>
                                <Text style={styles.label}>Proof Uploaded:</Text>
                                <Text style={styles.value}>{formatDate(bill.proofUploadedAt)}</Text>
                            </View>
                        )}
                    </Card>

                    {bill.status === 'Unpaid' && (
                        <Card>
                            <Text style={styles.sectionTitle}>Upload Payment Proof</Text>
                            <Text style={styles.instructions}>
                                Please pay via JazzCash/EasyPaisa and upload a screenshot of the transaction.
                            </Text>

                            {selectedImage ? (
                                <>
                                    <Image source={{ uri: selectedImage }} style={styles.preview} />
                                    <Button
                                        title="Change Image"
                                        onPress={pickImage}
                                        variant="secondary"
                                        fullWidth
                                        style={styles.button}
                                    />
                                </>
                            ) : (
                                <Button
                                    title="Select Image"
                                    onPress={pickImage}
                                    variant="secondary"
                                    fullWidth
                                    style={styles.button}
                                />
                            )}

                            {selectedImage && (
                                <Button
                                    title="Upload Proof"
                                    onPress={handleUpload}
                                    loading={uploading}
                                    fullWidth
                                    style={styles.button}
                                />
                            )}
                        </Card>
                    )}

                    {bill.proofUrl && (
                        <Card>
                            <Text style={styles.sectionTitle}>Uploaded Proof</Text>
                            <Image source={{ uri: bill.proofUrl }} style={styles.uploadedImage} />
                        </Card>
                    )}
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
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA'
    },
    errorText: {
        fontSize: 16,
        color: '#999'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    month: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333'
    },
    amountContainer: {
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE'
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4
    },
    amount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#007AFF'
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    value: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12
    },
    instructions: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 16
    },
    preview: {
        width: '100%',
        height: 250,
        borderRadius: 8,
        marginBottom: 12
    },
    uploadedImage: {
        width: '100%',
        height: 300,
        borderRadius: 8
    },
    button: {
        marginTop: 8
    }
});
