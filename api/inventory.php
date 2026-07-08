<?php
require __DIR__ . '/db.php';

$me = check_token(bearer_token(), $CFG, $pdo);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $rows = $pdo->query('SELECT product_id AS productId, qty FROM inventory')->fetchAll();
  $map = [];
  foreach ($rows as $r) $map[$r['productId']] = (int)$r['qty'];
  ok(['inventory' => $map]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'GET or POST only');
if ($me['role'] !== 'admin') fail(403, 'მხოლოდ ადმინისტრატორს შეუძლია მარაგის შეცვლა');

$in = body_json();
$action = $in['action'] ?? '';

if ($action === 'set') {
  $pid = substr((string)($in['productId'] ?? ''), 0, 64);
  $qty = max(0, (int)($in['qty'] ?? 0));
  if ($pid === '') fail(400, 'productId required');
  $pdo->prepare('INSERT INTO inventory (product_id, qty) VALUES (?,?)
                 ON DUPLICATE KEY UPDATE qty = VALUES(qty)')->execute([$pid, $qty]);
  ok();
}

if ($action === 'resetAll') {
  // Zero every balance — dropping the rows also clears leftovers of deleted products
  $pdo->exec('DELETE FROM inventory');
  ok();
}

fail(400, 'Unknown action');
