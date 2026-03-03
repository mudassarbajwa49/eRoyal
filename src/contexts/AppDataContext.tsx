/**
 * AppDataContext
 *
 * Starts one set of Firestore onSnapshot listeners when a RESIDENT logs in
 * and keeps the data alive in memory for the lifetime of the session.
 *
 * WHY: Every screen previously called getDocs() on each mount — a cold
 * Firestore round-trip (300–800 ms) every time the user navigated.
 *
 * HOW: Listeners are set up here once. Every screen just reads from this
 * context and gets data instantly, with live real-time updates as a bonus.
 *
 * NOTE: This context is RESIDENT-ONLY. Admin and security users have their
 * own data contexts (AdminDataContext / SecurityDataContext) and must NOT
 * trigger these resident-scoped listeners — they will return empty results
 * and waste Firestore reads.
 *
 * Collections covered:
 *  - bills            (resident-scoped, excludes Draft)
 *  - registeredVehicles (resident-scoped)
 *  - vehicleLogs      (resident-scoped)
 *  - listings         (approved for browse + own listings)
 *  - announcements    (all, ordered by createdAt desc)
 *  NOTE: complaints already had its own onSnapshot in the screen; it is
 *        intentionally left there to avoid double-listener conflicts.
 *
 * FIRESTORE INDEXES REQUIRED:
 *  - registeredVehicles: residentId ASC + createdAt DESC
 *  - vehicleLogs:        residentId ASC + entryTime DESC
 *  - bills:              residentId ASC + status ASC + month DESC
 *                        (also isArchived ASC)
 *  If any of these are missing, the listener will error silently and data
 *  will always appear empty. Check the browser console for a Firestore
 *  index creation link if vehicles/bills/logs are not loading.
 */

import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
} from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { db } from '../../firebaseConfig';
import { Announcement } from '../services/announcementService';
import { Bill, Listing, RegisteredVehicle, VehicleLog } from '../types';
import { useAuth } from './AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AppData {
    bills: Bill[];
    vehicles: RegisteredVehicle[];
    vehicleLogs: VehicleLog[];
    approvedListings: Listing[];
    myListings: Listing[];
    announcements: Announcement[];
    /** True only on the very first load before any listener fires */
    initializing: boolean;
}

interface AppDataContextValue extends AppData {
    /** Force-refresh is a no-op — onSnapshot keeps data fresh automatically.
     *  Kept for API compatibility with existing pull-to-refresh handlers. */
    refresh: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppDataContext = createContext<AppDataContextValue>({
    bills: [],
    vehicles: [],
    vehicleLogs: [],
    approvedListings: [],
    myListings: [],
    announcements: [],
    initializing: true,
    refresh: () => { },
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppDataProvider({ children }: { children: React.ReactNode }) {
    const { userProfile } = useAuth();
    const uid = userProfile?.uid;
    const role = userProfile?.role;
    // Only residents use this context — case-insensitive to handle 'Resident', 'resident', etc.
    const isResident = role?.toLowerCase() === 'resident';

    // Diagnostic: print the role value so we can detect capitalization mismatches
    React.useEffect(() => {
        console.log('[AppDataContext] userProfile role:', role, '| isResident:', isResident, '| uid:', uid);
    }, [role, isResident, uid]);

    const [bills, setBills] = useState<Bill[]>([]);
    const [vehicles, setVehicles] = useState<RegisteredVehicle[]>([]);
    const [vehicleLogs, setVehicleLogs] = useState<VehicleLog[]>([]);
    const [approvedListings, setApprovedListings] = useState<Listing[]>([]);
    const [myListings, setMyListings] = useState<Listing[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [initializing, setInitializing] = useState(true);

    // Track how many listeners have fired at least once so we can clear the
    // "initializing" flag when all data is ready.
    const readyCount = useRef(0);
    const TOTAL_LISTENERS = 5; // bills, vehicles, logs, listings×2(merged), announcements
    const isFirstUser = useRef<string | null>(null);

    const markReady = () => {
        readyCount.current += 1;
        if (readyCount.current >= TOTAL_LISTENERS) {
            setInitializing(false);
        }
    };

    useEffect(() => {
        if (!uid || !isResident) {
            // Reset when logged out OR when user is not a resident (admin/security)
            // Admins and security use AdminDataContext / SecurityDataContext instead.
            setBills([]);
            setVehicles([]);
            setVehicleLogs([]);
            setApprovedListings([]);
            setMyListings([]);
            setAnnouncements([]);
            setInitializing(false); // not initializing — just not applicable
            readyCount.current = 0;
            isFirstUser.current = null;
            return;
        }

        // Avoid re-registering listeners if uid didn't change
        if (isFirstUser.current === uid) return;
        isFirstUser.current = uid;
        readyCount.current = 0;
        setInitializing(true);

        const unsubs: (() => void)[] = [];

        // ── 1. Bills (resident only) – filter Draft/archived in memory ─────────────
        const billsQ = query(
            collection(db, 'bills'),
            where('residentId', '==', uid),
            orderBy('createdAt', 'desc')
        );
        unsubs.push(
            onSnapshot(billsQ, (snap) => {
                const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Bill));
                setBills(all.filter(b => b.status !== 'Draft' && !b.isArchived));
                markReady();
            }, (err) => {
                console.error('[AppData] bills listener error:', err);
                markReady();
            })
        );

        // ── 2. Registered Vehicles (resident) ───────────────────────────────
        const vehiclesQ = query(
            collection(db, 'registeredVehicles'),
            where('residentId', '==', uid)
        );
        unsubs.push(
            onSnapshot(vehiclesQ, (snap) => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as RegisteredVehicle));
                // Sort newest first client-side
                list.sort((a: any, b: any) => {
                    const ta = a.createdAt?.toMillis?.() ?? 0;
                    const tb = b.createdAt?.toMillis?.() ?? 0;
                    return tb - ta;
                });
                setVehicles(list);
                markReady();
            }, (err) => {
                console.error('[AppData] vehicles listener error:', err);
                markReady();
            })
        );

        // ── 3. Vehicle Logs (resident) ───────────────────────────────────
        const logsQ = query(
            collection(db, 'vehicleLogs'),
            where('residentId', '==', uid)
        );
        unsubs.push(
            onSnapshot(logsQ, (snap) => {
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as VehicleLog));
                list.sort((a: any, b: any) => {
                    const ta = a.entryTime?.toMillis?.() ?? 0;
                    const tb = b.entryTime?.toMillis?.() ?? 0;
                    return tb - ta;
                });
                setVehicleLogs(list);
                markReady();
            }, (err) => {
                console.error('[AppData] vehicleLogs listener error:', err);
                markReady();
            })
        );

        // ── 4. Marketplace: approved + own (combined in one listener count) ───
        let approvedDone = false;
        let myDone = false;
        const checkListingsDone = () => {
            if (approvedDone && myDone) markReady();
        };

        const approvedQ = query(
            collection(db, 'listings'),
            where('status', '==', 'Approved'),
            orderBy('createdAt', 'desc')
        );
        unsubs.push(
            onSnapshot(approvedQ, (snap) => {
                setApprovedListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
                if (!approvedDone) { approvedDone = true; checkListingsDone(); }
            }, (err) => {
                console.error('[AppData] approvedListings listener error — check for missing Firestore index:', err);
                if (!approvedDone) { approvedDone = true; checkListingsDone(); }
            })
        );

        const myListingsQ = query(
            collection(db, 'listings'),
            where('postedBy', '==', uid),
            orderBy('createdAt', 'desc')
        );
        unsubs.push(
            onSnapshot(myListingsQ, (snap) => {
                setMyListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
                if (!myDone) { myDone = true; checkListingsDone(); }
            }, (err) => {
                console.error('[AppData] myListings listener error — check for missing Firestore index:', err);
                if (!myDone) { myDone = true; checkListingsDone(); }
            })
        );

        // ── 5. Announcements ──────────────────────────────────────────────────
        const announcementsQ = query(
            collection(db, 'announcements'),
            orderBy('createdAt', 'desc')
        );
        unsubs.push(
            onSnapshot(announcementsQ, (snap) => {
                setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
                markReady();
            }, (err) => {
                console.error('[AppData] announcements listener error — check for missing Firestore index:', err);
                markReady();
            })
        );

        return () => {
            unsubs.forEach(u => u());
            isFirstUser.current = null;
        };
    }, [uid, isResident]);

    // refresh() is a no-op — onSnapshot keeps everything current automatically.
    const refresh = () => { };

    return (
        <AppDataContext.Provider
            value={{ bills, vehicles, vehicleLogs, approvedListings, myListings, announcements, initializing, refresh }}
        >
            {children}
        </AppDataContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppData() {
    return useContext(AppDataContext);
}
