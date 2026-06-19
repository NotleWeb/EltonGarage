import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BAR_MAX_WIDTH = SCREEN_WIDTH - 120;

function formatCurrency(val: number) {
  return "R$ " + val.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}

const MONTHS = [
  "Jan","Fev","Mar","Abr","Mai","Jun",
  "Jul","Ago","Set","Out","Nov","Dez",
];

const TABS = [
  { key: "revenue" as const, label: "Receita" },
  { key: "services" as const, label: "Serviços" },
  { key: "customers" as const, label: "Clientes" },
];

export default function RelatoriosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { appointments, customers, services } = useData();
  const [tab, setTab] = useState<"revenue" | "services" | "customers">("revenue");

  const now = new Date();

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = MONTHS[d.getMonth()];
    const year = d.getFullYear();
    const rev = appointments
      .filter((a) => {
        const ad = new Date(a.date);
        return (
          a.status === "concluido" &&
          ad.getMonth() === d.getMonth() &&
          ad.getFullYear() === year
        );
      })
      .reduce((sum, a) => sum + (a.totalValue ?? 0), 0);
    return { label, rev };
  });

  const maxRev = Math.max(...monthlyData.map((m) => m.rev), 1);

  const serviceCounts = services
    .map((s) => ({
      name: s.name,
      count: appointments.filter(
        (a) => (a.serviceIds ?? []).includes(s.id) && a.status === "concluido"
      ).length,
      revenue: appointments
        .filter((a) => (a.serviceIds ?? []).includes(s.id) && a.status === "concluido")
        .reduce((sum, a) => {
          const svcTotal = (a.serviceIds ?? []).length > 0 ? (a.totalValue ?? 0) / (a.serviceIds ?? []).length : 0;
          return sum + svcTotal;
        }, 0),
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...serviceCounts.map((s) => s.count), 1);

  const customerFreq = customers
    .map((c) => ({
      name: c.name,
      count: appointments.filter(
        (a) => a.customerId === c.id && a.status === "concluido"
      ).length,
      spent: appointments
        .filter((a) => a.customerId === c.id && a.status === "concluido")
        .reduce((sum, a) => sum + (a.totalValue ?? 0), 0),
    }))
    .sort((a, b) => b.count - a.count);

  const maxCustCount = Math.max(...customerFreq.map((c) => c.count), 1);

  const totalRevenue = appointments
    .filter((a) => a.status === "concluido")
    .reduce((sum, a) => sum + (a.totalValue ?? 0), 0);

  const totalCompleted = appointments.filter((a) => a.status === "concluido").length;

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: topInsets + 12,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Relatórios
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 40 + (Platform.OS === "web" ? 34 : 0) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryRow}>
          <LinearGradient
            colors={["#3D1A6E", "#5B2D9E"]}
            style={[styles.summaryCard, { borderColor: colors.goldBorder }]}
          >
            <Feather name="dollar-sign" size={22} color={colors.accent} />
            <Text style={styles.summaryValue}>{formatCurrency(totalRevenue)}</Text>
            <Text style={styles.summaryLabel}>Receita Total</Text>
          </LinearGradient>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Feather name="check-circle" size={22} color={colors.success} />
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {totalCompleted}
            </Text>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              Concluídos
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.tabRow,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[
                styles.tabItem,
                tab === t.key && {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Text
                style={{
                  color: tab === t.key ? "#fff" : colors.mutedForeground,
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 12,
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "revenue" && (
          <View
            style={[
              styles.chartCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>
              Receita Mensal (Últimos 6 Meses)
            </Text>
            {monthlyData.map((m, i) => (
              <View key={i} style={styles.barRow}>
                <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>
                  {m.label}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: m.rev > 0 ? (m.rev / maxRev) * BAR_MAX_WIDTH : 4,
                        backgroundColor:
                          i === monthlyData.length - 1
                            ? colors.accent
                            : colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barValue, { color: colors.foreground }]}>
                  {m.rev > 0 ? `R$${(m.rev / 1000).toFixed(1)}k` : "–"}
                </Text>
              </View>
            ))}
          </View>
        )}

        {tab === "services" && (
          <View
            style={[
              styles.chartCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>
              Serviços Mais Solicitados
            </Text>
            {serviceCounts.every((s) => s.count === 0) ? (
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingVertical: 20 }}>
                Nenhum serviço concluído ainda
              </Text>
            ) : (
              serviceCounts.filter((s) => s.count > 0).map((s, i) => (
                <View key={i} style={styles.barRow}>
                  <Text
                    style={[styles.barLabel, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {s.name.split(" ").slice(0, 2).join(" ")}
                  </Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: s.count > 0 ? (s.count / maxCount) * BAR_MAX_WIDTH : 4,
                          backgroundColor:
                            i === 0 ? colors.accent : colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barValue, { color: colors.foreground }]}>
                    {s.count}x
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {tab === "customers" && (
          <View
            style={[
              styles.chartCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Text style={[styles.chartTitle, { color: colors.foreground }]}>
              Clientes Mais Frequentes
            </Text>
            {customerFreq.every((c) => c.count === 0) ? (
              <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingVertical: 20 }}>
                Nenhum dado de cliente ainda
              </Text>
            ) : (
              customerFreq.filter((c) => c.count > 0).map((c, i) => (
                <View key={i} style={[styles.custRow, { borderBottomColor: colors.border }]}>
                  <View
                    style={[
                      styles.rankBadge,
                      {
                        backgroundColor:
                          i === 0
                            ? "rgba(212,175,55,0.2)"
                            : "rgba(107,63,160,0.15)",
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: i === 0 ? colors.accent : colors.primaryLight,
                        fontFamily: "Inter_700Bold",
                        fontSize: 13,
                      }}
                    >
                      #{i + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.custName, { color: colors.foreground }]}>
                      {c.name}
                    </Text>
                    <Text style={[styles.custMeta, { color: colors.mutedForeground }]}>
                      {c.count} visita{c.count !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <Text style={[styles.custSpent, { color: colors.accent }]}>
                    {formatCurrency(c.spent)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
  },
  summaryValue: {
    color: "#D4AF37",
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    textAlign: "center",
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textAlign: "center",
  },
  tabRow: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: "center",
  },
  chartCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    marginBottom: 20,
  },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },
  barLabel: {
    width: 36,
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    textAlign: "right",
  },
  barTrack: {
    flex: 1,
    height: 28,
    justifyContent: "center",
  },
  barFill: {
    height: 20,
    borderRadius: 6,
    minWidth: 4,
  },
  barValue: {
    width: 48,
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    textAlign: "right",
  },
  custRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  custName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 2,
  },
  custMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  custSpent: {
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
});
