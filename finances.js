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
    var form = document.getElementById("transaction-form")
    form.style.display = (form.style.display === "block") ? "none" : "block";
}

function closeForm() {
    document.getElementById("transaction-form").style.display = "none";
}


let transactions = [];
let serialNumberCounter;

function t(key) {
    if (typeof i18next !== "undefined" && i18next.isInitialized) {
        return i18next.t(key);
    }

    return key;
}

function translateExpenseCategory(category) {
    const categoryTranslations = {
        "Rent": "rent",
        "Utilities": "utilities",
        "Supplies": "supplies",
        "Order Fulfillment": "orderFulfillment",
        "Miscellaneous": "miscellaneous"
    };

    return categoryTranslations[category] ? t(categoryTranslations[category]) : category;
}

window.onload = function () {
    const storedTransactions = localStorage.getItem("bizTrackTransactions");
    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    } else {
        transactions = [
            {
                trID: 1,
                trDate: "2024-01-05",
                trCategory: "Rent",
                trAmount: 100.00,
                trNotes: "January Rent"
            },
            {
                trID: 2,
                trDate: "2024-01-15",
                trCategory: "Order Fulfillment",
                trAmount: 35.00,
                trNotes: "Order #1005"
            },
            {
                trID: 3,
                trDate: "2024-01-08",
                trCategory: "Utilities",
                trAmount: 120.00,
                trNotes: "Internet"
            },
            {
                trID: 4,
                trDate: "2024-02-05",
                trCategory: "Supplies",
                trAmount: 180.00,
                trNotes: "Embroidery Machine"
            },
            {
                trID: 5,
                trDate: "2024-01-25",
                trCategory: "Miscellaneous",
                trAmount: 20.00,
                trNotes: "Pizza"
            },
        ];

        serialNumberCounter = transactions.length + 1

        localStorage.setItem("bizTrackTransactions", JSON.stringify(transactions));
    }

    renderTransactions(transactions);

    if (typeof i18next !== "undefined") {
        i18next.on("languageChanged", function () {
            renderTransactions(transactions);
        });
    }
}

function addOrUpdate(event) {
    let type = document.getElementById("submitBtn").dataset.mode || "add";

    if (type === "add") {
        newTransaction(event);
    } else if (type === "update"){
        const trId = document.getElementById("tr-id").value;
        updateTransaction(+trId); // convert to number
    }
}


function newTransaction(event) {
    event.preventDefault();
    const trDate = document.getElementById("tr-date").value;
    const trCategory = document.getElementById("tr-category").value;
    const trAmount = parseFloat(document.getElementById("tr-amount").value);
    const trNotes = document.getElementById("tr-notes").value;

    serialNumberCounter = transactions.length + 1;
    let trID = serialNumberCounter;

    const transaction = {
        trID,
        trDate,
        trCategory,
        trAmount,
        trNotes,
    };

    transactions.push(transaction);

    renderTransactions(transactions);
    localStorage.setItem("bizTrackTransactions", JSON.stringify(transactions));

    serialNumberCounter++;
    displayExpenses();

    document.getElementById("transaction-form").reset();
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

function renderTransactions(transactions) {
    const transactionTableBody = document.getElementById("tableBody");
    transactionTableBody.replaceChildren();

    transactions.forEach(transaction => {
        const transactionRow = document.createElement("tr");
        transactionRow.className = "transaction-row";

        transactionRow.dataset.trID = transaction.trID;
        transactionRow.dataset.trDate = transaction.trDate;
        transactionRow.dataset.trCategory = transaction.trCategory;
        transactionRow.dataset.trAmount = transaction.trAmount;
        transactionRow.dataset.trNotes = transaction.trNotes;

        const formattedAmount = typeof transaction.trAmount === "number" ? `$${transaction.trAmount.toFixed(2)}` : "";

        transactionRow.appendChild(createTextCell(transaction.trID));
        transactionRow.appendChild(createTextCell(transaction.trDate));
        transactionRow.appendChild(createTextCell(translateExpenseCategory(transaction.trCategory)));
        transactionRow.appendChild(createTextCell(formattedAmount, "tr-amount"));
        transactionRow.appendChild(createTextCell(transaction.trNotes));

        const actionCell = document.createElement("td");
        actionCell.className = "action";

        actionCell.appendChild(
            createIconButton(
                `${t("edit")} ${t("expenses")} ${transaction.trID}`,
                "edit-icon fa-solid fa-pen-to-square",
                () => editRow(transaction.trID)
            )
        );

        actionCell.appendChild(
            createIconButton(
                `${t("delete")} ${t("expenses")} ${transaction.trID}`,
                "delete-icon fas fa-trash-alt",
                () => deleteTransaction(transaction.trID)
            )
        );

        transactionRow.appendChild(actionCell);
        transactionTableBody.appendChild(transactionRow);
    });

    displayExpenses();
}

function displayExpenses() {
    const resultElement = document.getElementById("total-expenses");
    const totalExpenses = transactions.reduce((total, transaction) => total + transaction.trAmount, 0);

    resultElement.textContent = `${t("totalExpenses")}: $${totalExpenses.toFixed(2)}`;
}

function editRow(trID) {
    const trToEdit = transactions.find(transaction => transaction.trID == trID);

    document.getElementById("tr-id").value = trToEdit.trID;
    document.getElementById("tr-date").value = trToEdit.trDate;
    document.getElementById("tr-category").value = trToEdit.trCategory;
    document.getElementById("tr-amount").value = trToEdit.trAmount;
    document.getElementById("tr-notes").value = trToEdit.trNotes;

    document.getElementById("submitBtn").textContent = t("update");
    document.getElementById("submitBtn").dataset.mode = "update";

    document.getElementById("transaction-form").style.display = "block";
}

function deleteTransaction(trID) {
    const indexToDelete = transactions.findIndex(transaction => transaction.trID == trID);

    if (indexToDelete !== -1) {
        transactions.splice(indexToDelete, 1);

        localStorage.setItem("bizTrackTransactions", JSON.stringify(transactions));

        renderTransactions(transactions);
    }
}

function updateTransaction(trID) {
    const indexToUpdate = transactions.findIndex(transaction => transaction.trID === trID);

    if (indexToUpdate !== -1) {
        const updatedTransaction = {
            trID: trID,
            trDate: document.getElementById("tr-date").value,
            trCategory: document.getElementById("tr-category").value,
            trAmount: parseFloat(document.getElementById("tr-amount").value),
            trNotes: document.getElementById("tr-notes").value,
        };

        transactions[indexToUpdate] = updatedTransaction;

        localStorage.setItem("bizTrackTransactions", JSON.stringify(transactions));

        renderTransactions(transactions);

        document.getElementById("transaction-form").reset();
        document.getElementById("submitBtn").textContent = t("add");
        document.getElementById("submitBtn").dataset.mode = "add";
    }
}

function sortTable(column) {
    const tbody = document.getElementById("tableBody");
    const rows = Array.from(tbody.querySelectorAll("tr"));

    const isNumeric = column === "trID" || column === "trAmount";

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
    const rows = document.querySelectorAll(".transaction-row");

    rows.forEach(row => {
        const visible = row.innerText.toLowerCase().includes(searchInput);
        row.style.display = visible ? "table-row" : "none";
    });
}


const financeCsvColumns = [
    { key: "trID", header: "Transaction ID" },
    { key: "trDate", header: "Transaction Date" },
    { key: "trCategory", header: "Transaction Category" },
    { key: "trAmount", header: "Transaction Amount" },
    { key: "trNotes", header: "Transaction Notes" }
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

function formatFinanceCsvValue(transaction, key) {
    const value = transaction[key];

    if (key === "trAmount") {
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
    const csvContent = generateCSV(transactions, financeCsvColumns, formatFinanceCsvValue);

    const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;"
    });

    const link = document.createElement("a");
    const url = window.URL.createObjectURL(blob);

    link.href = url;
    link.download = "biztrack_expense_table.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
}

document.addEventListener("i18nReady", function () {
    renderTransactions(transactions);
});

window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;
window.openForm = openForm;
window.closeForm = closeForm;
window.addOrUpdate = addOrUpdate;
window.newTransaction = newTransaction;
window.editRow = editRow;
window.updateTransaction = updateTransaction;
window.deleteTransaction = deleteTransaction;
window.displayExpenses = displayExpenses;
window.renderTransactions = renderTransactions;
window.sortTable = sortTable;
window.performSearch = performSearch;
window.generateCSV = generateCSV;
window.escapeCsvCell = escapeCsvCell;
window.exportToCSV = exportToCSV;
window.formatFinanceCsvValue = formatFinanceCsvValue;
window.translateExpenseCategory = translateExpenseCategory;