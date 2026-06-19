import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "@/components/shared";
import { useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ClienteDetalheScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { customers, services, appointments, deleteCustomer } = useData();

  const customer = customers.find((c) => c.id === id);
  const customerAppts = appointments
    .filter((a) => a.customerId === id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const [activeTab, setActiveTab] = useState<"info" | "history">("info");

  if (!customer) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
          Cliente não encontrado.
        </Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.accent, fontFamily: "Inter_500Medium" }}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert("Excluir Cliente", `Remover ${customer.name} e todos os seus agendamentos?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteCustomer(customer.id);
          router.back();
        },
      },
    ]);
  };

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);
  const completedCount = customerAppts.filter((a) => a.status === "concluido").length;

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
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {customer.name}
        </Text>
        <Pressable onPress={handleDelete} style={styles.backBtn}>
          <Feather name="trash-2" size={20} color={colors.destructive} />
        </Pressable>
      </View>

      <View
        style={[
          styles.heroSection,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: "rgba(107,63,160,0.2)" }]}>
          <Text style={[styles.avatarText, { color: colors.primaryLight }]}>
            {customer.name
              .split(" ")
              .map((w) => w[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroName, { color: colors.foreground }]}>
            {customer.name}
          </Text>
          <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
            Cliente desde {formatDate(customer.createdAt)}
          </Text>
        </View>
        <Badge
          label={`${completedCount} visita${completedCount !== 1 ? "s" : ""}`}
          variant="gold"
        />
      </View>

      <View
        style={[
          styles.tabRow,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        {(["info", "history"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setActiveTab(t)}
            style={[
              styles.tab,
              activeTab === t && {
                borderBottomWidth: 2,
                borderBottomColor: colors.accent,
              },
            ]}
          >
            <Text
              style={{
                color: activeTab === t ? colors.accent : colors.mutedForeground,
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
              }}
            >
              {t === "info" ? "Info & Veículos" : "Histórico"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 40 + (Platform.OS === "web" ? 34 : 0) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "info" ? (
          <>
            <View
              style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            >
              <Text style={[styles.cardSectionTitle, { color: colors.mutedForeground }]}>
                CONTATO
              </Text>
              <InfoRow icon="phone" label="Telefone" value={customer.phone} colors={colors} />
              {customer.address ? (
                <InfoRow icon="map-pin" label="Endereço" value={customer.address} colors={colors} />
              ) : null}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Veículos ({customer.vehicles.length})
            </Text>
            {customer.vehicles.length === 0 ? (
              <View
                style={[
                  styles.emptyBox,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 14 }}>
                  Nenhum veículo cadastrado
                </Text>
              </View>
            ) : (
              customer.vehicles.map((v) => (
                <View
                  key={v.id}
                  style={[styles.vehicleCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                >
                  <View style={[styles.vehicleIcon, { backgroundColor: "rgba(212,175,55,0.12)" }]}>
                    <Feather name="truck" size={20} color={colors.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.vehicleName, { color: colors.foreground }]}>
                      {v.brand} {v.model}
                    </Text>
                    <Text style={[styles.vehicleMeta, { color: colors.mutedForeground }]}>
                      {v.year} · {v.plate}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            {customerAppts.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 48 }}>
                <Feather name="clock" size={32} color={colors.mutedForeground} />
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontFamily: "Inter_400Regular",
                    fontSize: 15,
                    marginTop: 12,
                  }}
                >
                  Sem histórico de serviços
                </Text>
              </View>
            ) : (
              customerAppts.map((a) => {
                const apptServices = (a.serviceIds ?? [])
                  .map((sid) => services.find((s) => s.id === sid)?.name)
                  .filter(Boolean)
                  .join(", ");
                const veh = customer.vehicles.find((v) => v.id === a.vehicleId);
                const statusVariant =
                  a.status === "concluido"
                    ? "success"
                    : a.status === "cancelado"
                    ? "danger"
                    : "gold";
                const statusLabel =
                  a.status === "concluido"
                    ? "Concluído"
                    : a.status === "cancelado"
                    ? "Cancelado"
                    : "Agendado";

                return (
                  <View
                    key={a.id}
                    style={[
                      styles.historyCard,
                      {
                        backgroundColor: colors.card,
                        borderColor:
                          a.status === "concluido"
                            ? "rgba(34,197,94,0.2)"
                            : colors.cardBorder,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={[styles.histDate, { color: colors.mutedForeground }]}>
                        {formatDate(a.date)} · {a.time}
                      </Text>
                      <Badge label={statusLabel} variant={statusVariant} />
                    </View>
                    <Text style={[styles.histService, { color: colors.foreground }]}>
                      {apptServices || "Serviço não encontrado"}
                    </Text>
                    {veh && (
                      <Text style={[styles.histVeh, { color: colors.mutedForeground }]}>
                        {veh.brand} {veh.model} · {veh.plate}
                      </Text>
                    )}
                    {a.totalValue !== undefined && a.totalValue > 0 && (
                      <Text style={[styles.histPrice, { color: colors.accent }]}>
                        R$ {a.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </Text>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }}>
        <Feather name={icon as keyof typeof Feather.glyphMap} size={15} color={colors.mutedForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11, marginBottom: 2 }}>
          {label}
        </Text>
        <Text style={{ color: colors.foreground, fontFamily: "Inter_500Medium", fontSize: 15 }}>
          {value}
        </Text>
      </View>
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
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  heroSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 20,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  heroName: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginBottom: 2,
  },
  heroSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  scroll: {
    padding: 16,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  cardSectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  emptyBox: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    alignItems: "center",
  },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  vehicleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginBottom: 3,
  },
  vehicleMeta: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  historyCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  histDate: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  histService: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginBottom: 4,
  },
  histVeh: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginBottom: 4,
  },
  histPrice: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
});
