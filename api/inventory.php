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

if ($action === 'bulkSeed') {
  // Insert only products that are not yet tracked (used for the initial random seed)
  $items = $in['items'] ?? [];
  if (!is_array($items)) fail(400, 'items required');
  $st = $pdo->prepare('INSERT IGNORE INTO inventory (product_id, qty) VALUES (?,?)');
  $n = 0;
  foreach ($items as $it) {
    $pid = substr((string)($it['productId'] ?? ''), 0, 64);
    if ($pid === '') continue;
    $st->execute([$pid, max(0, (int)($it['qty'] ?? 0))]);
    $n += $st->rowCount();
  }
  ok(['seeded' => $n]);
}

fail(400, 'Unknown action');
