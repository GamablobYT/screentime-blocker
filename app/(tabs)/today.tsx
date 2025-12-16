import React, { useEffect, useMemo, useState } from "react";
import { AppState, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { getTodayUsage, hasUsageAccess, openUsageAccessSettings, type UsageRow } from "../../modules/screentime";

function msToHuman(ms: number | undefined | null) {
    const safe = Number(ms);
    if (!Number.isFinite(safe)) return "0m";
    const s = Math.floor(safe / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
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

    async function refresh() {
        const ok = await hasUsageAccess();
        setAllowed(ok);
        if (!ok) return;

        setLoading(true);
        try {
            const data = await getTodayUsage();
            // console.log("Fetched usage data:", data);
            setRows(data);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        refresh();

        const sub = AppState.addEventListener("change", (state) => {
            if (state === "active") { // when user returns from settings
                refresh(); 
            }
        });
        return () => sub.remove();
    }, []);

    if (allowed === false) {
        return (
            <View style={{ flex: 1, padding: 16, gap: 12 }}>
                <Text style={{ fontSize: 22, fontWeight: "700" }}>Enable Usage Access</Text>
                <Text style={{ opacity: 0.8 }}>
                    Android requires "Usage Access" permission so we can read your app screen-time
                </Text>

                <Pressable
                    onPress={openUsageAccessSettings}
                    style={{ padding: 14, borderRadius: 12, backgroundColor: "#2b6" }}
                >
                    <Text style={{ fontWeight: "700" }}>Open Usage Access Settings</Text>
                </Pressable>
            </View>
        );
    }

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>Today's Usage</Text>
      <Text style={{ opacity: 0.8 }}>
        Total Screen Time: {msToHuman(totalMs)} {loading ? "(loading...)" : ""}
      </Text>

            <FlatList
                data={rows}
                keyExtractor={(item) => item.packageName}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                refreshControl={
                    <RefreshControl
                        refreshing={loading}
                        onRefresh={refresh}
                        colors={["#2b6"]}
                        tintColor="#2b6"
                    />
                }
                renderItem={({ item }) => (
                        <View style={{ padding: 14, borderRadius: 12, backgroundColor: "#222" }}>
                                <Text style={{ fontWeight: "700", color: "#fff" }}>{item.label}</Text>
                                <Text style={{ opacity: 0.8, color: "#fff" }}>Time: {msToHuman(item.totalTimeInForeground)}</Text>
                                <Text style={{ opacity: 0.4, marginTop: 4, color: "#fff" }}>{item.packageName}</Text>
                        </View>
                )}
                />
    </View>
  );
}