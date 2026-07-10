<?php
require __DIR__ . '/db.php';

$emp = check_token(bearer_token(), $CFG, $pdo);

// item identity for matching returns against the original sale
function item_key(array $it): string {
  return ($it['product_id'] ?? $it['productId'] ?? '') . '|' .
         ($it['product_name'] ?? $it['name'] ?? '') . '|' .
         number_format((float)($it['unit_price'] ?? $it['unitPrice'] ?? 0), 2, '.', '');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $in = body_json();
  $action = $in['action'] ?? 'create';

  // ── update sale metadata (admin) ─────────────────────────────────────────
  if ($action === 'update') {
    if ($emp['role'] !== 'admin') fail(403, 'მხოლოდ ადმინისტრატორს შეუძლია რედაქტირება');
    $id = (int)($in['id'] ?? 0);
    $st = $pdo->prepare('SELECT id FROM sales WHERE id = ?');
    $st->execute([$id]);
    if (!$st->fetch()) fail(404, 'გაყიდვა ვერ მოიძებნა');
    if (isset($in['payment']) && in_array($in['payment'], ['cash','card','transfer'], true)) {
      $pdo->prepare('UPDATE sales SET payment = ? WHERE id = ?')->execute([$in['payment'], $id]);
    }
    if (array_key_exists('customerPhone', $in)) {
      $pdo->prepare('UPDATE sales SET customer_phone = ? WHERE id = ?')
          ->execute([substr(trim((string)$in['customerPhone']), 0, 32), $id]);
    }
    if (array_key_exists('note', $in)) {
      $pdo->prepare('UPDATE sales SET note = ? WHERE id = ?')
          ->execute([substr(trim((string)$in['note']), 0, 255), $id]);
    }
    ok();
  }

  // ── delete sale, reversing its stock effect (admin) ──────────────────────
  if ($action === 'delete') {
    if ($emp['role'] !== 'admin') fail(403, 'მხოლოდ ადმინისტრატორს შეუძლია წაშლა');
    $id = (int)($in['id'] ?? 0);
    $st = $pdo->prepare('SELECT * FROM sales WHERE id = ?');
    $st->execute([$id]);
    $sale = $st->fetch();
    if (!$sale) fail(404, 'გაყიდვა ვერ მოიძებნა');

    // an original sale that has returns cannot be deleted first
    $refs = $pdo->prepare('SELECT COUNT(*) c FROM sales WHERE ref_sale_id = ?');
    $refs->execute([$id]);
    if ((int)$refs->fetch()['c'] > 0) fail(400, 'ამ გაყიდვას აქვს დაბრუნებები — ჯერ ისინი წაშალეთ');

    $isReturn = (float)$sale['total'] < 0;
    $items = $pdo->prepare('SELECT * FROM sale_items WHERE sale_id = ?');
    $items->execute([$id]);
    $items = $items->fetchAll();

    $pdo->beginTransaction();
    try {
      $invUp   = $pdo->prepare('INSERT INTO inventory (product_id, qty) VALUES (?,?)
                                ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)');
      $mv = $pdo->prepare('INSERT INTO stock_movements (employee_id, product_id, product_name, part_number, type, qty, note) VALUES (?,?,?,?,?,?,?)');
      foreach ($items as $it) {
        $pid = $it['product_id'];
        if ($pid === '' || $pid === 'custom') continue;
        // deleting a sale puts goods back (+); deleting a return takes them out (−)
        $delta = $isReturn ? -(int)$it['qty'] : (int)$it['qty'];
        $invUp->execute([$pid, $delta]);
        $mv->execute([
          $emp['id'], $pid, $it['product_name'], $it['part_number'],
          'adjustment', $delta,
          ($isReturn ? "return #$id deleted" : "sale #$id deleted"),
        ]);
      }
      $pdo->prepare('DELETE FROM sales WHERE id = ?')->execute([$id]); // items cascade
      $pdo->commit();
    } catch (Throwable $e) {
      $pdo->rollBack();
      fail(500, 'წაშლა ვერ მოხერხდა');
    }
    ok();
  }

  // ── create sale / return ─────────────────────────────────────────────────
  $items = $in['items'] ?? [];
  if (!is_array($items) || count($items) === 0) fail(400, 'No items');
  $payment = in_array($in['payment'] ?? '', ['cash','card','transfer'], true) ? $in['payment'] : 'cash';
  $isReturn = ($in['kind'] ?? 'sale') === 'return';
  $refSaleId = $isReturn ? (int)($in['refSaleId'] ?? 0) : 0;

  // returns must reference a sale and cannot exceed what is still returnable
  if ($isReturn) {
    if ($refSaleId <= 0) fail(400, 'დაბრუნებას უნდა ჰქონდეს საწყისი გაყიდვა');
    $orig = $pdo->prepare('SELECT * FROM sales WHERE id = ? AND total >= 0');
    $orig->execute([$refSaleId]);
    if (!$orig->fetch()) fail(404, 'საწყისი გაყიდვა ვერ მოიძებნა');

    $sold = [];
    $oi = $pdo->prepare('SELECT * FROM sale_items WHERE sale_id = ?');
    $oi->execute([$refSaleId]);
    foreach ($oi->fetchAll() as $it) $sold[item_key($it)] = ($sold[item_key($it)] ?? 0) + (int)$it['qty'];

    $ri = $pdo->prepare('SELECT si.* FROM sale_items si JOIN sales s ON s.id = si.sale_id WHERE s.ref_sale_id = ?');
    $ri->execute([$refSaleId]);
    foreach ($ri->fetchAll() as $it) $sold[item_key($it)] = ($sold[item_key($it)] ?? 0) - (int)$it['qty'];

    foreach ($items as $it) {
      $k = item_key($it);
      $want = max(1, (int)($it['qty'] ?? 1));
      if (($sold[$k] ?? 0) < $want) fail(400, 'ეს რაოდენობა უკვე დაბრუნებულია — ხელმისაწვდომია: ' . max(0, $sold[$k] ?? 0));
    }
  }

  $total = 0;
  foreach ($items as $it) {
    $qty = max(1, (int)($it['qty'] ?? 1));
    $price = max(0, (float)($it['unitPrice'] ?? 0));
    $total += $qty * $price;
  }
  if ($isReturn) $total = -$total;

  $pdo->beginTransaction();
  try {
    $st = $pdo->prepare('INSERT INTO sales (employee_id, total, payment, customer_phone, note, ref_sale_id) VALUES (?,?,?,?,?,?)');
    $st->execute([
      $emp['id'], round($total, 2), $payment,
      substr(trim($in['customerPhone'] ?? ''), 0, 32),
      substr(trim($in['note'] ?? ''), 0, 255),
      $isReturn ? $refSaleId : null,
    ]);
    $saleId = (int)$pdo->lastInsertId();

    $sti = $pdo->prepare('INSERT INTO sale_items (sale_id, product_id, product_name, part_number, qty, unit_price) VALUES (?,?,?,?,?,?)');
    $invUp   = $pdo->prepare('INSERT INTO inventory (product_id, qty) VALUES (?,?)
                              ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)');
    $mv = $pdo->prepare('INSERT INTO stock_movements (employee_id, product_id, product_name, part_number, type, qty, note) VALUES (?,?,?,?,?,?,?)');
    foreach ($items as $it) {
      $pid = substr((string)($it['productId'] ?? ''), 0, 64);
      $name = substr((string)($it['name'] ?? ''), 0, 255);
      $pn = substr((string)($it['partNumber'] ?? ''), 0, 64);
      $qty = max(1, (int)($it['qty'] ?? 1));
      $sti->execute([$saleId, $pid, $name, $pn, $qty, max(0, (float)($it['unitPrice'] ?? 0))]);
      if ($pid !== '' && $pid !== 'custom') {
        // overselling drives the balance negative on purpose — it flags a
        // miscount instead of silently stopping at 0
        $invUp->execute([$pid, $isReturn ? $qty : -$qty]);
        $mv->execute([
          $emp['id'], $pid, $name, $pn,
          $isReturn ? 'return' : 'sale',
          $isReturn ? $qty : -$qty,
          $isReturn ? "return of sale #$refSaleId" : "sale #$saleId",
        ]);
      }
    }
    $pdo->commit();
  } catch (Throwable $e) {
    $pdo->rollBack();
    fail(500, 'Failed to save sale');
  }
  ok(['saleId' => $saleId, 'total' => round($total, 2)]);
}

// ── GET: recent sales with items ─────────────────────────────────────────────
$limit = min(200, max(1, (int)($_GET['limit'] ?? 50)));
$sales = $pdo->prepare(
  'SELECT s.id, s.total, s.payment, s.customer_phone AS customerPhone, s.note,
          s.ref_sale_id AS refSaleId, s.created_at AS createdAt, e.display_name AS employee
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
  foreach ($sti->fetchAll() as $it) {
    $it['qty'] = (int)$it['qty'];
    $it['unitPrice'] = (float)$it['unitPrice'];
    $byId[$it['sale_id']][] = $it;
  }
  foreach ($rows as &$r) {
    $r['items'] = $byId[$r['id']] ?? [];
    $r['total'] = (float)$r['total'];
    $r['id'] = (int)$r['id'];
    // legacy returns (before ref_sale_id existed) carried the id in the note
    if ($r['refSaleId'] === null && $r['total'] < 0 && preg_match('/#(\d+)/u', (string)$r['note'], $m)) {
      $r['refSaleId'] = (int)$m[1];
    } elseif ($r['refSaleId'] !== null) {
      $r['refSaleId'] = (int)$r['refSaleId'];
    }
  }
}
ok(['sales' => $rows]);
