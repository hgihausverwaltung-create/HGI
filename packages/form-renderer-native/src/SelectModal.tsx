import React, { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { ReferenceOption } from "./types";

export function SelectModal({
  label,
  options,
  value,
  onSelect,
  disabled,
}: {
  label: string;
  options: ReferenceOption[];
  value: string | undefined;
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <>
      <Pressable style={[styles.trigger, disabled && styles.disabled]} onPress={() => !disabled && setOpen(true)}>
        <Text style={selectedLabel ? styles.triggerText : styles.placeholder}>{selectedLabel ?? "Wert auswählen…"}</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onSelect(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={item.value === value ? styles.optionSelected : styles.optionText}>{item.label}</Text>
                </Pressable>
              )}
            />
            <Pressable style={styles.cancel} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>Abbrechen</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 10, backgroundColor: "#f4f5f7" },
  disabled: { opacity: 0.5 },
  triggerText: { fontSize: 15, color: "#1a1a1a" },
  placeholder: { fontSize: 15, color: "#888" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "white", borderTopLeftRadius: 12, borderTopRightRadius: 12, maxHeight: "70%", padding: 16 },
  sheetTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  option: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" },
  optionText: { fontSize: 15 },
  optionSelected: { fontSize: 15, color: "#b3182c", fontWeight: "600" },
  cancel: { paddingVertical: 12, alignItems: "center" },
  cancelText: { color: "#b3182c", fontWeight: "600" },
});
