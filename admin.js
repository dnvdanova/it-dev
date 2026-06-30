// DOM Elements for Dashboard control
const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginErrorMsg = document.getElementById('login-error-msg');
const adminArticlesTbody = document.getElementById('admin-articles-tbody');
const jsonExportArea = document.getElementById('json-export-area');
const stepsBuilderContainer = document.getElementById('steps-builder-container');


/**
 * Fitur Custom Confirmation Modal (Pengganti alert konfirmasi bawaan)
 */
function confirmAction(message) {
  return new Promise((resolve) => {
    // Buat elemen overlay
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';

    // Buat isi modal
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';

    modal.innerHTML = `
      <div class="confirm-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <h3 class="confirm-title">Konfirmasi Hapus</h3>
      <p class="confirm-message">${escapeHtml(message)}</p>
      <div class="confirm-actions">
        <button class="btn-cancel-modal" id="confirm-no">Batal</button>
        <button class="btn-danger-modal" id="confirm-yes">Ya, Hapus</button>
      </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Animasi tampil
    setTimeout(() => {
      overlay.classList.add('show');
    }, 10);

    const close = (result) => {
      overlay.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 300);
    };

    modal.querySelector('#confirm-yes').onclick = () => close(true);
    modal.querySelector('#confirm-no').onclick = () => close(false);
  });
}

// Global Variables
let articles = []; // Data artikel dari server

// Edit State — null berarti mode Tambah Baru, angka berarti ID artikel yang sedang diedit
let editArticleId = null;

// Category display name mapping
const categoryDisplayMap = {
  'konektivitas': 'Konektivitas',
  'perangkat-keras': 'Perangkat Keras',
  'akun-akses': 'Akun & Akses',
  'software': 'Software'
};

// Session check on load
document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('admin_logged') === 'true') {
    showDashboard();
  } else {
    showLogin();
  }
});

/**
 * Handle Administrator Authentication
 */
function handleLogin(event) {
  event.preventDefault();
  const usernameInput = document.getElementById('username').value.trim();
  const passwordInput = document.getElementById('password').value.trim();

  if (usernameInput.toLowerCase() === 'it' && passwordInput.toLowerCase() === 'dev') {
    sessionStorage.setItem('admin_logged', 'true');
    loginErrorMsg.style.display = 'none';
    showDashboard();
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
  } else {
    loginErrorMsg.style.display = 'block';
  }
}

/**
 * Handle Administrator Logout
 */
function handleLogout() {
  sessionStorage.removeItem('admin_logged');
  showLogin();
}

function showLogin() {
  loginSection.style.display = 'flex';
  dashboardSection.style.display = 'none';
  document.body.classList.remove('admin-dashboard-active');
}

function showDashboard() {
  loginSection.style.display = 'none';
  dashboardSection.style.display = 'block';
  document.body.classList.add('admin-dashboard-active');
  fetchAdminArticles();
}

/**
 * Fetch articles dari Supabase
 */
async function fetchAdminArticles() {
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
    renderAdminArticles();
  } catch (error) {
    console.error('KB Admin: Gagal fetch data', error);
    showToast('Gagal terhubung ke database server.', 'error');
  }
}

/* ==========================================================================
   Dynamic Steps Builder
   ========================================================================== */

function addStepRow() {
  const rows = stepsBuilderContainer.querySelectorAll('.step-input-row');
  const nextIndex = rows.length;

  const row = document.createElement('div');
  row.className = 'step-input-row';
  row.setAttribute('data-index', nextIndex);
  row.innerHTML = `
    <span class="step-row-num">${nextIndex + 1}</span>
    <input type="text" class="form-input step-text-input" required placeholder="Langkah perbaikan berikutnya...">
    <button type="button" class="btn-icon-danger" onclick="removeStepRow(this)">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;
  stepsBuilderContainer.appendChild(row);
  updateStepNumbers();
}

function removeStepRow(button) {
  const row = button.closest('.step-input-row');
  row.remove();
  updateStepNumbers();
}

function updateStepNumbers() {
  const rows = stepsBuilderContainer.querySelectorAll('.step-input-row');
  rows.forEach((row, idx) => {
    row.setAttribute('data-index', idx);
    row.querySelector('.step-row-num').textContent = idx + 1;
    const deleteBtn = row.querySelector('.btn-icon-danger');
    if (rows.length === 1) {
      deleteBtn.setAttribute('disabled', 'true');
    } else {
      deleteBtn.removeAttribute('disabled');
    }
  });
}

/**
 * Reset the steps builder to a single empty row
 */
function resetStepsBuilder() {
  stepsBuilderContainer.innerHTML = `
    <div class="step-input-row" data-index="0">
      <span class="step-row-num">1</span>
      <input type="text" class="form-input step-text-input" required placeholder="Langkah pertama...">
      <button type="button" class="btn-icon-danger" onclick="removeStepRow(this)" disabled>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `;
}

/* ==========================================================================
   CRUD: Edit & Update Article
   ========================================================================== */

/**
 * Load article data into the form and switch to Edit Mode
 * @param {number} articleId
 */
function startEditArticle(articleId) {
  const article = articles.find(a => a.id === articleId);
  if (!article) return;

  // Set state
  editArticleId = articleId;

  // Scroll form into view smoothly
  document.getElementById('form-section-title').scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Update form header to edit mode
  const formTitle = document.getElementById('form-section-title');
  formTitle.innerHTML = `
    <span style="display:flex; align-items:center; gap:8px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      Edit Artikel
    </span>
    <span class="form-edit-badge">Mode Edit Aktif</span>
  `;

  // Fill form fields
  document.getElementById('art-title').value = article.title;
  document.getElementById('art-category').value = article.category;
  document.getElementById('art-description').value = article.description;
  document.getElementById('art-symptoms').value = article.symptoms;
  document.getElementById('art-tags').value = article.tags.join(', ');

  // Rebuild steps builder with article's steps
  stepsBuilderContainer.innerHTML = '';
  article.steps.forEach((step, idx) => {
    const row = document.createElement('div');
    row.className = 'step-input-row';
    row.setAttribute('data-index', idx);
    row.innerHTML = `
      <span class="step-row-num">${idx + 1}</span>
      <input type="text" class="form-input step-text-input" required value="${escapeHtml(step)}">
      <button type="button" class="btn-icon-danger" onclick="removeStepRow(this)" ${article.steps.length === 1 ? 'disabled' : ''}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
    stepsBuilderContainer.appendChild(row);
  });

  // Update submit button text and icon
  const submitBtn = document.getElementById('btn-submit-article');
  submitBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
    Perbarui Artikel
  `;
  submitBtn.style.backgroundColor = '#10b981'; // Hijau untuk tombol Update

  // Show Cancel button
  document.getElementById('btn-cancel-edit').style.display = 'flex';
}

/**
 * Cancel edit mode — reset form and switch back to Add New mode
 */
function cancelEdit() {
  editArticleId = null;

  // Reset form title
  document.getElementById('form-section-title').textContent = 'Tambah / Buat Artikel Baru';

  // Reset form inputs
  document.getElementById('article-form').reset();

  // Reset steps builder
  resetStepsBuilder();

  // Restore submit button
  const submitBtn = document.getElementById('btn-submit-article');
  submitBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
    Simpan Artikel Baru
  `;
  submitBtn.style.backgroundColor = ''; // Kembali ke warna biru default CSS

  // Hide Cancel button
  document.getElementById('btn-cancel-edit').style.display = 'none';
}

/* ==========================================================================
   CRUD: Create & Update (Form Submit Handler)
   ========================================================================== */

async function saveArticle(event) {
  event.preventDefault();

  const title = document.getElementById('art-title').value.trim();
  const categorySlug = document.getElementById('art-category').value;
  const description = document.getElementById('art-description').value.trim();
  const symptoms = document.getElementById('art-symptoms').value.trim();

  const stepInputs = stepsBuilderContainer.querySelectorAll('.step-text-input');
  const steps = Array.from(stepInputs).map(input => input.value.trim()).filter(val => val !== '');

  const tagsInput = document.getElementById('art-tags').value.trim();
  const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag !== '') : [];

  const submitBtn = document.getElementById('btn-submit-article');
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.7';

  try {
    // Get category ID
    const { data: catData, error: catError } = await supabaseClient
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    if (catError) throw new Error('Kategori tidak valid');

    const category_id = catData.id;
    let currentArticleId = editArticleId;

    if (editArticleId !== null) {
      // ── UPDATE MODE ─────────────────────────────────────────────────────────
      const { error: updateError } = await supabaseClient
        .from('articles')
        .update({ category_id, title, description, symptoms })
        .eq('id', editArticleId);
      if (updateError) throw updateError;

      // Delete old steps and tags
      await supabaseClient.from('article_steps').delete().eq('article_id', editArticleId);
      await supabaseClient.from('article_tags').delete().eq('article_id', editArticleId);

      showToast('Artikel berhasil diperbarui!', 'success');
    } else {
      // ── CREATE MODE ──────────────────────────────────────────────────────────
      const { data: newArticle, error: createError } = await supabaseClient
        .from('articles')
        .insert([{ category_id, title, description, symptoms }])
        .select()
        .single();
      if (createError) throw createError;

      currentArticleId = newArticle.id;
      showToast('Artikel berhasil ditambahkan! Artikel ini sekarang aktif di Halaman Utama.', 'success');
    }

    // Insert steps
    if (steps.length > 0) {
      const stepInserts = steps.map((step, index) => ({
        article_id: currentArticleId,
        step_order: index + 1,
        step_text: step
      }));
      const { error: stepsError } = await supabaseClient.from('article_steps').insert(stepInserts);
      if (stepsError) throw stepsError;
    }

    // Insert tags
    if (tags.length > 0) {
      const tagInserts = tags.map(tag => ({
        article_id: currentArticleId,
        tag_name: tag
      }));
      const { error: tagsError } = await supabaseClient.from('article_tags').insert(tagInserts);
      if (tagsError) throw tagsError;
    }

    if (editArticleId !== null) {
      cancelEdit();
    } else {
      document.getElementById('article-form').reset();
      resetStepsBuilder();
    }

    await fetchAdminArticles();

  } catch (error) {
    showToast('Terjadi kesalahan: ' + error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
  }
}

/* ==========================================================================
   CRUD: Delete Article
   ========================================================================== */

async function deleteArticle(articleId) {
  const target = articles.find(a => a.id === articleId);
  if (!target) return;

  const isConfirmed = await confirmAction(`Apakah Anda yakin ingin menghapus artikel:\n"${target.title}"?`);
  if (!isConfirmed) return;

  if (editArticleId === articleId) {
    cancelEdit();
  }

  try {
    const { error } = await supabaseClient.from('articles').delete().eq('id', articleId);
    if (error) throw error;

    await fetchAdminArticles();
    showToast('Artikel berhasil dihapus.', 'success');
  } catch (error) {
    showToast('Terjadi kesalahan: ' + error.message, 'error');
  }
}

/* ==========================================================================
   Render Articles Table
   ========================================================================== */

function renderAdminArticles() {
  adminArticlesTbody.innerHTML = '';

  articles.forEach(article => {
    const isBeingEdited = editArticleId === article.id;
    const tr = document.createElement('tr');
    if (isBeingEdited) {
      tr.style.background = '#eff6ff'; // Highlight baris yang sedang diedit
    }
    tr.innerHTML = `
      <td>
        <div class="admin-table-title">${escapeHtml(article.title)}</div>
        <div class="admin-table-desc">${escapeHtml(article.description)}</div>
        <span class="article-category-tag ${article.category}" style="margin-top: 6px; display: inline-block;">${article.categoryDisplay}</span>
      </td>
      <td style="text-align: center; white-space: nowrap;">
        <div style="display: flex; flex-direction: column; gap: 6px; align-items: center;">
          <button class="btn-edit ${isBeingEdited ? 'btn-edit-active' : ''}"
                  onclick="startEditArticle(${article.id})"
                  ${isBeingEdited ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            ${isBeingEdited ? 'Diedit...' : 'Edit'}
          </button>
          <button class="btn-delete" onclick="deleteArticle(${article.id})">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            Hapus
          </button>
        </div>
      </td>
    `;
    adminArticlesTbody.appendChild(tr);
  });
}

/* ==========================================================================
   JSON Export: Copy to Clipboard
   ========================================================================== */

function copyJsonData() {
  jsonExportArea.select();
  jsonExportArea.setSelectionRange(0, 99999);

  navigator.clipboard.writeText(jsonExportArea.value)
    .then(() => {
      const copyBtn = document.querySelector('.btn-copy');
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Data JSON Disalin!
      `;
      copyBtn.style.backgroundColor = '#059669';
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
        copyBtn.style.backgroundColor = '';
      }, 2000);
    })
    .catch(() => {
      showToast('Gagal menyalin data. Silakan salin secara manual.', 'error');
    });
}

/* ==========================================================================
   Helper: Escape HTML
   ========================================================================== */

function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ==========================================================================
   TICKETS & DASHBOARD LOGIC
   ========================================================================== */

let tickets = []; // Menyimpan data tiket dari server

/**
 * Handle perpindahan Tab
 */
function switchTab(tabName) {
  const tabArticlesBtn = document.getElementById('tab-articles');
  const tabTicketsBtn = document.getElementById('tab-tickets');
  const tabReceiptsBtn = document.getElementById('tab-receipts');
  const viewArticles = document.getElementById('view-articles');
  const viewTickets = document.getElementById('view-tickets');
  const viewReceipts = document.getElementById('view-receipts');

  // Reset active state
  tabArticlesBtn.classList.remove('active');
  tabTicketsBtn.classList.remove('active');
  tabReceiptsBtn.classList.remove('active');
  viewArticles.style.display = 'none';
  viewTickets.style.display = 'none';
  viewReceipts.style.display = 'none';

  if (tabName === 'articles') {
    tabArticlesBtn.classList.add('active');
    viewArticles.style.display = 'grid';
  } else if (tabName === 'tickets') {
    tabTicketsBtn.classList.add('active');
    viewTickets.style.display = 'block';
    fetchDashboardStats();
    fetchTickets();
    initRecapYearSelector();
    fetchMonthlyRecap();
  } else if (tabName === 'receipts') {
    tabReceiptsBtn.classList.add('active');
    viewReceipts.style.display = 'block';
    fetchTickets();
    fetchReceipts();
    initReceiptForm();
  }
}

/**
 * Update showDashboard untuk menampilkan tab yang sedang aktif
 */
const originalShowDashboard = showDashboard;
showDashboard = function () {
  originalShowDashboard();

  const tabTicketsBtn = document.getElementById('tab-tickets');
  const tabReceiptsBtn = document.getElementById('tab-receipts');
  
  if (tabTicketsBtn && tabTicketsBtn.classList.contains('active')) {
    fetchDashboardStats();
    fetchTickets();
    initRecapYearSelector();
    fetchMonthlyRecap();
  } else if (tabReceiptsBtn && tabReceiptsBtn.classList.contains('active')) {
    fetchTickets();
    fetchReceipts();
    initReceiptForm();
  }
};

/**
 * Mengambil Statistik Dashboard
 */
async function fetchDashboardStats() {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { count: ticketsIn, error: errIn } = await supabaseClient
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${currentMonth}-01`);

    const { count: ticketsOut, error: errOut } = await supabaseClient
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Selesai')
      .gte('completed_at', `${currentMonth}-01`);

    const { count: ticketsProcess, error: errProcess } = await supabaseClient
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Proses');

    const { count: ticketsCanceled, error: errCanceled } = await supabaseClient
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Batal');

    document.getElementById('stat-month-label').textContent = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    document.getElementById('stat-tickets-in').textContent = ticketsIn || 0;
    document.getElementById('stat-tickets-out').textContent = ticketsOut || 0;
    document.getElementById('stat-tickets-process').textContent = ticketsProcess || 0;
    document.getElementById('stat-tickets-canceled').textContent = ticketsCanceled || 0;
  } catch (err) {
    console.error("Gagal mengambil statistik dashboard.");
  }
}

/**
 * Mengambil Daftar Tiket dari server
 */
async function fetchTickets() {
  try {
    const { data, error } = await supabaseClient
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    tickets = data;
    renderTickets();
  } catch (err) {
    console.error("Gagal mengambil daftar tiket.");
  }
}

/**
 * Render Tabel Tiket ke layar
 * @param {Array} list - Daftar tiket yang akan ditampilkan (default: semua tiket)
 */
function renderTickets(list) {
  const dataToShow = list || tickets;
  const tbody = document.getElementById('admin-tickets-tbody');
  tbody.innerHTML = '';

  if (dataToShow.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 24px;">Tidak ada tiket yang ditemukan.</td></tr>`;
    return;
  }

  dataToShow.forEach(ticket => {
    const tr = document.createElement('tr');

    // Tentukan kelas badge berdasarkan status
    let badgeClass = '';
    if (ticket.status === 'Masuk') badgeClass = 'badge-masuk';
    else if (ticket.status === 'Proses') badgeClass = 'badge-proses';
    else if (ticket.status === 'Selesai') badgeClass = 'badge-selesai';
    else badgeClass = 'badge-batal';

    // Format tanggal
    const dateObj = new Date(ticket.created_at);
    const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

    // Format ID Tiket
    const ticketIdFormatted = 'TX.' + String(ticket.id).padStart(3, '0');

    tr.innerHTML = `
      <td>
        <div class="admin-table-title" style="display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
          <span class="ticket-id-badge">${ticketIdFormatted}</span>
          ${escapeHtml(ticket.customer_name)} 
          <span style="font-size: 0.8rem; font-weight: 400; color: #64748b;">(${escapeHtml(ticket.phone_number)})</span>
        </div>
        <div class="ticket-meta">
          <strong>Pkt:</strong> ${escapeHtml(ticket.device_info)} <br>
          <strong>Klh:</strong> ${escapeHtml(ticket.issue)}
        </div>
        <div class="ticket-meta" style="color: #94a3b8; font-size: 0.75rem; margin-top: 6px;">
          📅 ${dateStr}
        </div>
      </td>
      <td style="text-align: center; vertical-align: top; padding-top: 20px;">
        <span class="badge-status ${badgeClass}">${ticket.status}</span>
      </td>
      <td style="text-align: center; vertical-align: top; padding-top: 14px;">
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <!-- Pilih Status -->
          <select class="form-input" style="height: 32px; font-size: 0.8rem; padding: 0 8px; cursor: pointer;" onchange="updateTicketStatus(${ticket.id}, this.value)">
            <option value="Masuk" ${ticket.status === 'Masuk' ? 'selected' : ''}>Masuk</option>
            <option value="Proses" ${ticket.status === 'Proses' ? 'selected' : ''}>Proses</option>
            <option value="Selesai" ${ticket.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
            <option value="Batal" ${ticket.status === 'Batal' ? 'selected' : ''}>Batal</option>
          </select>
          
          <div style="display: flex; gap: 6px; justify-content: center;">
            <button onclick="printTicket(${ticket.id})" title="Cetak Tanda Terima" class="btn-edit" style="width: auto; padding: 4px 8px; color: #4f46e5; border-color: #c7d2fe;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            </button>
            <button onclick="deleteTicket(${ticket.id})" title="Hapus Tiket" class="btn-delete" style="padding: 4px 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * Filter tiket berdasarkan input pencarian (nomor tiket atau nama pelanggan)
 */
function filterTickets() {
  const input = document.getElementById('ticket-search-input');
  if (!input) return;
  
  const query = input.value.trim().toLowerCase();
  
  if (query === '') {
    renderTickets(tickets);
    return;
  }
  
  const filtered = tickets.filter(ticket => {
    const ticketId = 'TX.' + String(ticket.id).padStart(3, '0');
    const name = (ticket.customer_name || '').toLowerCase();
    return ticketId.toLowerCase().includes(query) || name.includes(query);
  });
  
  renderTickets(filtered);
}

/**
 * Menyimpan Tiket Baru ke Server
 */
async function saveTicket(event) {
  event.preventDefault();

  const data = {
    customer_name: document.getElementById('ticket-customer').value.trim(),
    phone_number: document.getElementById('ticket-phone').value.trim(),
    device_info: document.getElementById('ticket-device').value.trim(),
    issue: document.getElementById('ticket-issue').value.trim(),
    status: 'Masuk'
  };

  const shouldPrint = document.getElementById('print-on-save').checked;

  try {
    const { data: newTicket, error } = await supabaseClient
      .from('tickets')
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    // Reset Form
    document.getElementById('ticket-form').reset();

    // Refresh Data
    fetchDashboardStats();
    fetchTickets();

    // Otomatis cetak tanda terima jika checkbox dicentang
    if (shouldPrint) {
      // Tunggu sebentar agar render UI selesai sebelum ngeprint
      setTimeout(() => {
        printTicket(newTicket.id, newTicket);
        showToast("Tiket perbaikan berhasil disimpan!", "success");
      }, 300);
    } else {
      showToast("Tiket berhasil disimpan!", "success");
    }

  } catch (err) {
    showToast("Gagal menyimpan tiket perbaikan.", "error");
  }
}

/**
 * Update Status Tiket
 */
async function updateTicketStatus(id, newStatus) {
  try {
    const updateData = { status: newStatus };
    if (newStatus === 'Selesai') {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }

    const { error } = await supabaseClient
      .from('tickets')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    // Refresh
    fetchDashboardStats();
    fetchTickets();
    fetchMonthlyRecap();
    showToast("Status tiket berhasil diperbarui!", "success");
  } catch (err) {
    showToast("Gagal mengupdate status tiket.", "error");
  }
}

/**
 * Hapus Tiket
 */
async function deleteTicket(id) {
  const isConfirmed = await confirmAction('Apakah Anda yakin ingin menghapus tiket ini? Tindakan ini tidak bisa dibatalkan.');
  if (!isConfirmed) return;

  try {
    const { error } = await supabaseClient
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) throw error;

    fetchDashboardStats();
    fetchTickets();
    fetchMonthlyRecap();
    showToast("Tiket berhasil dihapus.", "success");
  } catch (err) {
    showToast("Gagal menghapus tiket.", "error");
  }
}

/**
 * Fitur Cetak (Print) Tanda Terima Tiket
 */
function printTicket(id, ticketData = null) {
  // Jika ticketData tidak dikirim (dipanggil dari tombol list), cari dari array
  if (!ticketData) {
    ticketData = tickets.find(t => t.id == id);
    if (!ticketData) {
      showToast("Data tiket tidak ditemukan.", "error");
      return;
    }
  }

  // Set nilai ke elemen khusus cetak
  document.getElementById('print-ticket-id').textContent = 'TX.' + String(id).padStart(3, '0');

  const dateObj = ticketData.created_at ? new Date(ticketData.created_at) : new Date();
  document.getElementById('print-ticket-date').textContent = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  document.getElementById('print-ticket-customer').textContent = ticketData.customer_name;
  document.getElementById('print-ticket-phone').textContent = ticketData.phone_number || '-';
  document.getElementById('print-ticket-device').textContent = ticketData.device_info;
  document.getElementById('print-ticket-issue').textContent = ticketData.issue;

  // Set display block to allow printing
  const receiptContainer = document.getElementById('print-receipt-container');
  receiptContainer.style.display = 'block';
  
  // Restore display after print dialog closes
  window.onafterprint = () => {
    receiptContainer.style.display = 'none';
  };
  
  // Call browser print
  window.print();
}

/* ==========================================================================
   UI UTILITIES (TOAST NOTIFICATIONS)
   ========================================================================== */

function showToast(message, type = 'success') {
  // Buat container toast jika belum ada
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconSvg = type === 'success'
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  toast.innerHTML = `
    <div class="toast-icon">${iconSvg}</div>
    <div class="toast-message">${escapeHtml(message)}</div>
  `;

  container.appendChild(toast);

  // Trigger animasi masuk
  setTimeout(() => toast.classList.add('show'), 10);

  // Hilangkan otomatis setelah 3.5 detik
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400); // Tunggu animasi CSS selesai baru hapus node
  }, 3500);
}

/* ==========================================================================
   MONTHLY RECAP DASHBOARD - Perbaikan Selesai
   ========================================================================== */

/**
 * Inisialisasi dropdown tahun pada rekapitulasi bulanan
 */
function initRecapYearSelector() {
  const yearSelect = document.getElementById('recap-year-select');
  if (!yearSelect) return;

  const currentYear = new Date().getFullYear();
  const startYear = 2020; // Tahun awal yang ditampilkan
  
  yearSelect.innerHTML = '';
  
  for (let year = currentYear; year >= startYear; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = `Tahun ${year}`;
    yearSelect.appendChild(option);
  }
  
  // Set default ke tahun sekarang
  yearSelect.value = currentYear;
}

/**
 * Format decimal days menjadi string "X hari Y jam"
 * @param {number} daysDecimal - Jumlah hari dalam desimal (misal 2.3)
 * @returns {string} Format "X hari Y jam" atau "Y jam" jika kurang dari 1 hari
 */
function formatDaysHours(daysDecimal) {
  if (daysDecimal <= 0) return '-';
  const days = Math.floor(daysDecimal);
  const hours = Math.round((daysDecimal - days) * 24);
  
  if (days === 0 && hours === 0) return 'Kurang dari 1 jam';
  if (days === 0) return `${hours} jam`;
  if (hours === 0) return `${days} hari`;
  return `${days} hari ${hours} jam`;
}

/**
 * Mengambil data tiket dan menghitung statistik bulanan (total tiket masuk per bulan)
 * Selalu menampilkan grafik Jan-Des, meskipun data kosong
 */
async function fetchMonthlyRecap() {
  const yearSelect = document.getElementById('recap-year-select');
  if (!yearSelect) return;
  
  const selectedYear = parseInt(yearSelect.value);
  const summaryContainer = document.getElementById('recap-yearly-summary');
  const chartContainer = document.getElementById('recap-chart-container');
  
  // Loading state
  summaryContainer.innerHTML = `
    <div class="recap-summary-item"><div class="summary-value">Memuat...</div></div>
  `;
  chartContainer.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:40px;">Memuat diagram...</div>`;
  
  try {
    const startDate = `${selectedYear}-01-01`;
    const endDate = `${selectedYear}-12-31`;
    
    let allTickets = [];
    let errAll = null;
    
    // Coba ambil dari Supabase
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      const result = await supabaseClient
        .from('tickets')
        .select('id, created_at, completed_at, status')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: true });
      allTickets = result.data || [];
      errAll = result.error;
    } else {
      errAll = new Error('Supabase client tidak tersedia');
    }
    
    if (errAll) throw errAll;
    
    const monthlyTotal = Array(12).fill(0);
    const monthlySelesai = Array(12).fill(0);
    const monthlyTotalDays = Array(12).fill(0);
    
    allTickets.forEach(ticket => {
      const createdDate = new Date(ticket.created_at);
      if (createdDate.getFullYear() === selectedYear) {
        const month = createdDate.getMonth();
        monthlyTotal[month]++;
        
        if (ticket.status === 'Selesai' && ticket.completed_at) {
          const completedDate = new Date(ticket.completed_at);
          monthlySelesai[month]++;
          const diffMs = completedDate - createdDate;
          const diffDays = diffMs / (1000 * 60 * 60 * 24);
          monthlyTotalDays[month] += diffDays;
        }
      }
    });
    
    const totalYear = monthlyTotal.reduce((s, c) => s + c, 0);
    const totalSelesaiYear = monthlySelesai.reduce((s, c) => s + c, 0);
    const totalDaysYear = monthlyTotalDays.reduce((s, d) => s + d, 0);
    const avgDaysYear = totalSelesaiYear > 0 ? (totalDaysYear / totalSelesaiYear) : 0;
    
    // Render summary
    summaryContainer.innerHTML = `
      <div class="recap-summary-item">
        <div class="summary-icon" style="background:#e0f2fe;color:#0284c7;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </div>
        <div>
          <span class="summary-label">Total Tiket Masuk ${selectedYear}</span>
          <span class="summary-value">${totalYear} tiket</span>
        </div>
      </div>
      <div class="recap-summary-item">
        <div class="summary-icon" style="background:#dcfce7;color:#16a34a;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div>
          <span class="summary-label">Selesai ${selectedYear}</span>
          <span class="summary-value">${totalSelesaiYear} perbaikan</span>
        </div>
      </div>
      <div class="recap-summary-item">
        <div class="summary-icon" style="background:#fef3c7;color:#d97706;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div>
          <span class="summary-label">Rata-rata Lama Pengerjaan</span>
          <span class="summary-value">${formatDaysHours(avgDaysYear)}</span>
        </div>
      </div>
    `;
    
    renderRecapChart(chartContainer, monthlyTotal, monthlySelesai);
    
  } catch (err) {
    console.error('Gagal memuat rekapitulasi bulanan:', err);
    summaryContainer.innerHTML = `
      <div class="recap-summary-item" style="border-left:3px solid #ef4444;">
        <div>
          <span class="summary-label" style="color:#ef4444;">Gagal memuat data</span>
          <span class="summary-value" style="font-size:0.8rem;">${escapeHtml(err.message || 'Terjadi kesalahan')}</span>
        </div>
      </div>
    `;
    // Tampilkan grafik kosong tetap
    renderRecapChart(chartContainer, Array(12).fill(0), Array(12).fill(0));
  }
}

/**
 * Render grafik batang rekapitulasi bulanan (selalu tampil Jan-Des)
 */
function renderRecapChart(container, monthlyTotal, monthlySelesai) {
  const shortNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  const maxCount = Math.max(...monthlyTotal, 1);
  const chartH = 160;
  
  let html = `<div class="recap-chart">`;
  monthlyTotal.forEach((count, i) => {
    const h = count > 0 ? (count / maxCount) * chartH : 0;
    html += `
      <div class="recap-chart-bar-wrapper">
        ${count > 0
          ? `<div class="recap-chart-bar" style="height:${h}px;" title="${shortNames[i]}: ${count} tiket masuk, ${monthlySelesai[i]} selesai">
               <span class="recap-chart-bar-value">${count}</span>
             </div>`
          : `<div class="recap-chart-bar-empty"></div>`
        }
        <span class="recap-chart-bar-label">${shortNames[i]}</span>
      </div>`;
  });
  html += `</div>
    <div class="recap-chart-legend">
      <div class="recap-chart-legend-item"><span class="recap-chart-legend-dot"></span><span>Total tiket masuk per bulan</span></div>
    </div>`;
  container.innerHTML = html;
}

/* ============================================================
   KWITANSI / PAYMENT RECEIPT FUNCTIONS
   ============================================================ */

let receipts = [];
let receiptTicketsCache = [];

/**
 * Konversi angka ke terbilang bahasa Indonesia untuk Rupiah
 */
function numberToWordsRupiah(num) {
  if (num === 0 || num === '0') return 'Nol Rupiah';
  const number = parseInt(num, 10);
  if (isNaN(number)) return '';

  const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'];
  const teens = ['Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];
  const tens = ['', 'Sepuluh', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh', 'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];
  const thousands = ['', 'Ribu', 'Juta', 'Miliar', 'Triliun'];

  function convertThreeDigits(n) {
    let result = '';
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    const ten = Math.floor(remainder / 10);
    const unit = remainder % 10;

    if (hundred === 1) {
      result += 'Seratus ';
    } else if (hundred > 1) {
      result += units[hundred] + ' Ratus ';
    }

    if (remainder > 0) {
      if (remainder < 10) {
        result += units[unit];
      } else if (remainder >= 10 && remainder < 20) {
        result += teens[unit];
      } else {
        result += tens[ten];
        if (unit > 0) result += ' ' + units[unit];
      }
    }

    return result.trim();
  }

  if (number === 0) return 'Nol Rupiah';

  let temp = number;
  let chunkIndex = 0;
  let words = '';

  while (temp > 0) {
    const chunk = temp % 1000;
    temp = Math.floor(temp / 1000);

    if (chunk > 0) {
      let chunkWords = convertThreeDigits(chunk);
      if (chunkIndex === 1 && chunk === 1) {
        chunkWords = 'Seribu';
      } else if (chunkIndex > 0) {
        chunkWords += ' ' + thousands[chunkIndex];
      }
      words = chunkWords + (words ? ' ' + words : '');
    }
    chunkIndex++;
  }

  return words.trim() + ' Rupiah';
}

/**
 * Format angka ke Rupiah
 */
function formatRupiah(num) {
  const number = parseInt(num, 10) || 0;
  return 'Rp ' + number.toLocaleString('id-ID') + ',-';
}

/**
 * Format tanggal ke Indonesia: 30 Juni 2026
 */
function formatDateIndonesian(dateStr) {
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format tanggal ISO untuk input date
 */
function toISODateInput(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Generate nomor kwitansi KW-YYYY-NNNN
 */
async function generateReceiptNumber() {
  const year = new Date().getFullYear();
  let nextNumber = 1;

  try {
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('receipts')
        .select('receipt_number')
        .ilike('receipt_number', `KW-${year}-%`)
        .order('receipt_number', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        const last = data[0].receipt_number;
        const match = last.match(/KW-\d{4}-(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }
    }
  } catch (e) {
    console.error('Gagal generate nomor kwitansi:', e);
  }

  return `KW-${year}-${String(nextNumber).padStart(4, '0')}`;
}

/**
 * Inisialisasi form kwitansi: tanggal hari ini & nomor otomatis
 */
async function initReceiptForm() {
  const dateInput = document.getElementById('receipt-date');
  const numberInput = document.getElementById('receipt-number');

  if (dateInput && !dateInput.value) {
    dateInput.value = toISODateInput(new Date());
  }

  if (numberInput && !numberInput.value) {
    numberInput.value = await generateReceiptNumber();
  }

  await loadReceiptTicketOptions();
}

/**
 * Muat pilihan tiket selesai ke dropdown kwitansi
 */
async function loadReceiptTicketOptions() {
  const select = document.getElementById('receipt-ticket-select');
  if (!select) return;

  // Simpan pilihan yang sedang aktif (jika sedang edit)
  const currentValue = select.value;

  try {
    let allTickets = [];
    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      const { data, error } = await supabaseClient
        .from('tickets')
        .select('id, customer_name, device_info, issue, status, completed_at')
        .order('completed_at', { ascending: false });

      if (!error) allTickets = data || [];
    }

    receiptTicketsCache = allTickets;

    let html = '<option value="">-- Pilih tiket --</option>';
    allTickets.forEach(ticket => {
      const ticketId = 'TX.' + String(ticket.id).padStart(3, '0');
      const label = `${ticketId} - ${ticket.customer_name} (${ticket.device_info}) [${ticket.status}]`;
      html += `<option value="${ticket.id}">${escapeHtml(label)}</option>`;
    });

    select.innerHTML = html;
    select.value = currentValue;
  } catch (e) {
    console.error('Gagal memuat pilihan tiket:', e);
  }
}

/**
 * Isi otomatis form kwitansi saat tiket dipilih
 */
function fillReceiptFromTicket() {
  const select = document.getElementById('receipt-ticket-select');
  const receivedInput = document.getElementById('receipt-received-from');
  const paymentForInput = document.getElementById('receipt-payment-for');

  if (!select || !receivedInput || !paymentForInput) return;

  const ticketId = parseInt(select.value, 10);
  if (!ticketId) {
    receivedInput.value = '';
    paymentForInput.value = '';
    return;
  }

  const ticket = receiptTicketsCache.find(t => t.id === ticketId);
  if (!ticket) return;

  receivedInput.value = ticket.customer_name || '';
  paymentForInput.value = `Perbaikan ${ticket.device_info || ''} sesuai keluhan: ${ticket.issue || ''}`;
}

/**
 * Konversi input jumlah uang ke terbilang
 */
function convertAmountToWords() {
  const amountInput = document.getElementById('receipt-amount');
  const wordsInput = document.getElementById('receipt-amount-words');
  if (!amountInput || !wordsInput) return;

  wordsInput.value = numberToWordsRupiah(amountInput.value);
}

/**
 * Ambil daftar kwitansi dari database
 */
async function fetchReceipts() {
  const tbody = document.getElementById('admin-receipts-tbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px;">Memuat data kwitansi...</td></tr>';

  try {
    let data = [];
    let error = null;

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
      const result = await supabaseClient
        .from('receipts')
        .select('*, tickets(id, customer_name, device_info)')
        .order('created_at', { ascending: false });
      data = result.data || [];
      error = result.error;
    } else {
      error = new Error('Supabase client tidak tersedia');
    }

    if (error) throw error;

    receipts = data;
    renderReceipts(receipts);
  } catch (err) {
    console.error('Gagal memuat kwitansi:', err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#ef4444;padding:24px;">Gagal memuat kwitansi: ${escapeHtml(err.message || 'Error')}</td></tr>`;
  }
}

/**
 * Render daftar kwitansi ke tabel
 */
function renderReceipts(list) {
  const tbody = document.getElementById('admin-receipts-tbody');
  if (!tbody) return;

  if (!list || list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px;">Belum ada kwitansi. Buat kwitansi baru dari form di sebelah kiri.</td></tr>';
    return;
  }

  let html = '';
  list.forEach(receipt => {
    const customer = receipt.tickets ? receipt.tickets.customer_name : '-';
    const dateDisplay = formatDateIndonesian(receipt.receipt_date);

    html += `
      <tr>
        <td><strong>${escapeHtml(receipt.receipt_number)}</strong></td>
        <td>${escapeHtml(customer)}</td>
        <td>${formatRupiah(receipt.amount)}</td>
        <td>${dateDisplay}</td>
        <td style="text-align:center;">
          <div style="display:flex;gap:6px;justify-content:center;">
            <button class="btn-edit" onclick='printPaymentReceiptById(${receipt.id})' title="Cetak Kwitansi" style="padding: 4px 8px; color: #4f46e5; border-color: #c7d2fe;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            </button>
            <button class="btn-delete" onclick='deleteReceipt(${receipt.id})' title="Hapus Kwitansi" style="padding: 4px 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

/**
 * Simpan kwitansi ke database lalu cetak
 */
async function saveReceipt(event) {
  event.preventDefault();

  const ticketSelect = document.getElementById('receipt-ticket-select');
  const numberInput = document.getElementById('receipt-number');
  const receivedInput = document.getElementById('receipt-received-from');
  const amountInput = document.getElementById('receipt-amount');
  const wordsInput = document.getElementById('receipt-amount-words');
  const paymentForInput = document.getElementById('receipt-payment-for');
  const dateInput = document.getElementById('receipt-date');
  const warrantyInput = document.getElementById('receipt-warranty');
  const locationInput = document.getElementById('receipt-location');
  const cashierInput = document.getElementById('receipt-cashier');

  const ticketId = parseInt(ticketSelect.value, 10);
  if (!ticketId) {
    alert('Pilih tiket terlebih dahulu.');
    return;
  }

  const receiptData = {
    ticket_id: ticketId,
    receipt_number: numberInput.value.trim(),
    received_from: receivedInput.value.trim(),
    amount: parseInt(amountInput.value, 10) || 0,
    amount_in_words: wordsInput.value.trim(),
    payment_for: paymentForInput.value.trim(),
    receipt_date: dateInput.value,
    location: locationInput.value.trim(),
    cashier_name: cashierInput.value.trim(),
    warranty_days: parseInt(warrantyInput.value, 10) || 0
  };

  try {
    if (!supabaseClient) throw new Error('Supabase client belum tersedia.');

    const { data, error } = await supabaseClient
      .from('receipts')
      .insert([receiptData])
      .select('*, tickets(id, customer_name, device_info, issue)')
      .single();

    if (error) throw error;

    // Reset form sebagian, generate nomor baru
    ticketSelect.value = '';
    receivedInput.value = '';
    amountInput.value = '';
    wordsInput.value = '';
    paymentForInput.value = '';
    numberInput.value = await generateReceiptNumber();

    await fetchReceipts();

    // Cetak kwitansi
    if (data) printPaymentReceipt(data);

  } catch (err) {
    console.error('Gagal menyimpan kwitansi:', err);
    alert('Gagal menyimpan kwitansi: ' + (err.message || 'Error'));
  }
}

/**
 * Hapus kwitansi
 */
async function deleteReceipt(id) {
  if (!confirm('Yakin ingin menghapus kwitansi ini?')) return;

  try {
    if (!supabaseClient) throw new Error('Supabase client belum tersedia.');

    const { error } = await supabaseClient
      .from('receipts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await fetchReceipts();
  } catch (err) {
    console.error('Gagal menghapus kwitansi:', err);
    alert('Gagal menghapus kwitansi: ' + (err.message || 'Error'));
  }
}

/**
 * Cetak kwitansi berdasarkan ID
 */
async function printPaymentReceiptById(id) {
  const receipt = receipts.find(r => r.id === id);
  if (!receipt) {
    alert('Kwitansi tidak ditemukan.');
    return;
  }
  printPaymentReceipt(receipt);
}

/**
 * Tampilkan dan cetak kwitansi pembayaran
 */
function printPaymentReceipt(receipt) {
  const container = document.getElementById('print-payment-receipt-container');
  if (!container) return;

  const ticket = receipt.tickets || {};
  const ticketIdText = ticket.id ? '#TS-' + String(ticket.id).padStart(4, '0') : '-';

  document.getElementById('print-receipt-number').textContent = receipt.receipt_number || '-';
  document.getElementById('print-receipt-date').textContent = formatDateIndonesian(receipt.receipt_date);
  document.getElementById('print-receipt-received').textContent = receipt.received_from || '-';
  document.getElementById('print-receipt-words').textContent = receipt.amount_in_words || numberToWordsRupiah(receipt.amount);
  document.getElementById('print-receipt-for').textContent = receipt.payment_for || '-';
  document.getElementById('print-receipt-ticket').textContent = ticketIdText;
  document.getElementById('print-receipt-amount').textContent = formatRupiah(receipt.amount);
  document.getElementById('print-receipt-place-date').textContent = `${receipt.location || 'Samarinda'}, ${formatDateIndonesian(receipt.receipt_date)}`;
  document.getElementById('print-receipt-cashier').textContent = receipt.cashier_name || 'Kasir';
  document.getElementById('print-receipt-warranty').textContent = `Garansi Perbaikan: ${receipt.warranty_days || 0} Hari sejak tanggal penyerahan barang kembali.`;

  // Tampilkan sementara untuk print, lalu sembunyikan lagi
  container.style.display = 'block';
  window.print();
  container.style.display = 'none';
}
