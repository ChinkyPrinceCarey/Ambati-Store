<?php
date_default_timezone_set('Asia/Kolkata');

require_once 'define_defaults.php';

//HOSTINGER
$server = DB_SERVER;
$username = DB_USERNAME;
$password = DB_PASSWORD;
$dbname = DB_DBNAME;

$conn = new PDO("mysql:host=".$server.";dbname=".$dbname, $username,$password);
$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$conn->setAttribute(PDO::ATTR_AUTOCOMMIT,0);
 
if (!$conn) {
	die("Connection failed: " . $conn->connect_error);
}

require_once 'pdo_sql_queries.php';

?>