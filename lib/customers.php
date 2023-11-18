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

            $fields_def = array(USERNAME, PASSWORD, NAME, MOBILE_NUMBER);
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
                                    "state_id",
                                    "district_id",
                                    "mandal_id",
                                    "village_id",
                                    "landmark",
                                    "address",
                                    "is_allowed"
                                );
                $query_values = array(
                                    $fields_data['data']['username'],
                                    $fields_data['data']['password'],
                                    $fields_data['data']['name'],
                                    $fields_data['data']['mobile_number'],
                                    $fields_data['data']['state_id'],
                                    $fields_data['data']['district_id'],
                                    $fields_data['data']['mandal_id'],
                                    $fields_data['data']['village_id'],
                                    $fields_data['data']['landmark'],
                                    $fields_data['data']['address'],
                                    $fields_data['data']['is_allowed']
                                );

                $insert_query = get_query($query_type, $query_table, $query_columns, $query_values);

                $insert_result = insert_query($insert_query);
                
                if($insert_result['result']){
                    $return['info'] .= "record inserted ";

                    $query_type = "custom";
                    $query_table = "customers";
                    $query_text = " SELECT NULL AS `slno`, `customers_full_data`.*, `states`.`state_name`, `districts`.`district_name`, `mandals`.`mandal_name`, `villages`.`village_name` 
                                    FROM `customers` AS `customers_full_data`
                                        LEFT JOIN (
                                            SELECT `state_id`, `state_name` FROM `address_state`
                                        ) AS `states` ON `customers_full_data`.`state_id` = `states`.`state_id`
                                        
                                        LEFT JOIN (
                                            SELECT `district_id`, `district_name` FROM `address_districts`
                                        ) AS `districts` ON `customers_full_data`.`district_id` = `districts`.`district_id`
                                        
                                        LEFT JOIN (
                                            SELECT `mandal_id`, `mandal_name` FROM `address_mandals`
                                        ) AS `mandals` ON `customers_full_data`.`mandal_id` = `mandals`.`mandal_id`
                                        
                                        LEFT JOIN (
                                            SELECT `village_id`, `village_name` FROM `address_villages`
                                        ) AS `villages` ON `customers_full_data`.`village_id` = `villages`.`village_id`
                                    WHERE `customers_full_data`.`$default_where_column` = '$default_where_value'
                                    ORDER BY `customers_full_data`.`id` ASC;
                                ";
                
                    $select_query = get_query($query_type, $query_table, $query_text);
                    $inserted_record = select_query($select_query);
                    
                    if($inserted_record['result']){
                        $return['result'] = true;
                        $return['info'] .= "and fetched record";
                        $return['data'] = $inserted_record['additional_data'];
                    }else{
                        $return['info'] .= $inserted_record['additional_information'];
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
                    $return['info'] .= "record updated ";

                    $query_type = "custom";
                    $query_table = "customers";
                    $query_text = " SELECT '$slno' AS `slno`, `customers_full_data`.*, `states`.`state_name`, `districts`.`district_name`, `mandals`.`mandal_name`, `villages`.`village_name` 
                                    FROM `customers` AS `customers_full_data`
                                        LEFT JOIN (
                                            SELECT `state_id`, `state_name` FROM `address_state`
                                        ) AS `states` ON `customers_full_data`.`state_id` = `states`.`state_id`
                                        
                                        LEFT JOIN (
                                            SELECT `district_id`, `district_name` FROM `address_districts`
                                        ) AS `districts` ON `customers_full_data`.`district_id` = `districts`.`district_id`
                                        
                                        LEFT JOIN (
                                            SELECT `mandal_id`, `mandal_name` FROM `address_mandals`
                                        ) AS `mandals` ON `customers_full_data`.`mandal_id` = `mandals`.`mandal_id`
                                        
                                        LEFT JOIN (
                                            SELECT `village_id`, `village_name` FROM `address_villages`
                                        ) AS `villages` ON `customers_full_data`.`village_id` = `villages`.`village_id`
                                    WHERE `customers_full_data`.`$default_where_column` = '$default_where_value'
                                    ORDER BY `customers_full_data`.`id` ASC;
                                ";
                
                    $select_query = get_query($query_type, $query_table, $query_text);
                    $updated_record = select_query($select_query);
                    
                    if($updated_record['result']){
                        $return['result'] = true;
                        $return['info'] .= "and fetched record ";
                        $return['data'] = $updated_record['additional_data'];
                    }else{
                        $return['info'] .= $updated_record['additional_information'];
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
            $query_type = "custom";
            $query_table = "customers";
            $query_text = " SELECT @slno:=@slno+1 AS `slno`, `customers_full_data`.*, `states`.`state_name`, `districts`.`district_name`, `mandals`.`mandal_name`, `villages`.`village_name` FROM `customers` AS `customers_full_data`
                                LEFT JOIN (
                                    SELECT `state_id`, `state_name` FROM `address_state`
                                ) AS `states` ON `customers_full_data`.`state_id` = `states`.`state_id`
                                
                                LEFT JOIN (
                                    SELECT `district_id`, `district_name` FROM `address_districts`
                                ) AS `districts` ON `customers_full_data`.`district_id` = `districts`.`district_id`
                                
                                LEFT JOIN (
                                    SELECT `mandal_id`, `mandal_name` FROM `address_mandals`
                                ) AS `mandals` ON `customers_full_data`.`mandal_id` = `mandals`.`mandal_id`
                                
                                LEFT JOIN (
                                    SELECT `village_id`, `village_name` FROM `address_villages`
                                ) AS `villages` ON `customers_full_data`.`village_id` = `villages`.`village_id`
                            ORDER BY `customers_full_data`.`id` ASC;
                         ";
        
            $select_query = get_query($query_type, $query_table, $query_text);
            $fetched_all_records = select_query($select_query, array("table" => "customers", "add_slno" => true));

            if($fetched_all_records['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
                $return['data'] = $fetched_all_records['additional_data'];
            }else{
                $return['info'] .= $fetched_all_records['additional_information'];
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
        }elseif($action == "fetch_address_fields"){
            $query_type = "select";
            $query_table = null;
            $query_columns = array();
            $where_values = array();
            $order_by = "";

            $type = $_POST['type'];
            
            switch($type){
                case 'district_id':
                    $query_table = "address_districts";
                    $state_id = getRequestArrayData($_POST['data'], 'state_id');
                    if($state_id){
                        $query_columns[] = "`district_id` AS `value`";
                        $query_columns[] = "`district_name` AS `label`";

                        $where_values[] = "state_id=" . $state_id;

                        $order_by = "ORDER BY `district_name` ASC";
                    }else{
                        $return['info'] .= "empty state_id ";
                    }
                    break;

                case 'mandal_id':
                    $query_table = "address_mandals";
                    $state_id = getRequestArrayData($_POST['data'], 'state_id');
                    if($state_id){
                        $where_values[] = "state_id=" . $state_id;
                    }else{
                        $return['info'] .= "empty state_id ";
                    }

                    $district_id = getRequestArrayData($_POST['data'], 'district_id');
                    if($district_id){
                        $query_columns[] = "`mandal_id` AS `value`";
                        $query_columns[] = "`mandal_name` AS `label`";

                        $where_values[] = "district_id=" . $district_id;

                        $order_by = "ORDER BY `mandal_name` ASC";
                    }else{
                        $return['info'] .= "empty district_id ";
                    }

                    break;
                
                
                case 'village_id':
                    $query_table = "address_villages";
                    $state_id = getRequestArrayData($_POST['data'], 'state_id');
                    if($state_id){
                        $where_values[] = "state_id=" . $state_id;
                    }else{
                        $return['info'] .= "empty state_id ";
                    }

                    $district_id = getRequestArrayData($_POST['data'], 'district_id');
                    if($district_id){
                        $where_values[] = "district_id=" . $district_id;
                    }else{
                        $return['info'] .= "empty district_id ";
                    }

                    $mandal_id = getRequestArrayData($_POST['data'], 'mandal_id');
                    if($mandal_id){
                        $query_columns[] = "`village_id` AS `value`";
                        $query_columns[] = "`village_name` AS `label`";

                        $where_values[] = "mandal_id=" . $mandal_id;

                        $order_by = "ORDER BY `village_name` ASC";
                    }else{
                        $return['info'] .= "empty mandal_id ";
                    }

                    break;
            }

            if($query_table && count($where_values) && count($query_columns)){
                $select_query = get_query($query_type, $query_table, $query_columns, $where_values, $order_by);
                $select_result = select_query($select_query);
                if($select_result['result']){
                    $return['result'] = true;
                    $return['info'] .= "fetched data";
                    $return['data'] = $select_result['additional_data'];
                }else{
                    $return['info'] .= $select_result['additional_information'];
                }
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