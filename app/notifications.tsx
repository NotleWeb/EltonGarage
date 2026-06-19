import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppNotification, useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

function typeIcon(type: AppNotification["type"]): string {
  if (type === "estoque") return "alert-triangle";
  if (type === "agendamento") return "calendar";
  return "user-check";
}

function typeColor(type: AppNotification["type"], colors: any): string {
  if (type === "estoque") return colors.warning;
  if (type === "agendamento") return colors.success;
  if (type === "retorno_45") return "#EF4444";
  if (type === "retorno_30") return "#F59E0B";
  if (type === "retorno_20") return "#D4AF37";
  return "#8B5CF6";
}

function typeLabel(type: AppNotification["type"]): string {
  if (type === "estoque") return "Estoque";
  if (type === "agendamento") return "Agendamento";
  if (type === "retorno_45") return "Retorno 45d";
  if (type === "retorno_30") return "Retorno 30d";
  if (type === "retorno_20") return "Retorno 20d";
  return "Retorno 15d";
}

function typeBg(type: AppNotification["type"]): string {
  if (type === "estoque") return "rgba(245,158,11,0.12)";
  if (type === "agendamento") return "rgba(34,197,94,0.12)";
  if (type === "retorno_45") return "rgba(239,68,68,0.12)";
  if (type === "retorno_30") return "rgba(245,158,11,0.12)";
  if (type === "retorno_20") return "rgba(212,175,55,0.12)";
  return "rgba(139,92,246,0.12)";
}

function isRetornoType(type: AppNotification["type"]): boolean {
  return type === "retorno_15" || type === "retorno_20" || type === "retorno_30" || type === "retorno_45";
}

function getStageWhatsAppMsg(type: AppNotification["type"], customerName: string): string {
  if (type === "retorno_15") return `Olá ${customerName}! Que tal uma lavagem de manutenção para manter seu veículo impecável?`;
  if (type === "retorno_20") return `Olá ${customerName}! Tudo bem com o serviço realizado? Estamos à disposição para cuidar do seu veículo.`;
  if (type === "retorno_30") return `Olá ${customerName}! Já faz um mês desde o último serviço. Que tal agendar uma nova visita?`;
  return `Olá ${customerName}! Sentimos sua falta! Temos uma condição especial para você voltar. Vamos conversar?`;
}

export default function NotificacoesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notifications, customers, dismissNotification, markAllNotificationsRead } = useData();

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleDismiss = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dismissNotification(id);
  };

  const handleMarkAll = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markAllNotificationsRead();
  };

  const handleNotificationPress = (n: AppNotification) => {
    if (n.customerId) {
      if (isRetornoType(n.type)) {
        const customer = customers.find((c) => c.id === n.customerId);
        if (customer) {
          const phone = customer.phone.replace(/\D/g, "");
          const msg = getStageWhatsAppMsg(n.type, customer.name);
          Linking.openURL(`whatsapp://send?phone=55${phone}&text=${encodeURIComponent(msg)}`);
        }
        return;
      }
      router.push(`/customer/${n.customerId}`);
    } else if (n.appointmentId) {
      router.push("/(tabs)/schedule");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
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
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.muted }]}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Notificações
        </Text>
        {notifications.length > 0 ? (
          <Pressable onPress={handleMarkAll}>
            <Text style={{ color: colors.accent, fontFamily: "Inter_500Medium", fontSize: 13 }}>
              Dispensar todas
            </Text>
          </Pressable>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {/* Legend */}
      {notifications.length > 0 && (
        <View style={[styles.legend, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          {[
            { label: "15d", color: "#8B5CF6", bg: "rgba(139,92,246,0.15)" },
            { label: "20d", color: "#D4AF37", bg: "rgba(212,175,55,0.15)" },
            { label: "30d", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
            { label: "45d", color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
          ].map((s) => (
            <View key={s.label} style={[styles.legendItem, { backgroundColor: s.bg, borderRadius: 8 }]}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: s.color }} />
              <Text style={{ color: s.color, fontFamily: "Inter_600SemiBold", fontSize: 11 }}>
                {s.label}
              </Text>
            </View>
          ))}
          <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 11, flex: 1, textAlign: "right" }}>
            dias sem retorno
          </Text>
        </View>
      )}

      {notifications.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 40 }}>
          <View style={[styles.emptyIcon, { backgroundColor: "rgba(107,63,160,0.1)" }]}>
            <Feather name="bell-off" size={32} color={colors.mutedForeground} />
          </View>
          <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 17, textAlign: "center" }}>
            Sem notificações
          </Text>
          <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" }}>
            Você está em dia! Nenhuma ação necessária no momento.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          contentContainerStyle={[styles.list, { paddingBottom: 100 + (Platform.OS === "web" ? 34 : 0) }]}
          ListHeaderComponent={
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13, marginBottom: 12 }}>
              {notifications.length} notificação{notifications.length !== 1 ? "ões" : ""} pendente{notifications.length !== 1 ? "s" : ""}
            </Text>
          }
          renderItem={({ item: n }) => {
            const ic = typeIcon(n.type);
            const col = typeColor(n.type, colors);
            const bg = typeBg(n.type);
            const lbl = typeLabel(n.type);
            const customer = n.customerId ? customers.find((c) => c.id === n.customerId) : null;
            const isRetorno = isRetornoType(n.type);

            return (
              <Pressable
                onPress={() => handleNotificationPress(n)}
                style={({ pressed }) => [
                  styles.notifCard,
                  { backgroundColor: pressed ? colors.muted : colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={[styles.notifIcon, { backgroundColor: bg }]}>
                  <Feather name={ic as any} size={20} color={col} />
                </View>

                <View style={{ flex: 1 }}>
                  {/* Type badge */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <View style={[styles.typeBadge, { backgroundColor: bg }]}>
                      <Text style={{ color: col, fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 0.5 }}>
                        {lbl.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Message */}
                  <Text style={{ color: colors.foreground, fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20, marginBottom: isRetorno && customer ? 10 : 0 }}>
                    {n.message}
                  </Text>

                  {/* Action buttons for follow-up types */}
                  {isRetorno && customer && (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Pressable
                        onPress={() => {
                          const phone = customer.phone.replace(/\D/g, "");
                          Linking.openURL(`tel:${phone}`);
                        }}
                        style={[styles.actionBtn, { backgroundColor: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.25)" }]}
                      >
                        <Feather name="phone" size={13} color={colors.success} />
                        <Text style={{ color: colors.success, fontFamily: "Inter_500Medium", fontSize: 12 }}>Ligar</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          const phone = customer.phone.replace(/\D/g, "");
                          const msg = getStageWhatsAppMsg(n.type, customer.name);
                          Linking.openURL(`whatsapp://send?phone=55${phone}&text=${encodeURIComponent(msg)}`);
                        }}
                        style={[styles.actionBtn, { backgroundColor: "rgba(37,211,102,0.1)", borderColor: "rgba(37,211,102,0.25)" }]}
                      >
                        <Feather name="message-circle" size={13} color="#25D366" />
                        <Text style={{ color: "#25D366", fontFamily: "Inter_500Medium", fontSize: 12 }}>WhatsApp</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => router.push(`/customer/${customer.id}`)}
                        style={[styles.actionBtn, { backgroundColor: "rgba(107,63,160,0.1)", borderColor: "rgba(107,63,160,0.25)", flex: 1 }]}
                      >
                        <Feather name="user" size={13} color={colors.primaryLight} />
                        <Text style={{ color: colors.primaryLight, fontFamily: "Inter_500Medium", fontSize: 12 }}>Perfil</Text>
                      </Pressable>
                    </View>
                  )}
                </View>

                {/* Dismiss button */}
                <Pressable onPress={() => handleDismiss(n.id)} hitSlop={8} style={{ padding: 4 }}>
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  list: { padding: 16 },
  notifCard: { borderRadius: 16, padding: 16, borderWidth: 1, flexDirection: "row", gap: 14, marginBottom: 10 },
  notifIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  typeBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 },
});
