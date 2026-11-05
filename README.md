# Assignment 6: jQuery (DOM Manipulation, Search & UX Engagement)
**Project Theme:** Minecraft PvP Championship (MCTiers League)  
**Team Members:** Batyrkhan Uvayev & Yermek Sain  
**Course:** Frontend Development  

---

## 🌟 Overview
This project is an interactive esports tournament hub for competitive Minecraft PvP tier testing and league management. It builds upon **Assignment 5** and implements all requirements of **Assignment 6: jQuery** (Tasks 0 through 9), including real-time search & live filtering, autocomplete suggestions, regex word highlighting, a stylized scroll progress bar, animated number counters, form submit loading spinners, toast notifications, copy-to-clipboard buttons, and scroll-based image lazy loading.

---

## 🚀 Assignment 6: Implemented jQuery Features

### Task 0. Setup
- Included jQuery (`https://code.jquery.com/jquery-4.0.0.min.js` with fallback) in the `<head>` section of all HTML pages (`index.html`, `leaderboard.html`, `about.html`, `contact.html`).
- Wrapped the application initialization in `$(document).ready(function () { ... })` inside `js/script.js` and verified readiness with `console.log("jQuery is ready!");`.

### Part 1. jQuery Search (20%)
- **Task 1. Real-time Search and Live Filter (`.on('keyup')`, `.filter()`):**
  - **Home (`index.html`):** Live search bar (`#matchSearchInput`) filters upcoming tournament match cards in real time as the user types.
  - **Leaderboard (`leaderboard.html`):** Live search bar (`#leaderboardSearch`) filters ranked players by IGN, country, tier, or kit.
  - **About Us (`about.html`):** Live search bar (`#faqSearchInput`) filters FAQ accordion items dynamically.
- **Task 2. Autocomplete Search Suggestions:**
  - Interactive dropdown suggestion lists (`#matchAutocompleteList`, `#leaderboardAutocomplete`, `#faqAutocompleteList`) appear as the user types, supporting mouse click and keyboard navigation (`ArrowDown`, `ArrowUp`, `Enter`, `Escape`).
- **Task 3. Search Highlighting (`.html()`, `RegExp`, `.wrap()`):**
  - Typing a keyword wraps all matching words in `<mark class="search-highlight">` across the FAQ section and team profiles (`about.html`), tournament match cards and rules (`index.html`), and leaderboard rows (`leaderboard.html`).

### Part 2. UX Engagement Elements with jQuery (20%)
- **Task 4. Colorful and Stylized Scroll Progress Bar:**
  - Fixed horizontal top progress bar (`#scrollProgressBar`) with an animated multi-color esports gradient that updates width smoothly on `$(window).on('scroll resize')`.
- **Task 5. Animated Number Counter (`.animate()`):**
  - Smoothly counts up numerical metrics from `0` to target values across the Home page stats section (`1,450+ Active Gladiators`, `380+ Official Tier Tests`, `$25,000+ Season Prize Pool`, `48 Nodes`), Leaderboard stats (`2,640 Total League Points`, `10 Verified Contenders`, `1,143 Wins`), and About Us page (`15,400+ Ranked Duels Hosted`, `24/7 Monitoring`, `99% Player Satisfaction`).
- **Task 6. Loading Spinner on Submit (`.prop('disabled', true)`):**
  - Clicking **Submit** on the Registration Wizard (`contact.html`) or Newsletter Subscription form (`about.html`) disables the button, displays a Bootstrap spinner with `"Please wait..."` text, and restores the button to normal after a simulated server response delay.

### Part 3. Using jQuery to Improve Web App Functionality (10%)
- **Task 7. Notification System (jQuery Toasts):**
  - Custom toast notification engine (`showToast()`) using `.fadeIn()`, `.delay()`, and `.fadeOut()` to confirm user actions (form submissions, clipboard copies, theme switches, discipline filters, and star ratings).
- **Task 8. Copied to Clipboard Button (`.on('copy')`):**
  - Added `"Copy"` buttons next to server IPs (`play.mctiersleague.net`, `eu.mctiersleague.net`), Discord links, lobby commands (`/verify mctiers-2026`, `/rankings top-10`), Pro PvP tips, player tags, and generated registration Ticket IDs. Clicking changes the icon to a checkmark (`✓ Copied!`) and displays a `"Copied to clipboard!"` tooltip.
- **Task 9. Image Lazy Loading (`scroll()`, `.offset()`, `.attr('src')`):**
  - Images with `.lazy-img` and `data-src` load dynamically when they enter the viewport as the user scrolls, transitioning smoothly from a lightweight SVG placeholder to the high-resolution image.

---

## 📂 Project Structure
```text
assignment5-wf-main/
├── index.html            # Main Hub: Live Stats, Arena Lazy Showcase, Match Search & Rating
├── leaderboard.html      # Player Rankings: Live Filter, Autocomplete, Highlighting & Counters
├── about.html            # Team & FAQ: FAQ Live Search, Regex Word Highlighting & Newsletter
├── contact.html          # Registration Wizard: Spinner on Submit, Copy Snippets & Toasts
├── css/
│   ├── bootstrap.min.css # Bootstrap grid & utilities
│   └── style.css         # Custom styles + Assignment 6 jQuery UI components
├── js/
│   ├── bootstrap.bundle.min.js
│   └── script.js         # Complete Assignment 5 & Assignment 6 (jQuery) logic
└── images/               # Arena photos, discipline icons, team avatars
```
