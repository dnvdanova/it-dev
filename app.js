// DOM Elements
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const categoriesGrid = document.getElementById('categories-grid');
const categoryCards = document.querySelectorAll('.category-card');
const articlesGrid = document.getElementById('articles-grid');
const articlesCount = document.getElementById('articles-count');
const articlesViewTitle = document.getElementById('articles-view-title');
const emptyState = document.getElementById('empty-state');

// Modal Elements
const articleModal = document.getElementById('article-modal');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalArticleTag = document.getElementById('modal-article-tag');
const modalArticleTitle = document.getElementById('modal-article-title');
const modalDesc = document.getElementById('modal-desc');
const modalSymptoms = document.getElementById('modal-symptoms');
const modalStepsContainer = document.getElementById('modal-steps-container');
const modalContactBtn = document.getElementById('modal-contact-btn');

// App State
let activeCategory = null;
let searchQuery = '';
let articles = [];

/**
 * Render articles based on active category filter and search query
 */
function renderArticles() {
  // Filter logic
  const filtered = articles.filter(article => {
    // 1. Category Filter
    const matchesCategory = !activeCategory || article.category === activeCategory;

    // 2. Search Query Filter
    const query = searchQuery.trim().toLowerCase();
    let matchesSearch = true;
    if (query) {
      const matchesTitle = article.title.toLowerCase().includes(query);
      const matchesDesc = article.description.toLowerCase().includes(query);
      const matchesSymptoms = article.symptoms.toLowerCase().includes(query);
      const matchesTags = article.tags.some(tag => tag.toLowerCase().includes(query));
      matchesSearch = matchesTitle || matchesDesc || matchesSymptoms || matchesTags;
    }

    return matchesCategory && matchesSearch;
  });

  // Clear Grid
  articlesGrid.innerHTML = '';

  // Handle Empty State
  if (filtered.length === 0) {
    emptyState.classList.add('active');
    articlesCount.textContent = '0 Artikel';
    return;
  } else {
    emptyState.classList.remove('active');
  }

  // Update Count Badge
  articlesCount.textContent = `${filtered.length} Artikel`;

  // Populate Grid
  filtered.forEach(article => {
    const card = document.createElement('article');
    card.className = 'article-card';
    card.setAttribute('id', `article-${article.id}`);
    card.setAttribute('tabindex', '0'); // Accessibility
    
    // Add hover sound or slight dynamic animation markers
    card.innerHTML = `
      <div class="article-meta">
        <span class="article-category-tag ${article.category}">${article.categoryDisplay}</span>
        <span class="article-read-time">${article.steps.length * 2} mnt baca</span>
      </div>
      <h3 class="article-card-title">${escapeHtml(article.title)}</h3>
      <p class="article-card-desc">${escapeHtml(article.description)}</p>
      <div class="article-card-footer">
        Baca Selengkapnya 
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </div>
    `;

    // Event Listeners for opening detail modal
    card.addEventListener('click', () => openArticleDetail(article.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openArticleDetail(article.id);
      }
    });

    articlesGrid.appendChild(card);
  });
}

/**
 * Open detail Modal view for a specific article
 * @param {number} articleId 
 */
function openArticleDetail(articleId) {
  const article = articles.find(a => a.id === articleId);
  if (!article) return;

  // 1. Populate Modal Info
  modalArticleTag.textContent = article.categoryDisplay;
  modalArticleTag.className = `article-category-tag ${article.category}`;
  modalArticleTitle.textContent = article.title;
  modalDesc.textContent = article.description;
  modalSymptoms.textContent = article.symptoms;

  // 2. Build Steps List
  modalStepsContainer.innerHTML = '';
  article.steps.forEach((step, index) => {
    const li = document.createElement('li');
    li.className = 'step-item';
    li.innerHTML = `
      <span class="step-number">${index + 1}</span>
      <span class="step-text">${escapeHtml(step)}</span>
    `;
    modalStepsContainer.appendChild(li);
  });

  // 3. Configure Contact IT support mailto link with pre-filled details
  const emailRecipient = 'support@perusahaan.co.id';
  const emailSubject = `[IT-Support] Kendala: ${article.title}`;
  const emailBody = `Halo Tim IT Support,

Saya mengalami kendala terkait topik ini.

Topik Troubleshooting: ${article.title}
Kategori: ${article.categoryDisplay}

Deskripsi Masalah:
${article.description}

Gejala yang Dialami:
${article.symptoms}

Mohon bantuannya untuk penanganan lebih lanjut. Terima kasih.`;

  modalContactBtn.setAttribute('href', `mailto:${emailRecipient}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`);

  // 4. Open Modal & Lock Body Scroll
  articleModal.classList.add('active');
  document.body.classList.add('modal-open');
}

/**
 * Close Detail Modal view
 */
function closeArticleDetail() {
  articleModal.classList.remove('active');
  document.body.classList.remove('modal-open');
}

/**
 * Event Handlers for Categories Filter
 */
categoryCards.forEach(card => {
  card.addEventListener('click', () => {
    const category = card.getAttribute('data-category');

    if (activeCategory === category) {
      // Toggle off if already active
      activeCategory = null;
      card.classList.remove('active');
      articlesViewTitle.textContent = 'Semua Panduan Troubleshooting';
    } else {
      // Set new active category
      activeCategory = category;
      categoryCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      
      const displayName = card.querySelector('.category-title').textContent;
      articlesViewTitle.textContent = `Kategori: ${displayName}`;
    }

    renderArticles();
  });
});

/**
 * Search Input Events
 */
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;

  if (searchQuery.trim().length > 0) {
    searchClearBtn.classList.add('active');
  } else {
    searchClearBtn.classList.remove('active');
  }

  renderArticles();
});

// Clear Search button
searchClearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  searchClearBtn.classList.remove('active');
  searchInput.focus();
  renderArticles();
});

// Close modal when clicking close button or clicking outside content box
modalCloseBtn.addEventListener('click', closeArticleDetail);
articleModal.addEventListener('click', (e) => {
  if (e.target === articleModal) {
    closeArticleDetail();
  }
});

// Keyboard Accessibility for Modal Close (Escape key)
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && articleModal.classList.contains('active')) {
    closeArticleDetail();
  }
});

/**
 * Helper function to escape HTML special characters
 * @param {string} unsafe 
 */
function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Initial Render + Sinkronisasi Data dari Backend API
document.addEventListener('DOMContentLoaded', () => {
  fetchArticlesFromServer();
});

/**
 * Mengambil data artikel dari Supabase
 */
async function fetchArticlesFromServer() {
  try {
    const { data, error } = await supabaseClient
      .from('articles')
      .select(`
        id,
        title,
        description,
        symptoms,
        categories ( slug, name ),
        article_steps ( step_text ),
        article_tags ( tag_name )
      `)
      .order('id', { ascending: true });

    if (error) throw error;
    
    // Transformasi data agar sesuai dengan struktur frontend yang ada
    const formattedData = data.map(article => ({
      id: article.id,
      title: article.title,
      category: article.categories.slug,
      categoryDisplay: article.categories.name,
      description: article.description,
      symptoms: article.symptoms,
      steps: article.article_steps.map(s => s.step_text),
      tags: article.article_tags.map(t => t.tag_name)
    }));

    articles = formattedData;
    renderArticles();
  } catch (error) {
    console.error('KB: Terjadi kesalahan saat memuat artikel dari Supabase:', error);
    // Fallback opsional jika API error
    if (typeof defaultArticles !== 'undefined') {
      articles = defaultArticles;
      renderArticles();
    }
  }
}

// ── Sinkronisasi Otomatis ────────────────────────────────────────────────────

/**
 * pageshow: Dipicu setiap kali halaman ditampilkan, termasuk bfcache.
 */
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    fetchArticlesFromServer();
  }
});

/**
 * visibilitychange: Dipicu saat pengguna berpindah kembali ke tab ini.
 */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    fetchArticlesFromServer();
  }
});
