<?php
/**
 * simple method to encrypt or decrypt a plain text string
 * initialization vector(IV) has to be the same when encrypting and decrypting
 * 
 * @param string $action: can be 'encrypt' or 'decrypt'
 * @param string $string: string to encrypt or decrypt
 *
 * @return string
 */
function encrypt_decrypt($action, $string) {
    $output = false;

    $encrypt_method = "AES-256-CBC";
    $secret_key = 'This is my secret key';
    $secret_iv = 'This is my secret iv';

    // hash
    $key = hash('sha256', $secret_key);
    
    // iv - encrypt method AES-256-CBC expects 16 bytes - else you will get a warning
    $iv = substr(hash('sha256', $secret_iv), 0, 16);

    if ( $action == 'encrypt' ) {
        $output = openssl_encrypt($string, $encrypt_method, $key, 0, $iv);
        $output = base64_encode($output);
    } else if( $action == 'decrypt' ) {
        $output = openssl_decrypt(base64_decode($string), $encrypt_method, $key, 0, $iv);
    }

    return $output;
}

function get_variable_value($_arr, $_str){
    $currly_var_pattern = '/(?<={)(\w+)(?=})/';
    if(preg_match_all($currly_var_pattern, $_str, $currly_variables)){
      $currly_variables = array_shift($currly_variables);
  
      foreach($currly_variables as $currly_variable){
        $currly_value = null;
        if(array_key_exists($currly_variable, $_arr)){
          $currly_value = $_arr[$currly_variable];
          $_str = str_replace('{'. $currly_variable .'}', $currly_value, $_str);
        }
      }
  
      if(preg_match_all($currly_var_pattern, $_str, $currly_variables)){
        $_str = get_variable_value($_arr, $_str);
      }
    }
  
    return $_str;
}
?>
<?php
$ENV_STR_ENCRYPTED = file_get_contents('../.env');
$ENV_STR = encrypt_decrypt("decrypt", $ENV_STR_ENCRYPTED);
$ALL_ENV = json_decode($ENV_STR, true);
$SERVER_MODE = $ALL_ENV['SERVER_MODE'];
$ENV = $ALL_ENV[$SERVER_MODE];

$VARIABLES_STR = file_get_contents('../variables.json');
$ALL_VARIABLES = json_decode($VARIABLES_STR, true);
$VARIABLES_SERVER_MODE = $ALL_VARIABLES['SERVER_MODE'];
$VARIABLES = $ALL_VARIABLES[$VARIABLES_SERVER_MODE];
$VARIABLES['BASE_DIR'] = $VARIABLES['APP']['BASE_DIR'];

define("DB_SERVER", $ENV['DB_SERVER']);
define("DB_USERNAME", $ENV['DB_USERNAME']);
define("DB_PASSWORD", $ENV['DB_PASSWORD']);
define("DB_DBNAME", $ENV['DB_DBNAME']);

//## default directories ## //
define("BASE_DIR", get_variable_value($VARIABLES, $VARIABLES['BASE_DIR']));
define("DESKTOP_BASE_DIR", get_variable_value($VARIABLES, $VARIABLES['DESKTOP_BASE_DIR']));
define("APP_BASE_DIR", get_variable_value($VARIABLES, $VARIABLES['APP_BASE_DIR']));
define("LIB_DIR", get_variable_value($VARIABLES, $VARIABLES['LIB_DIR']));
define("NAVIGATION_FILE", get_variable_value($VARIABLES, $VARIABLES['NAVIGATION_FILE']));
define("UPLOADS_DIRNAME", get_variable_value($VARIABLES, $VARIABLES['UPLOADS_DIRNAME']));
define("UPLOADS_DIR", get_variable_value($VARIABLES, $VARIABLES['UPLOADS_DIR']));


//fields config
$fields_defination = array();
$fields_defination_path = LIB_DIR . '/fields_defination.json';
if(file_exists($fields_defination_path)){
    $fields_defination = json_decode(file_get_contents($fields_defination_path), true);
    foreach($fields_defination as $field_def){
        define($field_def['variable'], $field_def);
    }
}
?>