import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppModal, EmptyState, FormInput, GoldButton } from "@/components/shared";
import { GalleryEntry, useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function GaleriaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { gallery, customers, services, addGalleryEntry, deleteGalleryEntry } = useData();

  const [modalOpen, setModalOpen] = useState(false);
  const [viewEntry, setViewEntry] = useState<GalleryEntry | null>(null);
  const [filterCustomer, setFilterCustomer] = useState("");
  const [form, setForm] = useState({
    customerId: "",
    vehicleId: "",
    serviceId: "",
    beforeUri: "",
    afterUri: "",
    notes: "",
  });

  const filtered = gallery.filter((g) =>
    !filterCustomer || g.customerId === filterCustomer
  );

  const pickImage = async (type: "before" | "after") => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      if (type === "before") {
        setForm((f) => ({ ...f, beforeUri: result.assets[0].uri }));
      } else {
        setForm((f) => ({ ...f, afterUri: result.assets[0].uri }));
      }
    }
  };

  const handleSave = () => {
    if (!form.customerId || !form.beforeUri || !form.afterUri) {
      Alert.alert("Dados incompletos", "Selecione um cliente e ambas as fotos (antes e depois).");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addGalleryEntry({
      ...form,
      date: new Date().toISOString().slice(0, 10),
    });
    setModalOpen(false);
    setForm({ customerId: "", vehicleId: "", serviceId: "", beforeUri: "", afterUri: "", notes: "" });
  };

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
          Antes & Depois
        </Text>
        <Pressable
          onPress={() => setModalOpen(true)}
          style={[styles.addBtn, { backgroundColor: colors.accent }]}
        >
          <Feather name="plus" size={20} color={colors.accentForeground} />
        </Pressable>
      </View>

      {customers.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.filterScroll, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
          contentContainerStyle={styles.filterContent}
        >
          <Pressable
            onPress={() => setFilterCustomer("")}
            style={[
              styles.filterPill,
              {
                backgroundColor: !filterCustomer ? colors.accent : colors.muted,
                borderColor: !filterCustomer ? colors.accent : colors.border,
              },
            ]}
          >
            <Text
              style={{
                color: !filterCustomer ? colors.accentForeground : colors.mutedForeground,
                fontFamily: "Inter_500Medium",
                fontSize: 13,
              }}
            >
              Todos
            </Text>
          </Pressable>
          {customers.map((c) => (
            <Pressable
              key={c.id}
              onPress={() => setFilterCustomer(filterCustomer === c.id ? "" : c.id)}
              style={[
                styles.filterPill,
                {
                  backgroundColor: filterCustomer === c.id ? colors.primary : colors.muted,
                  borderColor: filterCustomer === c.id ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={{
                  color: filterCustomer === c.id ? "#fff" : colors.mutedForeground,
                  fontFamily: "Inter_500Medium",
                  fontSize: 13,
                }}
              >
                {c.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(g) => g.id}
        numColumns={1}
        scrollEnabled={!!filtered.length}
        contentContainerStyle={[
          styles.list,
          !filtered.length && { flex: 1 },
          { paddingBottom: 40 + (Platform.OS === "web" ? 34 : 0) },
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="image"
            title="Sem fotos"
            subtitle="Adicione fotos de antes e depois dos seus trabalhos."
            action={
              <GoldButton
                label="Adicionar Fotos"
                onPress={() => setModalOpen(true)}
              />
            }
          />
        }
        renderItem={({ item: g }) => {
          const customer = customers.find((c) => c.id === g.customerId);
          const svc = services.find((s) => s.id === g.serviceId);
          return (
            <Pressable
              onPress={() => setViewEntry(g)}
              style={({ pressed }) => [
                styles.galleryCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <View style={styles.photoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.photoLabel, { color: colors.mutedForeground }]}>ANTES</Text>
                  <Image
                    source={{ uri: g.beforeUri }}
                    style={[styles.photo, { borderColor: colors.border }]}
                    resizeMode="cover"
                  />
                </View>
                <View style={[styles.arrowWrap, { backgroundColor: colors.muted }]}>
                  <Feather name="arrow-right" size={16} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.photoLabel, { color: colors.success }]}>DEPOIS</Text>
                  <Image
                    source={{ uri: g.afterUri }}
                    style={[styles.photo, { borderColor: "rgba(34,197,94,0.3)" }]}
                    resizeMode="cover"
                  />
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                <View>
                  <Text style={[styles.galleryCustomer, { color: colors.foreground }]}>
                    {customer?.name ?? "Desconhecido"}
                  </Text>
                  <Text style={[styles.gallerySvc, { color: colors.mutedForeground }]}>
                    {svc?.name ?? "Serviço"} · {g.date}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Alert.alert("Excluir", "Remover esta entrada da galeria?", [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Excluir",
                        style: "destructive",
                        onPress: () => deleteGalleryEntry(g.id),
                      },
                    ]);
                  }}
                  hitSlop={8}
                >
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />

      <AppModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Adicionar Fotos"
      >
        <ScrollView
          style={{ paddingHorizontal: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>CLIENTE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14, marginTop: 8 }}>
            {customers.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setForm((f) => ({ ...f, customerId: c.id, vehicleId: "" }))}
                style={[
                  styles.pill,
                  {
                    backgroundColor: form.customerId === c.id ? colors.primary : colors.muted,
                    borderColor: form.customerId === c.id ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={{ color: form.customerId === c.id ? "#fff" : colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={[styles.formLabel, { color: colors.mutedForeground }]}>SERVIÇO</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14, marginTop: 8 }}>
            {services.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => setForm((f) => ({ ...f, serviceId: s.id }))}
                style={[
                  styles.pill,
                  {
                    backgroundColor: form.serviceId === s.id ? colors.accent : colors.muted,
                    borderColor: form.serviceId === s.id ? colors.accent : colors.border,
                  },
                ]}
              >
                <Text style={{ color: form.serviceId === s.id ? colors.accentForeground : colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                  {s.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={{ flexDirection: "row", gap: 14, marginBottom: 20 }}>
            <Pressable
              onPress={() => pickImage("before")}
              style={[
                styles.photoPicker,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              {form.beforeUri ? (
                <Image source={{ uri: form.beforeUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <>
                  <Feather name="camera" size={24} color={colors.mutedForeground} />
                  <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 6 }}>
                    ANTES
                  </Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => pickImage("after")}
              style={[
                styles.photoPicker,
                {
                  backgroundColor: colors.muted,
                  borderColor: form.afterUri ? "rgba(34,197,94,0.4)" : colors.border,
                },
              ]}
            >
              {form.afterUri ? (
                <Image source={{ uri: form.afterUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <>
                  <Feather name="camera" size={24} color={colors.success} />
                  <Text style={{ color: colors.success, fontFamily: "Inter_500Medium", fontSize: 12, marginTop: 6 }}>
                    DEPOIS
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          <FormInput
            label="Observações"
            value={form.notes}
            onChangeText={(t) => setForm((f) => ({ ...f, notes: t }))}
            placeholder="Correção de pintura no capô e teto..."
            multiline
          />

          <GoldButton label="Salvar na Galeria" onPress={handleSave} />
          <View style={{ height: 20 }} />
        </ScrollView>
      </AppModal>

      {viewEntry && (
        <Modal visible animationType="fade" statusBarTranslucent>
          <View style={{ flex: 1, backgroundColor: "#000" }}>
            <Pressable
              onPress={() => setViewEntry(null)}
              style={[styles.closeBtn, { top: insets.top + 16 }]}
            >
              <Feather name="x" size={24} color="#fff" />
            </Pressable>
            <ScrollView
              contentContainerStyle={{ paddingTop: insets.top + 70, paddingBottom: 40 }}
            >
              <Text style={styles.viewLabel}>ANTES</Text>
              <Image
                source={{ uri: viewEntry.beforeUri }}
                style={styles.fullImg}
                resizeMode="contain"
              />
              <View style={{ alignItems: "center", paddingVertical: 16 }}>
                <Feather name="arrow-down" size={28} color={colors.accent} />
              </View>
              <Text style={[styles.viewLabel, { color: colors.success }]}>DEPOIS</Text>
              <Image
                source={{ uri: viewEntry.afterUri }}
                style={styles.fullImg}
                resizeMode="contain"
              />
              {viewEntry.notes ? (
                <Text style={styles.viewNotes}>{viewEntry.notes}</Text>
              ) : null}
            </ScrollView>
          </View>
        </Modal>
      )}
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  filterScroll: {
    borderBottomWidth: 1,
    maxHeight: 60,
  },
  filterContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  list: {
    padding: 16,
  },
  galleryCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  photoLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 6,
  },
  photo: {
    width: "100%",
    aspectRatio: 4 / 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  arrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  galleryCustomer: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    marginBottom: 2,
  },
  gallerySvc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  formLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  photoPicker: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  closeBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  viewLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 8,
  },
  fullImg: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.75,
  },
  viewNotes: {
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 24,
    marginTop: 16,
  },
});
