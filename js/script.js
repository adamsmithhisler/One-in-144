
/*
    Author: Adam Smithhisler
    Date: November 8, 2026
    Assignment: SDC260 Final Project - Week 5
    Purpose: Preserve the Week 4 Smart Cart, catalog, inventory,
             checkout, and forms while adding custom-print
             estimates and prototype print requests.
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
const CUSTOM_QUANTITY_LIMIT = 10;

// Classroom prototype prices (not real print quotes or model-volume estimates).
const PRINT_PRICES = {
    material: { "standard-resin": 8, "abs-resin": 10, pla: 6 },
    scale: { "1-144": 1, "1-100": 1.35, "1-72": 1.75 },
    detail: { standard: 0, fine: 3, ultra: 6 },
    finish: { raw: 0, primed: 2.5 }
};

let reviewedCustomRequest = null;

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

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[character]));
}

function customUnitPrice(config) {
    if (
        !config ||
        !Object.prototype.hasOwnProperty.call(PRINT_PRICES.material, config.material) ||
        !Object.prototype.hasOwnProperty.call(PRINT_PRICES.scale, config.scale) ||
        !Object.prototype.hasOwnProperty.call(PRINT_PRICES.detail, config.detail) ||
        !Object.prototype.hasOwnProperty.call(PRINT_PRICES.finish, config.finish)
    ) {
        // Other scales need manual review.
        // Do not assign an invented quote.
        return null;
    }

    const cost = (
        PRINT_PRICES.material[config.material] +
        PRINT_PRICES.detail[config.detail] +
        PRINT_PRICES.finish[config.finish]
    ) * PRINT_PRICES.scale[config.scale];

    return Math.round(cost * 100) / 100;
}

function isCustomItem(item) {
    return item?.kind === "custom-print" &&
        typeof item.id === "string" &&
        /^CUSTOM-[a-z0-9-]+$/i.test(item.id);
}

function customItemDetailsHTML(item) {
    if (!isCustomItem(item)) return "";

    const config = item.custom;

    return `
        <p class="custom-cart-details">
            ${escapeHTML(config.materialLabel)} ·
            ${escapeHTML(config.scaleLabel)} ·
            ${escapeHTML(config.detailLabel)} ·
            ${escapeHTML(config.finishLabel)}
            <br>
            Design: ${escapeHTML(config.fileName)} (filename only)
        </p>`;
}

/* ========================================
   PERSISTENT CART AND INVENTORY
======================================== */

function getCart() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(CART_KEY) || "[]"
        );

        if (!Array.isArray(saved)) return [];

        return saved.flatMap(item => {
            if (
                !item ||
                !Number.isInteger(item.quantity) ||
                item.quantity < 1
            ) {
                return [];
            }

            const catalogProduct = findProduct(item.id);

            if (catalogProduct) {
                // Use canonical names and prices.
                return [{
                    id: catalogProduct.id,
                    name: catalogProduct.name,
                    price: catalogProduct.price,
                    quantity: item.quantity
                }];
            }

            if (
                !isCustomItem(item) ||
                item.quantity > CUSTOM_QUANTITY_LIMIT ||
                !item.custom ||
                typeof item.custom !== "object"
            ) {
                return [];
            }

            const c = item.custom;
            const price = customUnitPrice(c);

            if (
                price === null ||
                !Number.isFinite(price) ||
                typeof c.projectName !== "string" ||
                !c.projectName.trim() ||
                typeof c.fileName !== "string" ||
                !/\.(stl|obj)$/i.test(c.fileName)
            ) {
                return [];
            }

            const custom = {
                material: c.material,
                scale: c.scale,
                detail: c.detail,
                finish: c.finish,

                materialLabel: String(
                    c.materialLabel || c.material
                ).slice(0, 50),

                scaleLabel: String(
                    c.scaleLabel || c.scale
                ).slice(0, 50),

                detailLabel: String(
                    c.detailLabel || c.detail
                ).slice(0, 50),

                finishLabel: String(
                    c.finishLabel || c.finish
                ).slice(0, 50),

                projectName: c.projectName.trim().slice(0, 60),
                fileName: c.fileName.slice(0, 200),
                notes: String(c.notes || "").slice(0, 500)
            };

            return [{
                id: item.id,
                kind: "custom-print",
                name: `Custom Print: ${custom.projectName}`,
                price,
                quantity: item.quantity,
                custom
            }];
        });
    } catch (error) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getInventory() {
    try {
        const inventory = JSON.parse(
            localStorage.getItem(INVENTORY_KEY)
        );

        if (
            inventory &&
            typeof inventory === "object" &&
            !Array.isArray(inventory)
        ) {
            return inventory;
        }
    } catch (error) {
        // Replace invalid saved inventory.
    }

    // Account for items already in an existing cart.
    const cart = getCart();
    const inventory = {};

    products.forEach(product => {
        const reserved = cart
            .filter(item => item.id === product.id)
            .reduce(
                (total, item) => total + item.quantity,
                0
            );

        inventory[product.id] = Math.max(
            0,
            product.stock - reserved
        );
    });

    saveInventory(inventory);

    return inventory;
}

function saveInventory(inventory) {
    localStorage.setItem(
        INVENTORY_KEY,
        JSON.stringify(inventory)
    );
}

function availableStock(productId) {
    const product = findProduct(productId);

    if (!product) return 0;

    const saved = getInventory()[productId];

    return Number.isInteger(saved)
        ? Math.max(0, saved)
        : product.stock;
}

function adjustStock(productId, change) {
    const product = findProduct(productId);

    if (!product) return false;

    const inventory = getInventory();
    const current = availableStock(productId);
    const next = current + change;

    if (next < 0 || next > product.stock) {
        return false;
    }

    inventory[productId] = next;
    saveInventory(inventory);

    return true;
}

function calculateCartSubtotal(cart) {
    return cart.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );
}

function calculateCartItemCount(cart) {
    return cart.reduce(
        (total, item) => total + item.quantity,
        0
    );
}

/* ========================================
   FLOATING QUICK CART

   The cart button and expandable panel
   are created by JavaScript so the same
   cart works across the website.
======================================== */

function initializeQuickCart() {
    if (document.getElementById("quickCartRoot")) return;

    const widget = document.createElement("div");

    widget.id = "quickCartRoot";
    widget.className = "quick-cart-root";

    widget.innerHTML = `
        <section
            id="quickCartPanel"
            class="quick-cart-panel"
            aria-label="Quick shopping cart"
            hidden>

            <div class="quick-cart-panel-header">
                <div>
                    <h2>Shopping Cart</h2>
                    <p>Review items without leaving this page.</p>
                </div>

                <button
                    id="quickCartClose"
                    class="quick-cart-close"
                    type="button"
                    aria-label="Close shopping cart">
                    &times;
                </button>
            </div>

            <div
                id="quickCartItems"
                class="quick-cart-items">
            </div>

            <div class="quick-cart-panel-footer">

                <div class="quick-cart-total-row">
                    <span>Items</span>
                    <strong id="quickCartCount">0</strong>
                </div>

                <div class="quick-cart-total-row quick-cart-total-price">
                    <span>Subtotal</span>
                    <strong id="quickCartSubtotal">$0.00</strong>
                </div>

                <p class="quick-cart-shipping">
                    Shipping and coupons are calculated at checkout.
                </p>

                <a
                    id="quickCartCheckout"
                    class="quick-cart-checkout"
                    href="checkout.html">
                    Proceed to Checkout
                </a>

                <div class="quick-cart-secondary-actions">
                    <button
                        id="quickCartClearButton"
                        type="button">
                        Clear Cart
                    </button>

                    <a href="cart.html">View Full Cart</a>
                </div>
            </div>
        </section>

        <button
            id="quickCartToggle"
            class="quick-cart-toggle"
            type="button"
            aria-controls="quickCartPanel"
            aria-expanded="false">

            <span class="quick-cart-toggle-label">Cart</span>

            <span
                id="quickCartToggleCount"
                class="quick-cart-toggle-count">
                0
            </span>

            <span
                id="quickCartToggleTotal"
                class="quick-cart-toggle-total">
                $0.00
            </span>

            <span
                id="quickCartToggleArrow"
                class="quick-cart-toggle-arrow"
                aria-hidden="true">
                &#9650;
            </span>
        </button>
    `;

    document.body.appendChild(widget);

    document
        .getElementById("quickCartToggle")
        .addEventListener("click", () => {
            setQuickCartOpen(
                document.getElementById("quickCartPanel").hidden
            );
        });

    document
        .getElementById("quickCartClose")
        .addEventListener("click", () => {
            setQuickCartOpen(false);
            document.getElementById("quickCartToggle").focus();
        });

    document
        .getElementById("quickCartClearButton")
        .addEventListener("click", clearCart);

    document.addEventListener("keydown", event => {
        if (
            event.key === "Escape" &&
            !document.getElementById("quickCartPanel").hidden
        ) {
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

    toggle.setAttribute(
        "aria-expanded",
        String(isOpen)
    );

    toggle.setAttribute(
        "aria-label",
        isOpen ? "Collapse shopping cart" : "Expand shopping cart"
    );

    if (arrow) {
        arrow.innerHTML = isOpen ? "&#9660;" : "&#9650;";
    }
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
        container.innerHTML = cart.map(item => {
            const custom = isCustomItem(item);

            const remaining = custom
                ? CUSTOM_QUANTITY_LIMIT - item.quantity
                : availableStock(item.id);

            return `
                <article class="quick-cart-item">

                    <div class="quick-cart-item-heading">
                        <h3>${escapeHTML(item.name)}</h3>

                        <button
                            type="button"
                            class="remove-cart-item"
                            data-product-id="${escapeHTML(item.id)}"
                            aria-label="Remove ${escapeHTML(item.name)} from cart">
                            Remove
                        </button>
                    </div>

                    ${customItemDetailsHTML(item)}

                    <p class="quick-cart-unit-price">
                        ${money(item.price)} each
                        ${custom ? " · Prototype estimate" : ""}
                    </p>

                    <div class="quick-cart-item-bottom">

                        <div class="quantity-controls">

                            <button
                                type="button"
                                class="quantity-button decrease-quantity"
                                data-product-id="${escapeHTML(item.id)}"
                                ${item.quantity <= 1 ? "disabled" : ""}
                                aria-label="Decrease quantity of ${escapeHTML(item.name)}">
                                −
                            </button>

                            <span class="quantity-value">
                                ${item.quantity}
                            </span>

                            <button
                                type="button"
                                class="quantity-button increase-quantity"
                                data-product-id="${escapeHTML(item.id)}"
                                ${remaining === 0 ? 'disabled title="Maximum quantity or out of stock"' : ""}
                                aria-label="Increase quantity of ${escapeHTML(item.name)}">
                                +
                            </button>
                        </div>

                        <strong>
                            ${money(item.quantity * item.price)}
                        </strong>
                    </div>
                </article>`;
        }).join("");
    }

    container.scrollTop = previousScroll;

    const setText = (id, value) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    };

    setText("quickCartCount", count);
    setText("quickCartSubtotal", subtotal);
    setText("quickCartToggleCount", count);
    setText("quickCartToggleTotal", subtotal);

    const clear = document.getElementById("quickCartClearButton");

    if (clear) {
        clear.disabled = cart.length === 0;
    }

    const checkout = document.getElementById("quickCartCheckout");

    if (checkout) {
        checkout.hidden = cart.length === 0;
    }

    const toggle = document.getElementById("quickCartToggle");

    if (toggle) {
        const open = toggle.getAttribute("aria-expanded") === "true";

        toggle.setAttribute(
            "aria-label",
            `${open ? "Collapse" : "Expand"} shopping cart, ${count} items, ${subtotal}`
        );
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

        if (element) {
            element.textContent = count;
        }
    });

    const subtotalElement =
        document.getElementById("homeCartSubtotal");

    if (subtotalElement) {
        subtotalElement.textContent = subtotal;
    }
}

/* ========================================
   CART NOTIFICATIONS AND STOCK TOOLTIP
======================================== */

// Visual feedback explains a successful
// Add to Cart action without blocking the page.

function showCartNotification(message) {
    const notification =
        document.getElementById("cartNotification");

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
    const tooltip =
        document.getElementById("outOfStockTooltip");

    if (!tooltip) return;

    tooltip.textContent = "Out of Stock";
    tooltip.hidden = false;
    tooltip.style.position = "fixed";

    tooltip.style.left =
        `${Math.min(event.clientX + 14, window.innerWidth - 130)}px`;

    tooltip.style.top =
        `${Math.min(event.clientY + 14, window.innerHeight - 40)}px`;

    tooltip.style.pointerEvents = "none";
    tooltip.style.zIndex = "9999";
}

function hideOutOfStockTooltip() {
    const tooltip =
        document.getElementById("outOfStockTooltip");

    if (tooltip) {
        tooltip.hidden = true;
    }
}

function enableOutOfStockTooltip(card) {
    if (
        !card ||
        card.dataset.tooltipReady === "true"
    ) {
        return;
    }

    card.dataset.tooltipReady = "true";

    // Disabled buttons may not emit hover events.
    // Listen on the card instead.
    card.addEventListener(
        "mousemove",
        showOutOfStockTooltip
    );

    card.addEventListener(
        "mouseleave",
        hideOutOfStockTooltip
    );
}

/* ========================================
   PRODUCT CARD RENDERING
======================================== */

function productCardHTML(product) {
    const stock = availableStock(product.id);
    const soldOut = stock === 0;

    return `
        <article
            class="product-card${soldOut ? " out-of-stock" : ""}"
            data-product-id="${product.id}"
            ${soldOut ? 'title="Out of Stock"' : ""}>

            <h3>${product.name}</h3>

            <p>${product.description}</p>

            <p>
                <strong>Category:</strong>
                ${product.category}
            </p>

            <p class="product-stock">
                <strong>Stock:</strong>
                ${soldOut ? "Out of Stock" : stock}
            </p>

            <p>
                <strong>${money(product.price)}</strong>
            </p>

            <div class="product-actions">

                <a href="${product.id === "KIT-001" ? "product.html" : "shop.html"}">
                    ${product.id === "KIT-001" ? "View Product" : "View in Shop"}
                </a>

                <button
                    type="button"
                    class="add-to-cart"
                    data-product-id="${product.id}"
                    ${soldOut ? 'disabled aria-disabled="true" title="Out of Stock"' : ""}>
                    ${soldOut ? "Out of Stock" : "Add to Cart"}
                </button>
            </div>
        </article>`;
}

function renderProducts() {
    const container =
        document.getElementById("productContainer");

    if (!container) return;

    container.innerHTML =
        products.map(productCardHTML).join("");

    container
        .querySelectorAll(".product-card.out-of-stock")
        .forEach(enableOutOfStockTooltip);
}

function renderFeaturedProducts() {
    const container =
        document.getElementById("featuredProductContainer");

    if (!container) return;

    const featuredIds = [
        "KIT-001",
        "KBP-014",
        "DIO-003"
    ];

    container.innerHTML = featuredIds
        .map(id => productCardHTML(findProduct(id)))
        .join("");

    container
        .querySelectorAll(".product-card.out-of-stock")
        .forEach(enableOutOfStockTooltip);
}

function renderProductDetails() {
    const details = document.getElementById("productDetails");

    if (!details) return;

    const productId =
        details.dataset.productId || "KIT-001";

    const product = findProduct(productId);

    if (!product) return;

    const stock = availableStock(productId);

    const stockText =
        document.getElementById("productStock");

    const stockLabel =
        document.getElementById("productStockLabel");

    const tableStock =
        document.getElementById("productTableStock");

    const price =
        document.getElementById("productPrice");

    const button =
        document.getElementById("productAddToCart");

    const message =
        document.getElementById("productOutOfStockMessage");

    if (stockText) {
        stockText.textContent = stock;
    }

    if (stockLabel) {
        stockLabel.textContent =
            stock === 0 ? "Out of Stock" : "in stock";
    }

    if (tableStock) {
        tableStock.textContent = stock;
    }

    if (price) {
        price.textContent = money(product.price);
    }

    if (button) {
        button.disabled = stock === 0;

        button.textContent =
            stock === 0 ? "Out of Stock" : "Add to Cart";

        button.title =
            stock === 0 ? "Out of Stock" : "";
    }

    if (message) {
        message.hidden = stock > 0;
    }

    details.classList.toggle(
        "out-of-stock",
        stock === 0
    );

    if (stock === 0) {
        enableOutOfStockTooltip(details);
    } else {
        hideOutOfStockTooltip();
    }
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
        showCartNotification(
            `${product.name} is out of stock.`
        );

        return;
    }

    const cart = getCart();

    let item = cart.find(
        entry => entry.id === productId
    );

    if (!adjustStock(productId, -1)) return;

    if (item) {
        item.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    saveCart(cart);
    refreshStorefront();

    showCartNotification(
        `${product.name} added to cart.`
    );
}

function updateCartQuantity(productId, change) {
    const cart = getCart();

    const item = cart.find(
        entry => entry.id === productId
    );

    if (
        !item ||
        !Number.isInteger(change) ||
        change === 0
    ) {
        return;
    }

    if (isCustomItem(item)) {
        const next = item.quantity + change;

        if (
            next < 1 ||
            next > CUSTOM_QUANTITY_LIMIT
        ) {
            showCartNotification(
                `Custom print requests are limited to ${CUSTOM_QUANTITY_LIMIT} pieces.`
            );

            return;
        }

        // Custom items are made-to-order estimates.
        // They do not use catalog inventory.
        item.quantity = next;

    } else {
        if (!findProduct(productId)) return;

        if (
            change > 0 &&
            availableStock(productId) < change
        ) {
            showCartNotification(
                "No additional stock is available for this product."
            );

            return;
        }

        if (
            item.quantity + change < 1 ||
            !adjustStock(productId, -change)
        ) {
            return;
        }

        item.quantity += change;
    }

    saveCart(cart);
    refreshStorefront();
}

function removeFromCart(productId) {
    const cart = getCart();

    const item = cart.find(
        entry => entry.id === productId
    );

    if (!item) return;

    if (
        !isCustomItem(item) &&
        !adjustStock(productId, item.quantity)
    ) {
        return;
    }

    saveCart(
        cart.filter(entry => entry.id !== productId)
    );

    refreshStorefront();

    showCartNotification(
        `${item.name} removed from cart.`
    );
}

function clearCart() {
    const cart = getCart();

    if (cart.length === 0) return;

    const inventory = getInventory();

    cart.forEach(item => {
        const product = findProduct(item.id);

        if (product) {
            const current = availableStock(item.id);

            inventory[item.id] = Math.min(
                product.stock,
                current + item.quantity
            );
        }
    });

    // Custom print jobs do not reserve catalog stock.
    saveInventory(inventory);
    saveCart([]);

    refreshStorefront();

    showCartNotification(
        "Your cart has been cleared. Catalog items returned to stock."
    );
}

// Event delegation supports buttons
// that are generated after page load.

document.addEventListener("click", event => {

    const addButton =
        event.target.closest("button.add-to-cart");

    if (addButton && !addButton.disabled) {
        addToCart(addButton.dataset.productId);
    }

    const decreaseButton =
        event.target.closest(".decrease-quantity");

    if (decreaseButton) {
        updateCartQuantity(
            decreaseButton.dataset.productId,
            -1
        );
    }

    const increaseButton =
        event.target.closest(".increase-quantity");

    if (increaseButton && !increaseButton.disabled) {
        updateCartQuantity(
            increaseButton.dataset.productId,
            1
        );
    }

    const removeButton =
        event.target.closest(".remove-cart-item");

    if (removeButton) {
        removeFromCart(removeButton.dataset.productId);
    }

    if (event.target.closest("#clearCartButton")) {
        clearCart();
    }
});

/* ========================================
   SHOPPING CART PAGE
======================================== */

function renderCart() {
    const container =
        document.getElementById("cartItems");

    if (!container) return;

    const cart = getCart();

    const itemCount = calculateCartItemCount(cart);
    const subtotal = calculateCartSubtotal(cart);

    if (cart.length === 0) {
        container.innerHTML = `
            <article class="cart-item">
                <div>
                    <h3>Your cart is currently empty.</h3>
                    <p>Visit the shop to add products to your build.</p>
                    <a class="product-button" href="shop.html">
                        Continue Shopping
                    </a>
                </div>
            </article>`;
    } else {
        container.innerHTML = cart.map(item => {
            const custom = isCustomItem(item);

            const remaining = custom
                ? CUSTOM_QUANTITY_LIMIT - item.quantity
                : availableStock(item.id);

            return `
                <article class="cart-item">

                    <div class="cart-item-info">

                        <h3>${escapeHTML(item.name)}</h3>

                        ${customItemDetailsHTML(item)}

                        <p>
                            <strong>Unit Price:</strong>
                            ${money(item.price)}
                            ${custom ? " (prototype estimate)" : ""}
                        </p>

                        <p>
                            <strong>
                                ${custom ? "Request type:" : "Available Stock:"}
                            </strong>
                            ${custom ? "Made-to-order prototype" : remaining}
                        </p>

                        <div class="quantity-controls">

                            <span>
                                <strong>Quantity:</strong>
                            </span>

                            <button
                                type="button"
                                class="quantity-button decrease-quantity"
                                data-product-id="${escapeHTML(item.id)}"
                                ${item.quantity <= 1 ? "disabled" : ""}
                                aria-label="Decrease quantity of ${escapeHTML(item.name)}">
                                −
                            </button>

                            <span class="quantity-value">
                                ${item.quantity}
                            </span>

                            <button
                                type="button"
                                class="quantity-button increase-quantity"
                                data-product-id="${escapeHTML(item.id)}"
                                ${remaining === 0 ? 'disabled title="Maximum quantity or out of stock"' : ""}
                                aria-label="Increase quantity of ${escapeHTML(item.name)}">
                                +
                            </button>
                        </div>

                        <button
                            type="button"
                            class="remove-cart-item"
                            data-product-id="${escapeHTML(item.id)}">
                            Remove
                        </button>

                    </div>

                    <div class="cart-item-total">
                        <p>Item Total</p>
                        <p class="cart-price">
                            ${money(item.price * item.quantity)}
                        </p>
                    </div>
                </article>`;
        }).join("");
    }

    const setText = (id, value) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    };

    setText("cartItemCount", itemCount);
    setText("cartSubtotal", money(subtotal));
    setText("cartTotal", money(subtotal));

    const checkoutButton =
        document.getElementById("checkoutButton");

    if (checkoutButton) {
        checkoutButton.hidden = cart.length === 0;
    }

    const clearButton =
        document.getElementById("clearCartButton");

    if (clearButton) {
        clearButton.disabled = cart.length === 0;
    }
}

/* ========================================
   SHIPPING, COUPONS, AND CHECKOUT
======================================== */

function calculateShipping(subtotal) {
    return subtotal >= FREE_SHIPPING_MINIMUM
        ? 0
        : STANDARD_SHIPPING;
}

function orderTotals(cart) {
    const subtotal = calculateCartSubtotal(cart);

    const discount =
        subtotal * (activeDiscountPercent / 100);

    const shipping = cart.length
        ? calculateShipping(subtotal)
        : 0;

    return {
        subtotal,
        discount,
        shipping,
        total: subtotal - discount + shipping
    };
}

function renderCheckout() {
    const container =
        document.getElementById("checkoutItems");

    if (!container) return;

    const cart = getCart();
    const totals = orderTotals(cart);

    container.innerHTML = cart.length
        ? cart.map(item => `
            <div class="checkout-item">
                <div>
                    <h3>${escapeHTML(item.name)}</h3>
                    ${customItemDetailsHTML(item)}
                    <p>Quantity: ${item.quantity}</p>
                </div>
                <strong>
                    ${money(item.price * item.quantity)}
                </strong>
            </div>
        `).join("")
        : "<p>Your cart is currently empty.</p>";

    const setText = (id, value) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    };

    setText("checkoutSubtotal", money(totals.subtotal));
    setText("checkoutDiscount", `-${money(totals.discount)}`);

    setText(
        "checkoutShipping",
        cart.length && totals.shipping === 0
            ? "FREE"
            : money(totals.shipping)
    );

    setText("checkoutTotal", money(totals.total));

    const discountRow =
        document.getElementById("discountRow");

    if (discountRow) {
        discountRow.hidden = totals.discount === 0;
    }

    const submitButton =
        document.getElementById("submitOrderButton");

    if (submitButton) {
        submitButton.disabled = cart.length === 0;
    }
}

function applyCoupon() {
    const input =
        document.getElementById("coupon-code");

    const message =
        document.getElementById("couponMessage");

    if (!input || !message) return;

    const code = input.value.trim().toUpperCase();

    if (!code) {
        activeDiscountPercent = 0;
        message.textContent = "Enter a coupon code.";

    } else if (
        Object.prototype.hasOwnProperty.call(coupons, code)
    ) {
        activeDiscountPercent = coupons[code];

        message.textContent =
            `${activeDiscountPercent}% discount applied.`;

    } else {
        activeDiscountPercent = 0;
        message.textContent = "Coupon code not recognized.";
    }

    renderCheckout();
}

function validateCheckout() {
    const message =
        document.getElementById("checkoutMessage");

    if (!message) return false;

    if (getCart().length === 0) {
        message.textContent = "Your cart is empty.";
        return false;
    }

    const field = id =>
        (document.getElementById(id)?.value || "").trim();

    const requiredIds = [
        "shipping-name",
        "shipping-address",
        "shipping-city",
        "shipping-state",
        "shipping-zip",
        "shipping-phone",
        "cardholder-name",
        "card-number",
        "expiration-date",
        "security-code"
    ];

    if (requiredIds.some(id => !field(id))) {
        message.textContent =
            "Please complete all required fields.";
        return false;
    }

    if (!/^[A-Za-z]{2}$/.test(field("shipping-state"))) {
        message.textContent =
            "Enter the state using its two-letter abbreviation.";
        return false;
    }

    if (!/^\d{5}(-\d{4})?$/.test(field("shipping-zip"))) {
        message.textContent =
            "Enter a valid ZIP Code.";
        return false;
    }

    if (
        field("shipping-phone")
            .replace(/\D/g, "").length !== 10
    ) {
        message.textContent =
            "Enter a valid 10-digit phone number.";
        return false;
    }

    if (
        !/^\d{13,16}$/.test(
            field("card-number").replace(/\s/g, "")
        )
    ) {
        message.textContent =
            "Enter a valid credit card number.";
        return false;
    }

    if (!/^\d{3,4}$/.test(field("security-code"))) {
        message.textContent =
            "Enter a valid 3 or 4 digit security code.";
        return false;
    }

    const expiration = new Date(
        `${field("expiration-date")}-01T00:00:00`
    );

    const now = new Date();

    const currentMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
    );

    if (
        Number.isNaN(expiration.getTime()) ||
        expiration < currentMonth
    ) {
        message.textContent =
            "The card expiration date must be current or future.";
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

    // Save order summary only.
    // Never store payment or card details.
    localStorage.setItem(
        LAST_ORDER_KEY,
        JSON.stringify({
            cart,
            ...totals
        })
    );

    // Purchased catalog stock was already
    // reserved when products entered the cart.
    saveCart([]);

    updateHeaderCart();

    window.location.href = "confirmation.html";
}

/* ========================================
   CONFIRMATION PAGE
======================================== */

function getLastOrder() {
    try {
        return JSON.parse(
            localStorage.getItem(LAST_ORDER_KEY)
        );
    } catch (error) {
        return null;
    }
}

function renderConfirmation() {
    const container =
        document.getElementById("confirmationItems");

    if (!container) return;

    const order = getLastOrder();

    const message =
        document.getElementById("confirmationMessage");

    const setText = (id, value) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    };

    const discountRow =
        document.getElementById("confirmationDiscountRow");

    if (
        !order ||
        !Array.isArray(order.cart) ||
        order.cart.length === 0
    ) {
        if (message) {
            message.textContent =
                "No completed order was found.";
        }

        container.innerHTML =
            "<p>Complete an order through checkout to view its confirmation details.</p>";

        setText("confirmationSubtotal", "$0.00");
        setText("confirmationDiscount", "-$0.00");
        setText("confirmationShipping", "$0.00");
        setText("confirmationTotal", "$0.00");

        if (discountRow) {
            discountRow.hidden = true;
        }

        return;
    }

    if (message) {
        message.textContent =
            "Your One in 144 prototype order has been successfully submitted.";
    }

    container.innerHTML = order.cart.map(item => `
        <div class="checkout-item">
            <div>
                <h3>${escapeHTML(item.name)}</h3>
                ${customItemDetailsHTML(item)}
                <p>Quantity: ${item.quantity}</p>
            </div>
            <strong>
                ${money(item.price * item.quantity)}
            </strong>
        </div>
    `).join("");

    setText(
        "confirmationSubtotal",
        money(order.subtotal)
    );

    setText(
        "confirmationDiscount",
        `-${money(order.discount)}`
    );

    setText(
        "confirmationShipping",
        order.shipping === 0
            ? "FREE"
            : money(order.shipping)
    );

    setText(
        "confirmationTotal",
        money(order.total)
    );

    if (discountRow) {
        discountRow.hidden = order.discount <= 0;
    }
}

/* ========================================
   CONTACT FORM
======================================== */

function validateContactForm() {
    const message =
        document.getElementById("contactMessage");

    const email =
        document.getElementById("contact-email")
            ?.value.trim() || "";

    const body =
        document.getElementById("contact-message")
            ?.value.trim() || "";

    if (!message) return false;

    if (!email || !body) {
        message.textContent =
            "Please complete the required email and message fields.";
        return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        message.textContent =
            "Please enter a valid email address.";
        return false;
    }

    if (body.length < 10) {
        message.textContent =
            "Please enter a message containing at least 10 characters.";
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
   CUSTOM 3D PRINT ESTIMATES — WEEK 5

   Estimates are based on selected options.
   No files are uploaded or processed.

   Custom jobs are stored separately from
   catalog inventory as prototype cart items.
======================================== */

function customField(id) {
    return document.getElementById(id);
}

function customSelection(id) {
    const control = customField(id);

    return {
        value: control?.value || "",
        label:
            control?.selectedOptions?.[0]
                ?.textContent.trim() || ""
    };
}

function customOptions() {
    return {
        material: customSelection("material").value,
        scale: customSelection("scale").value,
        detail: customSelection("detail-level").value,
        finish: customSelection("finish").value
    };
}

function displayCustomEstimate() {
    const estimate =
        customField("estimateTotal");

    if (!estimate) return;

    const unit = customUnitPrice(customOptions());

    const quantity =
        Number(customField("quantity")?.value);

    const validQuantity =
        Number.isInteger(quantity) &&
        quantity >= 1 &&
        quantity <= CUSTOM_QUANTITY_LIMIT;

    const setText = (id, value) => {
        const element = customField(id);

        if (element) {
            element.textContent = value;
        }
    };

    setText(
        "estimateQuantity",
        validQuantity ? quantity : "—"
    );

    setText(
        "estimateUnitPrice",
        unit === null
            ? "Manual review"
            : money(unit)
    );

    setText(
        "estimateTotal",
        unit === null
            ? "Manual review"
            : validQuantity
                ? money(unit * quantity)
                : "Enter quantity 1–10"
    );

    setText(
        "estimateBreakdown",
        unit === null
            ? "Other scales require manual review; no automatic estimate is available."
            : "Illustrative classroom estimate, based on material, scale, detail and finish. Shipping and coupons are separate."
    );
}

function invalidateCustomReview() {
    reviewedCustomRequest = null;

    const add =
        customField("addCustomPrintToCart");

    if (add) {
        add.disabled = true;
    }

    const cartMessage =
        customField("customPrintCartMessage");

    if (cartMessage) {
        cartMessage.textContent = "";
    }

    const message =
        customField("customPrintMessage");

    if (message) {
        message.textContent = "";
    }

    displayCustomEstimate();
}

function submitCustomPrintForm(event) {
    event.preventDefault();

    const message =
        customField("customPrintMessage");

    if (!message) return;

    reviewedCustomRequest = null;

    const add =
        customField("addCustomPrintToCart");

    if (add) {
        add.disabled = true;
    }

    const name =
        customField("print-name")?.value.trim() || "";

    const file =
        customField("design-file")?.files?.[0];

    const permission =
        customField("permission")?.checked;

    const quantity =
        Number(customField("quantity")?.value);

    const config = customOptions();
    const unitPrice = customUnitPrice(config);

    if (!name || name.length > 60) {
        message.textContent =
            "Enter a project name (up to 60 characters).";
        return;
    }

    if (
        !file ||
        !/\.(stl|obj)$/i.test(file.name)
    ) {
        message.textContent =
            "Select an STL or OBJ design file.";
        return;
    }

    if (
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > CUSTOM_QUANTITY_LIMIT
    ) {
        message.textContent =
            "Choose a quantity between 1 and 10.";
        return;
    }

    if (!permission) {
        message.textContent =
            "Confirm that you have permission to reproduce this design.";
        return;
    }

    if (unitPrice === null) {
        message.textContent =
            "Other scales require manual review. Choose a listed scale to add an automatic estimate to the cart.";
        return;
    }

    reviewedCustomRequest = {
        projectName: name,

        // Save filename only, never actual file contents.
        fileName: file.name.slice(0, 200),

        notes:
            (customField("notes")?.value || "")
                .trim()
                .slice(0, 500),

        quantity,
        price: unitPrice,

        ...config,

        materialLabel:
            customSelection("material").label,

        scaleLabel:
            customSelection("scale").label,

        detailLabel:
            customSelection("detail-level").label,

        finishLabel:
            customSelection("finish").label
    };

    if (add) {
        add.disabled = false;
    }

    message.textContent =
        `Request reviewed: ${quantity} piece(s), ` +
        `${money(unitPrice * quantity)} estimated total. ` +
        "You can now add this prototype estimate to the Smart Cart. " +
        "No file was uploaded.";
}

function addCustomPrintToCart() {
    const request = reviewedCustomRequest;

    if (!request) return;

    const id =
        `CUSTOM-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const cart = getCart();

    cart.push({
        id,
        kind: "custom-print",

        name: `Custom Print: ${request.projectName}`,

        price: request.price,
        quantity: request.quantity,

        custom: {
            projectName: request.projectName,
            fileName: request.fileName,
            notes: request.notes,

            material: request.material,
            scale: request.scale,
            detail: request.detail,
            finish: request.finish,

            materialLabel: request.materialLabel,
            scaleLabel: request.scaleLabel,
            detailLabel: request.detailLabel,
            finishLabel: request.finishLabel
        }
    });

    saveCart(cart);

    reviewedCustomRequest = null;

    const add =
        customField("addCustomPrintToCart");

    if (add) {
        add.disabled = true;
    }

    const message =
        customField("customPrintCartMessage");

    if (message) {
        message.textContent =
            "Prototype custom print estimate added to the Smart Cart. " +
            "No file has been uploaded or order placed.";
    }

    refreshStorefront();
    setQuickCartOpen(true);
}

function initializeCustomPrint() {
    const form =
        customField("customPrintForm");

    if (!form) return;

    form.addEventListener(
        "submit",
        submitCustomPrintForm
    );

    form
        .querySelectorAll("input, select, textarea")
        .forEach(control => {

            control.addEventListener(
                "input",
                invalidateCustomReview
            );

            control.addEventListener(
                "change",
                invalidateCustomReview
            );
        });

    const addButton =
        customField("addCustomPrintToCart");

    if (addButton) {
        addButton.addEventListener(
            "click",
            addCustomPrintToCart
        );
    }

    displayCustomEstimate();
}

/* ========================================
   INITIALIZATION AND EVENT LISTENERS
======================================== */

// Build inventory before rendering the store.
getInventory();

initializeQuickCart();
refreshStorefront();
renderConfirmation();

// Coupon controls
const couponButton =
    document.getElementById("applyCouponButton");

if (couponButton) {
    couponButton.addEventListener(
        "click",
        applyCoupon
    );
}

// Checkout controls
const checkoutForm =
    document.getElementById("checkoutForm");

if (checkoutForm) {
    checkoutForm.addEventListener(
        "submit",
        submitOrder
    );
}

// Contact form
const contactForm =
    document.getElementById("contactForm");

if (contactForm) {
    contactForm.addEventListener(
        "submit",
        submitContactForm
    );
}

// Custom 3D printing
initializeCustomPrint();

// Update storefront when another browser
// tab changes cart or inventory storage.
window.addEventListener("storage", event => {
    if (
        [CART_KEY, INVENTORY_KEY].includes(event.key)
    ) {
        refreshStorefront();
    }
});
