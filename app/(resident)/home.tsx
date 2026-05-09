/**
 * Resident Home Screen
 * Modern dashboard with quick access to all resident features
 *
 * This screen shows:
 * - Greeting with resident name and house number
 * - Tappable avatar with profile picture upload support
 * - Quick status cards (bills, complaints, vehicles)
 * - Service menu grid for navigation
 */

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Avatar } from '../../src/components/common/Avatar';
import { Card } from '../../src/components/common/Card';
import { Colors, Shadows, Typography } from '../../constants/designSystem';
import { useAppData } from '../../src/contexts/AppDataContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { useBreakpoint } from '../../src/hooks/useResponsive';
import { borderRadius, fontSize, spacing } from '../../src/utils/responsive';

/**
 * Get appropriate greeting based on time of day
 */
function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
}

export default function ResidentHome() {
    const { userProfile, updateProfilePicture } = useAuth();
    const { bills, complaints } = useAppData();
    const router = useRouter();
    const breakpoint = useBreakpoint();
    const [refreshing, setRefreshing] = React.useState(false);

    // Profile picture state
    const [photoMenuVisible, setPhotoMenuVisible] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Derive stats from context data (no extra Firestore reads)
    const unpaidBills = useMemo(() => bills.filter(b => b.status === 'Unpaid').length, [bills]);
    const pendingComplaints = useMemo(
        () => complaints.filter(c => c.status === 'Pending' || c.status === 'In Progress').length,
        [complaints]
    );

    /**
     * Refresh data when user pulls down
     */
    const onRefresh = async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 500);
    };

    // ── Profile picture helpers ────────────────────────────────────────────────

    const requestPermission = async (type: 'camera' | 'library'): Promise<boolean> => {
        if (type === 'camera') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Camera access is needed to take a photo.');
                return false;
            }
        } else {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Photo library access is needed to pick an image.');
                return false;
            }
        }
        return true;
    };

    const handlePickFromGallery = async () => {
        setPhotoMenuVisible(false);
        if (!(await requestPermission('library'))) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]) {
            await uploadPhoto(result.assets[0].uri);
        }
    };

    const handleTakePhoto = async () => {
        setPhotoMenuVisible(false);
        if (!(await requestPermission('camera'))) return;

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets?.[0]) {
            await uploadPhoto(result.assets[0].uri);
        }
    };

    const handleRemovePhoto = () => {
        setPhotoMenuVisible(false);
        Alert.alert(
            'Remove Profile Photo',
            'Are you sure you want to remove your profile photo?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await updateProfilePicture('');
                        if (!result.success) {
                            Alert.alert('Error', result.error || 'Could not remove photo');
                        }
                    },
                },
            ]
        );
    };

    const uploadPhoto = async (uri: string) => {
        try {
            setUploading(true);
            const result = await updateProfilePicture(uri);
            if (!result.success) {
                Alert.alert('Upload Failed', result.error || 'Could not update profile photo');
            }
        } finally {
            setUploading(false);
        }
    };

    // Quick status card configuration
    const statusCards = [
        {
            title: 'Pending Bills',
            value: unpaidBills,
            icon: <Ionicons name="card" size={32} color={unpaidBills > 0 ? Colors.error.main : Colors.success.main} />,
            color: unpaidBills > 0 ? Colors.error.main : Colors.success.main,
            bgColor: unpaidBills > 0 ? Colors.error.light : Colors.success.light,
            route: '/(resident)/bills'
        },
        {
            title: 'Open Complaints',
            value: pendingComplaints,
            icon: <Ionicons name="construct" size={32} color={Colors.warning.main} />,
            color: Colors.warning.main,
            bgColor: Colors.warning.light,
            route: '/(resident)/complaints'
        },
        {
            title: 'Vehicles Inside',
            value: 0,
            icon: <Ionicons name="car" size={32} color={Colors.info.main} />,
            color: Colors.info.main,
            bgColor: Colors.info.light,
            route: '/(resident)/vehicles'
        },
    ];

    // Main service menu configuration
    const menuItems = [
        {
            title: 'Announcements',
            icon: <Ionicons name="megaphone" size={28} color={Colors.primary[500]} />,
            route: '/(resident)/announcements',
            color: Colors.primary[500],
        },
        {
            title: 'Bills & Payments',
            icon: <Ionicons name="card" size={28} color={Colors.success.main} />,
            route: '/(resident)/bills',
            color: Colors.success.main,
        },
        {
            title: 'Complaints',
            icon: <Ionicons name="construct" size={28} color={Colors.warning.main} />,
            route: '/(resident)/complaints',
            color: Colors.warning.main,
        },
        {
            title: 'Vehicles',
            icon: <Ionicons name="car" size={28} color={Colors.secondary[600]} />,
            route: '/(resident)/vehicles',
            color: Colors.secondary[600],
        },
        {
            title: 'Marketplace',
            icon: <Ionicons name="storefront" size={28} color={Colors.info.dark} />,
            route: '/(resident)/marketplace',
            color: Colors.info.dark,
        },
        {
            title: 'AI Assistant',
            icon: <Ionicons name="chatbubbles" size={28} color={Colors.primary[400]} />,
            route: '/(resident)/chatbot',
            color: Colors.primary[400],
        },
        {
            title: 'Change Password',
            icon: <Ionicons name="key" size={28} color={Colors.secondary[700]} />,
            route: '/(resident)/change-password',
            color: Colors.secondary[700],
        },
    ];

    return (
        <>
            <ScrollView
                style={styles.container}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={[styles.content, { padding: spacing.lg }]}>

                    {/* Header Section - Avatar and Greeting */}
                    <View style={[styles.header, { marginBottom: spacing['2xl'] }]}>
                        <View style={styles.headerLeft}>

                            {/* Tappable Avatar with camera badge */}
                            <TouchableOpacity
                                style={styles.avatarWrapper}
                                onPress={() => setPhotoMenuVisible(true)}
                                activeOpacity={0.8}
                                accessibilityLabel="Change profile photo"
                            >
                                <Avatar
                                    name={userProfile?.name || 'User'}
                                    imageUrl={userProfile?.profilePictureUrl ?? undefined}
                                    size="lg"
                                />
                                <View style={styles.cameraBadge}>
                                    {uploading ? (
                                        <ActivityIndicator size={10} color="#fff" />
                                    ) : (
                                        <Ionicons name="camera" size={10} color="#fff" />
                                    )}
                                </View>
                            </TouchableOpacity>

                            <View style={[styles.headerText, { marginLeft: spacing.md }]}>
                                <Text style={[styles.greeting, { fontSize: fontSize.sm }]}>
                                    {getGreeting()} 👋
                                </Text>
                                <Text style={[styles.userName, { fontSize: breakpoint.mobile ? fontSize['2xl'] : fontSize['3xl'] }]}>
                                    {userProfile?.name}
                                </Text>
                                <Text style={[styles.houseNo, { fontSize: fontSize.base }]}>
                                    House: {userProfile?.houseNo}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Quick Status Cards Section */}
                    <Text style={[styles.sectionTitle, { fontSize: fontSize.lg, marginBottom: spacing.md }]}>
                        Quick Overview
                    </Text>
                    <View
                        style={[styles.statusCardsContainer, { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl }]}
                    >
                        {statusCards.map((card, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.statusCard,
                                    {
                                        backgroundColor: card.bgColor,
                                        borderColor: card.color,
                                        borderRadius: borderRadius.xl,
                                        padding: spacing.lg
                                    }
                                ]}
                                onPress={() => router.push(card.route as any)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.statusIcon, { marginBottom: spacing.sm }]}>
                                    {card.icon}
                                </View>
                                <Text style={[styles.statusValue, { color: card.color, fontSize: fontSize['3xl'] }]}>
                                    {card.value}
                                </Text>
                                <Text style={[styles.statusTitle, { fontSize: fontSize.xs }]}>
                                    {card.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Service Menu Grid */}
                    <Text style={[styles.sectionTitle, { fontSize: fontSize.lg, marginBottom: spacing.md }]}>
                        Services
                    </Text>
                    <View style={[styles.menuGrid, { gap: spacing.md }]}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.menuItem}
                                onPress={() => router.push(item.route as any)}
                                activeOpacity={0.7}
                            >
                                <Card style={[styles.menuCard, { padding: spacing.lg }]}>
                                    <View
                                        style={[
                                            styles.iconContainer,
                                            {
                                                backgroundColor: `${item.color}15`,
                                                borderRadius: borderRadius.xl,
                                                marginBottom: spacing.md
                                            }
                                        ]}
                                    >
                                        {item.icon}
                                    </View>
                                    <Text style={[styles.menuTitle, { fontSize: fontSize.base }]}>
                                        {item.title}
                                    </Text>
                                </Card>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* ── Upload Progress Overlay ──────────────────────────────────── */}
            {uploading && (
                <View style={styles.uploadOverlay}>
                    <View style={styles.uploadCard}>
                        <ActivityIndicator size="large" color={Colors.primary[500]} />
                        <Text style={styles.uploadText}>Uploading photo…</Text>
                    </View>
                </View>
            )}

            {/* ── Photo Action Sheet Modal ─────────────────────────────────── */}
            <Modal
                visible={photoMenuVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setPhotoMenuVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setPhotoMenuVisible(false)}
                >
                    <View style={styles.actionSheet}>
                        {/* Handle bar */}
                        <View style={styles.sheetHandle} />

                        <Text style={styles.sheetTitle}>Profile Photo</Text>
                        <Text style={styles.sheetSubtitle}>
                            Only you and admins can see your profile photo
                        </Text>

                        {/* Gallery option */}
                        <TouchableOpacity style={styles.sheetOption} onPress={handlePickFromGallery}>
                            <View style={[styles.sheetOptionIcon, { backgroundColor: `${Colors.primary[500]}15` }]}>
                                <Ionicons name="images" size={22} color={Colors.primary[500]} />
                            </View>
                            <View style={styles.sheetOptionText}>
                                <Text style={styles.sheetOptionTitle}>Choose from Gallery</Text>
                                <Text style={styles.sheetOptionSub}>Select a photo from your library</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={Colors.text.secondary} />
                        </TouchableOpacity>

                        {/* Camera option */}
                        <TouchableOpacity style={styles.sheetOption} onPress={handleTakePhoto}>
                            <View style={[styles.sheetOptionIcon, { backgroundColor: `${Colors.info.main}15` }]}>
                                <Ionicons name="camera" size={22} color={Colors.info.main} />
                            </View>
                            <View style={styles.sheetOptionText}>
                                <Text style={styles.sheetOptionTitle}>Take a Photo</Text>
                                <Text style={styles.sheetOptionSub}>Use your camera to capture a new photo</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={Colors.text.secondary} />
                        </TouchableOpacity>

                        {/* Remove option — only shown when a photo exists */}
                        {userProfile?.profilePictureUrl ? (
                            <TouchableOpacity
                                style={[styles.sheetOption, styles.sheetOptionDanger]}
                                onPress={handleRemovePhoto}
                            >
                                <View style={[styles.sheetOptionIcon, { backgroundColor: `${Colors.error.main}15` }]}>
                                    <Ionicons name="trash" size={22} color={Colors.error.main} />
                                </View>
                                <View style={styles.sheetOptionText}>
                                    <Text style={[styles.sheetOptionTitle, { color: Colors.error.main }]}>
                                        Remove Photo
                                    </Text>
                                    <Text style={styles.sheetOptionSub}>Revert to initials avatar</Text>
                                </View>
                            </TouchableOpacity>
                        ) : null}

                        {/* Cancel */}
                        <TouchableOpacity
                            style={styles.sheetCancel}
                            onPress={() => setPhotoMenuVisible(false)}
                        >
                            <Text style={styles.sheetCancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background.secondary,
    },
    content: {
        // Padding handled inline
    },
    header: {
        // Margin handled inline
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
        // Margin handled inline
    },
    greeting: {
        color: Colors.text.secondary,
        marginBottom: 2,
    },
    userName: {
        fontWeight: Typography.fontWeight.bold,
        color: Colors.text.primary,
        marginBottom: 2,
    },
    houseNo: {
        color: Colors.text.secondary,
    },
    sectionTitle: {
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.text.primary,
    },
    statusCardsContainer: {
        paddingBottom: 4,
    },
    statusCard: {
        flex: 1,
        borderWidth: 1.5,
        alignItems: 'center',
        ...Shadows.sm,
    },
    statusIcon: {
        fontSize: 32,
    },
    statusValue: {
        fontWeight: Typography.fontWeight.bold,
        marginBottom: 4,
    },
    statusTitle: {
        color: Colors.text.secondary,
        textAlign: 'center',
        fontWeight: Typography.fontWeight.medium,
    },
    menuGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    menuItem: {
        width: '48%',
    },
    menuCard: {
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuIcon: {
        fontSize: 32,
    },
    menuTitle: {
        fontWeight: Typography.fontWeight.semibold,
        color: Colors.text.primary,
        textAlign: 'center',
    },

    // ── Avatar wrapper ────────────────────────────────────────────────────────
    avatarWrapper: {
        position: 'relative',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.primary[500],
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: Colors.background.secondary,
    },

    // ── Upload overlay ────────────────────────────────────────────────────────
    uploadOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.35)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    uploadCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 28,
        paddingHorizontal: 36,
        alignItems: 'center',
        gap: 12,
        ...Shadows.md,
    },
    uploadText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text.primary,
        marginTop: 4,
    },

    // ── Action sheet modal ────────────────────────────────────────────────────
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'flex-end',
    },
    actionSheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 12,
        paddingBottom: 36,
        paddingHorizontal: 20,
        ...Shadows.lg,
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#E5E7EB',
        alignSelf: 'center',
        marginBottom: 20,
    },
    sheetTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text.primary,
        marginBottom: 4,
    },
    sheetSubtitle: {
        fontSize: 13,
        color: Colors.text.secondary,
        marginBottom: 20,
    },
    sheetOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    sheetOptionDanger: {
        borderBottomWidth: 0,
    },
    sheetOptionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sheetOptionText: {
        flex: 1,
    },
    sheetOptionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary,
    },
    sheetOptionSub: {
        fontSize: 12,
        color: Colors.text.secondary,
        marginTop: 1,
    },
    sheetCancel: {
        marginTop: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    sheetCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text.primary,
    },
});
