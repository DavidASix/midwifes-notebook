import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  Pressable,
  SectionList,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { Search, UserRoundPlus, X } from "lucide-react-native";

import { getDb } from "@/db";
import { clients } from "@/db/schema";
import {
  groupClientsByLastName,
  isClientVisible,
  type ClientStatusFilter,
} from "@/lib/client-list";
import { makeStyles } from "@/lib/make-styles";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize } from "@/lib/themes";

import { ClientListItem } from "@/components/ClientListItem";
import { ClientStatusFilters } from "@/components/ClientStatusFilters";
import { Text } from "@/components/ui/Text";

export function HeaderRightButton({ onSearch }: { onSearch: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.headerActions}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search clients"
        hitSlop={8}
        onPress={onSearch}
      >
        <Search color={theme.primary} size={25} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add client"
        hitSlop={8}
        onPress={() => router.push("/clients/new")}
      >
        <UserRoundPlus color={theme.primary} size={26} />
      </Pressable>
    </View>
  );
}

export default function ClientsScreen() {
  const db = getDb();
  const navigation = useNavigation();
  const styles = useStyles();
  const [data, setData] = useState<(typeof clients.$inferSelect)[]>([]);
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>("all");

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <HeaderRightButton onSearch={() => setIsSearchOpen(true)} />
      ),
    });
  }, [navigation]);

  const fetchClients = useCallback(async () => {
    setData(await db.select().from(clients));
  }, [db]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const visibleClients = useMemo(
    () => data.filter((client) => isClientVisible(client, query, statusFilter)),
    [data, query, statusFilter],
  );
  const sections = useMemo(
    () => groupClientsByLastName(visibleClients),
    [visibleClients],
  );

  function closeSearch() {
    setQuery("");
    setIsSearchOpen(false);
  }

  return (
    <View style={styles.container}>
      {isSearchOpen && (
        <View style={styles.searchContainer}>
          <Search color={styles.searchIcon.color} size={19} />
          <TextInput
            accessibilityLabel="Search client, partner, or baby names"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            onChangeText={setQuery}
            placeholder="Search names"
            placeholderTextColor={styles.searchPlaceholder.color}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close search"
            hitSlop={8}
            onPress={closeSearch}
          >
            <X color={styles.searchIcon.color} size={20} />
          </Pressable>
        </View>
      )}
      <ClientStatusFilters selected={statusFilter} onChange={setStatusFilter} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ClientListItem client={item} />}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        stickySectionHeadersEnabled
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          sections.length === 0 ? styles.emptyList : undefined
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            {query.trim() || statusFilter !== "all"
              ? "No matching clients."
              : "No clients yet."}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    paddingRight: 16,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
});

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginVertical: 10,
    minHeight: 44,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: theme.input,
    borderRadius: 12,
    backgroundColor: theme.card,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 9,
    color: theme.foreground,
    fontFamily: fontFamilies.base.regular,
    fontSize: fontSize.md,
  },
  searchIcon: {
    color: theme.mutedForeground,
  },
  searchPlaceholder: {
    color: theme.mutedForeground,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
    color: theme.primary,
    backgroundColor: theme.background,
    fontFamily: fontFamilies.base.bold,
    fontSize: fontSize.xs,
    letterSpacing: 0.8,
  },
  emptyList: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  empty: {
    color: theme.mutedForeground,
    fontFamily: fontFamilies.base.regular,
    fontSize: fontSize.md,
    fontStyle: "italic" as const,
  },
}));
