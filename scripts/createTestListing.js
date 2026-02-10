// Quick script to create a test pending listing for testing approval flow
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, 'service-account-key.json'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createTestListing() {
    try {
        const listingRef = await db.collection('listings').add({
            type: 'Rent',
            price: 50000,
            size: '3 Bedroom, 2 Bath',
            location: 'Block A, Street 5',
            contact: '0300-1234567',
            description: 'Test listing for approval testing. Beautiful property with modern amenities.',
            photos: [
                'https://via.placeholder.com/400x300?text=Test+Property+1',
                'https://via.placeholder.com/400x300?text=Test+Property+2'
            ],
            status: 'Pending',
            postedBy: 'test_resident_id',
            postedByName: 'Test Resident',
            postedByHouse: 'A-101',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            reviewedBy: null,
            reviewedAt: null,
            rejectionReason: null
        });

        console.log('✅ Test listing created with ID:', listingRef.id);
        console.log('📋 Status: Pending');
        console.log('🏠 Go to admin marketplace to approve/reject it!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating test listing:', error);
        process.exit(1);
    }
}

createTestListing();
