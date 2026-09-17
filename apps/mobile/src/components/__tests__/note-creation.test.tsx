import React from "react";
import { Alert } from "react-native";

import NewNoteScreen from "../../../app/(app)/clients/[id]/notes/new";
import type { ClientRecord } from "@/lib/client-detail";
import { act, fireEvent, renderWithTheme, screen, waitFor } from "@/test-utils";

jest.mock("react-native-keyboard-controller", () =>
  jest.requireActual("react-native-keyboard-controller/jest"),
);

let mockRouteId: string | string[] | undefined = "3";
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
    useLocalSearchParams: () => ({ id: mockRouteId }),
    useNavigation: () => navigation,
  };
});

jest.mock("@/db", () => {
  const limit = jest.fn();
  const where = jest.fn(() => ({ limit }));
  const from = jest.fn(() => ({ where }));
  const returning = jest.fn();
  const values = jest.fn(() => ({ returning }));
  const db = {
    insert: jest.fn(() => ({ values })),
    select: jest.fn(() => ({ from })),
  };
  return {
    __esModule: true,
    db,
    getDb: () => db,
    limit,
    returning,
    values,
  };
});

jest.mock("@/lib/toast", () => ({
  showErrorToast: jest.fn(),
  showSuccessToast: jest.fn(),
}));

const mockExpoRouter = jest.requireMock("expo-router");
const mockRouter = mockExpoRouter.router as {
  back: jest.Mock;
};
const mockNavigation = mockExpoRouter.navigation as {
  addListener: jest.Mock;
  dispatch: jest.Mock;
};
const mockDatabase = jest.requireMock("@/db");
const mockLimit = mockDatabase.limit as jest.Mock;
const mockValues = mockDatabase.values as jest.Mock;
const mockReturning = mockDatabase.returning as jest.Mock;
const mockShowErrorToast = jest.requireMock("@/lib/toast")
  .showErrorToast as jest.Mock;
const mockShowSuccessToast = jest.requireMock("@/lib/toast")
  .showSuccessToast as jest.Mock;

/** Builds a valid client row for the create-note ownership check. */
function makeClient(): ClientRecord {
  return {
    id: 3,
    firstName: "Eleanor",
    lastName: "Rigby",
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
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
  };
}

describe("NewNoteScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteId = "3";
    mockLimit.mockResolvedValue([makeClient()]);
    mockReturning.mockResolvedValue([
      {
        id: 9,
        clientId: 3,
        title: null,
        content: "Discussed feeding plan.",
        createdAt: "2026-09-16T20:00:00.000Z",
        updatedAt: "2026-09-16T20:00:00.000Z",
        deletedAt: null,
      },
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** Verifies that a valid note is scoped to its client and persisted before navigation. */
  it("saves valid content to the route client and returns to its detail", async () => {
    renderWithTheme(<NewNoteScreen />);
    fireEvent.changeText(
      screen.getByLabelText("Note"),
      "Discussed feeding plan.",
    );
    fireEvent.press(screen.getByText("Save note"));

    await waitFor(() =>
      expect(mockValues).toHaveBeenCalledWith({
        clientId: 3,
        title: null,
        content: "Discussed feeding plan.",
      }),
    );
    expect(mockShowSuccessToast).toHaveBeenCalledWith(
      "Note added",
      "The note was saved to this client.",
    );
    expect(mockRouter.back).toHaveBeenCalled();
  });

  /** Verifies that required-content validation prevents persistence. */
  it("keeps a blank note on screen with inline guidance", () => {
    renderWithTheme(<NewNoteScreen />);
    fireEvent.press(screen.getByText("Save note"));

    expect(mockValues).not.toHaveBeenCalled();
    expect(mockShowErrorToast).toHaveBeenCalledTimes(1);
  });

  /** Verifies that a failed insert preserves the draft for retry. */
  it("retains the draft and stays open when persistence fails", async () => {
    mockReturning.mockRejectedValueOnce(new Error("database unavailable"));
    renderWithTheme(<NewNoteScreen />);
    fireEvent.changeText(screen.getByLabelText("Note"), "Keep this draft");

    fireEvent.press(screen.getByText("Save note"));

    await waitFor(() => expect(mockShowErrorToast).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText("Note").props.value).toBe("Keep this draft");
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  /** Verifies that dirty navigation requires explicit discard confirmation. */
  it("blocks dirty navigation until the user confirms discarding the draft", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    renderWithTheme(<NewNoteScreen />);
    fireEvent.changeText(screen.getByLabelText("Note"), "Unsaved draft");
    const beforeRemove = mockNavigation.addListener.mock.calls
      .filter(([eventName]: [string]) => eventName === "beforeRemove")
      .at(-1)?.[1];
    const action = { type: "GO_BACK" };
    const event = { data: { action }, preventDefault: jest.fn() };

    act(() => beforeRemove(event));

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(mockNavigation.dispatch).not.toHaveBeenCalled();
    const buttons = alertSpy.mock.calls.at(-1)?.[2];
    act(() => buttons?.[1].onPress?.());
    expect(mockNavigation.dispatch).toHaveBeenCalledWith(action);
  });
});
