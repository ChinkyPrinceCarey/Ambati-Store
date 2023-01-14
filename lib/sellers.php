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
$return['info'] = "sellers.php: ";
$return['additional_info'] = "";

if(isset($_POST['data']) && !empty($_POST['data'])){
    if(isset($_POST['action']) && !empty($_POST['action'])){
        $action = $_POST['action'];
        $query_table = "sellers";

        $id = getKeyinArr($_POST['data']);

        $default_where_column = "id";
        $default_where_value = $id;
        $default_where = array("$default_where_column=$default_where_value");
        if($action == "create"){

            $id_query_type = "custom";
            $id_query_table = $query_table;
            $id_query = "SELECT MAX(id) AS `id` FROM $query_table";

            $id_select = get_query($id_query_type, $id_query_table, $id_query);
            $id_result = select_query($id_select);

            if($id_result['result']){
                //echo "<pre>"; print_r($id_result); echo "</pre>";
                $id_row = $id_result['additional_data'][0]['id'];
                $id_row = $id_row + 1;
                $_POST['data'][0]['seller_id'] = "s$id_row";

                $fields_def = array(SELLER_ID, SELLER_NAME, SELLER_MOBILE_NUMBER);
                $fields_data = validate_fields($_POST['data'][0], $fields_def);

                if($fields_data['result']){
                    $default_where_column = "seller_id";
                    $default_where_value = $fields_data['data']['seller_id'];
                    $default_where = array("$default_where_column=$default_where_value");

                    $query_type = "insert";
                    //$query_table defined earlier
                    $query_columns = array(
                                        "seller_id",
                                        "seller_name",
                                        "seller_mobile_number"
                                    );
                    $query_values = array(
                                        $fields_data['data']['seller_id'],
                                        $fields_data['data']['seller_name'],
                                        $fields_data['data']['seller_mobile_number']
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

            }else{
                $return['id_info'] .= "error inserting the record ";
                $return['id_additional_info'] .= $insert_result['additional_information'];
            }
        }elseif($action == "edit"){
            $data = $_POST['data'];

            $slno = $data[$id]['slno'];
            
            $fields_def = array(SELLER_ID, SELLER_NAME, SELLER_MOBILE_NUMBER);
            $fields_data = validate_fields($data[$id], $fields_def);
            if($fields_data['result']){
                $query_set = array();
                foreach($fields_data['data'] as $set_column => $set_value){
                    if(!($set_column == "id" || $set_column == "slno")){
                        $query_set[] = "$set_column=$set_value";
                    }
                }
                
                $query_type = "update";
                //$query_table defined earlier
                //$query_set defined just above
                //$default_where will be used;

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

            //echo "<pre>"; print_r($fetched_all_records); echo "</pre>";

            if($fetched_all_records['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
                $return['data'] = $fetched_all_records['data'];
            }else{
                $return['result'] = true;
                $return['data'] = array();
                $return['info'] .= $fetched_all_records['info'];
                //$return['additional_info'] .= $fetched_all_records['additional_info'];
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