// Create Announcement Screen (Admin)
// Allows admin to send notices to all residents with optional images

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { ImagePickerComponent } from '../../../src/components/common/ImagePickerComponent';
import { Input } from '../../../src/components/common/Input';
import { useAuth } from '../../../src/contexts/AuthContext';
import { createAnnouncement } from '../../../src/services/announcementService';

export default function CreateAnnouncementScreen() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [images, setImages] = useState<string[]>([]);

    const handleSubmit = async () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);

        const result = await createAnnouncement(
            title,
            message,
            priority,
            userProfile!.uid,
            userProfile!.name,
            images.length > 0 ? images : undefined
        );

        setLoading(false);

        if (result.success) {
            // Clear the form
            setTitle('');
            setMessage('');
            setPriority('medium');
            setImages([]);

            Alert.alert(
                'Success',
                'Announcement sent to all residents!',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } else {
            Alert.alert('Error', result.error || 'Failed to send announcement');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Card>
                    <Input
                        label="Title"
                        placeholder="Announcement Title"
                        value={title}
                        onChangeText={setTitle}
                        required
                    />

                    <Input
                        label="Message"
                        placeholder="Type your message here..."
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        numberOfLines={6}
                        required
                        containerStyle={styles.messageInput}
                        textAlignVertical="top"
                    />

                    <ImagePickerComponent
                        images={images}
                        onImagesChange={setImages}
                        maxImages={5}
                    />

                    <View style={styles.priorityContainer}>
                        <Button
                            title="Low Priority"
                            onPress={() => setPriority('low')}
                            variant={priority === 'low' ? 'primary' : 'secondary'}
                            style={styles.priorityButton}
                        />
                        <Button
                            title="Medium"
                            onPress={() => setPriority('medium')}
                            variant={priority === 'medium' ? 'primary' : 'secondary'}
                            style={styles.priorityButton}
                        />
                        <Button
                            title="High Priority"
                            onPress={() => setPriority('high')}
                            variant={priority === 'high' ? 'danger' : 'secondary'}
                            style={styles.priorityButton}
                        />
                    </View>

                    <Button
                        title="Send Announcement"
                        onPress={handleSubmit}
                        loading={loading}
                        fullWidth
                        style={styles.submitButton}
                    />
                </Card>
            </View>
        </ScrollView>
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
    messageInput: {
        height: 150
    },
    priorityContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 24
    },
    priorityButton: {
        flex: 1,
        minWidth: 0
    },
    submitButton: {
        marginTop: 8
    }
});

