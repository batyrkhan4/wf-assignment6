
$(document).ready(function () {
    console.log("jQuery is ready!");

    function readWindowNameState() {
        try {
            if (window.name && window.name.indexOf("MCTIERS_STATE:") === 0) {
                return JSON.parse(window.name.slice("MCTIERS_STATE:".length));
            }
        } catch (e) {}
        return {};
    }

    function writeWindowNameState(patch) {
        try {
            const current = readWindowNameState();
            const updated = Object.assign({}, current, patch);
            window.name = "MCTIERS_STATE:" + JSON.stringify(updated);
        } catch (e) {}
    }

    function safeGetStorage(key) {
        try {
            const params = new URLSearchParams(window.location.search);
            if (key === "mctiers_theme" && params.has("theme")) return params.get("theme");
            if (key === "mctiers_grad" && params.has("grad")) return params.get("grad");
            if (key === "mctiers_sound_enabled" && params.has("sound")) return params.get("sound");
        } catch (e) {}

        try {
            const val = window.localStorage.getItem(key);
            if (val !== null) return val;
        } catch (e) {}

        const winState = readWindowNameState();
        if (winState[key] !== undefined && winState[key] !== null) {
            return String(winState[key]);
        }

        return null;
    }

    function safeSetStorage(key, val) {
        const strVal = String(val);
        writeWindowNameState({ [key]: strVal });
        try {
            window.localStorage.setItem(key, strVal);
        } catch (e) {}
        syncInternalLinksState();
    }

    function syncInternalLinksState() {
        const theme = safeGetStorage("mctiers_theme") || (document.body.classList.contains("light-theme") ? "light" : "dark");
        const grad = safeGetStorage("mctiers_grad") || "0";
        const sound = safeGetStorage("mctiers_sound_enabled") !== null ? safeGetStorage("mctiers_sound_enabled") : "true";

        $("a[href]").each(function () {
            const rawHref = $(this).attr("href");
            if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("http") || rawHref.startsWith("mailto:")) return;
            const baseHref = rawHref.split("?")[0];
            if (baseHref.endsWith(".html")) {
                $(this).attr("href", `${baseHref}?theme=${encodeURIComponent(theme)}&grad=${encodeURIComponent(grad)}&sound=${encodeURIComponent(sound)}`);
            }
        });
    }
    
    const SoundEngine = {
        ctx: null,
        enabled: true,

        init() {
            if (!this.ctx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    this.ctx = new AudioContextClass();
                }
            }
            if (this.ctx && this.ctx.state === "suspended") {
                this.ctx.resume();
            }
        },

        toggleSound() {
            this.enabled = !this.enabled;
            safeSetStorage("mctiers_sound_enabled", this.enabled);
            this.updateButtonUI();
            if (this.enabled) {
                this.playClick();
            }
            return this.enabled;
        },

        updateButtonUI() {
            const $btn = $("#soundToggleBtn");
            if ($btn.length) {
                $btn.html(this.enabled ? "🔊 Sound: On" : "🔇 Sound: Off");
                $btn.attr("aria-pressed", this.enabled ? "true" : "false");
            }
        },

        playClick() {
            if (!this.enabled) return;
            try {
                this.init();
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(650, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.05);
            } catch (err) {
                console.warn("Audio playback not permitted yet", err);
            }
        },

        playStar(starIndex) {
            if (!this.enabled) return;
            try {
                this.init();
                if (!this.ctx) return;
                const scale = [261.63, 329.63, 392.00, 523.25, 659.25];
                const freq = scale[starIndex] || 440;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.22);
            } catch (err) {
                console.warn(err);
            }
        },

        playSwitch() {
            if (!this.enabled) return;
            try {
                this.init();
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = "square";
                osc.frequency.setValueAtTime(320, this.ctx.currentTime);
                osc.frequency.setValueAtTime(480, this.ctx.currentTime + 0.04);
                gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 0.09);
            } catch (err) {
                console.warn(err);
            }
        },

        playSuccess() {
            if (!this.enabled) return;
            try {
                this.init();
                if (!this.ctx) return;
                const notes = [392.00, 523.25, 659.25, 783.99];
                notes.forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    const startTime = this.ctx.currentTime + idx * 0.09;
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(freq, startTime);
                    gain.gain.setValueAtTime(0.15, startTime);
                    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(startTime);
                    osc.stop(startTime + 0.2);
                });
            } catch (err) {
                console.warn(err);
            }
        }
    };

    const savedSound = safeGetStorage("mctiers_sound_enabled");
    if (savedSound !== null) {
        SoundEngine.enabled = savedSound === "true";
    }
    SoundEngine.updateButtonUI();

    $("#soundToggleBtn").on("click", function () {
        const isEnabled = SoundEngine.toggleSound();
        showToast(isEnabled ? "Sound effects enabled" : "Sound effects muted", "info", isEnabled ? "🔊" : "🔇");
    });

    // ======================================================================
    // Task 7. Notification System (jQuery Toast Notifications)
    // ======================================================================
    function showToast(message, type = "info", icon = "⚡") {
        let $container = $("#toastContainer");
        if (!$container.length) {
            $container = $('<div id="toastContainer" class="toast-notification-container" aria-live="polite"></div>');
            $("body").append($container);
        }

        const $toast = $(`
            <div class="jq-toast toast-${type}" role="status">
                <div class="jq-toast-content">
                    <span class="jq-toast-icon">${icon}</span>
                    <span class="jq-toast-msg">${message}</span>
                    <button type="button" class="jq-toast-close" aria-label="Close notification">&times;</button>
                </div>
            </div>
        `);

        $container.append($toast);

        // Animate toast in and automatically fade out
        $toast.fadeIn(220).delay(3000).fadeOut(400, function () {
            $(this).remove();
        });

        $toast.find(".jq-toast-close").on("click", function () {
            $toast.stop(true, true).fadeOut(200, function () {
                $(this).remove();
            });
        });
    }

    // ======================================================================
    // Task 4. Colorful and Stylized Scroll Progress Bar (jQuery)
    // ======================================================================
    function updateScrollProgress() {
        const scrollTop = $(window).scrollTop();
        const docHeight = $(document).height() - $(window).height();
        const scrollPercent = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
        $("#scrollProgressBar").css("width", scrollPercent + "%");
    }

    $(window).on("scroll resize", updateScrollProgress);
    updateScrollProgress();

    // ======================================================================
    // Task 9. Image Lazy Loading using jQuery scroll(), .offset(), .attr('src')
    // ======================================================================
    function checkLazyImages() {
        const viewportBottom = $(window).scrollTop() + $(window).height() + 180;

        $("img.lazy-img:not(.lazy-loaded)").each(function () {
            const $img = $(this);
            const imgOffset = $img.offset();
            const imgTop = imgOffset ? imgOffset.top : 0;

            if (viewportBottom >= imgTop) {
                const realSrc = $img.attr("data-src");
                if (realSrc) {
                    $img.attr("src", realSrc);
                    $img.on("load", function () {
                        $img.addClass("lazy-loaded");
                    });
                    // Fallback in case image is cached
                    setTimeout(() => $img.addClass("lazy-loaded"), 80);
                }
            }
        });
    }

    $(window).scroll(function () {
        checkLazyImages();
    });
    $(window).on("resize", checkLazyImages);
    checkLazyImages();

    // ======================================================================
    // Task 8. Copied to Clipboard Button using jQuery .on('copy') & click
    // ======================================================================
    function copyTextToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text).catch(() => fallbackCopyText(text));
        }
        return Promise.resolve(fallbackCopyText(text));
    }

    function fallbackCopyText(text) {
        const $temp = $("<textarea>");
        $("body").append($temp);
        $temp.val(text).select();
        document.execCommand("copy");
        $temp.remove();
    }

    function triggerCopiedFeedback($btn, copiedText) {
        const $icon = $btn.find(".copy-icon");
        const $label = $btn.find(".copy-text");
        const $tooltip = $btn.find(".copy-tooltip");

        const originalLabel = $btn.data("orig-label") || $label.text() || "Copy";
        if (!$btn.data("orig-label")) {
            $btn.data("orig-label", originalLabel);
        }

        $btn.addClass("copied");
        $icon.text("✓");
        $label.text("Copied!");
        $tooltip.stop(true, true).fadeIn(150).delay(1400).fadeOut(250);

        SoundEngine.playClick();
        showToast(`Copied to clipboard: "${copiedText.length > 36 ? copiedText.slice(0, 36) + "..." : copiedText}"`, "success", "📋");

        setTimeout(() => {
            $btn.removeClass("copied");
            $icon.text("📋");
            $label.text(originalLabel);
        }, 1800);
    }

    $(document).on("click", ".btn-copy-snippet", function () {
        const $btn = $(this);
        const targetSelector = $btn.attr("data-copy-target");
        let textToCopy = $btn.attr("data-copy-text") || "";

        if (targetSelector && $(targetSelector).length) {
            textToCopy = $(targetSelector).text().trim();
        }

        if (!textToCopy) return;

        copyTextToClipboard(textToCopy).then(() => {
            // Trigger jQuery 'copy' event on target or button
            if (targetSelector && $(targetSelector).length) {
                $(targetSelector).trigger("copy");
            }
            triggerCopiedFeedback($btn, textToCopy);
        });
    });

    // Listen to native/triggered 'copy' events on snippet codes using jQuery .on('copy')
    $(document).on("copy", ".copy-snippet-code", function () {
        const $code = $(this);
        $code.css("transition", "color 0.2s ease").css("color", "#10b981");
        setTimeout(() => $code.css("color", ""), 1000);
    });

    // ======================================================================
    // Task 5. Animated Number Counter using jQuery .animate()
    // ======================================================================
    function animateNumberElement($el, targetValue, prefix = "", suffix = "", duration = 1600) {
        $({ countValue: 0 }).animate(
            { countValue: targetValue },
            {
                duration: duration,
                easing: "swing",
                step: function (now) {
                    $el.text(prefix + Math.floor(now).toLocaleString() + suffix);
                },
                complete: function () {
                    $el.text(prefix + Number(targetValue).toLocaleString() + suffix);
                }
            }
        );
    }

    function checkAnimatedCounters() {
        const viewportBottom = $(window).scrollTop() + $(window).height();

        $(".counter-num:not(.counted)").each(function () {
            const $counter = $(this);
            const offset = $counter.offset();
            if (offset && viewportBottom >= offset.top) {
                $counter.addClass("counted");
                const target = parseInt($counter.attr("data-target"), 10) || 0;
                const prefix = $counter.attr("data-prefix") || "";
                const suffix = $counter.attr("data-suffix") || "";
                animateNumberElement($counter, target, prefix, suffix, 1700);
            }
        });
    }

    $(window).on("scroll resize", checkAnimatedCounters);
    checkAnimatedCounters();

    // ======================================================================
    // Task 3 Helper: Search Highlighting using jQuery .html(), regex, .wrap()
    // ======================================================================
    function escapeRegExp(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }

    function highlightTextInElements($elements, keyword) {
        let totalMatches = 0;

        $elements.each(function () {
            const $el = $(this);
            // Store original clean HTML once
            if ($el.data("original-html") === undefined) {
                $el.data("original-html", $el.html());
            }

            const cleanHTML = $el.data("original-html");
            $el.html(cleanHTML);

            if (!keyword || !keyword.trim()) {
                return;
            }

            const regex = new RegExp(`(${escapeRegExp(keyword.trim())})`, "gi");

            // Highlight text nodes inside the element and wrap matches in <mark class="search-highlight">
            $el.contents().each(function walkNodes() {
                if (this.nodeType === 3) {
                    const text = this.nodeValue;
                    if (regex.test(text)) {
                        const matches = text.match(regex);
                        if (matches) totalMatches += matches.length;
                        const replaced = text.replace(regex, '<span class="raw-match">$1</span>');
                        const $tempWrapper = $("<span>").html(replaced);
                        // Use jQuery .wrap() on matched spans as hinted in Task 3
                        $tempWrapper.find(".raw-match").wrap('<mark class="search-highlight"></mark>');
                        $(this).replaceWith($tempWrapper.contents());
                    }
                } else if (this.nodeType === 1 && this.nodeName !== "SCRIPT" && this.nodeName !== "BUTTON" && !$(this).hasClass("search-highlight")) {
                    $(this).contents().each(walkNodes);
                }
            });
        });

        return totalMatches;
    }

    // ======================================================================
    // Task 2 Helper: Reusable jQuery Autocomplete Dropdown Builder
    // ======================================================================
    function setupAutocomplete($input, $dropdown, getSuggestionsFn, onSelectCallback) {
        if (!$input.length || !$dropdown.length) return;

        $input.on("keyup focus", function (e) {
            if (["ArrowUp", "ArrowDown", "Enter", "Escape"].includes(e.key)) {
                return;
            }

            const query = $input.val().trim();
            if (!query) {
                $dropdown.slideUp(120);
                return;
            }

            const suggestions = getSuggestionsFn(query);
            if (!suggestions.length) {
                $dropdown.slideUp(120);
                return;
            }

            const regex = new RegExp(`(${escapeRegExp(query)})`, "gi");
            const listHTML = suggestions.slice(0, 6).map(item => {
                const highlightedLabel = item.label.replace(regex, '<mark class="search-highlight">$1</mark>');
                return `
                    <li class="autocomplete-item" role="option" data-value="${item.value}">
                        <span>${highlightedLabel}</span>
                        <span class="autocomplete-category">${item.category}</span>
                    </li>
                `;
            }).join("");

            $dropdown.html(listHTML).stop(true, true).slideDown(140);
        });

        // Keyboard navigation inside autocomplete dropdown
        $input.on("keydown", function (e) {
            const $items = $dropdown.find(".autocomplete-item");
            if (!$dropdown.is(":visible") || !$items.length) return;

            let activeIdx = $items.index($items.filter(".active-suggestion"));

            if (e.key === "ArrowDown") {
                e.preventDefault();
                activeIdx = (activeIdx + 1) % $items.length;
                $items.removeClass("active-suggestion").eq(activeIdx).addClass("active-suggestion");
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                activeIdx = (activeIdx - 1 + $items.length) % $items.length;
                $items.removeClass("active-suggestion").eq(activeIdx).addClass("active-suggestion");
            } else if (e.key === "Enter" && activeIdx >= 0) {
                e.preventDefault();
                const chosenVal = $items.eq(activeIdx).attr("data-value");
                $input.val(chosenVal);
                $dropdown.slideUp(120);
                onSelectCallback(chosenVal);
            } else if (e.key === "Escape") {
                $dropdown.slideUp(120);
            }
        });

        // Click suggestion item
        $dropdown.on("click", ".autocomplete-item", function () {
            const chosenVal = $(this).attr("data-value");
            $input.val(chosenVal);
            $dropdown.slideUp(120);
            SoundEngine.playClick();
            onSelectCallback(chosenVal);
        });

        // Hide dropdown when clicking outside
        $(document).on("click", function (e) {
            if (!$(e.target).closest(".search-autocomplete-wrapper").length) {
                $dropdown.slideUp(120);
            }
        });
    }

    // ======================================================================
    // Keyboard Event Handling for Navbar (Assignment 5)
    // ======================================================================
    function initKeyboardNavigation() {
        const navLinks = Array.from(document.querySelectorAll(".navbar-nav .nav-link"));
        if (!navLinks.length) return;

        function focusLink(targetIndex) {
            if (targetIndex >= 0 && targetIndex < navLinks.length) {
                navLinks.forEach(l => l.classList.remove("keyboard-focused"));
                const target = navLinks[targetIndex];
                target.focus();
                target.classList.add("keyboard-focused");
                SoundEngine.playClick();
            }
        }

        document.addEventListener("keydown", (event) => {
            const activeTag = document.activeElement ? document.activeElement.tagName : "";
            if (["INPUT", "TEXTAREA", "SELECT"].includes(activeTag)) return;

            let currentIndex = navLinks.indexOf(document.activeElement);
            let targetIndex = null;

            switch (event.key) {
                case "ArrowRight":
                case "ArrowDown":
                    event.preventDefault();
                    if (currentIndex === -1) {
                        const activePageIdx = navLinks.findIndex(l => l.classList.contains("active"));
                        targetIndex = activePageIdx !== -1 ? (activePageIdx + 1) % navLinks.length : 0;
                    } else {
                        targetIndex = (currentIndex + 1) % navLinks.length;
                    }
                    break;

                case "ArrowLeft":
                case "ArrowUp":
                    event.preventDefault();
                    if (currentIndex === -1) {
                        const activePageIdx = navLinks.findIndex(l => l.classList.contains("active"));
                        targetIndex = activePageIdx !== -1 ? (activePageIdx - 1 + navLinks.length) % navLinks.length : navLinks.length - 1;
                    } else {
                        targetIndex = (currentIndex - 1 + navLinks.length) % navLinks.length;
                    }
                    break;

                case "Home":
                    event.preventDefault();
                    targetIndex = 0;
                    break;

                case "End":
                    event.preventDefault();
                    targetIndex = navLinks.length - 1;
                    break;

                default:
                    return;
            }

            if (targetIndex !== null) {
                focusLink(targetIndex);
            }
        });

        navLinks.forEach(link => {
            link.addEventListener("blur", () => {
                link.classList.remove("keyboard-focused");
            });
        });
    }
    initKeyboardNavigation();

    // ======================================================================
    // Theme Switcher & Gradient Background Cycler
    // ======================================================================
    function initThemeSwitcher() {
        const $themeBtn = $("#themeToggleBtn");
        const $body = $("body");

        const darkGradients = [
            "linear-gradient(135deg, #0d0f17, #171a26)",
            "linear-gradient(135deg, #111827, #1f2937)",
            "linear-gradient(135deg, #1e1b4b, #312e81)",
            "linear-gradient(135deg, #064e3b, #065f46)",
            "linear-gradient(135deg, #451a03, #78350f)",
            "linear-gradient(135deg, #3b0764, #581c87)"
        ];

        const lightGradients = [
            "linear-gradient(135deg, #f8fafc, #e2e8f0)",
            "linear-gradient(135deg, #e0f2fe, #bae6fd)",
            "linear-gradient(135deg, #ecfdf5, #d1fae5)",
            "linear-gradient(135deg, #fef3c7, #fde68a)",
            "linear-gradient(135deg, #f3e8ff, #e9d5ff)",
            "linear-gradient(135deg, #ffe4e6, #fecdd3)"
        ];

        let currentGrad = parseInt(safeGetStorage("mctiers_grad") || "0", 10);
        if (isNaN(currentGrad) || currentGrad < 0) currentGrad = 0;

        const applyActiveThemeAndGradient = (isLight, gradIdx) => {
            if ($themeBtn.length) {
                $themeBtn.html(isLight ? "☀️ Theme: Day" : "🌙 Theme: Night");
                $themeBtn.attr("aria-label", isLight ? "Switch to Night theme" : "Switch to Day theme");
            }
            const activePalette = isLight ? lightGradients : darkGradients;
            const safeIdx = gradIdx % activePalette.length;
            if (safeIdx > 0) {
                $body.css({
                    backgroundImage: activePalette[safeIdx],
                    backgroundAttachment: "fixed",
                    backgroundSize: "cover"
                });
            } else {
                $body.css("background-image", "");
            }
        };

        const savedTheme = safeGetStorage("mctiers_theme");
        const isInitialLight = savedTheme === "light";
        if (isInitialLight) {
            $body.addClass("light-theme");
        } else {
            $body.removeClass("light-theme");
        }
        applyActiveThemeAndGradient(isInitialLight, currentGrad);
        safeSetStorage("mctiers_theme", isInitialLight ? "light" : "dark");
        safeSetStorage("mctiers_grad", currentGrad);

        $themeBtn.on("click", function () {
            const isLight = $body.toggleClass("light-theme").hasClass("light-theme");
            currentGrad = 0;
            safeSetStorage("mctiers_theme", isLight ? "light" : "dark");
            safeSetStorage("mctiers_grad", 0);
            applyActiveThemeAndGradient(isLight, 0);
            SoundEngine.playSwitch();
            showToast(`Switched to ${isLight ? "Day (Light)" : "Night (Dark)"} theme`, "info", isLight ? "☀️" : "🌙");
        });

        $("#changeThemeBtn").on("click", function () {
            const isLight = $body.hasClass("light-theme");
            const activePalette = isLight ? lightGradients : darkGradients;
            currentGrad = (currentGrad + 1) % activePalette.length;
            safeSetStorage("mctiers_grad", currentGrad);
            applyActiveThemeAndGradient(isLight, currentGrad);
            SoundEngine.playClick();
            showToast("Arena background gradient updated!", "info", "🎨");
        });
    }
    initThemeSwitcher();

    // ======================================================================
    // Time-of-Day Greeting (Switch Statement)
    // ======================================================================
    function initTimeGreeting() {
        const $greetingEl = $("#timeGreeting");
        const $greetingBadge = $("#greetingBadge");
        if (!$greetingEl.length) return;

        const hour = new Date().getHours();
        let message = "";
        let badge = "";

        switch (true) {
            case (hour >= 5 && hour < 12):
                message = "Good morning, Warrior! Ready for morning duels? ⚔️";
                badge = "Dawn Training";
                break;
            case (hour >= 12 && hour < 18):
                message = "Good afternoon, Champion! Tournament arenas are live! 🏆";
                badge = "Prime Battles";
                break;
            case (hour >= 18 && hour < 23):
                message = "Good evening, Gladiator! Evening showdowns active! 🌌";
                badge = "Night League";
                break;
            default:
                message = "Welcome, Shadow Duelist! Elite underground arena open! 🌙";
                badge = "Midnight Ops";
                break;
        }

        $greetingEl.text(message);
        if ($greetingBadge.length) {
            $greetingBadge.text(badge);
        }
    }
    initTimeGreeting();

    // ======================================================================
    // Pro PvP Tips Generator
    // ======================================================================
    function initPvPTips() {
        const $tipText = $("#pvpTipContent");
        const $tipAuthor = $("#pvpTipAuthor");
        const $tipBtn = $("#newTipBtn");
        if (!$tipText.length || !$tipBtn.length) return;

        const tips = [
            { quote: "Critical hits require falling momentum — jump and strike precisely on the descent for maximum hearts.", author: "Erauina (HT1 Champion)" },
            { quote: "Always keep a water bucket in your hotbar; it resets fall damage and extinguishes flame aspect immediately.", author: "Itzrealme (Pot PvP Lead)" },
            { quote: "In Axe PvP, disable enemy shields with an axe sprint-hit before switching to your sword for combo follow-ups.", author: "Crozzor (Axe Tier Test Host)" },
            { quote: "Place End Crystals on obsidian diagonally to shield your hitbox while dealing lethal blast radius damage.", author: "VapeFly (Crystal Specialist)" },
            { quote: "Speed II potions increase your FOV and maneuverability — learn to W-tap to continuously reset enemy sprint.", author: "Speedster (Tier 1 Duelist)" },
            { quote: "Spacing is king: keeping a 3-block reach distance prevents enemies from starting counter-combos.", author: "Sharpness (EU Regional Winner)" }
        ];

        let lastIndex = 0;

        $tipBtn.on("click", function () {
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * tips.length);
            } while (nextIndex === lastIndex && tips.length > 1);

            lastIndex = nextIndex;
            const chosen = tips[nextIndex];

            $tipText.css("opacity", "0");
            setTimeout(() => {
                $tipText.text(`"${chosen.quote}"`);
                $tipAuthor.text(`— ${chosen.author}`);
                $tipText.css("opacity", "1");
            }, 180);

            SoundEngine.playClick();
        });
    }
    initPvPTips();

    // ======================================================================
    // "Read More" Extended Rules Toggle
    // ======================================================================
    function initReadMore() {
        const $readMoreBtn = $("#readMoreRulesBtn");
        const $extendedRules = $("#extendedRules");
        if (!$readMoreBtn.length || !$extendedRules.length) return;

        $readMoreBtn.on("click", function () {
            const isHidden = !$extendedRules.is(":visible");
            $extendedRules.slideToggle(250);
            $readMoreBtn.text(isHidden ? "Collapse Rules ↑" : "Read Extended Rules ↓");
            $readMoreBtn.attr("aria-expanded", isHidden ? "true" : "false");
            SoundEngine.playClick();
        });
    }
    initReadMore();

    // ======================================================================
    // Interactive Arena Gallery Showcase
    // ======================================================================
    function initArenaGallery() {
        const $displayImg = $("#arenaDisplayImg");
        const $displayTitle = $("#arenaDisplayTitle");
        const $displayDesc = $("#arenaDisplayDesc");
        const $displayBadge = $("#arenaDisplayBadge");
        const $thumbBtns = $(".arena-thumb-btn");

        if (!$displayImg.length || !$thumbBtns.length) return;

        const arenasData = {
            "overworld.jpg": {
                name: "Overworld Colosseum",
                badge: "Standard Duel Arena",
                desc: "Classic open-field battleground ideal for Sword 1.9+ spacing and shield mechanics under natural daylight."
            },
            "nether.jpg": {
                name: "Nether Fortress Bastion",
                badge: "Extreme Hazard",
                desc: "High-temperature arena surrounded by lava lakes. Testing fire-resistance management and tight corridor combat."
            },
            "end.jpg": {
                name: "The End Citadel",
                badge: "Crystal PvP Official",
                desc: "Void-edge arena with obsidian pillars designed exclusively for fast-paced End Crystal and anchor duels."
            },
            "dungeon.jpg": {
                name: "Ancient Stone Dungeon",
                badge: "Close Quarters",
                desc: "Subterranean stone labyrinth featuring claustrophobic corners where shield stun and axe crits dominate."
            },
            "portal.jpg": {
                name: "Ruined Portal Crossing",
                badge: "Hybrid Arena",
                desc: "Interdimensional gateway arena with uneven elevation challenges, crying obsidian blocks, and tactical cover."
            },
            "village.jpg": {
                name: "Desert Village Square",
                badge: "Tactical Skirmish",
                desc: "Urban combat testing rooftop traversal, parkour maneuvers, and multi-tier potion ambushes."
            }
        };

        $thumbBtns.on("click", function () {
            const $btn = $(this);
            const targetSrc = $btn.attr("data-src");
            const filename = $btn.attr("data-file");
            const arenaInfo = arenasData[filename] || {
                name: "Tournament Arena",
                badge: "Competitive",
                desc: "Official battleground for competitive tier test matches."
            };

            $thumbBtns.removeClass("active-thumb");
            $btn.addClass("active-thumb");

            $displayImg.addClass("fade-out");

            setTimeout(() => {
                $displayImg.attr("src", targetSrc).attr("data-src", targetSrc).attr("alt", arenaInfo.name).addClass("lazy-loaded");
                $displayTitle.text(arenaInfo.name);
                $displayBadge.text(arenaInfo.badge);
                $displayDesc.text(arenaInfo.desc);
                $displayImg.removeClass("fade-out");
            }, 150);

            SoundEngine.playClick();
            showToast(`Previewing Arena: ${arenaInfo.name}`, "info", "🏟️");
        });
    }
    initArenaGallery();

    // ======================================================================
    // 5-Star Rating System
    // ======================================================================
    function initStarRating() {
        const $starBtns = $(".star-btn");
        const $feedbackEl = $("#ratingFeedback");
        if (!$starBtns.length) return;

        let currentRating = 0;

        function updateStarsVisual(ratingCount, isHover = false) {
            $starBtns.each(function () {
                const $btn = $(this);
                const starVal = parseInt($btn.attr("data-star"), 10);
                if (starVal <= ratingCount) {
                    $btn.addClass(isHover ? "hovered" : "active");
                } else {
                    $btn.removeClass(isHover ? "hovered" : "active");
                }
            });
        }

        function getRatingMessage(rating) {
            switch (rating) {
                case 1:
                    return "⭐ 1/5: Needs work — we are forging sharper swords!";
                case 2:
                    return "⭐⭐ 2/5: Decent — arena repairs in progress.";
                case 3:
                    return "⭐⭐⭐ 3/5: Solid battleground — Iron rank approved!";
                case 4:
                    return "⭐⭐⭐⭐ 4/5: Epic league — Diamond Tier quality!";
                case 5:
                    return "⭐⭐⭐⭐⭐ 5/5: Flawless Victory — Netherite Tier Legend!";
                default:
                    return "Click a star to rate the championship!";
            }
        }

        $starBtns.each(function (index) {
            const $btn = $(this);

            $btn.on("mouseenter", function () {
                const hoverVal = parseInt($btn.attr("data-star"), 10);
                updateStarsVisual(hoverVal, true);
            });

            $btn.on("mouseleave", function () {
                $starBtns.removeClass("hovered");
                updateStarsVisual(currentRating, false);
            });

            $btn.on("click", function () {
                currentRating = parseInt($btn.attr("data-star"), 10);
                updateStarsVisual(currentRating, false);

                $btn.addClass("pulse");
                setTimeout(() => $btn.removeClass("pulse"), 300);

                const msg = getRatingMessage(currentRating);
                $feedbackEl.text(msg).css("color", currentRating >= 4 ? "#10b981" : "#59c7f5");

                SoundEngine.playStar(index);
                showToast(`Thank you! You rated MCTiers League ${currentRating}/5 stars.`, "success", "⭐");
            });
        });
    }
    initStarRating();

    // ======================================================================
    // Task 1, Task 2, Task 3 & Task 9 on Home Page Matches Section
    // ======================================================================
    function initMatchFilterAndSearch() {
        const $container = $("#matchesContainer");
        const $filterBtns = $(".btn-discipline-filter:not(.btn-lb-filter)");
        const $searchInput = $("#matchSearchInput");
        const $autocomplete = $("#matchAutocompleteList");
        const $clearBtn = $("#clearMatchSearchBtn");

        if (!$container.length) return;

        const matchesData = [
            {
                id: 1,
                title: "Grand Final: Sword 1.19",
                discipline: "Sword",
                date: "Sep 25, 18:00 UTC",
                desc: "Showdown between Erauina and Itzrealme for top rank.",
                image: "images/Без_названия-removebg-preview (1).png",
                action: "Watch Match"
            },
            {
                id: 2,
                title: "Crystal Tier Test",
                discipline: "Crystal",
                date: "Sep 28, 16:00 UTC",
                desc: "Qualification duels for High Tier 1 and High Tier 2.",
                image: "images/crys-removebg-preview.png",
                action: "Register Test"
            },
            {
                id: 3,
                title: "Pot PvP 1.8 Showdown",
                discipline: "Pot",
                date: "Oct 2, 19:00 UTC",
                desc: "Classic competitive potion duels with a cash prize pool.",
                image: "images/PotionDuels.webp",
                action: "Join Tournament"
            },
            {
                id: 4,
                title: "Heavy Shield & Axe Clash",
                discipline: "Axe",
                date: "Oct 8, 17:00 UTC",
                desc: "Brutal axe combat focusing on critical hits and shield breaks.",
                image: "images/Без_названия-removebg-preview (1).png",
                action: "Enter Queue"
            },
            {
                id: 5,
                title: "End Crystal Blast Invitational",
                discipline: "Crystal",
                date: "Oct 15, 20:00 UTC",
                desc: "World tier invitation tournament with double elimination brackets.",
                image: "images/crys-removebg-preview.png",
                action: "View Bracket"
            },
            {
                id: 6,
                title: "Pot Speed Sprint Masters",
                discipline: "Pot",
                date: "Oct 22, 18:30 UTC",
                desc: "High octane nodebuff matches with instant health II inventory kits.",
                image: "images/PotionDuels.webp",
                action: "Join Queue"
            }
        ];

        let selectedDiscipline = "All";

        function getBadgeClass(discipline) {
            switch (discipline) {
                case "Sword": return "bg-primary";
                case "Axe": return "bg-warning text-dark";
                case "Crystal": return "bg-danger";
                case "Pot": return "bg-success";
                default: return "bg-info text-dark";
            }
        }

        function renderAllMatches() {
            const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 180'%3E%3Crect width='300' height='180' fill='%23141824'/%3E%3C/svg%3E";

            const cardsHTML = matchesData.map(match => `
                <div class="col-md-6 col-lg-4 match-item-col" data-discipline="${match.discipline}">
                    <div class="card match-card h-100 bg-dark border-secondary">
                        <img src="${placeholderSvg}" data-src="${match.image}" class="card-img-top pixel-icon lazy-img" alt="${match.title}">
                        <div class="card-body d-flex flex-column text-light">
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <span class="badge ${getBadgeClass(match.discipline)} match-searchable">${match.discipline}</span>
                                <small class="text-secondary">#${match.id}</small>
                            </div>
                            <h3 class="card-title text-info h5 match-searchable">${match.title}</h3>
                            <p class="card-text match-searchable">${match.desc}</p>
                            <p class="card-text mt-auto"><strong>Date:</strong> <span class="match-searchable">${match.date}</span></p>
                            <a href="contact.html" class="btn btn-outline-info mt-3">${match.action}</a>
                        </div>
                    </div>
                </div>
            `).join("");

            $container.html(cardsHTML);
            syncInternalLinksState();
            checkLazyImages();
        }

        // Task 1 & Task 3: Filter items using jQuery .filter() and highlight matching words
        function applyLiveMatchFilter() {
            const query = ($searchInput.val() || "").trim().toLowerCase();
            const $cols = $container.find(".match-item-col");

            // Use jQuery .filter() to find matching cards
            const $matchingCols = $cols.filter(function () {
                const $col = $(this);
                const disc = $col.attr("data-discipline");
                const matchesDisc = selectedDiscipline === "All" || disc === selectedDiscipline;
                const cardText = $col.text().toLowerCase();
                const matchesQuery = !query || cardText.indexOf(query) !== -1;
                return matchesDisc && matchesQuery;
            });

            $cols.hide();
            $matchingCols.fadeIn(180);

            // Remove old empty message if present
            $("#noMatchesAlert").remove();
            if ($matchingCols.length === 0) {
                $container.append(`
                    <div id="noMatchesAlert" class="col-12 text-center py-4 text-muted">
                        No upcoming matches found matching "${$searchInput.val()}".
                    </div>
                `);
            }

            // Task 3: Highlight matching words in match cards and tournament rules
            highlightTextInElements($container.find(".match-searchable"), query);
            highlightTextInElements($(".searchable-content"), query);
            checkLazyImages();
        }

        renderAllMatches();

        // Task 1: Real-time search on keyup
        $searchInput.on("keyup input", function () {
            applyLiveMatchFilter();
        });

        $clearBtn.on("click", function () {
            $searchInput.val("");
            $autocomplete.slideUp(120);
            applyLiveMatchFilter();
            SoundEngine.playClick();
        });

        // Task 2: Autocomplete suggestions for Match Search
        const matchSuggestionsPool = [
            ...matchesData.map(m => ({ label: m.title, value: m.title, category: m.discipline })),
            { label: "Sword (1.9+ Duels)", value: "Sword", category: "Discipline" },
            { label: "Axe & Shield PvP", value: "Axe", category: "Discipline" },
            { label: "Crystal PvP", value: "Crystal", category: "Discipline" },
            { label: "Pot PvP (Nodebuff)", value: "Pot", category: "Discipline" },
            { label: "Erauina vs Itzrealme", value: "Erauina", category: "Featured Player" },
            { label: "Double Elimination Brackets", value: "brackets", category: "Format" }
        ];

        setupAutocomplete(
            $searchInput,
            $autocomplete,
            function (query) {
                const q = query.toLowerCase();
                return matchSuggestionsPool.filter(item => item.label.toLowerCase().includes(q));
            },
            function () {
                applyLiveMatchFilter();
            }
        );

        $filterBtns.on("click", function () {
            const $btn = $(this);
            $filterBtns.removeClass("active");
            $btn.addClass("active");
            selectedDiscipline = $btn.attr("data-discipline");
            applyLiveMatchFilter();
            SoundEngine.playSwitch();
            showToast(`Filtered matches by: ${selectedDiscipline}`, "info", "⚔️");
        });
    }
    initMatchFilterAndSearch();

    // ======================================================================
    // Task 1, Task 2, Task 3 & Task 5 on Leaderboard Page
    // ======================================================================
    function initLeaderboard() {
        const $tableBody = $("#leaderboardTableBody");
        const $searchInput = $("#leaderboardSearch");
        const $autocomplete = $("#leaderboardAutocomplete");
        const $clearBtn = $("#clearLbSearchBtn");
        const $filterBtns = $(".btn-lb-filter");

        if (!$tableBody.length) return;

        const players = [
            { rank: 1, name: "Erauina", country: "Kazakhstan (KZ)", points: 300, tier: "HT1", discipline: "Sword", wins: 142 },
            { rank: 2, name: "Itzrealme", country: "USA (US)", points: 295, tier: "HT1", discipline: "Pot", wins: 138 },
            { rank: 3, name: "Crozzor", country: "USA (US)", points: 290, tier: "HT1", discipline: "Axe", wins: 131 },
            { rank: 4, name: "Kylaz", country: "USA (US)", points: 285, tier: "HT1", discipline: "Sword", wins: 125 },
            { rank: 5, name: "Sharpness", country: "Germany (DE)", points: 275, tier: "HT1", discipline: "Sword", wins: 119 },
            { rank: 6, name: "Refraction", country: "Canada (CA)", points: 260, tier: "LT1", discipline: "Pot", wins: 110 },
            { rank: 7, name: "VapeFly", country: "UK (GB)", points: 250, tier: "LT1", discipline: "Crystal", wins: 104 },
            { rank: 8, name: "Speedster", country: "France (FR)", points: 240, tier: "HT2", discipline: "Pot", wins: 98 },
            { rank: 9, name: "BlockHitter", country: "Brazil (BR)", points: 230, tier: "HT2", discipline: "Sword", wins: 91 },
            { rank: 10, name: "DiamondPvP", country: "Japan (JP)", points: 215, tier: "LT2", discipline: "Axe", wins: 85 }
        ];

        // Task 5: Animate Leaderboard Statistics Counters with jQuery
        const totalPoints = players.reduce((acc, curr) => acc + curr.points, 0);
        const $totalPointsEl = $("#statTotalPoints");
        const $topScoreEl = $("#statTopScore");
        const $countEl = $("#statPlayerCount");

        if ($totalPointsEl.length) {
            animateNumberElement($totalPointsEl, totalPoints, "", "", 1600);
        }
        if ($topScoreEl.length && players[0]) {
            $topScoreEl.text(`${players[0].name} (${players[0].points}p)`);
        }
        if ($countEl.length) {
            animateNumberElement($countEl, players.length, "", "", 1200);
        }

        function getTierBadgeClass(tier) {
            switch (tier) {
                case "HT1": return "tier-ht1";
                case "LT1": return "tier-lt1";
                case "HT2": return "tier-ht2";
                case "LT2": return "tier-lt2";
                default: return "bg-secondary";
            }
        }

        function renderAllPlayers() {
            const rowsHTML = players.map(p => `
                <tr class="leaderboard-row" data-discipline="${p.discipline}">
                    <td>#${p.rank}</td>
                    <td><strong class="lb-searchable" id="playerIgn-${p.rank}">${p.name}</strong></td>
                    <td class="lb-searchable">${p.country}</td>
                    <td>${p.points} Pts <span class="tier-badge ${getTierBadgeClass(p.tier)} ms-1 lb-searchable">${p.tier}</span></td>
                    <td><span class="badge bg-dark border border-secondary lb-searchable">${p.discipline}</span></td>
                    <td>${p.wins} Wins</td>
                    <td>
                        <button type="button" class="btn-copy-snippet" data-copy-text="${p.name} (${p.tier} - ${p.points} Pts)" aria-label="Copy ${p.name} stats">
                            <span class="copy-icon">📋</span> <span class="copy-text">Copy</span>
                            <span class="copy-tooltip">Copied to clipboard!</span>
                        </button>
                    </td>
                </tr>
            `).join("");

            $tableBody.html(rowsHTML);
        }

        let activeDiscipline = "All";

        // Task 1 & Task 3: Filter rows using jQuery .filter() and highlight matches
        function filterLeaderboardRows() {
            const query = ($searchInput.val() || "").trim().toLowerCase();
            const $rows = $tableBody.find(".leaderboard-row");

            const $matchedRows = $rows.filter(function () {
                const $row = $(this);
                const disc = $row.attr("data-discipline");
                const matchDisc = activeDiscipline === "All" || disc === activeDiscipline;
                const rowText = $row.find(".lb-searchable").text().toLowerCase();
                const matchSearch = !query || rowText.indexOf(query) !== -1;
                return matchDisc && matchSearch;
            });

            $rows.hide();
            $matchedRows.show();

            $("#noLbPlayersRow").remove();
            if ($matchedRows.length === 0) {
                $tableBody.append(`
                    <tr id="noLbPlayersRow">
                        <td colspan="7" class="text-center py-4 text-muted">No players found matching "${$searchInput.val()}".</td>
                    </tr>
                `);
            }

            highlightTextInElements($tableBody.find(".lb-searchable"), query);
        }

        renderAllPlayers();

        // Task 1: Real-time search on keyup
        $searchInput.on("keyup input", function () {
            filterLeaderboardRows();
        });

        $clearBtn.on("click", function () {
            $searchInput.val("");
            $autocomplete.slideUp(120);
            filterLeaderboardRows();
            SoundEngine.playClick();
        });

        // Task 2: Autocomplete Search Suggestions for Leaderboard
        const lbSuggestionsPool = [
            ...players.map(p => ({ label: `${p.name} — ${p.country}`, value: p.name, category: `${p.tier} • ${p.discipline}` })),
            { label: "Kazakhstan (KZ)", value: "Kazakhstan", category: "Country" },
            { label: "USA (US)", value: "USA", category: "Country" },
            { label: "Germany (DE)", value: "Germany", category: "Country" },
            { label: "HT1 (High Tier 1)", value: "HT1", category: "Tier" },
            { label: "LT1 (Low Tier 1)", value: "LT1", category: "Tier" }
        ];

        setupAutocomplete(
            $searchInput,
            $autocomplete,
            function (query) {
                const q = query.toLowerCase();
                return lbSuggestionsPool.filter(item =>
                    item.label.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
                );
            },
            function () {
                filterLeaderboardRows();
            }
        );

        $filterBtns.on("click", function () {
            const $btn = $(this);
            $filterBtns.removeClass("active");
            $btn.addClass("active");
            activeDiscipline = $btn.attr("data-discipline");
            filterLeaderboardRows();
            SoundEngine.playSwitch();
            showToast(`Leaderboard filtered by: ${activeDiscipline}`, "info", "🏆");
        });
    }
    initLeaderboard();

    // ======================================================================
    // Task 1, Task 2 & Task 3 on About Us Page (FAQ Live Search & Highlighting)
    // ======================================================================
    function initFaqSearchAndHighlighting() {
        const $faqSearch = $("#faqSearchInput");
        const $faqAutocomplete = $("#faqAutocompleteList");
        const $clearFaqBtn = $("#clearFaqSearchBtn");
        const $statusEl = $("#faqHighlightStatus");

        if (!$faqSearch.length) return;

        const faqSuggestions = [
            { label: "MCTiers League ranking platform", value: "MCTiers League", category: "FAQ" },
            { label: "Sword 1.9+ & Axe PvP disciplines", value: "Sword", category: "Discipline" },
            { label: "End Crystal & Pot PvP combat", value: "Crystal", category: "Discipline" },
            { label: "Register for official tier evaluation", value: "tier", category: "Registration" },
            { label: "Lunar Client & Badlion Client rules", value: "Client", category: "Rules" },
            { label: "Discord tag & IGN verification", value: "Discord", category: "Verification" },
            { label: "Batyrkhan Uvayev — Lead Organizer", value: "Batyrkhan", category: "Team" },
            { label: "Yermek Sain — System Architect", value: "Yermek", category: "Team" }
        ];

        function performFaqSearchAndHighlight() {
            const keyword = ($faqSearch.val() || "").trim();
            const $faqItems = $("#faqAccordionContainer .faq-item");
            const $searchableTextEls = $(".faq-q-text, .faq-a-text, #aboutTeamSection p, #aboutTeamSection h3");

            // Highlight matching words across FAQ and Team cards
            const matchCount = highlightTextInElements($searchableTextEls, keyword);

            if (!keyword) {
                $faqItems.show();
                $statusEl.text("");
                return;
            }

            // Filter FAQ items in real time using jQuery .filter() and expand matching answers
            const lowerKey = keyword.toLowerCase();
            $faqItems.each(function () {
                const $item = $(this);
                const text = $item.text().toLowerCase();
                const isMatch = text.indexOf(lowerKey) !== -1;

                if (isMatch) {
                    $item.stop(true, true).fadeIn(150);
                    const $qBtn = $item.find(".faq-question");
                    const $ans = $item.find(".faq-answer");
                    $qBtn.addClass("active").attr("aria-expanded", "true");
                    $ans.addClass("open").attr("aria-hidden", "false");
                } else {
                    $item.stop(true, true).fadeOut(150);
                }
            });

            $statusEl.text(
                matchCount > 0
                    ? `Highlighted ${matchCount} matching word${matchCount === 1 ? "" : "s"} for "${keyword}"`
                    : `No matches found for "${keyword}"`
            );
        }

        $faqSearch.on("keyup input", function () {
            performFaqSearchAndHighlight();
        });

        $clearFaqBtn.on("click", function () {
            $faqSearch.val("");
            $faqAutocomplete.slideUp(120);
            performFaqSearchAndHighlight();
            SoundEngine.playClick();
        });

        setupAutocomplete(
            $faqSearch,
            $faqAutocomplete,
            function (query) {
                const q = query.toLowerCase();
                return faqSuggestions.filter(item =>
                    item.label.toLowerCase().includes(q) || item.value.toLowerCase().includes(q)
                );
            },
            function () {
                performFaqSearchAndHighlight();
            }
        );
    }
    initFaqSearchAndHighlighting();

    // ======================================================================
    // Multi-Step Registration Wizard & Task 6: Loading Spinner on Submit
    // ======================================================================
    function initMultiStepRegistration() {
        const $regForm = $("#registrationForm");
        if (!$regForm.length) return;

        const steps = Array.from(document.querySelectorAll(".form-step"));
        const stepIndicators = Array.from(document.querySelectorAll(".step-indicator"));
        const $progressFill = $("#formProgressFill");
        const $feedbackCard = $("#submissionFeedbackCard");
        const $formCardBody = $("#formCardBody");

        let currentStepIndex = 0;

        function goToStep(targetIndex, callback) {
            if (targetIndex < 0 || targetIndex >= steps.length) return;

            steps.forEach((step, idx) => {
                step.classList.toggle("active", idx === targetIndex);
            });

            stepIndicators.forEach((ind, idx) => {
                ind.classList.toggle("active", idx === targetIndex);
                ind.classList.toggle("completed", idx < targetIndex);
            });

            if ($progressFill.length) {
                const percent = ((targetIndex + 1) / steps.length) * 100;
                $progressFill.css("width", `${percent}%`);
            }

            currentStepIndex = targetIndex;

            if (typeof callback === "function") {
                callback(currentStepIndex, steps.length);
            }
        }

        function validateStep(index) {
            let isValid = true;
            const currentStepEl = steps[index];
            if (!currentStepEl) return true;

            const inputs = currentStepEl.querySelectorAll("input, select, textarea");

            inputs.forEach(input => {
                const feedback = input.parentElement.querySelector(".invalid-feedback");
                let errorMsg = "";

                if (input.hasAttribute("required") && !input.value.trim()) {
                    errorMsg = "This field is required.";
                    isValid = false;
                } else if (input.id === "email" && input.value.trim()) {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(input.value.trim())) {
                        errorMsg = "Please enter a valid email address.";
                        isValid = false;
                    }
                } else if (input.id === "password" && input.value && input.value.length < 8) {
                    errorMsg = "Password must be at least 8 characters.";
                    isValid = false;
                } else if (input.id === "confirmPassword") {
                    const passVal = $("#password").val() || "";
                    if (input.value !== passVal) {
                        errorMsg = "Passwords do not match.";
                        isValid = false;
                    }
                }

                if (errorMsg) {
                    input.classList.add("is-invalid");
                    input.classList.remove("is-valid");
                    if (feedback) feedback.textContent = errorMsg;
                } else if (input.value.trim()) {
                    input.classList.remove("is-invalid");
                    input.classList.add("is-valid");
                    if (feedback) feedback.textContent = "";
                }
            });

            return isValid;
        }

        $(".btn-step-next").on("click", function () {
            if (validateStep(currentStepIndex)) {
                goToStep(currentStepIndex + 1, (newStep, total) => {
                    SoundEngine.playClick();
                    showToast(`Step ${newStep} verified! Moved to Step ${newStep + 1} of ${total}.`, "info", "✓");
                });
            } else {
                SoundEngine.playClick();
                showToast("Please complete all required fields correctly.", "warning", "⚠️");
            }
        });

        $(".btn-step-prev").on("click", function () {
            goToStep(currentStepIndex - 1, (newStep) => {
                SoundEngine.playClick();
                console.log(`Callback: Form returned to step ${newStep + 1}`);
            });
        });

        $regForm.find("button[type='reset']").on("click", function () {
            $regForm.find("input, select, textarea").val("").removeClass("is-invalid is-valid");
            goToStep(0, () => {
                SoundEngine.playClick();
                showToast("Registration form fields reset.", "info", "🔄");
            });
        });

        // Task 6: Loading Spinner on Submit + Task 7: Notification Toast
        $regForm.on("submit", function (e) {
            e.preventDefault();

            if (!validateStep(currentStepIndex)) {
                showToast("Please fill in your Discord tag and battle experience.", "warning", "⚠️");
                return;
            }

            const $submitBtn = $("#regSubmitBtn");
            const originalBtnHtml = $submitBtn.html();

            // Show spinner & "Please wait..." text and disable button
            $submitBtn
                .prop("disabled", true)
                .html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Please wait...');

            const registrationData = {
                ign: ($("#ign").val() || "").trim(),
                email: ($("#email").val() || "").trim(),
                discipline: $("#discipline").val() || "",
                discord: ($("#experience").val() || "").trim(),
                submittedAt: new Date().toISOString()
            };

            setTimeout(() => {
                const ticketId = "MCT-" + Math.floor(100000 + Math.random() * 900000);

                // Restore Submit button to normal state after simulated server call
                $submitBtn.prop("disabled", false).html(originalBtnHtml);

                SoundEngine.playSuccess();
                showToast("Form submitted successfully! Application queued.", "success", "🏆");

                $formCardBody.hide();
                $feedbackCard.fadeIn(300);

                $("#registrationSummary").html(`
                    <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                        <span class="text-info"><strong>Application ID:</strong> <code id="generatedTicketCode" class="copy-snippet-code">${ticketId}</code></span>
                        <button type="button" class="btn-copy-snippet" data-copy-target="#generatedTicketCode" aria-label="Copy Ticket ID">
                            <span class="copy-icon">📋</span> <span class="copy-text">Copy ID</span>
                            <span class="copy-tooltip">Copied to clipboard!</span>
                        </button>
                    </div>
                    <p class="mb-1"><strong>Username:</strong> ${registrationData.ign}</p>
                    <p class="mb-1"><strong>Discipline:</strong> ${registrationData.discipline}</p>
                    <p class="mb-0 text-success">Gladiator ${registrationData.ign} successfully registered for ${registrationData.discipline}!</p>
                `);
            }, 1400);
        });

        $("#registerAnotherBtn").on("click", function () {
            $regForm.find("input, select, textarea").val("").removeClass("is-invalid is-valid");
            $feedbackCard.hide();
            $formCardBody.fadeIn(250);
            goToStep(0);
            SoundEngine.playClick();
        });
    }
    initMultiStepRegistration();

    // ======================================================================
    // Custom FAQ Accordion
    // ======================================================================
    $(".faq-question").on("click", function () {
        const $question = $(this);
        const answerId = $question.attr("aria-controls");
        const $answer = $("#" + answerId);
        if (!$answer.length) return;

        const isOpen = $question.attr("aria-expanded") === "true";

        $(".faq-question").each(function () {
            const $other = $(this);
            const $otherAns = $("#" + $other.attr("aria-controls"));
            $other.removeClass("active").attr("aria-expanded", "false");
            $otherAns.removeClass("open").attr("aria-hidden", "true");
        });

        if (!isOpen) {
            $question.addClass("active").attr("aria-expanded", "true");
            $answer.addClass("open").attr("aria-hidden", "false");
        }
        SoundEngine.playClick();
    });

    // ======================================================================
    // Popup Subscription Form with Task 6 Loading Spinner & Task 7 Toast
    // ======================================================================
    const $subscribeOverlay = $("#subscribeOverlay");
    if ($subscribeOverlay.length) {
        const $openBtn = $("#openSubscribe");
        const $closeBtn = $("#closeSubscribe");
        const $subForm = $("#subscribeForm");
        const $emailInput = $("#subscribeEmail");
        const $errEl = $("#subscribeError");
        const $msgEl = $("#subscribeMessage");
        const $subSubmitBtn = $("#subscribeSubmitBtn");

        const openPopup = () => {
            $subscribeOverlay.addClass("active").attr("aria-hidden", "false");
            $emailInput.trigger("focus");
            SoundEngine.playClick();
        };

        const closePopup = () => {
            $subscribeOverlay.removeClass("active").attr("aria-hidden", "true");
            $openBtn.trigger("focus");
        };

        $openBtn.on("click", openPopup);
        $closeBtn.on("click", closePopup);

        $subscribeOverlay.on("click", function (e) {
            if (e.target === this) closePopup();
        });

        $(document).on("keydown", function (e) {
            if (e.key === "Escape" && $subscribeOverlay.hasClass("active")) {
                closePopup();
            }
        });

        $subForm.on("submit", function (e) {
            e.preventDefault();
            const email = ($emailInput.val() || "").trim();
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            $errEl.text("");
            $msgEl.text("");

            if (!emailPattern.test(email)) {
                $errEl.text("Please enter a valid email address.");
                $emailInput.trigger("focus");
                showToast("Please enter a valid email address.", "warning", "⚠️");
                return;
            }

            // Task 6: Loading spinner on Submit button
            const origText = $subSubmitBtn.html();
            $subSubmitBtn
                .prop("disabled", true)
                .html('<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Please wait...');

            setTimeout(() => {
                $subSubmitBtn.prop("disabled", false).html(origText);
                $msgEl.text("Thank you for subscribing to MCTiers League!");
                $subForm[0].reset();
                SoundEngine.playSuccess();
                showToast("Successfully subscribed to tournament alerts!", "success", "📬");
            }, 1200);
        });
    }

    // ======================================================================
    // Display Current Date & Time
    // ======================================================================
    function updateClock() {
        const $clockEl = $("#currentDateTime");
        if ($clockEl.length) {
            const now = new Date();
            $clockEl.text(
                now.toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                })
            );
        }
    }
    updateClock();
    setInterval(updateClock, 1000);
});