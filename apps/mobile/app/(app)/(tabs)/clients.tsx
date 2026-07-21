import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { Search, UserRoundPlus, X } from "lucide-react-native";

import { getDb } from "@/db";
import { clients } from "@/db/schema";
import {
  clientStatusFilters,
  getClientStatusFilterForOffset,
  groupClientsByLastName,
  isClientVisible,
  type ClientListSection,
  type ClientStatusFilter,
} from "@/lib/client-list";
import { makeStyles } from "@/lib/make-styles";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize } from "@/lib/themes";

import { ClientListView } from "@/components/ClientListView";
import { ClientStatusFilters } from "@/components/ClientStatusFilters";

type ClientRecord = typeof clients.$inferSelect;
type ClientView = {
  filter: ClientStatusFilter;
  sections: ClientListSection<ClientRecord>[];
};

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
  const { width: pageWidth } = useWindowDimensions();
  const styles = useStyles();
  const pagerRef = useRef<FlatList<ClientView>>(null);
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

  const clientViews = useMemo<ClientView[]>(
    () =>
      clientStatusFilters.map((filter) => ({
        filter,
        sections: groupClientsByLastName(
          data.filter((client) => isClientVisible(client, query, filter)),
        ),
      })),
    [data, query],
  );

  function selectStatusFilter(filter: ClientStatusFilter) {
    setStatusFilter(filter);
    pagerRef.current?.scrollToIndex({
      index: clientStatusFilters.indexOf(filter),
      animated: true,
    });
  }

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
      <ClientStatusFilters
        selected={statusFilter}
        onChange={selectStatusFilter}
      />
      <FlatList
        ref={pagerRef}
        horizontal
        pagingEnabled
        bounces={false}
        data={clientViews}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: pageWidth,
          offset: pageWidth * index,
          index,
        })}
        initialNumToRender={clientStatusFilters.length}
        keyExtractor={(view) => view.filter}
        keyboardDismissMode="on-drag"
        maxToRenderPerBatch={clientStatusFilters.length}
        onMomentumScrollEnd={({ nativeEvent }) => {
          setStatusFilter(
            getClientStatusFilterForOffset(
              nativeEvent.contentOffset.x,
              pageWidth,
            ),
          );
        }}
        removeClippedSubviews={false}
        renderItem={({ item }) => (
          <ClientListView
            sections={item.sections}
            emptyMessage={
              query.trim() || item.filter !== "all"
                ? "No matching clients."
                : "No clients yet."
            }
            width={pageWidth}
          />
        )}
        showsHorizontalScrollIndicator={false}
        windowSize={clientStatusFilters.length + 1}
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
}));
