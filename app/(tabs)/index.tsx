import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StatCard } from "@/components/shared";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

function formatCurrency(val: number) {
  return "R$ " + val.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
}
function getMonthName() {
  return new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
function today() { return new Date().toISOString().slice(0, 10); }
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function getStage(days: number): { label: string; days: number; color: string; bg: string } {
  if (days >= 45) return { label: "45 dias", days: 45, color: "#EF4444", bg: "rgba(239,68,68,0.15)" };
  if (days >= 30) return { label: "30 dias", days: 30, color: "#F59E0B", bg: "rgba(245,158,11,0.15)" };
  if (days >= 20) return { label: "20 dias", days: 20, color: "#D4AF37", bg: "rgba(212,175,55,0.15)" };
  return { label: "15 dias", days: 15, color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" };
}

function getWhatsAppMessage(customerName: string, stage: number): string {
  if (stage === 15) return `Olá ${customerName}! Que tal uma lavagem de manutenção para manter seu veículo impecável?`;
  if (stage === 20) return `Olá ${customerName}! Estamos à disposição para cuidar do seu veículo. Tudo bem com o serviço realizado?`;
  if (stage === 30) return `Olá ${customerName}! Já faz um mês desde o último serviço. Que tal agendar uma nova visita?`;
  return `Olá ${customerName}! Sentimos sua falta! Temos uma condição especial para você voltar. Vamos conversar?`;
}

export default function PainelScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isLoggedIn, isLoading, logout } = useAuth();
  const { appointments, customers, services, inventory, unreadCount } = useData();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) router.replace("/");
  }, [isLoggedIn, isLoading]);

  const todayAppts = appointments.filter(
    (a) => a.date === today() && a.status !== "cancelado"
  );

  const now = new Date();
  const completedThisMonth = appointments.filter((a) => {
    const d = new Date(a.date);
    return (
      a.status === "concluido" &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });

  const monthlyRevenue = completedThisMonth.reduce(
    (sum, a) => sum + (a.totalValue ?? 0), 0
  );

  const lowStockItems = inventory.filter((i) => i.quantity < i.minStock);

  // ── Clientes para Retorno — 15 / 20 / 30 / 45 dias ──
  const followUpClients = useMemo(() => {
    return customers
      .map((c) => {
        const lastDone = appointments
          .filter((a) => a.customerId === c.id && a.status === "concluido" && a.completedAt)
          .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))
          [0];
        if (!lastDone) return null;
        const days = Math.floor(
          (Date.now() - new Date(lastDone.completedAt!).getTime()) / 86400000
        );
        // Only show customers in the 15-89 day window
        if (days < 15 || days >= 90) return null;
        const svcNames = services
          .filter((s) => lastDone.serviceIds?.includes(s.id))
          .map((s) => s.name)
          .join(", ");
        const stage = getStage(days);
        return { customer: c, days, lastAppt: lastDone, svcNames, stage };
      })
      .filter(Boolean)
      .sort((a, b) => b!.days - a!.days) as Array<{
        customer: typeof customers[0];
        days: number;
        lastAppt: typeof appointments[0];
        svcNames: string;
        stage: ReturnType<typeof getStage>;
      }>;
  }, [customers, appointments, services]);

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scroll, { paddingBottom: 100 + (Platform.OS === "web" ? 34 : 0) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={["#1A0D35", "#0A0518"]} style={[styles.header, { paddingTop: topInsets + 16 }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting()}</Text>
              <Text style={[styles.brandName, { color: colors.foreground }]}>Elton Garage</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
              <Pressable onPress={() => router.push("/notifications")} style={styles.headerBtn}>
                <Feather name="bell" size={20} color={colors.accent} />
                {unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
                  </View>
                )}
              </Pressable>
              <Pressable onPress={() => router.push("/reports")} style={styles.headerBtn}>
                <Feather name="bar-chart-2" size={20} color={colors.mutedForeground} />
              </Pressable>
              <Pressable onPress={logout} style={styles.headerBtn}>
                <Feather name="log-out" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          {/* Revenue card */}
          <LinearGradient colors={["#3D1A6E", "#5B2D9E"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.revenueCard, { borderColor: colors.goldBorder }]}>
            <View>
              <Text style={styles.revenueLabel}>Receita Mensal · {getMonthName()}</Text>
              <Text style={styles.revenueAmount}>{formatCurrency(monthlyRevenue)}</Text>
              <Text style={styles.revenueSubtext}>{completedThisMonth.length} serviços concluídos</Text>
            </View>
            <View style={styles.revenueIcon}>
              <Feather name="trending-up" size={28} color="#D4AF37" />
            </View>
          </LinearGradient>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard label="Clientes" value={customers.length} icon="users" />
          <StatCard label="Hoje" value={todayAppts.length} icon="calendar" accent />
        </View>
        <View style={[styles.statsRow, { marginTop: 12 }]}>
          <StatCard label="Serviços" value={services.length} icon="tool" />
          <StatCard label="Estoque baixo" value={lowStockItems.length} icon="alert-triangle" accent={lowStockItems.length > 0} />
        </View>

        {/* Today's appointments */}
        <View style={{ marginTop: 28 }}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Agenda de Hoje</Text>
            <Pressable onPress={() => router.push("/(tabs)/schedule")}>
              <Text style={{ color: colors.accent, fontFamily: "Inter_500Medium", fontSize: 13 }}>Ver todos</Text>
            </Pressable>
          </View>
          {todayAppts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Feather name="calendar" size={22} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Nenhum agendamento hoje</Text>
            </View>
          ) : (
            todayAppts.map((appt) => {
              const customer = customers.find((c) => c.id === appt.customerId);
              const apptServices = services.filter((s) => appt.serviceIds?.includes(s.id));
              const vehicle = customer?.vehicles.find((v) => v.id === appt.vehicleId);
              return (
                <View key={appt.id} style={[styles.apptCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={[styles.apptTime, { backgroundColor: "rgba(107,63,160,0.15)" }]}>
                    <Text style={[styles.apptTimeText, { color: colors.primaryLight }]}>{appt.time}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.apptCustomer, { color: colors.foreground }]}>{customer?.name ?? "–"}</Text>
                    <Text style={[styles.apptService, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {apptServices.map((s) => s.name).join(", ")} {vehicle ? `· ${vehicle.plate}` : ""}
                    </Text>
                    <Text style={{ color: colors.accent, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                      R$ {(appt.totalValue ?? 0).toLocaleString("pt-BR")}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </View>
              );
            })
          )}
        </View>

        {/* Clientes para Retorno */}
        {followUpClients.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <View style={styles.sectionRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Clientes para Retorno</Text>
                <View style={{ backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: "#fff", fontFamily: "Inter_700Bold", fontSize: 11 }}>{followUpClients.length}</Text>
                </View>
              </View>
            </View>
            {followUpClients.map(({ customer, days, lastAppt, svcNames, stage }) => {
              const phone = customer.phone.replace(/\D/g, "");
              const vehicle = customer.vehicles.find((v) => v.id === lastAppt.vehicleId);
              const completedDate = lastAppt.completedAt
                ? new Date(lastAppt.completedAt).toLocaleDateString("pt-BR")
                : "–";
              const waMsg = getWhatsAppMessage(customer.name, stage.days);

              return (
                <View key={customer.id} style={[styles.returnCard, {
                  backgroundColor: colors.card,
                  borderColor: stage.days >= 30 ? "rgba(245,158,11,0.35)" : colors.cardBorder,
                }]}>
                  {/* Top row: avatar + info + stage badge */}
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                    <View style={[styles.returnAvatar, { backgroundColor: stage.bg }]}>
                      <Text style={{ fontFamily: "Inter_700Bold", fontSize: 15, color: stage.color }}>
                        {customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>
                        {customer.name}
                      </Text>
                      {vehicle && (
                        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                          {vehicle.brand} {vehicle.model} · {vehicle.plate}
                        </Text>
                      )}
                      <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12 }} numberOfLines={1}>
                        {svcNames}
                      </Text>
                    </View>
                    {/* Stage + days badge */}
                    <View style={{ alignItems: "center", gap: 2 }}>
                      <View style={[styles.stageBadge, { backgroundColor: stage.bg }]}>
                        <Text style={{ color: stage.color, fontFamily: "Inter_700Bold", fontSize: 11 }}>
                          {stage.label}
                        </Text>
                      </View>
                      <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 10 }}>
                        {days}d sem retorno
                      </Text>
                    </View>
                  </View>

                  {/* Details row */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <Feather name="check-circle" size={12} color={colors.success} />
                    <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                      Último serviço: {completedDate}
                    </Text>
                  </View>

                  {/* Action buttons */}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${phone}`)}
                      style={[styles.actionBtn, { backgroundColor: "rgba(34,197,94,0.12)", borderColor: "rgba(34,197,94,0.25)" }]}>
                      <Feather name="phone" size={13} color={colors.success} />
                      <Text style={{ color: colors.success, fontFamily: "Inter_500Medium", fontSize: 12 }}>Ligar</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => Linking.openURL(`whatsapp://send?phone=55${phone}&text=${encodeURIComponent(waMsg)}`)}
                      style={[styles.actionBtn, { backgroundColor: "rgba(37,211,102,0.12)", borderColor: "rgba(37,211,102,0.25)" }]}>
                      <Feather name="message-circle" size={13} color="#25D366" />
                      <Text style={{ color: "#25D366", fontFamily: "Inter_500Medium", fontSize: 12 }}>WhatsApp</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => router.push("/(tabs)/schedule?openCreate=1")}
                      style={[styles.actionBtn, { backgroundColor: "rgba(212,175,55,0.12)", borderColor: "rgba(212,175,55,0.25)", flex: 1 }]}>
                      <Feather name="calendar" size={13} color={colors.accent} />
                      <Text style={{ color: colors.accent, fontFamily: "Inter_500Medium", fontSize: 12 }}>Agendar</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Low stock alerts */}
        {lowStockItems.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Alertas de Estoque</Text>
              <Pressable onPress={() => router.push("/(tabs)/inventory")}>
                <Text style={{ color: colors.accent, fontFamily: "Inter_500Medium", fontSize: 13 }}>Gerenciar</Text>
              </Pressable>
            </View>
            {lowStockItems.map((item) => (
              <View key={item.id} style={[styles.alertCard, { backgroundColor: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.25)" }]}>
                <View style={[styles.alertIcon, { backgroundColor: "rgba(245,158,11,0.15)" }]}>
                  <Feather name="alert-triangle" size={16} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.alertName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.alertDetail, { color: colors.mutedForeground }]}>
                    {item.quantity} {item.unit} · Mín: {item.minStock} {item.unit}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick actions */}
        <View style={{ marginTop: 28 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 12 }]}>Acesso Rápido</Text>
          <View style={styles.quickRow}>
            <Pressable onPress={() => router.push("/gallery")}
              style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Feather name="image" size={22} color={colors.accent} />
              <Text style={[styles.quickLabel, { color: colors.foreground }]}>Galeria</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/reports")}
              style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Feather name="bar-chart-2" size={22} color={colors.primary} />
              <Text style={[styles.quickLabel, { color: colors.foreground }]}>Relatórios</Text>
            </Pressable>
            <Pressable onPress={() => router.push("/notifications")}
              style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: unreadCount > 0 ? colors.goldBorder : colors.cardBorder }]}>
              <View>
                <Feather name="bell" size={22} color={unreadCount > 0 ? colors.accent : colors.mutedForeground} />
                {unreadCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.quickLabel, { color: colors.foreground }]}>Avisos</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 9 },
  greeting: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  brandName: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  revenueCard: { borderRadius: 20, padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, shadowColor: "#6B3FA0", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  revenueLabel: { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_500Medium", fontSize: 12, marginBottom: 8, letterSpacing: 0.5 },
  revenueAmount: { color: "#D4AF37", fontFamily: "Inter_700Bold", fontSize: 28, marginBottom: 6 },
  revenueSubtext: { color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", fontSize: 12 },
  revenueIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: "rgba(212,175,55,0.15)", alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20, paddingTop: 0 },
  statsRow: { flexDirection: "row", gap: 12 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  emptyCard: { borderRadius: 16, padding: 24, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  apptCard: { borderRadius: 14, padding: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 },
  apptTime: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, alignItems: "center" },
  apptTimeText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  apptCustomer: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  apptService: { fontFamily: "Inter_400Regular", fontSize: 13 },
  returnCard: { borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 12 },
  returnAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  stageBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10 },
  alertCard: { borderRadius: 12, padding: 14, borderWidth: 1, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  alertIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  alertName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  alertDetail: { fontFamily: "Inter_400Regular", fontSize: 12 },
  quickRow: { flexDirection: "row", gap: 12 },
  quickBtn: { flex: 1, borderRadius: 16, padding: 16, alignItems: "center", gap: 8, borderWidth: 1 },
  quickLabel: { fontFamily: "Inter_500Medium", fontSize: 12 },
});
