import { describe, it, expect, beforeEach, vi } from "vitest";

describe("i18n.js", () => {
    beforeEach(async () => {
        localStorage.clear();
        vi.restoreAllMocks();
        vi.resetModules();

        document.body.innerHTML = `
            <h1 data-i18n="dashboard"></h1>
            <input id="searchInput" data-i18n-placeholder="search" />
            <button id="test-title" data-i18n-title="addProduct"></button>
            <option id="test-label" data-i18n-label="chooseCategory"></option>
            <button id="language-toggle"></button>
        `;

        window.i18next = {
            language: "en",
            isInitialized: true,
            t: vi.fn((key) => {
                const translations = {
                    dashboard: "Dashboard",
                    search: "Search",
                    addProduct: "Add Product",
                    chooseCategory: "Choose a category",
                    switchLanguage: "中文"
                };

                return translations[key] || key;
            }),
            init: vi.fn((options, callback) => {
                window.i18next.language = options.lng;
                callback();
            }),
            changeLanguage: vi.fn((language, callback) => {
                window.i18next.language = language;
                callback();
            })
        };

        global.i18next = window.i18next;

        await import("../i18n.js?cacheBust=" + Date.now());
    });

    it("applyTranslations should translate data-i18n elements", () => {
        window.applyTranslations();

        expect(document.querySelector("[data-i18n='dashboard']").innerHTML).toBe("Dashboard");
    });

    it("applyTranslations should translate placeholder attributes", () => {
        window.applyTranslations();

        expect(document.getElementById("searchInput").getAttribute("placeholder")).toBe("Search");
    });

    it("applyTranslations should translate title attributes", () => {
        window.applyTranslations();

        expect(document.getElementById("test-title").getAttribute("title")).toBe("Add Product");
    });

    it("applyTranslations should translate label attributes", () => {
        window.applyTranslations();

        expect(document.getElementById("test-label").getAttribute("label")).toBe("Choose a category");
    });

    it("applyTranslations should update language toggle button", () => {
        window.applyTranslations();

        expect(document.getElementById("language-toggle").textContent).toBe("中文");
    });

    it("toggleLanguage should switch from English to Chinese", () => {
        window.toggleLanguage();

        expect(window.i18next.changeLanguage).toHaveBeenCalledWith("zh", expect.any(Function));
        expect(localStorage.getItem("bizTrackLanguage")).toBe("zh");
    });

    it("toggleLanguage should switch from Chinese to English", () => {
        window.i18next.language = "zh";

        window.toggleLanguage();

        expect(window.i18next.changeLanguage).toHaveBeenCalledWith("en", expect.any(Function));
        expect(localStorage.getItem("bizTrackLanguage")).toBe("en");
    });

    it("DOMContentLoaded should initialize i18next with default English language", () => {
        document.dispatchEvent(new Event("DOMContentLoaded"));

        expect(window.i18next.init).toHaveBeenCalledWith(
            expect.objectContaining({
                lng: "en",
                fallbackLng: "en"
            }),
            expect.any(Function)
        );
    });

    it("DOMContentLoaded should initialize i18next with saved language", async () => {
        vi.resetModules();

        localStorage.setItem("bizTrackLanguage", "zh");

        document.body.innerHTML = `
            <h1 data-i18n="dashboard"></h1>
            <input id="searchInput" data-i18n-placeholder="search" />
            <button id="test-title" data-i18n-title="addProduct"></button>
            <option id="test-label" data-i18n-label="chooseCategory"></option>
            <button id="language-toggle"></button>
        `;

        window.i18next = {
            language: "en",
            isInitialized: true,
            t: vi.fn((key) => {
                const translations = {
                    dashboard: "Dashboard",
                    search: "Search",
                    addProduct: "Add Product",
                    chooseCategory: "Choose a category",
                    switchLanguage: "中文"
                };

                return translations[key] || key;
            }),
            init: vi.fn((options, callback) => {
                window.i18next.language = options.lng;
                callback();
            }),
            changeLanguage: vi.fn((language, callback) => {
                window.i18next.language = language;
                callback();
            })
        };

        global.i18next = window.i18next;

        await import("../i18n.js?savedLanguageTest=" + Date.now());

        document.dispatchEvent(new Event("DOMContentLoaded"));

        expect(window.i18next.init).toHaveBeenCalledWith(
            expect.objectContaining({
                lng: "zh",
                fallbackLng: "en"
            }),
            expect.any(Function)
        );
    });

    it("DOMContentLoaded should dispatch i18nReady event", () => {
        const i18nReadyMock = vi.fn();

        document.addEventListener("i18nReady", i18nReadyMock);

        document.dispatchEvent(new Event("DOMContentLoaded"));

        expect(i18nReadyMock).toHaveBeenCalled();
    });

    it("resources should contain English and Chinese translations", () => {
        document.dispatchEvent(new Event("DOMContentLoaded"));

        const initOptions = window.i18next.init.mock.calls[0][0];

        expect(initOptions.resources.en.translation.dashboard).toBe("Dashboard");
        expect(initOptions.resources.zh.translation.dashboard).toBe("仪表盘");
        expect(initOptions.resources.en.translation.switchLanguage).toBe("中文");
        expect(initOptions.resources.zh.translation.switchLanguage).toBe("English");
    });
});