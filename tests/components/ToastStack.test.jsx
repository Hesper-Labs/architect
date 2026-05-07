import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastStack } from "../../src/components/ToastStack.jsx";
import { useToastStore, toast } from "../../src/store/toasts.js";

describe("ToastStack", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });
  afterEach(() => cleanup());

  it("renders nothing when there are no toasts", () => {
    const { container } = render(<ToastStack />);
    expect(container.querySelector("[role='region']")).toBeNull();
  });

  it("renders multiple toasts in a stacked region", async () => {
    render(<ToastStack />);
    toast.success("Saved");
    toast.error("Oops");
    toast.warning("Heads up");
    const region = await screen.findByRole("region", { name: /Notifications/i });
    expect(region).toBeTruthy();
    expect(screen.getByText("Saved")).toBeTruthy();
    expect(screen.getByText("Oops")).toBeTruthy();
    expect(screen.getByText("Heads up")).toBeTruthy();
  });

  it("dismisses a toast when its close button is clicked", async () => {
    const user = userEvent.setup();
    render(<ToastStack />);
    toast.info("Hello", { duration: 0 });
    const dismiss = await screen.findByRole("button", { name: "Dismiss" });
    await user.click(dismiss);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });
});
