<?php
$database_server_mode = "beta";

if($database_server_mode == "production"){
    //server production database configuration
    define("DB_SERVER", "217.21.88.3");
    define("DB_USERNAME", "u916003822_mickey_admin");
    define("DB_PASSWORD", "1@Passwordtrue");
    define("DB_DBNAME", "u916003822_ambati_sms");
}else{
    //server beta database configuration
    define("DB_SERVER", "localhost");
    define("DB_USERNAME", "u916003822_mickey_beta");
    define("DB_PASSWORD", "123@Passwordtrue");
    define("DB_DBNAME", "u916003822_ambati_beta");
}

//## default directories ## //
define("BASE_DIR", "C:/wamp64/www/ambati_sms/v2");
define("LIB_DIR", BASE_DIR . "/lib");
define("NAVIGATION_FILE", LIB_DIR . "/navigation_map.json");
define("UPLOADS_DIRNAME", "uploads");
define("UPLOADS_DIR", "/" . UPLOADS_DIRNAME);

define("HOST_BASE_API", "http://localhost/ambati_sms/v2");
define("LIB_BASE_API", HOST_BASE_API . "/lib");
define("REMOTE_SERVER_API_ENDPOINT", "https://ambatitastyfoods.com/lib");
define("REMOTE_SERVER_ITEMS_API_ENDPOINT", REMOTE_SERVER_API_ENDPOINT . "/items.php");
define("REMOTE_SERVER_CUSTOMERS_API_ENDPOINT", REMOTE_SERVER_API_ENDPOINT . "/customers.php");
define("REMOTE_SERVER_ORDERS_API_ENDPOINT", REMOTE_SERVER_API_ENDPOINT . "/orders.php");

//fields config
$fields_defination = json_decode(file_get_contents(LIB_DIR . '/fields_defination.json'), true);
foreach($fields_defination as $field_def){
    define($field_def['variable'], $field_def);
}
?>