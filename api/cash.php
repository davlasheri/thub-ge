<?php
require __DIR__ . '/db.php';

$me = check_token(bearer_token(), $CFG, $pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if ($me['role'] !== 'admin') fail(403, 'სალაროს ანგარიში ხელმისაწვდომია მხოლოდ ადმინისტრატორისთვის');
  $days = min(365, max(1, (int)($_GET['days'] ?? 30)));

  $st = $pdo->prepare(
    "SELECT m.id, m.type, m.amount, m.reason, m.created_at AS createdAt, e.display_name AS employee
     FROM cash_movements m JOIN employees e ON e.id = m.employee_id
     WHERE m.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     ORDER BY m.id DESC LIMIT 300"
  );
  $st->execute([$days - 1]);
  $movements = array_map(fn($r) => [
    'id' => (int)$r['id'], 'type' => $r['type'], 'amount' => (float)$r['amount'],
    'reason' => $r['reason'], 'createdAt' => $r['createdAt'], 'employee' => $r['employee'],
  ], $st->fetchAll());

  $cs = $pdo->prepare(
    "SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS sales FROM sales
     WHERE payment = 'cash' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)"
  );
  $cs->execute([$days - 1]);
  $cashSales = $cs->fetch();

  $manualIn = 0.0; $manualOut = 0.0;
  foreach ($movements as $m) {
    if ($m['type'] === 'in') $manualIn += $m['amount']; else $manualOut += $m['amount'];
  }

  ok([
    'movements' => $movements,
    'summary' => [
      'cashSales' => (float)$cashSales['revenue'],
      'cashSalesCount' => (int)$cashSales['sales'],
      'manualIn' => $manualIn,
      'manualOut' => $manualOut,
      'net' => (float)$cashSales['revenue'] + $manualIn - $manualOut,
    ],
  ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'GET or POST only');

$in = body_json();
$action = $in['action'] ?? 'add';

// ── clear the whole operations history (admin) ───────────────────────────────
if ($action === 'clearAll') {
  if ($me['role'] !== 'admin') fail(403, 'მხოლოდ ადმინისტრატორს შეუძლია');
  $pdo->exec('DELETE FROM cash_movements');
  ok();
}

// ── edit / delete an operation (admin) ───────────────────────────────────────
if ($action === 'update' || $action === 'delete') {
  if ($me['role'] !== 'admin') fail(403, 'მხოლოდ ადმინისტრატორს შეუძლია');
  $id = (int)($in['id'] ?? 0);
  $st = $pdo->prepare('SELECT * FROM cash_movements WHERE id = ?');
  $st->execute([$id]);
  $m = $st->fetch();
  if (!$m) fail(404, 'ოპერაცია ვერ მოიძებნა');

  if ($action === 'delete') {
    $pdo->prepare('DELETE FROM cash_movements WHERE id = ?')->execute([$id]);
    ok();
  }

  $newType = in_array($in['type'] ?? '', ['in','out'], true) ? $in['type'] : $m['type'];
  $newAmount = array_key_exists('amount', $in) ? (float)$in['amount'] : (float)$m['amount'];
  if (!($newAmount > 0)) fail(400, 'თანხა უნდა იყოს 0-ზე მეტი');
  $newReason = array_key_exists('reason', $in) ? substr(trim((string)$in['reason']), 0, 255) : $m['reason'];

  $pdo->prepare('UPDATE cash_movements SET type = ?, amount = ?, reason = ? WHERE id = ?')
      ->execute([$newType, round($newAmount, 2), $newReason, $id]);
  ok();
}

$type = ($in['type'] ?? '') === 'in' ? 'in' : (($in['type'] ?? '') === 'out' ? 'out' : '');
$amount = (float)($in['amount'] ?? 0);
if ($type === '') fail(400, 'type must be in/out');
if (!($amount > 0)) fail(400, 'თანხა უნდა იყოს 0-ზე მეტი');

$pdo->prepare('INSERT INTO cash_movements (employee_id, type, amount, reason) VALUES (?,?,?,?)')
    ->execute([$me['id'], $type, round($amount, 2), substr(trim($in['reason'] ?? ''), 0, 255)]);
ok(['id' => (int)$pdo->lastInsertId()]);
