import { describe, it, expect, beforeEach, vi } from "vitest";

describe("help.js sidebar functions", () => {
    beforeEach(async () => {
        vi.resetModules();

        document.body.innerHTML = `
            <button class="sidebar-toggle" aria-expanded="false">Open</button>
            <div id="sidebar" style="display: none;">
                <button class="sidebar-close">Close</button>
            </div>
        `;

        await import("../help.js?cacheBust=" + Date.now());
    });

    it("openSidebar should open the sidebar when it is hidden", () => {
        window.openSidebar();

        expect(document.getElementById("sidebar").style.display).toBe("block");
        expect(document.querySelector(".sidebar-toggle").getAttribute("aria-expanded")).toBe("true");
    });

    it("openSidebar should close the sidebar when it is already open", () => {
        document.getElementById("sidebar").style.display = "block";

        window.openSidebar();

        expect(document.getElementById("sidebar").style.display).toBe("none");
        expect(document.querySelector(".sidebar-toggle").getAttribute("aria-expanded")).toBe("false");
    });

    it("closeSidebar should hide the sidebar", () => {
        document.getElementById("sidebar").style.display = "block";

        window.closeSidebar();

        expect(document.getElementById("sidebar").style.display).toBe("none");
        expect(document.querySelector(".sidebar-toggle").getAttribute("aria-expanded")).toBe("false");
    });

    it("openSidebar should focus the close button when opened", () => {
        window.openSidebar();

        expect(document.activeElement).toBe(document.querySelector(".sidebar-close"));
    });

    it("closeSidebar should focus the toggle button", () => {
        window.closeSidebar();

        expect(document.activeElement).toBe(document.querySelector(".sidebar-toggle"));
    });
});
