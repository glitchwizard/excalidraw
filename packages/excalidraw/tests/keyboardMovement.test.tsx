import { vi } from "vitest";

import { KEYS } from "@excalidraw/common";
import * as Elements from "@excalidraw/element";

import { Excalidraw } from "../index";

import { API } from "./helpers/api";
import { Keyboard } from "./helpers/ui";
import { render } from "./test-utils";

describe("keyboard movement bindings", () => {
  it.each(["input", "textarea", "select", "button"] as const)(
    "does not recompute arrow bindings when navigating a %s",
    async (tagName) => {
      const { container } = await render(
        <Excalidraw handleKeyboardGlobally={true} />,
      );
      const arrow = API.createElement({
        type: "arrow",
        width: 100,
        height: 100,
      });
      API.setElements([arrow]);
      API.setSelectedElements([arrow]);

      const target = container.ownerDocument.createElement(tagName);
      container.appendChild(target);
      // Menu buttons handle keydown locally, but keyup still reaches the app.
      if (tagName === "button") {
        target.addEventListener("keydown", (event) => event.stopPropagation());
      }
      const bind = vi.spyOn(Elements, "bindOrUnbindBindingElements");
      bind.mockClear();

      try {
        Keyboard.keyPress(KEYS.ARROW_DOWN, target);
        expect(bind).not.toHaveBeenCalled();
        expect(API.getElement(arrow)).toMatchObject({ x: 0, y: 0 });
      } finally {
        bind.mockRestore();
        target.remove();
      }
    },
  );

  it("finalizes bindings once after canvas arrow-key movement", async () => {
    await render(<Excalidraw handleKeyboardGlobally={true} />);
    const arrow = API.createElement({ type: "arrow", width: 100, height: 100 });
    API.setElements([arrow]);
    API.setSelectedElements([arrow]);
    const bind = vi.spyOn(Elements, "bindOrUnbindBindingElements");
    bind.mockClear();

    try {
      Keyboard.keyPress(KEYS.ARROW_DOWN);
      expect(API.getElement(arrow)).toMatchObject({ x: 0, y: 1 });
      expect(bind).toHaveBeenCalledTimes(1);

      Keyboard.keyUp(KEYS.ARROW_DOWN);
      expect(bind).toHaveBeenCalledTimes(1);
    } finally {
      bind.mockRestore();
    }
  });
});
