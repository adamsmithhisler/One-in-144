
# One in 144

**Build. Combine. Create.**

*One Build. 144 Possibilities.*

One in 144 is a fictional e-commerce website developed for the SDC260 Front-End Web Development course at ECPI University.

The website focuses on 1/144-scale model kits, kitbashing components, diorama supplies, modeling tools, and custom 3D printing services.

The purpose of this project is to demonstrate front-end website development using HTML, CSS, and JavaScript, including dynamic product displays, inventory management, shopping cart functionality, form validation, browser storage, and interactive customer features.

## Project Information

- **Developer:** Adam Smithhisler
- **Course:** SDC260 – Front-End Web Development
- **Project:** One in 144
- **Development Period:** 2026
- **Current Milestone:** Week 5 – Final Development and Delivery

## Website

**Live Website:**

https://adamsmithhisler.github.io/One-in-144/

**GitHub Repository:**

https://github.com/adamsmithhisler/One-in-144

## Website Features

### Product Catalog

The Shop page displays a collection of ten fictional products organized into categories:

- HG 1/144 Model Kits
- Kitbash Parts
- Diorama Supplies
- Weathering and Lighting
- Modeling Tools

Each product includes its name, description, category, price, available stock, and an Add to Cart option.

JavaScript dynamically generates product cards and manages product information.

### Inventory Management

The inventory system tracks available product quantities.

When a customer adds a product to the shopping cart, the available inventory decreases. Removing a product or reducing its quantity restores the appropriate stock.

Products with zero available stock cannot be added to the cart. The website displays an out-of-stock state and disables the corresponding purchase control.

Inventory information is stored locally in the browser for the purposes of this classroom project.

### Smart Cart

The website features a fixed, expandable Smart Cart positioned in the lower-right corner.

Customers can:

- Add products to their cart.
- Expand or collapse the cart.
- View selected products and quantities.
- Increase or decrease product quantities.
- Remove individual products.
- Clear the entire cart.
- View automatically calculated subtotals.
- Proceed directly to Checkout.

The cart is available throughout the website and uses localStorage to preserve its contents when customers refresh or navigate between pages.

### Custom 3D Printing

The Custom Print page allows customers to configure a prototype request for a custom 3D-printed component.

The form includes:

- Project name
- STL or OBJ file selection
- Material selection
- Intended model scale
- Print detail level
- Surface finish
- Quantity
- Project notes
- Design reproduction permission

JavaScript validates the request and calculates an illustrative price estimate based on the selected printing options.

Supported automatic pricing scales include 1/144, 1/100, and 1/72. Other scales require manual review.

Customers can review the estimate and add the configured request to the existing Smart Cart.

Custom-print requests retain their selected specifications and estimated prices when displayed in the cart, Checkout, and Order Confirmation.

**Important:** The Custom Print system is a classroom prototype. It does not upload or analyze 3D model files, manufacture components, or create real printing orders. Only the selected filename and request details are used by the website.

### Checkout System

The Checkout page provides a simulated ordering process.

It includes:

- Shipping information fields
- Purchase information fields
- Input validation
- Itemized order summaries
- Automatic subtotal calculation
- Shipping calculations
- Promotional coupon support
- Order submission

Orders totaling $75 or more qualify for free shipping. Smaller orders use a simulated $6.99 flat shipping rate.

The website supports prototype coupon codes that update the displayed order total.

The checkout is for educational demonstration only. It does not connect to a payment processor or charge customers. Real payment information should never be entered.

### Order Confirmation

After a successful prototype checkout, the website displays an Order Confirmation page.

The confirmation includes the purchased items, quantities, subtotal, shipping, applicable discount, and total.

The shopping cart is cleared after order submission. The order summary is stored locally for confirmation purposes.

### Network Connection Test

The Network Connection Test page was introduced during Week 5.

It demonstrates how JavaScript can identify the environment in which the webpage is running.

The page displays:

- Local Host Name
- Current Communication Port
- Current Transmission Protocol
- Last Time Launched

When opened through Visual Studio Code Live Preview, the page identifies the active local development server.

When opened directly as a static HTML file, it displays Static File Mode.

A browser cookie stores the previous hosted-page launch timestamp so that it can be displayed after refreshing the page.

This feature tests the webpage's launch environment rather than confirming external internet connectivity.

### Contact Form

The Contact page includes a prototype contact form with JavaScript input validation.

The form checks user input and displays feedback. It does not transmit messages to a real email service.

### Builder Resources

The Builder Resources page provides introductory information about model building, customization, kitbashing, and diorama construction.

It is designed to support customers who are learning or exploring different hobby-building techniques.

## Technologies Used

**HTML5**

Provides the structure, navigation, content, forms, and semantic elements used throughout the website.

**CSS3**

Controls the website's appearance, responsive layouts, typography, colors, product cards, and expandable shopping cart.

**JavaScript**

Handles interactive features such as product rendering, inventory tracking, cart updates, printing estimates, form validation, and checkout calculations.

**Browser Storage**

- localStorage preserves shopping cart, inventory, and prototype order information.
- Cookies support the Network Connection Test's previous-launch timestamp.

**Development Tools**

- Visual Studio Code
- Microsoft Live Preview
- Google Chrome
- Git
- GitHub
- GitHub Pages

## Project Structure

```text
One in 144/
|
|-- index.html
|-- shop.html
|-- product.html
|-- cart.html
|-- checkout.html
|-- confirmation.html
|-- custom-print.html
|-- resources.html
|-- contact.html
|-- network-test.html
|
|-- css/
|   |-- styles.css
|
|-- js/
|   |-- script.js
|   |-- network-test.js
|
|-- assets/
|
|-- README.md
```

## Running the Website Locally

1. Download or clone the GitHub repository.
2. Open the project directory in Visual Studio Code.
3. Install Microsoft's Live Preview extension if needed.
4. Open `index.html`.
5. Select Show Preview to launch the website locally.
6. Navigate through the website to test its features.

The Network Connection Test page can be accessed through `network-test.html`.

When running through Live Preview, the page should detect the local server and display the host, port, and HTTP protocol.

## Recommended Functionality Tests

### Shopping Cart

1. Open the Shop page.
2. Add a product.
3. Expand the Smart Cart.
4. Increase and decrease the product quantity.
5. Verify that quantities, stock, and totals update.
6. Refresh the webpage and confirm the cart is preserved.

### Custom Printing

1. Open Custom Print.
2. Enter a project name and select an STL or OBJ file.
3. Choose material, scale, detail, finish, and quantity.
4. Verify that estimated pricing changes.
5. Confirm design permission.
6. Review the request.
7. Add the estimate to the Smart Cart.
8. Verify that the specifications appear correctly.

### Checkout

1. Add a regular product and a custom-print request.
2. Open Checkout.
3. Verify the itemized summary and totals.
4. Complete the prototype form with fictional test information.
5. Submit the order.
6. Confirm that the Order Confirmation page displays the correct information.
7. Verify that the Smart Cart has been cleared.

### Network Connection

1. Open `network-test.html` through Live Preview.
2. Confirm that the local server is detected.
3. Verify the hostname, port, and protocol.
4. Refresh the page.
5. Confirm that the previously stored launch timestamp appears.
6. Open the HTML file directly to verify Static File Mode.

## Development Milestones

### Initial Development

Established the website structure, navigation, branding, product categories, and initial page designs.

### Interactive E-Commerce Development

Implemented the JavaScript product catalog, shopping cart functionality, inventory tracking, form validation, and simulated checkout.

### Week 4 – Smart Cart

Expanded the shopping cart with a fixed, expandable interface and improved quantity management, inventory synchronization, and cart persistence.

### Week 5 – Final Development

Implemented the Network Connection Test page and expanded the Custom 3D Printing system.

New functionality includes dynamic printing estimates, additional configuration options, request validation, and integration of custom-print estimates with the existing shopping cart and checkout.

## Project Limitations

One in 144 is an educational front-end prototype.

It does not currently include:

- A centralized product inventory database
- User accounts or authentication
- Real payment processing
- Actual file uploads
- Automated 3D model analysis
- Real order fulfillment
- Real customer messaging

Cart, inventory, and order information is stored within the user's browser. It is not synchronized between different customers or devices.

Pricing and inventory values are fictional and intended for classroom demonstrations.

## Future Development

Potential future improvements include backend inventory management, customer accounts, real product images, secure order processing, server-side file uploads, automated 3D printing estimates, and more detailed product customization.

## Academic Purpose

This project was developed as part of SDC260 coursework at ECPI University. It demonstrates front-end development concepts and is not an active commercial store.

---

**One in 144**

*Build. Combine. Create.*
