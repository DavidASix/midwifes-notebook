import React from "react";
import { Alert } from "react-native";

import { act, fireEvent, renderWithTheme, screen, waitFor } from "@/test-utils";

import ClientsScreen from "../../../app/(app)/(tabs)/clients";
import NewClientScreen from "../../../app/(app)/clients/new";

jest.mock("react-native-keyboard-controller", () =>
  jest.requireActual("react-native-keyboard-controller/jest"),
);
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

jest.mock("expo-router", () => {
  const ReactForMock = jest.requireActual<typeof import("react")>("react");
  function MockStack() {
    return null;
  }
  const navigation = {
    addListener: jest.fn(() => jest.fn()),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
  };
  MockStack.Screen = jest.fn(() => null);
  return {
    __esModule: true,
    router: {
      back: jest.fn(),
      push: jest.fn(),
    },
    Stack: MockStack,
    navigation,
    useNavigation: () => navigation,
    useFocusEffect: jest.fn((callback: () => void) => {
      ReactForMock.useEffect(callback, [callback]);
    }),
  };
});

jest.mock("@react-native-community/datetimepicker", () => ({
  __esModule: true,
  default: function MockDateTimePicker() {
    return null;
  },
}));

jest.mock("@/db", () => {
  const values = jest.fn();
  const from = jest.fn();
  const db = {
    insert: jest.fn(() => ({ values })),
    select: jest.fn(() => ({ from })),
  };
  return { __esModule: true, db, from, getDb: () => db, values };
});

jest.mock("@/lib/toast", () => ({
  showErrorToast: jest.fn(),
}));

const mockExpoRouter = jest.requireMock("expo-router");
const mockRouter = mockExpoRouter.router as {
  back: jest.Mock;
  push: jest.Mock;
};
const mockUseFocusEffect = mockExpoRouter.useFocusEffect as jest.Mock;
const mockDatabaseModule = jest.requireMock("@/db");
const mockDb = mockDatabaseModule.db as {
  insert: jest.Mock;
  select: jest.Mock;
};
const mockFrom = mockDatabaseModule.from as jest.Mock;
const mockValues = mockDatabaseModule.values as jest.Mock;
const mockShowErrorToast = jest.requireMock("@/lib/toast")
  .showErrorToast as jest.Mock;

function enterRequiredNames() {
  fireEvent.changeText(screen.getByLabelText("First name"), "  Zara ");
  fireEvent.changeText(screen.getByLabelText("Last name"), " Okafor  ");
}

describe("NewClientScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValues.mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: mockValues });
    mockFrom.mockResolvedValue([]);
    mockDb.select.mockReturnValue({ from: mockFrom });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("inserts a minimal client and dismisses only after persistence succeeds", async () => {
    renderWithTheme(<NewClientScreen />);
    enterRequiredNames();

    fireEvent.press(screen.getByText("Add client"));

    await waitFor(() =>
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: "Zara",
          lastName: "Okafor",
          bloodType: undefined,
          middleName: undefined,
        }),
      ),
    );
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalledTimes(1));
  });

  it("shows an app-wide toast and inline errors when required names are missing", () => {
    renderWithTheme(<NewClientScreen />);

    fireEvent.press(screen.getByText("Add client"));

    expect(mockShowErrorToast).toHaveBeenCalledWith(
      "Review highlighted fields",
      "Correct the highlighted fields and try again.",
    );
    expect(screen.getByText("First name is required.")).toBeTruthy();
    expect(screen.getByText("Last name is required.")).toBeTruthy();
    expect(mockValues).not.toHaveBeenCalled();
  });

  it("uses generic toast guidance for non-name validation errors", () => {
    renderWithTheme(<NewClientScreen />);
    enterRequiredNames();
    fireEvent.press(screen.getByLabelText("Expand Clinical section"));
    fireEvent.changeText(screen.getByLabelText("Gravida"), "1");
    fireEvent.changeText(screen.getByLabelText("Parity"), "2");

    fireEvent.press(screen.getByText("Add client"));

    expect(mockShowErrorToast).toHaveBeenCalledWith(
      "Review highlighted fields",
      "Correct the highlighted fields and try again.",
    );
    expect(
      screen.getByText("Parity cannot be greater than gravida."),
    ).toBeTruthy();
    expect(mockValues).not.toHaveBeenCalled();
  });

  it("disables native dismissal and confirms dirty navigation attempts", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    renderWithTheme(<NewClientScreen />);

    const screenOptions =
      mockExpoRouter.Stack.Screen.mock.calls.at(-1)[0].options;
    expect(screenOptions.gestureEnabled).toBe(false);

    fireEvent.changeText(screen.getByLabelText("First name"), "Zara");

    const beforeRemove = mockExpoRouter.navigation.addListener.mock.calls
      .filter(([eventName]: [string]) => eventName === "beforeRemove")
      .at(-1)[1];
    const action = { type: "GO_BACK" };
    const event = { data: { action }, preventDefault: jest.fn() };
    act(() => beforeRemove(event));

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledWith(
      "Discard this client?",
      "Your changes have not been saved.",
      expect.any(Array),
      expect.objectContaining({
        cancelable: true,
        onDismiss: expect.any(Function),
      }),
    );
    const buttons = alertSpy.mock.calls[0][2];
    act(() => buttons?.[1].onPress?.());
    expect(mockExpoRouter.navigation.dispatch).toHaveBeenCalledWith(action);
  });

  it("lets nullable clinical choices return to an unset value", async () => {
    renderWithTheme(<NewClientScreen />);
    enterRequiredNames();
    fireEvent.press(screen.getByLabelText("Expand Clinical section"));
    const oPositive = screen.getByLabelText("Blood type: O+");
    fireEvent.press(oPositive);
    fireEvent.press(oPositive);

    fireEvent.press(screen.getByText("Add client"));

    await waitFor(() => {
      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({ bloodType: undefined }),
      );
    });
  });

  it("keeps Identity open and reveals the combined Clinical section on demand", () => {
    renderWithTheme(<NewClientScreen />);

    expect(screen.getByLabelText("First name")).toBeTruthy();
    expect(screen.getByText("Clinical")).toBeTruthy();
    expect(screen.queryByText("Estimated delivery date")).toBeNull();
    expect(screen.queryByText("Blood type")).toBeNull();
    expect(screen.queryByText("Pregnancy & care")).toBeNull();

    fireEvent.press(screen.getByLabelText("Expand Clinical section"));

    expect(screen.getByText("Estimated delivery date")).toBeTruthy();
    expect(screen.getByText("Blood type")).toBeTruthy();
    expect(screen.getByLabelText("Collapse Clinical section")).toBeTruthy();
  });

  it("keeps Partner details collapsed until requested", () => {
    renderWithTheme(<NewClientScreen />);

    expect(screen.queryByLabelText("Partner phone number")).toBeNull();
    fireEvent.press(screen.getByLabelText("Expand Partner section"));
    expect(screen.getByLabelText("Partner phone number")).toBeTruthy();
  });

  it("retains entered data and stays open when the database rejects the insert", async () => {
    mockValues.mockRejectedValueOnce(new Error("database unavailable"));
    renderWithTheme(<NewClientScreen />);
    enterRequiredNames();

    fireEvent.press(screen.getByText("Add client"));

    await waitFor(() =>
      expect(mockShowErrorToast).toHaveBeenCalledWith(
        "Couldn't add client",
        "Your entries are still here. Please try again.",
      ),
    );
    expect(screen.getByLabelText("First name").props.value).toBe("  Zara ");
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it("prevents a second insert while submission is pending", async () => {
    let resolveInsert: (() => void) | undefined;
    mockValues.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveInsert = resolve;
        }),
    );
    renderWithTheme(<NewClientScreen />);
    enterRequiredNames();
    const addButton = screen.getByText("Add client");

    fireEvent.press(addButton);
    fireEvent.press(addButton);

    expect(mockValues).toHaveBeenCalledTimes(1);
    await act(async () => resolveInsert?.());
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalledTimes(1));
  });
});

describe("ClientsScreen focus refresh", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFrom.mockResolvedValue([]);
    mockDb.select.mockReturnValue({ from: mockFrom });
  });

  it("queries clients again whenever the list regains focus", async () => {
    renderWithTheme(<ClientsScreen />);
    await waitFor(() => expect(mockFrom).toHaveBeenCalledTimes(1));

    const latestFocusCallback = mockUseFocusEffect.mock.calls.at(-1)?.[0];
    act(() => latestFocusCallback?.());

    await waitFor(() => expect(mockFrom).toHaveBeenCalledTimes(2));
  });
});
