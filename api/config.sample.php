<?php
// TeslaHub.ge API configuration.
// Copy this file to config.php (same folder) and fill in your MySQL details
// from cPanel -> MySQL Databases. config.php is never overwritten by deploys.
return [
  'db_host'   => 'localhost',
  'db_name'   => 'YOUR_DB_NAME',      // e.g. thubge_shop
  'db_user'   => 'YOUR_DB_USER',      // e.g. thubge_app
  'db_pass'   => 'YOUR_DB_PASSWORD',
  // Any long random string; used to sign login tokens. Change it once, then leave it.
  'secret'    => 'CHANGE_ME_TO_A_LONG_RANDOM_STRING',
  // Sessions last this many hours after login.
  'token_hours' => 12,
  // Password for the first 'admin' account. Used ONLY on a fresh install when no
  // employees exist yet — it never changes an existing admin. Leave empty to have
  // a random one written to api/private/initial-admin-password.txt instead.
  'admin_initial_password' => '',
];
