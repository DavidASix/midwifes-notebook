import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text, Pressable } from "react-native";
import { LockProvider, useLock } from "@/lib/lock-context";

function TestConsumer() {
  const { isLocked, lock, unlock } = useLock();
  return (
    <>
      <Text>{isLocked ? "locked" : "unlocked"}</Text>
      <Pressable onPress={lock}>
        <Text>lock</Text>
      </Pressable>
      <Pressable onPress={unlock}>
        <Text>unlock</Text>
      </Pressable>
    </>
  );
}

function renderWithLock(initiallyLocked?: boolean) {
  return render(
    <LockProvider initiallyLocked={initiallyLocked}>
      <TestConsumer />
    </LockProvider>,
  );
}

describe("LockProvider", () => {
  it("starts locked when initiallyLocked is true (gate is closed on launch)", () => {
    renderWithLock(true);
    expect(screen.getByText("locked")).toBeTruthy();
  });

  it("starts unlocked when initiallyLocked is false", () => {
    renderWithLock(false);
    expect(screen.getByText("unlocked")).toBeTruthy();
  });

  it("starts unlocked by default (no prop required for unlocked state)", () => {
    renderWithLock();
    expect(screen.getByText("unlocked")).toBeTruthy();
  });

  it("lock() closes the gate from an unlocked state", () => {
    renderWithLock(false);
    fireEvent.press(screen.getByText("lock"));
    expect(screen.getByText("locked")).toBeTruthy();
  });

  it("unlock() opens the gate after authentication", () => {
    renderWithLock(true);
    fireEvent.press(screen.getByText("unlock"));
    expect(screen.getByText("unlocked")).toBeTruthy();
  });

  it("lock() is idempotent when already locked (re-locking cannot break state)", () => {
    renderWithLock(true);
    fireEvent.press(screen.getByText("lock"));
    expect(screen.getByText("locked")).toBeTruthy();
  });

  it("unlock() is idempotent when already unlocked", () => {
    renderWithLock(false);
    fireEvent.press(screen.getByText("unlock"));
    expect(screen.getByText("unlocked")).toBeTruthy();
  });

  it("lock() re-engages the gate after unlock (session can be locked again)", () => {
    renderWithLock(true);
    fireEvent.press(screen.getByText("unlock"));
    expect(screen.getByText("unlocked")).toBeTruthy();
    fireEvent.press(screen.getByText("lock"));
    expect(screen.getByText("locked")).toBeTruthy();
  });
});
