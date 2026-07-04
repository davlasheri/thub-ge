<?php
require __DIR__ . '/db.php';

$me = check_token(bearer_token(), $CFG, $pdo);
if ($me['role'] !== 'admin') fail(403, 'სტატისტიკა ხელმისაწვდომია მხოლოდ ადმინისტრატორისთვის');

$days = min(90, max(7, (int)($_GET['days'] ?? 14)));

// Daily revenue for the last N days (including zero days, filled client-side)
$daily = $pdo->prepare(
  "SELECT DATE(created_at) AS day, SUM(total) AS revenue, COUNT(*) AS sales
   FROM sales
   WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
   GROUP BY DATE(created_at) ORDER BY day"
);
$daily->execute([$days - 1]);

// Headline aggregates
function agg(PDO $pdo, string $where): array {
  $q = $pdo->query("SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS sales FROM sales WHERE $where")->fetch();
  return ['revenue' => (float)$q['revenue'], 'sales' => (int)$q['sales']];
}
$today = agg($pdo, 'DATE(created_at) = CURDATE()');
$week  = agg($pdo, 'created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)');
$month = agg($pdo, 'created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)');
$all   = agg($pdo, '1=1');

// Top products, last 30 days
$top = $pdo->query(
  "SELECT si.product_name AS name, si.part_number AS partNumber,
          SUM(si.qty) AS qty, SUM(si.qty * si.unit_price) AS revenue
   FROM sale_items si JOIN sales s ON s.id = si.sale_id
   WHERE s.created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
   GROUP BY si.product_name, si.part_number
   ORDER BY revenue DESC LIMIT 8"
)->fetchAll();

// Payment split, last 30 days
$pay = $pdo->query(
  "SELECT payment, COALESCE(SUM(total),0) AS revenue, COUNT(*) AS sales
   FROM sales WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
   GROUP BY payment"
)->fetchAll();

// Per-employee breakdown for the requested window
$byEmp = $pdo->prepare(
  "SELECT e.display_name AS employee, COALESCE(SUM(s.total),0) AS revenue, COUNT(*) AS sales,
          COALESCE(AVG(s.total),0) AS avgTicket
   FROM sales s JOIN employees e ON e.id = s.employee_id
   WHERE s.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
   GROUP BY e.id, e.display_name ORDER BY revenue DESC"
);
$byEmp->execute([$days - 1]);

ok([
  'daily' => array_map(fn($r) => [
    'day' => $r['day'], 'revenue' => (float)$r['revenue'], 'sales' => (int)$r['sales'],
  ], $daily->fetchAll()),
  'today' => $today, 'week' => $week, 'month' => $month, 'all' => $all,
  'topProducts' => array_map(fn($r) => [
    'name' => $r['name'], 'partNumber' => $r['partNumber'],
    'qty' => (int)$r['qty'], 'revenue' => (float)$r['revenue'],
  ], $top),
  'payments' => array_map(fn($r) => [
    'payment' => $r['payment'], 'revenue' => (float)$r['revenue'], 'sales' => (int)$r['sales'],
  ], $pay),
  'byEmployee' => array_map(fn($r) => [
    'employee' => $r['employee'], 'revenue' => (float)$r['revenue'],
    'sales' => (int)$r['sales'], 'avgTicket' => (float)$r['avgTicket'],
  ], $byEmp->fetchAll()),
]);
