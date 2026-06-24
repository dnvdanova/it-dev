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

  if (usernameInput === 'admin' && passwordInput === 'admin123') {
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
 * Fetch articles dari API Supabase
 */
async function fetchAdminArticles() {
  try {
    const { data, error } = await supabase
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
    console.error('KB Admin: Gagal fetch data dari Supabase', error);
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
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', categorySlug)
      .single();
    if (catError) throw new Error('Kategori tidak valid');

    const category_id = catData.id;
    let currentArticleId = editArticleId;

    if (editArticleId !== null) {
      // ── UPDATE MODE ─────────────────────────────────────────────────────────
      const { error: updateError } = await supabase
        .from('articles')
        .update({ category_id, title, description, symptoms })
        .eq('id', editArticleId);
      if (updateError) throw updateError;
      
      // Delete old steps and tags (Supabase REST will delete them, we just insert new)
      await supabase.from('article_steps').delete().eq('article_id', editArticleId);
      await supabase.from('article_tags').delete().eq('article_id', editArticleId);
      
      showToast('Artikel berhasil diperbarui!', 'success');
    } else {
      // ── CREATE MODE ──────────────────────────────────────────────────────────
      const { data: newArticle, error: createError } = await supabase
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
      const { error: stepsError } = await supabase.from('article_steps').insert(stepInserts);
      if (stepsError) throw stepsError;
    }

    // Insert tags
    if (tags.length > 0) {
      const tagInserts = tags.map(tag => ({
        article_id: currentArticleId,
        tag_name: tag
      }));
      const { error: tagsError } = await supabase.from('article_tags').insert(tagInserts);
      if (tagsError) throw tagsError;
    }

    if (editArticleId !== null) {
      cancelEdit();
    } else {
      document.getElementById('article-form').reset();
      resetStepsBuilder();
    }

    // Refresh table from DB
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
    const { error } = await supabase.from('articles').delete().eq('id', articleId);
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
  const viewArticles = document.getElementById('view-articles');
  const viewTickets = document.getElementById('view-tickets');

  if (tabName === 'articles') {
    tabArticlesBtn.classList.add('active');
    tabTicketsBtn.classList.remove('active');
    viewArticles.style.display = 'grid'; // .admin-grid uses display: grid
    viewTickets.style.display = 'none';
  } else {
    tabArticlesBtn.classList.remove('active');
    tabTicketsBtn.classList.add('active');
    viewArticles.style.display = 'none';
    viewTickets.style.display = 'block';

    // Muat data khusus tab tiket saat dibuka
    fetchDashboardStats();
    fetchTickets();
  }
}

/**
 * Update showDashboard untuk menampilkan tiket jika tab tiket yang aktif
 */
const originalShowDashboard = showDashboard;
showDashboard = function () {
  originalShowDashboard(); // Panggil fungsi aslinya untuk menyembunyikan login form dsb

  // Periksa tab mana yang sedang aktif
  const tabTicketsBtn = document.getElementById('tab-tickets');
  if (tabTicketsBtn && tabTicketsBtn.classList.contains('active')) {
    fetchDashboardStats();
    fetchTickets();
  }
};

/**
 * Mengambil Statistik Dashboard
 */
async function fetchDashboardStats() {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Total in
    const { count: ticketsIn, error: errIn } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${currentMonth}-01`);
      
    // Total out
    const { count: ticketsOut, error: errOut } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Selesai')
      .gte('completed_at', `${currentMonth}-01`);

    // Total process
    const { count: ticketsProcess, error: errProcess } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Proses');

    // Total canceled
    const { count: ticketsCanceled, error: errCanceled } = await supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Batal');

    document.getElementById('stat-month-label').textContent = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    document.getElementById('stat-tickets-in').textContent = ticketsIn || 0;
    document.getElementById('stat-tickets-out').textContent = ticketsOut || 0;
    document.getElementById('stat-tickets-process').textContent = ticketsProcess || 0;
    document.getElementById('stat-tickets-canceled').textContent = ticketsCanceled || 0;
  } catch (err) {
    console.error("Gagal mengambil statistik dashboard.", err);
  }
}

/**
 * Mengambil Daftar Tiket dari server
 */
async function fetchTickets() {
  try {
    const { data, error } = await supabase
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
 */
function renderTickets() {
  const tbody = document.getElementById('admin-tickets-tbody');
  tbody.innerHTML = '';

  if (tickets.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 24px;">Belum ada tiket servis.</td></tr>`;
    return;
  }

  tickets.forEach(ticket => {
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
          <span style="font-size: 0.8rem; font-weight: 400; color: #64748b;">(${escapeHtml(ticket.phone_number || '')})</span>
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
    const { data: newTicket, error } = await supabase
      .from('tickets')
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    document.getElementById('ticket-form').reset();
    fetchDashboardStats();
    fetchTickets();

    if (shouldPrint) {
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

    const { error } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    fetchDashboardStats();
    fetchTickets();
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
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', id);

    if (error) throw error;

    fetchDashboardStats();
    fetchTickets();
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

  // Panggil fitur pencetakan bawaan browser
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
