import React from "react";
import { Alert } from "react-native";

import EditClientScreen from "../../../app/(app)/clients/[id]/edit";
import type { ClientRecord } from "@/db/schema";
import { act, fireEvent, renderWithTheme, screen, waitFor } from "@/test-utils";

jest.mock("react-native-keyboard-controller", () =>
  jest.requireActual("react-native-keyboard-controller/jest"),
);
jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: {
    createAnimatedComponent: (Component: React.ComponentType) => Component,
  },
}));
jest.mock("@gorhom/bottom-sheet", () =>
  jest.requireActual("@gorhom/bottom-sheet/mock"),
);
jest.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: function MockDateTimePicker() {
    return null;
  },
}));

let mockRouteId: string | string[] | undefined = "7";
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
    router: {
      back: jest.fn(),
      dismissTo: jest.fn(),
      replace: jest.fn(),
    },
    useLocalSearchParams: () => ({ id: mockRouteId }),
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
  return {
    __esModule: true,
    db,
    from,
    getDb: () => db,
    limit,
    returning,
    selectWhere,
    set,
    updateWhere,
  };
});

jest.mock("@/lib/toast", () => ({
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
}));

const mockExpoRouter = jest.requireMock("expo-router");
const mockRouter = mockExpoRouter.router as {
  back: jest.Mock;
  dismissTo: jest.Mock;
  replace: jest.Mock;
};
const mockNavigation = mockExpoRouter.useNavigation();
const mockDatabase = jest.requireMock("@/db");
const mockDb = mockDatabase.db as { select: jest.Mock; update: jest.Mock };
const mockLimit = mockDatabase.limit as jest.Mock;
const mockReturning = mockDatabase.returning as jest.Mock;
const mockSet = mockDatabase.set as jest.Mock;
const mockShowSuccessToast = jest.requireMock("@/lib/toast")
  .showSuccessToast as jest.Mock;

/** Builds a valid persisted row while allowing each lifecycle test to vary relevant fields. */
function makeClient(overrides: Partial<ClientRecord> = {}): ClientRecord {
  return {
    id: 7,
    firstName: "Amina",
    lastName: "Yusuf",
    middleName: "N.",
    preferredName: "Mina",
    address: "72 Willow Street",
    primaryPhone: "555-0100",
    dateOfBirth: null,
    age: 32,
    estimatedDeliveryDate: "2026-11-02",
    actualDeliveryDate: null,
    gravida: 2,
    parity: 1,
    bloodType: "O+",
    rhStatus: "+",
    gbsStatus: null,
    deliveryMethod: null,
    tearDegree: null,
    riskFactors: null,
    partnerName: null,
    partnerRelationship: null,
    partnerPhone: null,
    partnerBloodType: null,
    isActive: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("EditClientScreen", () => {
  let storedClient: ClientRecord;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteId = "7";
    storedClient = makeClient();
    mockLimit.mockResolvedValue([storedClient]);
    mockReturning.mockImplementation(async () => [
      { ...storedClient, ...mockSet.mock.calls.at(-1)?.[0] },
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("loads persisted editable values and edit actions", async () => {
    renderWithTheme(<EditClientScreen />);

    expect(await screen.findByLabelText("First name")).toBeTruthy();
    expect(screen.getByLabelText("First name").props.value).toBe("Amina");
    expect(screen.getByLabelText("Last name").props.value).toBe("Yusuf");
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
  });

  it("saves edits, clears optional values to null, and preserves non-form fields", async () => {
    renderWithTheme(<EditClientScreen />);
    await screen.findByLabelText("First name");
    fireEvent.changeText(screen.getByLabelText("First name"), "  Amira  ");
    fireEvent.changeText(screen.getByLabelText("Preferred name"), "");

    fireEvent.press(screen.getByText("Save changes"));

    await waitFor(() => expect(mockSet).toHaveBeenCalledTimes(1));
    const update = mockSet.mock.calls[0][0];
    expect(update).toEqual(
      expect.objectContaining({
        firstName: "Amira",
        preferredName: null,
        updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      }),
    );
    expect(update).not.toHaveProperty("actualDeliveryDate");
    expect(update).not.toHaveProperty("isActive");
    expect(update).not.toHaveProperty("createdAt");
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalledTimes(1));
    expect(mockShowSuccessToast).toHaveBeenCalledWith(
      "Client updated",
      "Changes were saved.",
    );
  });

  it("prevents duplicate edit submissions while persistence is pending", async () => {
    let resolveUpdate: ((rows: ClientRecord[]) => void) | undefined;
    mockReturning.mockImplementationOnce(
      () =>
        new Promise<ClientRecord[]>((resolve) => {
          resolveUpdate = resolve;
        }),
    );
    renderWithTheme(<EditClientScreen />);
    await screen.findByLabelText("First name");
    fireEvent.changeText(screen.getByLabelText("First name"), "Amira");
    fireEvent.press(screen.getByLabelText("Expand Clinical section"));
    const saveButton = screen.getByText("Save changes");

    fireEvent.press(saveButton);
    fireEvent.press(saveButton);

    expect(mockSet).toHaveBeenCalledTimes(1);
    const beforeRemove = mockNavigation.addListener.mock.calls
      .filter(([eventName]: [string]) => eventName === "beforeRemove")
      .at(-1)?.[1];
    const event = {
      preventDefault: jest.fn(),
      data: { action: { type: "GO_BACK" } },
    };
    act(() => beforeRemove(event));
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(mockNavigation.dispatch).not.toHaveBeenCalled();
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(screen.getByLabelText("First name").props.editable).toBe(false);
    expect(screen.getByLabelText("Gravida").props.editable).toBe(false);
    expect(
      screen.getByLabelText("Date of birth: Not set").props.accessibilityState,
    ).toEqual(expect.objectContaining({ disabled: true }));
    expect(
      screen.getByLabelText("Blood type: O+").props.accessibilityState,
    ).toEqual(expect.objectContaining({ disabled: true }));
    fireEvent.changeText(screen.getByLabelText("First name"), "Late edit");
    expect(screen.getByLabelText("First name").props.value).toBe("Amira");

    await act(async () => {
      resolveUpdate?.([
        {
          ...storedClient,
          ...mockSet.mock.calls[0][0],
        },
      ]);
    });
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalledTimes(1));
  });

  it("guards dirty Cancel and the native before-remove path", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    renderWithTheme(<EditClientScreen />);
    await screen.findByLabelText("First name");
    fireEvent.changeText(screen.getByLabelText("First name"), "Amira");

    fireEvent.press(screen.getByText("Cancel"));
    expect(alertSpy).toHaveBeenCalledWith(
      "Discard your changes?",
      "Your unsaved edits will be lost.",
      expect.any(Array),
      expect.objectContaining({ cancelable: true }),
    );
    expect(mockRouter.back).not.toHaveBeenCalled();
    const cancelButtons = alertSpy.mock.calls.at(-1)?.[2];
    act(() => cancelButtons?.[0].onPress?.());

    const beforeRemove = mockNavigation.addListener.mock.calls
      .filter(([eventName]: [string]) => eventName === "beforeRemove")
      .at(-1)?.[1];
    const action = { type: "POP_TO_TOP" };
    const event = { preventDefault: jest.fn(), data: { action } };
    act(() => beforeRemove(event));
    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    const discardButtons = alertSpy.mock.calls.at(-1)?.[2];
    act(() => discardButtons?.[1].onPress?.());
    expect(mockNavigation.dispatch).toHaveBeenCalledWith(action);
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it("archives with matching timestamps and returns to Clients", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    renderWithTheme(<EditClientScreen />);
    await screen.findByLabelText("First name");

    fireEvent.press(screen.getByRole("button", { name: "Delete" }));
    const buttons = alertSpy.mock.calls.at(-1)?.[2];
    await act(async () => buttons?.[1].onPress?.());

    await waitFor(() => expect(mockSet).toHaveBeenCalledTimes(1));
    const update = mockSet.mock.calls[0][0];
    expect(update.deletedAt).toBe(update.updatedAt);
    expect(mockRouter.dismissTo).toHaveBeenCalledWith("/(app)/(tabs)/clients");
    expect(mockShowSuccessToast).toHaveBeenCalledWith(
      "Client archived",
      "The record remains stored locally.",
    );
  });

  it("rejects malformed IDs before querying", async () => {
    mockRouteId = "4e1";
    renderWithTheme(<EditClientScreen />);

    expect(await screen.findByText("Invalid client")).toBeTruthy();
    expect(mockDb.select).not.toHaveBeenCalled();
  });
});
