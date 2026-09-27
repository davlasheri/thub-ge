<?php
// Shared bootstrap: config, PDO connection, schema, auth helpers, JSON I/O.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function fail(int $code, string $msg): void {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
  exit;
}

$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
  fail(503, 'API not configured: create api/config.php (copy config.sample.php)');
}
$CFG = require $configFile;

try {
  $pdo = new PDO(
    "mysql:host={$CFG['db_host']};dbname={$CFG['db_name']};charset=utf8mb4",
    $CFG['db_user'], $CFG['db_pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
  );
} catch (PDOException $e) {
  fail(503, 'Database connection failed — check api/config.php credentials');
}

// ── Schema (idempotent) ────────────────────────────────────────────────────
$pdo->exec("CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  display_name VARCHAR(128) NOT NULL DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','staff') NOT NULL DEFAULT 'staff',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$pdo->exec("CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment ENUM('cash','card','transfer') NOT NULL DEFAULT 'cash',
  customer_phone VARCHAR(32) DEFAULT '',
  note VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created (created_at),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$pdo->exec("CREATE TABLE IF NOT EXISTS sale_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  part_number VARCHAR(64) DEFAULT '',
  qty INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  INDEX idx_sale (sale_id),
  INDEX idx_product (product_id),
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$pdo->exec("CREATE TABLE IF NOT EXISTS inventory (
  product_id VARCHAR(64) PRIMARY KEY,
  qty INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// migration: returns reference their original sale
$hasRef = $pdo->query("SHOW COLUMNS FROM sales LIKE 'ref_sale_id'")->fetch();
if (!$hasRef) $pdo->exec("ALTER TABLE sales ADD COLUMN ref_sale_id INT NULL");

// key/value store for one-off migration markers
$pdo->exec("CREATE TABLE IF NOT EXISTS app_meta (
  k VARCHAR(64) PRIMARY KEY,
  v VARCHAR(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// One-time cleanup: early builds auto-seeded every product with a random 1-10
// quantity, so the stock total was a made-up number. Wipe those seeded rows once.
// Guarded by a marker, so real stock entered after this deploy is never touched.
$seedCleared = $pdo->query("SELECT 1 FROM app_meta WHERE k = 'inv_seed_cleared'")->fetch();
if (!$seedCleared) {
  $pdo->exec('DELETE FROM inventory');
  $pdo->prepare("INSERT INTO app_meta (k, v) VALUES ('inv_seed_cleared', ?)")->execute([date('c')]);
}

$pdo->exec("CREATE TABLE IF NOT EXISTS stock_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  part_number VARCHAR(64) DEFAULT '',
  type ENUM('purchase','disassembly','sale','return','adjustment') NOT NULL,
  qty INT NOT NULL,
  note VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_stock_created (created_at),
  INDEX idx_stock_product (product_id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$pdo->exec("CREATE TABLE IF NOT EXISTS cash_movements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  type ENUM('in','out') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_cash_created (created_at),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

// Seed a single admin ONLY when the employees table is empty (fresh install).
// An existing admin's password is never touched. No password lives in the
// repo: set 'admin_initial_password' in config.php (or the THUB_ADMIN_INITIAL_PASSWORD
// environment variable) before the first request; otherwise a random one is
// generated and written to api/private/initial-admin-password.txt (blocked
// from the web) — read it via cPanel File Manager, log in, change it, delete the file.
// No staff account is seeded; create staff from the admin panel.
$count = (int)$pdo->query('SELECT COUNT(*) c FROM employees')->fetch()['c'];
if ($count === 0) {
  $seedPw = (string)($CFG['admin_initial_password'] ?? '');
  if ($seedPw === '') $seedPw = (string)(getenv('THUB_ADMIN_INITIAL_PASSWORD') ?: '');
  if (strlen($seedPw) < 8) {
    $seedPw = rtrim(strtr(base64_encode(random_bytes(12)), '+/', '-_'), '=');
    $privDir = __DIR__ . '/private';
    if (!is_dir($privDir)) @mkdir($privDir, 0700, true);
    @file_put_contents("$privDir/.htaccess", "Require all denied\n");
    @file_put_contents("$privDir/index.html", '');
    if (@file_put_contents("$privDir/initial-admin-password.txt",
        "TeslaHub.ge first admin login\nusername: admin\npassword: $seedPw\n" .
        "Change this password after logging in, then delete this file.\n") === false) {
      fail(500, 'Cannot seed admin: set admin_initial_password in api/config.php');
    }
    @chmod("$privDir/initial-admin-password.txt", 0600);
  }
  $st = $pdo->prepare('INSERT INTO employees (username, display_name, password_hash, role) VALUES (?,?,?,?)');
  $st->execute(['admin', 'Administrator', password_hash($seedPw, PASSWORD_DEFAULT), 'admin']);
  unset($seedPw);
}

// ── Tokens: base64(username|expires|hmac) ──────────────────────────────────
function make_token(string $username, array $cfg): string {
  $exp = time() + (int)($cfg['token_hours'] ?? 12) * 3600;
  $sig = hash_hmac('sha256', "$username|$exp", $cfg['secret']);
  return base64_encode("$username|$exp|$sig");
}

function check_token(?string $token, array $cfg, PDO $pdo): array {
  if (!$token) fail(401, 'Not authenticated');
  $parts = explode('|', base64_decode($token) ?: '');
  if (count($parts) !== 3) fail(401, 'Bad token');
  [$username, $exp, $sig] = $parts;
  if ((int)$exp < time()) fail(401, 'Session expired');
  $expect = hash_hmac('sha256', "$username|$exp", $cfg['secret']);
  if (!hash_equals($expect, $sig)) fail(401, 'Bad token');
  $st = $pdo->prepare('SELECT id, username, display_name, role FROM employees WHERE username = ? AND active = 1');
  $st->execute([$username]);
  $emp = $st->fetch();
  if (!$emp) fail(401, 'Employee not found');
  return $emp;
}

function bearer_token(): ?string {
  // Header only — never accept the token from the query string, where it would
  // leak into access logs, proxy logs, and Referer headers.
  $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
  if (preg_match('/Bearer\s+(\S+)/', $h, $m)) return $m[1];
  return null;
}

function body_json(): array {
  $raw = file_get_contents('php://input');
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function ok(array $payload = []): void {
  echo json_encode(['ok' => true] + $payload, JSON_UNESCAPED_UNICODE);
  exit;
}
