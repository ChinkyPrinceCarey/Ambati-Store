<?php
require_once('define_defaults.php');
require_once('functions.php');
?>
<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token');

header('Content-Type: application/json');
?>
<?php
$return = array();
$return['result'] = false;
$return['info'] = "navigation.php: ";
$return['extra_info'] = "";

if(isset($_POST['user_role']) && !empty($_POST['user_role'])){
    $user_role = $_POST['user_role'];

    $raw_navigation = json_decode(file_get_contents(NAVIGATION_FILE), true);
    if($raw_navigation){
        $return['data'] = filterNavItems($raw_navigation, $user_role);
		
		$return['result'] = true;
		$return['info'] .= "navigation has been loaded";
    }else{
        $return['info'] .= "error reading navigation map file";
    }
}else{
    $return['info'] .= "invalid request";
}

function shouldExecludeItem($arr, $requested_user_role){
    foreach($arr as $item => $value){
        if(!in_array($arr['access'], $requested_user_role)){

        }
    }
}

//sleep(5); //just for to see preloader and the stuff on frontend

$json_return = json_encode($return);
print_r($json_return);
?>