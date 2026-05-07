import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "../../src/components/ConfirmDialog.jsx";
import { useDialogStore, dialogs } from "../../src/store/dialogs.js";

describe("ConfirmDialog", () => {
  beforeEach(() => {
    useDialogStore.setState({ current: null });
  });
  afterEach(() => cleanup());

  it("renders nothing when no dialog is open", () => {
    const { container } = render(<ConfirmDialog />);
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });

  it("renders the dialog when confirm() is called", async () => {
    render(<ConfirmDialog />);
    dialogs.confirm({ title: "Delete?", message: "Cannot be undone." });
    const dlg = await screen.findByRole("dialog");
    expect(dlg).toBeTruthy();
    expect(await screen.findByText("Delete?")).toBeTruthy();
    expect(await screen.findByText("Cannot be undone.")).toBeTruthy();
  });

  it("resolves true when the confirm button is clicked", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog />);
    const promise = dialogs.confirm({
      title: "OK?",
      confirmLabel: "Yes",
      cancelLabel: "No",
    });
    const yesBtn = await screen.findByRole("button", { name: "Yes" });
    await user.click(yesBtn);
    await expect(promise).resolves.toBe(true);
  });

  it("resolves false when cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog />);
    const promise = dialogs.confirm({ title: "OK?" });
    const cancel = await screen.findByRole("button", { name: /Cancel/ });
    await user.click(cancel);
    await expect(promise).resolves.toBe(false);
  });

  it("prompt() returns the typed value on confirm", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog />);
    const promise = dialogs.prompt({
      title: "Name?",
      defaultValue: "",
      confirmLabel: "Save",
    });
    const input = await screen.findByRole("textbox");
    await user.type(input, "hello");
    const save = await screen.findByRole("button", { name: "Save" });
    await user.click(save);
    await expect(promise).resolves.toBe("hello");
  });

  it("prompt() returns null on cancel", async () => {
    const user = userEvent.setup();
    render(<ConfirmDialog />);
    const promise = dialogs.prompt({ title: "Name?", defaultValue: "x" });
    const cancel = await screen.findByRole("button", { name: /Cancel/ });
    await user.click(cancel);
    await expect(promise).resolves.toBeNull();
  });

  it("disables confirm when prompt input is empty", async () => {
    render(<ConfirmDialog />);
    dialogs.prompt({ title: "Name?", defaultValue: "" });
    const save = await screen.findByRole("button", { name: /Save/ });
    expect(save.hasAttribute("disabled")).toBe(true);
  });
});
