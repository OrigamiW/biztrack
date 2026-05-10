
function openSidebar() {
    var side = document.getElementById('sidebar');
    side.style.display = (side.style.display === "block") ? "none" : "block";
}

function closeSidebar() {
    document.getElementById('sidebar').style.display = 'none';
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

window.onload = function () {
    // Load products
    const storedProducts = localStorage.getItem("bizTrackProducts");
    if (storedProducts) {
        products = JSON.parse(storedProducts);
    }

    // Load orders
    const storedOrders = localStorage.getItem("bizTrackOrders");
    if (storedOrders) {
        orders = JSON.parse(storedOrders);
    } else {
        orders = [
        {
            orderID: "1001",
            orderDate: "2024-01-05",
            itemName: "Baseball caps",
            itemPrice: 25.00,
            qtyBought: 2,
            shipping: 2.50,
            taxes: 9.00,
            orderTotal: 61.50,
            orderStatus: "Pending"
        },
        {
            orderID: "1002",
            orderDate: "2024-03-05",
            itemName: "Water bottles",
            itemPrice: 17.00,
            qtyBought: 3,
            shipping: 3.50,
            taxes: 6.00,
            orderTotal: 60.50,
            orderStatus: "Processing"
        },
        {
            orderID: "1003",
            orderDate: "2024-02-05",
            itemName: "Tote bags",
            itemPrice: 20.00,
            qtyBought: 4,
            shipping: 2.50,
            taxes: 2.00,
            orderTotal: 84.50,
            orderStatus: "Shipped"
        },
        {
            orderID: "1004",
            orderDate: "2023-01-05",
            itemName: "Canvas prints",
            itemPrice: 55.00,
            qtyBought: 1,
            shipping: 2.50,
            taxes: 19.00,
            orderTotal: 76.50,
            orderStatus: "Delivered"
        },
        {
            orderID: "1005",
            orderDate: "2024-01-15",
            itemName: "Beanies",
            itemPrice: 15.00,
            qtyBought: 2,
            shipping: 3.90,
            taxes: 4.00,
            orderTotal: 37.90,
            orderStatus: "Pending"
        },
        ];

        localStorage.setItem("bizTrackOrders", JSON.stringify(orders));
    }
    populateProductSelect();
    renderOrders(orders);
}

function populateProductSelect() {
    const productSelect = document.getElementById("product-select");
    productSelect.innerHTML = '<option value="" disabled selected hidden>Choose a product</option>';

    products.forEach(product => {
        const option = document.createElement("option");
        option.value = product.prodID;
        option.textContent = `${product.prodName} - $${product.prodPrice.toFixed(2)}`;
        productSelect.appendChild(option);
    });

    // Add event listener to update price when product is selected
    productSelect.addEventListener("change", function() {
        const selectedProductId = this.value;
        if (selectedProductId) {
            const selectedProduct = products.find(p => p.prodID === selectedProductId);
            if (selectedProduct) {
                document.getElementById("item-name").value = selectedProduct.prodName;
                document.getElementById("item-price").value = selectedProduct.prodPrice;
            }
        } else {
            document.getElementById("item-name").value = "";
            document.getElementById("item-price").value = "";
        }
    });
}

function addOrUpdate(event) {
    let type = document.getElementById("submitBtn").textContent;
    if (type === 'Add') {
        newOrder(event);
    } else if (type === 'Update'){
        const orderID = document.getElementById("order-id").value;
        updateOrder(orderID);
    }
}


function newOrder(event) {
  event.preventDefault();
  const orderID = document.getElementById("order-id").value;
  const orderDate = document.getElementById("order-date").value;
  const itemName = document.getElementById("item-name").value;
  const itemPrice = parseFloat(document.getElementById("item-price").value);
  const qtyBought = parseInt(document.getElementById("qty-bought").value);
  const shipping = parseFloat(document.getElementById("shipping").value);
  const taxes = parseFloat(document.getElementById("taxes").value);
  const orderTotal = ((itemPrice * qtyBought) + shipping + taxes);
  const orderStatus = document.getElementById("order-status").value;
  const productSelect = document.getElementById("product-select").value;

  if (isDuplicateID(orderID, null)) {
    alert("Order ID already exists. Please use a unique ID.");
    return;
  }

  const order = {
    orderID,
    orderDate,
    itemName,
    itemPrice,
    qtyBought,
    shipping,
    taxes,
    orderTotal,
    orderStatus,
    productID: productSelect

  };

  orders.push(order);
  // Update product sales quantity
  updateProductSales(productSelect, qtyBought);

  renderOrders(orders);
  localStorage.setItem("bizTrackOrders", JSON.stringify(orders));

  document.getElementById("order-form").reset();
}

function updateProductSales(productID, quantity) {
  const productIndex = products.findIndex(p => p.prodID === productID);
  if (productIndex !== -1) {
    products[productIndex].prodSold += quantity;
    localStorage.setItem("bizTrackProducts", JSON.stringify(products));
  }
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
    statusText.textContent = order.orderStatus;

    statusDiv.appendChild(statusText);
    statusCell.appendChild(statusDiv);
    orderRow.appendChild(statusCell);

    const actionCell = document.createElement("td");
    actionCell.className = "action";

    actionCell.appendChild(
      createIconButton(
        `Edit order ${order.orderID}`,
        "edit-icon fa-solid fa-pen-to-square",
        () => editRow(order.orderID)
      )
    );

    actionCell.appendChild(
      createIconButton(
        `Delete order ${order.orderID}`,
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

  resultElement.textContent = `Total Revenue: $${totalRevenue.toFixed(2)}`;
}

function editRow(orderID) {
    const orderToEdit = orders.find(order => order.orderID === orderID);

    document.getElementById("order-id").value = orderToEdit.orderID;
    document.getElementById("order-date").value = orderToEdit.orderDate;
    document.getElementById("item-name").value = orderToEdit.itemName;
    document.getElementById("item-price").value = orderToEdit.itemPrice;
    document.getElementById("qty-bought").value = orderToEdit.qtyBought;
    document.getElementById("shipping").value = orderToEdit.shipping;
    document.getElementById("taxes").value = orderToEdit.taxes;
    document.getElementById("order-total").value = orderToEdit.orderTotal;
    document.getElementById("order-status").value = orderToEdit.orderStatus;

    document.getElementById("submitBtn").textContent = "Update";

    document.getElementById("order-form").style.display = "block";
}

function deleteOrder(orderID) {
  const indexToDelete = orders.findIndex(order => order.orderID === orderID);

  if (indexToDelete !== -1) {
      const orderToDelete = orders[indexToDelete];
      // Update product sales quantity by subtracting the deleted order's quantity
      if (orderToDelete.productID) {
          updateProductSales(orderToDelete.productID, -orderToDelete.qtyBought);
      }

      orders.splice(indexToDelete, 1);

      localStorage.setItem("bizTrackOrders", JSON.stringify(orders));

      renderOrders(orders);
  }
}

function updateOrder(orderID) {
    const indexToUpdate = orders.findIndex(order => order.orderID === orderID);

    if (indexToUpdate !== -1) {
        const oldOrder = orders[indexToUpdate];

        const itemPrice = parseFloat(document.getElementById("item-price").value);
        const qtyBought = parseInt(document.getElementById("qty-bought").value);
        const shipping = parseFloat(document.getElementById("shipping").value);
        const taxes = parseFloat(document.getElementById("taxes").value);
        const productSelect = document.getElementById("product-select").value;

        const updatedOrder = {
            orderID: document.getElementById("order-id").value,
            orderDate: document.getElementById("order-date").value,
            itemName: document.getElementById("item-name").value,
            itemPrice: itemPrice,
            qtyBought: qtyBought,
            shipping: shipping,
            taxes: taxes,
            orderTotal: ((itemPrice * qtyBought) + shipping + taxes),
            orderStatus: document.getElementById("order-status").value,
            productID: productSelect

        };

        if (isDuplicateID(updatedOrder.orderID, orderID)) {
            alert("Order ID already exists. Please use a unique ID.");
            return;
        }
        // Update product sales quantity
        if (oldOrder.productID) {
            // Subtract old quantity
            updateProductSales(oldOrder.productID, -oldOrder.qtyBought);
        }
        // Add new quantity
        updateProductSales(productSelect, qtyBought);

        orders[indexToUpdate] = updatedOrder;

        localStorage.setItem("bizTrackOrders", JSON.stringify(orders));

        renderOrders(orders);

        document.getElementById("order-form").reset();
        document.getElementById("submitBtn").textContent = "Add";
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


function exportToCSV() {
    const ordersToExport = orders.map(order => {
        return {
            orderID: order.orderID,
            orderDate: order.orderDate,
            itemName: order.itemName,
            itemPrice: order.itemPrice.toFixed(2),
            qtyBought: order.qtyBought,
            shipping: order.shipping.toFixed(2),
            taxes: order.taxes.toFixed(2),
            orderTotal: order.orderTotal.toFixed(2),
            orderStatus: order.orderStatus,
        };
    });
  
    const csvContent = generateCSV(ordersToExport);
  
    const blob = new Blob([csvContent], { type: 'text/csv' });
  
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'biztrack_order_table.csv';
  
    document.body.appendChild(link);
    link.click();
  
    document.body.removeChild(link);
}
  
function generateCSV(data) {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(order => Object.values(order).join(','));

    return `${headers}\n${rows.join('\n')}`;
}
