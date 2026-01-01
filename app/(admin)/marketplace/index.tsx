// Admin Marketplace Index
// Approve or reject property listings

import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { ListingCard } from '../../../src/components/marketplace/ListingCard';
import { useAuth } from '../../../src/contexts/AuthContext';
import {
    approveListing,
    getApprovedListings,
    getPendingListings,
    rejectListing
} from '../../../src/services/MarketplaceListingService';
import { Listing } from '../../../src/types';

export default function MarketplaceIndex() {
    const { userProfile } = useAuth();
    const [pendingListings, setPendingListings] = useState<Listing[]>([]);
    const [approvedListings, setApprovedListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

    useEffect(() => {
        loadListings();
    }, []);

    const loadListings = async () => {
        setLoading(true);
        const [pending, approved] = await Promise.all([
            getPendingListings(),
            getApprovedListings()
        ]);
        setPendingListings(pending);
        setApprovedListings(approved);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadListings();
        setRefreshing(false);
    };

    const handleApprove = async (listingId: string) => {
        Alert.alert(
            'Approve Listing',
            'Are you sure you want to approve this property listing?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Approve',
                    onPress: async () => {
                        const result = await approveListing(listingId, userProfile!.uid);

                        if (result.success) {
                            Alert.alert('Success', 'Listing approved successfully');
                            loadListings();
                        } else {
                            Alert.alert('Error', result.error || 'Failed to approve listing');
                        }
                    }
                }
            ]
        );
    };

    const handleReject = async (listingId: string) => {
        Alert.prompt(
            'Reject Listing',
            'Please provide a reason for rejection:',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async (reason?: string) => {
                        if (!reason || !reason.trim()) {
                            Alert.alert('Error', 'Please provide a rejection reason');
                            return;
                        }

                        const result = await rejectListing(listingId, userProfile!.uid, reason);

                        if (result.success) {
                            Alert.alert('Rejected', 'Listing has been rejected');
                            loadListings();
                        } else {
                            Alert.alert('Error', result.error || 'Failed to reject listing');
                        }
                    }
                }
            ],
            'plain-text'
        );
    };

    if (loading) {
        return <LoadingSpinner message="Loading marketplace..." />;
    }

    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
                    onPress={() => setActiveTab('pending')}
                >
                    <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
                        Pending ({pendingListings.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'approved' && styles.activeTab]}
                    onPress={() => setActiveTab('approved')}
                >
                    <Text style={[styles.tabText, activeTab === 'approved' && styles.activeTabText]}>
                        Approved ({approvedListings.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {activeTab === 'pending' ? (
                    pendingListings.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>✅</Text>
                            <Text style={styles.emptyText}>No pending listings to review</Text>
                        </View>
                    ) : (
                        pendingListings.map(listing => (
                            <ListingCard
                                key={listing.id}
                                listing={listing}
                                onApprove={handleApprove}
                                onReject={handleReject}
                                isAdmin
                            />
                        ))
                    )
                ) : (
                    approvedListings.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🏘️</Text>
                            <Text style={styles.emptyText}>No approved listings yet</Text>
                        </View>
                    ) : (
                        approvedListings.map(listing => (
                            <ListingCard
                                key={listing.id}
                                listing={listing}
                                isAdmin
                            />
                        ))
                    )
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA'
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE'
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent'
    },
    activeTab: {
        borderBottomColor: '#007AFF'
    },
    tabText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500'
    },
    activeTabText: {
        color: '#007AFF',
        fontWeight: '600'
    },
    content: {
        flex: 1,
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
    }
});
