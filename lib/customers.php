<?php
require_once('define_defaults.php');
require_once('pdo_config.php');
include_once('functions.php');
?>
<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token');

header('Content-Type: application/json; charset=utf-8');
?>
<?php
$return = array();
$return['result'] = false;
$return['info'] = "customers.php: ";
$return['data'] = array();
$return['additional_info'] = "";

if(isset($_POST['data']) && !empty($_POST['data'])){
    if(isset($_POST['action']) && !empty($_POST['action'])){
        $action = $_POST['action'];
        $query_table = "customers";

        $id = getKeyinArr($_POST['data']);

        $default_where_column = "id";
        $default_where_value = $id;
        $default_where = array("$default_where_column=$default_where_value");
        if($action == "create"){

            $_POST['data'][0]['username'] = $_POST['data'][0]['mobile_number'];
            $_POST['data'][0]['password'] = $_POST['data'][0]['mobile_number'];

            $fields_def = array(USERNAME, PASSWORD, NAME, MOBILE_NUMBER, ADDRESS);
            $fields_data = validate_fields($_POST['data'][0], $fields_def);

            if($fields_data['result']){
                $default_where_column = "username";
                $default_where_value = $fields_data['data']['username'];
                $default_where = array("$default_where_column=$default_where_value");

                $query_type = "insert";
                //$query_table defined earlier
                $query_columns = array(
                                    "username",
                                    "password",
                                    "name",
                                    "mobile_number",
                                    "address",
                                    "is_allowed"
                                );
                $query_values = array(
                                    $fields_data['data']['username'],
                                    $fields_data['data']['password'],
                                    $fields_data['data']['name'],
                                    $fields_data['data']['mobile_number'],
                                    $fields_data['data']['address'],
                                    $fields_data['data']['is_allowed']
                                );

                $insert_query = get_query($query_type, $query_table, $query_columns, $query_values);

                $insert_result = insert_query($insert_query);
                
                if($insert_result['result']){
                    $inserted_record = fetchRecord($query_table, null, $default_where, "count_slno");
                    $return['info'] .= "record inserted ";
                    if($inserted_record['result']){
                        $return['result'] = true;
                        $return['info'] .= "and fetched record";
                        $return['data'] = $inserted_record['data'];
                    }else{
                        $return['info'] .= "but " . $inserted_record['info'];
                        $return['additional_info'] .= $inserted_record['additional_info'];
                    }
                }else{
                    $return['info'] .= "error inserting the record ";
                    $return['additional_info'] .= $insert_result['additional_information'];

                    //debug
                    $return['query'] = $insert_query;
                }
            }else{
                $return['info'] .= "invalid data " . $fields_data['info'];
            }
        }elseif($action == "edit"){
            $data = $_POST['data'];

            $slno = $data[$id]['slno'];
            
            $fields_def = array(USERNAME, PASSWORD, NAME, MOBILE_NUMBER, ADDRESS);
            $fields_data = validate_fields($data[$id], $fields_def);
            if($fields_data['result']){
                $query_set = array();
                foreach($fields_data['data'] as $set_column => $set_value){
                    if(!($set_column == "id" || $set_column == "slno")){
                        $query_set[] = "$set_column=$set_value";
                    }
                }
                
                $query_type = "update";
                
                $update_query = get_query($query_type, $query_table, $query_set, $default_where);
                $return['query'] = $update_query; //for debugging

                $update_result = update_query($update_query);

                if($update_result['result']){
                    $updated_record = fetchRecord($query_table, null, $default_where, $slno);
                    $return['info'] .= "record updated ";
                    if($updated_record['result']){
                        $return['result'] = true;
                        $return['info'] .= "and fetched record ";
                        $return['data'] = $updated_record['data'];
                    }else{
                        $return['info'] .= "but " . $updated_record['info'];
                        $return['additional_info'] .= $updated_record['additional_info'];
                    }
                }else{
                    $return['info'] .= "error updating the record ";
                    $return['additional_info'] .= $update_result['additional_information'];

                    //debug
                    $return['query'] = $update_query;
                }
            }else{
                $return['info'] .= "invalid data " . $fields_data['info'];
            }
        }elseif($action == "remove"){
            $data = $_POST['data'];

            $query_where = array();
            foreach($data as $iter_data){
                //'cause we delete multiple rows at once
                $query_where[] = "id=" . $iter_data['id'];
            }
            
            $query_type = "delete_or_clause";
            //$query_table defined earlier
            $query_column = array("id"); //just not to keep empty 
            //$query_where defined just above

            $delete_query = get_query($query_type, $query_table, $query_column, $query_where);
            $return['query'] = $delete_query; //for debugging

            $delete_result = delete_query($delete_query);

            if($delete_result['result']){
                $return['result'] = true;
                $return['info'] .= count($query_where) . "record(s) deleted ";
                $return['data'] = array();
            }else{
                $return['info'] .= "error deleting the record ";
                $return['additional_info'] .= $delete_result['additional_information'];

                //debug
                $return['query'] = $delete_query;
            }
        }elseif($action == "fetch_all"){
            $fetched_all_records = fetchRecord($query_table);

            if($fetched_all_records['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
                $return['data'] = $fetched_all_records['data'];
            }else{
                $return['info'] .= $fetched_all_records['info'];
                $return['fetched'] = $fetched_all_records;
                //$return['additional_info'] .= $fetched_all_records['additional_info'];
            }
        }elseif($action == "fetch_specified"){
            $data = $_POST['data'];
            
            $manual_columns = array("password"); 
            $query_where = array(
                            "username=" . $data['username'] , 
                            "password=". $data['password'], 
                            "is_allowed=1"
                        );

            $fetched_all_records = fetchRecord($query_table, $manual_columns, $query_where);

            if($fetched_all_records['result']){
                $return['result'] = true;
                $return['info'] .= "fetched record ";
                $return['data'] = $fetched_all_records['data'];
            }else{
                $return['info'] .= $fetched_all_records['info'];
            }
        }else{
            $return['info'] .= "action: $action does not exist";
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