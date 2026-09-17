import React from "react";
import { Alert } from "react-native";

import EditNoteScreen from "../../../app/(app)/clients/[id]/notes/[noteId]";
import type { NoteRecord } from "@/db/schema";
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
    useLocalSearchParams: () => ({ id: "3", noteId: "8" }),
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
    getDb: () => db,
    limit,
    returning,
    set,
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
const mockReturning = mockDatabase.returning as jest.Mock;
const mockSet = mockDatabase.set as jest.Mock;
const mockShowSuccessToast = jest.requireMock("@/lib/toast")
  .showSuccessToast as jest.Mock;
const mockShowErrorToast = jest.requireMock("@/lib/toast")
  .showErrorToast as jest.Mock;

/** Builds a valid note row while allowing tests to vary relevant fields. */
function makeNote(overrides: Partial<NoteRecord> = {}): NoteRecord {
  return {
    id: 8,
    clientId: 3,
    title: "Home visit",
    content: "Reviewed recovery.",
    createdAt: "2026-09-16T20:00:00.000Z",
    updatedAt: "2026-09-16T20:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("EditNoteScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLimit.mockResolvedValue([makeNote()]);
    mockReturning.mockImplementation(async () => [
      { ...makeNote(), ...mockSet.mock.calls.at(-1)?.[0] },
    ]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** Verifies that edits load and persist against the client-owned active note. */
  it("loads and saves edits to the client-owned active note", async () => {
    renderWithTheme(<EditNoteScreen />);
    expect(await screen.findByDisplayValue("Reviewed recovery.")).toBeTruthy();

    fireEvent.changeText(
      screen.getByLabelText("Note"),
      "Reviewed recovery and feeding.",
    );
    fireEvent.press(screen.getByText("Save note"));

    await waitFor(() =>
      expect(mockSet).toHaveBeenCalledWith({
        title: "Home visit",
        content: "Reviewed recovery and feeding.",
        updatedAt: expect.any(String),
      }),
    );
    expect(mockShowSuccessToast).toHaveBeenCalledWith(
      "Note updated",
      "Changes were saved.",
    );
    expect(mockRouter.back).toHaveBeenCalled();
  });

  /** Verifies confirmed archival uses one timestamp for deletion and modification. */
  it("archives with matching timestamps after confirmation", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    renderWithTheme(<EditNoteScreen />);
    expect(await screen.findByText("Delete Note")).toBeTruthy();

    fireEvent.press(screen.getByText("Delete"));
    const buttons = alertSpy.mock.calls.at(-1)?.[2];
    await act(async () => buttons?.[1].onPress?.());

    const update = mockSet.mock.calls.at(-1)?.[0];
    expect(update.deletedAt).toBe(update.updatedAt);
    expect(mockShowSuccessToast).toHaveBeenCalledWith(
      "Note deleted",
      "The note remains stored locally.",
    );
    expect(mockRouter.back).toHaveBeenCalled();
  });

  /** Verifies that dirty edit navigation requires explicit discard confirmation. */
  it("blocks dirty navigation until the user confirms discarding edits", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    renderWithTheme(<EditNoteScreen />);
    await screen.findByDisplayValue("Reviewed recovery.");
    fireEvent.changeText(screen.getByLabelText("Note"), "Unsaved edit");
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

  /** Verifies that a failed update preserves the current edits for retry. */
  it("retains edits and stays open when an update fails", async () => {
    mockReturning.mockRejectedValueOnce(new Error("database unavailable"));
    renderWithTheme(<EditNoteScreen />);
    await screen.findByDisplayValue("Reviewed recovery.");
    fireEvent.changeText(screen.getByLabelText("Note"), "Keep this edit");

    fireEvent.press(screen.getByText("Save note"));

    await waitFor(() => expect(mockShowErrorToast).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText("Note").props.value).toBe("Keep this edit");
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  /** Verifies that failed archival preserves unsaved edits and the current screen. */
  it("retains edits and stays open when archival fails", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    mockReturning.mockRejectedValueOnce(new Error("database unavailable"));
    renderWithTheme(<EditNoteScreen />);
    await screen.findByDisplayValue("Reviewed recovery.");
    fireEvent.changeText(screen.getByLabelText("Note"), "Unsaved edit");
    fireEvent.press(screen.getByText("Delete"));
    const buttons = alertSpy.mock.calls.at(-1)?.[2];

    await act(async () => buttons?.[1].onPress?.());

    await waitFor(() => expect(mockShowErrorToast).toHaveBeenCalledTimes(1));
    expect(screen.getByLabelText("Note").props.value).toBe("Unsaved edit");
    expect(mockRouter.back).not.toHaveBeenCalled();
  });
});
