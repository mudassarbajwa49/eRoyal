// Security Gate Entry/Exit Screen
// Camera-ready design with separate Resident and Visitor sections
// expo-camera integrated for live feed + scan-to-fill license plate
// All vehicle data is live via SecurityDataContext — no getDocs() round-trips

import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Image,
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

import { logVehicleEntry, logVehicleExit, uploadEntryPhoto } from '../../src/services/VehicleEntryLogService';
// import { detectLicensePlate } from '../../src/services/ocrService'; // OCR disabled — re-enable when Vision API is configured
// import { normalizeVehicleNumber } from '../../src/services/vehicleRegistrationService'; // OCR disabled
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

// ─── CameraSection ────────────────────────────────────────────────────────────
// Defined OUTSIDE the main screen component so its identity is stable across
// re-renders. Defining it inside would cause React to see a brand-new component
// type on every keystroke, unmounting + remounting CameraView → causing blink.

interface CameraSectionProps {
    accentColor: string;
    permission: { granted: boolean } | null;
    requestPermission: () => void;
    cameraRef: React.RefObject<CameraView | null>;
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    capturedUri: string | null;
    setCapturedUri: React.Dispatch<React.SetStateAction<string | null>>;
    capturing: boolean;
    onCapture: () => void;
}

function CameraSection({
    accentColor, permission, requestPermission, cameraRef,
    zoom, setZoom, capturedUri, setCapturedUri, capturing, onCapture,
}: CameraSectionProps) {
    if (!permission) {
        return (
            <View style={styles.cameraContainer}>
                <Text style={styles.cameraStatusText}>Loading camera...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={[styles.cameraContainer, { borderColor: accentColor + '55' }]}>
                <Text style={styles.cameraIcon}>📷</Text>
                <Text style={styles.cameraText}>Camera permission required</Text>
                <TouchableOpacity
                    style={[styles.permissionButton, { backgroundColor: accentColor }]}
                    onPress={requestPermission}
                >
                    <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Preview mode — captured photo shown with Retake / Use This
    if (capturedUri) {
        return (
            <View style={[styles.cameraContainer, { borderColor: accentColor + '99' }]}>
                <Image source={{ uri: capturedUri }} style={styles.camera} resizeMode="cover" />
                <View style={styles.previewOverlay}>
                    <View style={[styles.previewBadge, { backgroundColor: accentColor + 'dd' }]}>
                        <Text style={styles.previewBadgeText}>📸 CAPTURED</Text>
                    </View>
                    <View style={styles.previewActions}>
                        <TouchableOpacity
                            style={styles.retakeButton}
                            onPress={() => setCapturedUri(null)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.retakeText}>🔁 Retake</Text>
                        </TouchableOpacity>
                        <View style={[styles.useThisButton, { backgroundColor: accentColor }]}>
                            <Text style={styles.useThisText}>✅ Photo saved with entry</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    // Live mode — viewfinder + zoom + capture button
    return (
        <View style={[styles.cameraContainer, { borderColor: accentColor + '44' }]}>
            <CameraView
                ref={cameraRef as any}
                style={styles.camera}
                facing="back"
                autofocus="on"
                zoom={zoom}
            />

            {/* LIVE badge */}
            <View style={styles.cameraOverlay} pointerEvents="none">
                <View style={[styles.liveBadge, { backgroundColor: accentColor + 'cc' }]}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                </View>
            </View>

            {/* Bottom bar: zoom + capture */}
            <View style={styles.cameraControls}>
                <View style={styles.zoomRow}>
                    <TouchableOpacity
                        style={styles.zoomBtn}
                        onPress={() => setZoom(z => Math.max(0, parseFloat((z - 0.1).toFixed(1))))}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.zoomBtnText}>−</Text>
                    </TouchableOpacity>

                    <View style={styles.zoomTrack}>
                        {[0, 0.25, 0.5, 0.75, 1].map((step) => (
                            <TouchableOpacity
                                key={step}
                                style={[styles.zoomStep, zoom >= step && { backgroundColor: accentColor }]}
                                onPress={() => setZoom(step)}
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.zoomBtn}
                        onPress={() => setZoom(z => Math.min(1, parseFloat((z + 0.1).toFixed(1))))}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.zoomBtnText}>+</Text>
                    </TouchableOpacity>

                    <Text style={[styles.zoomLabel, { color: accentColor }]}>
                        {zoom === 0 ? '1×' : `${(1 + zoom * 9).toFixed(1)}×`}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.captureButton, { backgroundColor: accentColor }, capturing && styles.captureButtonDisabled]}
                    onPress={onCapture}
                    activeOpacity={0.8}
                    disabled={capturing}
                >
                    <Text style={styles.captureButtonText}>
                        {capturing ? '⏳  Capturing...' : '📸  Capture Photo'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
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

    // ===== CAMERA CAPTURE STATE =====
    const [capturing, setCapturing] = useState(false);
    const [capturedUri, setCapturedUri] = useState<string | null>(null);
    const [zoom, setZoom] = useState(0); // 0 = no zoom, 1 = max zoom

    // ===== OCR SCAN STATE (disabled — uncomment when Vision API is active) =====
    // const [scanning, setScanning] = useState(false);

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
        setCapturedUri(null);
    }, []);

    const resetVisitorForm = useCallback(() => {
        setVisitorVehicleNo('');
        setVisitorName('');
        setVisitorPurpose('');
        setVisitorHouseNo('');
        setVisitorRegisteredVehicle(null);
        setCapturedUri(null);
    }, []);

    const resetExitForm = useCallback(() => {
        setExitVehicleNo('');
        setActiveVehicle(null);
        setExitError('');
        setCapturedUri(null);
    }, []);

    // Show success animation
    const showSuccessAnimation = (title: string, subtitle: string) => {
        setSuccessMessage({ title, subtitle });
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
        }, 1500);
    };

    // ===== CAMERA CAPTURE HANDLER =====
    const handleCapture = async () => {
        if (!cameraRef.current || capturing) return;
        setCapturing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.85,
                skipProcessing: false, // keep orientation correct
            });
            if (photo?.uri) {
                setCapturedUri(photo.uri);
            }
        } catch (err) {
            console.warn('[Camera] capture failed:', err);
        } finally {
            setCapturing(false);
        }
    };

    // ===== CAMERA SCAN LOGIC (OCR disabled — re-enable when Vision API is configured) =====

    // Fill whichever tab is active with a detected/typed plate number.
    // const fillPlate = (normalized: string) => {
    //     if (activeTab === 'resident') {
    //         setResidentVehicleNo(normalized);
    //         setResidentError('');
    //         setRegisteredVehicle(null);
    //     } else if (activeTab === 'visitor') {
    //         setVisitorVehicleNo(normalized);
    //         setVisitorRegisteredVehicle(null);
    //     } else {
    //         setExitVehicleNo(normalized);
    //         setExitError('');
    //         setActiveVehicle(null);
    //     }
    // };

    // Manual fallback — cross-platform (Alert.prompt is iOS-only).
    // const promptManual = () => {
    //     if (Platform.OS === 'ios') {
    //         Alert.prompt(
    //             '✏️ Enter License Plate',
    //             'Type the plate number (e.g. LEA-1234)',
    //             (text) => {
    //                 if (!text || !text.trim()) return;
    //                 fillPlate(normalizeVehicleNumber(text.trim().toUpperCase()));
    //             },
    //             'plain-text',
    //             '',
    //             'default'
    //         );
    //     } else {
    //         Alert.alert(
    //             '📷 OCR could not read the plate',
    //             'Please type the license plate number in the field below.',
    //             [{ text: 'OK' }]
    //         );
    //     }
    // };

    // Primary handler — capture photo → OCR → auto-fill or fall back to manual.
    // const handleOcrScan = async () => {
    //     if (!cameraRef.current || scanning) return;
    //     setScanning(true);
    //     try {
    //         const photo = await cameraRef.current.takePictureAsync({
    //             quality: 0.85,
    //             skipProcessing: false,
    //             base64: true,
    //         });
    //         if (!photo?.uri) throw new Error('No photo captured');
    //         const plate = await detectLicensePlate(photo.uri);
    //         if (plate) {
    //             fillPlate(normalizeVehicleNumber(plate));
    //         } else {
    //             promptManual();
    //         }
    //     } catch (err) {
    //         console.warn('[OCR] scan failed, falling back to manual:', err);
    //         promptManual();
    //     } finally {
    //         setScanning(false);
    //     }
    // };

    // (CameraSection is now defined at module level — see above)

    // ===== RESIDENT ENTRY HANDLER =====
    const handleResidentEntry = async () => {
        if (!registeredVehicle) {
            Alert.alert('Please enter a registered vehicle number');
            return;
        }
        if (!userProfile) {
            Alert.alert('Error: User not logged in');
            return;
        }

        setResidentLoading(true);
        try {
            // 1. Upload photo first (if captured) — use a temp name, rename after we have logId
            let photoUrl: string | null = null;
            if (capturedUri) {
                const tempId = `tmp_${Date.now()}_${userProfile.uid}`;
                photoUrl = await uploadEntryPhoto(capturedUri, tempId);
                if (!photoUrl) console.warn('[Entry] Photo upload failed — logging without photo');
            }

            // 2. Log entry with the photo URL already embedded
            const result = await logVehicleEntry({
                vehicleNo: residentVehicleNo.trim().toUpperCase(),
                type: 'Resident',
                residentId: registeredVehicle.residentId,
                residentName: registeredVehicle.residentName,
                houseNo: registeredVehicle.houseNo,
                photoUrl,
            }, userProfile.uid, userProfile.name);

            setResidentLoading(false);
            if (result.success) {
                showSuccessAnimation('Resident Entry ✅', residentVehicleNo);
                resetResidentForm();
            } else {
                Alert.alert('Error: ' + (result.error || 'Failed to log entry'));
            }
        } catch (error) {
            setResidentLoading(false);
            Alert.alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    // ===== VISITOR ENTRY HANDLER =====
    const handleVisitorEntry = async () => {
        if (!visitorVehicleNo.trim()) {
            Alert.alert('Please enter vehicle number');
            return;
        }
        if (!visitorName.trim()) {
            Alert.alert('Please enter visitor name');
            return;
        }
        if (!userProfile) {
            Alert.alert('Error: User not logged in');
            return;
        }

        setVisitorLoading(true);
        try {
            // 1. Upload photo first (if captured)
            let photoUrl: string | null = null;
            if (capturedUri) {
                const tempId = `tmp_${Date.now()}_${userProfile.uid}`;
                photoUrl = await uploadEntryPhoto(capturedUri, tempId);
                if (!photoUrl) console.warn('[Entry] Photo upload failed — logging without photo');
            }

            // 2. Log entry with the photo URL already embedded
            const result = await logVehicleEntry({
                vehicleNo: visitorVehicleNo.trim().toUpperCase(),
                type: 'Visitor',
                visitorName: visitorName.trim(),
                purpose: visitorPurpose.trim() || null,
                houseNo: visitorHouseNo.trim() || undefined,
                photoUrl,
            }, userProfile.uid, userProfile.name);

            setVisitorLoading(false);
            if (result.success) {
                showSuccessAnimation('Visitor Entry ✅', visitorVehicleNo);
                resetVisitorForm();
            } else {
                Alert.alert('Error: ' + (result.error || 'Failed to log entry'));
            }
        } catch (error) {
            setVisitorLoading(false);
            Alert.alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    // ===== EXIT HANDLER =====
    const handleExit = async () => {
        if (!activeVehicle?.id) {
            Alert.alert('No vehicle selected');
            return;
        }
        if (!userProfile) {
            Alert.alert('Error: User not logged in');
            return;
        }

        setExitLoading(true);
        try {
            // 1. Upload exit photo first (if captured)
            let exitPhotoUrl: string | null = null;
            if (capturedUri) {
                const tempId = `exit_tmp_${Date.now()}_${userProfile.uid}`;
                exitPhotoUrl = await uploadEntryPhoto(capturedUri, tempId);
                if (!exitPhotoUrl) console.warn('[Exit] Photo upload failed — logging without photo');
            }

            // 2. Log exit with the photo URL
            const result = await logVehicleExit(activeVehicle.id, exitPhotoUrl);

            setExitLoading(false);
            if (result.success) {
                showSuccessAnimation('Exit Logged 👋', exitVehicleNo);
                resetExitForm();
                // activeVehiclesList updates automatically via SecurityDataContext onSnapshot
            } else {
                Alert.alert('Error: ' + (result.error || 'Failed to log exit'));
            }
        } catch (error) {
            setExitLoading(false);
            Alert.alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
                    <CameraSection
                        accentColor="#10b981"
                        permission={permission}
                        requestPermission={requestPermission}
                        cameraRef={cameraRef}
                        zoom={zoom}
                        setZoom={setZoom}
                        capturedUri={capturedUri}
                        setCapturedUri={setCapturedUri}
                        capturing={capturing}
                        onCapture={handleCapture}
                    />

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
                    <CameraSection
                        accentColor="#f97316"
                        permission={permission}
                        requestPermission={requestPermission}
                        cameraRef={cameraRef}
                        zoom={zoom}
                        setZoom={setZoom}
                        capturedUri={capturedUri}
                        setCapturedUri={setCapturedUri}
                        capturing={capturing}
                        onCapture={handleCapture}
                    />

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
                    <CameraSection
                        accentColor="#3b82f6"
                        permission={permission}
                        requestPermission={requestPermission}
                        cameraRef={cameraRef}
                        zoom={zoom}
                        setZoom={setZoom}
                        capturedUri={capturedUri}
                        setCapturedUri={setCapturedUri}
                        capturing={capturing}
                        onCapture={handleCapture}
                    />

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
        height: 280,                  // Taller viewfinder for better visibility
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#0a0a14',
        borderWidth: 1.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    camera: {
        ...StyleSheet.absoluteFillObject,
    },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'flex-start', // Badge pinned to top-left
        alignItems: 'flex-start',
        padding: 12,
        // No dim overlay — let the live feed show clearly
    },
    // LIVE badge
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 6,
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: '#fff',
    },
    liveBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
    },
    // Kept for reference — used when OCR scan button is re-enabled
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
    cameraHint: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    // Scan guideline corners — kept for OCR re-enable
    scanGuideline: { width: '78%', height: 58, borderWidth: 1.5, borderRadius: 8, position: 'relative' },
    corner: { position: 'absolute', width: 14, height: 14 },
    cornerTL: { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 5 },
    cornerTR: { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 5 },
    cornerBL: { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 5 },
    cornerBR: { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 5 },
    cameraStatusText: { color: '#6b6b8a', fontSize: 14 },
    cameraIcon: { fontSize: 32, marginBottom: 10 },
    cameraText: { fontSize: 14, color: '#6b6b8a', fontWeight: '500', marginBottom: 14 },
    permissionButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 10,
    },
    permissionButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    // Bottom controls bar (zoom + capture)
    cameraControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 14,
        paddingBottom: 8,
        paddingTop: 6,
        backgroundColor: 'rgba(0,0,0,0.55)',
        gap: 8,
    },

    // Zoom row
    zoomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    zoomBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    zoomBtnText: { color: '#fff', fontSize: 20, fontWeight: '300', lineHeight: 26 },
    zoomTrack: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    zoomStep: {
        flex: 1,
        height: 5,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    zoomLabel: {
        fontSize: 12,
        fontWeight: '700',
        minWidth: 34,
        textAlign: 'right',
    },

    // Capture button (full width, pinned in controls bar)
    captureButton: {
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    captureButtonDisabled: { opacity: 0.5 },
    captureButtonText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },

    // Preview overlay (shown after capture)
    previewOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        padding: 12,
    },
    previewBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
    },
    previewBadgeText: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 },
    previewActions: {
        flexDirection: 'row',
        gap: 10,
    },
    retakeButton: {
        flex: 1,
        paddingVertical: 11,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
    },
    retakeText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    useThisButton: {
        flex: 2,
        paddingVertical: 11,
        borderRadius: 12,
        alignItems: 'center',
    },
    useThisText: { color: '#fff', fontWeight: '700', fontSize: 14 },

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
