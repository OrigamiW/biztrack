import { describe, it, expect, beforeEach, vi } from "vitest";

describe("orders.js", () => {
    const testOrderCsvColumns = [
        { key: "orderID", header: "Order ID" },
        { key: "orderDate", header: "Order Date" },
        { key: "itemName", header: "Item Name" },
        { key: "itemPrice", header: "Item Price" },
        { key: "qtyBought", header: "Quantity Bought" },
        { key: "shipping", header: "Shipping" },
        { key: "taxes", header: "Taxes" },
        { key: "orderTotal", header: "Order Total" },
        { key: "orderStatus", header: "Order Status" }
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

            <form id="order-form" style="display: none;">  
                <input id="order-id" />  
                <input id="order-date" />  
                <select id="product-select"></select>  
                <input id="item-name" />  
                <input id="item-price" />  
                <input id="qty-bought" />  
                <input id="shipping" />  
                <input id="taxes" />  
                <input id="order-total" />  
                <select id="order-status">  
                    <option value="Pending">Pending</option>  
                    <option value="Processing">Processing</option>  
                    <option value="Shipped">Shipped</option>  
                    <option value="Delivered">Delivered</option>  
                </select>  
                <button id="submitBtn" data-mode="add">Add</button>  
            </form>  

            <input id="searchInput" />  

            <div id="total-revenue"></div>  

            <table>  
                <tbody id="tableBody"></tbody>  
            </table>  
        `;

        localStorage.setItem("bizTrackProducts", JSON.stringify([
            {
                prodID: "PD001",
                prodName: "Baseball caps",
                prodDesc: "Peace embroidered cap",
                prodCat: "Hats",
                prodPrice: 25.00,
                prodSold: 20
            },
            {
                prodID: "PD002",
                prodName: "Water bottles",
                prodDesc: "Floral lotus printed bottle",
                prodCat: "Drinkware",
                prodPrice: 17.00,
                prodSold: 10
            }
        ]));

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

        await import("../orders.js?cacheBust=" + Date.now());
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

    it("openForm should toggle order form display", () => {
        const form = document.getElementById("order-form");

        window.openForm();
        expect(form.style.display).toBe("block");

        window.openForm();
        expect(form.style.display).toBe("none");
    });

    it("closeForm should hide order form", () => {
        document.getElementById("order-form").style.display = "block";

        window.closeForm();

        expect(document.getElementById("order-form").style.display).toBe("none");
    });

    it("window.onload should load default orders when localStorage is empty", () => {
        window.onload();

        const storedOrders = JSON.parse(localStorage.getItem("bizTrackOrders"));

        expect(storedOrders.length).toBe(5);
        expect(document.querySelectorAll(".order-row").length).toBe(5);
        expect(document.getElementById("total-revenue").textContent).toContain("totalRevenue");
    });

    it("window.onload should prefer item-name matching before legacy order ID mapping", () => {
        localStorage.setItem("bizTrackOrders", JSON.stringify([
            {
                orderID: "1001",
                orderDate: "2024-05-01",
                itemName: "Water bottles",
                itemPrice: 999,
                qtyBought: 2,
                shipping: 0,
                taxes: 0,
                orderTotal: 1998,
                orderStatus: "Pending"
            }
        ]));

        window.onload();

        const storedOrders = JSON.parse(localStorage.getItem("bizTrackOrders"));

        expect(storedOrders[0].productID).toBe("PD002");
        expect(storedOrders[0].itemName).toBe("Water bottles");
        expect(storedOrders[0].itemPrice).toBe(17);
        expect(storedOrders[0].orderTotal).toBe(34);
    });

    it("populateProductSelect should add product options", () => {
        window.onload();

        const options = document.querySelectorAll("#product-select option");

        expect(options.length).toBe(3);
        expect(options[1].textContent).toBe("Baseball caps - $25.00");
        expect(options[2].textContent).toBe("Water bottles - $17.00");
    });

    it("product select change should update item name and price", () => {
        window.onload();

        const productSelect = document.getElementById("product-select");

        productSelect.value = "PD001";
        productSelect.dispatchEvent(new Event("change"));

        expect(document.getElementById("item-name").value).toBe("Baseball caps");
        expect(document.getElementById("item-price").value).toBe("25");
    });

    it("newOrder should add a new order and update product sales", () => {
        window.onload();

        document.getElementById("order-id").value = "9999";
        document.getElementById("order-date").value = "2024-06-01";
        document.getElementById("product-select").value = "PD001";
        document.getElementById("item-name").value = "Baseball caps";
        document.getElementById("item-price").value = "25";
        document.getElementById("qty-bought").value = "2";
        document.getElementById("shipping").value = "3";
        document.getElementById("taxes").value = "1";
        document.getElementById("order-status").value = "Pending";

        window.newOrder({ preventDefault: vi.fn() });

        const storedOrders = JSON.parse(localStorage.getItem("bizTrackOrders"));
        const storedProducts = JSON.parse(localStorage.getItem("bizTrackProducts"));

        expect(storedOrders.length).toBe(6);
        expect(storedOrders[5].orderID).toBe("9999");
        expect(storedOrders[5].orderTotal).toBe(54);
        expect(storedProducts[0].prodSold).toBe(4);
    });

    it("newOrder should reject an empty product selection", () => {
        window.onload();

        document.getElementById("order-id").value = "9010";
        document.getElementById("order-date").value = "2024-10-01";
        document.getElementById("product-select").value = "";
        document.getElementById("item-name").value = "";
        document.getElementById("item-price").value = "";
        document.getElementById("qty-bought").value = "2";
        document.getElementById("shipping").value = "3";
        document.getElementById("taxes").value = "1";
        document.getElementById("order-status").value = "Pending";

        window.newOrder({ preventDefault: vi.fn() });

        const storedOrders = JSON.parse(localStorage.getItem("bizTrackOrders"));

        expect(storedOrders.some(order => String(order.orderID) === "9010")).toBe(false);
        expect(window.alert).toHaveBeenCalledWith("chooseProduct");
    });

    it("newOrder should not add duplicate order ID", () => {
        window.onload();

        document.getElementById("order-id").value = "1001";
        document.getElementById("order-date").value = "2024-06-01";
        document.getElementById("product-select").value = "PD001";
        document.getElementById("item-name").value = "Baseball caps";
        document.getElementById("item-price").value = "25";
        document.getElementById("qty-bought").value = "2";
        document.getElementById("shipping").value = "3";
        document.getElementById("taxes").value = "1";
        document.getElementById("order-status").value = "Pending";

        window.newOrder({ preventDefault: vi.fn() });

        const storedOrders = JSON.parse(localStorage.getItem("bizTrackOrders"));

        expect(storedOrders.length).toBe(5);
        expect(window.alert).toHaveBeenCalledWith("duplicateOrderId");
    });

    it("editRow should fill the form and set update mode", () => {
        window.onload();

        window.editRow("1001");

        expect(document.getElementById("order-id").value).toBe("1001");
        expect(document.getElementById("order-date").value).toBe("2024-01-05");
        expect(document.getElementById("item-name").value).toBe("Baseball caps");
        expect(document.getElementById("submitBtn").dataset.mode).toBe("update");
        expect(document.getElementById("order-form").style.display).toBe("block");
    });

    it("updateOrder should update an existing order", () => {
        localStorage.setItem("bizTrackOrders", JSON.stringify([
            {
                orderID: "1001",
                orderDate: "2024-01-05",
                itemName: "Baseball caps",
                itemPrice: 25,
                qtyBought: 2,
                shipping: 2.5,
                taxes: 9,
                orderTotal: 61.5,
                orderStatus: "Pending",
                productID: "PD001"
            }
        ]));

        window.onload();
        window.editRow("1001");

        document.getElementById("order-date").value = "2024-07-01";
        document.getElementById("product-select").value = "PD002";
        document.getElementById("item-name").value = "Water bottles";
        document.getElementById("item-price").value = "17";
        document.getElementById("qty-bought").value = "3";
        document.getElementById("shipping").value = "3.5";
        document.getElementById("taxes").value = "6";
        document.getElementById("order-status").value = "Processing";

        window.updateOrder("1001");

        const storedOrders = JSON.parse(localStorage.getItem("bizTrackOrders"));
        const storedProducts = JSON.parse(localStorage.getItem("bizTrackProducts"));

        expect(storedOrders[0].orderDate).toBe("2024-07-01");
        expect(storedOrders[0].itemName).toBe("Water bottles");
        expect(storedOrders[0].orderTotal).toBe(60.5);
        expect(storedOrders[0].orderStatus).toBe("Processing");
        expect(document.getElementById("submitBtn").dataset.mode).toBe("add");

        expect(storedProducts[0].prodSold).toBe(0);
        expect(storedProducts[1].prodSold).toBe(3);
    });

    it("updateOrder should not allow duplicate order ID", () => {
        window.onload();

        window.editRow("1001");

        document.getElementById("order-id").value = "1002";

        window.updateOrder("1001");

        expect(window.alert).toHaveBeenCalledWith("duplicateOrderId");
    });

    it("updateOrder should reject an empty product selection", () => {
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

        window.onload();
        window.editRow("1001");

        document.getElementById("product-select").value = "";

        window.updateOrder("1001");

        const storedOrders = JSON.parse(localStorage.getItem("bizTrackOrders"));

        expect(storedOrders[0].productID).toBe("PD001");
        expect(window.alert).toHaveBeenCalledWith("chooseProduct");
    });

    it("deleteOrder should remove an order and update product sales", () => {
        localStorage.setItem("bizTrackOrders", JSON.stringify([
            {
                orderID: "1001",
                orderDate: "2024-01-05",
                itemName: "Baseball caps",
                itemPrice: 25,
                qtyBought: 2,
                shipping: 2.5,
                taxes: 9,
                orderTotal: 61.5,
                orderStatus: "Pending",
                productID: "PD001"
            }
        ]));

        window.onload();

        window.deleteOrder("1001");

        const storedOrders = JSON.parse(localStorage.getItem("bizTrackOrders"));
        const storedProducts = JSON.parse(localStorage.getItem("bizTrackProducts"));

        expect(storedOrders.length).toBe(0);
        expect(storedProducts[0].prodSold).toBe(0);
    });

    it("displayRevenue should calculate total revenue", () => {
        localStorage.setItem("bizTrackOrders", JSON.stringify([]));
        window.onload();

        document.getElementById("order-id").value = "O001";
        document.getElementById("order-date").value = "2024-01-01";
        document.getElementById("product-select").value = "PD001";
        document.getElementById("item-name").value = "Baseball caps";
        document.getElementById("item-price").value = "25";
        document.getElementById("qty-bought").value = "2";
        document.getElementById("shipping").value = "0";
        document.getElementById("taxes").value = "0";
        document.getElementById("order-status").value = "Pending";
        window.newOrder({ preventDefault: vi.fn() });

        document.getElementById("order-id").value = "O002";
        document.getElementById("order-date").value = "2024-01-02";
        document.getElementById("product-select").value = "PD002";
        document.getElementById("item-name").value = "Water bottles";
        document.getElementById("item-price").value = "17";
        document.getElementById("qty-bought").value = "1";
        document.getElementById("shipping").value = "0";
        document.getElementById("taxes").value = "0";
        document.getElementById("order-status").value = "Shipped";
        window.newOrder({ preventDefault: vi.fn() });

        window.displayRevenue();

        expect(document.getElementById("total-revenue").innerHTML).toContain("$67.00");
    });

    it("isDuplicateID should detect duplicate order IDs", () => {
        window.onload();

        expect(window.isDuplicateID("1001", null)).toBe(true);
        expect(window.isDuplicateID("9999", null)).toBe(false);
        expect(window.isDuplicateID("1001", "1001")).toBe(false);
    });

    it("sortTable should sort orders by order ID", () => {
        window.renderOrders([
            {
                orderID: "1002",
                orderDate: "2024-01-02",
                itemName: "B",
                itemPrice: 20,
                qtyBought: 2,
                shipping: 2,
                taxes: 1,
                orderTotal: 43,
                orderStatus: "Pending"
            },
            {
                orderID: "1001",
                orderDate: "2024-01-01",
                itemName: "A",
                itemPrice: 10,
                qtyBought: 1,
                shipping: 1,
                taxes: 1,
                orderTotal: 12,
                orderStatus: "Delivered"
            }
        ]);

        window.sortTable("orderID");

        const rows = document.querySelectorAll(".order-row");

        expect(rows[0].dataset.orderid || rows[0].dataset.orderID).toBe("1001");
    });

    it("sortTable should sort orders by total amount", () => {
        window.renderOrders([
            {
                orderID: "1001",
                orderDate: "2024-01-01",
                itemName: "A",
                itemPrice: 10,
                qtyBought: 1,
                shipping: 1,
                taxes: 1,
                orderTotal: 12,
                orderStatus: "Delivered"
            },
            {
                orderID: "1002",
                orderDate: "2024-01-02",
                itemName: "B",
                itemPrice: 20,
                qtyBought: 2,
                shipping: 2,
                taxes: 1,
                orderTotal: 43,
                orderStatus: "Pending"
            }
        ]);

        window.sortTable("orderTotal");

        const rows = document.querySelectorAll(".order-row");

        expect(rows[0].dataset.ordertotal || rows[0].dataset.orderTotal).toBe("12");
    });

    it("performSearch should hide rows that do not match search input", () => {
        localStorage.setItem("bizTrackOrders", JSON.stringify([]));
        window.onload();

        document.getElementById("order-id").value = "O001";
        document.getElementById("order-date").value = "2024-01-01";
        document.getElementById("product-select").value = "PD001";
        document.getElementById("item-name").value = "Baseball caps";
        document.getElementById("item-price").value = "25";
        document.getElementById("qty-bought").value = "2";
        document.getElementById("shipping").value = "0";
        document.getElementById("taxes").value = "0";
        document.getElementById("order-status").value = "Pending";
        window.newOrder({ preventDefault: vi.fn() });

        document.getElementById("order-id").value = "O002";
        document.getElementById("order-date").value = "2024-01-02";
        document.getElementById("product-select").value = "PD002";
        document.getElementById("item-name").value = "Water bottles";
        document.getElementById("item-price").value = "17";
        document.getElementById("qty-bought").value = "1";
        document.getElementById("shipping").value = "0";
        document.getElementById("taxes").value = "0";
        document.getElementById("order-status").value = "Shipped";
        window.newOrder({ preventDefault: vi.fn() });

        const rows = document.querySelectorAll("#tableBody tr");

        Object.defineProperty(rows[0], "innerText", {
            configurable: true,
            value: "O001 2024-01-01 Baseball caps 25 2 0 0 50 Pending"
        });

        Object.defineProperty(rows[1], "innerText", {
            configurable: true,
            value: "O002 2024-01-02 Water bottles 17 1 0 0 17 Shipped"
        });

        document.getElementById("searchInput").value = "caps";

        window.performSearch();

        expect(rows[0].style.display).toBe("table-row");
        expect(rows[1].style.display).toBe("none");
    });

    it("generateCSV should create CSV content", () => {
        const csv = window.generateCSV([
            {
                orderID: "1001",
                orderDate: "2024-01-01",
                itemName: "Baseball caps",
                itemPrice: 10,
                qtyBought: 1,
                shipping: 1,
                taxes: 1,
                orderTotal: 12,
                orderStatus: "Pending"
            }
        ], testOrderCsvColumns, window.formatOrderCsvValue);

        expect(csv).toContain("Order ID,Order Date,Item Name,Item Price,Quantity Bought,Shipping,Taxes,Order Total,Order Status");
        expect(csv).toContain("1001,2024-01-01,Baseball caps,10.00,1,1.00,1.00,12.00,Pending");
    });

    it("generateCSV should return only header when data is empty", () => {
        const csv = window.generateCSV([], testOrderCsvColumns, window.formatOrderCsvValue);

        expect(csv).toContain("Order ID,Order Date,Item Name,Item Price,Quantity Bought,Shipping,Taxes,Order Total,Order Status");
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

    it("addOrUpdate should call newOrder when mode is add", () => {
        window.onload();

        document.getElementById("submitBtn").dataset.mode = "add";
        document.getElementById("order-id").value = "8888";
        document.getElementById("order-date").value = "2024-08-01";
        document.getElementById("product-select").value = "PD001";
        document.getElementById("item-name").value = "Baseball caps";
        document.getElementById("item-price").value = "25";
        document.getElementById("qty-bought").value = "1";
        document.getElementById("shipping").value = "2";
        document.getElementById("taxes").value = "1";
        document.getElementById("order-status").value = "Pending";

        window.addOrUpdate({ preventDefault: vi.fn() });

        const storedOrders = JSON.parse(localStorage.getItem("bizTrackOrders"));

        expect(storedOrders.some(order => order.orderID === "8888")).toBe(true);
    });

    it("addOrUpdate should call updateOrder when mode is update", () => {
        window.onload();

        window.editRow("1001");

        document.getElementById("order-date").value = "2024-09-01";

        window.addOrUpdate({ preventDefault: vi.fn() });

        const storedOrders = JSON.parse(localStorage.getItem("bizTrackOrders"));

        expect(storedOrders[0].orderDate).toBe("2024-09-01");
    });

    it("translateOrderStatus should translate known statuses", () => {
        expect(window.translateOrderStatus("Pending")).toBe("pending");
        expect(window.translateOrderStatus("Processing")).toBe("processing");
        expect(window.translateOrderStatus("Unknown")).toBe("Unknown");
    });

    it("sortTable should sort orders by item name", () => {
        window.renderOrders([
            {
                orderID: "1001",
                orderDate: "2024-01-01",
                itemName: "Water Bottle",
                itemPrice: 20,
                qtyBought: 1,
                shipping: 1,
                taxes: 1,
                orderTotal: 22,
                orderStatus: "Pending"
            },
            {
                orderID: "1002",
                orderDate: "2024-01-02",
                itemName: "Baseball Cap",
                itemPrice: 10,
                qtyBought: 1,
                shipping: 1,
                taxes: 1,
                orderTotal: 12,
                orderStatus: "Delivered"
            }
        ]);

        window.sortTable("itemName");

        const rows = document.querySelectorAll(".order-row");

        expect(rows[0].textContent).toContain("Baseball Cap");
    });
    it("performSearch should show all rows when search input is empty", () => {
        window.onload();

        const rows = document.querySelectorAll("#tableBody tr");

        rows.forEach((row) => {
            Object.defineProperty(row, "innerText", {
                configurable: true,
                value: "Baseball caps Pending Delivered"
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

    it("product select change should clear item fields when product is not found", () => {
        window.onload();

        const productSelect = document.getElementById("product-select");
        const itemName = document.getElementById("item-name");
        const itemPrice = document.getElementById("item-price");

        productSelect.value = "NOT_FOUND";
        itemName.value = "Old Name";
        itemPrice.value = "99";

        productSelect.dispatchEvent(new Event("change"));

        expect(itemName.value).toBe("");
        expect(itemPrice.value).toBe("");
    });

    it("renderOrders should render empty cells and fallback status class", () => {
        window.renderOrders([
            {
                orderID: "9001",
                orderDate: null,
                itemName: undefined,
                itemPrice: "not-number",
                qtyBought: null,
                shipping: "not-number",
                taxes: undefined,
                orderTotal: "not-number",
                orderStatus: "Unknown"
            }
        ]);

        const row = document.querySelector(".order-row");

        expect(row.textContent).toContain("9001");
        expect(row.textContent).toContain("Unknown");
    });
    it("addOrUpdate should add order by default when dataset mode is missing", () => {
        localStorage.setItem("bizTrackOrders", JSON.stringify([]));
        window.onload();

        const submitBtn = document.getElementById("submitBtn");
        delete submitBtn.dataset.mode;

        document.getElementById("order-id").value = "9001";
        document.getElementById("order-date").value = "2024-01-01";
        document.getElementById("product-select").value = "PD001";
        document.getElementById("item-name").value = "Baseball caps";
        document.getElementById("item-price").value = "25";
        document.getElementById("qty-bought").value = "2";
        document.getElementById("shipping").value = "3";
        document.getElementById("taxes").value = "4";
        document.getElementById("order-status").value = "Pending";

        window.addOrUpdate({
            preventDefault: vi.fn()
        });

        const storedOrders = JSON.parse(localStorage.getItem("bizTrackOrders"));

        expect(storedOrders.some(order => String(order.orderID) === "9001")).toBe(true);
    });

    it("search input Enter key should run search and hide unmatched rows", () => {
        window.renderOrders([
            {
                orderID: "1",
                orderDate: "2024-01-01",
                itemName: "Baseball Cap",
                itemPrice: 10,
                qtyBought: 1,
                shipping: 1,
                taxes: 1,
                orderTotal: 12,
                orderStatus: "Pending"
            },
            {
                orderID: "2",
                orderDate: "2024-01-02",
                itemName: "Water Bottle",
                itemPrice: 20,
                qtyBought: 1,
                shipping: 1,
                taxes: 1,
                orderTotal: 22,
                orderStatus: "Delivered"
            }
        ]);

        const rows = document.querySelectorAll("#tableBody tr");

        Object.defineProperty(rows[0], "innerText", {
            configurable: true,
            value: "Baseball Cap Pending"
        });

        Object.defineProperty(rows[1], "innerText", {
            configurable: true,
            value: "Water Bottle Delivered"
        });

        document.getElementById("searchInput").value = "baseball";

        document.getElementById("searchInput").dispatchEvent(
            new KeyboardEvent("keyup", {
                key: "Enter"
            })
        );

        expect(rows[0].style.display).toBe("table-row");
        expect(rows[1].style.display).toBe("none");
    });
});
