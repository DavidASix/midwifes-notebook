import { useCallback, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { z } from "zod";

import {
  formatClientAge,
  formatClientDetailValue,
  formatClientStatus,
  formatClinicalSign,
  getClientFullName,
  missingClientValue,
  type ClientRecord,
} from "@/lib/client-detail";
import { makeStyles } from "@/lib/make-styles";
import { fontFamilies, fontSize } from "@/lib/themes";

import { Text } from "@/components/ui/Text";

const clientDetailTabs = ["client", "babies", "notes"] as const;

const clientIdSchema = z
  .string()
  .pipe(z.coerce.number())
  .pipe(z.int().positive());

type ClientDetailTab = (typeof clientDetailTabs)[number];

/** Accepts only one positive integer Expo Router path parameter. */
export function parseClientId(
  routeId: string | string[] | undefined,
): number | null {
  const result = clientIdSchema.safeParse(routeId);
  return result.success ? result.data : null;
}

/** Resolves a horizontal pager offset to the nearest detail tab. */
export function getClientDetailTabForOffset(
  horizontalOffset: number,
  pageWidth: number,
): ClientDetailTab {
  if (pageWidth <= 0) return "client";
  const index = Math.min(
    clientDetailTabs.length - 1,
    Math.max(0, Math.round(horizontalOffset / pageWidth)),
  );
  return clientDetailTabs[index];
}

/** Chooses an adjacent page only for a deliberate horizontal swipe. */
export function getClientDetailTabAfterSwipe(
  currentTab: ClientDetailTab,
  horizontalDistance: number,
  horizontalVelocity: number,
  pageWidth: number,
): ClientDetailTab {
  if (pageWidth <= 0) return currentTab;
  const distanceThreshold = Math.min(80, pageWidth * 0.18);
  const isSwipe =
    Math.abs(horizontalDistance) >= distanceThreshold ||
    Math.abs(horizontalVelocity) >= 0.35;
  if (!isSwipe) return currentTab;

  const currentIndex = clientDetailTabs.indexOf(currentTab);
  const direction = horizontalDistance < 0 ? 1 : -1;
  const nextIndex = Math.min(
    clientDetailTabs.length - 1,
    Math.max(0, currentIndex + direction),
  );
  return clientDetailTabs[nextIndex];
}

const tabLabels: Record<ClientDetailTab, string> = {
  client: "Client",
  babies: "Babies",
  notes: "Notes",
};

type DetailField = {
  label: string;
  value: string;
  fullWidth?: boolean;
};

function DetailSection({
  title,
  fields,
}: {
  title: string;
  fields: DetailField[];
}) {
  const styles = useStyles();

  return (
    <View style={styles.section}>
      <Text header style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.sectionDivider} />
      <View style={styles.fieldGrid}>
        {fields.map((field) => (
          <View
            key={field.label}
            style={[styles.field, field.fullWidth && styles.fullWidthField]}
          >
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <Text style={styles.fieldValue}>{field.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ClientInformationPage({
  client,
  width,
}: {
  client: ClientRecord;
  width: number;
}) {
  const styles = useStyles();
  const gravidaParity =
    client.gravida == null && client.parity == null
      ? undefined
      : `G${client.gravida ?? missingClientValue} P${client.parity ?? missingClientValue}`;

  return (
    <BottomSheetScrollView
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
      style={{ width }}
    >
      <DetailSection
        title="Identity"
        fields={[
          {
            label: "Full name",
            value: getClientFullName(client),
            fullWidth: true,
          },
          {
            label: "Preferred name",
            value: formatClientDetailValue(client.preferredName),
          },
          {
            label: "Age",
            value: formatClientAge(client),
          },
          {
            label: "Home address",
            value: formatClientDetailValue(client.address),
            fullWidth: true,
          },
          {
            label: "Primary phone",
            value: formatClientDetailValue(client.primaryPhone),
          },
          {
            label: "Date of birth",
            value: formatClientDetailValue(client.dateOfBirth),
          },
        ]}
      />
      <DetailSection
        title="Clinical Stats"
        fields={[
          {
            label: "EDD",
            value: formatClientDetailValue(client.estimatedDeliveryDate),
          },
          {
            label: "Actual delivery",
            value: formatClientDetailValue(client.actualDeliveryDate),
          },
          {
            label: "Blood type",
            value: formatClientDetailValue(client.bloodType),
          },
          { label: "Rh status", value: formatClinicalSign(client.rhStatus) },
          { label: "GBS status", value: formatClinicalSign(client.gbsStatus) },
          {
            label: "Gravida & parity",
            value: formatClientDetailValue(gravidaParity),
          },
          {
            label: "Delivery method",
            value: formatClientDetailValue(client.deliveryMethod),
          },
          {
            label: "Tear degree",
            value:
              client.tearDegree == null
                ? formatClientDetailValue(null)
                : `${client.tearDegree} degree`,
          },
          {
            label: "Risk factors",
            value: formatClientDetailValue(client.riskFactors),
            fullWidth: true,
          },
        ]}
      />
      <DetailSection
        title="Partner Details"
        fields={[
          {
            label: "Partner name",
            value: formatClientDetailValue(client.partnerName),
            fullWidth: true,
          },
          {
            label: "Relationship",
            value: formatClientDetailValue(client.partnerRelationship),
          },
          {
            label: "Phone number",
            value: formatClientDetailValue(client.partnerPhone),
          },
          {
            label: "Blood type",
            value: formatClientDetailValue(client.partnerBloodType),
          },
        ]}
      />
      <DetailSection
        title="Status"
        fields={[
          {
            label: "Care status",
            value: formatClientStatus(client),
            fullWidth: true,
          },
        ]}
      />
    </BottomSheetScrollView>
  );
}

function PlaceholderPage({ label, width }: { label: string; width: number }) {
  const styles = useStyles();
  return (
    <BottomSheetScrollView
      contentContainerStyle={styles.placeholderPage}
      style={{ width }}
    >
      <Text header style={styles.placeholderText}>
        {label}
      </Text>
    </BottomSheetScrollView>
  );
}

/** Displays one client across independently scrollable, horizontally paged detail tabs. */
export function ClientDetailContent({ client }: { client: ClientRecord }) {
  const styles = useStyles();
  const pagerRef = useRef<FlatList<ClientDetailTab>>(null);
  const [selectedTab, setSelectedTab] = useState<ClientDetailTab>("client");
  const [pageWidth, setPageWidth] = useState(0);

  function measurePager(event: LayoutChangeEvent) {
    const measuredWidth = event.nativeEvent.layout.width;
    if (measuredWidth > 0 && measuredWidth !== pageWidth) {
      setPageWidth(measuredWidth);
    }
  }

  const selectTab = useCallback((tab: ClientDetailTab) => {
    setSelectedTab(tab);
    pagerRef.current?.scrollToIndex({
      index: clientDetailTabs.indexOf(tab),
      animated: true,
    });
  }, []);

  const swipeGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-12, 12])
        .failOffsetY([-12, 12])
        .runOnJS(true)
        .onEnd((gesture) => {
          selectTab(
            getClientDetailTabAfterSwipe(
              selectedTab,
              gesture.translationX,
              gesture.velocityX / 1_000,
              pageWidth,
            ),
          );
        }),
    [pageWidth, selectTab, selectedTab],
  );

  return (
    <View style={styles.container}>
      <View accessibilityRole="tablist" style={styles.tabBar}>
        {clientDetailTabs.map((tab) => {
          const isSelected = tab === selectedTab;
          return (
            <Pressable
              key={tab}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              onPress={() => selectTab(tab)}
              style={styles.tab}
            >
              <Text
                style={[styles.tabLabel, isSelected && styles.activeTabLabel]}
              >
                {tabLabels[tab]}
              </Text>
              <View
                style={[
                  styles.tabIndicator,
                  isSelected && styles.activeTabIndicator,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <GestureDetector gesture={swipeGesture}>
        <View
          onLayout={measurePager}
          style={styles.pagerContainer}
          testID="client-detail-pager"
        >
          {pageWidth > 0 && (
            <FlatList
              ref={pagerRef}
              testID="client-detail-pages"
              horizontal
              pagingEnabled
              scrollEnabled={false}
              bounces={false}
              data={clientDetailTabs}
              decelerationRate="fast"
              getItemLayout={(_, index) => ({
                length: pageWidth,
                offset: pageWidth * index,
                index,
              })}
              initialNumToRender={clientDetailTabs.length}
              keyExtractor={(tab) => tab}
              onMomentumScrollEnd={({ nativeEvent }) => {
                setSelectedTab(
                  getClientDetailTabForOffset(
                    nativeEvent.contentOffset.x,
                    pageWidth,
                  ),
                );
              }}
              removeClippedSubviews={false}
              renderItem={({ item }) => {
                if (item === "client") {
                  return (
                    <ClientInformationPage client={client} width={pageWidth} />
                  );
                }
                return (
                  <PlaceholderPage label={tabLabels[item]} width={pageWidth} />
                );
              }}
              showsHorizontalScrollIndicator={false}
              windowSize={clientDetailTabs.length + 1}
            />
          )}
        </View>
      </GestureDetector>
    </View>
  );
}

const useStyles = makeStyles((theme) => ({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.border,
  },
  tab: {
    minHeight: 44,
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingTop: 12,
  },
  tabLabel: {
    paddingBottom: 10,
    color: theme.mutedForeground,
    fontFamily: fontFamilies.base.bold,
    fontSize: fontSize.xs,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  activeTabLabel: {
    color: theme.primary,
  },
  tabIndicator: {
    width: "100%",
    height: 2,
    backgroundColor: "transparent",
  },
  activeTabIndicator: {
    backgroundColor: theme.primary,
  },
  pagerContainer: {
    flex: 1,
  },
  pageContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
    gap: 24,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: theme.primary,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize.xl,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: theme.border,
  },
  fieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 16,
  },
  field: {
    width: "50%",
    minWidth: 0,
    paddingRight: 12,
    gap: 2,
  },
  fullWidthField: {
    width: "100%",
  },
  fieldLabel: {
    color: theme.mutedForeground,
    fontFamily: fontFamilies.base.bold,
    fontSize: fontSize.xs,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  fieldValue: {
    color: theme.foreground,
    fontFamily: fontFamilies.base.regular,
    fontSize: fontSize.md,
    lineHeight: 21,
  },
  placeholderPage: {
    minHeight: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  placeholderText: {
    color: theme.primary,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize["2xl"],
  },
}));
