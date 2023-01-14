<?php

//var_dump(file_get_contents("../uploads/20220801103928_thumb.jpg"));
$name = "Mickey";
$app_version = (float)'1.1';

//var_dump($app_version < 2.0 ? true : false);

echo "<pre>"; print_r($_COOKIE['APP_VERSION']); echo "</pre>";
//echo $_COOKIE['APP_VERSION'];

?>