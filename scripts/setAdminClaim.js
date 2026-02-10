#!/usr/bin/env node

/**
 * Firebase Admin Custom Claims Setup Script
 * 
 * This script sets the 'admin' role custom claim for specified users.
 * Required for storage rules that check admin permissions.
 * 
 * Setup:
 * 1. Install Firebase Admin SDK: npm install firebase-admin
 * 2. Download service account key from Firebase Console:
 *    Project Settings > Service Accounts > Generate New Private Key
 * 3. Save as service-account-key.json in project root
 * 4. Run: node scripts/setAdminClaim.js <email>
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
try {
    const serviceAccount = require('../service-account-key.json');

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin initialized');
} catch (error) {
    console.error('❌ Error initializing Firebase Admin:');
    console.error('   Make sure service-account-key.json exists in project root');
    console.error('   Download from: Firebase Console > Project Settings > Service Accounts');
    process.exit(1);
}

/**
 * Set admin role for a user
 */
async function setAdminClaim(email) {
    try {
        // Get user by email
        const user = await admin.auth().getUserByEmail(email);

        // Set custom claim
        await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });

        console.log(`✅ Admin claim set for ${email}`);
        console.log(`   User ID: ${user.uid}`);
        console.log('   The user needs to sign out and sign in again for changes to take effect');

        return true;
    } catch (error) {
        console.error(`❌ Error setting admin claim for ${email}:`);
        console.error(`   ${error.message}`);
        return false;
    }
}

/**
 * Remove admin role from a user
 */
async function removeAdminClaim(email) {
    try {
        // Get user by email
        const user = await admin.auth().getUserByEmail(email);

        // Remove custom claim by setting role to null or 'resident'
        await admin.auth().setCustomUserClaims(user.uid, { role: 'resident' });

        console.log(`✅ Admin claim removed from ${email}`);
        console.log(`   User ID: ${user.uid}`);
        console.log('   The user needs to sign out and sign in again for changes to take effect');

        return true;
    } catch (error) {
        console.error(`❌ Error removing admin claim from ${email}:`);
        console.error(`   ${error.message}`);
        return false;
    }
}

/**
 * List all admin users
 */
async function listAdmins() {
    try {
        const listUsersResult = await admin.auth().listUsers(1000);
        const admins = listUsersResult.users.filter(user => {
            return user.customClaims && user.customClaims.role === 'admin';
        });

        if (admins.length === 0) {
            console.log('No admin users found');
            return;
        }

        console.log(`\n📋 Admin Users (${admins.length}):\n`);
        admins.forEach((user, index) => {
            console.log(`${index + 1}. ${user.email}`);
            console.log(`   UID: ${user.uid}`);
            console.log(`   Created: ${user.metadata.creationTime}`);
            console.log('');
        });

        return admins;
    } catch (error) {
        console.error('❌ Error listing admins:', error.message);
        return [];
    }
}

/**
 * Set multiple admins at once
 */
async function setMultipleAdmins(emails) {
    console.log(`\n🔧 Setting admin claims for ${emails.length} users...\n`);

    let successCount = 0;
    let failCount = 0;

    for (const email of emails) {
        const success = await setAdminClaim(email);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
        console.log(''); // Empty line for readability
    }

    console.log(`\n✅ Successfully set: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        console.log(`
Firebase Admin Custom Claims Manager

Usage:
  node scripts/setAdminClaim.js <command> [arguments]

Commands:
  set <email>              Set admin claim for user
  remove <email>           Remove admin claim from user
  list                     List all admin users
  bulk <email1,email2,...> Set admin claims for multiple users

Examples:
  node scripts/setAdminClaim.js set admin@example.com
  node scripts/setAdminClaim.js remove user@example.com
  node scripts/setAdminClaim.js list
  node scripts/setAdminClaim.js bulk admin1@test.com,admin2@test.com

Note: Users must sign out and sign in for custom claims to take effect.
        `);
        process.exit(0);
    }

    switch (command.toLowerCase()) {
        case 'set':
            if (!args[1]) {
                console.error('❌ Error: Email required');
                console.log('Usage: node scripts/setAdminClaim.js set <email>');
                process.exit(1);
            }
            await setAdminClaim(args[1]);
            break;

        case 'remove':
            if (!args[1]) {
                console.error('❌ Error: Email required');
                console.log('Usage: node scripts/setAdminClaim.js remove <email>');
                process.exit(1);
            }
            await removeAdminClaim(args[1]);
            break;

        case 'list':
            await listAdmins();
            break;

        case 'bulk':
            if (!args[1]) {
                console.error('❌ Error: Emails required');
                console.log('Usage: node scripts/setAdminClaim.js bulk <email1,email2,...>');
                process.exit(1);
            }
            const emails = args[1].split(',').map(e => e.trim());
            await setMultipleAdmins(emails);
            break;

        default:
            console.error(`❌ Unknown command: ${command}`);
            console.log('Run without arguments to see usage');
            process.exit(1);
    }

    process.exit(0);
}

// Run the script
main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
});
