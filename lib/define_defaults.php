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
define("UPLOADS_DIR", "../uploads");

define("HOST_BASE_API", "http://localhost/ambati_sms/v2");
define("LIB_BASE_API", HOST_BASE_API . "/lib");
//define("SEND_BASE_API", "http://localhost:64");

//fields config
$fields_defination = json_decode(file_get_contents(LIB_DIR . '/fields_defination.json'), true);
foreach($fields_defination as $field_def){
    define($field_def['variable'], $field_def);
}
?>