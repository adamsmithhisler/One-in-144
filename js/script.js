/*
    Author: Adam Smithhisler
    Date: 10/27/2026
    Assignment: Final Project - Interactive E-Commerce Features
    Purpose: Provides dynamic product display, shopping cart behavior,
             automatic pricing, shipping calculation, coupon discounts,
             checkout validation, contact form validation, and dynamic
             order confirmation for the One in 144 website.
*/


/* ========================================
   PRODUCT DATA
======================================== */

const products = [
    {
        id: "KIT-001",
        name: "HG 1/144 Urban Combat Model Kit",
        category: "Model Kits",
        price: 24.99,
        stock: 18,
        description: "Beginner-friendly model kit designed for customization and diorama builds."
    },
    {
        id: "KBP-014",
        name: "1/144 Mechanical Detail Pack",
        category: "Kitbash Parts",
        price: 14.99,
        stock: 32,
        description: "Resin mechanical details including vents, thrusters, armor panels, and piping."
    },
    {
        id: "DIO-003",
        name: "Urban Ruin Display Base",
        category: "Diorama Supplies",
        price: 19.99,
        stock: 15,
        description: "Modular urban terrain pieces designed for 1/144-scale displays."
    },
    {
        id: "TLS-008",
        name: "Precision Hobby Tool Set",
        category: "Tools",
        price: 29.99,
        stock: 20,
        description: "Basic modeling tool set with nippers, tweezers, sanding tools, and a hobby knife."
    },
    {
        id: "WTH-005",
        name: "Weathering Starter Pack",
        category: "Weathering & Lighting",
        price: 17.99,
        stock: 24,
        description: "Pigments and washes for adding wear, grime, and environmental effects."
    },
    {
        id: "LED-011",
        name: "1/144 LED Lighting Kit",
        category: "Weathering & Lighting",
        price: 12.99,
        stock: 27,
        description: "Small LED components and wiring for illuminated model and diorama projects."
    },
    {
        id: "KBP-021",
        name: "Heavy Weapon Upgrade Set",
        category: "Kitbash Parts",
        price: 18.99,
        stock: 16,
        description: "A collection of rifles, launchers, and mounting components for custom builds."
    },
    {
        id: "DIO-009",
        name: "Industrial Hangar Detail Set",
        category: "Diorama Supplies",
        price: 22.99,
        stock: 12,
        description: "Panels, pipes, barriers, and industrial details for hangar-style displays."
    },
    {
        id: "TLS-015",
        name: "Fine Detail Sanding Set",
        category: "Tools",
        price: 9.99,
        stock: 35,
        description: "Multiple sanding grits designed for cleanup, shaping, and surface preparation."
    },
    {
        id: "KIT-017",
        name: "HG 1/144 Desert Operations Model Kit",
        category: "Model Kits",
        price: 27.99,
        stock: 14,
        description: "1/144-scale model kit designed around desert combat and weathering themes."
    }
];


/* ========================================
   CART STORAGE
======================================== */

function getCart() {

    const savedCart =
        localStorage.getItem("oneIn144Cart");


    if (!savedCart) {
        return [];
    }


    try {

        return JSON.parse(savedCart);

    } catch (error) {

        return [];
    }
}


function saveCart(cart) {

    localStorage.setItem(
        "oneIn144Cart",
        JSON.stringify(cart)
    );
}


/* ========================================
   PRODUCT DISPLAY
======================================== */

const productContainer =
    document.getElementById("productContainer");


if (productContainer) {

    products.forEach(function (product) {

        productContainer.innerHTML += `
            <article class="product-card">

                <h3>${product.name}</h3>

                <p>
                    ${product.description}
                </p>

                <p>
                    <strong>Category:</strong>
                    ${product.category}
                </p>

                <p>
                    <strong>Stock:</strong>
                    ${product.stock}
                </p>

                <p>
                    <strong>
                        $${product.price.toFixed(2)}
                    </strong>
                </p>

                <div class="product-actions">

                    <a href="product.html">
                        View Product
                    </a>

                    <button
                        type="button"
                        class="add-to-cart"
                        data-product-id="${product.id}">
                        Add to Cart
                    </button>

                </div>

            </article>
        `;
    });
}


/* ========================================
   ADD PRODUCT TO CART
======================================== */

function addToCart(productId) {

    const cart =
        getCart();


    const product =
        products.find(function (item) {

            return item.id === productId;

        });


    if (!product) {
        return;
    }


    const existingItem =
        cart.find(function (item) {

            return item.id === productId;

        });


    if (existingItem) {

        if (existingItem.quantity < product.stock) {

            existingItem.quantity++;

        } else {

            alert(
                `Only ${product.stock} of ${product.name} are currently available.`
            );

            return;
        }

    } else {

        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }


    saveCart(cart);


    alert(
        `${product.name} added to cart.`
    );
}


/* ========================================
   ADD TO CART BUTTON EVENTS
======================================== */

const addToCartButtons =
    document.querySelectorAll(".add-to-cart");


addToCartButtons.forEach(function (button) {

    button.addEventListener(
        "click",
        function () {

            const productId =
                button.dataset.productId;


            addToCart(productId);

        }
    );

});


/* ========================================
   CART TOTAL FUNCTIONS
======================================== */

function calculateCartSubtotal(cart) {

    let subtotal = 0;


    cart.forEach(function (item) {

        subtotal +=
            item.price * item.quantity;

    });


    return subtotal;
}


function calculateCartItemCount(cart) {

    let itemCount = 0;


    cart.forEach(function (item) {

        itemCount +=
            item.quantity;

    });


    return itemCount;
}


/* ========================================
   CART PAGE ELEMENTS
======================================== */

const cartItems =
    document.getElementById("cartItems");

const cartItemCount =
    document.getElementById("cartItemCount");

const cartSubtotal =
    document.getElementById("cartSubtotal");

const cartTotal =
    document.getElementById("cartTotal");

const checkoutButton =
    document.getElementById("checkoutButton");


/* ========================================
   UPDATE CART QUANTITY
======================================== */

function updateCartQuantity(productId, change) {

    const cart =
        getCart();


    const cartItem =
        cart.find(function (item) {

            return item.id === productId;

        });


    const product =
        products.find(function (item) {

            return item.id === productId;

        });


    if (!cartItem || !product) {
        return;
    }


    const newQuantity =
        cartItem.quantity + change;


    if (newQuantity < 1) {
        return;
    }


    if (newQuantity > product.stock) {

        alert(
            `Only ${product.stock} of ${product.name} are currently available.`
        );

        return;
    }


    cartItem.quantity =
        newQuantity;


    saveCart(cart);

    renderCart();
}


/* ========================================
   REMOVE PRODUCT FROM CART
======================================== */

function removeFromCart(productId) {

    const cart =
        getCart();


    const updatedCart =
        cart.filter(function (item) {

            return item.id !== productId;

        });


    saveCart(updatedCart);

    renderCart();
}


/* ========================================
   DISPLAY CART
======================================== */

function renderCart() {

    if (!cartItems) {
        return;
    }


    const cart =
        getCart();


    cartItems.innerHTML = "";


    if (cart.length === 0) {

        cartItems.innerHTML = `
            <article class="cart-item">

                <div>

                    <h3>
                        Your cart is currently empty.
                    </h3>

                    <p>
                        Visit the shop to add products
                        to your build.
                    </p>

                    <a
                        class="product-button"
                        href="shop.html">
                        Continue Shopping
                    </a>

                </div>

            </article>
        `;


        if (cartItemCount) {
            cartItemCount.textContent = "0";
        }


        if (cartSubtotal) {
            cartSubtotal.textContent = "$0.00";
        }


        if (cartTotal) {
            cartTotal.textContent = "$0.00";
        }


        if (checkoutButton) {
            checkoutButton.style.display = "none";
        }


        return;
    }


    cart.forEach(function (item) {

        const product =
            products.find(function (productItem) {

                return productItem.id === item.id;

            });


        const lineTotal =
            item.price * item.quantity;


        cartItems.innerHTML += `
            <article class="cart-item">

                <div class="cart-item-info">

                    <h3>
                        ${item.name}
                    </h3>

                    <p>
                        <strong>Unit Price:</strong>
                        $${item.price.toFixed(2)}
                    </p>

                    <p>
                        <strong>Available Stock:</strong>
                        ${product ? product.stock : "N/A"}
                    </p>


                    <div class="quantity-controls">

                        <span>
                            <strong>Quantity:</strong>
                        </span>

                        <button
                            type="button"
                            class="quantity-button decrease-quantity"
                            data-product-id="${item.id}"
                            aria-label="Decrease quantity of ${item.name}">
                            −
                        </button>

                        <span class="quantity-value">
                            ${item.quantity}
                        </span>

                        <button
                            type="button"
                            class="quantity-button increase-quantity"
                            data-product-id="${item.id}"
                            aria-label="Increase quantity of ${item.name}">
                            +
                        </button>

                    </div>


                    <button
                        type="button"
                        class="remove-cart-item"
                        data-product-id="${item.id}">
                        Remove
                    </button>

                </div>


                <div class="cart-item-total">

                    <p>
                        Item Total
                    </p>

                    <p class="cart-price">
                        $${lineTotal.toFixed(2)}
                    </p>

                </div>

            </article>
        `;
    });


    const subtotal =
        calculateCartSubtotal(cart);


    const itemCount =
        calculateCartItemCount(cart);


    if (cartItemCount) {

        cartItemCount.textContent =
            itemCount;
    }


    if (cartSubtotal) {

        cartSubtotal.textContent =
            `$${subtotal.toFixed(2)}`;
    }


    if (cartTotal) {

        cartTotal.textContent =
            `$${subtotal.toFixed(2)}`;
    }


    if (checkoutButton) {

        checkoutButton.style.display =
            "inline-block";
    }


    const decreaseButtons =
        document.querySelectorAll(
            ".decrease-quantity"
        );


    decreaseButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                updateCartQuantity(
                    button.dataset.productId,
                    -1
                );

            }
        );

    });


    const increaseButtons =
        document.querySelectorAll(
            ".increase-quantity"
        );


    increaseButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                updateCartQuantity(
                    button.dataset.productId,
                    1
                );

            }
        );

    });


    const removeButtons =
        document.querySelectorAll(
            ".remove-cart-item"
        );


    removeButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                removeFromCart(
                    button.dataset.productId
                );

            }
        );

    });
}


/* ========================================
   INITIALIZE CART PAGE
======================================== */

if (cartItems) {

    renderCart();

}


/* ========================================
   CHECKOUT ELEMENTS
======================================== */

const checkoutItems =
    document.getElementById("checkoutItems");

const checkoutSubtotal =
    document.getElementById("checkoutSubtotal");

const checkoutShipping =
    document.getElementById("checkoutShipping");

const checkoutDiscount =
    document.getElementById("checkoutDiscount");

const checkoutTotal =
    document.getElementById("checkoutTotal");

const discountRow =
    document.getElementById("discountRow");

const couponCodeInput =
    document.getElementById("coupon-code");

const applyCouponButton =
    document.getElementById("applyCouponButton");

const couponMessage =
    document.getElementById("couponMessage");

const checkoutForm =
    document.getElementById("checkoutForm");

const checkoutMessage =
    document.getElementById("checkoutMessage");


/* ========================================
   CHECKOUT SETTINGS
======================================== */

const FREE_SHIPPING_MINIMUM = 75;

const STANDARD_SHIPPING = 6.99;

let activeDiscountPercent = 0;


/* ========================================
   COUPON CODES
======================================== */

const coupons = {
    BUILD10: 10,
    SCALE15: 15
};


/* ========================================
   SHIPPING CALCULATION
======================================== */

function calculateShipping(subtotal) {

    if (subtotal >= FREE_SHIPPING_MINIMUM) {

        return 0;
    }


    return STANDARD_SHIPPING;
}


/* ========================================
   DISPLAY CHECKOUT ORDER
======================================== */

function renderCheckout() {

    if (!checkoutItems) {
        return;
    }


    const cart =
        getCart();


    checkoutItems.innerHTML = "";


    if (cart.length === 0) {

        checkoutItems.innerHTML = `
            <p>
                Your cart is currently empty.
            </p>
        `;


        checkoutSubtotal.textContent =
            "$0.00";

        checkoutShipping.textContent =
            "$0.00";

        checkoutDiscount.textContent =
            "-$0.00";

        checkoutTotal.textContent =
            "$0.00";


        if (discountRow) {

            discountRow.hidden = true;
        }


        return;
    }


    cart.forEach(function (item) {

        const itemTotal =
            item.price * item.quantity;


        checkoutItems.innerHTML += `
            <div class="checkout-item">

                <div>

                    <h3>
                        ${item.name}
                    </h3>

                    <p>
                        Quantity: ${item.quantity}
                    </p>

                </div>

                <strong>
                    $${itemTotal.toFixed(2)}
                </strong>

            </div>
        `;
    });


    const subtotal =
        calculateCartSubtotal(cart);


    const discountAmount =
        subtotal *
        (activeDiscountPercent / 100);


    const discountedSubtotal =
        subtotal - discountAmount;


    const shipping =
        calculateShipping(subtotal);


    const total =
        discountedSubtotal + shipping;


    checkoutSubtotal.textContent =
        `$${subtotal.toFixed(2)}`;


    checkoutDiscount.textContent =
        `-$${discountAmount.toFixed(2)}`;


    if (discountAmount > 0) {

        discountRow.hidden = false;

    } else {

        discountRow.hidden = true;
    }


    if (shipping === 0) {

        checkoutShipping.textContent =
            "FREE";

    } else {

        checkoutShipping.textContent =
            `$${shipping.toFixed(2)}`;
    }


    checkoutTotal.textContent =
        `$${total.toFixed(2)}`;
}


/* ========================================
   APPLY COUPON
======================================== */

function applyCoupon() {

    if (!couponCodeInput) {
        return;
    }


    const code =
        couponCodeInput.value
            .trim()
            .toUpperCase();


    if (code === "") {

        activeDiscountPercent = 0;


        couponMessage.textContent =
            "Enter a coupon code.";


        renderCheckout();

        return;
    }


    if (coupons[code]) {

        activeDiscountPercent =
            coupons[code];


        couponMessage.textContent =
            `${activeDiscountPercent}% discount applied.`;

    } else {

        activeDiscountPercent = 0;


        couponMessage.textContent =
            "Coupon code not recognized.";
    }


    renderCheckout();
}


/* ========================================
   COUPON BUTTON EVENT
======================================== */

if (applyCouponButton) {

    applyCouponButton.addEventListener(
        "click",
        applyCoupon
    );
}


/* ========================================
   CHECKOUT VALIDATION
======================================== */

function validateCheckout() {

    const cart =
        getCart();


    if (cart.length === 0) {

        checkoutMessage.textContent =
            "Your cart is empty.";

        return false;
    }


    const shippingName =
        document
            .getElementById("shipping-name")
            .value
            .trim();


    const shippingAddress =
        document
            .getElementById("shipping-address")
            .value
            .trim();


    const shippingCity =
        document
            .getElementById("shipping-city")
            .value
            .trim();


    const shippingState =
        document
            .getElementById("shipping-state")
            .value
            .trim()
            .toUpperCase();


    const shippingZip =
        document
            .getElementById("shipping-zip")
            .value
            .trim();


    const shippingPhone =
        document
            .getElementById("shipping-phone")
            .value
            .trim();


    const cardholderName =
        document
            .getElementById("cardholder-name")
            .value
            .trim();


    const cardNumber =
        document
            .getElementById("card-number")
            .value
            .replace(/\s/g, "");


    const expirationDate =
        document
            .getElementById("expiration-date")
            .value;


    const securityCode =
        document
            .getElementById("security-code")
            .value
            .trim();


    if (
        shippingName === "" ||
        shippingAddress === "" ||
        shippingCity === "" ||
        shippingState === "" ||
        shippingZip === "" ||
        shippingPhone === "" ||
        cardholderName === "" ||
        cardNumber === "" ||
        expirationDate === "" ||
        securityCode === ""
    ) {

        checkoutMessage.textContent =
            "Please complete all required fields.";

        return false;
    }


    const statePattern =
        /^[A-Za-z]{2}$/;


    if (!statePattern.test(shippingState)) {

        checkoutMessage.textContent =
            "Enter the state using its two-letter abbreviation.";

        return false;
    }


    const zipPattern =
        /^\d{5}(-\d{4})?$/;


    if (!zipPattern.test(shippingZip)) {

        checkoutMessage.textContent =
            "Enter a valid ZIP Code.";

        return false;
    }


    const phoneDigits =
        shippingPhone.replace(/\D/g, "");


    if (phoneDigits.length !== 10) {

        checkoutMessage.textContent =
            "Enter a valid 10-digit phone number.";

        return false;
    }


    const cardPattern =
        /^\d{13,16}$/;


    if (!cardPattern.test(cardNumber)) {

        checkoutMessage.textContent =
            "Enter a valid credit card number.";

        return false;
    }


    const securityCodePattern =
        /^\d{3,4}$/;


    if (!securityCodePattern.test(securityCode)) {

        checkoutMessage.textContent =
            "Enter a valid 3 or 4 digit security code.";

        return false;
    }


    const selectedExpiration =
        new Date(
            expirationDate + "-01T00:00:00"
        );


    const today =
        new Date();


    const currentMonth =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );


    if (selectedExpiration < currentMonth) {

        checkoutMessage.textContent =
            "The card expiration date must be current or future.";

        return false;
    }


    checkoutMessage.textContent = "";

    return true;
}


/* ========================================
   CHECKOUT SUBMISSION
======================================== */

if (checkoutForm) {

    checkoutForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            if (!validateCheckout()) {
                return;
            }


            const cart =
                getCart();


            const subtotal =
                calculateCartSubtotal(cart);


            const discountAmount =
                subtotal *
                (activeDiscountPercent / 100);


            const shipping =
                calculateShipping(subtotal);


            const finalTotal =
                subtotal -
                discountAmount +
                shipping;


            const orderSummary = {
                cart: cart,
                subtotal: subtotal,
                discount: discountAmount,
                shipping: shipping,
                total: finalTotal
            };


            localStorage.setItem(
                "oneIn144LastOrder",
                JSON.stringify(orderSummary)
            );


            localStorage.removeItem(
                "oneIn144Cart"
            );


            window.location.href =
                "confirmation.html";
        }
    );
}


/* ========================================
   INITIALIZE CHECKOUT PAGE
======================================== */

if (checkoutItems) {

    renderCheckout();

}


/* ========================================
   CONTACT FORM ELEMENTS
======================================== */

const contactForm =
    document.getElementById("contactForm");

const contactMessage =
    document.getElementById("contactMessage");


/* ========================================
   CONTACT FORM VALIDATION
======================================== */

function validateContactForm() {

    const email =
        document
            .getElementById("contact-email")
            .value
            .trim();


    const message =
        document
            .getElementById("contact-message")
            .value
            .trim();


    if (email === "" || message === "") {

        contactMessage.textContent =
            "Please complete the required email and message fields.";

        return false;
    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(email)) {

        contactMessage.textContent =
            "Please enter a valid email address.";

        return false;
    }


    if (message.length < 10) {

        contactMessage.textContent =
            "Please enter a message containing at least 10 characters.";

        return false;
    }


    contactMessage.textContent = "";

    return true;
}


/* ========================================
   CONTACT FORM SUBMISSION
======================================== */

if (contactForm) {

    contactForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            if (!validateContactForm()) {
                return;
            }


            contactMessage.textContent =
                "Thank you. Your message has been successfully submitted.";


            contactForm.reset();
        }
    );
}


/* ========================================
   CONFIRMATION PAGE ELEMENTS
======================================== */

const confirmationItems =
    document.getElementById("confirmationItems");

const confirmationSubtotal =
    document.getElementById("confirmationSubtotal");

const confirmationDiscountRow =
    document.getElementById("confirmationDiscountRow");

const confirmationDiscount =
    document.getElementById("confirmationDiscount");

const confirmationShipping =
    document.getElementById("confirmationShipping");

const confirmationTotal =
    document.getElementById("confirmationTotal");

const confirmationMessage =
    document.getElementById("confirmationMessage");


/* ========================================
   GET LAST ORDER
======================================== */

function getLastOrder() {

    const savedOrder =
        localStorage.getItem("oneIn144LastOrder");


    if (!savedOrder) {

        return null;
    }


    try {

        return JSON.parse(savedOrder);

    } catch (error) {

        return null;
    }
}


/* ========================================
   DISPLAY ORDER CONFIRMATION
======================================== */

function renderConfirmation() {

    if (!confirmationItems) {
        return;
    }


    const order =
        getLastOrder();


    if (
        !order ||
        !order.cart ||
        order.cart.length === 0
    ) {

        confirmationMessage.textContent =
            "No completed order was found.";


        confirmationItems.innerHTML = `
            <p>
                Complete an order through checkout
                to view its confirmation details.
            </p>
        `;


        confirmationSubtotal.textContent =
            "$0.00";

        confirmationShipping.textContent =
            "$0.00";

        confirmationTotal.textContent =
            "$0.00";


        if (confirmationDiscountRow) {

            confirmationDiscountRow.hidden =
                true;
        }


        return;
    }


    confirmationItems.innerHTML = "";


    order.cart.forEach(function (item) {

        const itemTotal =
            item.price * item.quantity;


        confirmationItems.innerHTML += `
            <div class="checkout-item">

                <div>

                    <h3>
                        ${item.name}
                    </h3>

                    <p>
                        Quantity: ${item.quantity}
                    </p>

                </div>

                <strong>
                    $${itemTotal.toFixed(2)}
                </strong>

            </div>
        `;
    });


    confirmationSubtotal.textContent =
        `$${order.subtotal.toFixed(2)}`;


    if (order.discount > 0) {

        confirmationDiscountRow.hidden =
            false;


        confirmationDiscount.textContent =
            `-$${order.discount.toFixed(2)}`;

    } else {

        confirmationDiscountRow.hidden =
            true;
    }


    if (order.shipping === 0) {

        confirmationShipping.textContent =
            "FREE";

    } else {

        confirmationShipping.textContent =
            `$${order.shipping.toFixed(2)}`;
    }


    confirmationTotal.textContent =
        `$${order.total.toFixed(2)}`;
}


/* ========================================
   INITIALIZE CONFIRMATION PAGE
======================================== */

if (confirmationItems) {

    renderConfirmation();

}