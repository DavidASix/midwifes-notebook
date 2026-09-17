import React from "react";
import { Alert } from "react-native";

import EditBabyScreen from "../../../app/(app)/clients/[id]/babies/[babyId]";
import type { BabyRecord } from "@/db/schema";
import { buildBabyUpdate } from "@/lib/baby-form";
import { act, fireEvent, renderWithTheme, screen, waitFor } from "@/test-utils";

jest.mock("react-native-keyboard-controller", () =>
  jest.requireActual("react-native-keyboard-controller/jest"),
);

jest.mock("expo-router", () => {
  function MockStack() {
    return null;
  }
  const navigation = {
    addListener: jest.fn(() => jest.fn()),
    dispatch: jest.fn(),
  };
  MockStack.Screen = jest.fn(() => null);
  return {
    __esModule: true,
    Stack: MockStack,
    navigation,
    router: { back: jest.fn() },
    useLocalSearchParams: () => ({ id: "3", babyId: "8" }),
    useNavigation: () => navigation,
  };
});

jest.mock("@/db", () => {
  const limit = jest.fn();
  const selectWhere = jest.fn(() => ({ limit }));
  const from = jest.fn(() => ({ where: selectWhere }));
  const returning = jest.fn();
  const updateWhere = jest.fn(() => ({ returning }));
  const set = jest.fn(() => ({ where: updateWhere }));
  const db = {
    select: jest.fn(() => ({ from })),
    update: jest.fn(() => ({ set })),
  };
  return { __esModule: true, db, getDb: () => db, limit, returning, set };
});

jest.mock("@/lib/toast", () => ({
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
}));

const mockDatabase = jest.requireMock("@/db");
const mockLimit = mockDatabase.limit as jest.Mock;
const mockReturning = mockDatabase.returning as jest.Mock;
const mockSet = mockDatabase.set as jest.Mock;
const mockRouter = jest.requireMock("expo-router").router as {
  back: jest.Mock;
};
const mockNavigation = jest.requireMock("expo-router").navigation as {
  addListener: jest.Mock;
  dispatch: jest.Mock;
};

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
    riskFactors: "Monitor bilirubin",
    outcome: "live_birth",
    createdAt: "2026-09-16T20:00:00.000Z",
    updatedAt: "2026-09-16T20:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("EditBabyScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLimit.mockResolvedValue([makeBaby()]);
    mockReturning.mockImplementation(async () => [
      makeBaby(mockSet.mock.calls.at(-1)?.[0]),
    ]);
  });

  afterEach(() => jest.restoreAllMocks());

  it("loads and saves edits to the client-owned active record", async () => {
    renderWithTheme(<EditBabyScreen />);
    expect(await screen.findByDisplayValue("Robin")).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText("Name"), "Rowan");
    fireEvent.press(screen.getByText("Save record"));

    await waitFor(() =>
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Rowan",
          updatedAt: expect.any(String),
        }),
      ),
    );
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it.each([
    ["Pounds", "Ounces"],
    ["Ounces", "Pounds"],
  ])(
    "clears stored weight after clearing %s then %s",
    async (first, second) => {
      renderWithTheme(<EditBabyScreen />);
      await screen.findByDisplayValue("Robin");
      fireEvent.press(screen.getByText("lb / oz"));
      fireEvent.changeText(screen.getByLabelText(first), "");
      expect(screen.getByLabelText(first).props.value).toBe("");
      fireEvent.changeText(screen.getByLabelText(second), "");
      fireEvent.press(screen.getByText("Save record"));

      await waitFor(() =>
        expect(mockSet).toHaveBeenCalledWith(
          expect.objectContaining({ birthWeightGrams: null }),
        ),
      );
    },
  );

  it("shows a missing state when the scoped record is unavailable", async () => {
    mockLimit.mockResolvedValue([]);
    renderWithTheme(<EditBabyScreen />);
    expect(await screen.findByText("Baby record not found")).toBeTruthy();
  });

  it("shows imperial weight validation errors and saves after correction", async () => {
    renderWithTheme(<EditBabyScreen />);
    await screen.findByDisplayValue("Robin");
    fireEvent.press(screen.getByText("lb / oz"));
    fireEvent.changeText(screen.getByLabelText("Pounds"), "-1");
    fireEvent.press(screen.getByText("Save record"));

    const validation = buildBabyUpdate({ birthWeightGrams: -1 });
    if (validation.success) throw new Error("Expected invalid weight");
    const error = validation.errors.birthWeightGrams!;
    expect(screen.getByText(error)).toBeTruthy();
    expect(mockSet).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByLabelText("Pounds"), "7");
    expect(screen.queryByText(error)).toBeNull();
    fireEvent.press(screen.getByText("Save record"));
    await waitFor(() =>
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ birthWeightGrams: 3402 }),
      ),
    );
  });

  it("archives with matching deletion and update timestamps after confirmation", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    renderWithTheme(<EditBabyScreen />);
    expect(await screen.findByText("Delete Baby Record")).toBeTruthy();
    fireEvent.press(screen.getByText("Delete"));
    const buttons = alertSpy.mock.calls.at(-1)?.[2];
    await act(async () => buttons?.[1].onPress?.());

    const update = mockSet.mock.calls.at(-1)?.[0];
    expect(update.deletedAt).toBe(update.updatedAt);
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("blocks dirty navigation until discard is confirmed", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    renderWithTheme(<EditBabyScreen />);
    await screen.findByDisplayValue("Robin");
    fireEvent.changeText(screen.getByLabelText("Name"), "Rowan");
    const beforeRemove = mockNavigation.addListener.mock.calls
      .filter(([name]: [string]) => name === "beforeRemove")
      .at(-1)?.[1];
    const action = { type: "GO_BACK" };
    const event = { data: { action }, preventDefault: jest.fn() };
    act(() => beforeRemove(event));
    const buttons = alertSpy.mock.calls.at(-1)?.[2];
    act(() => buttons?.[1].onPress?.());
    expect(mockNavigation.dispatch).toHaveBeenCalledWith(action);
  });
});
