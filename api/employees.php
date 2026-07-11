<?php
require __DIR__ . '/db.php';

$me = check_token(bearer_token(), $CFG, $pdo);
if ($me['role'] !== 'admin') fail(403, 'მხოლოდ ადმინისტრატორს აქვს წვდომა');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $rows = $pdo->query(
    'SELECT id, username, display_name AS displayName, role, active, created_at AS createdAt
     FROM employees ORDER BY id'
  )->fetchAll();
  foreach ($rows as &$r) { $r['id'] = (int)$r['id']; $r['active'] = (bool)$r['active']; }
  ok(['employees' => $rows]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'GET or POST only');

$in = body_json();
$action = $in['action'] ?? '';

if ($action === 'create') {
  $username = strtolower(trim($in['username'] ?? ''));
  $password = (string)($in['password'] ?? '');
  $displayName = trim($in['displayName'] ?? '') ?: $username;
  $role = ($in['role'] ?? 'staff') === 'admin' ? 'admin' : 'staff';

  if (!preg_match('/^[a-z0-9._-]{3,32}$/', $username)) fail(400, 'მომხმარებელი: 3-32 სიმბოლო (a-z, 0-9, . _ -)');
  if (strlen($password) < 8) fail(400, "პაროლი მინიმუმ 8 სიმბოლო");

  $st = $pdo->prepare('SELECT id FROM employees WHERE username = ?');
  $st->execute([$username]);
  if ($st->fetch()) fail(409, 'ასეთი მომხმარებელი უკვე არსებობს');

  $st = $pdo->prepare('INSERT INTO employees (username, display_name, password_hash, role) VALUES (?,?,?,?)');
  $st->execute([$username, $displayName, password_hash($password, PASSWORD_DEFAULT), $role]);
  ok(['id' => (int)$pdo->lastInsertId()]);
}

if ($action === 'update') {
  $id = (int)($in['id'] ?? 0);
  $st = $pdo->prepare('SELECT * FROM employees WHERE id = ?');
  $st->execute([$id]);
  $target = $st->fetch();
  if (!$target) fail(404, 'თანამშრომელი ვერ მოიძებნა');

  $isSelf = (int)$me['id'] === $id;

  if (array_key_exists('displayName', $in)) {
    $pdo->prepare('UPDATE employees SET display_name = ? WHERE id = ?')
        ->execute([trim($in['displayName']) ?: $target['username'], $id]);
  }
  if (array_key_exists('role', $in)) {
    $role = $in['role'] === 'admin' ? 'admin' : 'staff';
    if ($isSelf && $role !== 'admin') fail(400, 'საკუთარი როლის დაქვეითება არ შეიძლება');
    $pdo->prepare('UPDATE employees SET role = ? WHERE id = ?')->execute([$role, $id]);
  }
  if (array_key_exists('active', $in)) {
    $active = $in['active'] ? 1 : 0;
    if ($isSelf && !$active) fail(400, 'საკუთარი ანგარიშის გათიშვა არ შეიძლება');
    $pdo->prepare('UPDATE employees SET active = ? WHERE id = ?')->execute([$active, $id]);
  }
  if (!empty($in['newPassword'])) {
    if (strlen($in['newPassword']) < 8) fail(400, 'პაროლი მინიმუმ 8 სიმბოლო');
    $pdo->prepare('UPDATE employees SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($in['newPassword'], PASSWORD_DEFAULT), $id]);
  }
  ok();
}

fail(400, 'Unknown action');
