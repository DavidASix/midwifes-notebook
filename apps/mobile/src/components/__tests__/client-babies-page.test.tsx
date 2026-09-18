import React, { useState } from "react";
import { Pressable } from "react-native";

import { ClientBabiesPage } from "@/components/ClientBabiesPage";
import type { BabyRecord } from "@/db/schema";
import { markBabyRecordsChanged } from "@/lib/baby-record";
import { act, fireEvent, renderWithTheme, screen, waitFor } from "@/test-utils";

jest.mock("@gorhom/bottom-sheet", () =>
  jest.requireActual("@gorhom/bottom-sheet/mock"),
);

jest.mock("expo-router", () => {
  const ReactForMock = jest.requireActual<typeof import("react")>("react");
  const FocusContext = ReactForMock.createContext(true);
  return {
    __esModule: true,
    FocusContext,
    router: { push: jest.fn() },
    useFocusEffect: jest.fn((callback: () => void | (() => void)) => {
      const focused = ReactForMock.useContext(FocusContext);
      ReactForMock.useEffect(() => {
        if (focused) return callback();
      }, [callback, focused]);
    }),
  };
});

jest.mock("@/db", () => {
  const orderBy = jest.fn();
  const where = jest.fn(() => ({ orderBy }));
  const from = jest.fn(() => ({ where }));
  const db = { select: jest.fn(() => ({ from })) };
  return { __esModule: true, db, getDb: () => db, orderBy };
});

const mockRouter = jest.requireMock("expo-router").router as {
  push: jest.Mock;
};
const mockUseFocusEffect = jest.requireMock("expo-router")
  .useFocusEffect as jest.Mock;
const mockOrderBy = jest.requireMock("@/db").orderBy as jest.Mock;
const FocusContext = jest.requireMock("expo-router")
  .FocusContext as React.Context<boolean>;

/** Simulates detail-tab selection and route focus without unmounting the page. */
function BabiesPageHarness({ initiallyActive = true }) {
  const [active, setActive] = useState(initiallyActive);
  const [focused, setFocused] = useState(true);
  return (
    <>
      <Pressable
        accessibilityLabel="Toggle babies tab"
        onPress={() => setActive((current) => !current)}
      />
      <Pressable
        accessibilityLabel="Toggle route focus"
        onPress={() => setFocused((current) => !current)}
      />
      <FocusContext.Provider value={focused}>
        <ClientBabiesPage active={active} clientId={3} width={320} />
      </FocusContext.Provider>
    </>
  );
}

function makeBaby(overrides: Partial<BabyRecord> = {}): BabyRecord {
  return {
    id: 8,
    clientId: 3,
    name: "Robin",
    sex: "unknown",
    eventDate: "2026-09-15",
    birthWeightGrams: 3402,
    gestationalAgeDays: 276,
    bloodType: "O+",
    feedingType: "combination",
    riskFactors: "Monitor bilirubin and follow up with the care team.",
    outcome: "live_birth",
    createdAt: "2026-09-16T20:00:00.000Z",
    updatedAt: "2026-09-16T20:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("ClientBabiesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrderBy.mockResolvedValue([]);
  });

  it("loads only when active and opens client-scoped creation", async () => {
    renderWithTheme(<BabiesPageHarness initiallyActive={false} />);
    expect(mockOrderBy).not.toHaveBeenCalled();

    fireEvent.press(screen.getByLabelText("Toggle babies tab"));
    expect(await screen.findByText("No baby records yet")).toBeTruthy();
    fireEvent.press(screen.getByText("Add baby"));
    expect(mockRouter.push).toHaveBeenCalledWith("/clients/3/babies/new");
  });

  it("renders rich optional details and opens the selected record", async () => {
    mockOrderBy.mockResolvedValue([makeBaby()]);
    renderWithTheme(<ClientBabiesPage active clientId={3} width={320} />);

    expect(await screen.findByText("Robin")).toBeTruthy();
    expect(screen.getByText("Live birth")).toBeTruthy();
    expect(screen.getByText("Birth date")).toBeTruthy();
    expect(screen.getByText("3402 g")).toBeTruthy();
    expect(screen.queryByText(/lb/)).toBeNull();
    expect(screen.getByText("39 weeks, 3 days")).toBeTruthy();
    expect(screen.getByText("Combination")).toBeTruthy();
    expect(screen.getByText(/Monitor bilirubin/).props.numberOfLines).toBe(3);
    fireEvent.press(screen.getByLabelText("Open Robin"));
    expect(mockRouter.push).toHaveBeenCalledWith("/clients/3/babies/8");
  });

  it("uses a neutral fallback for a blank record", async () => {
    mockOrderBy.mockResolvedValue([
      makeBaby({
        name: null,
        sex: null,
        eventDate: null,
        birthWeightGrams: null,
        gestationalAgeDays: null,
        bloodType: null,
        feedingType: null,
        riskFactors: null,
        outcome: null,
      }),
    ]);
    renderWithTheme(<ClientBabiesPage active clientId={3} width={320} />);
    expect(await screen.findByText("Baby record")).toBeTruthy();
    expect(screen.getByText("Not specified")).toBeTruthy();
    expect(screen.queryByText("Age")).toBeNull();
  });

  it("keeps malformed and database failures recoverable with retry", async () => {
    mockOrderBy
      .mockResolvedValueOnce([{ id: 8 }])
      .mockRejectedValueOnce(new Error("database unavailable"))
      .mockResolvedValueOnce([]);
    renderWithTheme(<ClientBabiesPage active clientId={3} width={320} />);
    expect(await screen.findByText("Couldn’t load baby records")).toBeTruthy();

    fireEvent.press(screen.getByText("Retry"));
    await waitFor(() => expect(mockOrderBy).toHaveBeenCalledTimes(2));
    fireEvent.press(await screen.findByText("Retry"));
    expect(await screen.findByText("No baby records yet")).toBeTruthy();
  });

  it("reuses loaded records when swiping away and back", async () => {
    renderWithTheme(<BabiesPageHarness />);
    expect(await screen.findByText("No baby records yet")).toBeTruthy();
    expect(mockOrderBy).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByLabelText("Toggle babies tab"));
    fireEvent.press(screen.getByLabelText("Toggle babies tab"));

    await waitFor(() => expect(mockOrderBy).toHaveBeenCalledTimes(1));
  });

  it("refreshes on focus after a successful baby mutation", async () => {
    renderWithTheme(<ClientBabiesPage active clientId={3} width={320} />);
    expect(await screen.findByText("No baby records yet")).toBeTruthy();
    markBabyRecordsChanged(3);
    const focusCallback = mockUseFocusEffect.mock.calls.at(-1)?.[0];

    act(() => {
      focusCallback?.();
    });

    await waitFor(() => expect(mockOrderBy).toHaveBeenCalledTimes(2));
  });

  it.each([false, true])(
    "restarts an interrupted initial load on return (saved baby: %s)",
    async (savedBaby) => {
      let resolveInitial!: (rows: BabyRecord[]) => void;
      mockOrderBy.mockReturnValueOnce(
        new Promise<BabyRecord[]>((resolve) => {
          resolveInitial = resolve;
        }),
      );
      renderWithTheme(<BabiesPageHarness />);
      expect(screen.getByText("Loading baby records…")).toBeTruthy();
      fireEvent.press(screen.getByText("Add baby"));
      fireEvent.press(screen.getByLabelText("Toggle route focus"));
      if (savedBaby) markBabyRecordsChanged(3);
      mockOrderBy.mockResolvedValue([makeBaby()]);
      fireEvent.press(screen.getByLabelText("Toggle route focus"));

      expect(await screen.findByText("Robin")).toBeTruthy();
      await act(async () => resolveInitial([]));
      expect(screen.getByText("Robin")).toBeTruthy();
      expect(mockOrderBy).toHaveBeenCalledTimes(2);
    },
  );
});
