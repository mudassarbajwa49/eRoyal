// Security Gate Entry Screen
// Log vehicle entry with resident verification

import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../src/components/common/Button';
import { Card } from '../../src/components/common/Card';
import { Input } from '../../src/components/common/Input';
import { useAuth } from '../../src/contexts/AuthContext';
import { logVehicleEntry, searchResidentByHouse } from '../../src/services/VehicleEntryLogService';
import { VehicleType } from '../../src/types';

export default function GateEntryScreen() {
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [vehicleType, setVehicleType] = useState<VehicleType>('Resident');
    const [vehicleNo, setVehicleNo] = useState('');
    const [houseNo, setHouseNo] = useState('');
    const [residentInfo, setResidentInfo] = useState<any>(null);
    const [visitorName, setVisitorName] = useState('');
    const [visitorPurpose, setVisitorPurpose] = useState('');
    const [searchingResident, setSearchingResident] = useState(false);

    const handleSearchResident = async () => {
        if (!houseNo.trim()) {
            Alert.alert('Error', 'Please enter house number');
            return;
        }

        setSearchingResident(true);
        const resident = await searchResidentByHouse(houseNo);
        setSearchingResident(false);

        if (resident) {
            setResidentInfo(resident);
            Alert.alert('Resident Found', `${resident.name}\nHouse: ${resident.houseNo}`);
        } else {
            setResidentInfo(null);
            Alert.alert('Not Found', 'No resident found for this house number');
        }
    };

    const handleLogEntry = async () => {
        if (!vehicleNo.trim()) {
            Alert.alert('Error', 'Please enter vehicle number');
            return;
        }

        if (vehicleType === 'Resident') {
            if (!residentInfo) {
                Alert.alert('Error', 'Please search and verify resident first');
                return;
            }
        } else if (vehicleType === 'Visitor') {
            if (!visitorName.trim()) {
                Alert.alert('Error', 'Please enter visitor name');
                return;
            }
        }

        setLoading(true);

        const vehicleData = {
            vehicleNo: vehicleNo.trim(),
            type: vehicleType,
            ...(vehicleType === 'Resident' && residentInfo
                ? {
                    residentId: residentInfo.uid,
                    residentName: residentInfo.name,
                    houseNo: residentInfo.houseNo
                }
                : {}),
            ...(vehicleType === 'Visitor'
                ? {
                    visitorName: visitorName.trim(),
                    purpose: visitorPurpose.trim() || null
                }
                : {})
        };

        const result = await logVehicleEntry(vehicleData, userProfile!.uid, userProfile!.name);

        setLoading(false);

        if (result.success) {
            Alert.alert(
                'Success',
                `Vehicle ${vehicleNo} entry logged successfully`,
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Reset form
                            setVehicleNo('');
                            setHouseNo('');
                            setResidentInfo(null);
                            setVisitorName('');
                            setVisitorPurpose('');
                            setVehicleType('Resident');
                        }
                    }
                ]
            );
        } else {
            Alert.alert('Error', result.error || 'Failed to log entry');
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView style={styles.content}>
                {/* Welcome Card */}
                <Card style={styles.welcomeCard}>
                    <Text style={styles.welcomeText}>Security Panel</Text>
                    <Text style={styles.userName}>{userProfile?.name}</Text>
                </Card>

                {/* Vehicle Type Selection */}
                <Card>
                    <Text style={styles.sectionTitle}>Vehicle Type</Text>
                    <View style={styles.typeButtons}>
                        {(['Resident', 'Visitor', 'Service'] as VehicleType[]).map((type) => (
                            <Button
                                key={type}
                                title={type}
                                onPress={() => {
                                    setVehicleType(type);
                                    setResidentInfo(null);
                                    setHouseNo('');
                                }}
                                variant={vehicleType === type ? 'primary' : 'secondary'}
                                style={styles.typeButton}
                            />
                        ))}
                    </View>
                </Card>

                {/* Vehicle Number */}
                <Card>
                    <Input
                        label="Vehicle Number"
                        placeholder="e.g., LEA-1234"
                        value={vehicleNo}
                        onChangeText={setVehicleNo}
                        autoCapitalize="characters"
                        required
                    />
                </Card>

                {/* Resident Verification */}
                {vehicleType === 'Resident' && (
                    <Card>
                        <Text style={styles.sectionTitle}>Verify Resident</Text>

                        <View style={styles.searchContainer}>
                            <Input
                                label="House Number"
                                placeholder="e.g., A-12"
                                value={houseNo}
                                onChangeText={setHouseNo}
                                autoCapitalize="characters"
                                containerStyle={styles.searchInput}
                                required
                            />
                            <Button
                                title="Search"
                                onPress={handleSearchResident}
                                loading={searchingResident}
                                style={styles.searchButton}
                            />
                        </View>

                        {residentInfo && (
                            <View style={styles.residentInfo}>
                                <Text style={styles.infoLabel}>✓ Resident Verified</Text>
                                <Text style={styles.infoText}>{residentInfo.name}</Text>
                                <Text style={styles.infoSubtext}>House: {residentInfo.houseNo}</Text>
                            </View>
                        )}
                    </Card>
                )}

                {/* Visitor Details */}
                {vehicleType === 'Visitor' && (
                    <Card>
                        <Text style={styles.sectionTitle}>Visitor Details</Text>

                        <Input
                            label="Visitor Name"
                            placeholder="Enter visitor name"
                            value={visitorName}
                            onChangeText={setVisitorName}
                            required
                        />

                        <Input
                            label="Purpose (Optional)"
                            placeholder="e.g., Meeting resident A-12"
                            value={visitorPurpose}
                            onChangeText={setVisitorPurpose}
                        />
                    </Card>
                )}

                {/* Log Entry Button */}
                <Card>
                    <Button
                        title="Log Entry"
                        onPress={handleLogEntry}
                        loading={loading}
                        fullWidth
                        variant="success"
                    />
                </Card>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA'
    },
    content: {
        padding: 16
    },
    welcomeCard: {
        backgroundColor: '#FF9500'
    },
    welcomeText: {
        fontSize: 16,
        color: '#fff',
        marginBottom: 4
    },
    userName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff'
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12
    },
    typeButtons: {
        flexDirection: 'row',
        gap: 8
    },
    typeButton: {
        flex: 1
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12
    },
    searchInput: {
        flex: 1,
        marginBottom: 0
    },
    searchButton: {
        marginBottom: 16,
        paddingHorizontal: 20
    },
    residentInfo: {
        backgroundColor: '#E8F5E9',
        padding: 16,
        borderRadius: 8,
        marginTop: 12
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#2E7D32',
        marginBottom: 8
    },
    infoText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4
    },
    infoSubtext: {
        fontSize: 14,
        color: '#666'
    }
});
