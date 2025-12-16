import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useState } from "react";
import {
    AppState,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import {
    getTodayUsage,
    hasUsageAccess,
    openUsageAccessSettings,
    type UsageRow,
} from "../../modules/screentime";

const BAR_MAX_HEIGHT = 140;
const COLORS = [
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#a855f7", // purple
    "#ec4899", // pink
    "#f43f5e", // rose
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#14b8a6", // teal
    "#0ea5e9", // sky
];

function msToHuman(ms: number | undefined | null) {
    const safe = Number(ms);
    if (!Number.isFinite(safe)) return "0m";
    const s = Math.floor(safe / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return `${s}s`;
}

export default function Today() {
    const [allowed, setAllowed] = useState<boolean | null>(null);
    const [rows, setRows] = useState<UsageRow[]>([]);
    const [loading, setLoading] = useState(false);

    const totalMs = useMemo(
        () => rows.reduce((acc, row) => acc + (row.totalTimeInForeground ?? 0), 0),
        [rows]
    );

    const maxMs = useMemo(
        () => Math.max(...rows.map((r) => r.totalTimeInForeground ?? 0), 1),
        [rows]
    );

    async function refresh() {
        const ok = await hasUsageAccess();
        setAllowed(ok);
        if (!ok) return;

        setLoading(true);
        try {
            const data = await getTodayUsage();
            setRows(data);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();

        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") {
                refresh();
            }
        });
        return () => sub.remove();
    }, []);

    if (allowed === false) {
        return (
            <View style={styles.container}>
                <View style={styles.permissionCard}>
                    <Text style={styles.permissionTitle}>🔒 Enable Usage Access</Text>
                    <Text style={styles.permissionDesc}>
                        We need permission to read your app screen-time stats.
                    </Text>
                    <Pressable onPress={openUsageAccessSettings} style={styles.permissionBtn}>
                        <Text style={styles.permissionBtnText}>Open Settings</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#6366f1" colors={["#6366f1"]} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.greeting}>Today's Screen Time</Text>
                <View style={styles.totalCard}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>{msToHuman(totalMs)}</Text>
                </View>
            </View>

            {/* Bar Chart */}
            <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>App Usage</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
                    {rows.slice(0, 10).map((item, idx) => {
                        const ratio = (item.totalTimeInForeground ?? 0) / maxMs;
                        const barHeight = Math.max(ratio * BAR_MAX_HEIGHT, 8);
                        const color = COLORS[idx % COLORS.length];
                        return (
                            <View key={item.packageName} style={styles.barWrapper}>
                                <Text style={styles.barTime}>{msToHuman(item.totalTimeInForeground)}</Text>
                                <View style={[styles.barOuter, { height: BAR_MAX_HEIGHT }]}>
                                    <LinearGradient
                                        colors={[color, `${color}99`]}
                                        style={[styles.barInner, { height: barHeight }]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 0, y: 1 }}
                                    />
                                </View>
                                <Text style={styles.barLabel} numberOfLines={1}>
                                    {item.label?.split(" ")[0] ?? "App"}
                                </Text>
                            </View>
                        );
                    })}
                </ScrollView>
            </View>

            {/* List */}
            <View style={styles.listCard}>
                <Text style={styles.chartTitle}>Details</Text>
                {rows.map((item, idx) => {
                    const ratio = (item.totalTimeInForeground ?? 0) / maxMs;
                    const color = COLORS[idx % COLORS.length];
                    return (
                        <View key={item.packageName} style={styles.listItem}>
                            <View style={[styles.listDot, { backgroundColor: color }]} />
                            <View style={styles.listInfo}>
                                <Text style={styles.listLabel}>{item.label}</Text>
                                <View style={styles.progressBg}>
                                    <View style={[styles.progressFill, { width: `${ratio * 100}%`, backgroundColor: color }]} />
                                </View>
                            </View>
                            <Text style={styles.listTime}>{msToHuman(item.totalTimeInForeground)}</Text>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f0f0f",
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    greeting: {
        fontSize: 28,
        fontWeight: "800",
        color: "#fff",
        marginBottom: 16,
    },
    totalCard: {
        backgroundColor: "#1a1a2e",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
    },
    totalLabel: {
        fontSize: 14,
        color: "#888",
        marginBottom: 4,
    },
    totalValue: {
        fontSize: 42,
        fontWeight: "700",
        color: "#6366f1",
    },
    chartCard: {
        backgroundColor: "#1a1a2e",
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 16,
    },
    chartScroll: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 16,
        paddingVertical: 8,
    },
    barWrapper: {
        alignItems: "center",
        width: 52,
    },
    barTime: {
        fontSize: 10,
        color: "#aaa",
        marginBottom: 6,
    },
    barOuter: {
        width: 32,
        backgroundColor: "#2a2a40",
        borderRadius: 8,
        justifyContent: "flex-end",
        overflow: "hidden",
    },
    barInner: {
        width: "100%",
        borderRadius: 8,
    },
    barLabel: {
        fontSize: 10,
        color: "#ccc",
        marginTop: 8,
        textAlign: "center",
        width: 52,
    },
    listCard: {
        backgroundColor: "#1a1a2e",
        borderRadius: 20,
        padding: 20,
    },
    listItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    listDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },
    listInfo: {
        flex: 1,
    },
    listLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#fff",
        marginBottom: 6,
    },
    progressBg: {
        height: 6,
        backgroundColor: "#2a2a40",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 3,
    },
    listTime: {
        fontSize: 14,
        fontWeight: "600",
        color: "#aaa",
        marginLeft: 12,
        minWidth: 50,
        textAlign: "right",
    },
    permissionCard: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#fff",
        marginBottom: 12,
    },
    permissionDesc: {
        fontSize: 16,
        color: "#888",
        textAlign: "center",
        marginBottom: 24,
    },
    permissionBtn: {
        backgroundColor: "#6366f1",
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 14,
    },
    permissionBtnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
});