<?php
require __DIR__ . '/db.php';

// Product image store. Photos used to be embedded in the catalog JSON as
// base64 text; saving them as real files keeps the catalog small (fast first
// load, no browser-storage limit) and gives every image an SEO-friendly name.
//
//   POST /api/upload.php   (admin Bearer token)
//        body: {
//          dataUrl:    "data:image/jpeg;base64,...",
//          partNumber: "1750101-S0-B",         // used for the file name
//          productId:  "adm_x…",               // used for the file name
//          replaces:   "old-file.jpg"          // optional: previous file to delete
//        }
//        → { ok:true, url:"api/uploads/1750101-s0-b-x….jpg" }

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method !== 'POST') fail(405, 'Method not allowed');

$me = check_token(bearer_token(), $CFG, $pdo);
if ($me['role'] !== 'admin') fail(403, 'მხოლოდ ადმინისტრატორისთვის');

$body = body_json();
$dataUrl = $body['dataUrl'] ?? '';
if (!is_string($dataUrl) || !preg_match('#^data:image/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$#', $dataUrl, $m)) {
  fail(400, 'invalid image data');
}
$raw = base64_decode($m[2], true);
if ($raw === false) fail(400, 'corrupt image data');
if (strlen($raw) > 3 * 1024 * 1024) fail(413, 'image too large (max 3MB)');

// the payload must really be the image type it claims to be
$magicOk =
  substr($raw, 0, 3) === "\xFF\xD8\xFF" ||                            // jpeg
  substr($raw, 0, 8) === "\x89PNG\r\n\x1a\n" ||                       // png
  (substr($raw, 0, 4) === 'RIFF' && substr($raw, 8, 4) === 'WEBP');   // webp
if (!$magicOk) fail(400, 'not an image');
$ext = ['jpeg' => 'jpg', 'png' => 'png', 'webp' => 'webp'][$m[1]];

$dir = __DIR__ . '/uploads';
if (!is_dir($dir) && !@mkdir($dir, 0755, true)) fail(500, 'uploads dir not writable');

// Defense-in-depth: images are served as static files, but nothing in this
// folder may ever run as a script (in case the validation above regresses).
$htaccess = "$dir/.htaccess";
if (!is_file($htaccess)) {
  @file_put_contents($htaccess,
    "<IfModule mod_php.c>\n  php_admin_flag engine off\n</IfModule>\n" .
    "<IfModule mod_php7.c>\n  php_admin_flag engine off\n</IfModule>\n" .
    "<IfModule mod_php8.c>\n  php_admin_flag engine off\n</IfModule>\n" .
    "<FilesMatch \"\\.(php|phtml|phar|cgi|pl|py|sh|htaccess)$\">\n  Require all denied\n</FilesMatch>\n"
  );
}

$slug = function (string $s): string {
  $s = strtolower($s);
  $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? '';
  return trim($s, '-');
};

// name: <part-number>-<product-id>-<time>.jpg — readable and unique; the time
// suffix makes a re-uploaded photo a new URL so cached copies never go stale
$part = $slug((string)($body['partNumber'] ?? ''));
$pid  = substr($slug(str_replace('adm_', '', (string)($body['productId'] ?? ''))), 0, 12);
$base = trim(($part !== '' ? $part : 'product') . '-' . ($pid !== '' ? $pid : bin2hex(random_bytes(4))), '-');
$name = $base . '-' . base_convert((string)time(), 10, 36) . '.' . $ext;

if (file_put_contents("$dir/$name", $raw) === false) fail(500, 'write failed');

// re-upload: drop the product's previous file so orphans don't pile up
$old = basename((string)($body['replaces'] ?? ''));
if ($old !== '' && $old !== $name && preg_match('/^[a-z0-9._-]+$/', $old) && is_file("$dir/$old")) {
  @unlink("$dir/$old");
}

ok(['url' => "api/uploads/$name"]);
