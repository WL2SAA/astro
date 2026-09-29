/**
 * astro • Wallpaper Gallery Application
 * Clean, lightweight, zero-dependency modern JS
 */

(() => {
  'use strict';

  // --- State ---
  let wallpapers = [];
  let filteredWallpapers = [];
  let activeDevice = 'all';
  let activeCategory = 'all';
  let searchQuery = '';
  let currentModalIndex = -1;
  let isCompactGrid = false;

  // --- DOM Elements ---
  const wallpaperGrid = document.getElementById('wallpaperGrid');
  const emptyState = document.getElementById('emptyState');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const categoryChips = document.getElementById('categoryChips');
  const deviceTabs = document.querySelectorAll('.tab-btn');
  const resultsCount = document.getElementById('resultsCount');

  // Stats
  const totalCountEl = document.getElementById('totalCount');
  const desktopCountEl = document.getElementById('desktopCount');
  const phoneCountEl = document.getElementById('phoneCount');

  // View toggles
  const gridCompactBtn = document.getElementById('gridCompactBtn');
  const gridSpaciousBtn = document.getElementById('gridSpaciousBtn');

  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  const themes = ['mocha', 'oled', 'latte'];
  const themeIcons = { mocha: '🌙', oled: '🌑', latte: '☀️' };

  // Preview Modal Elements
  const previewModal = document.getElementById('previewModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalImage = document.getElementById('modalImage');
  const modalDeviceBadge = document.getElementById('modalDeviceBadge');
  const modalCategoryBadge = document.getElementById('modalCategoryBadge');
  const modalResolutionBadge = document.getElementById('modalResolutionBadge');
  const modalFilename = document.getElementById('modalFilename');
  const modalSize = document.getElementById('modalSize');
  const modalDownloadBtn = document.getElementById('modalDownloadBtn');
  const copyLinkBtn = document.getElementById('copyLinkBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  // Donate Modal Elements
  const donateModal = document.getElementById('donateModal');
  const openDonateBtn = document.getElementById('openDonateBtn');
  const footerDonateBtn = document.getElementById('footerDonateBtn');
  const closeDonateModalBtn = document.getElementById('closeDonateModalBtn');
  const copyUpiBtn = document.getElementById('copyUpiBtn');
  const upiIdText = document.getElementById('upiIdText');
  const toast = document.getElementById('toast');

  // --- Initialize App ---
  async function init() {
    loadTheme();
    setupEventListeners();
    await loadWallpapers();
    renderStats();
    renderCategoryChips();
    filterAndRender();
  }

  // --- Load Wallpapers Data ---
  async function loadWallpapers() {
    if (window.WALLPAPERS_DATA && Array.isArray(window.WALLPAPERS_DATA)) {
      wallpapers = window.WALLPAPERS_DATA;
      return;
    }
    try {
      const response = await fetch('wallpapers.json');
      if (response.ok) {
        wallpapers = await response.json();
      }
    } catch (e) {
      console.error('Failed to load wallpapers.json:', e);
    }
  }

  // --- Stats Display ---
  function renderStats() {
    const desktopTotal = wallpapers.filter(w => w.device === 'Desktop').length;
    const phoneTotal = wallpapers.filter(w => w.device === 'Phone').length;

    if (totalCountEl) totalCountEl.textContent = wallpapers.length;
    if (desktopCountEl) desktopCountEl.textContent = desktopTotal;
    if (phoneCountEl) phoneCountEl.textContent = phoneTotal;
  }

  // --- Category Chips ---
  function renderCategoryChips() {
    // Get unique categories for current device filter
    const availableWallpapers = activeDevice === 'all'
      ? wallpapers
      : wallpapers.filter(w => w.device === activeDevice);

    const categoriesMap = new Map();
    availableWallpapers.forEach(w => {
      categoriesMap.set(w.category, w.categoryDisplay);
    });

    const sortedCats = Array.from(categoriesMap.entries()).sort((a, b) => a[1].localeCompare(b[1]));

    let chipsHtml = `
      <button class="chip ${activeCategory === 'all' ? 'active' : ''}" data-category="all">
        All (${availableWallpapers.length})
      </button>
    `;

    sortedCats.forEach(([catSlug, catName]) => {
      const count = availableWallpapers.filter(w => w.category === catSlug).length;
      const isActive = activeCategory === catSlug ? 'active' : '';
      chipsHtml += `
        <button class="chip ${isActive}" data-category="${catSlug}">
          ${catName} (${count})
        </button>
      `;
    });

    categoryChips.innerHTML = chipsHtml;

    // Attach listeners
    categoryChips.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        activeCategory = chip.dataset.category;
        categoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        filterAndRender();
      });
    });
  }

  // --- Filtering & Rendering ---
  function filterAndRender() {
    filteredWallpapers = wallpapers.filter(w => {
      // Device filter
      if (activeDevice !== 'all' && w.device !== activeDevice) return false;

      // Category filter
      if (activeCategory !== 'all' && w.category !== activeCategory) return false;

      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = w.title.toLowerCase().includes(query);
        const matchesCategory = w.categoryDisplay.toLowerCase().includes(query);
        const matchesFilename = w.filename.toLowerCase().includes(query);
        const matchesDevice = w.device.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory && !matchesFilename && !matchesDevice) {
          return false;
        }
      }

      return true;
    });

    // Update results text
    if (resultsCount) {
      const total = wallpapers.length;
      resultsCount.textContent = `Showing ${filteredWallpapers.length} of ${total} wallpapers`;
    }

    // Render cards
    renderGrid(filteredWallpapers);
  }

  // --- Render Wallpaper Grid ---
  function renderGrid(items) {
    if (items.length === 0) {
      wallpaperGrid.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    wallpaperGrid.innerHTML = items.map((w, index) => {
      const isPhone = w.device === 'Phone';
      const aspectClass = isPhone ? 'phone-aspect' : '';
      const deviceIcon = isPhone ? '📱 Phone' : '🖥️ Desktop';

      return `
        <article class="wallpaper-card" data-index="${index}" tabindex="0" role="button" aria-label="View ${w.title}">
          <div class="card-media ${aspectClass}">
            <div class="card-badges">
              <span class="badge badge-device">${deviceIcon}</span>
              <span class="badge">${w.categoryDisplay}</span>
            </div>
            <img 
              src="${w.file}" 
              alt="${w.title}" 
              class="card-image"
              loading="lazy"
              decoding="async"
            >
            <span class="badge-res">${w.resolution}</span>
            <div class="card-overlay">
              <a 
                href="${w.file}" 
                download="${w.filename}" 
                class="card-action-btn" 
                title="Download full resolution"
                onclick="event.stopPropagation()"
              >
                <span>⬇️</span> Download
              </a>
            </div>
          </div>
          <div class="card-body">
            <h3 class="card-title">${w.title}</h3>
            <div class="card-meta">
              <span>${w.sizeFormatted}</span>
              <span>•</span>
              <span>${w.categoryDisplay}</span>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Attach card click handlers for modal
    wallpaperGrid.querySelectorAll('.wallpaper-card').forEach(card => {
      const clickHandler = () => {
        const index = parseInt(card.dataset.index, 10);
        openPreviewModal(index);
      };
      card.addEventListener('click', clickHandler);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          clickHandler();
        }
      });
    });
  }

  // --- Modal Preview Handling ---
  function openPreviewModal(index) {
    if (index < 0 || index >= filteredWallpapers.length) return;
    currentModalIndex = index;
    const w = filteredWallpapers[index];

    modalTitle.textContent = w.title;
    modalImage.src = w.file;
    modalImage.alt = w.title;
    modalDeviceBadge.textContent = w.device === 'Phone' ? '📱 Phone' : '🖥️ Desktop';
    modalCategoryBadge.textContent = w.categoryDisplay;
    modalResolutionBadge.textContent = `${w.width} × ${w.height} (${w.aspectRatio}:1)`;
    modalFilename.textContent = w.filename;
    modalSize.textContent = `💾 ${w.sizeFormatted}`;
    modalDownloadBtn.href = w.file;
    modalDownloadBtn.download = w.filename;

    if (!previewModal.open) {
      previewModal.showModal();
    }
  }

  function prevWallpaper() {
    if (filteredWallpapers.length === 0) return;
    let nextIdx = currentModalIndex - 1;
    if (nextIdx < 0) nextIdx = filteredWallpapers.length - 1;
    openPreviewModal(nextIdx);
  }

  function nextWallpaper() {
    if (filteredWallpapers.length === 0) return;
    let nextIdx = currentModalIndex + 1;
    if (nextIdx >= filteredWallpapers.length) nextIdx = 0;
    openPreviewModal(nextIdx);
  }

  // --- Theme Switching ---
  function loadTheme() {
    const savedTheme = localStorage.getItem('astro-theme') || 'mocha';
    setTheme(savedTheme);
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('astro-theme', theme);
    const icon = themeIcons[theme] || '🌙';
    if (themeToggle) {
      themeToggle.querySelector('.theme-icon').textContent = icon;
    }
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'mocha';
    const nextIdx = (themes.indexOf(current) + 1) % themes.length;
    setTheme(themes[nextIdx]);
    showToast(`Theme switched to ${themes[nextIdx].toUpperCase()}`);
  }

  // --- Toast Notification ---
  let toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Theme toggle
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    // Device tabs
    deviceTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        deviceTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        activeDevice = tab.dataset.device;
        activeCategory = 'all'; // reset category on device switch
        renderCategoryChips();
        filterAndRender();
      });
    });

    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (clearSearchBtn) {
          clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
        }
        filterAndRender();
      });
    }

    // Clear search
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        searchInput.focus();
        filterAndRender();
      });
    }

    // Reset filters
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => {
        activeDevice = 'all';
        activeCategory = 'all';
        searchQuery = '';
        if (searchInput) searchInput.value = '';
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
        deviceTabs.forEach(t => t.classList.toggle('active', t.dataset.device === 'all'));
        renderCategoryChips();
        filterAndRender();
      });
    }

    // View toggles
    if (gridCompactBtn && gridSpaciousBtn) {
      gridCompactBtn.addEventListener('click', () => {
        isCompactGrid = true;
        wallpaperGrid.classList.add('compact');
        gridCompactBtn.classList.add('active');
        gridSpaciousBtn.classList.remove('active');
      });
      gridSpaciousBtn.addEventListener('click', () => {
        isCompactGrid = false;
        wallpaperGrid.classList.remove('compact');
        gridSpaciousBtn.classList.add('active');
        gridCompactBtn.classList.remove('active');
      });
    }

    // Modal navigation
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); prevWallpaper(); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); nextWallpaper(); });
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => previewModal.close());

    // Light dismiss for preview modal
    if (previewModal) {
      previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) previewModal.close();
      });
    }

    // Copy image relative link
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', async () => {
        if (currentModalIndex >= 0 && currentModalIndex < filteredWallpapers.length) {
          const w = filteredWallpapers[currentModalIndex];
          try {
            await navigator.clipboard.writeText(w.file);
            showToast('Image path copied to clipboard!');
          } catch {
            showToast(w.file);
          }
        }
      });
    }

    // Donate Modal
    const openDonate = () => donateModal.showModal();
    if (openDonateBtn) openDonateBtn.addEventListener('click', openDonate);
    if (footerDonateBtn) footerDonateBtn.addEventListener('click', openDonate);
    if (closeDonateModalBtn) closeDonateModalBtn.addEventListener('click', () => donateModal.close());
    if (donateModal) {
      donateModal.addEventListener('click', (e) => {
        if (e.target === donateModal) donateModal.close();
      });
    }

    // Copy UPI ID
    if (copyUpiBtn && upiIdText) {
      copyUpiBtn.addEventListener('click', async () => {
        const upi = upiIdText.textContent.trim();
        try {
          await navigator.clipboard.writeText(upi);
          showToast(`UPI ID ${upi} copied!`);
        } catch {
          showToast(`UPI ID: ${upi}`);
        }
      });
    }

    // Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Focus search on '/'
      if (e.key === '/' && document.activeElement !== searchInput && !previewModal.open && !donateModal.open) {
        e.preventDefault();
        searchInput.focus();
        return;
      }

      // Modal navigation
      if (previewModal.open) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          prevWallpaper();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          nextWallpaper();
        }
      }
    });
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
