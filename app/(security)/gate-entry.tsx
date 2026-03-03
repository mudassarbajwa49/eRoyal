// Security Gate Entry/Exit Screen
// Camera-ready design with separate Resident and Visitor sections
// expo-camera integrated for live feed + scan-to-fill license plate
// All vehicle data is live via SecurityDataContext — no getDocs() round-trips

import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
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
import { useSecurityData } from '../../src/contexts/SecurityDataContext';

import { logVehicleEntry, logVehicleExit } from '../../src/services/VehicleEntryLogService';
import { detectLicensePlate } from '../../src/services/ocrService';
import { normalizeVehicleNumber } from '../../src/services/vehicleRegistrationService';
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
    // Live data from SecurityDataContext — onSnapshot keeps these current automatically
    const { activeVehicles: activeVehiclesList, registeredVehicles } = useSecurityData();

    const [activeTab, setActiveTab] = useState<TabType>('resident');

    // ===== CAMERA STATE =====
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);

    // ===== RESIDENT ENTRY STATE =====
    const [residentVehicleNo, setResidentVehicleNo] = useState('');
    const [registeredVehicle, setRegisteredVehicle] = useState<RegisteredVehicle | null>(null);
    const [residentLoading, setResidentLoading] = useState(false);
    const [residentError, setResidentError] = useState('');

    // ===== VISITOR ENTRY STATE =====
    const [visitorVehicleNo, setVisitorVehicleNo] = useState('');
    const [visitorName, setVisitorName] = useState('');
    const [visitorPurpose, setVisitorPurpose] = useState('');
    const [visitorHouseNo, setVisitorHouseNo] = useState('');
    const [visitorLoading, setVisitorLoading] = useState(false);
    const [visitorRegisteredVehicle, setVisitorRegisteredVehicle] = useState<RegisteredVehicle | null>(null);

    // ===== EXIT STATE =====
    const [exitVehicleNo, setExitVehicleNo] = useState('');
    const [activeVehicle, setActiveVehicle] = useState<VehicleLog | null>(null);
    const [exitLoading, setExitLoading] = useState(false);
    const [exitError, setExitError] = useState('');

    // ===== OCR SCAN STATE =====
    const [scanning, setScanning] = useState(false);

    // ===== SUCCESS STATE =====
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState({ title: '', subtitle: '' });

    // Debounced values — 250 ms for snappy feel
    const debouncedResidentNo = useDebounce(residentVehicleNo, 250);
    const debouncedVisitorNo = useDebounce(visitorVehicleNo, 250);
    const debouncedExitNo = useDebounce(exitVehicleNo, 250);

    // Request camera permission on mount
    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, []);

    // ── In-memory plate lookup (instant — no Firestore round-trip) ────────────
    const lookupPlateInMemory = useCallback((plate: string): RegisteredVehicle | null => {
        if (!plate || plate.length < 3) return null;
        const normalized = plate.trim().toUpperCase();
        return registeredVehicles.find(v => v.vehicleNo === normalized) ?? null;
    }, [registeredVehicles]);

    // Auto-lookup for RESIDENT entry — purely in-memory
    useEffect(() => {
        setResidentError('');
        if (!debouncedResidentNo || debouncedResidentNo.length < 3) {
            setRegisteredVehicle(null);
            return;
        }
        const vehicle = lookupPlateInMemory(debouncedResidentNo);
        setRegisteredVehicle(vehicle);
        if (!vehicle && debouncedResidentNo.length >= 4) {
            setResidentError('Vehicle not registered. Use Visitor tab for unregistered vehicles.');
        }
    }, [debouncedResidentNo, lookupPlateInMemory]);

    // Auto-lookup for VISITOR — warn if plate belongs to a registered resident
    useEffect(() => {
        if (!debouncedVisitorNo || debouncedVisitorNo.length < 3) {
            setVisitorRegisteredVehicle(null);
            return;
        }
        setVisitorRegisteredVehicle(lookupPlateInMemory(debouncedVisitorNo));
    }, [debouncedVisitorNo, lookupPlateInMemory]);

    // Auto-lookup for EXIT — search active vehicles in-memory
    useEffect(() => {
        setExitError('');
        if (!debouncedExitNo || debouncedExitNo.length < 3) {
            setActiveVehicle(null);
            return;
        }
        const normalized = debouncedExitNo.trim().toUpperCase();
        const log = activeVehiclesList.find(v => v.vehicleNo === normalized) ?? null;
        setActiveVehicle(log);
        if (!log && debouncedExitNo.length >= 4) {
            setExitError('Vehicle not found inside');
        }
    }, [debouncedExitNo, activeVehiclesList]);

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
        setVisitorRegisteredVehicle(null);
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

    // ===== CAMERA SCAN LOGIC =====

    // Fill whichever tab is active with a detected/typed plate number.
    const fillPlate = (normalized: string) => {
        if (activeTab === 'resident') {
            setResidentVehicleNo(normalized);
            setResidentError('');
            setRegisteredVehicle(null);
        } else if (activeTab === 'visitor') {
            setVisitorVehicleNo(normalized);
            setVisitorRegisteredVehicle(null);
        } else {
            setExitVehicleNo(normalized);
            setExitError('');
            setActiveVehicle(null);
        }
    };

    // Manual fallback — cross-platform (Alert.prompt is iOS-only).
    const promptManual = () => {
        if (Platform.OS === 'ios') {
            Alert.prompt(
                '✏️ Enter License Plate',
                'Type the plate number (e.g. LEA-1234)',
                (text) => {
                    if (!text || !text.trim()) return;
                    fillPlate(normalizeVehicleNumber(text.trim().toUpperCase()));
                },
                'plain-text',
                '',
                'default'
            );
        } else {
            // Android / Web: plate field is visible on screen — just tell guard to type it.
            Alert.alert(
                '📷 OCR could not read the plate',
                'Please type the license plate number in the field below.',
                [{ text: 'OK' }]
            );
        }
    };

    // Primary handler — capture photo → OCR → auto-fill or fall back to manual.
    const handleOcrScan = async () => {
        if (!cameraRef.current || scanning) return;
        setScanning(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.85,
                skipProcessing: true,
            });
            if (!photo?.uri) throw new Error('No photo captured');

            const plate = await detectLicensePlate(photo.uri);

            if (plate) {
                fillPlate(normalizeVehicleNumber(plate));
            } else {
                // OCR found nothing — let the guard type it manually
                promptManual();
            }
        } catch (err) {
            console.warn('[OCR] scan failed, falling back to manual:', err);
            promptManual();
        } finally {
            setScanning(false);
        }
    };

    // ===== REUSABLE CAMERA SECTION =====
    const CameraSection = ({ accentColor }: { accentColor: string }) => {
        if (!permission) {
            // Permissions still loading
            return (
                <View style={[styles.cameraContainer, { borderColor: accentColor + '55' }]}>
                    <Text style={styles.cameraStatusText}>Loading camera...</Text>
                </View>
            );
        }

        if (!permission.granted) {
            return (
                <View style={[styles.cameraContainer, { borderColor: accentColor + '55' }]}>
                    <Text style={styles.cameraIcon}>📷</Text>
                    <Text style={styles.cameraText}>Camera permission required</Text>
                    <TouchableOpacity style={[styles.permissionButton, { backgroundColor: accentColor }]} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={[styles.cameraContainer, { borderColor: accentColor + '55' }]}>
                {/* Live camera feed – no children allowed by expo-camera */}
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing="back"
                />

                {/* Scan guideline overlay – absolutely positioned over the camera */}
                <View style={styles.cameraOverlay} pointerEvents="none">
                    <Text style={styles.cameraHint}>Point at license plate</Text>
                    <View style={[styles.scanGuideline, { borderColor: accentColor }]}>
                        <View style={[styles.corner, styles.cornerTL, { borderColor: accentColor }]} />
                        <View style={[styles.corner, styles.cornerTR, { borderColor: accentColor }]} />
                        <View style={[styles.corner, styles.cornerBL, { borderColor: accentColor }]} />
                        <View style={[styles.corner, styles.cornerBR, { borderColor: accentColor }]} />
                    </View>
                </View>

                {/* Scan / Manual button – absolutely positioned at bottom */}
                <TouchableOpacity
                    style={[styles.scanButton, { backgroundColor: accentColor }, scanning && styles.scanButtonDisabled]}
                    onPress={handleOcrScan}
                    activeOpacity={0.8}
                    disabled={scanning}
                >
                    <Text style={styles.scanButtonText}>
                        {scanning ? '⏳  Scanning...' : '📷  Scan Plate'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
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
                // activeVehiclesList updates automatically via SecurityDataContext onSnapshot
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
                    {/* Live Camera – Resident (green accent) */}
                    <CameraSection accentColor="#10b981" />

                    <Card style={styles.entryCard}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardHeaderIcon}>🏠</Text>
                            <Text style={styles.cardHeaderTitle}>Resident Vehicle Entry</Text>
                        </View>

                        {/* Vehicle Number Input */}
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
                    {/* Live Camera – Visitor (orange accent) */}
                    <CameraSection accentColor="#f59e0b" />

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
                                onChangeText={(text) => {
                                    setVisitorVehicleNo(text.toUpperCase());
                                    setVisitorRegisteredVehicle(null);
                                }}
                                autoCapitalize="characters"
                                containerStyle={styles.inputContainer}
                                style={styles.plateInput}
                            />

                            {/* Warning – this plate belongs to a registered resident */}
                            {visitorRegisteredVehicle && (
                                <View style={styles.residentWarningBox}>
                                    <Text style={styles.residentWarningTitle}>⚠️ Registered Resident Vehicle</Text>
                                    <Text style={styles.residentWarningName}>{visitorRegisteredVehicle.residentName}</Text>
                                    <View style={styles.residentWarningDetails}>
                                        <Text style={styles.residentWarningInfo}>🏠 House {visitorRegisteredVehicle.houseNo}</Text>
                                        <Text style={styles.residentWarningInfo}>🚗 {visitorRegisteredVehicle.type}</Text>
                                    </View>
                                    <Text style={styles.residentWarningHint}>
                                        Use the Resident tab for registered vehicles.
                                    </Text>
                                </View>
                            )}
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
                    {/* Live Camera – Exit (blue accent) */}
                    <CameraSection accentColor="#3b82f6" />

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

    // ===== CAMERA STYLES =====
    cameraContainer: {
        height: 230,
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#0a0a14',
        borderWidth: 1.5,
    },
    camera: {
        ...StyleSheet.absoluteFillObject,
    },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    cameraHint: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    scanGuideline: {
        width: '78%',
        height: 58,
        borderWidth: 1.5,
        borderRadius: 8,
        position: 'relative',
    },
    // Corner accent marks
    corner: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderColor: 'inherit',
    },
    cornerTL: { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 5 },
    cornerTR: { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 5 },
    cornerBL: { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 5 },
    cornerBR: { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 5 },
    scanButton: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 13,
        alignItems: 'center',
    },
    scanButtonDisabled: { opacity: 0.55 },
    scanButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    cameraStatusText: { color: '#6b6b8a', fontSize: 14 },
    cameraIcon: { fontSize: 32, marginBottom: 10 },
    cameraText: { fontSize: 14, color: '#6b6b8a', fontWeight: '500', marginBottom: 14 },
    permissionButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    permissionButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

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
        color: '#ffffff',
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

    // Resident Warning Box (shown in Visitor tab if plate is registered)
    residentWarningBox: {
        marginTop: 16,
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(245, 158, 11, 0.5)',
    },
    residentWarningTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#f59e0b',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    residentWarningName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    residentWarningDetails: { flexDirection: 'row', gap: 14, marginBottom: 10 },
    residentWarningInfo: { fontSize: 13, color: '#fbbf24' },
    residentWarningHint: {
        fontSize: 12,
        color: 'rgba(251,191,36,0.75)',
        fontStyle: 'italic',
    },

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
