<?php
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'POST only');

// ── brute-force throttle ────────────────────────────────────────────────────
// Track failed attempts per client IP; too many within the window → cool-down.
// Keyed by IP (not username) so an attacker can't lock a real user out.
// The whole block is best-effort: if anything about this table misbehaves, we
// skip throttling rather than ever blocking a legitimate login.
$ip = substr((string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 0, 64);
$throttleOk = false;
try {
  $pdo->exec("CREATE TABLE IF NOT EXISTS login_attempts (
    ip VARCHAR(64) NOT NULL,
    at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ip_at (ip, at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
  // window/threshold are server constants, inlined (a bound param inside
  // INTERVAL is not reliably supported by MySQL prepared statements)
  $recent = $pdo->prepare(
    'SELECT COUNT(*) c FROM login_attempts WHERE ip = ? AND at >= (NOW() - INTERVAL 15 MINUTE)'
  );
  $recent->execute([$ip]);
  $throttleOk = true;
  if ((int)$recent->fetch()['c'] >= 12) {  // 12 fails / 15 min → cool-down
    usleep(400000);
    fail(429, 'ძალიან ბევრი მცდელობა — სცადეთ რამდენიმე წუთში');
  }
} catch (Throwable $e) {
  $throttleOk = false; // DB issue with the throttle table — don't block login
}

$in = body_json();
$username = trim($in['username'] ?? '');
$password = (string)($in['password'] ?? '');
if ($username === '' || $password === '') fail(400, 'Username and password required');

$st = $pdo->prepare('SELECT * FROM employees WHERE username = ? AND active = 1');
$st->execute([$username]);
$emp = $st->fetch();
if (!$emp || !password_verify($password, $emp['password_hash'])) {
  if ($throttleOk) {
    try {
      // record the failed attempt and opportunistically prune old rows
      $pdo->prepare('INSERT INTO login_attempts (ip) VALUES (?)')->execute([$ip]);
      $pdo->prepare('DELETE FROM login_attempts WHERE at < (NOW() - INTERVAL 1 DAY)')->execute();
    } catch (Throwable $e) { /* best-effort */ }
  }
  usleep(400000);
  fail(401, 'Wrong username or password');
}

// success — clear this IP's failed attempts
if ($throttleOk) {
  try { $pdo->prepare('DELETE FROM login_attempts WHERE ip = ?')->execute([$ip]); }
  catch (Throwable $e) { /* best-effort */ }
}

// Optional password change: pass new_password along with valid credentials
if (!empty($in['new_password'])) {
  if (strlen($in['new_password']) < 8) fail(400, 'New password too short (min 8)');
  $up = $pdo->prepare('UPDATE employees SET password_hash = ? WHERE id = ?');
  $up->execute([password_hash($in['new_password'], PASSWORD_DEFAULT), $emp['id']]);
}

ok([
  'token' => make_token($emp['username'], $CFG),
  'employee' => [
    'id' => (int)$emp['id'],
    'username' => $emp['username'],
    'displayName' => $emp['display_name'],
    'role' => $emp['role'],
  ],
]);
