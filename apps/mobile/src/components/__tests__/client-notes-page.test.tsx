import React from "react";

import { ClientNotesPage } from "@/components/ClientNotesPage";
import type { NoteRecord } from "@/db/schema";
import { fireEvent, renderWithTheme, screen, waitFor } from "@/test-utils";

jest.mock("@gorhom/bottom-sheet", () =>
  jest.requireActual("@gorhom/bottom-sheet/mock"),
);

jest.mock("expo-router", () => {
  const ReactForMock = jest.requireActual<typeof import("react")>("react");
  return {
    __esModule: true,
    router: { push: jest.fn() },
    useFocusEffect: jest.fn((callback: () => void | (() => void)) => {
      ReactForMock.useEffect(callback, [callback]);
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
const mockDatabase = jest.requireMock("@/db");
const mockOrderBy = mockDatabase.orderBy as jest.Mock;

/** Builds a valid note row while allowing tests to vary relevant fields. */
function makeNote(overrides: Partial<NoteRecord> = {}): NoteRecord {
  return {
    id: 8,
    clientId: 3,
    title: "Home visit",
    content: "Reviewed recovery and feeding plan.",
    createdAt: "2026-09-16T20:00:00.000Z",
    updatedAt: "2026-09-16T20:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

describe("ClientNotesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOrderBy.mockResolvedValue([]);
  });

  /** Verifies empty-state rendering and navigation to client-scoped creation. */
  it("shows an empty state and opens the client-scoped create route", async () => {
    renderWithTheme(<ClientNotesPage active clientId={3} width={320} />);

    expect(await screen.findByText("No notes yet")).toBeTruthy();
    fireEvent.press(screen.getByText("New note"));

    expect(mockRouter.push).toHaveBeenCalledWith("/clients/3/notes/new");
  });

  /** Verifies persisted note previews and navigation to the selected note. */
  it("renders persisted notes and opens the selected note", async () => {
    mockOrderBy.mockResolvedValue([makeNote()]);
    renderWithTheme(<ClientNotesPage active clientId={3} width={320} />);

    expect(await screen.findByText("Home visit")).toBeTruthy();
    expect(
      screen.getByText("Reviewed recovery and feeding plan."),
    ).toBeTruthy();
    expect(
      screen.getByText("Reviewed recovery and feeding plan.").props
        .numberOfLines,
    ).toBe(8);
    fireEvent.press(screen.getByLabelText("Open Home visit"));

    expect(mockRouter.push).toHaveBeenCalledWith("/clients/3/notes/8");
  });

  /** Verifies that a failed load can be retried without leaving the page. */
  it("keeps failures recoverable with an in-place retry", async () => {
    mockOrderBy
      .mockRejectedValueOnce(new Error("database unavailable"))
      .mockResolvedValueOnce([]);
    renderWithTheme(<ClientNotesPage active clientId={3} width={320} />);

    expect(await screen.findByRole("button", { name: "Retry" })).toBeTruthy();
    fireEvent.press(screen.getByText("Retry"));

    await waitFor(() => expect(mockOrderBy).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("No notes yet")).toBeTruthy();
  });
});
