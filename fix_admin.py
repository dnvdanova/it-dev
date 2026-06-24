import re

with open('admin.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove API_URL
content = re.sub(r"const API_URL = 'http://localhost/it-support-kb/api\.php';\n*", "", content)

# 2. fetchAdminArticles
fetchAdminArticles_old = """async function fetchAdminArticles() {
  try {
    const response = await fetch(`${API_URL}?action=get_articles`);
    if (!response.ok) throw new Error('Gagal memuat data');
    const data = await response.json();
    articles = data;
    renderAdminArticles();
  } catch (error) {
    console.error('KB Admin: Gagal fetch data', error);
    showToast('Gagal terhubung ke database server.', 'error');
  }
}"""
fetchAdminArticles_new = """async function fetchAdminArticles() {
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
    console.error('KB Admin: Gagal fetch data dari Supabase', error);
    showToast('Gagal terhubung ke database server.', 'error');
  }
}"""
content = content.replace(fetchAdminArticles_old, fetchAdminArticles_new)

# 3. saveArticle
saveArticle_old = """  const category = document.getElementById('art-category').value;
  const description = document.getElementById('art-description').value.trim();
  const symptoms = document.getElementById('art-symptoms').value.trim();

  const stepsInputs = document.querySelectorAll('.step-input-field');
  const steps = Array.from(stepsInputs).map(input => input.value.trim()).filter(val => val !== '');

  const tagsInput = document.getElementById('art-tags').value.trim();
  const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag !== '') : [];

  const payload = {
    title, category, description, symptoms, steps, tags
  };

  const submitBtn = document.getElementById('btn-submit-article');
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.7';

  try {
    if (editArticleId !== null) {
      // ── UPDATE MODE ─────────────────────────────────────────────────────────
      payload.id = editArticleId;
      const res = await fetch(`${API_URL}?action=update_article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal update');

      showToast('Artikel berhasil diperbarui!', 'success');
      cancelEdit(); // Kembali ke mode tambah & reset form
    } else {
      // ── CREATE MODE ──────────────────────────────────────────────────────────
      const res = await fetch(`${API_URL}?action=create_article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal create');

      showToast('Artikel berhasil ditambahkan! Artikel ini sekarang aktif di Halaman Utama.', 'success');
      document.getElementById('article-form').reset();
      resetStepsBuilder();
    }

    await fetchAdminArticles();
  } catch (error) {
    console.error('Save Article Error:', error);
    showToast(error.message || 'Terjadi kesalahan saat menyimpan artikel.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
  }
}"""
saveArticle_new = """  const categorySlug = document.getElementById('art-category').value;
  const description = document.getElementById('art-description').value.trim();
  const symptoms = document.getElementById('art-symptoms').value.trim();

  const stepsInputs = document.querySelectorAll('.step-input-field');
  const steps = Array.from(stepsInputs).map(input => input.value.trim()).filter(val => val !== '');

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
      
      // Delete old steps and tags (Supabase REST will delete them, we just insert new)
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
    console.error('Save Article Error:', error);
    showToast(error.message || 'Terjadi kesalahan saat menyimpan artikel.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
  }
}"""
content = content.replace(saveArticle_old, saveArticle_new)

# 4. deleteArticle
deleteArticle_old = """async function deleteArticle(articleId) {
  const isConfirmed = await confirmAction('Apakah Anda yakin ingin menghapus artikel ini secara permanen?');
  if (!isConfirmed) return;

  try {
    const res = await fetch(`${API_URL}?action=delete_article`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: articleId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Gagal menghapus');

    await fetchAdminArticles();
    showToast('Artikel berhasil dihapus.', 'success');
  } catch (error) {
    console.error('Delete Error:', error);
    showToast(error.message || 'Gagal menghapus artikel.', 'error');
  }
}"""
deleteArticle_new = """async function deleteArticle(articleId) {
  const isConfirmed = await confirmAction('Apakah Anda yakin ingin menghapus artikel ini secara permanen?');
  if (!isConfirmed) return;

  try {
    const { error } = await supabaseClient.from('articles').delete().eq('id', articleId);
    if (error) throw error;

    await fetchAdminArticles();
    showToast('Artikel berhasil dihapus.', 'success');
  } catch (error) {
    console.error('Delete Error:', error);
    showToast(error.message || 'Gagal menghapus artikel.', 'error');
  }
}"""
content = content.replace(deleteArticle_old, deleteArticle_new)

# 5. Dashboard Stats
fetchDashboardStats_old = """async function fetchDashboardStats() {
  try {
    const res = await fetch(`${API_URL}?action=get_dashboard_stats`);
    if (!res.ok) throw new Error();
    const stats = await res.json();

    document.getElementById('stat-month-label').textContent = stats.current_month;
    document.getElementById('stat-tickets-in').textContent = stats.tickets_in;
    document.getElementById('stat-tickets-out').textContent = stats.tickets_out;
    document.getElementById('stat-tickets-process').textContent = stats.tickets_process;
    document.getElementById('stat-tickets-canceled').textContent = stats.tickets_canceled;
  } catch (err) {
    console.error("Gagal mengambil statistik dashboard.");
  }
}"""
fetchDashboardStats_new = """async function fetchDashboardStats() {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Total in
    const { count: ticketsIn, error: errIn } = await supabaseClient
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${currentMonth}-01`);
      
    // Total out
    const { count: ticketsOut, error: errOut } = await supabaseClient
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Selesai')
      .gte('completed_at', `${currentMonth}-01`);

    // Total process
    const { count: ticketsProcess, error: errProcess } = await supabaseClient
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Proses');

    // Total canceled
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
    console.error("Gagal mengambil statistik dashboard.", err);
  }
}"""
content = content.replace(fetchDashboardStats_old, fetchDashboardStats_new)

# 6. fetchTickets
fetchTickets_old = """async function fetchTickets() {
  try {
    const res = await fetch(`${API_URL}?action=get_tickets`);
    if (!res.ok) throw new Error();
    tickets = await res.json();
    renderTickets();
  } catch (err) {
    console.error("Gagal mengambil daftar tiket.");
  }
}"""
fetchTickets_new = """async function fetchTickets() {
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
}"""
content = content.replace(fetchTickets_old, fetchTickets_new)

# 8. saveTicket
saveTicket_old = """    issue: document.getElementById('ticket-issue').value.trim()
  };

  const shouldPrint = document.getElementById('print-on-save').checked;

  try {
    const res = await fetch(`${API_URL}?action=create_ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error();
    const responseData = await res.json();

    // Reset Form
    document.getElementById('ticket-form').reset();

    // Refresh Data
    fetchDashboardStats();
    fetchTickets();

    // Otomatis cetak tanda terima jika checkbox dicentang
    if (shouldPrint) {
      // Tunggu sebentar agar render UI selesai sebelum ngeprint
      setTimeout(() => {
        printTicket(responseData.id, data);
        showToast("Tiket perbaikan berhasil disimpan!", "success");
      }, 300);
    } else {
      showToast("Tiket perbaikan berhasil disimpan!", "success");
    }
  } catch (err) {
    showToast("Gagal menyimpan tiket perbaikan.", "error");
  }
}"""
saveTicket_new = """    issue: document.getElementById('ticket-issue').value.trim(),
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

    document.getElementById('ticket-form').reset();
    fetchDashboardStats();
    fetchTickets();

    if (shouldPrint) {
      setTimeout(() => {
        printTicket(newTicket.id, newTicket);
        showToast("Tiket perbaikan berhasil disimpan!", "success");
      }, 300);
    } else {
      showToast("Tiket perbaikan berhasil disimpan!", "success");
    }
  } catch (err) {
    showToast("Gagal menyimpan tiket perbaikan.", "error");
  }
}"""
content = content.replace(saveTicket_old, saveTicket_new)

# 9. updateTicketStatus
updateTicketStatus_old = """async function updateTicketStatus(id, newStatus) {
  try {
    const res = await fetch(`${API_URL}?action=update_ticket_status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, status: newStatus })
    });

    if (!res.ok) throw new Error();

    // Refresh
    fetchDashboardStats();
    fetchTickets();
    showToast("Status tiket berhasil diperbarui!", "success");
  } catch (err) {
    showToast("Gagal memperbarui status tiket.", "error");
  }
}"""
updateTicketStatus_new = """async function updateTicketStatus(id, newStatus) {
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

    fetchDashboardStats();
    fetchTickets();
    showToast("Status tiket berhasil diperbarui!", "success");
  } catch (err) {
    showToast("Gagal memperbarui status tiket.", "error");
  }
}"""
content = content.replace(updateTicketStatus_old, updateTicketStatus_new)

# 10. deleteTicket
deleteTicket_old = """async function deleteTicket(id) {
  const isConfirmed = await confirmAction('Apakah Anda yakin ingin menghapus tiket ini?');
  if (!isConfirmed) return;

  try {
    const res = await fetch(`${API_URL}?action=delete_ticket`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id })
    });

    if (!res.ok) throw new Error();

    fetchDashboardStats();
    fetchTickets();
    showToast("Tiket berhasil dihapus.", "success");
  } catch (err) {
    showToast("Gagal menghapus tiket.", "error");
  }
}"""
deleteTicket_new = """async function deleteTicket(id) {
  const isConfirmed = await confirmAction('Apakah Anda yakin ingin menghapus tiket ini?');
  if (!isConfirmed) return;

  try {
    const { error } = await supabaseClient
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
}"""
content = content.replace(deleteTicket_old, deleteTicket_new)

with open('admin.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done updating admin.js")
