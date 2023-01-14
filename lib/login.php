<?php
require_once('define_defaults.php');
require_once('pdo_config.php');
include_once('functions.php');
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
$return['info'] = "login.php: ";
$return['extra_info'] = "";

//$return['post'] = $_POST;

if(isset($_POST['data']) && !empty($_POST['data'])){
    if(isset($_POST['action']) && !empty($_POST['action'])){
        $action = $_POST['action'];
        $data = $_POST['data'];
        $query_table = "users";

        if($action == "read"){
            $username_def = USERNAME;
            $password_def = PASSWORD;

            $username_def['validation'] = null;
            $password_def['validation'] = null;

            $fields_def = array($username_def, $password_def);
            $fields_data = validate_fields($data, $fields_def);

            if($fields_data['result']){
                $username = $fields_data['data']['username'];
                $password = $fields_data['data']['password'];

                $where_clause = array("username=$username", "password=$password");

                $fetched_record = fetchRecord($query_table, null, $where_clause);
                if($fetched_record['result']){
                    $return['result'] = true;
                    $return['info'] .= "fetched record ";
                    $return['data'] = $fetched_record['data'];
                    
                    $return['title'] = "Login Successful";
                    $return['content'] = "You will be redirected to dashboard in a moment...";
                }else{
                    $return['info'] .= "error fetching record " . $fetched_record['info'];
                    $return['extra_info'] .= $fetched_record['additional_info'];

                    $return['title'] = "Login Failed";
                    $return['content'] = "username or the password is incorrect";
                }
            }else{
                $return['info'] .= "invalid data " . $fields_data['info'];
            }
        }
    }else{
        $return['info'] .= "empty action";    
    }
}else{
    $return['info'] .= "invalid request";
}

$json_return = json_encode($return);
print_r($json_return);
?>