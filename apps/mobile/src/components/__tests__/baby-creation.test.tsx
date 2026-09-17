import React from "react";
import { Alert } from "react-native";

import NewBabyScreen from "../../../app/(app)/clients/[id]/babies/new";
import type { BabyRecord, ClientRecord } from "@/db/schema";
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
    useLocalSearchParams: () => ({ id: "3" }),
    useNavigation: () => navigation,
  };
});

jest.mock("@/db", () => {
  const limit = jest.fn();
  const selectWhere = jest.fn(() => ({ limit }));
  const from = jest.fn(() => ({ where: selectWhere }));
  const returning = jest.fn();
  const values = jest.fn(() => ({ returning }));
  const db = {
    select: jest.fn(() => ({ from })),
    insert: jest.fn(() => ({ values })),
  };
  return { __esModule: true, db, getDb: () => db, limit, returning, values };
});

jest.mock("@/lib/toast", () => ({
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
}));

const mockDatabase = jest.requireMock("@/db");
const mockLimit = mockDatabase.limit as jest.Mock;
const mockReturning = mockDatabase.returning as jest.Mock;
const mockValues = mockDatabase.values as jest.Mock;
const mockRouter = jest.requireMock("expo-router").router as {
  back: jest.Mock;
};
const mockNavigation = jest.requireMock("expo-router").navigation as {
  addListener: jest.Mock;
  dispatch: jest.Mock;
};
const mockShowErrorToast = jest.requireMock("@/lib/toast")
  .showErrorToast as jest.Mock;

function makeClient(): ClientRecord {
  return {
    id: 3,
    firstName: "Amina",
    lastName: "Brown",
    middleName: null,
    preferredName: null,
    address: null,
    primaryPhone: null,
    dateOfBirth: null,
    age: null,
    estimatedDeliveryDate: null,
    actualDeliveryDate: null,
    gravida: null,
    parity: null,
    bloodType: null,
    rhStatus: null,
    gbsStatus: null,
    deliveryMethod: null,
    tearDegree: null,
    riskFactors: null,
    partnerName: null,
    partnerRelationship: null,
    partnerPhone: null,
    partnerBloodType: null,
    isActive: 1,
    createdAt: "2026-09-16T20:00:00.000Z",
    updatedAt: "2026-09-16T20:00:00.000Z",
    deletedAt: null,
  };
}

function makeBaby(overrides: Partial<BabyRecord> = {}): BabyRecord {
  return {
    id: 8,
    clientId: 3,
    name: null,
    sex: null,
    eventDate: null,
    birthWeightGrams: null,
    gestationalAgeDays: null,
    bloodType: null,
    feedingType: null,
    riskFactors: null,
    outcome: null,
    createdAt: "2026-09-16T20:00:00.000Z",
    updatedAt: "2026-09-16T20:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("NewBabyScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLimit.mockResolvedValue([makeClient()]);
    mockReturning.mockImplementation(async () => [
      makeBaby(mockValues.mock.calls.at(-1)?.[0]),
    ]);
  });

  afterEach(() => jest.restoreAllMocks());

  it("allows a completely blank record after confirming the active client", async () => {
    renderWithTheme(<NewBabyScreen />);
    expect(screen.queryByText(/All details are optional/)).toBeNull();
    expect(screen.getByText("Record details")).toBeTruthy();
    fireEvent.press(screen.getByText("Save record"));

    await waitFor(() =>
      expect(mockValues).toHaveBeenCalledWith({
        clientId: 3,
        name: null,
        sex: null,
        outcome: null,
        eventDate: null,
        birthWeightGrams: null,
        gestationalAgeDays: null,
        bloodType: null,
        feedingType: null,
        riskFactors: null,
      }),
    );
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it("rejects creation when the client is missing or archived", async () => {
    mockLimit.mockResolvedValue([]);
    renderWithTheme(<NewBabyScreen />);
    fireEvent.press(screen.getByText("Save record"));

    await waitFor(() => expect(mockShowErrorToast).toHaveBeenCalled());
    expect(mockValues).not.toHaveBeenCalled();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it("retains entries after persistence failure", async () => {
    mockReturning.mockRejectedValue(new Error("database unavailable"));
    renderWithTheme(<NewBabyScreen />);
    fireEvent.changeText(screen.getByLabelText("Name"), " Robin ");
    fireEvent.press(screen.getByText("Save record"));

    await waitFor(() => expect(mockShowErrorToast).toHaveBeenCalled());
    expect(screen.getByLabelText("Name").props.value).toBe(" Robin ");
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it("blocks dirty navigation until discard is confirmed", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    renderWithTheme(<NewBabyScreen />);
    fireEvent.changeText(screen.getByLabelText("Name"), "Robin");
    const beforeRemove = mockNavigation.addListener.mock.calls
      .filter(([name]: [string]) => name === "beforeRemove")
      .at(-1)?.[1];
    const action = { type: "GO_BACK" };
    const event = { data: { action }, preventDefault: jest.fn() };

    act(() => beforeRemove(event));
    expect(event.preventDefault).toHaveBeenCalled();
    const buttons = alertSpy.mock.calls.at(-1)?.[2];
    act(() => buttons?.[1].onPress?.());
    expect(mockNavigation.dispatch).toHaveBeenCalledWith(action);
  });
});
