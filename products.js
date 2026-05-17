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
    var form = document.getElementById("product-form")
    form.style.display = (form.style.display === "block") ? "none" : "block";
}

function closeForm() {
    document.getElementById("product-form").style.display = "none";
    document.getElementById("product-id").disabled = false;
    document.getElementById("submitBtn").textContent = t("add");
    document.getElementById("submitBtn").dataset.mode = "add";
}


let products = [];

function t(key) {
    if (typeof i18next !== "undefined" && i18next.isInitialized) {
        return i18next.t(key);
    }

    return key;
}

function translateProductName(name) {
    const productNameTranslations = {
        "Baseball caps": "baseballCaps",
        "Snapbacks": "snapbacks",
        "Beanies": "beanies",
        "Bucket hats": "bucketHats",
        "Mugs": "mugs",
        "Water bottles": "waterBottles",
        "Tumblers": "tumblers",
        "T-shirts": "tshirts",
        "Sweatshirts": "sweatshirts",
        "Hoodies": "hoodies",
        "Pillow cases": "pillowCases",
        "Tote bags": "toteBags",
        "Stickers": "stickers",
        "Posters": "posters",
        "Framed posters": "framedPosters",
        "Canvas prints": "canvasPrints"
    };

    return productNameTranslations[name] ? t(productNameTranslations[name]) : name;
}

function translateProductCategory(category) {
    const productCategoryTranslations = {
        "Hats": "hats",
        "Drinkware": "drinkware",
        "Clothing": "clothing",
        "Accessories": "accessories",
        "Home decor": "homeDecor"
    };

    return productCategoryTranslations[category] ? t(productCategoryTranslations[category]) : category;
}
function saveProducts() {
    localStorage.setItem("bizTrackProducts", JSON.stringify(products));
}

function getLinkedOrders() {
    const storedOrders = localStorage.getItem("bizTrackOrders");

    if (!storedOrders) {
        return [];
    }

    try {
        return JSON.parse(storedOrders);
    } catch (error) {
        console.warn("Invalid order data in localStorage.", error);
        return [];
    }
}

function productHasLinkedOrders(prodID) {
    return getLinkedOrders().some(order => order.productID === prodID);
}

function syncProductSalesFromOrders() {
    const orders = getLinkedOrders();
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

function init() {
    const storedProducts = localStorage.getItem("bizTrackProducts");
    if (storedProducts) {
        products = JSON.parse(storedProducts);
    } else {
        products = [
            {
                prodID: "PD001",
                prodName: "Baseball caps",
                prodDesc: "Peace embroidered cap",
                prodCat: "Hats",
                prodPrice: 25.00,
                prodSold: 0
            },
            {
                prodID: "PD002",
                prodName: "Water bottles",
                prodDesc: "Floral lotus printed bottle",
                prodCat: "Drinkware",
                prodPrice: 48.50,
                prodSold: 0
            },
            {
                prodID: "PD003",
                prodName: "Sweatshirts",
                prodDesc: "Palestine sweater",
                prodCat: "Clothing",
                prodPrice: 17.50,
                prodSold: 0
            },
            {
                prodID: "PD004",
                prodName: "Posters",
                prodDesc: "Vibes printed poster",
                prodCat: "Home decor",
                prodPrice: 12.00,
                prodSold: 0
            },
            {
                prodID: "PD005",
                prodName: "Pillow cases",
                prodDesc: "Morrocan print pillow case",
                prodCat: "Accessories",
                prodPrice: 17.00,
                prodSold: 0
            },
        ];

        localStorage.setItem("bizTrackProducts", JSON.stringify(products));
    }

    syncProductSalesFromOrders();
    renderProducts(products);

    if (typeof i18next !== "undefined") {
        i18next.on("languageChanged", function () {
            renderProducts(products);
        });
    }
}

function addOrUpdate(event) {
    let type = document.getElementById("submitBtn").dataset.mode || "add";
    if (type === "add") {
        newProduct(event);
    } else if (type === "update"){
        const prodID = document.getElementById("product-id").value;
        updateProduct(prodID);
    }
}

function newProduct(event) {
    event.preventDefault();
    const prodID = document.getElementById("product-id").value;
    const prodName = document.getElementById("product-name").value;
    const prodDesc = document.getElementById("product-desc").value;
    const prodCat = document.getElementById("product-cat").value;
    const prodPrice = parseFloat(document.getElementById("product-price").value);
    const prodSold = 0;

    if (isDuplicateID(prodID, null)) {
        alert(t("duplicateProductId"));
        return;
    }

    const product = {
        prodID,
        prodName,
        prodDesc,
        prodCat,
        prodPrice,
        prodSold,
    };

    products.push(product);

    saveProducts();
    renderProducts(products);

    document.getElementById("product-form").reset();
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

function renderProducts(products) {
    const prodTableBody = document.getElementById("tableBody");
    prodTableBody.replaceChildren();

    const prodToRender = products;

    prodToRender.forEach(product => {
        const prodRow = document.createElement("tr");
        prodRow.className = "product-row";

        prodRow.dataset.prodID = product.prodID;
        prodRow.dataset.prodName = product.prodName;
        prodRow.dataset.prodDesc = product.prodDesc;
        prodRow.dataset.prodCat = product.prodCat;
        prodRow.dataset.prodPrice = product.prodPrice;
        prodRow.dataset.prodSold = product.prodSold;

        prodRow.appendChild(createTextCell(product.prodID));
        prodRow.appendChild(createTextCell(translateProductName(product.prodName)));
        prodRow.appendChild(createTextCell(product.prodDesc));
        prodRow.appendChild(createTextCell(translateProductCategory(product.prodCat)));
        prodRow.appendChild(createTextCell(`$${Number(product.prodPrice).toFixed(2)}`));
        prodRow.appendChild(createTextCell(product.prodSold));

        const actionCell = document.createElement("td");
        actionCell.className = "action";

        actionCell.appendChild(
            createIconButton(
                `${t("edit")} ${t("products")} ${product.prodID}`,
                "edit-icon fa-solid fa-pen-to-square",
                () => editRow(product.prodID)
            )
        );

        actionCell.appendChild(
            createIconButton(
                `${t("delete")} ${t("products")} ${product.prodID}`,
                "delete-icon fas fa-trash-alt",
                () => deleteProduct(product.prodID)
            )
        );

        prodRow.appendChild(actionCell);
        prodTableBody.appendChild(prodRow);
    });
}

function editRow(prodID) {
    const productToEdit = products.find(product => product.prodID === prodID);

    document.getElementById("product-id").value = productToEdit.prodID;
    document.getElementById("product-id").disabled = true;
    document.getElementById("product-name").value = productToEdit.prodName;
    document.getElementById("product-desc").value = productToEdit.prodDesc;
    document.getElementById("product-cat").value = productToEdit.prodCat;
    document.getElementById("product-price").value = productToEdit.prodPrice;
    document.getElementById("product-sold").value = productToEdit.prodSold;

    document.getElementById("submitBtn").textContent = t("update");
    document.getElementById("submitBtn").dataset.mode = "update";

    document.getElementById("product-form").style.display = "block";
}

function deleteProduct(prodID) {
    if (productHasLinkedOrders(prodID)) {
        alert(t("productLinkedToOrders"));
        return;
    }

    const indexToDelete = products.findIndex(product => product.prodID === prodID);

    if (indexToDelete !== -1) {
        products.splice(indexToDelete, 1);
        saveProducts();
        renderProducts(products);
    }
}

function updateProduct(prodID) {
    const indexToUpdate = products.findIndex(product => product.prodID === prodID);

    if (indexToUpdate !== -1) {
        const updatedProduct = {
            prodID,
            prodName: document.getElementById("product-name").value,
            prodDesc: document.getElementById("product-desc").value,
            prodCat: document.getElementById("product-cat").value,
            prodPrice: parseFloat(document.getElementById("product-price").value),
            prodSold: products[indexToUpdate].prodSold
        };

        products[indexToUpdate] = updatedProduct;
        syncProductSalesFromOrders();
        saveProducts();
        renderProducts(products);

        document.getElementById("product-form").reset();
        document.getElementById("product-id").disabled = false;
        document.getElementById("submitBtn").textContent = t("add");
        document.getElementById("submitBtn").dataset.mode = "add";
    }
}

function isDuplicateID(prodID, currentID) {
    return products.some(product => product.prodID === prodID && product.prodID !== currentID);
}

function sortTable(column) {
    const tbody = document.getElementById("tableBody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    const isNumeric = column === "prodPrice" || column === "prodSold";

    const sortedRows = rows.sort((a, b) => {
        const aValue = isNumeric ? parseFloat(a.dataset[column]) : a.dataset[column];
        const bValue = isNumeric ? parseFloat(b.dataset[column]) : b.dataset[column];

        if (typeof aValue === "string" && typeof bValue === "string") {
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
    const rows = document.querySelectorAll(".product-row");

    rows.forEach(row => {
        const visible = row.innerText.toLowerCase().includes(searchInput);
        row.style.display = visible ? "table-row" : "none";
    });
}


const productCsvColumns = [
    { key: "prodID", header: "Product ID" },
    { key: "prodName", header: "Product Name" },
    { key: "prodDesc", header: "Product Description" },
    { key: "prodCat", header: "Product Category" },
    { key: "prodPrice", header: "Product Price" },
    { key: "prodSold", header: "Quantity Sold" }
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

function formatProductCsvValue(product, key) {
    const value = product[key];

    if (key === "prodPrice") {
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
    const csvContent = generateCSV(products, productCsvColumns, formatProductCsvValue);

    const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    const url = window.URL.createObjectURL(blob);

    link.href = url;
    link.download = "biztrack_product_table.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
}

document.addEventListener("i18nReady", function () {
    renderProducts(products);
});

document.addEventListener("DOMContentLoaded", function () {
    init();
});

window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.openForm = openForm;
window.closeForm = closeForm;
window.init = init;
window.addOrUpdate = addOrUpdate;
window.newProduct = newProduct;
window.editRow = editRow;
window.deleteProduct = deleteProduct;
window.updateProduct = updateProduct;
window.isDuplicateID = isDuplicateID;
window.renderProducts = renderProducts;
window.sortTable = sortTable;
window.performSearch = performSearch;
window.generateCSV = generateCSV;
window.escapeCsvCell = escapeCsvCell;
window.exportToCSV = exportToCSV;
window.formatProductCsvValue = formatProductCsvValue;
window.translateProductCategory = translateProductCategory;
window.productHasLinkedOrders = productHasLinkedOrders;
window.syncProductSalesFromOrders = syncProductSalesFromOrders;