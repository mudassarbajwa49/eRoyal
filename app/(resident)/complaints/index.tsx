// Resident Complaints Index
// View all submitted complaints

import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../../src/components/common/Button';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { ComplaintCard } from '../../../src/components/complaints/ComplaintCard';
import { useAuth } from '../../../src/contexts/AuthContext';
import { Complaint } from '../../../src/types';

export default function ComplaintsIndex() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!userProfile) return;

        console.log('🔄 Setting up real-time listener for complaints, residentId:', userProfile.uid);

        // Set up real-time listener
        const { onSnapshot, collection, query, where, orderBy } = require('firebase/firestore');
        const { db } = require('../../../firebaseConfig');

        const q = query(
            collection(db, 'complaints'),
            where('residentId', '==', userProfile.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const complaintsData: Complaint[] = [];
                snapshot.forEach((doc) => {
                    complaintsData.push({
                        id: doc.id,
                        ...doc.data(),
                    } as Complaint);
                });
                console.log(`✅ Complaints updated: ${complaintsData.length} complaints`);
                setComplaints(complaintsData);
                setLoading(false);
            },
            (error) => {
                console.error('❌ Error listening to complaints:', error);
                setLoading(false);
            }
        );

        return () => {
            console.log('🧹 Cleaning up complaints listener');
            unsubscribe();
        };
    }, [userProfile]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        // Data refreshes automatically via listener
        setTimeout(() => setRefreshing(false), 500);
    }, []);

    const handleComplaintPress = (complaint: Complaint) => {
        router.push(`/(resident)/complaints/${complaint.id}` as any);
    };

    const renderComplaint = useCallback(({ item }: { item: Complaint }) => (
        <ComplaintCard complaint={item} onPress={handleComplaintPress} />
    ), []);

    const keyExtractor = useCallback((item: Complaint) => item.id!, []);

    if (loading) {
        return <LoadingSpinner message="Loading complaints..." />;
    }

    return (
        <>
            <Stack.Screen options={{ title: 'My Complaints' }} />
            <View style={styles.container}>
                <View style={styles.header}>
                    <Button
                        title="+ Submit New Complaint"
                        onPress={() => router.push('/(resident)/complaints/create')}
                        fullWidth
                    />
                </View>

                <FlatList
                    data={complaints}
                    renderItem={renderComplaint}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📋</Text>
                            <Text style={styles.emptyText}>No complaints submitted</Text>
                            <Text style={styles.emptySubtext}>
                                Tap the button above to submit your first complaint
                            </Text>
                        </View>
                    }
                    removeClippedSubviews
                    maxToRenderPerBatch={10}
                />
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA'
    },
    header: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE'
    },
    list: {
        padding: 16
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center'
    }
});
