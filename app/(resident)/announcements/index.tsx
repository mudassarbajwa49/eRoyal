// Announcements List Screen (Resident)
// Modern announcement cards with priority indicators

import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../../../constants/designSystem';
import { Card } from '../../../src/components/common/Card';
import { SkeletonLoader } from '../../../src/components/common/SkeletonLoader';
import { Announcement, getAnnouncements } from '../../../src/services/announcementService';

export default function AnnouncementListScreen() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        const data = await getAnnouncements();
        setAnnouncements(data);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAnnouncements();
        setRefreshing(false);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'high': return Colors.error.main;
            case 'medium': return Colors.warning.main;
            case 'low': return Colors.success.main;
            default: return Colors.secondary[500];
        }
    };

    const getPriorityBgColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'high': return Colors.error.light;
            case 'medium': return Colors.warning.light;
            case 'low': return Colors.success.light;
            default: return Colors.secondary[100];
        }
    };

    const renderItem = ({ item }: { item: Announcement }) => (
        <Card style={styles.card}>
            <View style={styles.header}>
                <View
                    style={[
                        styles.priorityBadge,
                        {
                            backgroundColor: getPriorityBgColor(item.priority),
                            borderColor: getPriorityColor(item.priority),
                        },
                    ]}
                >
                    <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                        {item.priority.toUpperCase()}
                    </Text>
                </View>
                <Text style={styles.date}>
                    {item.createdAt.toDate().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    })}
                </Text>
            </View>

            <View style={styles.iconRow}>
                <Text style={styles.announcementIcon}>📢</Text>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                </View>
            </View>

            <Text style={styles.message}>{item.message}</Text>

            <View style={styles.footer}>
                <Text style={styles.author}>Posted by: {item.createdByName}</Text>
            </View>
        </Card>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.listContent}>
                    <SkeletonLoader variant="card" count={5} />
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={announcements}
                renderItem={renderItem}
                keyExtractor={(item) => item.id || Math.random().toString()}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📢</Text>
                        <Text style={styles.emptyText}>No announcements yet</Text>
                        <Text style={styles.emptySubtext}>
                            Check back later for society updates
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    listContent: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    card: {
        marginBottom: 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    priorityBadge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
    },
    priorityText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.bold,
    },
    date: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.secondary,
    },
    iconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    announcementIcon: {
        fontSize: 28,
        marginRight: Spacing.sm,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
    },
    message: {
        fontSize: Typography.fontSize.base,
        color: Colors.text.secondary,
        lineHeight: Typography.fontSize.base * Typography.lineHeight.relaxed,
        marginBottom: Spacing.lg,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: Colors.border.main,
        paddingTop: Spacing.md,
    },
    author: {
        fontSize: Typography.fontSize.sm,
        color: Colors.text.tertiary,
        fontStyle: 'italic',
    },
    emptyContainer: {
        padding: Spacing['5xl'],
        alignItems: 'center',
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
    },
});
