import { describe, it, expect, beforeEach, vi } from "vitest";

describe("finances.js", () => {
    const testFinanceCsvColumns = [
        { key: "trID", header: "Transaction ID" },
        { key: "trDate", header: "Transaction Date" },
        { key: "trCategory", header: "Transaction Category" },
        { key: "trAmount", header: "Transaction Amount" },
        { key: "trNotes", header: "Transaction Notes" }
    ];

    beforeEach(async () => {
        localStorage.clear();
        vi.restoreAllMocks();
        vi.resetModules();

        document.body.innerHTML = `
            <button class="sidebar-toggle" aria-expanded="false">Open</button>
            <div id="sidebar" style="display: none;">
                <button class="sidebar-close">Close</button>
            </div>

            <form id="transaction-form" style="display: none;">
                <input id="tr-id" />
                <input id="tr-date" />
                <input id="tr-category" />
                <input id="tr-amount" />
                <input id="tr-notes" />
                <button id="submitBtn" data-mode="add">Add</button>
            </form>

            <input id="searchInput" />

            <div id="total-expenses"></div>

            <table>
                <tbody id="tableBody"></tbody>
            </table>
        `;

        window.i18next = {
            isInitialized: true,
            t: vi.fn((key) => key),
            on: vi.fn()
        };

        global.i18next = window.i18next;

        window.URL.createObjectURL = vi.fn(() => "blob:test-url");
        window.URL.revokeObjectURL = vi.fn();

        global.URL = window.URL;

        await import("../finances.js?cacheBust=" + Date.now());
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

    it("openForm should toggle transaction form display", () => {
        const form = document.getElementById("transaction-form");

        window.openForm();
        expect(form.style.display).toBe("block");

        window.openForm();
        expect(form.style.display).toBe("none");
    });

    it("closeForm should hide transaction form", () => {
        document.getElementById("transaction-form").style.display = "block";

        window.closeForm();

        expect(document.getElementById("transaction-form").style.display).toBe("none");
    });

    it("window.onload should load default transactions when localStorage is empty", () => {
        window.onload();

        const storedTransactions = JSON.parse(localStorage.getItem("bizTrackTransactions"));

        expect(storedTransactions.length).toBe(5);
        expect(document.querySelectorAll(".transaction-row").length).toBe(5);
        expect(document.getElementById("total-expenses").textContent).toContain("totalExpenses");
    });

    it("window.onload should load transactions from localStorage when available", () => {
        localStorage.setItem("bizTrackTransactions", JSON.stringify([
            {
                trID: 10,
                trDate: "2024-03-01",
                trCategory: "Rent",
                trAmount: 200,
                trNotes: "March rent"
            }
        ]));

        window.onload();

        expect(document.querySelectorAll(".transaction-row").length).toBe(1);
        expect(document.body.textContent).toContain("March rent");
        expect(document.getElementById("total-expenses").textContent).toContain("$200.00");
    });

    it("newTransaction should add a new transaction", () => {
        window.onload();

        document.getElementById("tr-date").value = "2024-04-01";
        document.getElementById("tr-category").value = "Utilities";
        document.getElementById("tr-amount").value = "55.50";
        document.getElementById("tr-notes").value = "Electric bill";

        window.newTransaction({ preventDefault: vi.fn() });

        const storedTransactions = JSON.parse(localStorage.getItem("bizTrackTransactions"));

        expect(storedTransactions.length).toBe(6);
        expect(storedTransactions[5].trCategory).toBe("Utilities");
        expect(storedTransactions[5].trAmount).toBe(55.5);
        expect(document.querySelectorAll(".transaction-row").length).toBe(6);
    });

    it("editRow should fill the form and set update mode", () => {
        window.onload();

        window.editRow(1);

        expect(document.getElementById("tr-id").value).toBe("1");
        expect(document.getElementById("tr-date").value).toBe("2024-01-05");
        expect(document.getElementById("tr-category").value).toBe("Rent");
        expect(document.getElementById("submitBtn").dataset.mode).toBe("update");
        expect(document.getElementById("transaction-form").style.display).toBe("block");
    });

    it("updateTransaction should update an existing transaction", () => {
        window.onload();

        window.editRow(1);

        document.getElementById("tr-date").value = "2024-05-01";
        document.getElementById("tr-category").value = "Supplies";
        document.getElementById("tr-amount").value = "99.99";
        document.getElementById("tr-notes").value = "Updated note";

        window.updateTransaction(1);

        const storedTransactions = JSON.parse(localStorage.getItem("bizTrackTransactions"));

        expect(storedTransactions[0].trDate).toBe("2024-05-01");
        expect(storedTransactions[0].trCategory).toBe("Supplies");
        expect(storedTransactions[0].trAmount).toBe(99.99);
        expect(storedTransactions[0].trNotes).toBe("Updated note");
        expect(document.getElementById("submitBtn").dataset.mode).toBe("add");
    });

    it("deleteTransaction should remove a transaction", () => {
        window.onload();

        window.deleteTransaction(1);

        const storedTransactions = JSON.parse(localStorage.getItem("bizTrackTransactions"));

        expect(storedTransactions.length).toBe(4);
        expect(storedTransactions.some(transaction => transaction.trID === 1)).toBe(false);
    });

    it("displayExpenses should calculate total expenses", () => {
        document.getElementById("tr-id").value = "T001";
        document.getElementById("tr-date").value = "2024-01-01";
        document.getElementById("tr-category").value = "Rent";
        document.getElementById("tr-amount").value = "100";
        document.getElementById("tr-notes").value = "Office rent";
        window.newTransaction({ preventDefault: vi.fn() });

        document.getElementById("tr-id").value = "T002";
        document.getElementById("tr-date").value = "2024-01-02";
        document.getElementById("tr-category").value = "Utilities";
        document.getElementById("tr-amount").value = "50.5";
        document.getElementById("tr-notes").value = "Electricity";
        window.newTransaction({ preventDefault: vi.fn() });

        window.displayExpenses();

        expect(document.getElementById("total-expenses").innerHTML).toContain("$150.50");
    });

    it("sortTable should sort transactions by ID", () => {
        window.renderTransactions([
            {
                trID: 2,
                trDate: "2024-01-02",
                trCategory: "Utilities",
                trAmount: 50,
                trNotes: "B"
            },
            {
                trID: 1,
                trDate: "2024-01-01",
                trCategory: "Rent",
                trAmount: 100,
                trNotes: "A"
            }
        ]);

        window.sortTable("trID");

        const rows = document.querySelectorAll(".transaction-row");

        expect(rows[0].dataset.trid || rows[0].dataset.trID).toBe("1");
    });

    it("sortTable should sort transactions by amount", () => {
        window.renderTransactions([
            {
                trID: 1,
                trDate: "2024-01-01",
                trCategory: "Rent",
                trAmount: 100,
                trNotes: "A"
            },
            {
                trID: 2,
                trDate: "2024-01-02",
                trCategory: "Utilities",
                trAmount: 50,
                trNotes: "B"
            }
        ]);

        window.sortTable("trAmount");

        const rows = document.querySelectorAll(".transaction-row");

        expect(rows[0].dataset.tramount || rows[0].dataset.trAmount).toBe("50");
    });

    it("performSearch should hide rows that do not match search input", () => {
        document.getElementById("tr-id").value = "T001";
        document.getElementById("tr-date").value = "2024-01-01";
        document.getElementById("tr-category").value = "Rent";
        document.getElementById("tr-amount").value = "100";
        document.getElementById("tr-notes").value = "Office rent";
        window.newTransaction({ preventDefault: vi.fn() });

        document.getElementById("tr-id").value = "T002";
        document.getElementById("tr-date").value = "2024-01-02";
        document.getElementById("tr-category").value = "Utilities";
        document.getElementById("tr-amount").value = "50";
        document.getElementById("tr-notes").value = "Electricity";
        window.newTransaction({ preventDefault: vi.fn() });

        const rows = document.querySelectorAll("#tableBody tr");

        Object.defineProperty(rows[0], "innerText", {
            configurable: true,
            value: "T001 2024-01-01 Rent 100 Office rent"
        });

        Object.defineProperty(rows[1], "innerText", {
            configurable: true,
            value: "T002 2024-01-02 Utilities 50 Electricity"
        });

        document.getElementById("searchInput").value = "rent";

        window.performSearch();

        expect(rows[0].style.display).toBe("table-row");
        expect(rows[1].style.display).toBe("none");
    });

    it("generateCSV should create CSV content", () => {
        const csv = window.generateCSV([
            {
                trID: 1,
                trDate: "2024-01-01",
                trCategory: "Rent",
                trAmount: 100,
                trNotes: "January rent"
            }
        ], testFinanceCsvColumns, window.formatFinanceCsvValue);

        expect(csv).toContain("Transaction ID,Transaction Date,Transaction Category,Transaction Amount,Transaction Notes");
        expect(csv).toContain("1,2024-01-01,Rent,100.00,January rent");
    });

    it("generateCSV should return only header when data is empty", () => {
        const csv = window.generateCSV([], testFinanceCsvColumns, window.formatFinanceCsvValue);

        expect(csv).toContain("Transaction ID,Transaction Date,Transaction Category,Transaction Amount,Transaction Notes");
    });

    it("escapeCsvCell should escape dangerous and special CSV values", () => {
        expect(window.escapeCsvCell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
        expect(window.escapeCsvCell('Hello, "World"')).toBe('"Hello, ""World"""');
        expect(window.escapeCsvCell(null)).toBe("");
    });

    it("exportToCSV should create and download CSV file", () => {
        window.onload();

        const clickMock = vi.fn();

        vi.spyOn(document, "createElement").mockImplementation((tagName) => {
            const element = document.createElementNS("http://www.w3.org/1999/xhtml", tagName);

            if (tagName === "a") {
                element.click = clickMock;
            }

            return element;
        });

        window.exportToCSV();

        expect(window.URL.createObjectURL).toHaveBeenCalled();
        expect(clickMock).toHaveBeenCalled();
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-url");
    });

    it("addOrUpdate should call newTransaction when mode is add", () => {
        window.onload();

        document.getElementById("submitBtn").dataset.mode = "add";
        document.getElementById("tr-date").value = "2024-06-01";
        document.getElementById("tr-category").value = "Miscellaneous";
        document.getElementById("tr-amount").value = "12";
        document.getElementById("tr-notes").value = "Test add";

        window.addOrUpdate({ preventDefault: vi.fn() });

        const storedTransactions = JSON.parse(localStorage.getItem("bizTrackTransactions"));

        expect(storedTransactions.some(transaction => transaction.trNotes === "Test add")).toBe(true);
    });

    it("addOrUpdate should call updateTransaction when mode is update", () => {
        window.onload();

        window.editRow(1);

        document.getElementById("tr-notes").value = "Updated From AddOrUpdate";

        window.addOrUpdate({ preventDefault: vi.fn() });

        const storedTransactions = JSON.parse(localStorage.getItem("bizTrackTransactions"));

        expect(storedTransactions[0].trNotes).toBe("Updated From AddOrUpdate");
    });

    it("translateExpenseCategory should translate known categories", () => {
        expect(window.translateExpenseCategory("Rent")).toBe("rent");
        expect(window.translateExpenseCategory("Utilities")).toBe("utilities");
        expect(window.translateExpenseCategory("Unknown")).toBe("Unknown");
    });

    it("performSearch should show all rows when search input is empty", () => {
        window.onload();

        const rows = document.querySelectorAll("#tableBody tr");

        rows.forEach((row) => {
            Object.defineProperty(row, "innerText", {
                configurable: true,
                value: "Rent Utilities Marketing"
            });
        });

        document.getElementById("searchInput").value = "";

        window.performSearch();

        rows.forEach((row) => {
            expect(row.style.display).toBe("table-row");
        });
    });
    it("escapeCsvCell should quote values with new lines", () => {
        expect(window.escapeCsvCell("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
    });

    it("escapeCsvCell should return normal strings without quoting", () => {
        expect(window.escapeCsvCell("Normal text")).toBe("Normal text");
    });

    it("escapeCsvCell should handle empty string", () => {
        expect(window.escapeCsvCell("")).toBe("");
    });

    it("sortTable should sort transactions by category", () => {
        window.renderTransactions([
            {
                trID: 1,
                trDate: "2024-01-01",
                trCategory: "Utilities",
                trAmount: 50,
                trNotes: "B"
            },
            {
                trID: 2,
                trDate: "2024-01-02",
                trCategory: "Rent",
                trAmount: 100,
                trNotes: "A"
            }
        ]);

        window.sortTable("trCategory");

        const rows = document.querySelectorAll(".transaction-row");

        expect(rows[0].textContent).toContain("rent");
    });

    it("renderTransactions should render empty cells and empty amount for non-number values", () => {
        window.renderTransactions([
            {
                trID: 9001,
                trDate: null,
                trCategory: "Unknown Category",
                trAmount: "not-number",
                trNotes: undefined
            }
        ]);

        const row = document.querySelector(".transaction-row");

        expect(row.textContent).toContain("9001");
        expect(row.textContent).toContain("Unknown Category");
    });

    it("formatFinanceCsvValue should return empty string for invalid amount", () => {
        expect(window.formatFinanceCsvValue({ trAmount: "abc" }, "trAmount")).toBe("");
    });

    it("generateCSV should use raw item value when formatValue is missing", () => {
        const csv = window.generateCSV(
            [
                {
                    trID: 1,
                    trDate: "2024-01-01"
                }
            ],
            [
                {
                    key: "trID",
                    header: "Transaction ID"
                },
                {
                    key: "trDate",
                    header: "Transaction Date"
                }
            ]
        );

        expect(csv).toContain("1,2024-01-01");
    });

    it("search input Enter key should run search and hide unmatched rows", () => {
        window.renderTransactions([
            {
                trID: 1,
                trDate: "2024-01-01",
                trCategory: "Rent",
                trAmount: 100,
                trNotes: "Alpha"
            },
            {
                trID: 2,
                trDate: "2024-01-02",
                trCategory: "Utilities",
                trAmount: 200,
                trNotes: "Beta"
            }
        ]);

        const rows = document.querySelectorAll("#tableBody tr");

        Object.defineProperty(rows[0], "innerText", {
            configurable: true,
            value: "Rent Alpha"
        });

        Object.defineProperty(rows[1], "innerText", {
            configurable: true,
            value: "Utilities Beta"
        });

        document.getElementById("searchInput").value = "rent";

        document.getElementById("searchInput").dispatchEvent(
            new KeyboardEvent("keyup", {
                key: "Enter"
            })
        );

        expect(rows[0].style.display).toBe("table-row");
        expect(rows[1].style.display).toBe("none");
    });
});
