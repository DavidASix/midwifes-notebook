import { useCallback, useEffect, useRef } from "react";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";

import {
  clientStatusFilters,
  type ClientStatusFilter,
} from "@/lib/client-list";
import { makeStyles } from "@/lib/make-styles";
import { fontFamilies, fontSize } from "@/lib/themes";

import { Text } from "@/components/ui/Text";

const filterLabels: Record<ClientStatusFilter, string> = {
  all: "All Clients",
  prenatal: "Prenatal",
  postpartum: "Postpartum",
  "out-of-care": "Out of Care",
};

export function ClientStatusFilters({
  selected,
  onChange,
}: {
  selected: ClientStatusFilter;
  onChange: (filter: ClientStatusFilter) => void;
}) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const tabLayouts = useRef<
    Partial<Record<ClientStatusFilter, { x: number; width: number }>>
  >({});

  const revealFilter = useCallback(
    (filter: ClientStatusFilter) => {
      const layout = tabLayouts.current[filter];
      if (!layout) return;
      scrollViewRef.current?.scrollTo({
        x: Math.max(0, layout.x + layout.width / 2 - width / 2),
        animated: true,
      });
    },
    [width],
  );

  useEffect(() => {
    revealFilter(selected);
  }, [revealFilter, selected]);

  return (
    <View style={styles.border}>
      <ScrollView
        accessibilityRole="tablist"
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {clientStatusFilters.map((filter) => {
          const isSelected = selected === filter;
          return (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              key={filter}
              onLayout={({ nativeEvent }) => {
                tabLayouts.current[filter] = nativeEvent.layout;
                if (isSelected) revealFilter(filter);
              }}
              onPress={() => onChange(filter)}
              style={styles.tab}
            >
              <Text style={[styles.label, isSelected && styles.selectedLabel]}>
                {filterLabels[filter]}
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
