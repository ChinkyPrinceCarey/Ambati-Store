<?php
//database configuration
define("DB_SERVER", "103.117.212.217");
define("DB_USERNAME", "sanketma_mickey");
define("DB_PASSWORD", "1@Passwordtrue");
define("DB_DBNAME", "sanketma_ambati"); //ambati_sms_v2

//## default directories ## //
define("BASE_DIR", ".");
define("LIB_DIR", BASE_DIR . "/lib");
define("NAVIGATION_FILE", LIB_DIR . "/navigation_map.json");
define("UPLOADS_DIR", "../uploads");

define("HOST_BASE_API", "https://ambatitastyfoods.com");
define("LIB_BASE_API", HOST_BASE_API . "/lib");
//define("SEND_BASE_API", "http://localhost:64");

//fields config
$fields_defination = json_decode(file_get_contents('./fields_defination.json'), true);
foreach($fields_defination as $field_def){
    define($field_def['variable'], $field_def);
}
?>