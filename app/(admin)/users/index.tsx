/**
 * Admin Users Management
 * Create, view, and manage all user accounts
 * 
 * This screen shows:
 * - List of all residents and security staff
 * - Real-time updates when users are added/deleted
 * - Create new user button
 * - Delete user functionality
 */

import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../../firebaseConfig';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { useBreakpoint } from '../../../src/hooks/useResponsive';
import { UserProfile } from '../../../src/types';
import { borderRadius, fontSize, spacing } from '../../../src/utils/responsive';

export default function UsersIndex() {
    const router = useRouter();
    const breakpoint = useBreakpoint();
    const [users, setUsers] = React.useState<UserProfile[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState<'resident' | 'security'>('resident');

    /**
     * Set up real-time listeners for all user collections
     * Firestore automatically updates the UI when data changes
     */
    React.useEffect(() => {
        console.log('🔄 Setting up real-time user listeners...');

        const unsubscribeCallbacks: (() => void)[] = [];

        // Listen to residents collection
        const residentsQuery = query(collection(db, 'residents'), orderBy('createdAt', 'desc'));
        const unsubResidents = onSnapshot(residentsQuery, (snapshot) => {
            const residentsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as unknown as UserProfile);
            console.log(`✅ Residents updated: ${residentsData.length} residents`);
            updateUsers(residentsData, 'residents');
        }, (error) => {
            console.error('Error listening to residents:', error);
        });
        unsubscribeCallbacks.push(unsubResidents);

        // Listen to security_staff collection
        const securityQuery = query(collection(db, 'security_staff'), orderBy('createdAt', 'desc'));
        const unsubSecurity = onSnapshot(securityQuery, (snapshot) => {
            const securityData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as unknown as UserProfile);
            console.log(`✅ Security updated: ${securityData.length} security staff`);
            updateUsers(securityData, 'security');
        }, (error) => {
            console.error('Error listening to security_staff:', error);
        });
        unsubscribeCallbacks.push(unsubSecurity);

        // Listen to admins collection
        const adminsQuery = query(collection(db, 'admins'), orderBy('createdAt', 'desc'));
        const unsubAdmins = onSnapshot(adminsQuery, (snapshot) => {
            const adminsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as unknown as UserProfile);
            console.log(`✅ Admins updated: ${adminsData.length} admins`);
            updateUsers(adminsData, 'admins');
        }, (error) => {
            console.error('Error listening to admins:', error);
        });
        unsubscribeCallbacks.push(unsubAdmins);

        setLoading(false);

        // Cleanup listeners when component unmounts
        return () => {
            console.log('🧹 Cleaning up user listeners');
            unsubscribeCallbacks.forEach(unsub => unsub());
        };
    }, []);

    /**
     * Merge user data from different collections
     * This keeps all users in one list while maintaining real-time updates
     */
    const updateUsers = (newData: UserProfile[], source: string) => {
        setUsers(prevUsers => {
            // Remove users from this source (they'll be re-added with newData)
            const filtered = prevUsers.filter(u => {
                if (source === 'residents') return u.role !== 'resident';
                if (source === 'security') return u.role !== 'security';
                if (source === 'admins') return u.role !== 'admin';
                return true;
            });

            // Add new data
            return [...filtered, ...newData];
        });
    };

    /**
     * Handle pull-to-refresh
     * Data updates automatically via real-time listeners
     */
    const onRefresh = async () => {
        setRefreshing(true);
        // Just show animation - data refreshes automatically
        setTimeout(() => setRefreshing(false), 500);
    };

    /**
     * Delete a user from Firestore
     * Includes confirmation and error handling
     */
    const handleDeleteUser = async (user: UserProfile) => {
        // Confirm deletion
        const confirmed = window.confirm(
            `Are you sure you want to delete ${user.name}?\n\nThis action cannot be undone and will:\n• Remove user from database\n• Delete all user data`
        );

        if (!confirmed) return;

        console.log('🗑️ Starting deletion for user:', user);

        try {
            // Get the correct collection name based on role
            const getCollectionName = (role: string) => {
                if (role === 'resident') return 'residents';
                if (role === 'security') return 'security_staff';
                if (role === 'admin') return 'admins';
                return 'users';
            };

            const collectionName = getCollectionName(user.role);
            console.log(`📁 Deleting from collection: ${collectionName}, UID: ${user.uid}`);

            // Delete from Firestore role-specific collection
            await deleteDoc(doc(db, collectionName, user.uid));
            console.log(`✅ Successfully deleted from ${collectionName}`);

            // Also delete from backup 'users' collection (if exists)
            try {
                await deleteDoc(doc(db, 'users', user.uid));
                console.log('✅ Successfully deleted from users backup');
            } catch (e) {
                console.log('ℹ️ No backup user doc to delete (this is okay)');
            }

            console.log('✅ Deletion complete!');
            window.alert(`${user.name} has been deleted successfully`);
        } catch (error: any) {
            console.error('❌ ERROR deleting user:', error);

            let errorMessage = 'Failed to delete user. ';
            if (error.code === 'permission-denied') {
                errorMessage += 'Permission denied. Check Firestore rules.';
            } else {
                errorMessage += error.message || 'Unknown error';
            }

            window.alert(errorMessage);
        }
    };

    // Filter users by active tab (memoized for performance)
    const filteredUsers = useMemo(() => {
        return users.filter(user => user.role === activeTab);
    }, [users, activeTab]);

    // Count users by role (memoized for tab badges)
    const counts = useMemo(() => ({
        resident: users.filter(u => u.role === 'resident').length,
        security: users.filter(u => u.role === 'security').length,
    }), [users]);

    /**
     * Render a single user card
     * Memoized to prevent unnecessary re-renders
     */
    const renderItem = useCallback(({ item }: { item: UserProfile }) => (
        <Card style={{ ...styles.userCard, marginBottom: spacing.md, padding: spacing.md }}>
            <View style={styles.userInfo}>
                {/* Avatar with first letter */}
                <View style={{
                    ...styles.avatarContainer,
                    backgroundColor: activeTab === 'resident' ? '#E8F5E9' : '#FFF3E0',
                    borderRadius: borderRadius.full,
                    marginRight: spacing.md
                }}>
                    <Text style={{
                        ...styles.avatarText,
                        color: activeTab === 'resident' ? '#2E7D32' : '#EF6C00',
                        fontSize: fontSize.xl
                    }}>
                        {item.name.charAt(0).toUpperCase()}
                    </Text>
                </View>

                {/* User details */}
                <View style={styles.userDetails}>
                    <Text style={{ ...styles.userName, fontSize: fontSize.base }}>
                        {item.name}
                    </Text>
                    <Text style={{ ...styles.userEmail, fontSize: fontSize.sm }}>
                        {item.email}
                    </Text>
                    {item.role === 'resident' && item.houseNo && (
                        <Text style={{ ...styles.userMeta, fontSize: fontSize.xs }}>
                            House: {item.houseNo}
                        </Text>
                    )}
                    {item.role === 'security' && (
                        <Text style={{ ...styles.userMeta, fontSize: fontSize.xs }}>
                            Security Personnel
                        </Text>
                    )}
                </View>

                {/* Delete button */}
                <TouchableOpacity
                    style={{ ...styles.deleteButton, borderRadius: borderRadius.md, padding: spacing.sm }}
                    onPress={() => handleDeleteUser(item)}
                >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
            </View>
        </Card>
    ), [activeTab]);

    const keyExtractor = useCallback((item: UserProfile) => item.uid, []);

    if (loading) {
        return <LoadingSpinner message="Loading users..." />;
    }

    return (
        <View style={styles.container}>
            {/* Header with Create Button */}
            <View style={{ ...styles.header, padding: spacing.lg, paddingBottom: 0 }}>
                <Button
                    title="Create New User"
                    onPress={() => router.push('/(admin)/users/create')}
                    fullWidth
                    style={{ marginBottom: spacing.lg }}
                />

                {/* Tab Navigation */}
                <View style={{
                    ...styles.tabContainer,
                    borderRadius: borderRadius.md,
                    padding: spacing.xs,
                    marginBottom: spacing.sm
                }}>
                    <TouchableOpacity
                        style={{
                            ...styles.tab,
                            ...(activeTab === 'resident' && styles.activeTab),
                            borderRadius: borderRadius.sm,
                            paddingVertical: spacing.sm
                        }}
                        onPress={() => setActiveTab('resident')}
                    >
                        <Text style={{
                            ...styles.tabText,
                            ...(activeTab === 'resident' && styles.activeTabText),
                            fontSize: breakpoint.mobile ? fontSize.sm : fontSize.base
                        }}>
                            Residents ({counts.resident})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={{
                            ...styles.tab,
                            ...(activeTab === 'security' && styles.activeTab),
                            borderRadius: borderRadius.sm,
                            paddingVertical: spacing.sm
                        }}
                        onPress={() => setActiveTab('security')}
                    >
                        <Text style={{
                            ...styles.tabText,
                            ...(activeTab === 'security' && styles.activeTabText),
                            fontSize: breakpoint.mobile ? fontSize.sm : fontSize.base
                        }}>
                            Security ({counts.security})
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Users List - Already uses FlatList for virtualization */}
            <FlatList
                data={filteredUsers}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={{ padding: spacing.lg, paddingTop: spacing.sm }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={{ ...styles.emptyText, fontSize: fontSize.base }}>
                            No {activeTab}s found
                        </Text>
                    </View>
                }
                // Performance optimizations
                removeClippedSubviews
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={8}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA'
    },
    header: {
        backgroundColor: '#F5F7FA'
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#007AFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2
    },
    tabText: {
        fontWeight: '600',
        color: '#666'
    },
    activeTabText: {
        color: '#fff'
    },
    userCard: {
        // Padding and margin handled inline
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    avatarContainer: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        // Other styles handled inline
    },
    avatarText: {
        fontWeight: '700'
    },
    userDetails: {
        flex: 1
    },
    userName: {
        fontWeight: '600',
        color: '#333',
        marginBottom: 2
    },
    userEmail: {
        color: '#666',
        marginBottom: 2
    },
    userMeta: {
        color: '#8E8E93'
    },
    deleteButton: {
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8
    },
    deleteButtonText: {
        fontSize: 20
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center'
    },
    emptyText: {
        color: '#8E8E93'
    }
});
