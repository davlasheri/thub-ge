<?php
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'POST only');

$in = body_json();
$username = trim($in['username'] ?? '');
$password = (string)($in['password'] ?? '');
if ($username === '' || $password === '') fail(400, 'Username and password required');

$st = $pdo->prepare('SELECT * FROM employees WHERE username = ? AND active = 1');
$st->execute([$username]);
$emp = $st->fetch();
if (!$emp || !password_verify($password, $emp['password_hash'])) {
  // small delay to slow brute force
  usleep(400000);
  fail(401, 'Wrong username or password');
}

// Optional password change: pass new_password along with valid credentials
if (!empty($in['new_password'])) {
  if (strlen($in['new_password']) < 6) fail(400, 'New password too short (min 6)');
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
