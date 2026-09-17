import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { and, desc, eq, isNull } from "drizzle-orm";
import { router, useFocusEffect } from "expo-router";
import { Baby, ChevronRight, Plus } from "lucide-react-native";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { getDb } from "@/db";
import { babies, babiesSchema, type BabyRecord } from "@/db/schema";
import {
  babyOutcomeLabels,
  feedingTypeLabels,
  formatGestationalAge,
  getBabyAgeInDays,
  getEventDateLabel,
} from "@/lib/baby-record";
import { makeStyles } from "@/lib/make-styles";
import { formatTimestamp } from "@/lib/dates";
import { getBabyRecordsRevision } from "@/lib/baby-records-revision";
import { useTheme } from "@/lib/theme-context";
import { fontFamilies, fontSize } from "@/lib/themes";

type BabiesLoadState =
  | { status: "loading" }
  | { status: "loaded"; babies: BabyRecord[] }
  | { status: "error" };

/** Pairs a clinical label with its value in the baby record grid. */
function Detail({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

/** Loads and displays one client's active baby records inside Client Detail. */
export function ClientBabiesPage({
  active,
  clientId,
  width,
}: {
  active: boolean;
  clientId: number;
  width: number;
}) {
  // Hooks
  const styles = useStyles();
  const theme = useTheme();

  // Refs for lifecycle management
  const requestVersion = useRef(0);
  const lastRequestedRevision = useRef<number | null>(null);

  // Component state
  const [loadState, setLoadState] = useState<BabiesLoadState>({
    status: "loading",
  });

  /** Loads active records newest first and ignores results superseded by a newer request or focus change. */
  const loadBabies = useCallback(async () => {
    const version = ++requestVersion.current;
    const revision = getBabyRecordsRevision(clientId);
    // An interrupted query must remain eligible for a reload on the next focus.
    lastRequestedRevision.current = null;
    setLoadState({ status: "loading" });
    try {
      const rows = await getDb()
        .select()
        .from(babies)
        .where(and(eq(babies.clientId, clientId), isNull(babies.deletedAt)))
        .orderBy(desc(babies.createdAt), desc(babies.id));
      if (version !== requestVersion.current) return;
      const parsed = z.array(babiesSchema).safeParse(rows);
      lastRequestedRevision.current = revision;
      setLoadState(
        parsed.success
          ? { status: "loaded", babies: parsed.data }
          : { status: "error" },
      );
    } catch {
      if (version === requestVersion.current) {
        lastRequestedRevision.current = revision;
        setLoadState({ status: "error" });
      }
    }
  }, [clientId]);

  useFocusEffect(
    useCallback(() => {
      const currentRevision = getBabyRecordsRevision(clientId);
      if (active && lastRequestedRevision.current !== currentRevision) {
        void loadBabies();
      }
      return () => {
        requestVersion.current += 1;
      };
    }, [active, clientId, loadBabies]),
  );

  return (
    <BottomSheetScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={{ width }}
    >
      <View style={styles.toolbar}>
        <View>
          <Text header style={styles.heading}>
            Baby records
          </Text>
          <Text style={styles.subheading}>Newest first</Text>
        </View>
        <Button
          icon={<Plus color={theme.primaryForeground} size={17} />}
          onPress={() => router.push(`/clients/${clientId}/babies/new`)}
          size="compact"
          title="Add baby"
        />
      </View>

      {loadState.status === "loading" && (
        <View style={styles.state}>
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.stateCopy}>Loading baby records…</Text>
        </View>
      )}
      {loadState.status === "error" && (
        <View style={styles.state}>
          <Text header style={styles.stateTitle}>
            Couldn’t load baby records
          </Text>
          <Text style={styles.stateCopy}>
            Check the database and try again.
          </Text>
          <Button onPress={() => void loadBabies()} title="Retry" />
        </View>
      )}
      {loadState.status === "loaded" && loadState.babies.length === 0 && (
        <View style={styles.state}>
          <View style={styles.emptyIcon}>
            <Baby color={theme.primary} size={25} />
          </View>
          <Text header style={styles.stateTitle}>
            No baby records yet
          </Text>
          <Text style={styles.stateCopy}>
            Add a record when there are details to keep with this client.
          </Text>
        </View>
      )}
      {loadState.status === "loaded" && loadState.babies.length > 0 && (
        <View style={styles.list}>
          {loadState.babies.map((baby) => {
            const age = getBabyAgeInDays(baby);
            return (
              <Button
                accessibilityLabel={`Open ${baby.name || "baby record"}`}
                key={baby.id}
                onPress={() =>
                  router.push(`/clients/${clientId}/babies/${baby.id}`)
                }
                size="bare"
                style={styles.row}
                variant="ghost"
              >
                <View style={styles.rowCopy}>
                  <Text numberOfLines={1} style={styles.name}>
                    {baby.name || "Baby record"}
                  </Text>
                  <Text style={styles.timestamp}>
                    Created {formatTimestamp(baby.createdAt)}
                  </Text>
                  <View style={styles.details}>
                    <Detail
                      label="Outcome"
                      value={
                        baby.outcome
                          ? babyOutcomeLabels[baby.outcome]
                          : "Not specified"
                      }
                    />
                    {baby.eventDate && (
                      <Detail
                        label={getEventDateLabel(baby.outcome)}
                        value={baby.eventDate}
                      />
                    )}
                    {age != null && (
                      <Detail
                        label="Age"
                        value={`${age} ${age === 1 ? "day" : "days"}`}
                      />
                    )}
                    {baby.sex && (
                      <Detail
                        label="Sex"
                        value={
                          baby.sex === "male"
                            ? "Male"
                            : baby.sex === "female"
                              ? "Female"
                              : "Unknown"
                        }
                      />
                    )}
                    {baby.birthWeightGrams != null && (
                      <Detail
                        label="Weight"
                        value={`${baby.birthWeightGrams} g`}
                      />
                    )}
                    {baby.gestationalAgeDays != null && (
                      <Detail
                        label="Gestational age"
                        value={formatGestationalAge(baby.gestationalAgeDays)}
                      />
                    )}
                    {baby.bloodType && (
                      <Detail label="Blood type" value={baby.bloodType} />
                    )}
                    {baby.feedingType && (
                      <Detail
                        label="Feeding type"
                        value={feedingTypeLabels[baby.feedingType]}
                      />
                    )}
                  </View>
                  {baby.riskFactors && (
                    <View style={styles.riskFactors}>
                      <Text style={styles.detailLabel}>Risk factors</Text>
                      <Text numberOfLines={3} style={styles.riskPreview}>
                        {baby.riskFactors}
                      </Text>
                    </View>
                  )}
                </View>
                <ChevronRight color={theme.mutedForeground} size={20} />
              </Button>
            );
          })}
        </View>
      )}
    </BottomSheetScrollView>
  );
}

const useStyles = makeStyles((theme) => ({
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 32 },
  toolbar: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heading: {
    color: theme.foreground,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize.xl,
  },
  subheading: {
    marginTop: 1,
    color: theme.mutedForeground,
    fontSize: fontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  list: { marginTop: 15, borderTopWidth: 1, borderTopColor: theme.border },
  row: {
    paddingVertical: 15,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    borderRadius: 0,
  },
  rowCopy: { flex: 1, alignItems: "flex-start", gap: 5 },
  name: {
    width: "100%",
    color: theme.foreground,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize.lg,
  },
  timestamp: { color: theme.mutedForeground, fontSize: fontSize.xs },
  details: { width: "100%", flexDirection: "row", flexWrap: "wrap", rowGap: 8 },
  detail: { width: "50%", paddingRight: 8, gap: 1 },
  detailLabel: {
    color: theme.mutedForeground,
    fontFamily: fontFamilies.base.bold,
    fontSize: fontSize.xs,
    textTransform: "uppercase",
  },
  detailValue: {
    color: theme.foreground,
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  riskFactors: { width: "100%", gap: 2, paddingTop: 2 },
  riskPreview: {
    color: theme.foreground,
    fontSize: fontSize.sm,
    lineHeight: 19,
  },
  state: {
    minHeight: 310,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 11,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: theme.accent,
  },
  stateTitle: {
    color: theme.primary,
    fontFamily: fontFamilies.heading.bold,
    fontSize: fontSize.xl,
    textAlign: "center",
  },
  stateCopy: {
    maxWidth: 280,
    color: theme.mutedForeground,
    fontSize: fontSize.sm,
    lineHeight: 20,
    textAlign: "center",
  },
}));
