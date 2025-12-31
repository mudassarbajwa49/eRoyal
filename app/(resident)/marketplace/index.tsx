// Resident Marketplace Index
// View approved listings and own listings

import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../../src/components/common/Button';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { ListingCard } from '../../../src/components/marketplace/ListingCard';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getApprovedListings, getMyListings } from '../../../src/services/listingService';
import { Listing } from '../../../src/types';

export default function MarketplaceIndex() {
    const { userProfile } = useAuth();
    const router = useRouter();
    const [approvedListings, setApprovedListings] = useState<Listing[]>([]);
    const [myListings, setMyListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'browse' | 'my'>('browse');

    useEffect(() => {
        loadListings();
    }, []);

    const loadListings = async () => {
        if (!userProfile) return;

        setLoading(true);
        const [approved, my] = await Promise.all([
            getApprovedListings(),
            getMyListings(userProfile.uid)
        ]);
        setApprovedListings(approved);
        setMyListings(my);
        setLoading(false);
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadListings();
        setRefreshing(false);
    }, [userProfile]);

    const renderListing = useCallback(({ item }: { item: Listing }) => (
        <ListingCard listing={item} isAdmin={false} />
    ), []);

    const keyExtractor = useCallback((item: Listing) => item.id!, []);

    if (loading) {
        return <LoadingSpinner message="Loading marketplace..." />;
    }

    const currentListings = activeTab === 'browse' ? approvedListings : myListings;

    return (
        <>
            <Stack.Screen options={{ title: 'Marketplace' }} />
            <View style={styles.container}>
                <View style={styles.header}>
                    <Button
                        title="+ Post Property"
                        onPress={() => router.push('/(resident)/marketplace/create')}
                        fullWidth
                    />
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'browse' && styles.activeTab]}
                        onPress={() => setActiveTab('browse')}
                    >
                        <Text style={[styles.tabText, activeTab === 'browse' && styles.activeTabText]}>
                            Browse ({approvedListings.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'my' && styles.activeTab]}
                        onPress={() => setActiveTab('my')}
                    >
                        <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
                            My Listings ({myListings.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Listings */}
                <FlatList
                    data={currentListings}
                    renderItem={renderListing}
                    keyExtractor={keyExtractor}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🏘️</Text>
                            <Text style={styles.emptyText}>
                                {activeTab === 'browse'
                                    ? 'No properties available'
                                    : 'No listings posted yet'}
                            </Text>
                        </View>
                    }
                    removeClippedSubviews
                    maxToRenderPerBatch={5}
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE'
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent'
    },
    activeTab: {
        borderBottomColor: '#007AFF'
    },
    tabText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500'
    },
    activeTabText: {
        color: '#007AFF',
        fontWeight: '600'
    },
    list: {
        padding: 16
    },
    emptyState: {
        alignItems: 'center',
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
