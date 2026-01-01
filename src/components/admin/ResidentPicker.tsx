// Resident Picker Component
// Specialized dropdown for selecting residents in admin screens

import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { UserProfile } from '../../types';

interface ResidentPickerProps {
    selectedResident: UserProfile | null;
    onSelectResident: (resident: UserProfile | null) => void;
    placeholder?: string;
    error?: string;
}

export const ResidentPicker: React.FC<ResidentPickerProps> = ({
    selectedResident,
    onSelectResident,
    placeholder = 'Select a resident',
    error
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [residents, setResidents] = useState<UserProfile[]>([]);
    const [filteredResidents, setFilteredResidents] = useState<UserProfile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadResidents();
    }, []);

    useEffect(() => {
        filterResidents();
    }, [searchQuery, residents]);

    const loadResidents = async () => {
        setLoading(true);
        const data = await getAllUsers();
        const residents = data.filter((user: UserProfile) => user.role === 'resident');
        setResidents(residents);
        setFilteredResidents(residents);
        setLoading(false);
    };

    const filterResidents = () => {
        if (!searchQuery.trim()) {
            setFilteredResidents(residents);
            return;
        }

        const lowerQuery = searchQuery.toLowerCase();
        const filtered = residents.filter(resident =>
            resident.name?.toLowerCase().includes(lowerQuery) ||
            resident.houseNo?.toLowerCase().includes(lowerQuery) ||
            resident.email?.toLowerCase().includes(lowerQuery)
        );
        setFilteredResidents(filtered);
    };

    const handleSelectResident = (resident: UserProfile) => {
        onSelectResident(resident);
        setModalVisible(false);
        setSearchQuery('');
    };

    const renderResidentItem = ({ item }: { item: UserProfile }) => (
        <TouchableOpacity
            style={styles.residentItem}
            onPress={() => handleSelectResident(item)}
        >
            <View style={styles.residentInfo}>
                <Text style={styles.residentName}>{item.name}</Text>
                <Text style={styles.residentDetails}>
                    House: {item.houseNo} • {item.email}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Select Resident *</Text>

            <TouchableOpacity
                style={[styles.selector, error && styles.selectorError]}
                onPress={() => setModalVisible(true)}
            >
                {selectedResident ? (
                    <View>
                        <Text style={styles.selectedName}>{selectedResident.name}</Text>
                        <Text style={styles.selectedDetails}>
                            House: {selectedResident.houseNo} • {selectedResident.email}
                        </Text>
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
                            <Text style={styles.modalTitle}>Select Resident</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by name, house, or email..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />

                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#007AFF" />
                                <Text style={styles.loadingText}>Loading residents...</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={filteredResidents}
                                renderItem={renderResidentItem}
                                keyExtractor={(item) => item.uid}
                                style={styles.residentList}
                                ListEmptyComponent={
                                    <View style={styles.emptyState}>
                                        <Text style={styles.emptyText}>
                                            {searchQuery ? 'No residents found' : 'No residents available'}
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
    residentList: {
        maxHeight: 400,
    },
    residentItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    residentInfo: {},
    residentName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    residentDetails: {
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
