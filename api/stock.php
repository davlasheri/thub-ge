<?php
require __DIR__ . '/db.php';

$me = check_token(bearer_token(), $CFG, $pdo);

// GET: stock movement report
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  $days = min(365, max(1, (int)($_GET['days'] ?? 30)));
  $st = $pdo->prepare(
    "SELECT m.id, m.product_id AS productId, m.product_name AS name, m.part_number AS partNumber,
            m.type, m.qty, m.note, m.created_at AS createdAt, e.display_name AS employee
     FROM stock_movements m JOIN employees e ON e.id = m.employee_id
     WHERE m.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
     ORDER BY m.id DESC LIMIT 500"
  );
  $st->execute([$days - 1]);
  $rows = array_map(fn($r) => [
    'id' => (int)$r['id'], 'productId' => $r['productId'], 'name' => $r['name'],
    'partNumber' => $r['partNumber'], 'type' => $r['type'], 'qty' => (int)$r['qty'],
    'note' => $r['note'], 'createdAt' => $r['createdAt'], 'employee' => $r['employee'],
  ], $st->fetchAll());
  ok(['movements' => $rows]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'GET or POST only');
if ($me['role'] !== 'admin') fail(403, 'მხოლოდ ადმინისტრატორს შეუძლია მარაგის შევსება');

// POST: add stock via purchase / car disassembly / manual adjustment
$in = body_json();
$type = in_array($in['type'] ?? '', ['purchase','disassembly','adjustment'], true) ? $in['type'] : 'purchase';
$items = $in['items'] ?? [];
$note = substr(trim($in['note'] ?? ''), 0, 255);
if (!is_array($items) || count($items) === 0) fail(400, 'No items');

$pdo->beginTransaction();
try {
  $invUp = $pdo->prepare('INSERT INTO inventory (product_id, qty) VALUES (?,?)
                          ON DUPLICATE KEY UPDATE qty = GREATEST(0, qty + VALUES(qty))');
  $mv = $pdo->prepare('INSERT INTO stock_movements (employee_id, product_id, product_name, part_number, type, qty, note) VALUES (?,?,?,?,?,?,?)');
  foreach ($items as $it) {
    $pid = substr((string)($it['productId'] ?? ''), 0, 64);
    if ($pid === '') continue;
    $qty = (int)($it['qty'] ?? 0);
    if ($qty === 0) continue;
    if ($type !== 'adjustment' && $qty < 0) $qty = abs($qty);
    $invUp->execute([$pid, $qty]);
    $mv->execute([
      $me['id'], $pid,
      substr((string)($it['name'] ?? ''), 0, 255),
      substr((string)($it['partNumber'] ?? ''), 0, 64),
      $type, $qty, $note,
    ]);
  }
  $pdo->commit();
} catch (Throwable $e) {
  $pdo->rollBack();
  fail(500, 'ვერ შეინახა');
}
ok();
