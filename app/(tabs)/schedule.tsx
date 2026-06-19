import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
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
import {
  Appointment,
  AppointmentStatus,
  Customer,
  DiscountType,
  PaymentMethod,
  Vehicle,
  useData,
} from "@/context/DataContext";
import { useColors } from "@/hooks/useColors";

// ─── helpers ─────────────────────────────────────────────────────────────────

const genId = () =>
  Date.now().toString() + Math.random().toString(36).substr(2, 9);

const today = () => new Date().toISOString().slice(0, 10);

function fmtDate(d: Date) { return d.toISOString().slice(0, 10); }
function fmtDay(d: Date) {
  return d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "").toUpperCase();
}
function fmtDayNum(d: Date) { return d.getDate(); }
function getWeekDates() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 1 + i); return d;
  });
}
function formatDuration(min: number) {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}
function statusVariant(s: AppointmentStatus) {
  if (s === "concluido") return "success" as const;
  if (s === "cancelado") return "danger" as const;
  return "gold" as const;
}
function statusLabel(s: AppointmentStatus) {
  if (s === "concluido") return "Concluído";
  if (s === "cancelado") return "Cancelado";
  return "Agendado";
}

const PAYMENT_OPTIONS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: "dinheiro", label: "Dinheiro", icon: "dollar-sign" },
  { key: "pix",      label: "PIX",      icon: "zap" },
  { key: "debito",   label: "Débito",   icon: "credit-card" },
  { key: "credito",  label: "Crédito",  icon: "credit-card" },
];

const TIMES = [
  "07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30",
  "11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30","18:00",
];

// ─── New customer inline form ─────────────────────────────────────────────────

interface NewCustDraft {
  name: string; phone: string; address: string;
  brand: string; model: string; year: string; plate: string;
}
const EMPTY_DRAFT: NewCustDraft = {
  name: "", phone: "", address: "", brand: "", model: "", year: "", plate: "",
};

function NewCustomerForm({
  draft, onChange, errors,
}: { draft: NewCustDraft; onChange: (d: NewCustDraft) => void; errors: Record<string, string> }) {
  const colors = useColors();
  const f = (k: keyof NewCustDraft) => (v: string) => onChange({ ...draft, [k]: v });
  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <View style={{ backgroundColor: "rgba(212,175,55,0.1)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: colors.goldBorder }}>
          <Text style={{ color: colors.accent, fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1 }}>NOVO CLIENTE</Text>
        </View>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
      <FormInput label="Nome Completo *" value={draft.name} onChangeText={f("name")} placeholder="Carlos Mendes" error={errors.name} />
      <FormInput label="Telefone *" value={draft.phone} onChangeText={f("phone")} placeholder="(11) 98765-4321" keyboardType="phone-pad" error={errors.phone} />
      <FormInput label="Endereço" value={draft.address} onChangeText={f("address")} placeholder="Rua das Flores, 123" />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1 }}>VEÍCULO</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}><FormInput label="Marca" value={draft.brand} onChangeText={f("brand")} placeholder="BMW" /></View>
        <View style={{ flex: 1 }}><FormInput label="Modelo" value={draft.model} onChangeText={f("model")} placeholder="Série 3" /></View>
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}><FormInput label="Ano" value={draft.year} onChangeText={f("year")} placeholder="2023" keyboardType="numeric" /></View>
        <View style={{ flex: 1 }}>
          <FormInput label="Placa *" value={draft.plate} onChangeText={(v) => f("plate")(v.toUpperCase())} placeholder="ABC-1234" autoCapitalize="characters" error={errors.plate} />
        </View>
      </View>
    </View>
  );
}

// ─── Customer search result ───────────────────────────────────────────────────

function CustomerResult({ customer, onSelect }: { customer: Customer; onSelect: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [styles.resultRow, { backgroundColor: pressed ? colors.muted : colors.card, borderColor: colors.cardBorder }]}
    >
      <View style={[styles.resultAvatar, { backgroundColor: "rgba(107,63,160,0.2)" }]}>
        <Text style={[styles.resultAvatarText, { color: colors.primaryLight }]}>
          {customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.resultName, { color: colors.foreground }]}>{customer.name}</Text>
        <Text style={[styles.resultMeta, { color: colors.mutedForeground }]}>
          {customer.phone}{customer.vehicles.length > 0 ? ` · ${customer.vehicles.map((v) => v.plate).join(", ")}` : ""}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.accent} />
    </Pressable>
  );
}

// ─── Appointment form defaults ────────────────────────────────────────────────

const EMPTY_FORM = {
  customerId: "",
  vehicleId: "",
  serviceIds: [] as string[],
  date: today(),
  time: "09:00",
  notes: "",
  status: "agendado" as AppointmentStatus,
  discountValue: 0,
  discountType: "fixo" as DiscountType,
  paymentMethod: undefined as PaymentMethod | undefined,
  totalValue: 0,
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function AgendaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ openCreate?: string | string[] }>();
  const { appointments, customers, services, addAppointment, updateAppointment, deleteAppointment, addCustomer } = useData();

  const [selectedDate, setSelectedDate] = useState(today());
  const weekDates = getWeekDates();

  const shouldOpenCreate =
    params.openCreate === "1" ||
    params.openCreate === "true" ||
    (Array.isArray(params.openCreate) && params.openCreate.includes("1"));

  const [modalOpen, setModalOpen] = useState(shouldOpenCreate);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM, date: selectedDate });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustDraft, setNewCustDraft] = useState<NewCustDraft>({ ...EMPTY_DRAFT });
  const [newCustErrors, setNewCustErrors] = useState<Record<string, string>>({});

  // Discount input as string for editing
  const [discountInput, setDiscountInput] = useState("0");

  const dayAppts = appointments
    .filter((a) => a.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  // ── Computed totals ──
  const selectedServices = useMemo(
    () => services.filter((s) => form.serviceIds.includes(s.id)),
    [services, form.serviceIds]
  );
  const subtotal = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.price, 0),
    [selectedServices]
  );
  const discountAmt = useMemo(() => {
    const v = parseFloat(discountInput) || 0;
    if (form.discountType === "fixo") return Math.min(v, subtotal);
    return subtotal * (Math.min(v, 100) / 100);
  }, [discountInput, form.discountType, subtotal]);
  const totalFinal = Math.max(0, subtotal - discountAmt);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  const searchResults = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return [];
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.vehicles.some((v) => v.plate.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  // ── Reset modal ──
  const resetModal = (date = selectedDate) => {
    setEditId(null);
    setForm({ ...EMPTY_FORM, date });
    setFormErrors({});
    setCustomerSearch(""); setShowResults(false);
    setSelectedCustomer(null); setShowNewCustomer(false);
    setNewCustDraft({ ...EMPTY_DRAFT }); setNewCustErrors({});
    setShowTimePicker(false); setDiscountInput("0");
  };

  const openAdd = () => { resetModal(); setModalOpen(true); };

  useEffect(() => {
    if (!shouldOpenCreate || modalOpen) return;

    const timeout = setTimeout(() => {
      openAdd();
    }, 0);

    return () => clearTimeout(timeout);
  }, [shouldOpenCreate, modalOpen]);

  const openEdit = (a: Appointment) => {
    resetModal(a.date);
    setEditId(a.id);
    const cust = customers.find((c) => c.id === a.customerId) ?? null;
    setSelectedCustomer(cust);
    setCustomerSearch(cust?.name ?? "");
    setDiscountInput(String(a.discountValue ?? 0));
    setForm({
      customerId: a.customerId,
      vehicleId: a.vehicleId,
      serviceIds: a.serviceIds ?? [],
      date: a.date,
      time: a.time,
      notes: a.notes,
      status: a.status,
      discountValue: a.discountValue ?? 0,
      discountType: a.discountType ?? "fixo",
      paymentMethod: a.paymentMethod,
      totalValue: a.totalValue ?? 0,
    });
    setModalOpen(true);
  };

  // ── Customer actions ──
  const selectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setShowResults(false);
    setShowNewCustomer(false);
    setForm((f) => ({ ...f, customerId: c.id, vehicleId: "" }));
    setFormErrors((e) => ({ ...e, customerId: "" }));
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setShowResults(false);
    setShowNewCustomer(false);
    setForm((f) => ({ ...f, customerId: "", vehicleId: "" }));
  };

  const validateNewCustomer = () => {
    const e: Record<string, string> = {};
    if (!newCustDraft.name.trim()) e.name = "Nome é obrigatório";
    if (!newCustDraft.phone.trim()) e.phone = "Telefone é obrigatório";
    const dupPhone = customers.find(
      (c) => c.phone.replace(/\D/g, "") === newCustDraft.phone.replace(/\D/g, "")
    );
    if (dupPhone) e.phone = `Telefone já cadastrado para ${dupPhone.name}`;
    if (newCustDraft.plate.trim()) {
      const p = newCustDraft.plate.replace(/[-\s]/g, "").toUpperCase();
      const dupPlate = customers.find((c) =>
        c.vehicles.some((v) => v.plate.replace(/[-\s]/g, "").toUpperCase() === p)
      );
      if (dupPlate) e.plate = `Placa já cadastrada para ${dupPlate.name}`;
    }
    setNewCustErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveNewCustomer = () => {
    if (!validateNewCustomer()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const vehId = genId();
    const hasVehicle = newCustDraft.brand || newCustDraft.model || newCustDraft.plate;
    const vehicle: Vehicle | undefined = hasVehicle
      ? { id: vehId, brand: newCustDraft.brand.trim(), model: newCustDraft.model.trim(), year: newCustDraft.year.trim(), plate: newCustDraft.plate.trim().toUpperCase() }
      : undefined;

    // addCustomer now returns the generated ID — bug fix
    const newId = addCustomer({
      name: newCustDraft.name.trim(),
      phone: newCustDraft.phone.trim(),
      address: newCustDraft.address.trim(),
      vehicles: vehicle ? [vehicle] : [],
    });

    const tempCust: Customer = {
      id: newId,
      name: newCustDraft.name.trim(),
      phone: newCustDraft.phone.trim(),
      address: newCustDraft.address.trim(),
      vehicles: vehicle ? [vehicle] : [],
      createdAt: new Date().toISOString(),
    };
    setSelectedCustomer(tempCust);
    setCustomerSearch(tempCust.name);
    setForm((f) => ({ ...f, customerId: newId, vehicleId: vehicle?.id ?? "" }));
    setShowNewCustomer(false);
    setNewCustDraft({ ...EMPTY_DRAFT });
    setNewCustErrors({});
  };

  // ── Toggle service ──
  const toggleService = (serviceId: string) => {
    setForm((f) => ({
      ...f,
      serviceIds: f.serviceIds.includes(serviceId)
        ? f.serviceIds.filter((id) => id !== serviceId)
        : [...f.serviceIds, serviceId],
    }));
    setFormErrors((e) => ({ ...e, serviceIds: "" }));
  };

  // ── Save appointment ──
  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.customerId && !selectedCustomer) e.customerId = "Selecione ou cadastre um cliente";
    if (form.serviceIds.length === 0) e.serviceIds = "Selecione ao menos um serviço";
    if (!form.date.match(/^\d{4}-\d{2}-\d{2}$/)) e.date = "Use o formato AAAA-MM-DD";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (showNewCustomer) { saveNewCustomer(); return; }
    if (!validateForm()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const discountVal = parseFloat(discountInput) || 0;
    const payload = {
      customerId: form.customerId || selectedCustomer?.id || "",
      vehicleId: form.vehicleId,
      serviceIds: form.serviceIds,
      date: form.date,
      time: form.time,
      notes: form.notes,
      status: form.status,
      discountValue: discountVal,
      discountType: form.discountType,
      paymentMethod: form.paymentMethod,
      totalValue: totalFinal,
    };
    if (editId) updateAppointment(editId, payload);
    else addAppointment(payload);
    setModalOpen(false);
  };

  const handleComplete = (a: Appointment) => {
    Alert.alert("Concluir Serviço", "Marcar este serviço como concluído?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Concluir", onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); updateAppointment(a.id, { status: "concluido" }); } },
    ]);
  };

  const handleCancel = (a: Appointment) => {
    Alert.alert("Cancelar Agendamento", "Cancelar este agendamento?", [
      { text: "Voltar", style: "cancel" },
      { text: "Cancelar", style: "destructive", onPress: () => updateAppointment(a.id, { status: "cancelado" }) },
    ]);
  };

  const handleDelete = (a: Appointment) => {
    Alert.alert("Excluir", "Excluir este agendamento permanentemente?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => deleteAppointment(a.id) },
    ]);
  };

  const topInsets = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: topInsets + 12 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Agenda</Text>
        <Pressable onPress={openAdd} style={[styles.addBtn, { backgroundColor: colors.accent }]}>
          <Feather name="plus" size={20} color={colors.accentForeground} />
        </Pressable>
      </View>

      {/* Week strip */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={[styles.weekScroll, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
        contentContainerStyle={styles.weekContent}
      >
        {weekDates.map((d) => {
          const ds = fmtDate(d), isSel = ds === selectedDate, isTdy = ds === today();
          const cnt = appointments.filter((a) => a.date === ds && a.status !== "cancelado").length;
          return (
            <Pressable key={ds} onPress={() => setSelectedDate(ds)}
              style={[styles.dayCell, isSel && { backgroundColor: colors.accent, borderRadius: 14 }]}>
              <Text style={[styles.dayLabel, { color: isSel ? colors.accentForeground : isTdy ? colors.accent : colors.mutedForeground }]}>
                {fmtDay(d)}
              </Text>
              <Text style={[styles.dayNum, { color: isSel ? colors.accentForeground : colors.foreground }]}>
                {fmtDayNum(d)}
              </Text>
              {cnt > 0 && <View style={[styles.dot, { backgroundColor: isSel ? colors.accentForeground : colors.primary }]} />}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Appointment list */}
      <FlatList
        data={dayAppts}
        keyExtractor={(a) => a.id}
        scrollEnabled={!!dayAppts.length}
        contentContainerStyle={[styles.list, !dayAppts.length && { flex: 1 }, { paddingBottom: 100 + (Platform.OS === "web" ? 34 : 0) }]}
        ListEmptyComponent={
          <EmptyState icon="calendar" title="Sem agendamentos" subtitle="Nenhum agendamento para este dia."
            action={<GoldButton label="Agendar" onPress={openAdd} />}
          />
        }
        renderItem={({ item: a }) => {
          const customer = customers.find((c) => c.id === a.customerId);
          const apptServices = services.filter((s) => a.serviceIds?.includes(s.id));
          const vehicle = customer?.vehicles.find((v) => v.id === a.vehicleId);
          const pmLabel = PAYMENT_OPTIONS.find((p) => p.key === a.paymentMethod)?.label;
          return (
            <View style={[styles.apptCard, {
              backgroundColor: colors.card,
              borderColor: a.status === "concluido" ? "rgba(34,197,94,0.25)" : a.status === "cancelado" ? colors.border : colors.cardBorder,
              opacity: a.status === "cancelado" ? 0.6 : 1,
            }]}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={[styles.timeBox, { backgroundColor: "rgba(107,63,160,0.15)" }]}>
                    <Text style={[styles.timeText, { color: colors.primaryLight }]}>{a.time}</Text>
                  </View>
                  <Badge label={statusLabel(a.status)} variant={statusVariant(a.status)} />
                </View>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {a.status === "agendado" && (
                    <Pressable onPress={() => handleComplete(a)} style={styles.iconBtn} hitSlop={6}>
                      <Feather name="check-circle" size={18} color={colors.success} />
                    </Pressable>
                  )}
                  <Pressable onPress={() => openEdit(a)} style={styles.iconBtn} hitSlop={6}>
                    <Feather name="edit-2" size={16} color={colors.mutedForeground} />
                  </Pressable>
                  {a.status === "agendado" && (
                    <Pressable onPress={() => handleCancel(a)} style={styles.iconBtn} hitSlop={6}>
                      <Feather name="x-circle" size={16} color={colors.destructive} />
                    </Pressable>
                  )}
                  <Pressable onPress={() => handleDelete(a)} style={styles.iconBtn} hitSlop={6}>
                    <Feather name="trash-2" size={16} color={colors.destructive} />
                  </Pressable>
                </View>
              </View>
              <Text style={[styles.apptCustomer, { color: colors.foreground }]}>{customer?.name ?? "Cliente desconhecido"}</Text>
              {vehicle && <Text style={[styles.apptMeta, { color: colors.mutedForeground }]}>{vehicle.brand} {vehicle.model} · {vehicle.plate}</Text>}
              {apptServices.map((s) => (
                <Text key={s.id} style={[styles.apptMeta, { color: colors.mutedForeground }]}>• {s.name} — R$ {s.price.toLocaleString("pt-BR")}</Text>
              ))}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
                <Text style={{ color: colors.accent, fontFamily: "Inter_700Bold", fontSize: 15 }}>
                  Total: R$ {(a.totalValue ?? 0).toLocaleString("pt-BR")}
                </Text>
                {pmLabel && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Feather name="credit-card" size={12} color={colors.mutedForeground} />
                    <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12 }}>{pmLabel}</Text>
                  </View>
                )}
              </View>
              {a.notes ? <Text style={[styles.notes, { color: colors.mutedForeground, borderColor: colors.border }]}>{a.notes}</Text> : null}
            </View>
          );
        }}
      />

      {/* Modal */}
      <AppModal visible={modalOpen} onClose={() => setModalOpen(false)} title={editId ? "Editar Agendamento" : "Novo Agendamento"}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, minHeight: 0 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >

            {/* ── CLIENTE ── */}
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CLIENTE *</Text>

            {selectedCustomer ? (
              <View style={[styles.selectedChip, { backgroundColor: "rgba(107,63,160,0.12)", borderColor: colors.primary }]}>
                <View style={[styles.chipAvatar, { backgroundColor: "rgba(107,63,160,0.25)" }]}>
                  <Text style={{ color: colors.primaryLight, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                    {selectedCustomer.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 15 }}>{selectedCustomer.name}</Text>
                  <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 13 }}>{selectedCustomer.phone}</Text>
                </View>
                <Pressable onPress={clearCustomer} hitSlop={8}><Feather name="x" size={18} color={colors.mutedForeground} /></Pressable>
              </View>
            ) : (
              <View>
                <View style={[styles.searchBox, { backgroundColor: colors.input, borderColor: formErrors.customerId ? colors.destructive : customerSearch ? colors.primary : colors.border }]}>
                  <Feather name="search" size={16} color={colors.mutedForeground} />
                  <TextInput
                    value={customerSearch}
                    onChangeText={(t) => { setCustomerSearch(t); setShowResults(true); setShowNewCustomer(false); setFormErrors((e) => ({ ...e, customerId: "" })); }}
                    onFocus={() => setShowResults(true)}
                    placeholder="Buscar por nome, telefone ou placa…"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.searchInput, { color: colors.foreground }]}
                  />
                  {customerSearch.length > 0 && (
                    <Pressable onPress={() => { setCustomerSearch(""); setShowResults(false); setShowNewCustomer(false); }}>
                      <Feather name="x" size={16} color={colors.mutedForeground} />
                    </Pressable>
                  )}
                </View>
                {formErrors.customerId ? (
                  <Text style={{ color: colors.destructive, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 }}>{formErrors.customerId}</Text>
                ) : null}
                {showResults && customerSearch.trim().length > 0 && (
                  <View style={[styles.resultsBox, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    {searchResults.length > 0 ? (
                      searchResults.slice(0, 5).map((c) => (
                        <CustomerResult key={c.id} customer={c} onSelect={() => selectCustomer(c)} />
                      ))
                    ) : (
                      <View style={styles.noResults}>
                        <Feather name="user-x" size={20} color={colors.mutedForeground} />
                        <Text style={[styles.noResultsText, { color: colors.mutedForeground }]}>
                          Nenhum cliente encontrado para "{customerSearch}"
                        </Text>
                        <Pressable
                          onPress={() => { setShowResults(false); setShowNewCustomer(true); setNewCustDraft({ ...EMPTY_DRAFT, name: customerSearch.trim() }); }}
                          style={[styles.registerBtn, { backgroundColor: "rgba(212,175,55,0.1)", borderColor: colors.goldBorder }]}
                        >
                          <Feather name="user-plus" size={16} color={colors.accent} />
                          <Text style={{ color: colors.accent, fontFamily: "Inter_600SemiBold", fontSize: 14 }}>Cadastrar Novo Cliente</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* ── INLINE NEW CUSTOMER ── */}
            {showNewCustomer && !selectedCustomer && (
              <View style={{ marginTop: 8, marginBottom: 4 }}>
                <NewCustomerForm draft={newCustDraft} onChange={setNewCustDraft} errors={newCustErrors} />
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
                  <Pressable onPress={() => { setShowNewCustomer(false); setNewCustDraft({ ...EMPTY_DRAFT }); setNewCustErrors({}); }}
                    style={[styles.cancelBtn, { borderColor: colors.border }]}>
                    <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 14 }}>Cancelar</Text>
                  </Pressable>
                  <View style={{ flex: 2 }}>
                    <GoldButton label="Salvar e Selecionar" onPress={saveNewCustomer}
                      icon={<Feather name="user-check" size={16} color={colors.accentForeground} />} />
                  </View>
                </View>
              </View>
            )}

            {/* ── VEÍCULO ── */}
            {selectedCustomer && selectedCustomer.vehicles.length > 0 && (
              <View style={{ marginTop: 16, marginBottom: 14 }}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>VEÍCULO</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {selectedCustomer.vehicles.map((v) => (
                    <Pressable key={v.id} onPress={() => setForm((f) => ({ ...f, vehicleId: v.id }))}
                      style={[styles.pill, { backgroundColor: form.vehicleId === v.id ? colors.primary : colors.muted, borderColor: form.vehicleId === v.id ? colors.primary : colors.border }]}>
                      <Feather name="truck" size={12} color={form.vehicleId === v.id ? "#fff" : colors.mutedForeground} />
                      <Text style={{ color: form.vehicleId === v.id ? "#fff" : colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                        {v.brand} {v.model} · {v.plate}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── SERVIÇOS ── */}
            <View style={{ marginTop: selectedCustomer ? 0 : 16, marginBottom: 14 }}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SERVIÇOS *</Text>
              {formErrors.serviceIds ? (
                <Text style={{ color: colors.destructive, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4, marginBottom: 8 }}>{formErrors.serviceIds}</Text>
              ) : null}
              <View style={{ marginTop: 8, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: colors.cardBorder }}>
                {services.map((s, i) => {
                  const isChecked = form.serviceIds.includes(s.id);
                  return (
                    <Pressable key={s.id} onPress={() => toggleService(s.id)}
                      style={[styles.serviceRow, {
                        backgroundColor: isChecked ? "rgba(107,63,160,0.1)" : colors.card,
                        borderBottomWidth: i < services.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                      }]}>
                      <View style={[styles.checkbox, {
                        backgroundColor: isChecked ? colors.primary : "transparent",
                        borderColor: isChecked ? colors.primary : colors.mutedForeground,
                      }]}>
                        {isChecked && <Feather name="check" size={12} color="#fff" />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.foreground, fontFamily: "Inter_500Medium", fontSize: 14 }}>{s.name}</Text>
                        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontSize: 12 }}>
                          {formatDuration(s.duration)}
                        </Text>
                      </View>
                      <Text style={{ color: isChecked ? colors.accent : colors.mutedForeground, fontFamily: "Inter_700Bold", fontSize: 14 }}>
                        R$ {s.price.toLocaleString("pt-BR")}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ── RESUMO FINANCEIRO ── */}
            {selectedServices.length > 0 && (
              <View style={[styles.totalCard, { backgroundColor: "rgba(107,63,160,0.08)", borderColor: colors.cardBorder }]}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Subtotal</Text>
                  <Text style={[styles.totalValue, { color: colors.foreground }]}>R$ {subtotal.toLocaleString("pt-BR")}</Text>
                </View>
                {discountAmt > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Desconto</Text>
                    <Text style={[styles.totalValue, { color: colors.success }]}>- R$ {discountAmt.toFixed(2).replace(".", ",")}</Text>
                  </View>
                )}
                <View style={[styles.totalRow, { paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }]}>
                  <Text style={{ color: colors.foreground, fontFamily: "Inter_700Bold", fontSize: 16 }}>Total</Text>
                  <Text style={{ color: colors.accent, fontFamily: "Inter_700Bold", fontSize: 18 }}>R$ {totalFinal.toLocaleString("pt-BR")}</Text>
                </View>
                <View style={[styles.totalRow, { marginTop: 4 }]}>
                  <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Duração estimada</Text>
                  <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>{formatDuration(totalDuration)}</Text>
                </View>
              </View>
            )}

            {/* ── DESCONTO ── */}
            <View style={{ marginBottom: 14 }}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DESCONTO</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8, marginBottom: 10 }}>
                {(["fixo", "porcentagem"] as DiscountType[]).map((t) => (
                  <Pressable key={t} onPress={() => setForm((f) => ({ ...f, discountType: t }))}
                    style={[styles.pill, { flex: 1, justifyContent: "center", backgroundColor: form.discountType === t ? colors.primary : colors.muted, borderColor: form.discountType === t ? colors.primary : colors.border }]}>
                    <Text style={{ color: form.discountType === t ? "#fff" : colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13, textAlign: "center" }}>
                      {t === "fixo" ? "Valor (R$)" : "Percentual (%)"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={[styles.searchBox, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <Feather name="tag" size={16} color={colors.mutedForeground} />
                <TextInput
                  value={discountInput}
                  onChangeText={setDiscountInput}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.searchInput, { color: colors.foreground }]}
                />
                <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_500Medium" }}>
                  {form.discountType === "fixo" ? "R$" : "%"}
                </Text>
              </View>
            </View>

            {/* ── FORMA DE PAGAMENTO ── */}
            <View style={{ marginBottom: 14 }}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>FORMA DE PAGAMENTO</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {PAYMENT_OPTIONS.map((p) => (
                  <Pressable key={p.key} onPress={() => setForm((f) => ({ ...f, paymentMethod: p.key }))}
                    style={[styles.payPill, {
                      backgroundColor: form.paymentMethod === p.key ? colors.accent : colors.muted,
                      borderColor: form.paymentMethod === p.key ? colors.accent : colors.border,
                    }]}>
                    <Feather name={p.icon as any} size={14} color={form.paymentMethod === p.key ? colors.accentForeground : colors.mutedForeground} />
                    <Text style={{ color: form.paymentMethod === p.key ? colors.accentForeground : colors.mutedForeground, fontFamily: "Inter_600SemiBold", fontSize: 13 }}>
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── DATA ── */}
            <FormInput label="Data (AAAA-MM-DD)" value={form.date} onChangeText={(t) => setForm((f) => ({ ...f, date: t }))}
              placeholder="2025-06-20" keyboardType="numbers-and-punctuation" error={formErrors.date} />

            {/* ── HORÁRIO ── */}
            <View style={{ marginBottom: 14 }}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>HORÁRIO</Text>
              <Pressable onPress={() => setShowTimePicker((v) => !v)}
                style={[styles.timePickerBtn, { backgroundColor: colors.input, borderColor: colors.border }]}>
                <Feather name="clock" size={16} color={colors.mutedForeground} />
                <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1 }}>{form.time}</Text>
                <Feather name={showTimePicker ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
              </Pressable>
              {showTimePicker && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {TIMES.map((t) => (
                    <Pressable key={t} onPress={() => { setForm((f) => ({ ...f, time: t })); setShowTimePicker(false); }}
                      style={[styles.pill, { backgroundColor: form.time === t ? colors.primary : colors.muted, borderColor: form.time === t ? colors.primary : colors.border }]}>
                      <Text style={{ color: form.time === t ? "#fff" : colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13 }}>{t}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
            </View>

            {/* ── OBSERVAÇÕES ── */}
            <FormInput label="Observações" value={form.notes} onChangeText={(t) => setForm((f) => ({ ...f, notes: t }))}
              placeholder="Instruções especiais ou observações…" multiline />

            {/* ── STATUS (edit only) ── */}
            {editId && (
              <View style={{ marginBottom: 14 }}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>STATUS</Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  {(["agendado", "concluido", "cancelado"] as AppointmentStatus[]).map((s) => (
                    <Pressable key={s} onPress={() => setForm((f) => ({ ...f, status: s }))}
                      style={[styles.pill, { backgroundColor: form.status === s ? colors.primary : colors.muted, borderColor: form.status === s ? colors.primary : colors.border }]}>
                      <Text style={{ color: form.status === s ? "#fff" : colors.mutedForeground, fontFamily: "Inter_500Medium", fontSize: 13 }}>
                        {statusLabel(s)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <GoldButton
              label={showNewCustomer ? "Salvar Cliente e Continuar" : editId ? "Salvar Alterações" : "Confirmar Agendamento"}
              onPress={handleSave}
              icon={<Feather name={showNewCustomer ? "user-check" : "calendar"} size={16} color={colors.accentForeground} />}
            />
            <View style={{ height: 32 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </AppModal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  addBtn: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  weekScroll: { borderBottomWidth: 1 },
  weekContent: { paddingHorizontal: 12, paddingVertical: 12, gap: 4 },
  dayCell: { width: 52, alignItems: "center", paddingVertical: 8, paddingHorizontal: 4 },
  dayLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginBottom: 4 },
  dayNum: { fontSize: 18, fontFamily: "Inter_700Bold" },
  dot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 4 },
  list: { padding: 16 },
  apptCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 12 },
  timeBox: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  timeText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  apptCustomer: { fontFamily: "Inter_600SemiBold", fontSize: 16, marginBottom: 4 },
  apptMeta: { fontFamily: "Inter_400Regular", fontSize: 13, marginBottom: 2 },
  notes: { marginTop: 8, borderTopWidth: 1, paddingTop: 8, fontFamily: "Inter_400Regular", fontSize: 13, fontStyle: "italic" },
  iconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4, marginTop: 4 },
  searchBox: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, gap: 10, marginBottom: 4 },
  searchInput: { flex: 1, fontFamily: "Inter_400Regular", fontSize: 15, paddingVertical: Platform.OS === "ios" ? 14 : 10 },
  resultsBox: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 8 },
  resultRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  resultAvatar: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  resultAvatarText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  resultName: { fontFamily: "Inter_600SemiBold", fontSize: 14, marginBottom: 2 },
  resultMeta: { fontFamily: "Inter_400Regular", fontSize: 12 },
  noResults: { alignItems: "center", padding: 20, gap: 10 },
  noResultsText: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center" },
  registerBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginTop: 4 },
  selectedChip: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 4 },
  chipAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cancelBtn: { flex: 1, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, marginRight: 8, borderWidth: 1 },
  payPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  timePickerBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginTop: 4 },
  serviceRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  totalCard: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 14 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  totalLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  totalValue: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
