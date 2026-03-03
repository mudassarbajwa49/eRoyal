/**
 * AdminDataContext
 *
 * Starts one set of Firestore onSnapshot listeners when an admin logs in
 * and keeps all admin-scoped data alive in memory for the session lifetime.
 *
 * WHY: Admin screens previously called getDocs() or created inline onSnapshot
 * listeners on every mount — causing a cold Firestore round-trip (300–800 ms)
 * every time the admin navigated to any screen.
 *
 * HOW: Listeners are set up here once. Every admin screen reads from this
 * context and gets data instantly, with live real-time updates as a bonus.
 *
 * Collections covered:
 *  - bills       (all non-Draft, non-archived)
 *  - complaints  (all)
 *  - listings    (all statuses — split into pending/approved/rejected by the hook)
 *  - vehicleLogs (all, most recent 200)
 */

import {
    collection,
    limit,
    onSnapshot,
    orderBy,
    query
} from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../../firebaseConfig';
import { Bill, Complaint, Listing, RegisteredVehicle, VehicleLog } from '../types';
import { useAuth } from './AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminData {
    bills: Bill[];
    complaints: Complaint[];
    /** All listings — split into status buckets below */
    allListings: Listing[];
    pendingListings: Listing[];
    approvedListings: Listing[];
    rejectedListings: Listing[];
    vehicleLogs: VehicleLog[];
    /** All registered vehicles in the society */
    registeredVehicles: RegisteredVehicle[];
    /** True only on the very first load before all listeners have fired */
    initializing: boolean;
}

interface AdminDataContextValue extends AdminData {
    /** No-op — onSnapshot keeps data fresh automatically.
     *  Kept for pull-to-refresh compatibility. */
    refresh: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AdminDataContext = createContext<AdminDataContextValue>({
    bills: [],
    complaints: [],
    allListings: [],
    pendingListings: [],
    approvedListings: [],
    rejectedListings: [],
    vehicleLogs: [],
    registeredVehicles: [],
    initializing: true,
    refresh: () => { },
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AdminDataProvider({ children }: { children: React.ReactNode }) {
    const { userProfile } = useAuth();
    // Case-insensitive check — handles 'admin', 'Admin', etc.
    const isAdmin = userProfile?.role?.toLowerCase() === 'admin';

    // Diagnostic: log what role the context sees so we can trace issues
    React.useEffect(() => {
        console.log('[AdminDataContext] userProfile role:', userProfile?.role, '| isAdmin:', isAdmin, '| uid:', userProfile?.uid);
    }, [userProfile?.role, isAdmin]);

    const [bills, setBills] = useState<Bill[]>([]);
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [allListings, setAllListings] = useState<Listing[]>([]);
    const [vehicleLogs, setVehicleLogs] = useState<VehicleLog[]>([]);
    const [registeredVehicles, setRegisteredVehicles] = useState<RegisteredVehicle[]>([]);
    const [initializing, setInitializing] = useState(true);

    // Track how many listeners have fired at least once
    const readyCount = useRef(0);
    const TOTAL_LISTENERS = 5; // bills, complaints, listings, vehicleLogs, registeredVehicles
    const listenersStarted = useRef(false);

    const markReady = () => {
        readyCount.current += 1;
        if (readyCount.current >= TOTAL_LISTENERS) {
            setInitializing(false);
        }
    };

    useEffect(() => {
        if (!isAdmin) {
            // Reset when logged out or not admin
            setBills([]);
            setComplaints([]);
            setAllListings([]);
            setVehicleLogs([]);
            setRegisteredVehicles([]);
            setInitializing(false); // not applicable for this role — don't leave in loading state
            readyCount.current = 0;
            listenersStarted.current = false;
            return;
        }

        // Avoid re-registering listeners on re-renders
        if (listenersStarted.current) return;
        listenersStarted.current = true;
        readyCount.current = 0;
        setInitializing(true);

        const unsubs: (() => void)[] = [];

        // ── 1. Bills (all) — filter Draft/archived in memory to avoid compound indexes ─
        const billsQ = query(
            collection(db, 'bills'),
            orderBy('createdAt', 'desc')
        );
        unsubs.push(
            onSnapshot(billsQ, (snap) => {
                const allBills = snap.docs.map(d => ({ id: d.id, ...d.data() } as Bill));
                // Filter client-side: hide Draft and archived bills
                setBills(allBills.filter(b => b.status !== 'Draft' && !b.isArchived));
                markReady();
            }, (err) => {
                console.error('[AdminData] bills listener error:', err);
                markReady();
            })
        );

        // ── 2. Complaints (all) ───────────────────────────────────────────────
        const complaintsQ = query(
            collection(db, 'complaints'),
            orderBy('createdAt', 'desc')
        );
        unsubs.push(
            onSnapshot(complaintsQ, (snap) => {
                setComplaints(snap.docs.map(d => ({ id: d.id, ...d.data() } as Complaint)));
                markReady();
            }, (err) => {
                console.error('[AdminData] complaints listener error — check for missing Firestore index:', err);
                markReady();
            })
        );

        // ── 3. Listings (all statuses) ────────────────────────────────────────
        const listingsQ = query(
            collection(db, 'listings'),
            orderBy('createdAt', 'desc')
        );
        unsubs.push(
            onSnapshot(listingsQ, (snap) => {
                setAllListings(snap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));
                markReady();
            }, (err) => {
                console.error('[AdminData] listings listener error — check for missing Firestore index:', err);
                markReady();
            })
        );

        // ── 4. Vehicle Logs (most recent 200) ─────────────────────────────────
        const logsQ = query(
            collection(db, 'vehicleLogs'),
            orderBy('entryTime', 'desc'),
            limit(200)
        );
        unsubs.push(
            onSnapshot(logsQ, (snap) => {
                setVehicleLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as VehicleLog)));
                markReady();
            }, (err) => {
                console.error('[AdminData] vehicleLogs listener error — check for missing Firestore index:', err);
                markReady();
            })
        );

        // ── 5. Registered Vehicles (all, for admin overview) ──────────────────
        const regVehiclesQ = query(
            collection(db, 'registeredVehicles')
        );
        unsubs.push(
            onSnapshot(regVehiclesQ, (snap) => {
                setRegisteredVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() } as RegisteredVehicle)));
                markReady();
            }, (err) => {
                console.error('[AdminData] registeredVehicles listener error — check for missing Firestore index:', err);
                markReady();
            })
        );

        return () => {
            unsubs.forEach(u => u());
            listenersStarted.current = false;
        };
    }, [isAdmin]);

    // Derive listing status buckets — zero extra Firestore reads
    const pendingListings = useMemo(
        () => allListings.filter(l => l.status === 'Pending'),
        [allListings]
    );
    const approvedListings = useMemo(
        () => allListings.filter(l => l.status === 'Approved'),
        [allListings]
    );
    const rejectedListings = useMemo(
        () => allListings.filter(l => l.status === 'Rejected'),
        [allListings]
    );

    const refresh = () => { }; // no-op

    return (
        <AdminDataContext.Provider value={{
            bills,
            complaints,
            allListings,
            pendingListings,
            approvedListings,
            rejectedListings,
            vehicleLogs,
            registeredVehicles,
            initializing,
            refresh,
        }}>
            {children}
        </AdminDataContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAdminData() {
    return useContext(AdminDataContext);
}
