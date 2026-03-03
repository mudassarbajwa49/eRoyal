/**
 * Admin Vehicle Logs Screen — Enhanced
 *
 * Tabs:
 *  🚗 Inside     — vehicles currently in the gate (no exitTime)
 *  👥 Residents  — all resident entries, with date filter + date picker
 *  🌍 Visitors   — all visitor entries, with date filter + date picker
 *  🏠 By House   — logs grouped by house number
 *  📝 Registered — all registered vehicles in the society
 *
 * Date filtering: Today | Yesterday | 7 Days | All + mini calendar picker
 * No third-party date-picker library needed — built with RN primitives.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Card } from '../../../src/components/common/Card';
import { useAdminData } from '../../../src/contexts/AdminDataContext';
import { RegisteredVehicle, VehicleLog } from '../../../src/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = 'inside' | 'residents' | 'visitors' | 'byHouse' | 'registered';
type QuickFilter = 'today' | 'yesterday' | 'week' | 'all';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tsToDate(ts: any): Date | null {
    if (!ts) return null;
    return ts.toDate ? ts.toDate() : new Date(ts);
}

function formatTime(ts: any): string {
    const d = tsToDate(ts);
    if (!d) return 'N/A';
    return d.toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function sameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

function startOfDay(d: Date): Date {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
}

function endOfDay(d: Date): Date {
    const r = new Date(d);
    r.setHours(23, 59, 59, 999);
    return r;
}

function isInRange(ts: any, from: Date, to: Date): boolean {
    const d = tsToDate(ts);
    if (!d) return false;
    return d >= from && d <= to;
}

function getTypeColor(type: string): string {
    switch (type) {
        case 'Resident': return '#34C759';
        case 'Visitor': return '#FF9500';
        case 'Service': return '#007AFF';
        default: return '#8E8E93';
    }
}

/** Format a Date as YYYY-MM-DD */
function fmtIso(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Get number of days in a month */
function daysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

// ── Search Bar ─────────────────────────────────────────────────

interface SearchBarProps { value: string; onChange: (t: string) => void; placeholder: string; }
function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
    return (
        <View style={sbStyles.wrap}>
            <Text style={sbStyles.icon}>🔍</Text>
            <TextInput
                style={sbStyles.input}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor="#9CA3AF"
                clearButtonMode="while-editing"
                autoCorrect={false}
                autoCapitalize="characters"
            />
            {value.length > 0 && (
                <TouchableOpacity onPress={() => onChange('')} style={sbStyles.clear}>
                    <Text style={sbStyles.clearText}>✕</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
const sbStyles = StyleSheet.create({
    wrap: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderRadius: 12,
        marginHorizontal: 12, marginBottom: 8,
        paddingHorizontal: 12, paddingVertical: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    },
    icon: { fontSize: 15, marginRight: 8 },
    input: { flex: 1, fontSize: 14, color: '#111827' },
    clear: { padding: 4 },
    clearText: { fontSize: 14, color: '#9CA3AF' },
});

// ─── Mini Calendar ────────────────────────────────────────────────────────────

interface MiniCalProps {
    selected: Date | null;
    onSelect: (d: Date) => void;
    onClose: () => void;
}

function MiniCalendar({ selected, onSelect, onClose }: MiniCalProps) {
    const today = new Date();
    const [year, setYear] = useState(selected ? selected.getFullYear() : today.getFullYear());
    const [month, setMonth] = useState(selected ? selected.getMonth() : today.getMonth());

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const firstDow = new Date(year, month, 1).getDay();
    const totalDays = daysInMonth(year, month);
    const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
    while (cells.length % 7 !== 0) cells.push(null);

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

    return (
        <View style={calStyles.container}>
            {/* Header */}
            <View style={calStyles.header}>
                <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
                    <Text style={calStyles.navText}>‹</Text>
                </TouchableOpacity>
                <Text style={calStyles.monthLabel}>{MONTHS[month]} {year}</Text>
                <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
                    <Text style={calStyles.navText}>›</Text>
                </TouchableOpacity>
            </View>
            {/* Day names */}
            <View style={calStyles.row}>
                {DAYS.map(d => (
                    <Text key={d} style={calStyles.dayName}>{d}</Text>
                ))}
            </View>
            {/* Cells */}
            {Array.from({ length: cells.length / 7 }, (_, wi) => (
                <View key={wi} style={calStyles.row}>
                    {cells.slice(wi * 7, wi * 7 + 7).map((day, ci) => {
                        if (!day) return <View key={ci} style={calStyles.cell} />;
                        const cellDate = new Date(year, month, day);
                        const isSel = selected ? sameDay(cellDate, selected) : false;
                        const isTod = sameDay(cellDate, today);
                        const isFut = cellDate > today;
                        return (
                            <TouchableOpacity
                                key={ci}
                                style={[calStyles.cell, isSel && calStyles.cellSel, isTod && !isSel && calStyles.cellToday]}
                                onPress={() => { if (!isFut) { onSelect(cellDate); onClose(); } }}
                                disabled={isFut}
                            >
                                <Text style={[calStyles.cellText, isSel && calStyles.cellTextSel, isFut && calStyles.cellTextFut]}>
                                    {day}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}
        </View>
    );
}

const calStyles = StyleSheet.create({
    container: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: 300 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    navBtn: { padding: 8 },
    navText: { fontSize: 22, color: '#007AFF', fontWeight: '600' },
    monthLabel: { fontSize: 16, fontWeight: '700', color: '#111' },
    row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
    dayName: { width: 36, textAlign: 'center', fontSize: 11, color: '#999', fontWeight: '600' },
    cell: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18 },
    cellSel: { backgroundColor: '#007AFF' },
    cellToday: { backgroundColor: '#E8F0FF' },
    cellText: { fontSize: 14, color: '#111' },
    cellTextSel: { color: '#fff', fontWeight: '700' },
    cellTextFut: { color: '#CCC' },
});

// ─── Date Filter Bar ───────────────────────────────────────────────────────────

interface DateFilterBarProps {
    quick: QuickFilter;
    customDate: Date | null;
    onQuick: (q: QuickFilter) => void;
    onCustomDate: (d: Date | null) => void;
}

function DateFilterBar({ quick, customDate, onQuick, onCustomDate }: DateFilterBarProps) {
    const [showCal, setShowCal] = useState(false);

    const PILLS: { key: QuickFilter; label: string }[] = [
        { key: 'today', label: 'Today' },
        { key: 'yesterday', label: 'Yesterday' },
        { key: 'week', label: '7 Days' },
        { key: 'all', label: 'All' },
    ];

    const customLabel = customDate
        ? customDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '📅 Pick Date';

    return (
        <View style={dfStyles.bar}>
            {PILLS.map(p => (
                <TouchableOpacity
                    key={p.key}
                    style={[dfStyles.pill, quick === p.key && !customDate && dfStyles.pillActive]}
                    onPress={() => { onCustomDate(null); onQuick(p.key); }}
                >
                    <Text style={[dfStyles.pillText, quick === p.key && !customDate && dfStyles.pillTextActive]}>
                        {p.label}
                    </Text>
                </TouchableOpacity>
            ))}
            <TouchableOpacity
                style={[dfStyles.pill, dfStyles.pillCal, customDate && dfStyles.pillActive]}
                onPress={() => setShowCal(true)}
            >
                <Text style={[dfStyles.pillText, customDate && dfStyles.pillTextActive]} numberOfLines={1}>
                    {customLabel}
                </Text>
            </TouchableOpacity>

            <Modal visible={showCal} transparent animationType="fade">
                <Pressable style={dfStyles.overlay} onPress={() => setShowCal(false)}>
                    <Pressable>
                        <View style={dfStyles.calWrapper}>
                            <MiniCalendar
                                selected={customDate}
                                onSelect={(d) => { onCustomDate(d); setShowCal(false); }}
                                onClose={() => setShowCal(false)}
                            />
                            {customDate && (
                                <TouchableOpacity
                                    style={dfStyles.clearBtn}
                                    onPress={() => { onCustomDate(null); setShowCal(false); }}
                                >
                                    <Text style={dfStyles.clearText}>Clear date</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const dfStyles = StyleSheet.create({
    bar: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 10, gap: 6, flexWrap: 'wrap' },
    pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F0F0F5' },
    pillCal: { flex: 1, maxWidth: 130 },
    pillActive: { backgroundColor: '#007AFF' },
    pillText: { fontSize: 12, fontWeight: '600', color: '#555' },
    pillTextActive: { color: '#fff' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
    calWrapper: { alignItems: 'center', gap: 8 },
    clearBtn: { backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
    clearText: { color: '#FF3B30', fontWeight: '600' },
});

// ─── Vehicle Log Card ────────────────────────────────────────────────────────

function VehicleCard({ log, showExit = true }: { log: VehicleLog; showExit?: boolean }) {
    const isResident = log.type === 'Resident';
    return (
        <Card style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.vehicleNo}>{log.vehicleNo}</Text>
                <View style={[styles.typeBadge, { backgroundColor: getTypeColor(log.type) }]}>
                    <Text style={styles.typeText}>{log.type || 'Unknown'}</Text>
                </View>
            </View>

            {isResident && log.residentName ? (
                <Text style={styles.residentLine}>🏠 {log.residentName} · House {log.houseNo}</Text>
            ) : null}
            {!isResident && log.visitorName ? (
                <Text style={styles.visitorLine}>
                    👤 {log.visitorName}{log.purpose ? `  · ${log.purpose}` : ''}
                </Text>
            ) : null}

            <View style={styles.timeBlock}>
                <View style={styles.timeRow}>
                    <Text style={styles.timeLabel}>📥 Entry</Text>
                    <Text style={styles.timeVal}>{formatTime(log.entryTime)}</Text>
                </View>
                {showExit && log.exitTime ? (
                    <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>📤 Exit</Text>
                        <Text style={styles.timeVal}>{formatTime(log.exitTime)}</Text>
                    </View>
                ) : showExit && !log.exitTime ? (
                    <View style={styles.timeRow}>
                        <Text style={styles.timeLabel}>Status</Text>
                        <View style={styles.insideBadge}><Text style={styles.insideBadgeText}>Inside</Text></View>
                    </View>
                ) : null}
            </View>
            <Text style={styles.loggedBy}>Logged by: {log.loggedByName}</Text>
        </Card>
    );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHdr({ icon, label, count, color }: { icon: string; label: string; count: number; color: string }) {
    return (
        <View style={[sectionHdrStyles.row, { borderLeftColor: color }]}>
            <Text style={sectionHdrStyles.icon}>{icon}</Text>
            <Text style={sectionHdrStyles.label}>{label}</Text>
            <View style={[sectionHdrStyles.badge, { backgroundColor: color }]}>
                <Text style={sectionHdrStyles.badgeText}>{count}</Text>
            </View>
        </View>
    );
}
const sectionHdrStyles = StyleSheet.create({
    row: {
        flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 16,
        paddingLeft: 10, borderLeftWidth: 4
    },
    icon: { fontSize: 18 },
    label: { flex: 1, fontSize: 15, fontWeight: '700', color: '#111827' },
    badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function VehiclesIndex() {
    const { vehicleLogs, registeredVehicles, refresh } = useAdminData();
    const [activeTab, setActiveTab] = useState<TabType>('inside');
    const [refreshing, setRefreshing] = useState(false);

    // ── Per-tab search state ───────────────────────────────────────────────────
    const [insideSearch, setInsideSearch] = useState('');
    const [residentSearch, setResidentSearch] = useState('');
    const [visitorSearch, setVisitorSearch] = useState('');
    const [houseSearch, setHouseSearch] = useState('');
    const [registeredSearch, setRegisteredSearch] = useState('');

    const switchTab = (t: TabType) => {
        setActiveTab(t);
        // Reset all searches on tab change
        setInsideSearch(''); setResidentSearch(''); setVisitorSearch('');
        setHouseSearch(''); setRegisteredSearch('');
    };

    // ── Date filter state ─────────────────────────────────────────────────────
    const [quick, setQuick] = useState<QuickFilter>('today');
    const [customDate, setCustomDate] = useState<Date | null>(null);

    const onRefresh = async () => {
        setRefreshing(true);
        refresh();
        setTimeout(() => setRefreshing(false), 500);
    };

    // ── Computed: date range for filter ───────────────────────────────────────
    const filterRange: { from: Date; to: Date } | null = useMemo(() => {
        if (customDate) {
            return { from: startOfDay(customDate), to: endOfDay(customDate) };
        }
        const now = new Date();
        switch (quick) {
            case 'today': return { from: startOfDay(now), to: endOfDay(now) };
            case 'yesterday': {
                const y = new Date(now); y.setDate(y.getDate() - 1);
                return { from: startOfDay(y), to: endOfDay(y) };
            }
            case 'week': {
                const w = new Date(now); w.setDate(w.getDate() - 6);
                return { from: startOfDay(w), to: endOfDay(now) };
            }
            default: return null; // 'all'
        }
    }, [quick, customDate]);

    const applyFilter = useCallback((logs: VehicleLog[]) => {
        if (!filterRange) return logs;
        return logs.filter(l => isInRange(l.entryTime, filterRange.from, filterRange.to));
    }, [filterRange]);

    // ── Search helper ─────────────────────────────────────────────────────
    const filterByPlate = (logs: VehicleLog[], q: string) => {
        if (!q.trim()) return logs;
        const upper = q.toUpperCase();
        return logs.filter(l =>
            l.vehicleNo?.toUpperCase().includes(upper) ||
            l.residentName?.toUpperCase().includes(upper) ||
            l.visitorName?.toUpperCase().includes(upper)
        );
    };

    // ── Derived data ──────────────────────────────────────────────────────────
    const activeVehicles = useMemo(() => vehicleLogs.filter(l => !l.exitTime), [vehicleLogs]);

    const residentLogs = useMemo(() =>
        applyFilter(vehicleLogs.filter(l => l.type === 'Resident')),
        [vehicleLogs, applyFilter]);

    const visitorLogs = useMemo(() =>
        applyFilter(vehicleLogs.filter(l => l.type !== 'Resident')),
        [vehicleLogs, applyFilter]);

    // Searched variants (derived from above, cheap)
    const filteredInside = useMemo(() => filterByPlate(activeVehicles, insideSearch), [activeVehicles, insideSearch]);
    const filteredResidents = useMemo(() => filterByPlate(residentLogs, residentSearch), [residentLogs, residentSearch]);
    const filteredVisitors = useMemo(() => filterByPlate(visitorLogs, visitorSearch), [visitorLogs, visitorSearch]);
    const filteredRegistered = useMemo(() => {
        if (!registeredSearch.trim()) return registeredVehicles;
        const u = registeredSearch.toUpperCase();
        return registeredVehicles.filter(v =>
            v.vehicleNo?.toUpperCase().includes(u) ||
            v.residentName?.toUpperCase().includes(u) ||
            String(v.houseNo).toUpperCase().includes(u)
        );
    }, [registeredVehicles, registeredSearch]);

    const byHouse = useMemo(() => {
        const map = new Map<string, VehicleLog[]>();
        vehicleLogs.forEach(log => {
            if (!log.houseNo) return;
            const key = String(log.houseNo);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(log);
        });
        return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
    }, [vehicleLogs]);

    // Stats (always for today)
    const todayStats = useMemo(() => {
        const now = new Date();
        const from = startOfDay(now), to = endOfDay(now);
        const todayLogs = vehicleLogs.filter(l => isInRange(l.entryTime, from, to));
        return {
            entries: todayLogs.length,
            exits: todayLogs.filter(l => !!l.exitTime).length,
            inside: activeVehicles.length,
            residents: todayLogs.filter(l => l.type === 'Resident').length,
            visitors: todayLogs.filter(l => l.type !== 'Resident').length,
        };
    }, [vehicleLogs, activeVehicles]);

    const keyExtractor = useCallback((l: VehicleLog) => l.id || '', []);
    const renderLog = useCallback(({ item }: { item: VehicleLog }) => (
        <VehicleCard log={item} showExit />
    ), []);

    const TABS: { key: TabType; label: string }[] = [
        { key: 'inside', label: `🚗 Inside (${filteredInside.length})` },
        { key: 'residents', label: `🏠 Residents (${filteredResidents.length})` },
        { key: 'visitors', label: `🌍 Visitors (${filteredVisitors.length})` },
        { key: 'byHouse', label: `🏢 By House` },
        { key: 'registered', label: `📝 Reg (${filteredRegistered.length})` },
    ];

    const showDateFilter = activeTab === 'residents' || activeTab === 'visitors';

    return (
        <View style={styles.container}>

            {/* ── Stats Strip ───────────────────────────────────────────── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
                <View style={styles.statsRow}>
                    {[
                        { label: "Today's Entries", value: todayStats.entries, color: '#007AFF' },
                        { label: 'Residents Today', value: todayStats.residents, color: '#34C759' },
                        { label: 'Visitors Today', value: todayStats.visitors, color: '#FF9500' },
                        { label: 'Exits Today', value: todayStats.exits, color: '#8E8E93' },
                        { label: 'Currently Inside', value: todayStats.inside, color: '#FF3B30' },
                    ].map(s => (
                        <View key={s.label} style={styles.statBox}>
                            <Text style={[styles.statNum, { color: s.color }]}>{s.value}</Text>
                            <Text style={styles.statLbl}>{s.label}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            {/* ── Tab Bar (horizontal scroll) ───────────────────────────── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
                <View style={styles.tabRow}>
                    {TABS.map(t => (
                        <TouchableOpacity
                            key={t.key}
                            style={[styles.tab, activeTab === t.key && styles.tabActive]}
                            onPress={() => switchTab(t.key)}
                        >
                            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                                {t.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            {/* ── Date Filter (residents + visitors only) ───────────────── */}
            {showDateFilter && (
                <DateFilterBar
                    quick={quick}
                    customDate={customDate}
                    onQuick={setQuick}
                    onCustomDate={setCustomDate}
                />
            )}

            {/* ── Inside Tab ───────────────────────────────────────────── */}
            {activeTab === 'inside' && (
                <>
                    <SearchBar value={insideSearch} onChange={setInsideSearch} placeholder="Search plate, name..." />
                    <FlatList
                        data={filteredInside}
                        renderItem={({ item }) => <VehicleCard log={item} showExit={false} />}
                        keyExtractor={keyExtractor}
                        contentContainerStyle={styles.listPad}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        ListEmptyComponent={<Text style={styles.empty}>{insideSearch ? 'No match found' : '🅿️ No vehicles inside right now'}</Text>}
                    />
                </>
            )}

            {/* ── Residents Tab ────────────────────────────────────────── */}
            {activeTab === 'residents' && (
                <>
                    <SearchBar value={residentSearch} onChange={setResidentSearch} placeholder="Search plate or resident name..." />
                    <FlatList
                        data={filteredResidents}
                        renderItem={renderLog}
                        keyExtractor={keyExtractor}
                        contentContainerStyle={styles.listPad}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        removeClippedSubviews
                        maxToRenderPerBatch={10}
                        ListHeaderComponent={
                            filteredResidents.length > 0 ? (
                                <SectionHdr icon="🏠" label="Resident Entries" count={filteredResidents.length} color="#34C759" />
                            ) : null
                        }
                        ListEmptyComponent={
                            <Text style={styles.empty}>{residentSearch ? 'No match found' : 'No resident entries for this period'}</Text>
                        }
                    />
                </>
            )}

            {/* ── Visitors Tab ──────────────────────────────────────────── */}
            {activeTab === 'visitors' && (
                <>
                    <SearchBar value={visitorSearch} onChange={setVisitorSearch} placeholder="Search plate or visitor name..." />
                    <FlatList
                        data={filteredVisitors}
                        renderItem={renderLog}
                        keyExtractor={keyExtractor}
                        contentContainerStyle={styles.listPad}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        removeClippedSubviews
                        maxToRenderPerBatch={10}
                        ListHeaderComponent={
                            filteredVisitors.length > 0 ? (
                                <SectionHdr icon="🌍" label="Visitor & Service Entries" count={filteredVisitors.length} color="#FF9500" />
                            ) : null
                        }
                        ListEmptyComponent={
                            <Text style={styles.empty}>{visitorSearch ? 'No match found' : 'No visitor entries for this period'}</Text>
                        }
                    />
                </>
            )}

            {/* ── By House Tab ─────────────────────────────────────────── */}
            {activeTab === 'byHouse' && (
                <ScrollView
                    style={styles.flex}
                    contentContainerStyle={styles.listPad}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    <SearchBar value={houseSearch} onChange={setHouseSearch}
                        placeholder="Search by house number..." />
                    {(() => {
                        const q = houseSearch.trim().toUpperCase();
                        const entries = Array.from(byHouse.entries())
                            .filter(([house]) => !q || String(house).toUpperCase().includes(q));
                        if (entries.length === 0)
                            return <Text style={styles.empty}>{q ? 'No matching house' : 'No logs yet'}</Text>;
                        return entries.map(([house, logs]) => (
                            <View key={house} style={styles.houseGroup}>
                                <View style={styles.houseHdr}>
                                    <Text style={styles.houseTitle}>🏠 House {house}</Text>
                                    <Text style={styles.houseCount}>{logs.length} total</Text>
                                </View>
                                {(() => {
                                    const res = logs.filter(l => l.type === 'Resident');
                                    const vis = logs.filter(l => l.type !== 'Resident');
                                    return (
                                        <>
                                            {res.length > 0 && (
                                                <>
                                                    <Text style={styles.subLabel}>🏠 Residents ({res.length})</Text>
                                                    {res.slice(0, 3).map(l => <VehicleCard key={l.id} log={l} />)}
                                                    {res.length > 3 && <Text style={styles.more}>+ {res.length - 3} more</Text>}
                                                </>
                                            )}
                                            {vis.length > 0 && (
                                                <>
                                                    <Text style={styles.subLabel}>🌍 Visitors ({vis.length})</Text>
                                                    {vis.slice(0, 3).map(l => <VehicleCard key={l.id} log={l} />)}
                                                    {vis.length > 3 && <Text style={styles.more}>+ {vis.length - 3} more</Text>}
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                            </View>
                        ));
                    })()}
                </ScrollView>
            )}

            {/* ── Registered Tab ───────────────────────────────────────── */}
            {activeTab === 'registered' && (
                <FlatList
                    data={filteredRegistered}
                    keyExtractor={(v: RegisteredVehicle) => v.id || ''}
                    contentContainerStyle={styles.listPad}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    removeClippedSubviews
                    maxToRenderPerBatch={15}
                    ListHeaderComponent={
                        <SearchBar value={registeredSearch} onChange={setRegisteredSearch}
                            placeholder="Search plate, name or house..." />
                    }
                    ListEmptyComponent={<Text style={styles.empty}>{registeredSearch ? 'No match found' : '🚗 No registered vehicles'}</Text>}
                    renderItem={({ item: v }: { item: RegisteredVehicle }) => (
                        <Card style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.vehicleNo}>{v.vehicleNo}</Text>
                                <View style={[styles.typeBadge,
                                { backgroundColor: v.type === 'Car' ? '#007AFF' : '#34C759' }]}>
                                    <Text style={styles.typeText}>
                                        {v.type === 'Car' ? '🚗' : '🏍️'} {v.type}
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.residentLine}>🏠 {v.residentName} · House {v.houseNo}</Text>
                            {v.color ? <Text style={styles.loggedBy}>Color: {v.color}</Text> : null}
                        </Card>
                    )}
                />
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    flex: { flex: 1 },

    // Stats
    statsScroll: { flexGrow: 0 },
    statsRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 12, gap: 10 },
    statBox: {
        backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
        alignItems: 'center', minWidth: 110,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
    },
    statNum: { fontSize: 26, fontWeight: '800', marginBottom: 2 },
    statLbl: { fontSize: 11, color: '#6B7280', textAlign: 'center' },

    // Tabs (horizontal scroll)
    tabScroll: { flexGrow: 0, maxHeight: 50 },
    tabRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 6, alignItems: 'center', paddingBottom: 8 },
    tab: {
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 20, backgroundColor: '#E5E5EA',
    },
    tabActive: { backgroundColor: '#007AFF' },
    tabText: { fontSize: 12, fontWeight: '600', color: '#555' },
    tabTextActive: { color: '#fff' },

    // List
    listPad: { padding: 12, paddingBottom: 40 },

    // Card
    card: { marginBottom: 10 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    vehicleNo: { fontSize: 17, fontWeight: '800', color: '#111827', letterSpacing: 0.3 },
    typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    typeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    residentLine: { fontSize: 13, color: '#007AFF', fontWeight: '500', marginBottom: 6 },
    visitorLine: { fontSize: 13, color: '#6B7280', marginBottom: 6 },
    timeBlock: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E5E7EB', paddingTop: 8 },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
    timeLabel: { fontSize: 12, color: '#9CA3AF' },
    timeVal: { fontSize: 12, color: '#374151', fontWeight: '500' },
    insideBadge: { backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
    insideBadgeText: { color: '#16A34A', fontSize: 11, fontWeight: '700' },
    loggedBy: { fontSize: 11, color: '#9CA3AF', fontStyle: 'italic', marginTop: 6 },

    // House group
    houseGroup: { marginBottom: 20 },
    houseHdr: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingBottom: 8, marginBottom: 6,
        borderBottomWidth: 2, borderBottomColor: '#007AFF',
    },
    houseTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
    houseCount: { fontSize: 12, color: '#6B7280' },
    subLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginVertical: 6, marginLeft: 2 },
    more: { textAlign: 'center', color: '#007AFF', fontSize: 13, paddingVertical: 6 },

    // Empty
    empty: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 40, fontSize: 14 },
});
