<?php
require __DIR__ . '/db.php';

// Site content store — catalog, products, models, generations, cars, settings.
// These used to live only in each browser's localStorage; storing them here
// makes admin edits visible to every visitor on every device.
//
//   GET  /api/content.php            → public read of all content
//                                       { ok:true, content:{ "<key>": "<json string>", ... } }
//   POST /api/content.php            → admin write (Bearer token)
//        body: { key: "<key>", value: "<json string>" }
//
// The value is an opaque JSON string owned by the client — the server does not
// interpret it, it just stores and returns it verbatim.

$pdo->exec("CREATE TABLE IF NOT EXISTS site_content (
  k VARCHAR(64) PRIMARY KEY,
  v LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
  $rows = $pdo->query("SELECT k, v FROM site_content")->fetchAll();
  $content = [];
  foreach ($rows as $r) $content[$r['k']] = $r['v'];
  ok(['content' => $content]);
}

if ($method === 'POST') {
  $me = check_token(bearer_token(), $CFG, $pdo);
  if ($me['role'] !== 'admin') fail(403, 'მხოლოდ ადმინისტრატორისთვის');

  $body = body_json();
  $key = $body['key'] ?? '';
  if (!is_string($key) || !preg_match('/^[a-z0-9_]+$/', $key) || strlen($key) > 64) {
    fail(400, 'invalid key');
  }
  if (!array_key_exists('value', $body)) fail(400, 'missing value');

  $value = $body['value'];
  if (!is_string($value)) $value = json_encode($value, JSON_UNESCAPED_UNICODE);

  $st = $pdo->prepare(
    "INSERT INTO site_content (k, v) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE v = VALUES(v)"
  );
  $st->execute([$key, $value]);
  ok();
}

fail(405, 'Method not allowed');
