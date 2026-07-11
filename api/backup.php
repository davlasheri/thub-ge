<?php
require __DIR__ . '/db.php';

$me = check_token(bearer_token(), $CFG, $pdo);
if ($me['role'] !== 'admin') fail(403, 'მხოლოდ ადმინისტრატორისთვის');

// site_content holds the whole editable catalog (products, categories, models,
// cars, settings) — it MUST be in the backup or a restore loses the catalogue.
// Note: uploaded product photos live as files under api/uploads/ and are not in
// this DB dump; include that folder in the hosting's file backup separately.
$TABLES = ['employees', 'sales', 'sale_items', 'inventory', 'stock_movements', 'cash_movements', 'site_content'];

$dump = ['created' => date('c'), 'version' => 1, 'tables' => []];
foreach ($TABLES as $t) {
  $dump['tables'][$t] = $pdo->query("SELECT * FROM `$t`")->fetchAll();
}
$json = json_encode($dump, JSON_UNESCAPED_UNICODE);

// mode=download: stream the dump to the admin's browser
if (($_GET['mode'] ?? '') === 'download') {
  header('Content-Type: application/json; charset=utf-8');
  header('Content-Disposition: attachment; filename="thub-backup-' . date('Y-m-d-His') . '.json"');
  echo $json;
  exit;
}

// default: write a rotated, gzipped backup on the server (not web-accessible)
$dir = __DIR__ . '/backups';
if (!is_dir($dir)) {
  mkdir($dir, 0755, true);
  file_put_contents("$dir/.htaccess", "Require all denied\n");
  file_put_contents("$dir/index.html", '');
}

$file = $dir . '/backup-' . date('Y-m-d-His') . '.json.gz';
if (file_put_contents($file, gzencode($json, 9)) === false) fail(500, 'ბექაფის ჩაწერა ვერ მოხერხდა');

// keep the newest 14
$files = glob($dir . '/backup-*.json.gz');
rsort($files);
foreach (array_slice($files, 14) as $old) @unlink($old);

$rows = array_sum(array_map('count', $dump['tables']));
ok(['file' => basename($file), 'rows' => $rows, 'kept' => min(count($files), 14)]);
