/**
 * SecurityDataContext
 *
 * Starts two Firestore onSnapshot listeners when a security guard logs in:
 *  - activeVehicles    : vehicleLogs where exitTime == null (vehicles currently inside)
 *  - registeredVehicles: all registered vehicles (for instant in-memory plate lookup)
 *
 * WHY: gate-entry.tsx previously called getDocs() for every plate lookup and
 * for the active-vehicles list — a cold Firestore round-trip each time.
 *
 * HOW: Listeners fire once on login and push live updates automatically.
 * Plate lookups in the gate-entry screen become instant (Array.find in memory),
 * and the exit tab count badge stays accurate in real-time.
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
import { RegisteredVehicle, VehicleLog } from '../types';
import { useAuth } from './AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SecurityData {
    /** Vehicles currently inside (exitTime == null), live via onSnapshot */
    activeVehicles: VehicleLog[];
    /** All registered vehicles in the society — used for instant plate lookup */
    registeredVehicles: RegisteredVehicle[];
    /** All vehicle logs (entries + exits) — for display / history if needed */
    vehicleLogs: VehicleLog[];
    /** True only on the very first load before any listener fires */
    initializing: boolean;
}

const SecurityDataContext = createContext<SecurityData>({
    activeVehicles: [],
    registeredVehicles: [],
    vehicleLogs: [],
    initializing: true,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SecurityDataProvider({ children }: { children: React.ReactNode }) {
    const { userProfile } = useAuth();
    // Case-insensitive check — handles 'security', 'Security', etc.
    const isSecurity = userProfile?.role?.toLowerCase() === 'security';

    // Diagnostic: print the role value to detect capitalization issues
    React.useEffect(() => {
        console.log('[SecurityDataContext] userProfile role:', userProfile?.role, '| isSecurity:', isSecurity, '| uid:', userProfile?.uid);
    }, [userProfile?.role, isSecurity]);

    const [activeVehicles, setActiveVehicles] = useState<VehicleLog[]>([]);
    const [registeredVehicles, setRegisteredVehicles] = useState<RegisteredVehicle[]>([]);
    const [vehicleLogs, setVehicleLogs] = useState<VehicleLog[]>([]);
    const [initializing, setInitializing] = useState(true);

    const readyCount = useRef(0);
    const TOTAL_LISTENERS = 3; // activeVehicles, registeredVehicles, vehicleLogs
    const listenersStarted = useRef(false);

    const markReady = () => {
        readyCount.current += 1;
        if (readyCount.current >= TOTAL_LISTENERS) {
            setInitializing(false);
        }
    };

    useEffect(() => {
        if (!isSecurity) {
            setActiveVehicles([]);
            setRegisteredVehicles([]);
            setVehicleLogs([]);
            setInitializing(true);
            readyCount.current = 0;
            listenersStarted.current = false;
            return;
        }

        if (listenersStarted.current) return;
        listenersStarted.current = true;
        readyCount.current = 0;
        setInitializing(true);

        const unsubs: (() => void)[] = [];

        // ── 1. Active vehicles (currently inside) ─────────────────────────────
        const activeQ = query(
            collection(db, 'vehicleLogs'),
            where('exitTime', '==', null),
            orderBy('entryTime', 'desc')
        );
        unsubs.push(
            onSnapshot(activeQ, (snap) => {
                setActiveVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() } as VehicleLog)));
                markReady();
            }, (err) => {
                console.warn('[SecurityData] activeVehicles listener error:', err.message);
                markReady();
            })
        );

        // ── 2. All registered vehicles (for instant in-memory plate lookup) ───
        const regQ = query(
            collection(db, 'registeredVehicles')
        );
        unsubs.push(
            onSnapshot(regQ, (snap) => {
                setRegisteredVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() } as RegisteredVehicle)));
                markReady();
            }, (err) => {
                console.warn('[SecurityData] registeredVehicles listener error:', err.message);
                markReady();
            })
        );

        // ── 3. All vehicle logs (entry + exit history) ────────────────────────
        const logsQ = query(
            collection(db, 'vehicleLogs'),
            orderBy('entryTime', 'desc')
        );
        unsubs.push(
            onSnapshot(logsQ, (snap) => {
                setVehicleLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as VehicleLog)));
                markReady();
            }, (err) => {
                console.warn('[SecurityData] vehicleLogs listener error:', err.message);
                markReady();
            })
        );

        return () => {
            unsubs.forEach(u => u());
            listenersStarted.current = false;
        };
    }, [isSecurity]);

    return (
        <SecurityDataContext.Provider value={{ activeVehicles, registeredVehicles, vehicleLogs, initializing }}>
            {children}
        </SecurityDataContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSecurityData() {
    return useContext(SecurityDataContext);
}
