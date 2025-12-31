// User Management Index (Admin)
// Navigate to create user screen and view existing users

// Navigate to create user screen and view existing users

import { useRouter } from 'expo-router';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../../firebaseConfig';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { LoadingSpinner } from '../../../src/components/common/LoadingSpinner';
import { UserProfile } from '../../../src/types';

export default function UsersIndex() {
    const router = useRouter();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'resident' | 'security'>('resident');

    // Real-time Firestore listeners for automatic updates
    useEffect(() => {
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

        // Cleanup listeners on unmount
        return () => {
            console.log('🧹 Cleaning up user listeners');
            unsubscribeCallbacks.forEach(unsub => unsub());
        };
    }, []);

    // Helper to merge user data from different collections
    const updateUsers = (newData: UserProfile[], source: string) => {
        setUsers(prevUsers => {
            // Remove users from this source
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

    const onRefresh = async () => {
        setRefreshing(true);
        // Data refreshes automatically via listeners, just show the animation
        setTimeout(() => setRefreshing(false), 500);
    };

    const handleDeleteUser = async (user: UserProfile) => {
        // Web-compatible confirmation
        const confirmed = window.confirm(
            `Are you sure you want to delete ${user.name}?\n\nThis action cannot be undone and will:\n• Remove user from database\n• Delete all user data`
        );

        if (!confirmed) return;

        console.log('🗑️ Starting deletion for user:', user);

        try {
            const { deleteDoc, doc } = await import('firebase/firestore');

            // Get collection name based on role
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

            // Also delete from backup 'users' collection
            try {
                await deleteDoc(doc(db, 'users', user.uid));
                console.log('✅ Successfully deleted from users backup');
            } catch (e) {
                console.log('ℹ️ No backup user doc to delete (this is okay)');
            }

            // Show success message
            console.log('✅ Deletion complete!');
            window.alert(`${user.name} has been deleted successfully`);
        } catch (error: any) {
            console.error('❌ ERROR deleting user:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);

            let errorMessage = 'Failed to delete user. ';
            if (error.code === 'permission-denied') {
                errorMessage += 'Permission denied. Check Firestore rules.';
            } else {
                errorMessage += error.message || 'Unknown error';
            }

            window.alert(errorMessage);
        }
    };

    const filteredUsers = users.filter(user => user.role === activeTab);

    const renderItem = ({ item }: { item: UserProfile }) => (
        <Card style={styles.userCard}>
            <View style={styles.userInfo}>
                <View style={[styles.avatarContainer, { backgroundColor: activeTab === 'resident' ? '#E8F5E9' : '#FFF3E0' }]}>
                    <Text style={[styles.avatarText, { color: activeTab === 'resident' ? '#2E7D32' : '#EF6C00' }]}>
                        {item.name.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={styles.userDetails}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userEmail}>{item.email}</Text>
                    {item.role === 'resident' && item.houseNo && (
                        <Text style={styles.userMeta}>House: {item.houseNo}</Text>
                    )}
                    {item.role === 'security' && (
                        <Text style={styles.userMeta}>Security Personnel</Text>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteUser(item)}
                >
                    <Text style={styles.deleteButtonText}>🗑️</Text>
                </TouchableOpacity>
            </View>
        </Card>
    );

    if (loading) {
        return <LoadingSpinner message="Loading users..." />;
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Button
                    title="Create New User"
                    onPress={() => router.push('/(admin)/users/create')}
                    fullWidth
                    style={styles.createButton}
                />

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'resident' && styles.activeTab]}
                        onPress={() => setActiveTab('resident')}
                    >
                        <Text style={[styles.tabText, activeTab === 'resident' && styles.activeTabText]}>
                            Residents ({users.filter(u => u.role === 'resident').length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'security' && styles.activeTab]}
                        onPress={() => setActiveTab('security')}
                    >
                        <Text style={[styles.tabText, activeTab === 'security' && styles.activeTabText]}>
                            Security ({users.filter(u => u.role === 'security').length})
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={filteredUsers}
                renderItem={renderItem}
                keyExtractor={(item) => item.uid}
                contentContainerStyle={styles.listContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            No {activeTab}s found
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
        backgroundColor: '#F5F7FA'
    },
    header: {
        padding: 16,
        paddingBottom: 0,
        backgroundColor: '#F5F7FA'
    },
    createButton: {
        marginBottom: 16
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 4,
        marginBottom: 8
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6
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
        fontSize: 14,
        fontWeight: '600',
        color: '#666'
    },
    activeTabText: {
        color: '#fff'
    },
    listContent: {
        padding: 16,
        paddingTop: 8
    },
    userCard: {
        marginBottom: 12,
        padding: 12
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700'
    },
    userDetails: {
        flex: 1
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2
    },
    userMeta: {
        fontSize: 12,
        color: '#8E8E93'
    },
    deleteButton: {
        padding: 8,
        marginLeft: 8,
        borderRadius: 8,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center'
    },
    deleteButtonText: {
        fontSize: 20
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
