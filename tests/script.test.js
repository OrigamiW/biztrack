import { describe, it, expect, beforeEach, vi } from "vitest";

describe("script.js dashboard", () => {
    beforeEach(async () => {
        localStorage.clear();
        vi.restoreAllMocks();
        vi.resetModules();

        document.body.innerHTML = `
            <button class="sidebar-toggle" aria-expanded="false">Open</button>
            <div id="sidebar" style="display: none;">
                <button class="sidebar-close">Close</button>
            </div>

            <div id="rev-amount"></div>
            <div id="exp-amount"></div>
            <div id="balance"></div>
            <div id="num-orders"></div>

            <div id="bar-chart"></div>
            <div id="donut-chart"></div>
        `;

        window.i18next = {
            isInitialized: true,
            t: vi.fn((key) => key),
            on: vi.fn()
        };

        global.i18next = window.i18next;

        window.ApexCharts = vi.fn(function (element, options) {
            this.element = element;
            this.options = options;
            this.render = vi.fn();
            this.destroy = vi.fn();
        });

        global.ApexCharts = window.ApexCharts;

        await import("../script.js?cacheBust=" + Date.now());
    });

    it("openSidebar should open the sidebar", () => {
        window.openSidebar();

        expect(document.getElementById("sidebar").style.display).toBe("block");
        expect(document.querySelector(".sidebar-toggle").getAttribute("aria-expanded")).toBe("true");
    });

    it("closeSidebar should close the sidebar", () => {
        document.getElementById("sidebar").style.display = "block";

        window.closeSidebar();

        expect(document.getElementById("sidebar").style.display).toBe("none");
        expect(document.querySelector(".sidebar-toggle").getAttribute("aria-expanded")).toBe("false");
    });

    it("calculateExpTotal should calculate total expenses", () => {
        const total = window.calculateExpTotal([
            {
                trAmount: 100
            },
            {
                trAmount: 50.5
            }
        ]);

        expect(total).toBe(150.5);
    });

    it("calculateRevTotal should calculate total revenue", () => {
        const total = window.calculateRevTotal([
            {
                orderTotal: 200
            },
            {
                orderTotal: 75.25
            }
        ]);

        expect(total).toBe(275.25);
    });

    it("calculateCategorySales should calculate sales by product category", () => {
        const result = window.calculateCategorySales([
            {
                prodCat: "Hats",
                prodPrice: 10,
                prodSold: 2
            },
            {
                prodCat: "Hats",
                prodPrice: 5,
                prodSold: 3
            },
            {
                prodCat: "Drinkware",
                prodPrice: 20,
                prodSold: 1
            }
        ]);

        expect(result).toEqual({
            Hats: 35,
            Drinkware: 20
        });
    });

    it("loadDashboardData should show totals from localStorage", () => {
        localStorage.setItem("bizTrackTransactions", JSON.stringify([
            {
                trAmount: 100
            },
            {
                trAmount: 50
            }
        ]));

        localStorage.setItem("bizTrackOrders", JSON.stringify([
            {
                orderTotal: 300
            },
            {
                orderTotal: 100
            }
        ]));

        window.loadDashboardData();

        expect(document.getElementById("rev-amount").innerHTML).toContain("revenue");
        expect(document.getElementById("rev-amount").innerHTML).toContain("$400.00");

        expect(document.getElementById("exp-amount").innerHTML).toContain("expenses");
        expect(document.getElementById("exp-amount").innerHTML).toContain("$150.00");

        expect(document.getElementById("balance").innerHTML).toContain("balance");
        expect(document.getElementById("balance").innerHTML).toContain("$250.00");

        expect(document.getElementById("num-orders").innerHTML).toContain("orders");
        expect(document.getElementById("num-orders").innerHTML).toContain("2");
    });

    it("loadDashboardData should show zero totals when localStorage is empty", () => {
        window.loadDashboardData();

        expect(document.getElementById("rev-amount").innerHTML).toContain("$0.00");
        expect(document.getElementById("exp-amount").innerHTML).toContain("$0.00");
        expect(document.getElementById("balance").innerHTML).toContain("$0.00");
        expect(document.getElementById("num-orders").innerHTML).toContain("0");
    });

    it("translateProductCategory should translate known product categories", () => {
        expect(window.translateProductCategory("Hats")).toBe("hats");
        expect(window.translateProductCategory("Drinkware")).toBe("drinkware");
        expect(window.translateProductCategory("Home decor")).toBe("homeDecor");
        expect(window.translateProductCategory("Unknown")).toBe("Unknown");
    });

    it("translateExpenseCategory should translate known expense categories", () => {
        expect(window.translateExpenseCategory("Rent")).toBe("rent");
        expect(window.translateExpenseCategory("Utilities")).toBe("utilities");
        expect(window.translateExpenseCategory("Order Fulfillment")).toBe("orderFulfillment");
        expect(window.translateExpenseCategory("Unknown")).toBe("Unknown");
    });

    it("initializeChart should create bar and donut charts", () => {
        localStorage.setItem("bizTrackProducts", JSON.stringify([
            {
                prodCat: "Hats",
                prodPrice: 10,
                prodSold: 2
            },
            {
                prodCat: "Drinkware",
                prodPrice: 20,
                prodSold: 3
            }
        ]));

        localStorage.setItem("bizTrackTransactions", JSON.stringify([
            {
                trCategory: "Rent",
                trAmount: 100
            },
            {
                trCategory: "Utilities",
                trAmount: 50
            }
        ]));

        window.initializeChart();

        expect(window.ApexCharts).toHaveBeenCalledTimes(2);

        const barChartCall = window.ApexCharts.mock.calls[0];
        const donutChartCall = window.ApexCharts.mock.calls[1];

        expect(barChartCall[0]).toBe(document.querySelector("#bar-chart"));
        expect(barChartCall[1].chart.type).toBe("bar");
        expect(barChartCall[1].series[0].name).toBe("totalSales");
        expect(barChartCall[1].series[0].data).toEqual([60, 20]);

        expect(donutChartCall[0]).toBe(document.querySelector("#donut-chart"));
        expect(donutChartCall[1].chart.type).toBe("donut");
        expect(donutChartCall[1].series).toEqual([100, 50]);
    });

    it("initializeChart should work with empty localStorage data", () => {
        window.initializeChart();

        expect(window.ApexCharts).toHaveBeenCalledTimes(2);

        const barChartCall = window.ApexCharts.mock.calls[0];
        const donutChartCall = window.ApexCharts.mock.calls[1];

        expect(barChartCall[1].series[0].data).toEqual([]);
        expect(donutChartCall[1].series).toEqual([]);
    });

    it("window.onload should load dashboard data and register languageChanged event", () => {
        window.onload();

        expect(document.getElementById("rev-amount").innerHTML).toContain("$0.00");
        expect(window.i18next.on).toHaveBeenCalledWith("languageChanged", expect.any(Function));
    });

    it("languageChanged callback should reload dashboard data and initialize charts", () => {
        window.onload();

        const callback = window.i18next.on.mock.calls[0][1];

        localStorage.setItem("bizTrackTransactions", JSON.stringify([
            {
                trAmount: 10
            }
        ]));

        localStorage.setItem("bizTrackOrders", JSON.stringify([
            {
                orderTotal: 30
            }
        ]));

        callback();

        expect(document.getElementById("rev-amount").innerHTML).toContain("$30.00");
        expect(document.getElementById("exp-amount").innerHTML).toContain("$10.00");
        expect(window.ApexCharts).toHaveBeenCalled();
    });

    it("i18nReady event should load dashboard data and initialize charts", () => {
        window.ApexCharts.mockClear();

        document.dispatchEvent(new Event("i18nReady"));

        expect(document.getElementById("rev-amount").innerHTML).toContain("$0.00");

        const calls = window.ApexCharts.mock.calls;
        expect(calls.length).toBeGreaterThanOrEqual(2);

        expect(calls.at(-2)[1].chart.type).toBe("bar");
        expect(calls.at(-1)[1].chart.type).toBe("donut");
    });

    it("chart tooltip formatters should format values as money", () => {
        localStorage.setItem("bizTrackProducts", JSON.stringify([
            {
                prodCat: "Hats",
                prodPrice: 10,
                prodSold: 2
            }
        ]));

        localStorage.setItem("bizTrackTransactions", JSON.stringify([
            {
                trCategory: "Rent",
                trAmount: 100
            }
        ]));

        window.initializeChart();

        const barOptions = window.ApexCharts.mock.calls[0][1];
        const donutOptions = window.ApexCharts.mock.calls[1][1];

        expect(barOptions.tooltip.y.formatter(12.5)).toBe("$12.50");
        expect(donutOptions.tooltip.y.formatter(99)).toBe("$99.00");
    });
});
