// Security Gate Entry/Exit Screen
// Camera-ready design with separate Resident and Visitor sections
// Designed for future integration with license plate recognition

import React, { useCallback, useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Button } from '../../src/components/common/Button';
import { Card } from '../../src/components/common/Card';
import { Input } from '../../src/components/common/Input';
import { useAuth } from '../../src/contexts/AuthContext';
import { findActiveVehicle, getActiveVehicles, logVehicleEntry, logVehicleExit } from '../../src/services/VehicleEntryLogService';
import { lookupVehicleByNumber } from '../../src/services/vehicleRegistrationService';
import { RegisteredVehicle, VehicleLog } from '../../src/types';

type TabType = 'resident' | 'visitor' | 'exit';

// Debounce hook for auto-lookup
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

export default function GateEntryScreen() {
    const { userProfile } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('resident');

    // ===== RESIDENT ENTRY STATE =====
    const [residentVehicleNo, setResidentVehicleNo] = useState('');
    const [registeredVehicle, setRegisteredVehicle] = useState<RegisteredVehicle | null>(null);
    const [lookingUp, setLookingUp] = useState(false);
    const [residentLoading, setResidentLoading] = useState(false);
    const [residentError, setResidentError] = useState('');

    // ===== VISITOR ENTRY STATE =====
    const [visitorVehicleNo, setVisitorVehicleNo] = useState('');
    const [visitorName, setVisitorName] = useState('');
    const [visitorPurpose, setVisitorPurpose] = useState('');
    const [visitorHouseNo, setVisitorHouseNo] = useState('');
    const [visitorLoading, setVisitorLoading] = useState(false);

    // ===== EXIT STATE =====
    const [exitVehicleNo, setExitVehicleNo] = useState('');
    const [activeVehicle, setActiveVehicle] = useState<VehicleLog | null>(null);
    const [activeVehiclesList, setActiveVehiclesList] = useState<VehicleLog[]>([]);
    const [searchingExit, setSearchingExit] = useState(false);
    const [exitLoading, setExitLoading] = useState(false);
    const [exitError, setExitError] = useState('');

    // ===== SUCCESS STATE =====
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState({ title: '', subtitle: '' });

    // Debounced values
    const debouncedResidentNo = useDebounce(residentVehicleNo, 400);
    const debouncedExitNo = useDebounce(exitVehicleNo, 400);

    // Load active vehicles count for exit tab
    useEffect(() => {
        if (activeTab === 'exit') {
            loadActiveVehicles();
        }
    }, [activeTab]);

    const loadActiveVehicles = async () => {
        const vehicles = await getActiveVehicles();
        setActiveVehiclesList(vehicles);
    };

    // Auto-lookup for RESIDENT entry
    useEffect(() => {
        const lookupVehicle = async () => {
            setResidentError('');
            if (!debouncedResidentNo || debouncedResidentNo.length < 3) {
                setRegisteredVehicle(null);
                return;
            }
            setLookingUp(true);
            const vehicle = await lookupVehicleByNumber(debouncedResidentNo);
            setLookingUp(false);
            setRegisteredVehicle(vehicle);
            if (!vehicle && debouncedResidentNo.length >= 4) {
                setResidentError('Vehicle not registered. Use Visitor tab for unregistered vehicles.');
            }
        };
        lookupVehicle();
    }, [debouncedResidentNo]);

    // Auto-lookup for EXIT
    useEffect(() => {
        const searchActive = async () => {
            setExitError('');
            if (!debouncedExitNo || debouncedExitNo.length < 3) {
                setActiveVehicle(null);
                return;
            }
            setSearchingExit(true);
            const log = await findActiveVehicle(debouncedExitNo);
            setSearchingExit(false);
            setActiveVehicle(log);
            if (!log && debouncedExitNo.length >= 4) {
                setExitError('Vehicle not found inside');
            }
        };
        searchActive();
    }, [debouncedExitNo]);

    // Reset functions
    const resetResidentForm = useCallback(() => {
        setResidentVehicleNo('');
        setRegisteredVehicle(null);
        setResidentError('');
    }, []);

    const resetVisitorForm = useCallback(() => {
        setVisitorVehicleNo('');
        setVisitorName('');
        setVisitorPurpose('');
        setVisitorHouseNo('');
    }, []);

    const resetExitForm = useCallback(() => {
        setExitVehicleNo('');
        setActiveVehicle(null);
        setExitError('');
    }, []);

    // Show success animation
    const showSuccessAnimation = (title: string, subtitle: string) => {
        setSuccessMessage({ title, subtitle });
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
        }, 1500);
    };

    // ===== RESIDENT ENTRY HANDLER =====
    const handleResidentEntry = async () => {
        if (!registeredVehicle) {
            window.alert('Please enter a registered vehicle number');
            return;
        }
        if (!userProfile) {
            window.alert('Error: User not logged in');
            return;
        }

        setResidentLoading(true);
        try {
            const result = await logVehicleEntry({
                vehicleNo: residentVehicleNo.trim().toUpperCase(),
                type: 'Resident',
                residentId: registeredVehicle.residentId,
                residentName: registeredVehicle.residentName,
                houseNo: registeredVehicle.houseNo
            }, userProfile.uid, userProfile.name);

            setResidentLoading(false);
            if (result.success) {
                showSuccessAnimation('Resident Entry ✅', residentVehicleNo);
                resetResidentForm();
            } else {
                window.alert('Error: ' + (result.error || 'Failed to log entry'));
            }
        } catch (error) {
            setResidentLoading(false);
            window.alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    // ===== VISITOR ENTRY HANDLER =====
    const handleVisitorEntry = async () => {
        if (!visitorVehicleNo.trim()) {
            window.alert('Please enter vehicle number');
            return;
        }
        if (!visitorName.trim()) {
            window.alert('Please enter visitor name');
            return;
        }
        if (!userProfile) {
            window.alert('Error: User not logged in');
            return;
        }

        setVisitorLoading(true);
        try {
            const result = await logVehicleEntry({
                vehicleNo: visitorVehicleNo.trim().toUpperCase(),
                type: 'Visitor',
                visitorName: visitorName.trim(),
                purpose: visitorPurpose.trim() || null,
                houseNo: visitorHouseNo.trim() || undefined
            }, userProfile.uid, userProfile.name);

            setVisitorLoading(false);
            if (result.success) {
                showSuccessAnimation('Visitor Entry ✅', visitorVehicleNo);
                resetVisitorForm();
            } else {
                window.alert('Error: ' + (result.error || 'Failed to log entry'));
            }
        } catch (error) {
            setVisitorLoading(false);
            window.alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    // ===== EXIT HANDLER =====
    const handleExit = async () => {
        if (!activeVehicle?.id) {
            window.alert('No vehicle selected');
            return;
        }
        if (!userProfile) {
            window.alert('Error: User not logged in');
            return;
        }

        setExitLoading(true);
        try {
            const result = await logVehicleExit(activeVehicle.id);
            setExitLoading(false);
            if (result.success) {
                showSuccessAnimation('Exit Logged 👋', exitVehicleNo);
                resetExitForm();
                loadActiveVehicles();
            } else {
                window.alert('Error: ' + (result.error || 'Failed to log exit'));
            }
        } catch (error) {
            setExitLoading(false);
            window.alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const formatTime = (timestamp: any): string => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Success overlay
    if (showSuccess) {
        return (
            <View style={styles.successOverlay}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successText}>{successMessage.title}</Text>
                <Text style={styles.successSubtext}>{successMessage.subtitle}</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>🚗 Gate Control</Text>
                <Text style={styles.headerSubtitle}>Security: {userProfile?.name}</Text>
            </View>

            {/* Tab Bar - 3 Sections */}
            <View style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'resident' && styles.tabActiveGreen]}
                    onPress={() => setActiveTab('resident')}
                >
                    <Text style={styles.tabIcon}>🏠</Text>
                    <Text style={[styles.tabText, activeTab === 'resident' && styles.tabTextActive]}>
                        Resident
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'visitor' && styles.tabActiveOrange]}
                    onPress={() => setActiveTab('visitor')}
                >
                    <Text style={styles.tabIcon}>👤</Text>
                    <Text style={[styles.tabText, activeTab === 'visitor' && styles.tabTextActive]}>
                        Visitor
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'exit' && styles.tabActiveBlue]}
                    onPress={() => setActiveTab('exit')}
                >
                    <Text style={styles.tabIcon}>📤</Text>
                    <Text style={[styles.tabText, activeTab === 'exit' && styles.tabTextActive]}>
                        Exit ({activeVehiclesList.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ===== RESIDENT ENTRY TAB ===== */}
            {activeTab === 'resident' && (
                <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                    {/* Camera Placeholder - For future integration */}
                    <View style={styles.cameraPlaceholder}>
                        <Text style={styles.cameraIcon}>📷</Text>
                        <Text style={styles.cameraText}>Camera feed will appear here</Text>
                        <Text style={styles.cameraSubtext}>Auto-detect license plate</Text>
                    </View>

                    <Card style={styles.entryCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardHeaderIcon}>🏠</Text>
                            <Text style={styles.cardHeaderTitle}>Resident Vehicle Entry</Text>
                        </View>

                        {/* Vehicle Number Input - Large for camera scanning */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>License Plate Number</Text>
                            <Input
                                placeholder="Enter or scan plate (e.g., LEA-1234)"
                                value={residentVehicleNo}
                                onChangeText={(text) => {
                                    setResidentVehicleNo(text.toUpperCase());
                                    setResidentError('');
                                    if (!text) setRegisteredVehicle(null);
                                }}
                                autoCapitalize="characters"
                                containerStyle={styles.inputContainer}
                                style={styles.plateInput}
                            />
                            {lookingUp && <Text style={styles.statusText}>🔍 Verifying...</Text>}

                            {/* Registered Vehicle Found */}
                            {registeredVehicle && (
                                <View style={styles.verifiedBox}>
                                    <View style={styles.verifiedHeader}>
                                        <Text style={styles.verifiedBadge}>✓ VERIFIED</Text>
                                    </View>
                                    <Text style={styles.verifiedName}>{registeredVehicle.residentName}</Text>
                                    <View style={styles.verifiedDetails}>
                                        <Text style={styles.verifiedInfo}>🏠 House {registeredVehicle.houseNo}</Text>
                                        <Text style={styles.verifiedInfo}>🚗 {registeredVehicle.type}</Text>
                                    </View>
                                </View>
                            )}

                            {/* Error - Not Registered */}
                            {residentError && (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>⚠️ {residentError}</Text>
                                </View>
                            )}
                        </View>

                        <Button
                            title={residentLoading ? 'Logging...' : '📥 Allow Entry'}
                            onPress={handleResidentEntry}
                            loading={residentLoading}
                            disabled={!registeredVehicle}
                            fullWidth
                            variant="success"
                            style={styles.actionButton}
                        />
                    </Card>

                    <TouchableOpacity onPress={resetResidentForm} style={styles.resetButton}>
                        <Text style={styles.resetText}>🔄 Clear</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* ===== VISITOR ENTRY TAB ===== */}
            {activeTab === 'visitor' && (
                <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                    {/* Camera Placeholder */}
                    <View style={[styles.cameraPlaceholder, styles.cameraPlaceholderOrange]}>
                        <Text style={styles.cameraIcon}>📷</Text>
                        <Text style={styles.cameraText}>Camera feed will appear here</Text>
                        <Text style={styles.cameraSubtext}>Capture visitor vehicle</Text>
                    </View>

                    <Card style={[styles.entryCard, styles.visitorCard]}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardHeaderIcon}>👤</Text>
                            <Text style={styles.cardHeaderTitle}>Visitor Vehicle Entry</Text>
                        </View>

                        {/* Vehicle Number */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>License Plate Number</Text>
                            <Input
                                placeholder="Enter plate number"
                                value={visitorVehicleNo}
                                onChangeText={(text) => setVisitorVehicleNo(text.toUpperCase())}
                                autoCapitalize="characters"
                                containerStyle={styles.inputContainer}
                                style={styles.plateInput}
                            />
                        </View>

                        {/* Visitor Details */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>Visitor Information</Text>
                            <Input
                                placeholder="Visitor name *"
                                value={visitorName}
                                onChangeText={setVisitorName}
                                containerStyle={styles.inputContainer}
                            />
                            <View style={{ height: 10 }} />
                            <Input
                                placeholder="Visiting house number"
                                value={visitorHouseNo}
                                onChangeText={(text) => setVisitorHouseNo(text.toUpperCase())}
                                autoCapitalize="characters"
                                containerStyle={styles.inputContainer}
                            />
                            <View style={{ height: 10 }} />
                            <Input
                                placeholder="Purpose of visit"
                                value={visitorPurpose}
                                onChangeText={setVisitorPurpose}
                                containerStyle={styles.inputContainer}
                            />
                        </View>

                        <Button
                            title={visitorLoading ? 'Logging...' : '📥 Allow Entry'}
                            onPress={handleVisitorEntry}
                            loading={visitorLoading}
                            disabled={!visitorVehicleNo.trim() || !visitorName.trim()}
                            fullWidth
                            variant="primary"
                            style={[styles.actionButton, styles.visitorButton]}
                        />
                    </Card>

                    <TouchableOpacity onPress={resetVisitorForm} style={styles.resetButton}>
                        <Text style={styles.resetText}>🔄 Clear</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* ===== EXIT TAB ===== */}
            {activeTab === 'exit' && (
                <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                    {/* Camera Placeholder */}
                    <View style={[styles.cameraPlaceholder, styles.cameraPlaceholderBlue]}>
                        <Text style={styles.cameraIcon}>📷</Text>
                        <Text style={styles.cameraText}>Camera feed will appear here</Text>
                        <Text style={styles.cameraSubtext}>Auto-detect exiting vehicle</Text>
                    </View>

                    <Card style={[styles.entryCard, styles.exitCard]}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardHeaderIcon}>📤</Text>
                            <Text style={styles.cardHeaderTitle}>Vehicle Exit</Text>
                        </View>

                        {/* Vehicle Number Input */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>License Plate Number</Text>
                            <Input
                                placeholder="Enter plate to exit"
                                value={exitVehicleNo}
                                onChangeText={(text) => {
                                    setExitVehicleNo(text.toUpperCase());
                                    setExitError('');
                                    if (!text) setActiveVehicle(null);
                                }}
                                autoCapitalize="characters"
                                containerStyle={styles.inputContainer}
                                style={styles.plateInput}
                            />
                            {searchingExit && <Text style={styles.statusText}>🔍 Searching...</Text>}

                            {/* Vehicle Found */}
                            {activeVehicle && (
                                <View style={styles.foundBox}>
                                    <Text style={styles.foundLabel}>✓ FOUND INSIDE</Text>
                                    <Text style={styles.foundVehicleNo}>{activeVehicle.vehicleNo}</Text>
                                    {activeVehicle.residentName && (
                                        <Text style={styles.foundMeta}>
                                            🏠 {activeVehicle.residentName} • House {activeVehicle.houseNo}
                                        </Text>
                                    )}
                                    {activeVehicle.visitorName && (
                                        <Text style={styles.foundMeta}>
                                            👤 {activeVehicle.visitorName}
                                            {activeVehicle.purpose && ` • ${activeVehicle.purpose}`}
                                        </Text>
                                    )}
                                    <Text style={styles.foundTime}>
                                        ⏰ Entry: {formatTime(activeVehicle.entryTime)}
                                    </Text>
                                </View>
                            )}

                            {/* Error */}
                            {exitError && (
                                <View style={styles.errorBox}>
                                    <Text style={styles.errorText}>⚠️ {exitError}</Text>
                                </View>
                            )}
                        </View>

                        <Button
                            title={exitLoading ? 'Processing...' : '📤 Confirm Exit'}
                            onPress={handleExit}
                            loading={exitLoading}
                            disabled={!activeVehicle}
                            fullWidth
                            variant="primary"
                            style={styles.actionButton}
                        />
                    </Card>

                    {/* Active Vehicles Count */}
                    <View style={styles.statsBar}>
                        <Text style={styles.statsText}>
                            🚗 {activeVehiclesList.length} vehicles currently inside
                        </Text>
                    </View>

                    <TouchableOpacity onPress={resetExitForm} style={styles.resetButton}>
                        <Text style={styles.resetText}>🔄 Clear</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0f1a' },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff' },
    headerSubtitle: { fontSize: 13, color: '#6b6b8a', marginTop: 2 },

    // Tab Bar
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: '#1a1a2e',
        borderRadius: 16,
        padding: 6
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12
    },
    tabActiveGreen: { backgroundColor: '#10b981' },
    tabActiveOrange: { backgroundColor: '#f59e0b' },
    tabActiveBlue: { backgroundColor: '#3b82f6' },
    tabIcon: { fontSize: 20, marginBottom: 4 },
    tabText: { fontSize: 12, fontWeight: '600', color: '#6b6b8a' },
    tabTextActive: { color: '#fff' },

    scroll: { flex: 1 },
    content: { padding: 16, paddingBottom: 40 },

    // Camera Placeholder - for future integration
    cameraPlaceholder: {
        height: 120,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    cameraPlaceholderOrange: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    cameraPlaceholderBlue: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    cameraIcon: { fontSize: 32, marginBottom: 8 },
    cameraText: { fontSize: 14, color: '#6b6b8a', fontWeight: '500' },
    cameraSubtext: { fontSize: 11, color: '#4a4a6a', marginTop: 2 },

    // Entry Cards
    entryCard: {
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    visitorCard: {
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    exitCard: {
        borderColor: 'rgba(59, 130, 246, 0.2)',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    cardHeaderIcon: { fontSize: 28, marginRight: 12 },
    cardHeaderTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },

    section: { marginBottom: 20 },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#6b6b8a',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    inputContainer: { marginBottom: 0 },
    plateInput: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 2,
        textAlign: 'center',
    },
    statusText: { marginTop: 10, fontSize: 13, color: '#6b6b8a', textAlign: 'center' },

    // Verified Box (Resident found)
    verifiedBox: {
        marginTop: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.4)'
    },
    verifiedHeader: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    verifiedBadge: {
        backgroundColor: '#10b981',
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    verifiedName: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 },
    verifiedDetails: { flexDirection: 'row', gap: 16 },
    verifiedInfo: { fontSize: 13, color: '#10b981' },

    // Found Box (Exit)
    foundBox: {
        marginTop: 16,
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.4)'
    },
    foundLabel: {
        backgroundColor: '#3b82f6',
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    foundVehicleNo: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
    foundMeta: { fontSize: 13, color: '#93c5fd', marginBottom: 4 },
    foundTime: { fontSize: 12, color: '#6b6b8a', marginTop: 4 },

    // Error Box
    errorBox: {
        marginTop: 16,
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)'
    },
    errorText: { fontSize: 13, color: '#ef4444', textAlign: 'center' },

    // Buttons
    actionButton: { marginTop: 8, paddingVertical: 16, borderRadius: 14 },
    visitorButton: { backgroundColor: '#f59e0b' },
    resetButton: { alignItems: 'center', paddingVertical: 12 },
    resetText: { fontSize: 14, color: '#6b6b8a' },

    // Stats Bar
    statsBar: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    statsText: { fontSize: 13, color: '#93c5fd' },

    // Success Overlay
    successOverlay: {
        flex: 1,
        backgroundColor: '#0f0f1a',
        justifyContent: 'center',
        alignItems: 'center'
    },
    successIcon: { fontSize: 100, marginBottom: 24 },
    successText: { fontSize: 32, fontWeight: '800', color: '#10b981' },
    successSubtext: { fontSize: 20, color: '#6b6b8a', marginTop: 8, letterSpacing: 2 },
});
