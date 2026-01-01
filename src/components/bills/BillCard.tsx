// Bill Card Component
// Displays individual bill information

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Bill } from '../../types';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { StatusBadge } from '../common/StatusBadge';

interface BillCardProps {
    bill: Bill;
    onPress?: (bill: Bill) => void;
    onPayPress?: (billId: string) => void;
    onViewProofPress?: (proofUrl: string) => void;
    isAdmin?: boolean;
}

const BillCard: React.FC<BillCardProps> = ({
    bill,
    onPress,
    onPayPress,
    onViewProofPress,
    isAdmin = false
}) => {
    const formatDate = (timestamp: any): string => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    const CardContent = (
        <Card>
            <View style={styles.header}>
                <View>
                    <Text style={styles.month}>{bill.month}</Text>
                    {isAdmin && (
                        <Text style={styles.residentInfo}>
                            {bill.residentName} - {bill.houseNo}
                        </Text>
                    )}
                </View>
                <StatusBadge status={bill.status} />
            </View>

            <View style={styles.amountContainer}>
                <Text style={styles.labelText}>Amount</Text>
                <Text style={styles.amount}>Rs. {bill.amount.toLocaleString()}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.labelText}>Due Date:</Text>
                <Text style={styles.valueText}>{formatDate(bill.dueDate)}</Text>
            </View>

            {bill.proofUploadedAt && (
                <View style={styles.row}>
                    <Text style={styles.labelText}>Proof Uploaded:</Text>
                    <Text style={styles.valueText}>{formatDate(bill.proofUploadedAt)}</Text>
                </View>
            )}

            {bill.status === 'Unpaid' && onPayPress && (
                <Button
                    title="Upload Payment Proof"
                    onPress={() => onPayPress(bill.id!)}
                    variant="primary"
                    fullWidth
                    style={styles.actionButton}
                />
            )}

            {bill.proofUrl && onViewProofPress && (
                <Button
                    title="View Payment Proof"
                    onPress={() => onViewProofPress(bill.proofUrl!)}
                    variant="secondary"
                    fullWidth
                    style={styles.actionButton}
                />
            )}
        </Card>
    );

    if (onPress) {
        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onPress(bill)}
            >
                {CardContent}
            </TouchableOpacity>
        );
    }

    return CardContent;
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16
    },
    month: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333'
    },
    residentInfo: {
        fontSize: 14,
        color: '#666',
        marginTop: 4
    },
    amountContainer: {
        marginBottom: 12
    },
    amount: {
        fontSize: 24,
        fontWeight: '700',
        color: '#007AFF',
        marginTop: 4
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    labelText: {
        fontSize: 14,
        color: '#666'
    },
    valueText: {
        fontSize: 14,
        color: '#333',
        fontWeight: '500'
    },
    actionButton: {
        marginTop: 12
    }
});

// Memoize component to prevent unnecessary re-renders
export default React.memo(BillCard, (prevProps, nextProps) => {
    // Custom comparison function - only re-render if bill data or callbacks change
    return (
        prevProps.bill.id === nextProps.bill.id &&
        prevProps.bill.status === nextProps.bill.status &&
        prevProps.bill.amount === nextProps.bill.amount &&
        prevProps.bill.proofUrl === nextProps.bill.proofUrl &&
        prevProps.isAdmin === nextProps.isAdmin
    );
});

// Also export non-memoized version for backwards compatibility
export { BillCard };

