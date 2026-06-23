/**
 * BigQuery Release Notes Dashboard - Main JavaScript
 */

document.addEventListener("DOMContentLoaded", () => {
    // State Variables
    let allReleases = [];
    let filteredReleases = [];
    let selectedUpdate = null;
    let originalTweetText = "";
    
    // UI Elements - Timeline & Header
    const btnRefresh = document.getElementById("btn-refresh");
    const lastUpdatedTime = document.getElementById("last-updated-time");
    const loader = document.getElementById("loader");
    const errorContainer = document.getElementById("error-container");
    const errorMessage = document.getElementById("error-message");
    const btnRetry = document.getElementById("btn-retry");
    const emptyState = document.getElementById("empty-state");
    const timelineList = document.getElementById("timeline-list");
    const timelineSummary = document.getElementById("timeline-summary");
    
    // UI Elements - Sidebar Filters
    const searchInput = document.getElementById("search-input");
    const clearSearchBtn = document.getElementById("clear-search");
    const categoryFiltersContainer = document.getElementById("category-filters");
    
    // UI Elements - Stats Counters
    const statTotal = document.getElementById("stat-total");
    const statFeatures = document.getElementById("stat-features");
    const statIssues = document.getElementById("stat-issues");
    const statAnnouncements = document.getElementById("stat-announcements");
    
    // UI Elements - Composer Panel
    const composerPanel = document.getElementById("composer-panel");
    const composerEmptyState = document.getElementById("composer-empty-state");
    const composerActiveState = document.getElementById("composer-active-state");
    const selectedTypeBadge = document.getElementById("selected-type-badge");
    const selectedDate = document.getElementById("selected-date");
    const selectedContent = document.getElementById("selected-content");
    const selectedDocLink = document.getElementById("selected-doc-link");
    
    // UI Elements - Tweet Customizer
    const tweetTextarea = document.getElementById("tweet-textarea");
    const btnResetTweet = document.getElementById("btn-reset-tweet");
    const btnCopyTweet = document.getElementById("btn-copy-tweet");
    const btnPostTweet = document.getElementById("btn-post-tweet");
    const charCountDisplay = document.getElementById("char-count");
    const charProgressCircle = document.getElementById("char-progress-circle");
    const mockTweetText = document.getElementById("mock-tweet-text");
    
    // UI Elements - Toast
    const toast = document.getElementById("toast");
    const toastText = document.getElementById("toast-text");
    
    // SVG Circular Progress config
    const circleRadius = 12;
    const circleCircumference = 2 * Math.PI * circleRadius;
    if (charProgressCircle) {
        charProgressCircle.style.strokeDasharray = `${circleCircumference} ${circleCircumference}`;
        charProgressCircle.style.strokeDashoffset = circleCircumference;
    }

    // Current category filter state
    let activeCategory = "all";

    /* ==========================================================================
       DATA FETCHING
       ========================================================================== */
    async function fetchReleaseNotes() {
        // Update UI to Loading State
        btnRefresh.disabled = true;
        const spinnerIcon = btnRefresh.querySelector(".spinner-icon");
        spinnerIcon.classList.add("spinning");
        
        loader.style.display = "flex";
        errorContainer.style.display = "none";
        emptyState.style.display = "none";
        timelineList.style.display = "none";
        
        try {
            const response = await fetch("/api/releases");
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            allReleases = data;
            
            // Set timestamp
            const now = new Date();
            lastUpdatedTime.textContent = `Last checked: ${now.toLocaleTimeString()}`;
            
            // Calculate initial analytics
            calculateStats(allReleases);
            
            // Render
            applyFiltersAndRender();
            
        } catch (error) {
            console.error("Error fetching release notes:", error);
            errorMessage.textContent = error.message || "Failed to establish database feed connection.";
            errorContainer.style.display = "flex";
            loader.style.display = "none";
        } finally {
            btnRefresh.disabled = false;
            spinnerIcon.classList.remove("spinning");
        }
    }

    /* ==========================================================================
       ANALYTICS & STATS COUNTERS
       ========================================================================== */
    function calculateStats(releases) {
        let total = 0;
        let features = 0;
        let issues = 0;
        let announcements = 0;
        
        releases.forEach(group => {
            group.updates.forEach(update => {
                total++;
                const type = update.type.toLowerCase();
                if (type.includes("feature")) {
                    features++;
                } else if (type.includes("issue") || type.includes("deprecated")) {
                    issues++;
                } else if (type.includes("announce")) {
                    announcements++;
                }
            });
        });
        
        // Animated counting effect
        animateCount(statTotal, total);
        animateCount(statFeatures, features);
        animateCount(statIssues, issues);
        animateCount(statAnnouncements, announcements);
    }
    
    function animateCount(element, target) {
        const start = parseInt(element.textContent) || 0;
        const duration = 800; // ms
        const startTime = performance.now();
        
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function out-cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeProgress);
            
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target;
            }
        }
        
        requestAnimationFrame(update);
    }

    /* ==========================================================================
       FILTERING AND RENDERING
       ========================================================================== */
    function applyFiltersAndRender() {
        const searchQuery = searchInput.value.toLowerCase().trim();
        filteredReleases = [];
        
        let totalMatchingUpdates = 0;
        
        allReleases.forEach(group => {
            const matchingUpdates = group.updates.filter(update => {
                // Category filter
                const matchesCategory = activeCategory === "all" || update.type.toLowerCase() === activeCategory.toLowerCase();
                
                // Search query filter (matches type or content text)
                const plainText = stripHtml(update.content).toLowerCase();
                const matchesSearch = !searchQuery || 
                                      update.type.toLowerCase().includes(searchQuery) || 
                                      plainText.includes(searchQuery);
                                      
                return matchesCategory && matchesSearch;
            });
            
            if (matchingUpdates.length > 0) {
                totalMatchingUpdates += matchingUpdates.length;
                filteredReleases.push({
                    ...group,
                    updates: matchingUpdates
                });
            }
        });
        
        // Update summary text
        timelineSummary.textContent = `Showing ${totalMatchingUpdates} update${totalMatchingUpdates === 1 ? '' : 's'}`;
        
        // Hide loader
        loader.style.display = "none";
        
        // Empty state toggle
        if (totalMatchingUpdates === 0) {
            emptyState.style.display = "flex";
            timelineList.style.display = "none";
        } else {
            emptyState.style.display = "none";
            timelineList.style.display = "block";
            renderTimeline(filteredReleases);
        }
    }
    
    function renderTimeline(releases) {
        timelineList.innerHTML = "";
        
        releases.forEach(group => {
            // Create Date Group Container
            const dateGroup = document.createElement("div");
            dateGroup.className = "timeline-date-group";
            
            // Create Date Node
            const dateNode = document.createElement("div");
            dateNode.className = "timeline-date-node";
            dateGroup.appendChild(dateNode);
            
            // Create Date Header
            const dateHeader = document.createElement("div");
            dateHeader.className = "timeline-date-header";
            dateHeader.innerHTML = `<i class="fa-regular fa-calendar"></i> ${group.date}`;
            dateGroup.appendChild(dateHeader);
            
            // Create Updates Container
            const updatesContainer = document.createElement("div");
            updatesContainer.className = "timeline-updates-container";
            
            group.updates.forEach(update => {
                const card = document.createElement("div");
                const typeClass = update.type.toLowerCase();
                card.className = `release-card ${typeClass}-card`;
                
                // Determine if this card is currently selected
                if (selectedUpdate && 
                    selectedUpdate.date === group.date && 
                    selectedUpdate.type === update.type && 
                    selectedUpdate.content === update.content) {
                    card.classList.add("active");
                }
                
                // Badge category styling
                let badgeClass = "badge-general";
                if (["feature", "announcement", "issue", "deprecated", "fixed"].includes(typeClass)) {
                    badgeClass = `badge-${typeClass}`;
                }
                
                card.innerHTML = `
                    <div class="card-header-row">
                        <span class="type-badge ${badgeClass}">${update.type}</span>
                        <span class="selection-indicator"><i class="fa-solid fa-circle-check"></i></span>
                    </div>
                    <div class="release-html-content">
                        ${update.content}
                    </div>
                    <div class="card-footer-row">
                        <button class="btn-card-tweet">
                            <i class="fa-brands fa-x-twitter"></i>
                            <span>Customize Tweet</span>
                        </button>
                    </div>
                `;
                
                // Card click event (selects the update)
                card.addEventListener("click", (e) => {
                    // Avoid selecting if clicking inside standard anchor tags in future expansions, 
                    // though links are disabled inside timeline cards.
                    selectUpdate(group.date, group.link, update.type, update.content, card);
                });
                
                updatesContainer.appendChild(card);
            });
            
            dateGroup.appendChild(updatesContainer);
            timelineList.appendChild(dateGroup);
        });
    }

    /* ==========================================================================
       HTML TO PLAIN TEXT SANITIZER
       ========================================================================== */
    function stripHtml(html) {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        
        // Extract links so we can format them neatly if desired, 
        // but textContent strips tags directly.
        let text = tempDiv.textContent || tempDiv.innerText || "";
        
        // Clean up formatting
        text = text.replace(/\s+/g, ' ').trim();
        return text;
    }

    /* ==========================================================================
       COMPOSER SELECTION
       ========================================================================== */
    function selectUpdate(date, link, type, contentHtml, cardElement) {
        selectedUpdate = {
            date: date,
            link: link,
            type: type,
            content: contentHtml
        };
        
        // Remove active class from all other cards and add to current
        document.querySelectorAll(".release-card").forEach(c => c.classList.remove("active"));
        cardElement.classList.add("active");
        
        // Display active state on composer
        composerEmptyState.style.display = "none";
        composerActiveState.style.display = "flex";
        
        // Badge styles
        selectedTypeBadge.className = `type-badge badge-${type.toLowerCase()}`;
        selectedTypeBadge.textContent = type;
        selectedDate.textContent = date;
        selectedContent.innerHTML = contentHtml;
        selectedDocLink.href = link;
        
        // Open drawer on responsive layout
        if (window.innerWidth < 1200) {
            composerPanel.classList.add("open");
        }
        
        // Draft default Tweet
        generateDefaultTweetText(date, link, type, contentHtml);
    }
    
    function generateDefaultTweetText(date, link, type, contentHtml) {
        const plainText = stripHtml(contentHtml);
        
        // Pre-compile tags & metadata
        const header = `BigQuery Release (${type}) - ${date}:\n`;
        const footer = `\n\n#BigQuery #GoogleCloud`;
        const linkStr = `\n${link}`;
        
        // Max space left for body description (280 limit)
        // Note: Twitter counts links as 23 characters, but let's base it on strict string lengths 
        // for standard clipboard copy and intent encoding safety.
        const totalMetaLength = header.length + footer.length + linkStr.length;
        const availableBodyLength = 280 - totalMetaLength;
        
        let trimmedBody = plainText;
        if (plainText.length > availableBodyLength) {
            trimmedBody = plainText.substring(0, availableBodyLength - 3) + "...";
        }
        
        originalTweetText = `${header}${trimmedBody}${footer}${linkStr}`;
        
        // Load into textarea
        tweetTextarea.value = originalTweetText;
        updateTweetPreview();
    }

    /* ==========================================================================
       TWEET PREVIEW & CHARACTER COUNTER
       ========================================================================== */
    function updateTweetPreview() {
        const text = tweetTextarea.value;
        const length = text.length;
        const remaining = 280 - length;
        
        // Update character count display text
        charCountDisplay.textContent = remaining;
        
        // SVG Progress Ring calculations
        const percent = Math.min((length / 280) * 100, 100);
        const offset = circleCircumference - (percent / 100) * circleCircumference;
        
        if (charProgressCircle) {
            charProgressCircle.style.strokeDashoffset = offset;
            
            // Color code progress ring
            if (length > 280) {
                charProgressCircle.style.stroke = "var(--color-issue)";
                charCountDisplay.style.color = "var(--color-issue)";
                btnPostTweet.disabled = true;
                btnPostTweet.style.opacity = 0.5;
            } else if (length >= 260) {
                charProgressCircle.style.stroke = "var(--color-deprecated)";
                charCountDisplay.style.color = "var(--color-deprecated)";
                btnPostTweet.disabled = false;
                btnPostTweet.style.opacity = 1;
            } else {
                charProgressCircle.style.stroke = "var(--color-feature)";
                charCountDisplay.style.color = "var(--text-secondary)";
                btnPostTweet.disabled = false;
                btnPostTweet.style.opacity = 1;
            }
        }
        
        // Format mock preview text (Link and hashtag syntax coloring!)
        let formattedPreview = escapeHtml(text);
        
        // Colorize URL links
        formattedPreview = formattedPreview.replace(
            /(https?:\/\/[^\s]+)/g, 
            '<span style="color: var(--color-twitter);">$1</span>'
        );
        
        // Colorize Hashtags
        formattedPreview = formattedPreview.replace(
            /(#[a-zA-Z0-9_]+)/g, 
            '<span style="color: var(--color-twitter);">$1</span>'
        );
        
        mockTweetText.innerHTML = formattedPreview;
    }
    
    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* ==========================================================================
       CLIPBOARD AND SHARE EVENTS
       ========================================================================== */
    function showToast(text, isError = false) {
        toastText.textContent = text;
        toast.className = `toast-notification show ${isError ? 'error-toast' : ''}`;
        
        if (isError) {
            toast.style.backgroundColor = "var(--color-issue)";
        } else {
            toast.style.backgroundColor = "#10b981";
        }
        
        setTimeout(() => {
            toast.classList.remove("show");
        }, 2500);
    }
    
    function copyTweetToClipboard() {
        const text = tweetTextarea.value;
        if (!text) return;
        
        navigator.clipboard.writeText(text).then(() => {
            showToast("Tweet copied to clipboard!");
        }).catch(err => {
            console.error("Could not copy tweet text:", err);
            // Fallback for older browsers
            tweetTextarea.select();
            document.execCommand("copy");
            showToast("Tweet copied to clipboard!");
        });
    }
    
    function postOnTwitter() {
        const text = tweetTextarea.value;
        if (!text || text.length > 280) return;
        
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, "_blank");
    }

    /* ==========================================================================
       EVENT LISTENERS SETUP
       ========================================================================== */
    function setupEventListeners() {
        // Refresh Feed Button
        btnRefresh.addEventListener("click", fetchReleaseNotes);
        btnRetry.addEventListener("click", fetchReleaseNotes);
        
        // Search Input
        let searchTimeout;
        searchInput.addEventListener("input", () => {
            // Show/Hide clear button
            if (searchInput.value) {
                clearSearchBtn.style.display = "flex";
            } else {
                clearSearchBtn.style.display = "none";
            }
            
            // Debounce filtering to maintain UI smoothness
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                applyFiltersAndRender();
            }, 200);
        });
        
        // Clear Search Query
        clearSearchBtn.addEventListener("click", () => {
            searchInput.value = "";
            clearSearchBtn.style.display = "none";
            searchInput.focus();
            applyFiltersAndRender();
        });
        
        // Category Pill Filters
        categoryFiltersContainer.addEventListener("click", (e) => {
            const button = e.target.closest(".filter-pill");
            if (!button) return;
            
            // Change active pill
            categoryFiltersContainer.querySelectorAll(".filter-pill").forEach(btn => {
                btn.classList.remove("active");
            });
            button.classList.add("active");
            
            // Trigger filter update
            activeCategory = button.getAttribute("data-type");
            applyFiltersAndRender();
        });
        
        // Live Tweet composing textarea listener
        tweetTextarea.addEventListener("input", updateTweetPreview);
        
        // Reset composer text to default
        btnResetTweet.addEventListener("click", () => {
            if (selectedUpdate) {
                tweetTextarea.value = originalTweetText;
                updateTweetPreview();
                showToast("Tweet draft reset.");
            }
        });
        
        // Copy tweet to clipboard
        btnCopyTweet.addEventListener("click", copyTweetToClipboard);
        
        // Post on Twitter
        btnPostTweet.addEventListener("click", postOnTwitter);
        
        // Close responsive slide drawer if user clicks timeline background on narrow view
        document.addEventListener("click", (e) => {
            if (window.innerWidth < 1200 && composerPanel.classList.contains("open")) {
                // If click is outside the drawer panel and outside the cards that open it
                if (!composerPanel.contains(e.target) && 
                    !e.target.closest(".release-card") && 
                    !e.target.closest("#btn-refresh") && 
                    !e.target.closest(".sidebar-panel")) {
                    composerPanel.classList.remove("open");
                }
            }
        });
    }

    /* ==========================================================================
       INITIALIZATION
       ========================================================================== */
    setupEventListeners();
    fetchReleaseNotes();
});
