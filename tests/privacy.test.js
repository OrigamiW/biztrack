import { describe, it, expect, beforeEach, vi } from "vitest";

describe("privacy.js", () => {
    beforeEach(async () => {
        localStorage.clear();
        vi.resetModules();

        document.body.innerHTML = "";

        await import("../privacy.js?cacheBust=" + Date.now());
    });

    it("should show cookie banner when consent does not exist", () => {
        document.dispatchEvent(new Event("DOMContentLoaded"));

        const banner = document.getElementById("cookie-banner");
        const button = document.getElementById("accept-cookies");

        expect(banner).not.toBeNull();
        expect(button).not.toBeNull();
        expect(banner.textContent).toContain("BizTrack uses localStorage");
        expect(banner.textContent).toContain("Privacy Policy");
    });

    it("should save consent and hide banner when Accept button is clicked", () => {
        document.dispatchEvent(new Event("DOMContentLoaded"));

        const banner = document.getElementById("cookie-banner");
        const button = document.getElementById("accept-cookies");

        button.click();

        expect(localStorage.getItem("bizTrackCookieConsent")).toBe("accepted");
        expect(banner.style.display).toBe("none");
    });

    it("should not show cookie banner when consent already exists", () => {
        localStorage.setItem("bizTrackCookieConsent", "accepted");

        document.dispatchEvent(new Event("DOMContentLoaded"));

        const banner = document.getElementById("cookie-banner");

        expect(banner).toBeNull();
    });
});