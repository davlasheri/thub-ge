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
if ($me['role'] !== 'admin') fail(403, 'მხოლოდ ადმინისტრატორს შეუძლია');

$in = body_json();
$action = $in['action'] ?? 'add';

// ── clear the whole movement history (admin): log purge only, stock unchanged ─
if ($action === 'clearAll') {
  $pdo->exec('DELETE FROM stock_movements');
  ok();
}

// ── update a movement (admin): qty change also corrects the inventory ────────
if ($action === 'update') {
  $id = (int)($in['id'] ?? 0);
  $st = $pdo->prepare('SELECT * FROM stock_movements WHERE id = ?');
  $st->execute([$id]);
  $m = $st->fetch();
  if (!$m) fail(404, 'ჩანაწერი ვერ მოიძებნა');

  $newQty = array_key_exists('qty', $in) ? (int)$in['qty'] : (int)$m['qty'];
  if ($newQty === 0) fail(400, 'რაოდენობა არ შეიძლება იყოს 0');
  $newType = isset($in['type']) && in_array($in['type'], ['purchase','disassembly','sale','return','adjustment'], true)
    ? $in['type'] : $m['type'];
  $newNote = array_key_exists('note', $in) ? substr(trim((string)$in['note']), 0, 255) : $m['note'];

  $pdo->beginTransaction();
  try {
    $delta = $newQty - (int)$m['qty'];
    if ($delta !== 0) {
      $pdo->prepare('INSERT INTO inventory (product_id, qty) VALUES (?,?)
                     ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)')
          ->execute([$m['product_id'], $delta]);
    }
    $pdo->prepare('UPDATE stock_movements SET qty = ?, type = ?, note = ? WHERE id = ?')
        ->execute([$newQty, $newType, $newNote, $id]);
    $pdo->commit();
  } catch (Throwable $e) {
    $pdo->rollBack();
    fail(500, 'ვერ შეინახა');
  }
  ok();
}

// ── delete a movement (admin), reversing its inventory effect ────────────────
if ($action === 'delete') {
  $id = (int)($in['id'] ?? 0);
  $st = $pdo->prepare('SELECT * FROM stock_movements WHERE id = ?');
  $st->execute([$id]);
  $m = $st->fetch();
  if (!$m) fail(404, 'ჩანაწერი ვერ მოიძებნა');

  $pdo->beginTransaction();
  try {
    $pdo->prepare('INSERT INTO inventory (product_id, qty) VALUES (?,?)
                   ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)')
        ->execute([$m['product_id'], -(int)$m['qty']]);
    $pdo->prepare('DELETE FROM stock_movements WHERE id = ?')->execute([$id]);
    $pdo->commit();
  } catch (Throwable $e) {
    $pdo->rollBack();
    fail(500, 'წაშლა ვერ მოხერხდა');
  }
  ok();
}

// POST: manual stock adjustment only — purchase/disassembly intake was removed,
// products and their quantities are managed from the admin panel
$type = 'adjustment';
$items = $in['items'] ?? [];
$note = substr(trim($in['note'] ?? ''), 0, 255);
if (!is_array($items) || count($items) === 0) fail(400, 'No items');

$pdo->beginTransaction();
try {
  $invUp = $pdo->prepare('INSERT INTO inventory (product_id, qty) VALUES (?,?)
                          ON DUPLICATE KEY UPDATE qty = qty + VALUES(qty)');
  $mv = $pdo->prepare('INSERT INTO stock_movements (employee_id, product_id, product_name, part_number, type, qty, note) VALUES (?,?,?,?,?,?,?)');
  foreach ($items as $it) {
    $pid = substr((string)($it['productId'] ?? ''), 0, 64);
    if ($pid === '') continue;
    $qty = (int)($it['qty'] ?? 0);
    if ($qty === 0) continue;
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
