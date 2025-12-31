// User Selector Component
// Generic dropdown for selecting users by role

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getUsersByRole } from '../../services/userService';
import { UserProfile, UserRole } from '../../types';

interface UserSelectorProps {
    role: UserRole;
    selectedUser: UserProfile | null;
    onSelectUser: (user: UserProfile | null) => void;
    placeholder?: string;
    error?: string;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
    role,
    selectedUser,
    onSelectUser,
    placeholder = 'Select a user',
    error
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadUsers();
    }, [role]);

    useEffect(() => {
        filterUsers();
    }, [searchQuery, users]);

    const loadUsers = async () => {
        setLoading(true);
        const data = await getUsersByRole(role);
        setUsers(data);
        setFilteredUsers(data);
        setLoading(false);
    };

    const filterUsers = () => {
        if (!searchQuery.trim()) {
            setFilteredUsers(users);
            return;
        }

        const lowerQuery = searchQuery.toLowerCase();
        const filtered = users.filter(user =>
            user.name?.toLowerCase().includes(lowerQuery) ||
            user.email?.toLowerCase().includes(lowerQuery) ||
            (user.houseNo && user.houseNo.toLowerCase().includes(lowerQuery))
        );
        setFilteredUsers(filtered);
    };

    const handleSelectUser = (user: UserProfile) => {
        onSelectUser(user);
        setModalVisible(false);
        setSearchQuery('');
    };

    const getRoleLabel = (role: UserRole): string => {
        switch (role) {
            case 'resident': return 'Residents';
            case 'admin': return 'Admins';
            case 'security': return 'Security Staff';
            default: return 'Users';
        }
    };

    const renderUserItem = ({ item }: { item: UserProfile }) => (
        <TouchableOpacity
            style={styles.userItem}
            onPress={() => handleSelectUser(item)}
        >
            <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text style={styles.userDetails}>
                    {item.houseNo ? `House: ${item.houseNo} • ` : ''}{item.email}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Select {getRoleLabel(role).slice(0, -1)}</Text>

            <TouchableOpacity
                style={[styles.selector, error && styles.selectorError]}
                onPress={() => setModalVisible(true)}
            >
                {selectedUser ? (
                    <View>
                        <Text style={styles.selectedName}>{selectedUser.name}</Text>
                        <Text style={styles.selectedDetails}>{selectedUser.email}</Text>
                    </View>
                ) : (
                    <Text style={styles.placeholder}>{placeholder}</Text>
                )}
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select {getRoleLabel(role).slice(0, -1)}</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#007AFF" />
                                <Text style={styles.loadingText}>Loading {getRoleLabel(role).toLowerCase()}...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={filteredUsers}
                                renderItem={renderUserItem}
                                keyExtractor={(item) => item.uid}
                                style={styles.userList}
                                ListEmptyComponent={
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyText}>
                                            {searchQuery ? 'No users found' : `No ${getRoleLabel(role).toLowerCase()} available`}
                                        </Text>
                                    </View>
                                }
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    selector: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 16,
        minHeight: 60,
        justifyContent: 'center',
    },
    selectorError: {
        borderColor: '#FF3B30',
    },
    placeholder: {
        color: '#999',
        fontSize: 16,
    },
    selectedName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    selectedDetails: {
        fontSize: 14,
        color: '#666',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        color: '#666',
    },
    searchInput: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 16,
    },
    userList: {
        maxHeight: 400,
    },
    userItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    userInfo: {},
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    userDetails: {
        fontSize: 14,
        color: '#666',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
    },
});
