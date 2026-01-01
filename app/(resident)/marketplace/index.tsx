// Resident Marketplace Index
// Modern marketplace with grid layout and filters

import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../../../constants/designSystem';
import { Button } from '../../../src/components/common/Button';
import { SkeletonLoader } from '../../../src/components/common/SkeletonLoader';
import { ListingCard } from '../../../src/components/marketplace/ListingCard';
import { useAuth } from '../../../src/contexts/AuthContext';
import { getApprovedListings, getMyListings } from '../../../src/services/MarketplaceListingService';
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
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <SkeletonLoader variant="text" />
                </View>
                <View style={styles.tabContainer}>
                    <SkeletonLoader variant="text" />
                </View>
                <View style={styles.list}>
                    <SkeletonLoader variant="card" count={3} />
                </View>
            </View>
        );
    }

    const currentListings = activeTab === 'browse' ? approvedListings : myListings;

    return (
        <>
            <Stack.Screen options={{ title: 'Marketplace' }} />
            <View style={styles.container}>
                {/* Header with CTA */}
                <View style={styles.header}>
                    <View style={styles.headerContent}>
                        <Text style={styles.headerTitle}>Community Marketplace</Text>
                        <Text style={styles.headerSubtitle}>
                            Buy, sell, or rent properties
                        </Text>
                    </View>
                    <Button
                        title="+ Post Property"
                        onPress={() => router.push('/(resident)/marketplace/create')}
                        fullWidth
                    />
                </View>

                {/* Modern Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'browse' && styles.activeTab]}
                        onPress={() => setActiveTab('browse')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabText, activeTab === 'browse' && styles.activeTabText]}>
                            Browse ({approvedListings.length})
                        </Text>
                        {activeTab === 'browse' && <View style={styles.activeIndicator} />}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'my' && styles.activeTab]}
                        onPress={() => setActiveTab('my')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabText, activeTab === 'my' && styles.activeTabText]}>
                            My Listings ({myListings.length})
                        </Text>
                        {activeTab === 'my' && <View style={styles.activeIndicator} />}
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
                            <Text style={styles.emptyIcon}>🏪</Text>
                            <Text style={styles.emptyText}>
                                {activeTab === 'browse'
                                    ? 'No properties available'
                                    : 'No listings posted yet'}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {activeTab === 'browse'
                                    ? 'Check back later for new listings'
                                    : 'Tap the button above to post a property'}
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
        backgroundColor: Colors.background.secondary,
    },
    header: {
        padding: Spacing.lg,
        backgroundColor: Colors.background.primary,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    headerContent: {
        marginBottom: Spacing.md,
    },
    headerTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    headerSubtitle: {
        fontSize: Typography.fontSize.base,
        color: Colors.text.secondary,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.background.primary,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border.light,
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        position: 'relative',
    },
    activeTab: {
        // Active state handled by indicator
    },
    tabText: {
        fontSize: Typography.fontSize.base,
        color: Colors.text.secondary,
        fontWeight: Typography.fontWeight.medium,
    },
    activeTabText: {
        color: Colors.primary[600],
        fontWeight: Typography.fontWeight.semibold,
    },
    activeIndicator: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: Colors.primary[600],
        borderTopLeftRadius: BorderRadius.sm,
        borderTopRightRadius: BorderRadius.sm,
    },
    list: {
        padding: Spacing.lg,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing['5xl'],
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: Spacing.lg,
    },
    emptyText: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.text.primary,
        marginBottom: Spacing.xs,
    },
    emptySubtext: {
        fontSize: Typography.fontSize.base,
        color: Colors.text.tertiary,
        textAlign: 'center',
        paddingHorizontal: Spacing['2xl'],
    },
});
