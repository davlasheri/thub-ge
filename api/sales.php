<?php
require __DIR__ . '/db.php';

$emp = check_token(bearer_token(), $CFG, $pdo);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $in = body_json();
  $items = $in['items'] ?? [];
  if (!is_array($items) || count($items) === 0) fail(400, 'No items');
  $payment = in_array($in['payment'] ?? '', ['cash','card','transfer'], true) ? $in['payment'] : 'cash';

  $total = 0;
  foreach ($items as $it) {
    $qty = max(1, (int)($it['qty'] ?? 1));
    $price = max(0, (float)($it['unitPrice'] ?? 0));
    $total += $qty * $price;
  }

  $pdo->beginTransaction();
  try {
    $st = $pdo->prepare('INSERT INTO sales (employee_id, total, payment, customer_phone, note) VALUES (?,?,?,?,?)');
    $st->execute([
      $emp['id'], round($total, 2), $payment,
      substr(trim($in['customerPhone'] ?? ''), 0, 32),
      substr(trim($in['note'] ?? ''), 0, 255),
    ]);
    $saleId = (int)$pdo->lastInsertId();

    $sti = $pdo->prepare('INSERT INTO sale_items (sale_id, product_id, product_name, part_number, qty, unit_price) VALUES (?,?,?,?,?,?)');
    foreach ($items as $it) {
      $sti->execute([
        $saleId,
        substr((string)($it['productId'] ?? ''), 0, 64),
        substr((string)($it['name'] ?? ''), 0, 255),
        substr((string)($it['partNumber'] ?? ''), 0, 64),
        max(1, (int)($it['qty'] ?? 1)),
        max(0, (float)($it['unitPrice'] ?? 0)),
      ]);
    }
    $pdo->commit();
  } catch (Throwable $e) {
    $pdo->rollBack();
    fail(500, 'Failed to save sale');
  }
  ok(['saleId' => $saleId, 'total' => round($total, 2)]);
}

// GET: recent sales with items
$limit = min(200, max(1, (int)($_GET['limit'] ?? 50)));
$sales = $pdo->prepare(
  'SELECT s.id, s.total, s.payment, s.customer_phone AS customerPhone, s.note,
          s.created_at AS createdAt, e.display_name AS employee
   FROM sales s JOIN employees e ON e.id = s.employee_id
   ORDER BY s.id DESC LIMIT ' . $limit
);
$sales->execute();
$rows = $sales->fetchAll();

if ($rows) {
  $ids = array_column($rows, 'id');
  $ph = implode(',', array_fill(0, count($ids), '?'));
  $sti = $pdo->prepare("SELECT sale_id, product_id AS productId, product_name AS name,
                               part_number AS partNumber, qty, unit_price AS unitPrice
                        FROM sale_items WHERE sale_id IN ($ph)");
  $sti->execute($ids);
  $byId = [];
  foreach ($sti->fetchAll() as $it) $byId[$it['sale_id']][] = $it;
  foreach ($rows as &$r) {
    $r['items'] = $byId[$r['id']] ?? [];
    $r['total'] = (float)$r['total'];
  }
}
ok(['sales' => $rows]);
