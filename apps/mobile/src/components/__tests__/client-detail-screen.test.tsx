import React from "react";

import ClientDetailScreen from "../../../app/(app)/clients/[id]";
import type { ClientRecord } from "@/lib/client-detail";
import { act, fireEvent, renderWithTheme, screen, waitFor } from "@/test-utils";

jest.mock("react-native-reanimated", () => ({
  __esModule: true,
  default: {
    createAnimatedComponent: (Component: React.ComponentType) => Component,
  },
}));

jest.mock("@gorhom/bottom-sheet", () => {
  const bottomSheetMock = jest.requireActual("@gorhom/bottom-sheet/mock");

  class MockBottomSheet extends bottomSheetMock.default {
    close() {
      this.props.onClose?.();
    }
  }

  return {
    __esModule: true,
    ...bottomSheetMock,
    default: MockBottomSheet,
  };
});

let mockRouteId: string | string[] | undefined = "1";
jest.mock("expo-router", () => {
  const ReactForMock = jest.requireActual<typeof import("react")>("react");
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
    router: { back: jest.fn() },
    useFocusEffect: jest.fn((callback: () => void | (() => void)) => {
      ReactForMock.useEffect(callback, [callback]);
    }),
    useLocalSearchParams: () => ({ id: mockRouteId }),
    useNavigation: () => navigation,
  };
});

jest.mock("@/db", () => {
  const limit = jest.fn();
  const where = jest.fn(() => ({ limit }));
  const from = jest.fn(() => ({ where }));
  const db = { select: jest.fn(() => ({ from })) };
  return { __esModule: true, db, from, getDb: () => db, limit, where };
});

const mockExpoRouter = jest.requireMock("expo-router");
const mockUseFocusEffect = mockExpoRouter.useFocusEffect as jest.Mock;
const mockDatabaseModule = jest.requireMock("@/db");
const mockDb = mockDatabaseModule.db as { select: jest.Mock };
const mockFrom = mockDatabaseModule.from as jest.Mock;
const mockLimit = mockDatabaseModule.limit as jest.Mock;
const mockWhere = mockDatabaseModule.where as jest.Mock;

function makeClient(overrides: Partial<ClientRecord> = {}): ClientRecord {
  return {
    id: 1,
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
    ...overrides,
  };
}

describe("ClientDetailScreen data lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteId = "1";
    mockLimit.mockResolvedValue([makeClient()]);
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockDb.select.mockReturnValue({ from: mockFrom });
  });

  it("does not query malformed record IDs", async () => {
    mockRouteId = "not-an-id";
    renderWithTheme(<ClientDetailScreen />);

    expect(await screen.findByText("Invalid client")).toBeTruthy();
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it("shows a missing state when no non-deleted client matches", async () => {
    mockLimit.mockResolvedValueOnce([]);
    renderWithTheme(<ClientDetailScreen />);

    expect(await screen.findByText("Client not found")).toBeTruthy();
    expect(mockWhere).toHaveBeenCalledTimes(1);
    expect(mockLimit).toHaveBeenCalledWith(1);
  });

  it("keeps the sheet open after a query failure and retries in place", async () => {
    mockLimit
      .mockRejectedValueOnce(new Error("database unavailable"))
      .mockResolvedValueOnce([makeClient()]);
    renderWithTheme(<ClientDetailScreen />);

    expect(await screen.findByText("Couldn’t load client")).toBeTruthy();
    fireEvent.press(screen.getByText("Retry"));

    expect(await screen.findByText("Eleanor Rigby")).toBeTruthy();
    expect(mockLimit).toHaveBeenCalledTimes(2);
  });

  it("reloads fresh client data whenever the detail route regains focus", async () => {
    mockLimit
      .mockResolvedValueOnce([makeClient()])
      .mockResolvedValueOnce([makeClient({ preferredName: "Ellie" })]);
    renderWithTheme(<ClientDetailScreen />);
    expect(await screen.findByText("Eleanor Rigby")).toBeTruthy();

    const latestFocusCallback = mockUseFocusEffect.mock.calls.at(-1)?.[0];
    await act(async () => {
      await latestFocusCallback?.();
    });

    await waitFor(() => expect(mockLimit).toHaveBeenCalledTimes(2));
    fireEvent(screen.getByTestId("client-detail-pager"), "layout", {
      nativeEvent: {
        layout: { width: 320, height: 600, x: 0, y: 0 },
      },
    });
    expect(await screen.findByText("Ellie")).toBeTruthy();
  });
});
