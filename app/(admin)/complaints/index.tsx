// Admin Complaints Index
// View and manage all complaints

import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { db } from '../../../firebaseConfig';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { ComplaintCard } from '../../../src/components/complaints/ComplaintCard';
import { Complaint } from '../../../src/types';

export default function ComplaintsIndex() {
    const router = useRouter();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        console.log('🔄 Setting up real-time listener for all complaints');

        const q = query(collection(db, 'complaints'), orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(
            q,
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
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        // Data refreshes automatically via listener
        setTimeout(() => setRefreshing(false), 500);
    };

    const handleComplaintPress = (complaint: Complaint) => {
        // Navigate to detail screen
        router.push(`/(admin)/complaints/${complaint.id}` as any);
    };

    if (loading) {
        return <LoadingSpinner message="Loading complaints..." />;
    }

    const pendingComplaints = complaints.filter(c => c.status === 'Pending');
    const inProgressComplaints = complaints.filter(c => c.status === 'In Progress');
    const resolvedComplaints = complaints.filter(c => c.status === 'Resolved');

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {complaints.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📋</Text>
                    <Text style={styles.emptyText}>No complaints yet</Text>
                </View>
            ) : (
                <>
                    {/* Pending Section */}
                    {pendingComplaints.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                ⏳ Pending ({pendingComplaints.length})
                            </Text>
                            {pendingComplaints.map(complaint => (
                                <ComplaintCard
                                    key={complaint.id}
                                    complaint={complaint}
                                    onPress={handleComplaintPress}
                                    isAdmin
                                />
                            ))}
                        </View>
                    )}

                    {/* In Progress Section */}
                    {inProgressComplaints.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                🔄 In Progress ({inProgressComplaints.length})
                            </Text>
                            {inProgressComplaints.map(complaint => (
                                <ComplaintCard
                                    key={complaint.id}
                                    complaint={complaint}
                                    onPress={handleComplaintPress}
                                    isAdmin
                                />
                            ))}
                        </View>
                    )}

                    {/* Resolved Section */}
                    {resolvedComplaints.length > 0 && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>
                                ✅ Resolved ({resolvedComplaints.length})
                            </Text>
                            {resolvedComplaints.map(complaint => (
                                <ComplaintCard
                                    key={complaint.id}
                                    complaint={complaint}
                                    isAdmin
                                />
                            ))}
                        </View>
                    )}
                </>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
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
        fontSize: 16,
        color: '#999'
    },
    section: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        paddingLeft: 4
    }
});
