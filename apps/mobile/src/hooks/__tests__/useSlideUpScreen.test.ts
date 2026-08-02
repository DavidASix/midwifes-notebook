import { Alert } from "react-native";
import { act, renderHook } from "@testing-library/react-native";

import { useSlideUpScreen } from "@/hooks/useSlideUpScreen";

type BeforeRemoveEvent = {
  data: { action: { type: string } };
  preventDefault: jest.Mock;
};

const mockNavigation = {
  addListener: jest.fn(
    (_eventName: string, _listener: (event: BeforeRemoveEvent) => void) =>
      jest.fn(),
  ),
  dispatch: jest.fn(),
};

jest.mock("expo-router", () => ({
  router: { back: jest.fn() },
  useNavigation: () => mockNavigation,
}));

const mockRouterBack = jest.requireMock("expo-router").router.back as jest.Mock;

function getBeforeRemoveListener() {
  const listener = mockNavigation.addListener.mock.calls.at(-1)?.[1];
  if (!listener) throw new Error("beforeRemove listener was not registered");
  return listener;
}

function attachSheet(controller: ReturnType<typeof useSlideUpScreen>) {
  const sheet = {
    close: jest.fn(),
    snapToIndex: jest.fn(),
  };
  controller.sheetRef.current = sheet as never;
  return sheet;
}

function renderDirtySheet() {
  return renderHook(() =>
    useSlideUpScreen({
      shouldConfirmDismiss: true,
      confirmation: {
        title: "Discard changes?",
        message: "Changes have not been saved.",
      },
    }),
  );
}

describe("useSlideUpScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not ask twice when an approved dirty dismissal pops the route", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    const { result } = renderDirtySheet();
    const sheet = attachSheet(result.current);

    act(() => result.current.requestDismiss());
    const buttons = alertSpy.mock.calls[0][2];
    act(() => buttons?.[1].onPress?.());

    expect(sheet.close).toHaveBeenCalledTimes(1);
    act(() => result.current.onClose());
    expect(mockRouterBack).toHaveBeenCalledTimes(1);

    const routePop = {
      data: { action: { type: "GO_BACK" } },
      preventDefault: jest.fn(),
    };
    act(() => getBeforeRemoveListener()(routePop));

    expect(routePop.preventDefault).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it("closes before replaying a guarded navigation action", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    const { result } = renderDirtySheet();
    const sheet = attachSheet(result.current);
    const action = { type: "GO_BACK" };
    const event = { data: { action }, preventDefault: jest.fn() };

    act(() => getBeforeRemoveListener()(event));

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(mockNavigation.dispatch).not.toHaveBeenCalled();
    const buttons = alertSpy.mock.calls[0][2];
    act(() => buttons?.[1].onPress?.());
    expect(sheet.close).toHaveBeenCalledTimes(1);
    expect(mockNavigation.dispatch).not.toHaveBeenCalled();

    act(() => result.current.onClose());
    expect(mockNavigation.dispatch).toHaveBeenCalledWith(action);
    expect(mockRouterBack).not.toHaveBeenCalled();
  });

  it("restores a dirty sheet and opens only one prompt during repeated closing animations", () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation();
    const { result } = renderDirtySheet();
    const sheet = attachSheet(result.current);

    act(() => {
      result.current.onAnimate(0, -1, 100, 0);
      result.current.onAnimate(0, -1, 100, 0);
    });

    expect(sheet.snapToIndex).toHaveBeenCalledTimes(2);
    expect(sheet.snapToIndex).toHaveBeenCalledWith(0);
    expect(alertSpy).toHaveBeenCalledTimes(1);
  });

  it("animates an unguarded navigation dismissal before dispatching it", () => {
    const { result } = renderHook(() => useSlideUpScreen());
    const sheet = attachSheet(result.current);
    const action = { type: "GO_BACK" };
    const event = { data: { action }, preventDefault: jest.fn() };

    act(() => getBeforeRemoveListener()(event));

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(sheet.close).toHaveBeenCalledTimes(1);
    expect(mockNavigation.dispatch).not.toHaveBeenCalled();

    act(() => result.current.onClose());
    expect(mockNavigation.dispatch).toHaveBeenCalledWith(action);
  });
});
