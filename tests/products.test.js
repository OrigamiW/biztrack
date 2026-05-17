import { describe, it, expect, beforeEach, vi } from "vitest";

describe("products.js", () => {
    const testProductCsvColumns = [
        { key: "prodID", header: "Product ID" },
        { key: "prodName", header: "Product Name" },
        { key: "prodDesc", header: "Product Description" },
        { key: "prodCat", header: "Product Category" },
        { key: "prodPrice", header: "Product Price" },
        { key: "prodSold", header: "Quantity Sold" }
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

            <form id="product-form" style="display: none;">
                <input id="product-id" />
                <input id="product-name" />
                <input id="product-desc" />
                <input id="product-cat" />
                <input id="product-price" />
                <input id="product-sold" />
                <button id="submitBtn" data-mode="add">Add</button>
            </form>

            <input id="searchInput" />

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

        window.alert = vi.fn();
        global.alert = window.alert;

        window.URL.createObjectURL = vi.fn(() => "blob:test-url");
        window.URL.revokeObjectURL = vi.fn();
        global.URL = window.URL;

        await import("../products.js?cacheBust=" + Date.now());
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

    it("openForm should toggle product form display", () => {
        const form = document.getElementById("product-form");

        window.openForm();
        expect(form.style.display).toBe("block");

        window.openForm();
        expect(form.style.display).toBe("none");
    });

    it("closeForm should hide product form", () => {
        document.getElementById("product-form").style.display = "block";

        window.closeForm();

        expect(document.getElementById("product-form").style.display).toBe("none");
    });

    it("init should load default products when localStorage is empty", () => {
        window.init();

        const storedProducts = JSON.parse(localStorage.getItem("bizTrackProducts"));

        expect(storedProducts.length).toBe(5);
        expect(document.querySelectorAll(".product-row").length).toBe(5);
    });

    it("init should load products from localStorage when available", () => {
        localStorage.setItem("bizTrackProducts", JSON.stringify([
            {
                prodID: "PD100",
                prodName: "Test Product",
                prodDesc: "Test Desc",
                prodCat: "Hats",
                prodPrice: 10,
                prodSold: 2
            }
        ]));

        window.init();

        expect(document.querySelectorAll(".product-row").length).toBe(1);
        expect(document.body.textContent).toContain("Test Product");
    });

    it("newProduct should add a new product", () => {
        window.init();

        document.getElementById("product-id").value = "PD999";
        document.getElementById("product-name").value = "Mugs";
        document.getElementById("product-desc").value = "Test mug";
        document.getElementById("product-cat").value = "Drinkware";
        document.getElementById("product-price").value = "15.50";
        document.getElementById("product-sold").value = "3";

        window.newProduct({ preventDefault: vi.fn() });

        const storedProducts = JSON.parse(localStorage.getItem("bizTrackProducts"));

        expect(storedProducts.length).toBe(6);
        expect(storedProducts[5].prodID).toBe("PD999");
        expect(document.querySelectorAll(".product-row").length).toBe(6);
    });

    it("newProduct should not add duplicate product ID", () => {
        window.init();

        document.getElementById("product-id").value = "PD001";
        document.getElementById("product-name").value = "Duplicate";
        document.getElementById("product-desc").value = "Duplicate Desc";
        document.getElementById("product-cat").value = "Hats";
        document.getElementById("product-price").value = "20";
        document.getElementById("product-sold").value = "1";

        window.newProduct({ preventDefault: vi.fn() });

        const storedProducts = JSON.parse(localStorage.getItem("bizTrackProducts"));

        expect(storedProducts.length).toBe(5);
        expect(window.alert).toHaveBeenCalledWith("duplicateProductId");
    });

    it("editRow should fill the form and set update mode", () => {
        window.init();

        window.editRow("PD001");

        expect(document.getElementById("product-id").value).toBe("PD001");
        expect(document.getElementById("product-name").value).toBe("Baseball caps");
        expect(document.getElementById("submitBtn").dataset.mode).toBe("update");
        expect(document.getElementById("product-form").style.display).toBe("block");
    });

    it("updateProduct should update an existing product", () => {
        window.init();

        window.editRow("PD001");

        document.getElementById("product-name").value = "Updated Product";
        document.getElementById("product-price").value = "99.99";

        window.updateProduct("PD001");

        const storedProducts = JSON.parse(localStorage.getItem("bizTrackProducts"));

        expect(storedProducts[0].prodName).toBe("Updated Product");
        expect(storedProducts[0].prodPrice).toBe(99.99);
        expect(document.getElementById("submitBtn").dataset.mode).toBe("add");
    });

    it("updateProduct should preserve the original product ID during edit", () => {
        window.init();

        window.editRow("PD001");

        document.getElementById("product-id").value = "PD002";
        document.getElementById("product-name").value = "Updated Product";
        document.getElementById("product-desc").value = "Updated description";
        document.getElementById("product-cat").value = "Hats";
        document.getElementById("product-price").value = "99.99";

        window.updateProduct("PD001");

        const storedProducts = JSON.parse(localStorage.getItem("bizTrackProducts"));

        expect(storedProducts[0].prodID).toBe("PD001");
        expect(storedProducts[0].prodName).toBe("Updated Product");
        expect(window.alert).not.toHaveBeenCalledWith("duplicateProductId");
    });

    it("deleteProduct should remove a product", () => {
        window.init();

        window.deleteProduct("PD001");

        const storedProducts = JSON.parse(localStorage.getItem("bizTrackProducts"));

        expect(storedProducts.length).toBe(4);
        expect(storedProducts.some(product => product.prodID === "PD001")).toBe(false);
    });

    it("deleteProduct should prevent deleting a product linked to orders", () => {
        localStorage.setItem("bizTrackOrders", JSON.stringify([
            {
                orderID: "1001",
                orderDate: "2024-01-05",
                productID: "PD001",
                itemName: "Baseball caps",
                itemPrice: 25,
                qtyBought: 2,
                shipping: 2.5,
                taxes: 9,
                orderTotal: 61.5,
                orderStatus: "Pending"
            }
        ]));

        window.init();

        window.deleteProduct("PD001");

        const storedProducts = JSON.parse(localStorage.getItem("bizTrackProducts"));

        expect(storedProducts.some(product => product.prodID === "PD001")).toBe(true);
        expect(window.alert).toHaveBeenCalledWith("productLinkedToOrders");
    });

    it("isDuplicateID should detect duplicate product IDs", () => {
        window.init();

        expect(window.isDuplicateID("PD001", null)).toBe(true);
        expect(window.isDuplicateID("PD999", null)).toBe(false);
        expect(window.isDuplicateID("PD001", "PD001")).toBe(false);
    });

    it("sortTable should sort products by product ID", () => {
        window.renderProducts([
            {
                prodID: "PD002",
                prodName: "B",
                prodDesc: "Desc B",
                prodCat: "Hats",
                prodPrice: 20,
                prodSold: 2
            },
            {
                prodID: "PD001",
                prodName: "A",
                prodDesc: "Desc A",
                prodCat: "Hats",
                prodPrice: 10,
                prodSold: 1
            }
        ]);

        window.sortTable("prodID");

        const rows = document.querySelectorAll(".product-row");

        expect(rows[0].dataset.prodid || rows[0].dataset.prodID).toBe("PD001");
    });

    it("sortTable should sort products by numeric price", () => {
        window.renderProducts([
            {
                prodID: "PD001",
                prodName: "A",
                prodDesc: "Desc A",
                prodCat: "Hats",
                prodPrice: 20,
                prodSold: 2
            },
            {
                prodID: "PD002",
                prodName: "B",
                prodDesc: "Desc B",
                prodCat: "Hats",
                prodPrice: 10,
                prodSold: 1
            }
        ]);

        window.sortTable("prodPrice");

        const rows = document.querySelectorAll(".product-row");

        expect(rows[0].dataset.prodprice || rows[0].dataset.prodPrice).toBe("10");
    });

    it("performSearch should hide rows that do not match search input", () => {
        localStorage.setItem("bizTrackProducts", JSON.stringify([
            {
                prodID: "P001",
                prodName: "Blue Hat",
                prodDesc: "Hat product",
                prodCat: "Hats",
                prodPrice: 10,
                prodSold: 2
            },
            {
                prodID: "P002",
                prodName: "Coffee Mug",
                prodDesc: "Mug product",
                prodCat: "Drinkware",
                prodPrice: 15,
                prodSold: 1
            }
        ]));

        window.init();

        const rows = document.querySelectorAll("#tableBody tr");

        Object.defineProperty(rows[0], "innerText", {
            configurable: true,
            value: "P001 Blue Hat Hat product Hats $10.00 2"
        });

        Object.defineProperty(rows[1], "innerText", {
            configurable: true,
            value: "P002 Coffee Mug Mug product Drinkware $15.00 1"
        });

        document.getElementById("searchInput").value = "hat";

        window.performSearch();

        expect(rows[0].style.display).toBe("table-row");
        expect(rows[1].style.display).toBe("none");
    });

    it("generateCSV should create CSV content", () => {
        const csv = window.generateCSV([
            {
                prodID: "PD001",
                prodName: "Mugs",
                prodDesc: "Coffee mug",
                prodCat: "Drinkware",
                prodPrice: 10,
                prodSold: 1
            }
        ], testProductCsvColumns, window.formatProductCsvValue);

        expect(csv).toContain("Product ID,Product Name,Product Description,Product Category,Product Price,Quantity Sold");
        expect(csv).toContain("PD001,Mugs,Coffee mug,Drinkware,10.00,1");
    });

    it("generateCSV should return only header when data is empty", () => {
        const csv = window.generateCSV([], testProductCsvColumns, window.formatProductCsvValue);

        expect(csv).toContain("Product ID,Product Name,Product Description,Product Category,Product Price,Quantity Sold");
    });

    it("escapeCsvCell should escape dangerous and special CSV values", () => {
        expect(window.escapeCsvCell("=SUM(A1:A2)")).toBe("'=SUM(A1:A2)");
        expect(window.escapeCsvCell('Hello, "World"')).toBe('"Hello, ""World"""');
        expect(window.escapeCsvCell(null)).toBe("");
    });

    it("exportToCSV should create and download CSV file", () => {
        window.init();

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

    it("addOrUpdate should call newProduct when mode is add", () => {
        window.init();

        document.getElementById("submitBtn").dataset.mode = "add";
        document.getElementById("product-id").value = "PD777";
        document.getElementById("product-name").value = "Test Add";
        document.getElementById("product-desc").value = "Desc";
        document.getElementById("product-cat").value = "Hats";
        document.getElementById("product-price").value = "12";
        document.getElementById("product-sold").value = "2";

        window.addOrUpdate({ preventDefault: vi.fn() });

        const storedProducts = JSON.parse(localStorage.getItem("bizTrackProducts"));

        expect(storedProducts.some(product => product.prodID === "PD777")).toBe(true);
    });

    it("addOrUpdate should call updateProduct when mode is update", () => {
        window.init();

        window.editRow("PD001");

        document.getElementById("product-name").value = "Updated From AddOrUpdate";

        window.addOrUpdate({ preventDefault: vi.fn() });

        const storedProducts = JSON.parse(localStorage.getItem("bizTrackProducts"));

        expect(storedProducts[0].prodName).toBe("Updated From AddOrUpdate");
    });

    it("deleteProduct should do nothing when product ID is not found", () => {
        window.init();

        window.deleteProduct("PD999");

        const storedProducts = JSON.parse(localStorage.getItem("bizTrackProducts"));

        expect(storedProducts.length).toBe(5);
    });

    it("performSearch should show all rows when search input is empty", () => {
        window.init();

        const rows = document.querySelectorAll("#tableBody tr");

        rows.forEach((row) => {
            Object.defineProperty(row, "innerText", {
                configurable: true,
                value: "Baseball caps Hats Drinkware"
            });
        });

        document.getElementById("searchInput").value = "";

        window.performSearch();

        rows.forEach((row) => {
            expect(row.style.display).toBe("table-row");
        });
    });

    it("escapeCsvCell should quote values with commas and new lines", () => {
        expect(window.escapeCsvCell("Hello, world")).toBe('"Hello, world"');
        expect(window.escapeCsvCell("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
    });

    it("escapeCsvCell should return normal strings without quoting", () => {
        expect(window.escapeCsvCell("Normal text")).toBe("Normal text");
    });

    it("escapeCsvCell should handle empty string", () => {
        expect(window.escapeCsvCell("")).toBe("");
    });

    it("sortTable should sort products by sold quantity", () => {
        window.renderProducts([
            {
                prodID: "PD001",
                prodName: "A",
                prodDesc: "Desc A",
                prodCat: "Hats",
                prodPrice: 20,
                prodSold: 5
            },
            {
                prodID: "PD002",
                prodName: "B",
                prodDesc: "Desc B",
                prodCat: "Hats",
                prodPrice: 10,
                prodSold: 1
            }
        ]);

        window.sortTable("prodSold");

        const rows = document.querySelectorAll(".product-row");

        expect(rows[0].dataset.prodsold || rows[0].dataset.prodSold).toBe("1");
    });

    it("sortTable should sort products by name", () => {
        window.renderProducts([
            {
                prodID: "PD001",
                prodName: "Water Bottle",
                prodDesc: "Desc A",
                prodCat: "Drinkware",
                prodPrice: 20,
                prodSold: 2
            },
            {
                prodID: "PD002",
                prodName: "Baseball Cap",
                prodDesc: "Desc B",
                prodCat: "Hats",
                prodPrice: 10,
                prodSold: 1
            }
        ]);

        window.sortTable("prodName");

        const rows = document.querySelectorAll(".product-row");

        expect(rows[0].textContent).toContain("Baseball Cap");
    });

    it("translateProductCategory should return original category when translation is missing", () => {
        expect(window.translateProductCategory("Unknown Category")).toBe("Unknown Category");
    });

    it("renderProducts should render empty cells when values are null or undefined", () => {
        window.renderProducts([
            {
                prodID: "PX001",
                prodName: null,
                prodDesc: undefined,
                prodCat: "Unknown Category",
                prodPrice: "not-number",
                prodSold: null
            }
        ]);

        const row = document.querySelector(".product-row");

        expect(row.textContent).toContain("PX001");
        expect(row.textContent).toContain("Unknown Category");
    });

    it("generateCSV should use raw item value when formatValue is missing", () => {
        const csv = window.generateCSV(
            [
                {
                    prodID: "PX001",
                    prodName: "Test Product"
                }
            ],
            [
                {
                    key: "prodID",
                    header: "Product ID"
                },
                {
                    key: "prodName",
                    header: "Product Name"
                }
            ]
        );

        expect(csv).toContain("PX001,Test Product");
    });

    it("addOrUpdate should add product by default when dataset mode is missing", () => {
        const submitBtn = document.getElementById("submitBtn");
        delete submitBtn.dataset.mode;

        document.getElementById("product-id").value = "PX9001";
        document.getElementById("product-name").value = "Test Product";
        document.getElementById("product-desc").value = "Default add mode";
        document.getElementById("product-cat").value = "Hats";
        document.getElementById("product-price").value = "12";
        document.getElementById("product-sold").value = "3";

        window.addOrUpdate({
            preventDefault: vi.fn()
        });

        const storedProducts = JSON.parse(localStorage.getItem("bizTrackProducts"));

        expect(storedProducts.some(product => product.prodID === "PX9001")).toBe(true);
    });
});
