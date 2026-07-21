import { SectionList, View } from "react-native";

import { clients } from "@/db/schema";
import {
  type ClientListSection,
  shouldShowClientSectionHeaders,
} from "@/lib/client-list";
import { makeStyles } from "@/lib/make-styles";
import { fontFamilies, fontSize } from "@/lib/themes";

import { ClientListItem } from "@/components/ClientListItem";
import { Text } from "@/components/ui/Text";

export function ClientListView({
  sections,
  emptyMessage,
  width,
}: {
  sections: ClientListSection<typeof clients.$inferSelect>[];
  emptyMessage: string;
  width: number;
}) {
  const styles = useStyles();
  const clientCount = sections.reduce(
    (total, section) => total + section.data.length,
    0,
  );
  const showSectionHeaders = shouldShowClientSectionHeaders(clientCount);

  return (
    <View style={[styles.container, { width }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ClientListItem client={item} />}
        renderSectionHeader={
          showSectionHeaders
            ? ({ section }) => (
                <Text style={styles.sectionHeader}>{section.title}</Text>
              )
            : undefined
        }
        stickySectionHeadersEnabled={showSectionHeaders}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={
          sections.length === 0 ? styles.emptyList : undefined
        }
        ListEmptyComponent={<Text style={styles.empty}>{emptyMessage}</Text>}
      />
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
