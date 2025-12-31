// Listing Card Component (Marketplace)
// Displays property listing information

import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Listing } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';

interface ListingCardProps {
    listing: Listing;
    onApprove?: (listingId: string) => void;
    onReject?: (listingId: string) => void;
    isAdmin?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({
    listing,
    onApprove,
    onReject,
    isAdmin = false
}) => {
    const handleContact = () => {
        Linking.openURL(`tel:${listing.contact}`);
    };

    return (
        <Card>
            {/* Property Images */}
            {listing.photos && listing.photos.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                    {listing.photos.map((photo, index) => (
                        <Image
                            key={index}
                            source={{ uri: photo }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                    ))}
                </ScrollView>
            )}

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.typeContainer}>
                    <Text style={styles.type}>{listing.type}</Text>
                    <Text style={styles.size}>{listing.size}</Text>
                </View>
                {isAdmin && <StatusBadge status={listing.status} />}
            </View>

            {/* Price */}
            <Text style={styles.price}>Rs. {listing.price.toLocaleString()}</Text>

            {/* Location */}
            <View style={styles.row}>
                <Text style={styles.icon}>📍</Text>
                <Text style={styles.location}>{listing.location}</Text>
            </View>

            {/* Description */}
            <Text style={styles.description} numberOfLines={3}>
                {listing.description}
            </Text>

            {/* Posted By */}
            <View style={styles.postedByContainer}>
                <Text style={styles.postedByLabel}>Posted by:</Text>
                <Text style={styles.postedByText}>
                    {listing.postedByName} ({listing.postedByHouse})
                </Text>
            </View>

            {/* Admin Actions */}
            {isAdmin && listing.status === 'Pending' && (
                <View style={styles.adminActions}>
                    <Button
                        title="Approve"
                        onPress={() => onApprove?.(listing.id!)}
                        variant="success"
                        style={styles.actionButton}
                    />
                    <Button
                        title="Reject"
                        onPress={() => onReject?.(listing.id!)}
                        variant="danger"
                        style={styles.actionButton}
                    />
                </View>
            )}

            {/* Contact Button (for approved listings) */}
            {!isAdmin && listing.status === 'Approved' && (
                <Button
                    title={`Contact: ${listing.contact}`}
                    onPress={handleContact}
                    variant="primary"
                    fullWidth
                    style={styles.contactButton}
                />
            )}

            {/* Rejection Reason */}
            {listing.rejectionReason && (
                <View style={styles.rejectionContainer}>
                    <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
                    <Text style={styles.rejectionText}>{listing.rejectionReason}</Text>
                </View>
            )}
        </Card>
    );
};

const styles = StyleSheet.create({
    imageScroll: {
        marginBottom: 16,
        marginHorizontal: -16,
        paddingHorizontal: 16
    },
    image: {
        width: 250,
        height: 180,
        borderRadius: 12,
        marginRight: 12
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    type: {
        fontSize: 16,
        fontWeight: '600',
        color: '#007AFF'
    },
    size: {
        fontSize: 14,
        color: '#666',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8
    },
    price: {
        fontSize: 28,
        fontWeight: '700',
        color: '#34C759',
        marginBottom: 12
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    icon: {
        fontSize: 16,
        marginRight: 8
    },
    location: {
        fontSize: 15,
        color: '#333',
        fontWeight: '500'
    },
    description: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
        marginBottom: 12
    },
    postedByContainer: {
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 12,
        marginBottom: 12
    },
    postedByLabel: {
        fontSize: 12,
        color: '#999',
        marginBottom: 4
    },
    postedByText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500'
    },
    adminActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 12
    },
    actionButton: {
        flex: 1
    },
    contactButton: {
        marginTop: 12
    },
    rejectionContainer: {
        backgroundColor: '#FFEBEE',
        padding: 12,
        borderRadius: 8,
        marginTop: 12
    },
    rejectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FF3B30',
        marginBottom: 4
    },
    rejectionText: {
        fontSize: 13,
        color: '#333'
    }
});
