import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppModal, Badge, EmptyState, FormInput, GoldButton } from "@/components/shared";
import { Customer, Vehicle, useData } from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

const genId = () =>
  Date.now().toString() + Math.random().toString(36).substr(2, 9);

function VehicleForm({ vehicle, onChange, onRemove }: { vehicle: Vehicle; onChange: (v: Vehicle) => void; onRemove: () => void }) {
  const colors = useColors();
  return (
    <View style={{ backgroundColor: colors.muted, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 12 }}>VEÍCULO</Text>
        <Pressable onPress={onRemove}><Feather name="trash-2" size={16} color={colors.destructive} /></Pressable>
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}><FormInput label="Marca" value={vehicle.brand} onChangeText={(t) => onChange({ ...vehicle, brand: t })} placeholder="BMW" /></View>
        <View style={{ flex: 1 }}><FormInput label="Modelo" value={vehicle.model} onChangeText={(t) => onChange({ ...vehicle, model: t })} placeholder="Série 3" /></View>
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}><FormInput label="Ano" value={vehicle.year} onChangeText={(t) => onChange({ ...vehicle, year: t })} placeholder="2023" keyboardType="numeric" /></View>
        <View style={{ flex: 1 }}>
          <FormInput label="Placa" value={vehicle.plate} onChangeText={(t) => onChange({ ...vehicle, plate: t.toUpperCase() })} placeholder="ABC-1234" autoCapitalize="characters" />
        </View>
      </View>
    </View>
  );
}

const EMPTY_CUSTOMER = { name: "", phone: "", address: "", vehicles: [] as Vehicle[] };

export default function ClientesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useData();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_CUSTOMER);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.vehicles.some((v) => v.plate.toLowerCase().includes(q))
    );
  }, [customers, search]);

  const openAdd = () => { setEditId(null); setForm(EMPTY_CUSTOMER); setErrors({}); setModalOpen(true); };
  const openEdit = (c: Customer) => {
    setEditId(c.id);
    setForm({ name: c.name, phone: c.phone, address: c.address, vehicles: c.vehicles });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Nome é obrigatório";
    if (!form.phone.trim()) e.phone = "Telefone é obrigatório";
    const dupPhone = customers.find((c) => c.id !== editId && c.phone.replace(/\D/g, "") === form.phone.replace(/\D/g, ""));
    if (dupPhone) e.phone = `Telefone já cadastrado para ${dupPhone.name}`;
    return e;
  };

  const handleSave = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editId) updateCustomer(editId, form);
    else addCustomer(form);
    setModalOpen(false);
  };

  const handleDelete = (c: Customer) => {
    Alert.alert("Excluir Cliente", `Remover ${c.name}?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); deleteCustomer(c.id); } },
    ]);
  };

  const addVehicle = () => {
    setForm((f) => ({ ...f, vehicles: [...f.vehicles, { id: genId(), brand: "", model: "", year: "", plate: "" }] }));
  };

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: topInsets + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Clientes</Text>
        <Pressable onPress={openAdd} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <Feather name="plus" size={20} color={colors.accentForeground} />
        </Pressable>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.input, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Buscar por nome, telefone ou placa…"
          placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} />
        {search ? <Pressable onPress={() => setSearch("")}><Feather name="x" size={16} color={colors.mutedForeground} /></Pressable> : null}
      </View>

      <FlatList
        data={filtered} keyExtractor={(c) => c.id} scrollEnabled={!!filtered.length}
        contentContainerStyle={[styles.list, !filtered.length && { flex: 1 }, { paddingBottom: 100 + (Platform.OS === "web" ? 34 : 0) }]}
        ListEmptyComponent={
          <EmptyState icon="users" title={search ? "Sem resultados" : "Nenhum cliente"}
            subtitle={search ? "Tente outro termo de busca." : "Adicione seu primeiro cliente."}
            action={!search ? <GoldButton label="Adicionar Cliente" onPress={openAdd} /> : undefined} />
        }
        renderItem={({ item: c }) => (
          <Pressable onPress={() => router.push(`/customer/${c.id}`)}
            style={({ pressed }) => [styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: pressed ? 0.85 : 1 }]}>
            <View style={[styles.avatar, { backgroundColor: "rgba(107,63,160,0.2)" }]}>
              <Text style={[styles.avatarText, { color: colors.primaryLight }]}>
                {c.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={[styles.cardName, { color: colors.foreground }]}>{c.name}</Text>
              <Text style={[styles.cardPhone, { color: colors.mutedForeground }]}>{c.phone}</Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                {c.vehicles.slice(0, 2).map((v) => (
                  <Badge key={v.id} label={`${v.brand} ${v.model}`} variant="default" />
                ))}
                {c.vehicles.length > 2 && <Badge label={`+${c.vehicles.length - 2}`} variant="default" />}
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 4 }}>
              <Pressable onPress={() => openEdit(c)} style={styles.iconAction} hitSlop={6}>
                <Feather name="edit-2" size={16} color={colors.mutedForeground} />
              </Pressable>
              <Pressable onPress={() => handleDelete(c)} style={styles.iconAction} hitSlop={6}>
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </Pressable>
            </View>
          </Pressable>
        )}
      />

      <AppModal visible={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Editar Cliente" : "Novo Cliente"}>
        <ScrollView style={{ paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <FormInput label="Nome Completo" value={form.name} onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
            placeholder="Carlos Mendes" error={errors.name} />
          <FormInput label="Telefone" value={form.phone} onChangeText={(t) => setForm((f) => ({ ...f, phone: t }))}
            placeholder="(11) 98765-4321" keyboardType="phone-pad" error={errors.phone} />
          <FormInput label="Endereço" value={form.address} onChangeText={(t) => setForm((f) => ({ ...f, address: t }))}
            placeholder="Rua das Flores, 123" />

          <View style={{ marginBottom: 12 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>
              Veículos
            </Text>
            {form.vehicles.map((v) => (
              <VehicleForm key={v.id} vehicle={v}
                onChange={(updated) => setForm((f) => ({ ...f, vehicles: f.vehicles.map((x) => x.id === v.id ? updated : x) }))}
                onRemove={() => setForm((f) => ({ ...f, vehicles: f.vehicles.filter((x) => x.id !== v.id) }))} />
            ))}
            <Pressable onPress={addVehicle} style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 }}>
              <Feather name="plus-circle" size={18} color={colors.accent} />
              <Text style={{ color: colors.accent, fontFamily: "Inter_500Medium", fontSize: 14 }}>Adicionar Veículo</Text>
            </Pressable>
          </View>

          <GoldButton label={editId ? "Salvar Alterações" : "Cadastrar Cliente"} onPress={handleSave} />
          <View style={{ height: 20 }} />
        </ScrollView>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  searchWrap: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginVertical: 12, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, gap: 10 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, paddingVertical: Platform.OS === "ios" ? 12 : 8 },
  list: { paddingHorizontal: 16 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 16, padding: 14, borderWidth: 1, marginBottom: 10 },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  cardName: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  cardPhone: { fontFamily: "Inter_400Regular", fontSize: 13 },
  iconAction: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
});
