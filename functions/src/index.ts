import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Delete user from Firebase Authentication
 * Callable function - only admins can call this
 */
export const deleteAuthUser = functions.https.onCall(async (data, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'Must be logged in to delete users'
        );
    }

    // Check if user is admin
    const callerUid = context.auth.uid;
    const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();

    if (!callerDoc.exists || callerDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only admins can delete users'
        );
    }

    const { uid } = data;

    if (!uid) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'User ID is required'
        );
    }

    try {
        // Delete user from Firebase Authentication
        await admin.auth().deleteUser(uid);

        console.log(`✅ Successfully deleted auth user: ${uid}`);

        return {
            success: true,
            message: `User ${uid} deleted from Firebase Authentication`
        };
    } catch (error: any) {
        console.error('Error deleting auth user:', error);

        throw new functions.https.HttpsError(
            'internal',
            `Failed to delete user: ${error.message}`
        );
    }
});
