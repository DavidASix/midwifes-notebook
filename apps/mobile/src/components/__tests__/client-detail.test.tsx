import React from "react";

import {
  ClientDetailContent,
  getClientDetailTabAfterSwipe,
  getClientDetailTabForOffset,
  parseClientId,
} from "@/components/ClientDetailContent";
import { missingClientValue, type ClientRecord } from "@/lib/client-detail";
import { fireEvent, renderWithTheme, screen } from "@/test-utils";

jest.mock("@gorhom/bottom-sheet", () =>
  jest.requireActual("@gorhom/bottom-sheet/mock"),
);

function makeClient(overrides: Partial<ClientRecord> = {}): ClientRecord {
  return {
    id: 1,
    firstName: "Eleanor",
    lastName: "Rigby",
    middleName: "Marie",
    preferredName: "Ellie",
    address: "123 Penny Lane, Liverpool",
    primaryPhone: "519 000 0000",
    dateOfBirth: "1990-06-18",
    age: null,
    estimatedDeliveryDate: "2026-10-12",
    actualDeliveryDate: null,
    gravida: 2,
    parity: 1,
    bloodType: "A+",
    rhStatus: "+",
    gbsStatus: "-",
    deliveryMethod: null,
    tearDegree: null,
    riskFactors: "Previous postpartum hemorrhage",
    partnerName: "Paul McCartney",
    partnerRelationship: "Partner",
    partnerPhone: "+44 151 709 3000",
    partnerBloodType: "O+",
    isActive: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    deletedAt: null,
    ...overrides,
  };
}

function renderMeasuredDetail(client = makeClient()) {
  renderWithTheme(<ClientDetailContent client={client} />);
  fireEvent(screen.getByTestId("client-detail-pager"), "layout", {
    nativeEvent: {
      layout: { width: 320, height: 600, x: 0, y: 0 },
    },
  });
}

describe("ClientDetailContent", () => {
  it("renders all clinical groups and distinguishes negative results from missing values", () => {
    renderMeasuredDetail();

    expect(screen.getByText("Eleanor Marie Rigby")).toBeTruthy();
    expect(screen.getByText("Ellie")).toBeTruthy();
    expect(screen.getByText("Positive")).toBeTruthy();
    expect(screen.getByText("Negative")).toBeTruthy();
    expect(screen.getByText("G2 P1")).toBeTruthy();
    expect(screen.getByText("Previous postpartum hemorrhage")).toBeTruthy();
    expect(screen.getByText("Prenatal")).toBeTruthy();
    expect(screen.getAllByText(missingClientValue).length).toBeGreaterThan(0);
  });

  it("uses Not recorded throughout a sparse client instead of dash sentinels", () => {
    renderMeasuredDetail(
      makeClient({
        middleName: null,
        preferredName: null,
        address: null,
        primaryPhone: null,
        dateOfBirth: null,
        age: null,
        estimatedDeliveryDate: null,
        gravida: null,
        parity: null,
        bloodType: null,
        rhStatus: null,
        gbsStatus: null,
        riskFactors: null,
        partnerName: null,
        partnerRelationship: null,
        partnerPhone: null,
        partnerBloodType: null,
      }),
    );

    expect(screen.getAllByText(missingClientValue).length).toBeGreaterThan(10);
    expect(screen.queryByText("-")).toBeNull();
  });

  it("keeps tab selection synchronized for taps and completed swipes", () => {
    renderMeasuredDetail();
    const clientTab = screen.getByRole("tab", { name: "Client" });
    const babiesTab = screen.getByRole("tab", { name: "Babies" });
    const notesTab = screen.getByRole("tab", { name: "Notes" });

    expect(clientTab.props.accessibilityState.selected).toBe(true);
    fireEvent.press(babiesTab);
    expect(babiesTab.props.accessibilityState.selected).toBe(true);

    fireEvent(screen.getByTestId("client-detail-pages"), "momentumScrollEnd", {
      nativeEvent: { contentOffset: { x: 640, y: 0 } },
    });
    expect(notesTab.props.accessibilityState.selected).toBe(true);
    expect(screen.getAllByText("Babies").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Notes").length).toBeGreaterThan(1);
  });
});

describe("client detail navigation decisions", () => {
  it("rejects malformed route IDs before they can reach the database", () => {
    expect(parseClientId(undefined)).toBeNull();
    expect(parseClientId(["1", "2"])).toBeNull();
    expect(parseClientId("0")).toBeNull();
    expect(parseClientId("-1")).toBeNull();
    expect(parseClientId("1.5")).toBeNull();
    expect(parseClientId("12x")).toBeNull();
    expect(parseClientId("9007199254740992")).toBeNull();
    expect(parseClientId("42")).toBe(42);
  });

  it("maps pager offsets to the closest bounded tab", () => {
    expect(getClientDetailTabForOffset(-100, 320)).toBe("client");
    expect(getClientDetailTabForOffset(170, 320)).toBe("babies");
    expect(getClientDetailTabForOffset(640, 320)).toBe("notes");
    expect(getClientDetailTabForOffset(2_000, 320)).toBe("notes");
    expect(getClientDetailTabForOffset(640, 0)).toBe("client");
  });

  it("moves one bounded page for deliberate swipes without stealing small drags", () => {
    expect(getClientDetailTabAfterSwipe("client", -90, 0.1, 320)).toBe(
      "babies",
    );
    expect(getClientDetailTabAfterSwipe("babies", -20, -0.5, 320)).toBe(
      "notes",
    );
    expect(getClientDetailTabAfterSwipe("notes", -100, -1, 320)).toBe("notes");
    expect(getClientDetailTabAfterSwipe("babies", 90, 0.1, 320)).toBe("client");
    expect(getClientDetailTabAfterSwipe("babies", 20, 0.1, 320)).toBe("babies");
    expect(getClientDetailTabAfterSwipe("babies", 90, 1, 0)).toBe("babies");
  });
});
