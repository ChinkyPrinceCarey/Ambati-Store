<?php
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
$VARIABLES_STR = file_get_contents('../../variables.json');
$ALL_VARIABLES = json_decode($VARIABLES_STR, true);
$VARIABLES_SERVER_MODE = $ALL_VARIABLES['SERVER_MODE'];
$VARIABLES = $ALL_VARIABLES[$VARIABLES_SERVER_MODE];
$VARIABLES['BASE_DIR'] = $VARIABLES['DESKTOP']['BASE_DIR'];

//## default directories ## //
define("BASE_DIR", get_variable_value($VARIABLES, $VARIABLES['BASE_DIR']));
define("DESKTOP_BASE_DIR", get_variable_value($VARIABLES, $VARIABLES['DESKTOP_BASE_DIR']));
define("APP_BASE_DIR", get_variable_value($VARIABLES, $VARIABLES['APP_BASE_DIR']));
define("LIB_DIR", get_variable_value($VARIABLES, $VARIABLES['LIB_DIR']));
define("NAVIGATION_FILE", get_variable_value($VARIABLES, $VARIABLES['NAVIGATION_FILE']));
define("UPLOADS_DIRNAME", get_variable_value($VARIABLES, $VARIABLES['UPLOADS_DIRNAME']));
define("UPLOADS_DIR", get_variable_value($VARIABLES, $VARIABLES['UPLOADS_DIR']));
?>