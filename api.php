<?php
// Izinkan akses dari mana saja (CORS) untuk development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Konfigurasi Database
$host = "localhost";
$user = "root";       // Default username XAMPP
$pass = "";           // Default password XAMPP (kosong)
$dbname = "it_support_kb";

// Buat koneksi ke database
$conn = new mysqli($host, $user, $pass, $dbname);

// Cek koneksi
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Koneksi database gagal: " . $conn->connect_error]);
    exit();
}

// Set charset ke UTF-8
$conn->set_charset("utf8mb4");

// Ambil aksi dari URL (contoh: api.php?action=get_articles)
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Baca input JSON mentah (karena frontend mengirim JSON)
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, TRUE);

// --- ROUTING ---
switch ($action) {
    case 'get_articles':
        getArticles($conn);
        break;
    case 'create_article':
        createArticle($conn, $input);
        break;
    case 'update_article':
        updateArticle($conn, $input);
        break;
    case 'delete_article':
        deleteArticle($conn, $input);
        break;
    
    // --- TICKETS ROUTING ---
    case 'get_tickets':
        getTickets($conn);
        break;
    case 'create_ticket':
        createTicket($conn, $input);
        break;
    case 'update_ticket_status':
        updateTicketStatus($conn, $input);
        break;
    case 'delete_ticket':
        deleteTicket($conn, $input);
        break;
    case 'get_dashboard_stats':
        getDashboardStats($conn);
        break;

    default:
        http_response_code(400);
        echo json_encode(["error" => "Aksi tidak valid atau tidak disediakan."]);
        break;
}

$conn->close();

// ============================================================================
// FUNGSI-FUNGSI API
// ============================================================================

/**
 * GET: Mengambil semua artikel beserta relasinya (steps dan tags)
 */
function getArticles($conn) {
    // Ambil data artikel utama dan join dengan categories untuk mendapatkan slug/nama
    $sql = "SELECT a.id, a.title, a.description, a.symptoms, c.slug as category, c.name as categoryDisplay 
            FROM articles a
            JOIN categories c ON a.category_id = c.id
            ORDER BY a.id ASC";
            
    $result = $conn->query($sql);
    $articles = [];

    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $articleId = $row['id'];
            
            // Siapkan struktur dasar
            $articleData = [
                "id" => (int)$articleId,
                "title" => $row['title'],
                "category" => $row['category'],
                "categoryDisplay" => $row['categoryDisplay'],
                "description" => $row['description'],
                "symptoms" => $row['symptoms'],
                "steps" => [],
                "tags" => []
            ];

            // --- Ambil Steps ---
            $stmtSteps = $conn->prepare("SELECT step_text FROM article_steps WHERE article_id = ? ORDER BY step_order ASC");
            $stmtSteps->bind_param("i", $articleId);
            $stmtSteps->execute();
            $resSteps = $stmtSteps->get_result();
            while ($stepRow = $resSteps->fetch_assoc()) {
                $articleData['steps'][] = $stepRow['step_text'];
            }
            $stmtSteps->close();

            // --- Ambil Tags ---
            $stmtTags = $conn->prepare("SELECT tag_name FROM article_tags WHERE article_id = ?");
            $stmtTags->bind_param("i", $articleId);
            $stmtTags->execute();
            $resTags = $stmtTags->get_result();
            while ($tagRow = $resTags->fetch_assoc()) {
                $articleData['tags'][] = $tagRow['tag_name'];
            }
            $stmtTags->close();

            $articles[] = $articleData;
        }
    }

    echo json_encode($articles);
}

/**
 * Helper untuk mendapatkan ID Kategori dari slug
 */
function getCategoryId($conn, $slug) {
    $stmt = $conn->prepare("SELECT id FROM categories WHERE slug = ?");
    $stmt->bind_param("s", $slug);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();
    $stmt->close();
    
    // Jika tidak ketemu, default ke 1 (konektivitas) agar tidak error
    return $row ? $row['id'] : 1; 
}

/**
 * POST: Menambah artikel baru
 */
function createArticle($conn, $data) {
    if (!$data || !isset($data['title'])) {
        http_response_code(400);
        echo json_encode(["error" => "Data tidak lengkap"]);
        return;
    }

    $conn->begin_transaction();

    try {
        $categoryId = getCategoryId($conn, $data['category']);

        // Insert tabel articles
        $stmt = $conn->prepare("INSERT INTO articles (category_id, title, description, symptoms) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("isss", $categoryId, $data['title'], $data['description'], $data['symptoms']);
        $stmt->execute();
        $articleId = $conn->insert_id; // Dapatkan ID yang baru dibuat
        $stmt->close();

        // Insert tabel article_steps
        if (isset($data['steps']) && is_array($data['steps'])) {
            $stmtSteps = $conn->prepare("INSERT INTO article_steps (article_id, step_order, step_text) VALUES (?, ?, ?)");
            foreach ($data['steps'] as $index => $stepText) {
                $order = $index + 1;
                $stmtSteps->bind_param("iis", $articleId, $order, $stepText);
                $stmtSteps->execute();
            }
            $stmtSteps->close();
        }

        // Insert tabel article_tags
        if (isset($data['tags']) && is_array($data['tags'])) {
            $stmtTags = $conn->prepare("INSERT INTO article_tags (article_id, tag_name) VALUES (?, ?)");
            foreach ($data['tags'] as $tagName) {
                $stmtTags->bind_param("is", $articleId, $tagName);
                $stmtTags->execute();
            }
            $stmtTags->close();
        }

        $conn->commit();
        echo json_encode(["success" => true, "message" => "Artikel berhasil dibuat", "id" => $articleId]);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["error" => "Gagal membuat artikel: " . $e->getMessage()]);
    }
}

/**
 * POST (digunakan sbg PUT): Mengupdate artikel
 */
function updateArticle($conn, $data) {
    if (!$data || !isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Data tidak lengkap, ID diperlukan"]);
        return;
    }

    $conn->begin_transaction();

    try {
        $articleId = (int)$data['id'];
        $categoryId = getCategoryId($conn, $data['category']);

        // Update tabel articles utama
        $stmt = $conn->prepare("UPDATE articles SET category_id = ?, title = ?, description = ?, symptoms = ? WHERE id = ?");
        $stmt->bind_param("isssi", $categoryId, $data['title'], $data['description'], $data['symptoms'], $articleId);
        $stmt->execute();
        $stmt->close();

        // Untuk step dan tags, cara termudah adalah HAPUS yang lama lalu BUAT yang baru
        
        // Hapus steps lama
        $conn->query("DELETE FROM article_steps WHERE article_id = $articleId");
        // Insert steps baru
        if (isset($data['steps']) && is_array($data['steps'])) {
            $stmtSteps = $conn->prepare("INSERT INTO article_steps (article_id, step_order, step_text) VALUES (?, ?, ?)");
            foreach ($data['steps'] as $index => $stepText) {
                $order = $index + 1;
                $stmtSteps->bind_param("iis", $articleId, $order, $stepText);
                $stmtSteps->execute();
            }
            $stmtSteps->close();
        }

        // Hapus tags lama
        $conn->query("DELETE FROM article_tags WHERE article_id = $articleId");
        // Insert tags baru
        if (isset($data['tags']) && is_array($data['tags'])) {
            $stmtTags = $conn->prepare("INSERT INTO article_tags (article_id, tag_name) VALUES (?, ?)");
            foreach ($data['tags'] as $tagName) {
                $stmtTags->bind_param("is", $articleId, $tagName);
                $stmtTags->execute();
            }
            $stmtTags->close();
        }

        $conn->commit();
        echo json_encode(["success" => true, "message" => "Artikel berhasil diupdate"]);

    } catch (Exception $e) {
        $conn->rollback();
        http_response_code(500);
        echo json_encode(["error" => "Gagal mengupdate artikel: " . $e->getMessage()]);
    }
}

/**
 * POST (digunakan sbg DELETE): Menghapus artikel
 */
function deleteArticle($conn, $data) {
    if (!$data || !isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "ID tidak disediakan"]);
        return;
    }

    $articleId = (int)$data['id'];

    // Karena di tabel article_steps dan article_tags ada 'ON DELETE CASCADE',
    // kita hanya perlu menghapus baris di tabel utama (articles), dan
    // MySQL akan otomatis menghapus langkah dan tag yang berelasi.
    
    $stmt = $conn->prepare("DELETE FROM articles WHERE id = ?");
    $stmt->bind_param("i", $articleId);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Artikel berhasil dihapus"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Gagal menghapus artikel"]);
    }
    
    $stmt->close();
}

// ============================================================================
// FUNGSI-FUNGSI API UNTUK TIKET SERVIS
// ============================================================================

/**
 * GET: Mengambil semua tiket perbaikan
 */
function getTickets($conn) {
    $sql = "SELECT id, customer_name, phone_number, device_info, issue, status, created_at, completed_at 
            FROM tickets 
            ORDER BY created_at DESC";
    
    $result = $conn->query($sql);
    $tickets = [];

    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $tickets[] = $row;
        }
    }

    echo json_encode($tickets);
}

/**
 * POST: Membuat tiket baru
 */
function createTicket($conn, $data) {
    if (!$data || !isset($data['customer_name']) || !isset($data['device_info']) || !isset($data['issue'])) {
        http_response_code(400);
        echo json_encode(["error" => "Data tiket tidak lengkap"]);
        return;
    }

    $phone = isset($data['phone_number']) ? $data['phone_number'] : '';

    $stmt = $conn->prepare("INSERT INTO tickets (customer_name, phone_number, device_info, issue) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $data['customer_name'], $phone, $data['device_info'], $data['issue']);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Tiket berhasil dibuat", "id" => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Gagal membuat tiket"]);
    }
    $stmt->close();
}

/**
 * POST: Memperbarui status tiket
 */
function updateTicketStatus($conn, $data) {
    if (!$data || !isset($data['id']) || !isset($data['status'])) {
        http_response_code(400);
        echo json_encode(["error" => "Data tidak lengkap, ID dan status diperlukan"]);
        return;
    }

    $id = (int)$data['id'];
    $status = $data['status'];

    if ($status === 'Selesai') {
        $stmt = $conn->prepare("UPDATE tickets SET status = ?, completed_at = NOW() WHERE id = ?");
    } else {
        $stmt = $conn->prepare("UPDATE tickets SET status = ?, completed_at = NULL WHERE id = ?");
    }
    
    $stmt->bind_param("si", $status, $id);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Status tiket diperbarui"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Gagal memperbarui status"]);
    }
    $stmt->close();
}

/**
 * POST: Menghapus tiket
 */
function deleteTicket($conn, $data) {
    if (!$data || !isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "ID tidak disediakan"]);
        return;
    }

    $id = (int)$data['id'];
    $stmt = $conn->prepare("DELETE FROM tickets WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Tiket berhasil dihapus"]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => "Gagal menghapus tiket"]);
    }
    $stmt->close();
}

/**
 * GET: Mengambil statistik dashboard bulanan
 */
function getDashboardStats($conn) {
    $currentMonth = date('Y-m');
    
    // Total tiket bulan ini
    $sqlIn = "SELECT COUNT(id) as total_in FROM tickets WHERE DATE_FORMAT(created_at, '%Y-%m') = '$currentMonth'";
    $resIn = $conn->query($sqlIn);
    $rowIn = $resIn->fetch_assoc();
    $totalIn = $rowIn ? (int)$rowIn['total_in'] : 0;

    // Total selesai bulan ini
    $sqlOut = "SELECT COUNT(id) as total_out FROM tickets WHERE status = 'Selesai' AND DATE_FORMAT(completed_at, '%Y-%m') = '$currentMonth'";
    $resOut = $conn->query($sqlOut);
    $rowOut = $resOut->fetch_assoc();
    $totalOut = $rowOut ? (int)$rowOut['total_out'] : 0;

    // Total proses
    $sqlProcess = "SELECT COUNT(id) as total_process FROM tickets WHERE status = 'Proses'";
    $resProcess = $conn->query($sqlProcess);
    $rowProcess = $resProcess->fetch_assoc();
    $totalProcess = $rowProcess ? (int)$rowProcess['total_process'] : 0;

    // Total batal
    $sqlCanceled = "SELECT COUNT(id) as total_canceled FROM tickets WHERE status = 'Batal'";
    $resCanceled = $conn->query($sqlCanceled);
    $rowCanceled = $resCanceled->fetch_assoc();
    $totalCanceled = $rowCanceled ? (int)$rowCanceled['total_canceled'] : 0;

    echo json_encode([
        "current_month" => date('F Y'),
        "tickets_in" => $totalIn,
        "tickets_out" => $totalOut,
        "tickets_process" => $totalProcess,
        "tickets_canceled" => $totalCanceled
    ]);
}
?>
