// =====================================================
// JIMS INVOICE MANAGEMENT SYSTEM
// PART 1 OF 4
// DATABASE, NAVIGATION, DASHBOARD, CUSTOMERS, PRODUCTS
// =====================================================

const DB_KEY = "jims_invoice_system";
const SETTINGS_KEY = "jims_app_settings";

let db = JSON.parse(localStorage.getItem(DB_KEY)) || {
    customers: [],
    products: [],
    invoices: [],
    packingLists: []
};

db.packingLists ||= [];

function saveData() {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// ================= UTILITY FUNCTIONS =================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function money(value) {
    return Number(value || 0).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    });
}

function inputStyle() {
    return "padding:11px;border:1px solid #e1e5ed;border-radius:8px;width:260px;max-width:100%;margin:15px 0";
}

function tableStyle() {
    return "width:100%;border-collapse:collapse;text-align:left;min-width:650px";
}

// ================= NAVIGATION =================

function showPage(page) {

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle("active", link.dataset.page === page);
    });

    const titles = {
        dashboard: "Dashboard",
        customers: "Customers",
        products: "Products",
        invoices: "Invoices",
        packing: "Packing Lists",
        analytics: "Analytics",
        settings: "Settings"
    };

    document.getElementById("page-title").textContent =
        titles[page] || "Dashboard";

    if (page === "dashboard") renderDashboard();
    else if (page === "customers") renderCustomers();
    else if (page === "products") renderProducts();
    else if (page === "invoices") renderInvoices();
    else if (page === "packing") renderPackingLists();
    else if (page === "analytics") renderAnalytics();
    else if (page === "settings") renderSettings();
}

// ================= DASHBOARD =================

function renderDashboard() {

    const revenue = db.invoices.reduce(
        (s, i) => s + Number(i.total || 0), 0
    );

    document.getElementById("page-content").innerHTML = `

        <div class="stats-grid">

            <div class="stat-card">
                <p>Total Customers</p>
                <h2>${db.customers.length}</h2>
                <small>Registered customers</small>
            </div>

            <div class="stat-card">
                <p>Total Products</p>
                <h2>${db.products.length}</h2>
                <small>Products in inventory</small>
            </div>

            <div class="stat-card">
                <p>Total Invoices</p>
                <h2>${db.invoices.length}</h2>
                <small>Generated invoices</small>
            </div>

            <div class="stat-card">
                <p>Total Revenue</p>
                <h2>${money(revenue)}</h2>
                <small>Recorded invoice revenue</small>
            </div>

        </div>

        <div class="dashboard-grid">

            <div class="panel">
                <h3>Revenue Overview</h3>
                <div class="chart-container">
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>

            <div class="panel">
                <h3>Business Summary</h3>

                <p style="margin-bottom:12px">
                    Customers: <strong>${db.customers.length}</strong>
                </p>

                <p style="margin-bottom:12px">
                    Products: <strong>${db.products.length}</strong>
                </p>

                <p style="margin-bottom:12px">
                    Invoices: <strong>${db.invoices.length}</strong>
                </p>

                <p style="margin-bottom:12px">
                    Packing Lists: <strong>${db.packingLists.length}</strong>
                </p>

                <p>Storage: <strong>LocalStorage</strong></p>
            </div>

        </div>
    `;

    if (window.Chart) {

        const monthly = Array(12).fill(0);

        db.invoices.forEach(inv => {
            const month = new Date(inv.date).getMonth();

            if (Number.isInteger(month)) {
                monthly[month] += Number(inv.total || 0);
            }
        });

        new Chart(document.getElementById("revenueChart"), {

            type: "bar",

            data: {
                labels: [
                    "Jan", "Feb", "Mar", "Apr",
                    "May", "Jun", "Jul", "Aug",
                    "Sep", "Oct", "Nov", "Dec"
                ],

                datasets: [{
                    label: "Revenue",
                    data: monthly,
                    borderRadius: 6,
                    backgroundColor: getComputedStyle(document.body)
                        .getPropertyValue("--accent").trim() || "#4776e6"
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                }
            }
        });
    }
}

// ================= CUSTOMER MANAGEMENT =================

function renderCustomers(search = "") {

    const filtered = db.customers.filter(c =>
        `${c.name} ${c.email} ${c.phone} ${c.id}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    document.getElementById("page-content").innerHTML = `

        <div class="panel" style="margin-bottom:20px">

            <h3>Customer Management</h3>

            <p style="color:var(--muted-color);margin:8px 0 15px">
                Manage your business customers
            </p>

            <button class="primary-btn" onclick="openCustomerForm()">
                + Add Customer
            </button>

        </div>

        <div class="panel">

            <h3>All Customers (${db.customers.length})</h3>

            <input
                placeholder="Search customers..."
                value="${escapeHTML(search)}"
                oninput="renderCustomers(this.value)"
                style="${inputStyle()}"
            >

            <div style="overflow-x:auto">

                <table style="${tableStyle()}">

                    <thead>
                        <tr>
                            <th>Customer ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Address</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>

                        ${filtered.length ? filtered.map(c => `

                            <tr>
                                <td>${escapeHTML(c.id)}</td>

                                <td>
                                    <strong>${escapeHTML(c.name)}</strong>
                                </td>

                                <td>${escapeHTML(c.email)}</td>
                                <td>${escapeHTML(c.phone)}</td>
                                <td>${escapeHTML(c.address)}</td>

                                <td>
                                    <button class="action-edit"
                                        onclick="editCustomer('${c.id}')">
                                        Edit
                                    </button>

                                    <button class="action-delete"
                                        onclick="deleteCustomer('${c.id}')">
                                        Delete
                                    </button>
                                </td>
                            </tr>

                        `).join("") : `

                            <tr>
                                <td colspan="6">No customers found.</td>
                            </tr>

                        `}

                    </tbody>

                </table>

            </div>

        </div>
    `;
}

function openCustomerForm(customer = null) {

    const isEdit = customer !== null;

    const modal = createModal(
        "customerModal",
        isEdit ? "Edit Customer" : "Add New Customer"
    );

    modal.querySelector(".modal-body").innerHTML = `

        <form id="customerForm">

            <label>Full Name *</label>
            <input name="name" required maxlength="100"
                value="${escapeHTML(customer?.name || "")}">

            <label>Email *</label>
            <input name="email" type="email" required
                value="${escapeHTML(customer?.email || "")}">

            <label>Phone *</label>
            <input name="phone" required
                value="${escapeHTML(customer?.phone || "")}">

            <label>Address *</label>
            <textarea name="address" required>${escapeHTML(customer?.address || "")}</textarea>

            <button class="primary-btn" style="width:100%;margin-top:15px">
                ${isEdit ? "Update Customer" : "Save Customer"}
            </button>

        </form>
    `;

    styleForm(modal);

    modal.querySelector("form").addEventListener("submit", e => {

        e.preventDefault();

        const data = Object.fromEntries(new FormData(e.target));

        const duplicate = db.customers.find(c =>
            c.email.toLowerCase() === data.email.trim().toLowerCase()
            && c.id !== customer?.id
        );

        if (duplicate) {
            return alert("Email already registered.");
        }

        if (isEdit) {

            const index = db.customers.findIndex(
                c => c.id === customer.id
            );

            if (index === -1) return;

            db.customers[index] = {
                ...customer,
                ...data
            };

        } else {

            db.customers.push({
                id: "CUS-" + Date.now().toString().slice(-8),
                ...data,
                createdAt: new Date().toISOString()
            });
        }

        saveData();
        closeModal("customerModal");
        renderCustomers();
    });
}

function editCustomer(id) {

    const customer = db.customers.find(c => c.id === id);

    if (customer) {
        openCustomerForm(customer);
    }
}

function deleteCustomer(id) {

    const customer = db.customers.find(c => c.id === id);

    if (!customer || !confirm(`Delete ${customer.name}?`)) {
        return;
    }

    if (db.invoices.some(inv => inv.customerId === id)) {
        return alert(
            "This customer has invoices. Keep the customer to preserve invoice history."
        );
    }

    db.customers = db.customers.filter(c => c.id !== id);

    saveData();
    renderCustomers();
}

// ================= PRODUCT MANAGEMENT =================

function renderProducts(search = "") {

    const filtered = db.products.filter(p =>
        `${p.name} ${p.category} ${p.brand} ${p.id}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    document.getElementById("page-content").innerHTML = `

        <div class="panel" style="margin-bottom:20px">

            <h3>Product & Inventory Management</h3>

            <p style="color:var(--muted-color);margin:8px 0 15px">
                Manage products, prices and stock
            </p>

            <button class="primary-btn" onclick="openProductForm()">
                + Add Product
            </button>

        </div>

        <div class="stats-grid">

            <div class="stat-card">
                <p>Total Products</p>
                <h2>${db.products.length}</h2>
            </div>

            <div class="stat-card">
                <p>Total Stock Units</p>
                <h2>${db.products.reduce((s,p) => s + Number(p.stock), 0)}</h2>
            </div>

            <div class="stat-card">
                <p>Low Stock Items</p>
                <h2>${db.products.filter(
                    p => Number(p.stock) <= Number(p.minStock)
                ).length}</h2>
            </div>

            <div class="stat-card">
                <p>Inventory Value</p>
                <h2>${money(db.products.reduce(
                    (s,p) => s + Number(p.price) * Number(p.stock), 0
                ))}</h2>
            </div>

        </div>

        <div class="panel">

            <h3>All Products (${db.products.length})</h3>

            <input
                placeholder="Search products..."
                value="${escapeHTML(search)}"
                oninput="renderProducts(this.value)"
                style="${inputStyle()}"
            >

            <div style="overflow-x:auto">

                <table style="${tableStyle()}">

                    <thead>
                        <tr>
                            <th>Product ID</th>
                            <th>Name</th>
                            <th>Category</th>
                            <th>Brand</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>

                        ${filtered.length ? filtered.map(p => `

                            <tr>

                                <td>${escapeHTML(p.id)}</td>

                                <td>
                                    <strong>${escapeHTML(p.name)}</strong>
                                </td>

                                <td>${escapeHTML(p.category)}</td>
                                <td>${escapeHTML(p.brand)}</td>
                                <td>${money(p.price)}</td>
                                <td>${p.stock}</td>

                                <td>
                                    ${Number(p.stock) <= Number(p.minStock)
                                        ? "⚠ Low Stock"
                                        : "✓ In Stock"}
                                </td>

                                <td>

                                    <button class="action-edit"
                                        onclick="editProduct('${p.id}')">
                                        Edit
                                    </button>

                                    <button class="action-delete"
                                        onclick="deleteProduct('${p.id}')">
                                        Delete
                                    </button>

                                </td>

                            </tr>

                        `).join("") : `

                            <tr>
                                <td colspan="8">No products found.</td>
                            </tr>

                        `}

                    </tbody>

                </table>

            </div>

        </div>
    `;
}

function openProductForm(product = null) {

    const isEdit = product !== null;

    const modal = createModal(
        "productModal",
        isEdit ? "Edit Product" : "Add New Product"
    );

    modal.querySelector(".modal-body").innerHTML = `

        <form id="productForm">

            <label>Product Name *</label>
            <input name="name" required
                value="${escapeHTML(product?.name || "")}">

            <label>Category *</label>

            <select name="category" required>

                <option value="">Select Category</option>

                ${["Electronics", "Books", "Stationery", "Furniture", "Clothing", "Other"]
                    .map(c => `
                        <option ${product?.category === c ? "selected" : ""}>
                            ${c}
                        </option>
                    `).join("")}

            </select>

            <label>Brand / Publisher *</label>
            <input name="brand" required
                value="${escapeHTML(product?.brand || "")}">

            <label>Purchase Price (₹) *</label>
            <input name="purchasePrice" type="number"
                min="0" step="0.01" required
                value="${product?.purchasePrice ?? ""}">

            <label>Selling Price (₹) *</label>
            <input name="price" type="number"
                min="0" step="0.01" required
                value="${product?.price ?? ""}">

            <label>Available Stock *</label>
            <input name="stock" type="number"
                min="0" step="1" required
                value="${product?.stock ?? ""}">

            <label>Low Stock Alert Level *</label>
            <input name="minStock" type="number"
                min="0" step="1" required
                value="${product?.minStock ?? 5}">

            <button class="primary-btn" style="width:100%;margin-top:15px">
                ${isEdit ? "Update Product" : "Save Product"}
            </button>

        </form>
    `;

    styleForm(modal);

    modal.querySelector("form").addEventListener("submit", e => {

        e.preventDefault();

        const f = new FormData(e.target);

        const data = {
            name: f.get("name").trim(),
            category: f.get("category"),
            brand: f.get("brand").trim(),
            purchasePrice: Number(f.get("purchasePrice")),
            price: Number(f.get("price")),
            stock: Number(f.get("stock")),
            minStock: Number(f.get("minStock"))
        };

        if (
            Object.values(data).some(v =>
                v === "" ||
                (typeof v === "number" && !Number.isFinite(v))
            ) ||
            data.purchasePrice < 0 ||
            data.price < 0 ||
            !Number.isInteger(data.stock) ||
            !Number.isInteger(data.minStock) ||
            data.stock < 0 ||
            data.minStock < 0
        ) {
            return alert("Enter valid product details.");
        }

        if (isEdit) {

            const index = db.products.findIndex(
                p => p.id === product.id
            );

            if (index === -1) return;

            db.products[index] = {
                ...product,
                ...data
            };

        } else {

            db.products.push({
                id: "PRD-" + Date.now().toString().slice(-8),
                ...data,
                createdAt: new Date().toISOString()
            });
        }

        saveData();
        closeModal("productModal");
        renderProducts();
    });
}

function editProduct(id) {

    const product = db.products.find(p => p.id === id);

    if (product) {
        openProductForm(product);
    }
}

function deleteProduct(id) {

    const product = db.products.find(p => p.id === id);

    if (!product || !confirm(`Delete ${product.name}?`)) {
        return;
    }

    if (db.invoices.some(inv =>
        inv.items?.some(item => item.productId === id)
    )) {
        return alert(
            "This product is used in an invoice. Keep it to preserve invoice history."
        );
    }

    db.products = db.products.filter(p => p.id !== id);

    saveData();
    renderProducts();
}

// ================= END OF PART 1 =================
// =====================================================
// PART 2 OF 4
// INVOICE MANAGEMENT
// =====================================================

function renderInvoices(search = "") {

    const filtered = db.invoices.filter(inv =>
        `${inv.id} ${inv.customerName}`
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    document.getElementById("page-content").innerHTML = `

        <div class="panel" style="margin-bottom:20px">

            <h3>Invoice Management</h3>

            <p style="color:var(--muted-color);margin:8px 0 15px">
                Create and manage customer invoices
            </p>

            <button class="primary-btn" onclick="openInvoiceForm()">
                + Create Invoice
            </button>

        </div>

        <div class="panel">

            <h3>Invoice History (${db.invoices.length})</h3>

            <input
                placeholder="Search invoice or customer..."
                value="${escapeHTML(search)}"
                oninput="renderInvoices(this.value)"
                style="${inputStyle()}"
            >

            <div style="overflow-x:auto">

                <table style="${tableStyle()}">

                    <thead>
                        <tr>
                            <th>Invoice ID</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Subtotal</th>
                            <th>GST</th>
                            <th>Total</th>
                            <th>Actions</th>
                        </tr>
                    </thead>

                    <tbody>

                        ${filtered.length ? filtered.slice().reverse().map(inv => `

                            <tr>

                                <td>
                                    <strong>${escapeHTML(inv.id)}</strong>
                                </td>

                                <td>
                                    ${new Date(inv.date).toLocaleDateString("en-IN")}
                                </td>

                                <td>${escapeHTML(inv.customerName)}</td>

                                <td>${money(inv.subtotal)}</td>

                                <td>${money(inv.tax)}</td>

                                <td>
                                    <strong>${money(inv.total)}</strong>
                                </td>

                                <td>
                                    <button class="action-edit"
                                        onclick="viewInvoice('${inv.id}')">
                                        View / Print
                                    </button>
                                </td>

                            </tr>

                        `).join("") : `

                            <tr>
                                <td colspan="7">No invoices generated yet.</td>
                            </tr>

                        `}

                    </tbody>

                </table>

            </div>

        </div>
    `;
}

// ================= CREATE INVOICE =================

function openInvoiceForm() {

    if (!db.customers.length) {
        return alert("Please add a customer first.");
    }

    if (!db.products.some(p => Number(p.stock) > 0)) {
        return alert("Please add products with available stock first.");
    }

    const modal = createModal(
        "invoiceModal",
        "Create New Invoice"
    );

    modal.querySelector(".modal-body").innerHTML = `

        <form id="invoiceForm">

            <label>Select Customer *</label>

            <select name="customerId" required>

                <option value="">Choose customer</option>

                ${db.customers.map(c => `
                    <option value="${escapeHTML(c.id)}">
                        ${escapeHTML(c.name)} (${escapeHTML(c.id)})
                    </option>
                `).join("")}

            </select>

            <label>Invoice Date</label>

            <input
                name="date"
                type="date"
                required
                value="${new Date().toISOString().slice(0,10)}"
            >

            <h3 style="margin:20px 0 12px">
                Invoice Items
            </h3>

            <div id="invoiceItems"></div>

            <button
                type="button"
                class="secondary-btn"
                onclick="addInvoiceRow()">
                + Add Product
            </button>

            <label>GST Rate</label>

            <select name="gst" id="gstRate">

                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18" selected>18%</option>
                <option value="28">28%</option>

            </select>

            <div class="invoice-totals">

                <p>
                    Subtotal:
                    <strong id="invoiceSubtotal">₹0.00</strong>
                </p>

                <p>
                    GST:
                    <strong id="invoiceTax">₹0.00</strong>
                </p>

                <h3>
                    Grand Total:
                    <strong id="invoiceGrandTotal">₹0.00</strong>
                </h3>

            </div>

            <button
                type="submit"
                class="primary-btn"
                style="width:100%;margin-top:20px">
                Generate Invoice
            </button>

        </form>
    `;

    styleForm(modal);

    invoiceRowCounter = 0;

    addInvoiceRow();

    modal.querySelector("#gstRate")
        .addEventListener("change", calculateInvoice);

    modal.querySelector("form")
        .addEventListener("submit", e => {

            e.preventDefault();

            generateInvoice(e.target);

        });
}

// ================= INVOICE PRODUCT ROWS =================

let invoiceRowCounter = 0;

function addInvoiceRow() {

    const container = document.getElementById("invoiceItems");

    if (!container) return;

    const rowId = "invoiceRow" + (++invoiceRowCounter);

    const row = document.createElement("div");

    row.id = rowId;

    row.style.cssText = `
        display:grid;
        grid-template-columns:2fr 1fr 1fr auto;
        gap:8px;
        align-items:center;
        margin-bottom:12px;
    `;

    row.innerHTML = `

        <select class="invoice-product" required>

            <option value="">Select product</option>

            ${db.products.filter(p => Number(p.stock) > 0).map(p => `

                <option value="${escapeHTML(p.id)}">
                    ${escapeHTML(p.name)} — ${money(p.price)}
                    (Stock: ${p.stock})
                </option>

            `).join("")}

        </select>

        <input
            class="invoice-qty"
            type="number"
            min="1"
            step="1"
            value="1"
            required
        >

        <input
            class="invoice-price"
            type="number"
            readonly
            placeholder="Price"
        >

        <button
            type="button"
            onclick="removeInvoiceRow('${rowId}')"
            style="
                background:#fff0f0;
                color:#d14343;
                border:0;
                padding:10px;
                border-radius:6px;
                cursor:pointer;
            ">
            ×
        </button>

    `;

    container.appendChild(row);

    row.querySelector(".invoice-product")
        .addEventListener("change", () => {

            const product = db.products.find(
                p => p.id === row.querySelector(".invoice-product").value
            );

            row.querySelector(".invoice-price").value =
                product ? product.price : "";

            calculateInvoice();

        });

    row.querySelector(".invoice-qty")
        .addEventListener("input", calculateInvoice);

}

function removeInvoiceRow(id) {

    document.getElementById(id)?.remove();

    calculateInvoice();

}

// ================= CALCULATE INVOICE =================

function calculateInvoice() {

    const rows = [
        ...document.querySelectorAll("#invoiceItems > div")
    ];

    let subtotal = 0;

    rows.forEach(row => {

        const id = row.querySelector(".invoice-product").value;

        const qty = Number(
            row.querySelector(".invoice-qty").value
        );

        const product = db.products.find(p => p.id === id);

        if (product && Number.isInteger(qty) && qty > 0) {

            subtotal += Number(product.price) * qty;

        }

    });

    const gst = Number(
        document.getElementById("gstRate")?.value || 0
    );

    const tax = subtotal * gst / 100;

    document.getElementById("invoiceSubtotal").textContent =
        money(subtotal);

    document.getElementById("invoiceTax").textContent =
        money(tax);

    document.getElementById("invoiceGrandTotal").textContent =
        money(subtotal + tax);

}

// ================= GENERATE INVOICE =================

function generateInvoice(form) {

    const customer = db.customers.find(
        c => c.id === form.customerId.value
    );

    if (!customer) {
        return alert("Please select a valid customer.");
    }

    const rows = [
        ...document.querySelectorAll("#invoiceItems > div")
    ];

    if (!rows.length) {
        return alert("Add at least one product.");
    }

    const quantities = {};

    for (const row of rows) {

        const id = row.querySelector(".invoice-product").value;

        const qty = Number(
            row.querySelector(".invoice-qty").value
        );

        if (!id || !Number.isInteger(qty) || qty <= 0) {
            return alert("Enter valid product and quantity.");
        }

        quantities[id] = (quantities[id] || 0) + qty;

    }

    // Validate stock before generating invoice

    for (const [id, qty] of Object.entries(quantities)) {

        const product = db.products.find(p => p.id === id);

        if (!product || qty > Number(product.stock)) {

            return alert(
                `Insufficient stock for ${product?.name || "selected product"}.`
            );

        }

    }

    const items = Object.entries(quantities).map(([id, qty]) => {

        const product = db.products.find(p => p.id === id);

        return {

            productId: id,

            productName: product.name,

            quantity: qty,

            price: Number(product.price),

            lineTotal: Number(product.price) * qty

        };

    });

    const subtotal = items.reduce(
        (s, i) => s + i.lineTotal, 0
    );

    const gstRate = Number(form.gst.value);

    const tax = subtotal * gstRate / 100;

    const invoice = {

        id: "INV-" + Date.now().toString().slice(-8),

        date: form.date.value,

        customerId: customer.id,

        customerName: customer.name,

        customerEmail: customer.email,

        customerPhone: customer.phone,

        customerAddress: customer.address,

        items,

        subtotal,

        gstRate,

        tax,

        total: subtotal + tax,

        status: "Generated",

        createdAt: new Date().toISOString()

    };

    // Deduct stock

    items.forEach(item => {

        const product = db.products.find(
            p => p.id === item.productId
        );

        product.stock = Number(product.stock) - item.quantity;

    });

    db.invoices.push(invoice);

    saveData();

    closeModal("invoiceModal");

    renderInvoices();

    alert(`Invoice ${invoice.id} generated successfully!`);

}

// ================= VIEW / PRINT INVOICE =================

function viewInvoice(id) {

    const invoice = db.invoices.find(i => i.id === id);

    if (!invoice) return;

    const w = window.open("", "_blank");

    if (!w) {
        return alert("Allow pop-ups to print invoice.");
    }

    w.document.write(`

        <html>

        <head>

            <title>${escapeHTML(invoice.id)}</title>

            <style>

                body {
                    font-family: Arial;
                    padding: 40px;
                    color: #222;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 2px solid #243b64;
                    padding-bottom: 20px;
                }

                h1 {
                    color: #243b64;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 30px;
                }

                th, td {
                    border: 1px solid #ddd;
                    padding: 13px;
                    text-align: left;
                }

                th {
                    background: #f0f3f8;
                }

                .totals {
                    margin: 30px 0 0 auto;
                    width: 280px;
                }

                .totals p {
                    display: flex;
                    justify-content: space-between;
                }

                .grand {
                    font-size: 20px;
                    font-weight: bold;
                    border-top: 2px solid #333;
                    padding-top: 12px;
                }

                .print {
                    padding: 12px 20px;
                    background: #315fc7;
                    color: white;
                    border: 0;
                    cursor: pointer;
                }

                @media print {
                    .print {
                        display: none;
                    }

                    body {
                        padding: 10px;
                    }
                }

            </style>

        </head>

        <body>

            <button class="print" onclick="window.print()">
                Print / Save as PDF
            </button>

            <div class="header">

                <div>
                    <h1>JIMS</h1>
                    <h3>Invoice Management System</h3>
                    <p>Greater Noida, Uttar Pradesh, India</p>
                </div>

                <div>

                    <h2>INVOICE</h2>

                    <p>
                        Invoice: ${escapeHTML(invoice.id)}
                    </p>

                    <p>
                        Date: ${new Date(invoice.date).toLocaleDateString("en-IN")}
                    </p>

                </div>

            </div>

            <h3>Bill To</h3>

            <p>
                <strong>${escapeHTML(invoice.customerName)}</strong>
            </p>

            <p>${escapeHTML(invoice.customerAddress)}</p>

            <p>${escapeHTML(invoice.customerEmail)}</p>

            <p>${escapeHTML(invoice.customerPhone)}</p>

            <table>

                <thead>

                    <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>

                </thead>

                <tbody>

                    ${invoice.items.map(i => `

                        <tr>

                            <td>${escapeHTML(i.productName)}</td>

                            <td>${i.quantity}</td>

                            <td>${money(i.price)}</td>

                            <td>${money(i.lineTotal)}</td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>

            <div class="totals">

                <p>
                    <span>Subtotal:</span>
                    <strong>${money(invoice.subtotal)}</strong>
                </p>

                <p>
                    <span>GST (${invoice.gstRate}%):</span>
                    <strong>${money(invoice.tax)}</strong>
                </p>

                <p class="grand">
                    <span>Grand Total:</span>
                    <span>${money(invoice.total)}</span>
                </p>

            </div>

            <p style="margin-top:60px;text-align:center">
                Thank you for your business!
            </p>

        </body>

        </html>

    `);

    w.document.close();

}

// ================= END OF PART 2 =================
// =====================================================
// PART 3 OF 4
// PACKING LIST MANAGEMENT AND ANALYTICS
// =====================================================


// ================= PACKING LIST MANAGEMENT =================

function renderPackingLists(search = "", filter = "All") {

    const filtered = db.packingLists.filter(p => {

        const matchesSearch =
            `${p.id} ${p.invoiceId} ${p.customerName}`
                .toLowerCase()
                .includes(search.toLowerCase());

        const matchesStatus =
            filter === "All" || p.status === filter;

        return matchesSearch && matchesStatus;
    });

    const pending = db.packingLists.filter(
        p => p.status === "Pending"
    ).length;

    const packed = db.packingLists.filter(
        p => p.status === "Packed"
    ).length;

    const dispatched = db.packingLists.filter(
        p => p.status === "Dispatched"
    ).length;

    document.getElementById("page-content").innerHTML = `

        <div class="panel" style="margin-bottom:20px">

            <h3>Packing List Management</h3>

            <p style="color:var(--muted-color);margin:8px 0 15px">
                Prepare and track customer orders
            </p>

            <button class="primary-btn" onclick="createPackingList()">
                + Generate Packing List
            </button>

        </div>


        <div class="stats-grid">

            <div class="stat-card">
                <p>Pending</p>
                <h2>${pending}</h2>
                <small>Awaiting packing</small>
            </div>

            <div class="stat-card">
                <p>Packed</p>
                <h2>${packed}</h2>
                <small>Ready for dispatch</small>
            </div>

            <div class="stat-card">
                <p>Dispatched</p>
                <h2>${dispatched}</h2>
                <small>Orders dispatched</small>
            </div>

            <div class="stat-card">
                <p>Total Lists</p>
                <h2>${db.packingLists.length}</h2>
                <small>All packing lists</small>
            </div>

        </div>


        <div class="panel">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:12px;
                flex-wrap:wrap;
            ">

                <h3>All Packing Lists (${filtered.length})</h3>

                <div style="
                    display:flex;
                    gap:10px;
                    flex-wrap:wrap;
                ">

                    <input
                        id="packingSearch"
                        placeholder="Search packing lists..."
                        value="${escapeHTML(search)}"
                        style="${inputStyle()}"
                    >

                    <select
                        id="packingFilter"
                        style="${inputStyle()}"
                    >

                        <option value="All" ${filter === "All" ? "selected" : ""}>
                            All
                        </option>

                        <option value="Pending" ${filter === "Pending" ? "selected" : ""}>
                            Pending
                        </option>

                        <option value="Packed" ${filter === "Packed" ? "selected" : ""}>
                            Packed
                        </option>

                        <option value="Dispatched" ${filter === "Dispatched" ? "selected" : ""}>
                            Dispatched
                        </option>

                    </select>

                </div>

            </div>


            <div style="overflow-x:auto">

                <table style="${tableStyle()}">

                    <thead>

                        <tr>
                            <th>Packing ID</th>
                            <th>Invoice ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Items</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>

                    </thead>


                    <tbody>

                        ${filtered.length ? filtered.slice().reverse().map(p => `

                            <tr>

                                <td>
                                    <strong>${escapeHTML(p.id)}</strong>
                                </td>

                                <td>${escapeHTML(p.invoiceId)}</td>

                                <td>${escapeHTML(p.customerName)}</td>

                                <td>
                                    ${new Date(p.date).toLocaleDateString("en-IN")}
                                </td>

                                <td>
                                    ${p.items.reduce(
                                        (s, i) => s + Number(i.quantity), 0
                                    )}
                                </td>

                                <td>${escapeHTML(p.status)}</td>

                                <td style="white-space:nowrap">

                                    <button
                                        class="action-edit"
                                        onclick="viewPackingList('${p.id}')"
                                    >
                                        View / Print
                                    </button>

                                    <button
                                        class="action-edit"
                                        onclick="updatePackingStatus('${p.id}')"
                                    >
                                        Update Status
                                    </button>

                                </td>

                            </tr>

                        `).join("") : `

                            <tr>
                                <td colspan="7">
                                    No packing lists found.
                                </td>
                            </tr>

                        `}

                    </tbody>

                </table>

            </div>

        </div>

    `;


    // Search and filter event listeners

    document.getElementById("packingSearch")
        .addEventListener("input", e => {

            const currentSearch = e.target.value;

            const currentFilter =
                document.getElementById("packingFilter").value;

            renderPackingLists(currentSearch, currentFilter);

            const newSearch =
                document.getElementById("packingSearch");

            newSearch.focus();

            newSearch.setSelectionRange(
                currentSearch.length,
                currentSearch.length
            );

        });


    document.getElementById("packingFilter")
        .addEventListener("change", e => {

            const currentSearch =
                document.getElementById("packingSearch").value;

            renderPackingLists(currentSearch, e.target.value);

        });

}


// ================= CREATE PACKING LIST =================

function createPackingList() {

    const eligible = db.invoices.filter(inv =>
        !db.packingLists.some(p => p.invoiceId === inv.id)
    );

    if (!eligible.length) {

        return alert(
            "No eligible invoices found. Each invoice can have one packing list."
        );

    }

    const modal = createModal(
        "packingModal",
        "Generate Packing List"
    );

    modal.querySelector(".modal-body").innerHTML = `

        <form id="packingForm">

            <label>Select Invoice *</label>

            <select name="invoiceId" required>

                <option value="">
                    Choose invoice
                </option>

                ${eligible.map(inv => `

                    <option value="${escapeHTML(inv.id)}">

                        ${escapeHTML(inv.id)}
                        —
                        ${escapeHTML(inv.customerName)}
                        —
                        ${money(inv.total)}

                    </option>

                `).join("")}

            </select>


            <button
                class="primary-btn"
                style="width:100%;margin-top:20px"
            >
                Generate Packing List
            </button>

        </form>

    `;

    styleForm(modal);


    modal.querySelector("form")
        .addEventListener("submit", e => {

            e.preventDefault();

            const invoice = db.invoices.find(
                i => i.id === e.target.invoiceId.value
            );

            if (!invoice) {
                return alert("Invoice not found.");
            }

            if (db.packingLists.some(
                p => p.invoiceId === invoice.id
            )) {

                return alert(
                    "A packing list already exists for this invoice."
                );

            }


            const packingList = {

                id: "PKL-" + Date.now().toString().slice(-8),

                invoiceId: invoice.id,

                customerId: invoice.customerId,

                customerName: invoice.customerName,

                customerAddress: invoice.customerAddress,

                customerPhone: invoice.customerPhone,

                date: new Date().toISOString(),

                status: "Pending",

                dispatchDate: null,

                items: invoice.items.map(i => ({ ...i }))

            };


            db.packingLists.push(packingList);

            saveData();

            closeModal("packingModal");

            renderPackingLists();

            alert(
                `Packing List ${packingList.id} generated successfully!`
            );

        });

}


// ================= UPDATE PACKING STATUS =================

function updatePackingStatus(id) {

    const packing = db.packingLists.find(
        p => p.id === id
    );

    if (!packing) return;


    const nextStatus = {

        Pending: "Packed",

        Packed: "Dispatched",

        Dispatched: null

    };


    const next = nextStatus[packing.status];

    if (!next) {

        return alert(
            "This order has already been dispatched."
        );

    }


    if (!confirm(
        `Change status from ${packing.status} to ${next}?`
    )) {
        return;
    }


    packing.status = next;


    if (next === "Dispatched") {

        packing.dispatchDate = new Date().toISOString();

    }


    saveData();

    renderPackingLists();

}


// ================= VIEW / PRINT PACKING LIST =================

function viewPackingList(id) {

    const packing = db.packingLists.find(
        p => p.id === id
    );

    if (!packing) return;


    const w = window.open("", "_blank");

    if (!w) {

        return alert(
            "Allow pop-ups to print packing lists."
        );

    }


    w.document.write(`

        <html>

        <head>

            <title>${escapeHTML(packing.id)}</title>

            <style>

                body {
                    font-family: Arial;
                    padding: 40px;
                    color: #222;
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    border-bottom: 2px solid #243b64;
                    padding-bottom: 20px;
                }

                h1 {
                    color: #243b64;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 30px;
                }

                th, td {
                    border: 1px solid #ddd;
                    padding: 13px;
                    text-align: left;
                }

                th {
                    background: #f0f3f8;
                }

                .print {
                    padding: 12px 20px;
                    background: #315fc7;
                    color: white;
                    border: 0;
                    cursor: pointer;
                }

                @media print {
                    .print {
                        display: none;
                    }

                    body {
                        padding: 10px;
                    }
                }

            </style>

        </head>


        <body>

            <button class="print" onclick="window.print()">
                Print / Save as PDF
            </button>


            <div class="header">

                <div>

                    <h1>JIMS</h1>

                    <h3>Packing List</h3>

                </div>


                <div>

                    <p>
                        <strong>Packing ID:</strong>
                        ${escapeHTML(packing.id)}
                    </p>

                    <p>
                        <strong>Invoice:</strong>
                        ${escapeHTML(packing.invoiceId)}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${new Date(packing.date).toLocaleDateString("en-IN")}
                    </p>

                </div>

            </div>


            <h3>Ship To</h3>

            <p>
                <strong>${escapeHTML(packing.customerName)}</strong>
            </p>

            <p>${escapeHTML(packing.customerAddress)}</p>

            <p>${escapeHTML(packing.customerPhone)}</p>


            <h3>Items to Pack</h3>


            <table>

                <thead>

                    <tr>
                        <th>S.No.</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Checked</th>
                    </tr>

                </thead>


                <tbody>

                    ${packing.items.map((i, index) => `

                        <tr>

                            <td>${index + 1}</td>

                            <td>${escapeHTML(i.productName)}</td>

                            <td>${i.quantity}</td>

                            <td>☐</td>

                        </tr>

                    `).join("")}

                </tbody>

            </table>


            <p>
                <strong>Status:</strong>
                ${escapeHTML(packing.status)}
            </p>

            <p>

                <strong>Dispatch Date:</strong>

                ${packing.dispatchDate
                    ? new Date(packing.dispatchDate).toLocaleDateString("en-IN")
                    : "Not dispatched"}

            </p>


            <p style="margin-top:60px">
                Prepared By: __________________
            </p>

            <p>
                Checked By: __________________
            </p>


        </body>

        </html>

    `);

    w.document.close();

}


// ================= ANALYTICS =================

function renderAnalytics() {

    const revenue = db.invoices.reduce(
        (s, i) => s + Number(i.total), 0
    );

    const lowStock = db.products.filter(
        p => Number(p.stock) <= Number(p.minStock)
    );


    const bestProducts = {};


    db.invoices.forEach(inv => {

        inv.items.forEach(item => {

            bestProducts[item.productName] =
                (bestProducts[item.productName] || 0)
                + Number(item.quantity);

        });

    });


    const topProducts = Object.entries(bestProducts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);


    document.getElementById("page-content").innerHTML = `

        <div class="stats-grid">

            <div class="stat-card">

                <p>Total Revenue</p>

                <h2>${money(revenue)}</h2>

            </div>


            <div class="stat-card">

                <p>Average Invoice</p>

                <h2>
                    ${money(
                        db.invoices.length
                            ? revenue / db.invoices.length
                            : 0
                    )}
                </h2>

            </div>


            <div class="stat-card">

                <p>Low Stock Products</p>

                <h2>${lowStock.length}</h2>

            </div>


            <div class="stat-card">

                <p>Completed Dispatches</p>

                <h2>
                    ${db.packingLists.filter(
                        p => p.status === "Dispatched"
                    ).length}
                </h2>

            </div>

        </div>


        <div class="dashboard-grid">

            <div class="panel">

                <h3>Top Selling Products</h3>

                ${topProducts.length ? topProducts.map(([name, qty]) => `

                    <p style="
                        padding:12px 0;
                        border-bottom:1px solid var(--border-color);
                    ">

                        ${escapeHTML(name)}

                        <strong style="float:right">
                            ${qty} units
                        </strong>

                    </p>

                `).join("") : `

                    <p>No sales recorded yet.</p>

                `}

            </div>


            <div class="panel">

                <h3>Low Stock Alerts</h3>

                ${lowStock.length ? lowStock.map(p => `

                    <p style="
                        padding:12px 0;
                        border-bottom:1px solid var(--border-color);
                    ">

                        ${escapeHTML(p.name)}

                        <strong style="float:right">
                            ${p.stock} left
                        </strong>

                    </p>

                `).join("") : `

                    <p>All products have sufficient stock.</p>

                `}

            </div>

        </div>

    `;

}


// ================= END OF PART 3 =================
// =====================================================
// PART 4 OF 4
// SETTINGS, BRANDING, THEMES AND SHARED HELPERS
// =====================================================


// ================= DEFAULT SETTINGS =================

const DEFAULT_SETTINGS = {
    appName: "JIMS",
    subtitle: "Invoice Management",
    logoInitials: "J",
    logoImage: "",
    theme: "light",
    accent: "#4776e6"
};

let appSettings = loadSettings();

function loadSettings() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(SETTINGS_KEY)
        );

        return {
            ...DEFAULT_SETTINGS,
            ...(saved || {})
        };

    } catch (error) {
        return { ...DEFAULT_SETTINGS };
    }
}

function saveSettings() {
    localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify(appSettings)
    );
}


// ================= APPLY SETTINGS =================

function applySettings() {

    const root = document.documentElement;

    root.style.setProperty(
        "--accent",
        appSettings.accent
    );

    root.style.setProperty(
        "--accent-hover",
        adjustColor(appSettings.accent, -20)
    );

    document.body.classList.toggle(
        "dark-theme",
        appSettings.theme === "dark"
    );

    // Update application title

    document.title =
        `${appSettings.appName} - ${appSettings.subtitle}`;

    // Update sidebar branding

    const brandName = document.getElementById("brand-name");
    const brandSubtitle = document.getElementById("brand-subtitle");
    const brandLogo = document.getElementById("brand-logo");

    if (brandName) {
        brandName.textContent = appSettings.appName;
    }

    if (brandSubtitle) {
        brandSubtitle.textContent = appSettings.subtitle;
    }

    if (brandLogo) {

        if (appSettings.logoImage) {

            brandLogo.innerHTML = `
                <img
                    src="${appSettings.logoImage}"
                    alt="Application Logo"
                >
            `;

        } else {

            brandLogo.textContent = appSettings.logoInitials;

        }
    }

    // Update footer

    const footer = document.getElementById("app-footer");

    if (footer) {

        footer.textContent =
            `${appSettings.appName} ${appSettings.subtitle} © ${new Date().getFullYear()}`;

    }
}


// ================= COLOR HELPER =================

function adjustColor(hex, amount) {

    const cleanHex = hex.replace("#", "");

    const num = parseInt(cleanHex, 16);

    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    return "#" +
        (0x1000000 + r * 0x10000 + g * 0x100 + b)
            .toString(16)
            .slice(1);
}


// ================= SETTINGS PAGE =================

function renderSettings() {

    const colors = [
        "#4776e6",
        "#8b5cf6",
        "#16a34a",
        "#ea580c",
        "#db2777",
        "#0891b2"
    ];

    document.getElementById("page-content").innerHTML = `

        <div class="panel" style="margin-bottom:22px">

            <h3>Application Settings</h3>

            <p style="color:var(--muted-color);margin-top:8px">
                Personalize your invoice management system.
                Customize branding, appearance and colours.
            </p>

        </div>


        <div class="settings-container">

            <!-- BRANDING SETTINGS -->

            <div class="settings-card">

                <h3>🏷️ Application Branding</h3>

                <p class="settings-description">
                    Customize your application identity and logo.
                </p>


                <div class="logo-preview" id="settings-logo-preview">

                    ${appSettings.logoImage
                        ? `<img src="${appSettings.logoImage}" alt="Logo">`
                        : escapeHTML(appSettings.logoInitials)}

                </div>


                <div class="settings-field">

                    <label>Application Name</label>

                    <input
                        type="text"
                        id="setting-app-name"
                        maxlength="40"
                        value="${escapeHTML(appSettings.appName)}"
                        placeholder="Enter application name"
                    >

                </div>


                <div class="settings-field">

                    <label>Application Subtitle</label>

                    <input
                        type="text"
                        id="setting-subtitle"
                        maxlength="60"
                        value="${escapeHTML(appSettings.subtitle)}"
                        placeholder="Enter application subtitle"
                    >

                </div>


                <div class="settings-field">

                    <label>Logo Initials</label>

                    <input
                        type="text"
                        id="setting-initials"
                        maxlength="4"
                        value="${escapeHTML(appSettings.logoInitials)}"
                        placeholder="Example: J"
                    >

                </div>


                <div class="settings-field">

                    <label>Upload Custom Logo</label>

                    <input
                        type="file"
                        id="setting-logo"
                        accept="image/png,image/jpeg,image/webp"
                    >

                    <small style="color:var(--muted-color)">
                        Recommended: Square image, PNG or JPG.
                        Maximum size: 1 MB.
                    </small>

                </div>


                <button
                    class="secondary-btn"
                    onclick="removeCustomLogo()"
                >
                    Remove Custom Logo
                </button>

            </div>


            <!-- APPEARANCE SETTINGS -->

            <div class="settings-card">

                <h3>🎨 Appearance</h3>

                <p class="settings-description">
                    Choose your preferred theme and application colour.
                </p>


                <div class="settings-field">

                    <label>Application Theme</label>

                    <select id="setting-theme">

                        <option value="light"
                            ${appSettings.theme === "light" ? "selected" : ""}>
                            Light Mode
                        </option>

                        <option value="dark"
                            ${appSettings.theme === "dark" ? "selected" : ""}>
                            Dark Mode
                        </option>

                    </select>

                </div>


                <div class="settings-field">

                    <label>Accent Colour</label>

                    <p style="
                        font-size:12px;
                        color:var(--muted-color);
                        margin-bottom:12px
                    ">
                        Select a colour for buttons and highlights.
                    </p>


                    <div class="color-options">

                        ${colors.map(color => `

                            <button
                                type="button"
                                class="color-option ${appSettings.accent === color ? "selected" : ""}"
                                style="background:${color}"
                                title="${color}"
                                aria-label="Choose ${color}"
                                onclick="selectAccentColor('${color}')"
                            ></button>

                        `).join("")}

                    </div>

                    <input
                        type="color"
                        id="setting-custom-color"
                        value="${appSettings.accent}"
                        style="margin-top:18px;width:65px;height:42px;cursor:pointer"
                    >

                    <small style="color:var(--muted-color)">
                        Or choose your own custom colour.
                    </small>

                </div>


                <div class="panel" style="margin-top:20px">

                    <h3>Live Preview</h3>

                    <p style="color:var(--muted-color);margin-bottom:15px">
                        Preview your selected theme and accent colour.
                    </p>

                    <button class="primary-btn">
                        Sample Button
                    </button>

                </div>

            </div>

        </div>


        <!-- SETTINGS ACTIONS -->

        <div class="settings-actions">

            <button
                class="primary-btn"
                onclick="saveAppearanceSettings()"
            >
                Save Changes
            </button>


            <button
                class="reset-btn"
                onclick="resetAppearanceSettings()"
            >
                Reset to Default
            </button>

        </div>

    `;


    // Live logo initials preview

    document.getElementById("setting-initials")
        .addEventListener("input", e => {

            const preview =
                document.getElementById("settings-logo-preview");

            if (!appSettings.logoImage) {

                preview.textContent =
                    e.target.value || "J";

            }

        });


    // Live logo image preview

    document.getElementById("setting-logo")
        .addEventListener("change", previewLogoUpload);


    // Live theme preview

    document.getElementById("setting-theme")
        .addEventListener("change", e => {

            document.body.classList.toggle(
                "dark-theme",
                e.target.value === "dark"
            );

        });


    // Live custom colour preview

    document.getElementById("setting-custom-color")
        .addEventListener("input", e => {

            appSettings.accent = e.target.value;

            applySettings();

            document.querySelectorAll(".color-option")
                .forEach(btn => btn.classList.remove("selected"));

        });

}


// ================= LOGO UPLOAD PREVIEW =================

function previewLogoUpload(event) {

    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

        alert("Please select a valid image.");

        event.target.value = "";

        return;

    }

    if (file.size > 1024 * 1024) {

        alert("Logo size must be less than 1 MB.");

        event.target.value = "";

        return;

    }

    const reader = new FileReader();

    reader.onload = function(e) {

        const preview =
            document.getElementById("settings-logo-preview");

        preview.innerHTML = `
            <img src="${e.target.result}" alt="Logo Preview">
        `;

    };

    reader.readAsDataURL(file);

}


// ================= SELECT ACCENT COLOUR =================

function selectAccentColor(color) {

    appSettings.accent = color;

    applySettings();

    document.getElementById("setting-custom-color").value = color;

    document.querySelectorAll(".color-option")
        .forEach(btn => {

            btn.classList.toggle(
                "selected",
                btn.title === color
            );

        });

}


// ================= SAVE SETTINGS =================

function saveAppearanceSettings() {

    const name =
        document.getElementById("setting-app-name").value.trim();

    const subtitle =
        document.getElementById("setting-subtitle").value.trim();

    const initials =
        document.getElementById("setting-initials").value.trim();

    const theme =
        document.getElementById("setting-theme").value;

    const color =
        document.getElementById("setting-custom-color").value;


    if (!name || !subtitle || !initials) {

        return alert(
            "Please enter application name, subtitle and logo initials."
        );

    }


    if (!/^[a-zA-Z0-9]{1,4}$/.test(initials)) {

        return alert(
            "Logo initials must contain 1–4 letters or numbers."
        );

    }


    const logoInput =
        document.getElementById("setting-logo");

    const file = logoInput.files[0];


    function finishSaving(logoImage) {

        appSettings = {

            appName: name,

            subtitle: subtitle,

            logoInitials: initials.toUpperCase(),

            logoImage: logoImage,

            theme: theme,

            accent: color

        };


        try {

            saveSettings();

        } catch (error) {

            alert(
                "Unable to save settings. The logo may be too large for browser storage."
            );

            return;

        }


        applySettings();

        alert("Your application settings have been saved!");

        renderSettings();

    }


    if (file) {

        if (file.size > 1024 * 1024) {

            return alert("Logo size must be less than 1 MB.");

        }

        const reader = new FileReader();

        reader.onload = function(e) {

            finishSaving(e.target.result);

        };

        reader.onerror = function() {

            alert("Unable to read the selected logo.");

        };

        reader.readAsDataURL(file);

    } else {

        finishSaving(appSettings.logoImage);

    }

}


// ================= REMOVE CUSTOM LOGO =================

function removeCustomLogo() {

    if (!confirm("Remove your custom logo?")) return;

    appSettings.logoImage = "";

    saveSettings();

    applySettings();

    renderSettings();

}


// ================= RESET SETTINGS =================

function resetAppearanceSettings() {

    if (!confirm(
        "Restore the default JIMS branding and appearance?"
    )) return;


    appSettings = { ...DEFAULT_SETTINGS };

    saveSettings();

    applySettings();

    renderSettings();

    alert("Default settings restored successfully!");

}


// =====================================================
// SHARED MODAL AND FORM HELPERS
// =====================================================


// ================= CREATE MODAL =================

function createModal(id, title) {

    closeModal(id);

    const modal = document.createElement("div");

    modal.id = id;

    modal.style.cssText = `
        position:fixed;
        inset:0;
        background:rgba(10,20,40,.55);
        display:grid;
        place-items:center;
        padding:15px;
        z-index:9999;
    `;


    modal.innerHTML = `

        <div style="
            background:var(--card-bg);
            color:var(--text-color);
            padding:28px;
            border-radius:14px;
            width:100%;
            max-width:600px;
            max-height:90vh;
            overflow:auto;
        ">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:22px;
            ">

                <h2>${escapeHTML(title)}</h2>

                <button
                    onclick="closeModal('${id}')"
                    style="
                        border:0;
                        background:none;
                        color:var(--text-color);
                        font-size:25px;
                        cursor:pointer;
                    "
                >
                    &times;
                </button>

            </div>

            <div class="modal-body"></div>

        </div>

    `;


    document.body.appendChild(modal);

    return modal;

}


// ================= CLOSE MODAL =================

function closeModal(id) {

    document.getElementById(id)?.remove();

}


// ================= FORM STYLING =================

function styleForm(modal) {

    modal.querySelectorAll(
        "input,textarea,select"
    ).forEach(input => {

        input.style.cssText = `
            display:block;
            width:100%;
            padding:12px;
            margin:8px 0 16px;
            border:1px solid var(--border-color);
            border-radius:7px;
            font-size:14px;
            background:var(--card-bg);
            color:var(--text-color);
        `;

    });


    modal.querySelectorAll("label")
        .forEach(label => {

            label.style.cssText = `
                font-size:13px;
                font-weight:600;
                color:var(--text-color);
            `;

        });

}


// =====================================================
// NAVIGATION INITIALIZATION
// =====================================================

document.querySelectorAll(".nav-link")
    .forEach(link => {

        link.addEventListener("click", event => {

            event.preventDefault();

            showPage(link.dataset.page);

        });

    });


// =====================================================
// APPLICATION INITIALIZATION
// =====================================================

// Apply saved branding and appearance

applySettings();

// Open dashboard

showPage("dashboard");


// ================= END OF PART 4 =================