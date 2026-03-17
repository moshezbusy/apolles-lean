/** @vitest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { refreshMock, createAgentActionMock, setAgentStatusActionMock, toastSuccessMock, toastErrorMock } =
  vi.hoisted(() => ({
    refreshMock: vi.fn(),
    createAgentActionMock: vi.fn(),
    setAgentStatusActionMock: vi.fn(),
    toastSuccessMock: vi.fn(),
    toastErrorMock: vi.fn(),
  }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock("~/features/admin/agents/actions", () => ({
  createAgentAction: createAgentActionMock,
  setAgentStatusAction: setAgentStatusActionMock,
}));

vi.mock("sonner", () => ({
  Toaster: () => null,
  toast: {
    success: toastSuccessMock,
    error: toastErrorMock,
  },
}));

import { AgentManagementPanel } from "~/features/admin/agents/agent-management-panel";

(globalThis as typeof globalThis & { React?: typeof React }).React = React;

describe("AgentManagementPanel", () => {
  let container: HTMLDivElement;
  let root: Root;
  let scrollIntoViewMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;

    scrollIntoViewMock = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoViewMock,
    });

    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);

    await act(async () => {
      root.render(
        <AgentManagementPanel
          agents={[
            {
              id: "agent-1",
              name: "Agent One",
              email: "agent1@example.com",
              isActive: true,
              createdAt: new Date("2026-03-10T10:00:00Z"),
              lastLoginAt: null,
            },
          ]}
        />,
      );
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });

    container.remove();
  });

  function getButton(label: string): HTMLButtonElement {
    const buttons = Array.from(document.querySelectorAll("button"));
    const button = buttons.find((candidate) => candidate.textContent?.trim() === label);

    if (!button) {
      throw new Error(`Missing button: ${label}`);
    }

    return button as HTMLButtonElement;
  }

  function getInput(id: string): HTMLInputElement {
    const element = document.querySelector<HTMLInputElement>(`[id="${id}"]`);
    if (!element) {
      throw new Error(`Missing input: ${id}`);
    }

    return element;
  }

  async function click(element: HTMLElement) {
    await act(async () => {
      element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  }

  async function submitForm() {
    const form = document.querySelector("form");
    if (!form) {
      throw new Error("Missing form");
    }

    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
  }

  it("renders the Last login column and fallback state", () => {
    expect(container.textContent).toContain("Last login");
    expect(container.textContent).toContain("Never");
  });

  it("focuses and scrolls to the first invalid field on invalid submit", async () => {
    await click(getButton("Create Agent"));
    await submitForm();

    expect(document.activeElement).toBe(getInput("agent-name"));
    expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).toContain("Name is required");
    expect(document.body.textContent).toContain("Enter a valid email");
  });

  it("wires password hint and error text for assistive tech", async () => {
    await click(getButton("Create Agent"));
    await submitForm();

    const passwordInput = getInput("agent-password");

    expect(passwordInput.getAttribute("aria-describedby")).toBe(
      "agent-password-hint agent-password-error",
    );
  });

  it("submits the status toggle action for activate or deactivate", async () => {
    setAgentStatusActionMock.mockResolvedValue({
      success: true,
      data: {
        userId: "agent-1",
        isActive: false,
        message: "Agent deactivated",
      },
    });

    await click(getButton("Deactivate"));
    await Promise.resolve();

    expect(setAgentStatusActionMock).toHaveBeenCalledOnce();
    const formData = setAgentStatusActionMock.mock.calls[0]?.[0] as FormData;
    expect(formData.get("userId")).toBe("agent-1");
    expect(formData.get("isActive")).toBe("false");
  });
});
