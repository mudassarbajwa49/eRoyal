// Announcements List Screen (Resident)
// View all society notices

import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Card } from '../../../src/components/common/Card';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { Announcement, getAllAnnouncements } from '../../../src/services/announcementService';

export default function AnnouncementListScreen() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        const data = await getAllAnnouncements();
        setAnnouncements(data);
        setLoading(false);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadAnnouncements();
        setRefreshing(false);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return '#FF3B30';
            case 'medium': return '#FF9500';
            case 'low': return '#34C759';
            default: return '#8E8E93';
        }
    };

    const renderItem = ({ item }: { item: Announcement }) => (
        <Card style={styles.card}>
            <View style={styles.header}>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                    <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
                </View>
                <Text style={styles.date}>
                    {item.createdAt.toDate().toLocaleDateString()}
                </Text>
            </View>

            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>

            <View style={styles.footer}>
                <Text style={styles.author}>Posted by: {item.createdByName}</Text>
            </View>
        </Card>
    );

    if (loading) {
        return <LoadingSpinner message="Loading announcements..." />;
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
                        <Text style={styles.emptyText}>No announcements yet</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA'
    },
    listContent: {
        padding: 16,
        gap: 16
    },
    card: {
        marginBottom: 0
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4
    },
    priorityText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '700'
    },
    date: {
        fontSize: 12,
        color: '#8E8E93'
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
        marginBottom: 8
    },
    message: {
        fontSize: 15,
        color: '#333',
        lineHeight: 22,
        marginBottom: 16
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
        paddingTop: 12
    },
    author: {
        fontSize: 12,
        color: '#8E8E93',
        fontStyle: 'italic'
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center'
    },
    emptyText: {
        fontSize: 16,
        color: '#8E8E93'
    }
});
