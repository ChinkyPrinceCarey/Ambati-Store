<?php
//database configuration
define("DB_SERVER", "localhost");
define("DB_USERNAME", "root");
define("DB_PASSWORD", "");
define("DB_DBNAME", "ambati_sms_v2"); //ambati_sms_v2

//## default directories ## //
define("BASE_DIR", "C:/wamp64/www/ambati_sms/v2");
define("LIB_DIR", BASE_DIR . "/lib");
define("NAVIGATION_FILE", LIB_DIR . "/navigation_map.json");
define("UPLOADS_DIRNAME", "uploads");
define("UPLOADS_DIR", "/" . UPLOADS_DIRNAME);

define("HOST_BASE_API", "http://localhost/ambati_sms/v2");
define("LIB_BASE_API", HOST_BASE_API . "/lib");
define("REMOTE_SERVER_API_ENDPOINT", "https://ambatitastyfoods.com/v2/lib");
define("REMOTE_SERVER_ITEMS_API_ENDPOINT", REMOTE_SERVER_API_ENDPOINT . "/items.php");
define("REMOTE_SERVER_CUSTOMERS_API_ENDPOINT", REMOTE_SERVER_API_ENDPOINT . "/customers.php");
define("REMOTE_SERVER_ORDERS_API_ENDPOINT", REMOTE_SERVER_API_ENDPOINT . "/orders.php");

//fields config
$fields_defination = json_decode(file_get_contents(LIB_DIR . '/fields_defination.json'), true);
foreach($fields_defination as $field_def){
    define($field_def['variable'], $field_def);
}
?>