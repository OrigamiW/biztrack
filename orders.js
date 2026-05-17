function openSidebar() {
    const side = document.getElementById("sidebar");
    const toggleButton = document.querySelector(".sidebar-toggle");
    const closeButton = document.querySelector(".sidebar-close");
    const shouldOpen = side.style.display !== "block";

    side.style.display = shouldOpen ? "block" : "none";

    if (toggleButton) {
        toggleButton.setAttribute("aria-expanded", String(shouldOpen));
    }

    if (shouldOpen && closeButton) {
        closeButton.focus();
    }
}

function closeSidebar() {
    const side = document.getElementById("sidebar");
    const toggleButton = document.querySelector(".sidebar-toggle");

    side.style.display = "none";

    if (toggleButton) {
        toggleButton.setAttribute("aria-expanded", "false");
        toggleButton.focus();
    }
}


function openForm() {
    var form = document.getElementById("order-form")
    form.style.display = (form.style.display === "block") ? "none" : "block";
}

function closeForm() {
    document.getElementById("order-form").style.display = "none";
}

let orders = [];
let products = [];

function t(key) {
    if (typeof i18next !== "undefined" && i18next.isInitialized) {
        return i18next.t(key);
    }

    return key;
}

function translateOrderStatus(status) {
    const statusTranslations = {
        "Pending": "pending",
        "Processing": "processing",
        "Shipped": "shipped",
        "Delivered": "delivered"
    };

    return statusTranslations[status] ? t(statusTranslations[status]) : status;
}
const DEFAULT_PRODUCTS = [
    { prodID: "PD001", prodName: "Baseball caps", prodDesc: "Peace embroidered cap", prodCat: "Hats", prodPrice: 25.00, prodSold: 0 },
    { prodID: "PD002", prodName: "Water bottles", prodDesc: "Floral lotus printed bottle", prodCat: "Drinkware", prodPrice: 48.50, prodSold: 0 },
    { prodID: "PD003", prodName: "Sweatshirts", prodDesc: "Palestine sweater", prodCat: "Clothing", prodPrice: 17.50, prodSold: 0 },
    { prodID: "PD004", prodName: "Posters", prodDesc: "Vibes printed poster", prodCat: "Home decor", prodPrice: 12.00, prodSold: 0 },
    { prodID: "PD005", prodName: "Pillow cases", prodDesc: "Morrocan print pillow case", prodCat: "Accessories", prodPrice: 17.00, prodSold: 0 }
];

const DEFAULT_ORDER_PRODUCT_IDS = {
    "1001": "PD001",
    "1002": "PD002",
    "1003": "PD003",
    "1004": "PD004",
    "1005": "PD005"
};

function createDefaultOrder(orderID, orderDate, productID, qtyBought, shipping, taxes, orderStatus) {
    const product = DEFAULT_PRODUCTS.find(item => item.prodID === productID);
    const itemPrice = product ? Number(product.prodPrice) : 0;

    return {
        orderID,
        orderDate,
        productID,
        itemName: product ? product.prodName : "",
        itemPrice,
        qtyBought,
        shipping,
        taxes,
        orderTotal: (itemPrice * qtyBought) + shipping + taxes,
        orderStatus
    };
}

const DEFAULT_ORDERS = [
    createDefaultOrder("1001", "2024-01-05", "PD001", 2, 2.50, 9.00, "Pending"),
    createDefaultOrder("1002", "2024-03-05", "PD002", 3, 3.50, 6.00, "Processing"),
    createDefaultOrder("1003", "2024-02-05", "PD003", 4, 2.50, 2.00, "Shipped"),
    createDefaultOrder("1004", "2023-01-05", "PD004", 1, 2.50, 19.00, "Delivered"),
    createDefaultOrder("1005", "2024-01-15", "PD005", 2, 3.90, 4.00, "Pending")
];

function loadProducts() {
    const storedProducts = localStorage.getItem("bizTrackProducts");

    if (storedProducts) {
        try {
            return JSON.parse(storedProducts);
        } catch (error) {
            console.warn("Invalid product data in localStorage. Resetting products.", error);
        }
    }

    localStorage.setItem("bizTrackProducts", JSON.stringify(DEFAULT_PRODUCTS));
    return DEFAULT_PRODUCTS.map(product => ({ ...product }));
}

function loadOrders() {
    const storedOrders = localStorage.getItem("bizTrackOrders");

    if (storedOrders) {
        try {
            return JSON.parse(storedOrders);
        } catch (error) {
            console.warn("Invalid order data in localStorage. Resetting orders.", error);
        }
    }

    localStorage.setItem("bizTrackOrders", JSON.stringify(DEFAULT_ORDERS));
    return DEFAULT_ORDERS.map(order => ({ ...order }));
}

function saveOrders() {
    localStorage.setItem("bizTrackOrders", JSON.stringify(orders));
}

function saveProducts() {
    localStorage.setItem("bizTrackProducts", JSON.stringify(products));
}

function findProductForOrder(order) {
    if (order.productID) {
        const product = products.find(item => item.prodID === order.productID);
        if (product) return product;
    }

    const mappedProductID = DEFAULT_ORDER_PRODUCT_IDS[order.orderID];
    if (mappedProductID) {
        const mappedProduct = products.find(item => item.prodID === mappedProductID);
        if (mappedProduct) return mappedProduct;
    }

    return products.find(item =>
        item.prodName.toLowerCase() === String(order.itemName || "").toLowerCase()
    );
}

function normaliseOrdersWithProducts() {
    orders = orders.map(order => {
        const product = findProductForOrder(order);
        const qtyBought = Number(order.qtyBought) || 0;
        const shipping = Number(order.shipping) || 0;
        const taxes = Number(order.taxes) || 0;
        const itemPrice = product ? Number(product.prodPrice) : Number(order.itemPrice) || 0;

        return {
            ...order,
            productID: product ? product.prodID : order.productID || "",
            itemName: product ? product.prodName : order.itemName,
            itemPrice,
            qtyBought,
            shipping,
            taxes,
            orderTotal: (itemPrice * qtyBought) + shipping + taxes
        };
    });

    saveOrders();
}

function syncProductSalesFromOrders() {
    const soldByProduct = new Map(products.map(product => [product.prodID, 0]));

    orders.forEach(order => {
        if (!order.productID) return;

        const quantity = Number(order.qtyBought) || 0;
        const currentQuantity = soldByProduct.get(order.productID) || 0;
        soldByProduct.set(order.productID, currentQuantity + quantity);
    });

    products = products.map(product => ({
        ...product,
        prodSold: soldByProduct.get(product.prodID) || 0
    }));

    saveProducts();
}

window.onload = function () {
    products = loadProducts();
    orders = loadOrders();

    normaliseOrdersWithProducts();
    syncProductSalesFromOrders();
    populateProductSelect();
    renderOrders(orders);

    if (typeof i18next !== "undefined") {
        i18next.on("languageChanged", function () {
            populateProductSelect();
            renderOrders(orders);
        });
    }
}

function populateProductSelect() {
    const productSelect = document.getElementById("product-select");
    productSelect.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.hidden = true;
    placeholder.textContent = t("chooseProduct");
    productSelect.appendChild(placeholder);

    products.forEach(product => {
        const option = document.createElement("option");
        option.value = product.prodID;
        option.textContent = `${product.prodName} - $${Number(product.prodPrice).toFixed(2)}`;
        productSelect.appendChild(option);
    });

    productSelect.onchange = function() {
        const selectedProductId = this.value;
        const selectedProduct = products.find(p => p.prodID === selectedProductId);

        document.getElementById("item-name").value = selectedProduct ? selectedProduct.prodName : "";
        document.getElementById("item-price").value = selectedProduct ? selectedProduct.prodPrice : "";
    };
}

function addOrUpdate(event) {
    let type = document.getElementById("submitBtn").dataset.mode || "add";
    if (type === "add") {
        newOrder(event);
    } else if (type === "update"){
        const orderID = document.getElementById("order-id").value;
        updateOrder(orderID);
    }
}


function newOrder(event) {
    event.preventDefault();

    const orderID = document.getElementById("order-id").value;
    const orderDate = document.getElementById("order-date").value;
    const productID = document.getElementById("product-select").value;
    const selectedProduct = products.find(product => product.prodID === productID);
    const qtyBought = parseInt(document.getElementById("qty-bought").value, 10);
    const shipping = parseFloat(document.getElementById("shipping").value);
    const taxes = parseFloat(document.getElementById("taxes").value);
    const orderStatus = document.getElementById("order-status").value;

    if (!selectedProduct) {
        alert(t("chooseProduct"));
        return;
    }

    if (isDuplicateID(orderID, null)) {
        alert(t("duplicateOrderId"));
        return;
    }

    const itemPrice = Number(selectedProduct.prodPrice);
    const order = {
        orderID,
        orderDate,
        productID,
        itemName: selectedProduct.prodName,
        itemPrice,
        qtyBought,
        shipping,
        taxes,
        orderTotal: (itemPrice * qtyBought) + shipping + taxes,
        orderStatus
    };

    orders.push(order);
    saveOrders();
    syncProductSalesFromOrders();
    renderOrders(orders);

    document.getElementById("order-form").reset();
}




function createTextCell(value, className = "") {
    const td = document.createElement("td");
    td.textContent = value == null ? "" : String(value);

    if (className) {
        td.className = className;
    }

    return td;
}

function createIconButton(title, iconClass, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "icon-button";
    button.title = title;
    button.setAttribute("aria-label", title);

    const icon = document.createElement("i");
    icon.className = iconClass;
    icon.setAttribute("aria-hidden", "true");

    button.appendChild(icon);
    button.addEventListener("click", onClick);

    return button;
}

function renderOrders(orders) {
    const orderTableBody = document.getElementById("tableBody");
    orderTableBody.replaceChildren();

    const statusMap = {
        Pending: "pending",
        Processing: "processing",
        Shipped: "shipped",
        Delivered: "delivered"
    };

    orders.forEach(order => {
        const orderRow = document.createElement("tr");
        orderRow.className = "order-row";

        orderRow.dataset.orderID = order.orderID;
        orderRow.dataset.orderDate = order.orderDate;
        orderRow.dataset.itemName = order.itemName;
        orderRow.dataset.itemPrice = order.itemPrice;
        orderRow.dataset.qtyBought = order.qtyBought;
        orderRow.dataset.shipping = order.shipping;
        orderRow.dataset.taxes = order.taxes;
        orderRow.dataset.orderTotal = order.orderTotal;
        orderRow.dataset.orderStatus = order.orderStatus;
        orderRow.dataset.productID = order.productID || "";

        const formattedPrice = typeof order.itemPrice === "number" ? `$${order.itemPrice.toFixed(2)}` : "";
        const formattedShipping = typeof order.shipping === "number" ? `$${order.shipping.toFixed(2)}` : "";
        const formattedTaxes = typeof order.taxes === "number" ? `$${order.taxes.toFixed(2)}` : "";
        const formattedTotal = typeof order.orderTotal === "number" ? `$${order.orderTotal.toFixed(2)}` : "";

        orderRow.appendChild(createTextCell(order.orderID));
        orderRow.appendChild(createTextCell(order.orderDate));
        orderRow.appendChild(createTextCell(order.itemName));
        orderRow.appendChild(createTextCell(formattedPrice));
        orderRow.appendChild(createTextCell(order.qtyBought));
        orderRow.appendChild(createTextCell(formattedShipping));
        orderRow.appendChild(createTextCell(formattedTaxes));
        orderRow.appendChild(createTextCell(formattedTotal, "order-total"));

        const statusCell = document.createElement("td");
        const statusDiv = document.createElement("div");
        statusDiv.className = `status ${statusMap[order.orderStatus] || ""}`;

        const statusText = document.createElement("span");
        statusText.textContent = translateOrderStatus(order.orderStatus);

        statusDiv.appendChild(statusText);
        statusCell.appendChild(statusDiv);
        orderRow.appendChild(statusCell);

        const actionCell = document.createElement("td");
        actionCell.className = "action";

        actionCell.appendChild(
            createIconButton(
                `${t("edit")} ${t("orders")} ${order.orderID}`,
                "edit-icon fa-solid fa-pen-to-square",
                () => editRow(order.orderID)
            )
        );

        actionCell.appendChild(
            createIconButton(
                `${t("delete")} ${t("orders")} ${order.orderID}`,
                "delete-icon fas fa-trash-alt",
                () => deleteOrder(order.orderID)
            )
        );

        orderRow.appendChild(actionCell);
        orderTableBody.appendChild(orderRow);
    });

    displayRevenue();
}

function displayRevenue() {
    const resultElement = document.getElementById("total-revenue");
    const totalRevenue = orders.reduce((total, order) => total + order.orderTotal, 0);

    resultElement.textContent = `${t("totalRevenue")}: $${totalRevenue.toFixed(2)}`;
}

function editRow(orderID) {
    const orderToEdit = orders.find(order => order.orderID === orderID);
    if (!orderToEdit) return;

    const productSelect = document.getElementById("product-select");

    document.getElementById("order-id").value = orderToEdit.orderID;
    document.getElementById("order-date").value = orderToEdit.orderDate;
    productSelect.value = orderToEdit.productID || "";
    document.getElementById("item-name").value = orderToEdit.itemName;
    document.getElementById("item-price").value = orderToEdit.itemPrice;
    document.getElementById("qty-bought").value = orderToEdit.qtyBought;
    document.getElementById("shipping").value = orderToEdit.shipping;
    document.getElementById("taxes").value = orderToEdit.taxes;
    document.getElementById("order-total").value = orderToEdit.orderTotal;
    document.getElementById("order-status").value = orderToEdit.orderStatus;

    document.getElementById("submitBtn").textContent = t("update");
    document.getElementById("submitBtn").dataset.mode = "update";

    document.getElementById("order-form").style.display = "block";
}

function deleteOrder(orderID) {
    const indexToDelete = orders.findIndex(order => order.orderID === orderID);

    if (indexToDelete !== -1) {
        orders.splice(indexToDelete, 1);
        saveOrders();
        syncProductSalesFromOrders();
        renderOrders(orders);
    }
}

function updateOrder(orderID) {
    const indexToUpdate = orders.findIndex(order => order.orderID === orderID);

    if (indexToUpdate !== -1) {
        const productID = document.getElementById("product-select").value;
        const selectedProduct = products.find(product => product.prodID === productID);
        const qtyBought = parseInt(document.getElementById("qty-bought").value, 10);
        const shipping = parseFloat(document.getElementById("shipping").value);
        const taxes = parseFloat(document.getElementById("taxes").value);

        if (!selectedProduct) {
            alert(t("chooseProduct"));
            return;
        }

        const updatedOrder = {
            orderID: document.getElementById("order-id").value,
            orderDate: document.getElementById("order-date").value,
            productID,
            itemName: selectedProduct.prodName,
            itemPrice: Number(selectedProduct.prodPrice),
            qtyBought,
            shipping,
            taxes,
            orderTotal: (Number(selectedProduct.prodPrice) * qtyBought) + shipping + taxes,
            orderStatus: document.getElementById("order-status").value
        };

        if (isDuplicateID(updatedOrder.orderID, orderID)) {
            alert(t("duplicateOrderId"));
            return;
        }

        orders[indexToUpdate] = updatedOrder;
        saveOrders();
        syncProductSalesFromOrders();
        renderOrders(orders);

        document.getElementById("order-form").reset();
        document.getElementById("submitBtn").textContent = t("add");
        document.getElementById("submitBtn").dataset.mode = "add";
    }
}

function isDuplicateID(orderID, currentID) {
    return orders.some(order => order.orderID === orderID && order.orderID !== currentID);
}

function sortTable(column) {
    const tbody = document.getElementById("tableBody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    const isNumeric = column === "itemPrice" || column === "qtyBought" || column === "shipping"|| column === "taxes"|| column === "orderTotal";

    const sortedRows = rows.sort((a, b) => {
        const aValue = isNumeric ? parseFloat(a.dataset[column]) : a.dataset[column];
        const bValue = isNumeric ? parseFloat(b.dataset[column]) : b.dataset[column];

        if (typeof aValue === "string" && typeof bValue === "string") {
            // Case-insensitive string comparison for text columns
            return aValue.localeCompare(bValue, undefined, { sensitivity: "base" });
        } else {
            return aValue - bValue;
        }
    });

    rows.forEach(row => tbody.removeChild(row));

    sortedRows.forEach(row => tbody.appendChild(row));
}

document.getElementById("searchInput").addEventListener("keyup", function(event) {
    if (event.key === "Enter") {
        performSearch();
    }
});


function performSearch() {
    const searchInput = document.getElementById("searchInput").value.toLowerCase();
    const rows = document.querySelectorAll(".order-row");

    rows.forEach(row => {
        const visible = row.innerText.toLowerCase().includes(searchInput);
        row.style.display = visible ? "table-row" : "none";
    });
}


const orderCsvColumns = [
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

function escapeCsvCell(value) {
    if (value === null || value === undefined) {
        return "";
    }

    let cell = String(value);

    if (/^[=+\-@]/.test(cell)) {
        cell = "'" + cell;
    }

    if (/[",\r\n]/.test(cell)) {
        cell = '"' + cell.replace(/"/g, '""') + '"';
    }

    return cell;
}

function formatOrderCsvValue(order, key) {
    const value = order[key];

    if (["itemPrice", "shipping", "taxes", "orderTotal"].includes(key)) {
        const numberValue = Number(value);
        return Number.isFinite(numberValue) ? numberValue.toFixed(2) : "";
    }

    return value;
}

function generateCSV(data, columns, formatValue) {
    const headerRow = columns
        .map(column => escapeCsvCell(column.header))
        .join(",");

    if (!Array.isArray(data) || data.length === 0) {
        return "\uFEFF" + headerRow + "\r\n";
    }

    const rows = data.map(item =>
        columns
            .map(column => {
                const rawValue = formatValue
                    ? formatValue(item, column.key)
                    : item[column.key];

                return escapeCsvCell(rawValue);
            })
            .join(",")
    );

    return "\uFEFF" + [headerRow, ...rows].join("\r\n");
}

function exportToCSV() {
    const csvContent = generateCSV(orders, orderCsvColumns, formatOrderCsvValue);

    const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    const url = window.URL.createObjectURL(blob);

    link.href = url;
    link.download = "biztrack_order_table.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
}

document.addEventListener("i18nReady", function () {
    populateProductSelect();
    renderOrders(orders);
});

window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.openForm = openForm;
window.closeForm = closeForm;
window.addOrUpdate = addOrUpdate;
window.newOrder = newOrder;
window.editRow = editRow;
window.updateOrder = updateOrder;
window.deleteOrder = deleteOrder;
window.displayRevenue = displayRevenue;
window.isDuplicateID = isDuplicateID;
window.renderOrders = renderOrders;
window.sortTable = sortTable;
window.performSearch = performSearch;
window.generateCSV = generateCSV;
window.escapeCsvCell = escapeCsvCell;
window.exportToCSV = exportToCSV;
window.formatOrderCsvValue = formatOrderCsvValue;
window.translateOrderStatus = translateOrderStatus;
window.populateProductSelect = populateProductSelect;
window.syncProductSalesFromOrders = syncProductSalesFromOrders;