/*
    Author: Adam Smithhisler
    Date: 11/1/2026
    Assignment: SDC260 Final Project - Week 4
    Purpose: Shared catalog, persistent inventory and shopping cart,
             cart notifications, checkout, confirmation, and form validation.
*/

/* ========================================
   PRODUCT CATALOG AND SETTINGS
======================================== */

const products = [
    { id: "KIT-001", name: "HG 1/144 Urban Combat Model Kit", category: "Model Kits", price: 24.99, stock: 18, description: "Beginner-friendly model kit designed for customization and diorama builds." },
    { id: "KBP-014", name: "1/144 Mechanical Detail Pack", category: "Kitbash Parts", price: 14.99, stock: 32, description: "Resin mechanical details including vents, thrusters, armor panels, and piping." },
    { id: "DIO-003", name: "Urban Ruin Display Base", category: "Diorama Supplies", price: 19.99, stock: 15, description: "Modular urban terrain pieces designed for 1/144-scale displays." },
    { id: "TLS-008", name: "Precision Hobby Tool Set", category: "Tools", price: 29.99, stock: 20, description: "Basic modeling tool set with nippers, tweezers, sanding tools, and a hobby knife." },
    { id: "WTH-005", name: "Weathering Starter Pack", category: "Weathering & Lighting", price: 17.99, stock: 24, description: "Pigments and washes for adding wear, grime, and environmental effects." },
    { id: "LED-011", name: "1/144 LED Lighting Kit", category: "Weathering & Lighting", price: 12.99, stock: 27, description: "Small LED components and wiring for illuminated model and diorama projects." },
    { id: "KBP-021", name: "Heavy Weapon Upgrade Set", category: "Kitbash Parts", price: 18.99, stock: 16, description: "A collection of rifles, launchers, and mounting components for custom builds." },
    { id: "DIO-009", name: "Industrial Hangar Detail Set", category: "Diorama Supplies", price: 22.99, stock: 12, description: "Panels, pipes, barriers, and industrial details for hangar-style displays." },
    { id: "TLS-015", name: "Fine Detail Sanding Set", category: "Tools", price: 9.99, stock: 35, description: "Multiple sanding grits designed for cleanup, shaping, and surface preparation." },
    { id: "KIT-017", name: "HG 1/144 Desert Operations Model Kit", category: "Model Kits", price: 27.99, stock: 14, description: "1/144-scale model kit designed around desert combat and weathering themes." }
];

const CART_KEY = "oneIn144Cart";
const INVENTORY_KEY = "oneIn144Inventory";
const LAST_ORDER_KEY = "oneIn144LastOrder";
const FREE_SHIPPING_MINIMUM = 75;
const STANDARD_SHIPPING = 6.99;
const coupons = { BUILD10: 10, SCALE15: 15 };
let activeDiscountPercent = 0;
let notificationTimeout;

function money(amount) {
    return `$${Number(amount).toFixed(2)}`;
}

function findProduct(productId) {
    return products.find(product => product.id === productId);
}

/* ========================================
   PERSISTENT CART AND INVENTORY
======================================== */

function getCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        return Array.isArray(saved) ? saved.filter(item =>
            findProduct(item.id) && Number.isInteger(item.quantity) && item.quantity > 0
        ) : [];
    } catch (error) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getInventory() {
    try {
        const inventory = JSON.parse(localStorage.getItem(INVENTORY_KEY));
        if (inventory && typeof inventory === "object" && !Array.isArray(inventory)) {
            return inventory;
        }
    } catch (error) {
        // Invalid saved inventory is replaced with initial stock.
    }

    // First Week 4 visit: reserve products already in the Week 3 cart.
    // This migration prevents an existing cart from counting as extra stock.
    const cart = getCart();
    const inventory = {};
    products.forEach(product => {
        const reserved = cart
            .filter(item => item.id === product.id)
            .reduce((total, item) => total + item.quantity, 0);
        inventory[product.id] = Math.max(0, product.stock - reserved);
    });
    saveInventory(inventory);
    return inventory;
}

function saveInventory(inventory) {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
}

function availableStock(productId) {
    const product = findProduct(productId);
    if (!product) return 0;
    const saved = getInventory()[productId];
    return Number.isInteger(saved) ? Math.max(0, saved) : product.stock;
}

function adjustStock(productId, change) {
    const product = findProduct(productId);
    if (!product) return false;
    const inventory = getInventory();
    const current = availableStock(productId);
    const next = current + change;
    if (next < 0 || next > product.stock) return false;
    inventory[productId] = next;
    saveInventory(inventory);
    return true;
}

function calculateCartSubtotal(cart) {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function calculateCartItemCount(cart) {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

/* ========================================
   FLOATING QUICK CART (WEEK 4)

   The cart button and expandable panel are created once
   by JavaScript, so the same cart works on all nine pages
   without editing every HTML file again.
======================================== */

function initializeQuickCart() {
    if (document.getElementById("quickCartRoot")) return;

    const widget = document.createElement("div");
    widget.id = "quickCartRoot";
    widget.className = "quick-cart-root";
    widget.innerHTML = `
        <section id="quickCartPanel" class="quick-cart-panel"
                 aria-label="Quick shopping cart" hidden>
            <div class="quick-cart-panel-header">
                <div>
                    <h2>Shopping Cart</h2>
                    <p>Review items without leaving this page.</p>
                </div>
                <button id="quickCartClose" class="quick-cart-close"
                        type="button" aria-label="Close shopping cart">&times;</button>
            </div>
            <div id="quickCartItems" class="quick-cart-items"></div>
            <div class="quick-cart-panel-footer">
                <div class="quick-cart-total-row">
                    <span>Items</span>
                    <strong id="quickCartCount">0</strong>
                </div>
                <div class="quick-cart-total-row quick-cart-total-price">
                    <span>Subtotal</span>
                    <strong id="quickCartSubtotal">$0.00</strong>
                </div>
                <p class="quick-cart-shipping">Shipping and coupons are calculated at checkout.</p>
                <a id="quickCartCheckout" class="quick-cart-checkout" href="checkout.html">
                    Proceed to Checkout
                </a>
                <div class="quick-cart-secondary-actions">
                    <button id="quickCartClearButton" type="button">Clear Cart</button>
                    <a href="cart.html">View Full Cart</a>
                </div>
            </div>
        </section>
        <button id="quickCartToggle" class="quick-cart-toggle" type="button"
                aria-controls="quickCartPanel" aria-expanded="false">
            <span class="quick-cart-toggle-label">Cart</span>
            <span id="quickCartToggleCount" class="quick-cart-toggle-count">0</span>
            <span id="quickCartToggleTotal" class="quick-cart-toggle-total">$0.00</span>
            <span id="quickCartToggleArrow" class="quick-cart-toggle-arrow"
                  aria-hidden="true">&#9650;</span>
        </button>`;
    document.body.appendChild(widget);

    document.getElementById("quickCartToggle").addEventListener("click", () => {
        setQuickCartOpen(document.getElementById("quickCartPanel").hidden);
    });
    document.getElementById("quickCartClose").addEventListener("click", () => {
        setQuickCartOpen(false);
        document.getElementById("quickCartToggle").focus();
    });
    document.getElementById("quickCartClearButton").addEventListener("click", clearCart);
    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !document.getElementById("quickCartPanel").hidden) {
            setQuickCartOpen(false);
            document.getElementById("quickCartToggle").focus();
        }
    });
}

function setQuickCartOpen(isOpen) {
    const panel = document.getElementById("quickCartPanel");
    const toggle = document.getElementById("quickCartToggle");
    const arrow = document.getElementById("quickCartToggleArrow");
    if (!panel || !toggle) return;
    panel.hidden = !isOpen;
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Collapse shopping cart" : "Expand shopping cart");
    if (arrow) arrow.innerHTML = isOpen ? "&#9660;" : "&#9650;";
}

function renderQuickCart() {
    const container = document.getElementById("quickCartItems");
    if (!container) return;

    const cart = getCart();
    const count = calculateCartItemCount(cart);
    const subtotal = money(calculateCartSubtotal(cart));
    const previousScroll = container.scrollTop;

    if (!cart.length) {
        container.innerHTML = `
            <div class="quick-cart-empty">
                <p>Your shopping cart is empty.</p>
                <a href="shop.html">Browse Products</a>
            </div>`;
    } else {
        // All displayed product names and prices come from the fixed catalog.
        // Buttons reuse the same event-delegated cart actions as cart.html.
        container.innerHTML = cart.map(item => {
            const product = findProduct(item.id);
            const stock = availableStock(item.id);
            return `
                <article class="quick-cart-item">
                    <div class="quick-cart-item-heading">
                        <h3>${product.name}</h3>
                        <button type="button" class="remove-cart-item"
                                data-product-id="${product.id}"
                                aria-label="Remove ${product.name} from cart">Remove</button>
                    </div>
                    <p class="quick-cart-unit-price">${money(product.price)} each</p>
                    <div class="quick-cart-item-bottom">
                        <div class="quantity-controls">
                            <button type="button" class="quantity-button decrease-quantity"
                                    data-product-id="${product.id}"
                                    ${item.quantity <= 1 ? "disabled" : ""}
                                    aria-label="Decrease quantity of ${product.name}">−</button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button type="button" class="quantity-button increase-quantity"
                                    data-product-id="${product.id}"
                                    ${stock === 0 ? 'disabled title="Out of Stock"' : ""}
                                    aria-label="Increase quantity of ${product.name}">+</button>
                        </div>
                        <strong>${money(item.quantity * product.price)}</strong>
                    </div>
                </article>`;
        }).join("");
    }
    container.scrollTop = previousScroll;

    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };
    setText("quickCartCount", count);
    setText("quickCartSubtotal", subtotal);
    setText("quickCartToggleCount", count);
    setText("quickCartToggleTotal", subtotal);

    const clear = document.getElementById("quickCartClearButton");
    if (clear) clear.disabled = cart.length === 0;
    const checkout = document.getElementById("quickCartCheckout");
    if (checkout) checkout.hidden = cart.length === 0;
    const toggle = document.getElementById("quickCartToggle");
    if (toggle) {
        const open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-label", `${open ? "Collapse" : "Expand"} shopping cart, ${count} items, ${subtotal}`);
    }
}

/* ========================================
   SITE-WIDE CART SUMMARY
======================================== */

function updateHeaderCart() {
    const cart = getCart();
    const count = calculateCartItemCount(cart);
    const subtotal = money(calculateCartSubtotal(cart));
    ["navCartCount", "homeCartCount"].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = count;
    });
    const subtotalElement = document.getElementById("homeCartSubtotal");
    if (subtotalElement) subtotalElement.textContent = subtotal;
}

/* ========================================
   CART NOTIFICATIONS AND STOCK TOOLTIP
======================================== */

// Visual feedback explains a successful Add to Cart without blocking the page.
function showCartNotification(message) {
    const notification = document.getElementById("cartNotification");
    if (!notification) return;

    clearTimeout(notificationTimeout);
    notification.textContent = message;
    notification.hidden = false;
    notification.classList.add("show");
    notificationTimeout = setTimeout(() => {
        notification.classList.remove("show");
        notification.hidden = true;
    }, 2500);
}

function showOutOfStockTooltip(event) {
    const tooltip = document.getElementById("outOfStockTooltip");
    if (!tooltip) return;
    tooltip.textContent = "Out of Stock";
    tooltip.hidden = false;
    tooltip.style.position = "fixed";
    tooltip.style.left = `${Math.min(event.clientX + 14, window.innerWidth - 130)}px`;
    tooltip.style.top = `${Math.min(event.clientY + 14, window.innerHeight - 40)}px`;
    tooltip.style.pointerEvents = "none";
    tooltip.style.zIndex = "9999";
}

function hideOutOfStockTooltip() {
    const tooltip = document.getElementById("outOfStockTooltip");
    if (tooltip) tooltip.hidden = true;
}

function enableOutOfStockTooltip(card) {
    if (!card || card.dataset.tooltipReady === "true") return;
    card.dataset.tooltipReady = "true";
    // Listen on the card because disabled buttons do not reliably emit hover events.
    card.addEventListener("mousemove", showOutOfStockTooltip);
    card.addEventListener("mouseleave", hideOutOfStockTooltip);
}

/* ========================================
   PRODUCT CARD RENDERING
======================================== */

function productCardHTML(product) {
    const stock = availableStock(product.id);
    const soldOut = stock === 0;
    return `
        <article class="product-card${soldOut ? " out-of-stock" : ""}"
                 data-product-id="${product.id}"
                 ${soldOut ? 'title="Out of Stock"' : ""}>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p><strong>Category:</strong> ${product.category}</p>
            <p class="product-stock"><strong>Stock:</strong> ${soldOut ? "Out of Stock" : stock}</p>
            <p><strong>${money(product.price)}</strong></p>
            <div class="product-actions">
                <a href="${product.id === "KIT-001" ? "product.html" : "shop.html"}">
                    ${product.id === "KIT-001" ? "View Product" : "View in Shop"}
                </a>
                <button type="button" class="add-to-cart"
                        data-product-id="${product.id}"
                        ${soldOut ? 'disabled aria-disabled="true" title="Out of Stock"' : ""}>
                    ${soldOut ? "Out of Stock" : "Add to Cart"}
                </button>
            </div>
        </article>`;
}

function renderProducts() {
    const container = document.getElementById("productContainer");
    if (!container) return;
    container.innerHTML = products.map(productCardHTML).join("");
    container.querySelectorAll(".product-card.out-of-stock").forEach(enableOutOfStockTooltip);
}

function renderFeaturedProducts() {
    const container = document.getElementById("featuredProductContainer");
    if (!container) return;
    const featuredIds = ["KIT-001", "KBP-014", "DIO-003"];
    container.innerHTML = featuredIds.map(id => productCardHTML(findProduct(id))).join("");
    container.querySelectorAll(".product-card.out-of-stock").forEach(enableOutOfStockTooltip);
}

function renderProductDetails() {
    const details = document.getElementById("productDetails");
    if (!details) return;
    const productId = details.dataset.productId || "KIT-001";
    const product = findProduct(productId);
    if (!product) return;
    const stock = availableStock(productId);
    const stockText = document.getElementById("productStock");
    const stockLabel = document.getElementById("productStockLabel");
    const tableStock = document.getElementById("productTableStock");
    const price = document.getElementById("productPrice");
    const button = document.getElementById("productAddToCart");
    const message = document.getElementById("productOutOfStockMessage");

    if (stockText) stockText.textContent = stock;
    if (stockLabel) stockLabel.textContent = stock === 0 ? "Out of Stock" : "in stock";
    if (tableStock) tableStock.textContent = stock;
    if (price) price.textContent = money(product.price);
    if (button) {
        button.disabled = stock === 0;
        button.textContent = stock === 0 ? "Out of Stock" : "Add to Cart";
        button.title = stock === 0 ? "Out of Stock" : "";
    }
    if (message) message.hidden = stock > 0;
    details.classList.toggle("out-of-stock", stock === 0);
    if (stock === 0) enableOutOfStockTooltip(details);
    else hideOutOfStockTooltip();
}

function refreshStorefront() {
    renderProducts();
    renderFeaturedProducts();
    renderProductDetails();
    renderCart();
    renderCheckout();
    updateHeaderCart();
    renderQuickCart();
}

/* ========================================
   ADD, UPDATE, REMOVE, AND CLEAR CART
======================================== */

function addToCart(productId) {
    const product = findProduct(productId);
    if (!product) return;
    if (availableStock(productId) < 1) {
        showCartNotification(`${product.name} is out of stock.`);
        return;
    }

    const cart = getCart();
    let item = cart.find(entry => entry.id === productId);
    if (!adjustStock(productId, -1)) return;

    if (item) item.quantity++;
    else cart.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });

    saveCart(cart);
    refreshStorefront();
    showCartNotification(`${product.name} added to cart.`);
}

function updateCartQuantity(productId, change) {
    const cart = getCart();
    const item = cart.find(entry => entry.id === productId);
    if (!item || !findProduct(productId) || !Number.isInteger(change)) return;

    if (change > 0) {
        if (availableStock(productId) < change) {
            showCartNotification("No additional stock is available for this product.");
            return;
        }
        if (!adjustStock(productId, -change)) return;
        item.quantity += change;
    } else if (change < 0) {
        if (item.quantity + change < 1) return;
        if (!adjustStock(productId, -change)) return;
        item.quantity += change;
    } else return;

    saveCart(cart);
    refreshStorefront();
}

function removeFromCart(productId) {
    const cart = getCart();
    const item = cart.find(entry => entry.id === productId);
    if (!item) return;
    if (!adjustStock(productId, item.quantity)) return;
    saveCart(cart.filter(entry => entry.id !== productId));
    refreshStorefront();
    showCartNotification(`${item.name} removed from cart.`);
}

function clearCart() {
    const cart = getCart();
    if (cart.length === 0) return;
    const inventory = getInventory();
    cart.forEach(item => {
        const product = findProduct(item.id);
        if (product) {
            const current = availableStock(item.id);
            inventory[item.id] = Math.min(product.stock, current + item.quantity);
        }
    });
    saveInventory(inventory);
    saveCart([]);
    refreshStorefront();
    showCartNotification("Your cart has been cleared. Items returned to stock.");
}

// Event delegation also supports product buttons generated after page load.
document.addEventListener("click", event => {
    const addButton = event.target.closest("button.add-to-cart");
    if (addButton && !addButton.disabled) addToCart(addButton.dataset.productId);

    const decreaseButton = event.target.closest(".decrease-quantity");
    if (decreaseButton) updateCartQuantity(decreaseButton.dataset.productId, -1);

    const increaseButton = event.target.closest(".increase-quantity");
    if (increaseButton && !increaseButton.disabled) updateCartQuantity(increaseButton.dataset.productId, 1);

    const removeButton = event.target.closest(".remove-cart-item");
    if (removeButton) removeFromCart(removeButton.dataset.productId);

    if (event.target.closest("#clearCartButton")) clearCart();
});

/* ========================================
   SHOPPING CART PAGE
======================================== */

function renderCart() {
    const container = document.getElementById("cartItems");
    if (!container) return;
    const cart = getCart();
    const itemCount = calculateCartItemCount(cart);
    const subtotal = calculateCartSubtotal(cart);

    if (cart.length === 0) {
        container.innerHTML = `
            <article class="cart-item"><div>
                <h3>Your cart is currently empty.</h3>
                <p>Visit the shop to add products to your build.</p>
                <a class="product-button" href="shop.html">Continue Shopping</a>
            </div></article>`;
    } else {
        container.innerHTML = cart.map(item => {
            const stock = availableStock(item.id);
            return `
                <article class="cart-item">
                    <div class="cart-item-info">
                        <h3>${item.name}</h3>
                        <p><strong>Unit Price:</strong> ${money(item.price)}</p>
                        <p><strong>Available Stock:</strong> ${stock}</p>
                        <div class="quantity-controls">
                            <span><strong>Quantity:</strong></span>
                            <button type="button" class="quantity-button decrease-quantity"
                                    data-product-id="${item.id}"
                                    ${item.quantity <= 1 ? "disabled" : ""}
                                    aria-label="Decrease quantity of ${item.name}">−</button>
                            <span class="quantity-value">${item.quantity}</span>
                            <button type="button" class="quantity-button increase-quantity"
                                    data-product-id="${item.id}"
                                    ${stock === 0 ? 'disabled title="Out of Stock"' : ""}
                                    aria-label="Increase quantity of ${item.name}">+</button>
                        </div>
                        <button type="button" class="remove-cart-item"
                                data-product-id="${item.id}">Remove</button>
                    </div>
                    <div class="cart-item-total">
                        <p>Item Total</p>
                        <p class="cart-price">${money(item.price * item.quantity)}</p>
                    </div>
                </article>`;
        }).join("");
    }

    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };
    setText("cartItemCount", itemCount);
    setText("cartSubtotal", money(subtotal));
    setText("cartTotal", money(subtotal));

    const checkoutButton = document.getElementById("checkoutButton");
    if (checkoutButton) checkoutButton.hidden = cart.length === 0;
    const clearButton = document.getElementById("clearCartButton");
    if (clearButton) clearButton.disabled = cart.length === 0;
}

/* ========================================
   SHIPPING, COUPONS, AND CHECKOUT SUMMARY
======================================== */

function calculateShipping(subtotal) {
    return subtotal >= FREE_SHIPPING_MINIMUM ? 0 : STANDARD_SHIPPING;
}

function orderTotals(cart) {
    const subtotal = calculateCartSubtotal(cart);
    const discount = subtotal * (activeDiscountPercent / 100);
    const shipping = cart.length ? calculateShipping(subtotal) : 0;
    return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}

function renderCheckout() {
    const container = document.getElementById("checkoutItems");
    if (!container) return;
    const cart = getCart();
    const totals = orderTotals(cart);

    container.innerHTML = cart.length ? cart.map(item => `
        <div class="checkout-item">
            <div><h3>${item.name}</h3><p>Quantity: ${item.quantity}</p></div>
            <strong>${money(item.price * item.quantity)}</strong>
        </div>`).join("") : "<p>Your cart is currently empty.</p>";

    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };
    setText("checkoutSubtotal", money(totals.subtotal));
    setText("checkoutDiscount", `-${money(totals.discount)}`);
    setText("checkoutShipping", cart.length && totals.shipping === 0 ? "FREE" : money(totals.shipping));
    setText("checkoutTotal", money(totals.total));

    const discountRow = document.getElementById("discountRow");
    if (discountRow) discountRow.hidden = totals.discount === 0;
    const submitButton = document.getElementById("submitOrderButton");
    if (submitButton) submitButton.disabled = cart.length === 0;
}

function applyCoupon() {
    const input = document.getElementById("coupon-code");
    const message = document.getElementById("couponMessage");
    if (!input || !message) return;
    const code = input.value.trim().toUpperCase();

    if (!code) {
        activeDiscountPercent = 0;
        message.textContent = "Enter a coupon code.";
    } else if (Object.prototype.hasOwnProperty.call(coupons, code)) {
        activeDiscountPercent = coupons[code];
        message.textContent = `${activeDiscountPercent}% discount applied.`;
    } else {
        activeDiscountPercent = 0;
        message.textContent = "Coupon code not recognized.";
    }
    renderCheckout();
}

function validateCheckout() {
    const message = document.getElementById("checkoutMessage");
    if (!message) return false;
    if (getCart().length === 0) {
        message.textContent = "Your cart is empty.";
        return false;
    }

    const field = id => (document.getElementById(id)?.value || "").trim();
    const requiredIds = [
        "shipping-name", "shipping-address", "shipping-city", "shipping-state",
        "shipping-zip", "shipping-phone", "cardholder-name", "card-number",
        "expiration-date", "security-code"
    ];
    if (requiredIds.some(id => !field(id))) {
        message.textContent = "Please complete all required fields.";
        return false;
    }
    if (!/^[A-Za-z]{2}$/.test(field("shipping-state"))) {
        message.textContent = "Enter the state using its two-letter abbreviation.";
        return false;
    }
    if (!/^\d{5}(-\d{4})?$/.test(field("shipping-zip"))) {
        message.textContent = "Enter a valid ZIP Code.";
        return false;
    }
    if (field("shipping-phone").replace(/\D/g, "").length !== 10) {
        message.textContent = "Enter a valid 10-digit phone number.";
        return false;
    }
    if (!/^\d{13,16}$/.test(field("card-number").replace(/\s/g, ""))) {
        message.textContent = "Enter a valid credit card number.";
        return false;
    }
    if (!/^\d{3,4}$/.test(field("security-code"))) {
        message.textContent = "Enter a valid 3 or 4 digit security code.";
        return false;
    }
    const expiration = new Date(`${field("expiration-date")}-01T00:00:00`);
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (Number.isNaN(expiration.getTime()) || expiration < currentMonth) {
        message.textContent = "The card expiration date must be current or future.";
        return false;
    }
    message.textContent = "";
    return true;
}

function submitOrder(event) {
    event.preventDefault();
    if (!validateCheckout()) return;
    const cart = getCart();
    const totals = orderTotals(cart);
    // Store only the order summary: never store payment or card details.
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ cart, ...totals }));
    // Purchased stock was reserved on Add to Cart; do NOT restore it here.
    saveCart([]);
    updateHeaderCart();
    window.location.href = "confirmation.html";
}

/* ========================================
   CONFIRMATION PAGE
======================================== */

function getLastOrder() {
    try {
        return JSON.parse(localStorage.getItem(LAST_ORDER_KEY));
    } catch (error) {
        return null;
    }
}

function renderConfirmation() {
    const container = document.getElementById("confirmationItems");
    if (!container) return;
    const order = getLastOrder();
    const message = document.getElementById("confirmationMessage");
    const setText = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };
    const discountRow = document.getElementById("confirmationDiscountRow");

    if (!order || !Array.isArray(order.cart) || order.cart.length === 0) {
        if (message) message.textContent = "No completed order was found.";
        container.innerHTML = "<p>Complete an order through checkout to view its confirmation details.</p>";
        setText("confirmationSubtotal", "$0.00");
        setText("confirmationDiscount", "-$0.00");
        setText("confirmationShipping", "$0.00");
        setText("confirmationTotal", "$0.00");
        if (discountRow) discountRow.hidden = true;
        return;
    }

    if (message) message.textContent = "Your One in 144 prototype order has been successfully submitted.";
    container.innerHTML = order.cart.map(item => `
        <div class="checkout-item">
            <div><h3>${item.name}</h3><p>Quantity: ${item.quantity}</p></div>
            <strong>${money(item.price * item.quantity)}</strong>
        </div>`).join("");
    setText("confirmationSubtotal", money(order.subtotal));
    setText("confirmationDiscount", `-${money(order.discount)}`);
    setText("confirmationShipping", order.shipping === 0 ? "FREE" : money(order.shipping));
    setText("confirmationTotal", money(order.total));
    if (discountRow) discountRow.hidden = order.discount <= 0;
}

/* ========================================
   CONTACT FORM
======================================== */

function validateContactForm() {
    const message = document.getElementById("contactMessage");
    const email = document.getElementById("contact-email")?.value.trim() || "";
    const body = document.getElementById("contact-message")?.value.trim() || "";
    if (!message) return false;

    if (!email || !body) {
        message.textContent = "Please complete the required email and message fields.";
        return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        message.textContent = "Please enter a valid email address.";
        return false;
    }
    if (body.length < 10) {
        message.textContent = "Please enter a message containing at least 10 characters.";
        return false;
    }
    message.textContent = "";
    return true;
}

function submitContactForm(event) {
    event.preventDefault();
    if (!validateContactForm()) return;
    document.getElementById("contactMessage").textContent =
        "Your message passed validation. This prototype does not send messages.";
    event.currentTarget.reset();
}

/* ========================================
   CUSTOM 3D PRINT FORM (PROTOTYPE ONLY)
======================================== */

function submitCustomPrintForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = document.getElementById("customPrintMessage");
    const file = document.getElementById("design-file")?.files[0];
    const permission = document.getElementById("permission")?.checked;
    if (!message) return;

    if (!file || !/\.(stl|obj)$/i.test(file.name)) {
        message.textContent = "Please select an STL or OBJ design file.";
        return;
    }
    if (!permission) {
        message.textContent = "Please confirm you have permission to reproduce this design.";
        return;
    }
    const quantity = Number(document.getElementById("quantity")?.value);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        message.textContent = "Choose a quantity between 1 and 10.";
        return;
    }
    // A local static site cannot upload the selected file or create a real order.
    message.textContent = "Print request details validated. No file was uploaded; this is a classroom prototype.";
    form.reset();
}

/* ========================================
   INITIALIZATION AND EVENT LISTENERS
======================================== */

// Build inventory once so the Week 3 cart is accounted for before rendering.
getInventory();
initializeQuickCart();
refreshStorefront();
renderConfirmation();

const couponButton = document.getElementById("applyCouponButton");
if (couponButton) couponButton.addEventListener("click", applyCoupon);

const checkoutForm = document.getElementById("checkoutForm");
if (checkoutForm) checkoutForm.addEventListener("submit", submitOrder);

const contactForm = document.getElementById("contactForm");
if (contactForm) contactForm.addEventListener("submit", submitContactForm);

const customPrintForm = document.getElementById("customPrintForm");
if (customPrintForm) customPrintForm.addEventListener("submit", submitCustomPrintForm);

// Refresh the header when another tab changes localStorage.
window.addEventListener("storage", event => {
    if ([CART_KEY, INVENTORY_KEY].includes(event.key)) refreshStorefront();
});
