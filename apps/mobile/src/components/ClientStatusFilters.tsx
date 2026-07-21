import { Pressable, ScrollView, View } from "react-native";

import type { ClientStatusFilter } from "@/lib/client-list";
import { makeStyles } from "@/lib/make-styles";
import { fontFamilies, fontSize } from "@/lib/themes";

import { Text } from "@/components/ui/Text";

const filters: { label: string; value: ClientStatusFilter }[] = [
  { label: "All Clients", value: "all" },
  { label: "Prenatal", value: "prenatal" },
  { label: "Postpartum", value: "postpartum" },
  { label: "Out of Care", value: "out-of-care" },
];

export function ClientStatusFilters({
  selected,
  onChange,
}: {
  selected: ClientStatusFilter;
  onChange: (filter: ClientStatusFilter) => void;
}) {
  const styles = useStyles();

  return (
    <View style={styles.border}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {filters.map((filter) => {
          const isSelected = selected === filter.value;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              key={filter.value}
              onPress={() => onChange(filter.value)}
              style={styles.tab}
            >
              <Text style={[styles.label, isSelected && styles.selectedLabel]}>
                {filter.label}
              </Text>
              {isSelected && <View style={styles.indicator} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  border: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  content: {
    minWidth: "100%" as const,
    paddingHorizontal: 20,
    gap: 28,
  },
  tab: {
    paddingTop: 15,
    paddingBottom: 13,
  },
  label: {
    color: theme.mutedForeground,
    fontFamily: fontFamilies.base.medium,
    fontSize: fontSize.md,
  },
  selectedLabel: {
    color: theme.primary,
    fontFamily: fontFamilies.base.bold,
  },
  indicator: {
    position: "absolute" as const,
    right: 0,
    bottom: -1,
    left: 0,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.primary,
  },
}));
