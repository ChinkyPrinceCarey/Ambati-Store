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
$return['info'] = "items.php: ";
$return['additional_info'] = "";

if(isset($_POST['data']) && !empty($_POST['data'])){
    if(isset($_POST['action']) && !empty($_POST['action'])){
        $action = $_POST['action'];
        $query_table = "items";

        $manual_key_names = ['slno', 'making_cost', 'retailer_cost', 'available_stock'];

        $id = getKeyinArr($_POST['data']);

        $default_where_column = "id";
        $default_where_value = $id;
        $default_where = array("$default_where_column=$default_where_value");

        $fields_def = array(
                        MATERIAL, ITEM, SHORTCODE, 
                        UNIT, TYPE, COUNTING, SUB_NAME, 
                        ACTUAL_COST, COST, LEVEL, 
                        IN_STOCK, PRIORITY, IMAGE
                    );
        $_post_data = is_numeric($id) ? $_POST['data'][$id] : null ;

        if($action == "create"){
            $fields_data = validate_fields($_post_data, $fields_def);

            if($fields_data['result']){
                $default_where = "1 ORDER BY `id` DESC LIMIT 1";

                $insert_arr = $fields_data['data'];

                //`level`, `priority`, `in_stock` fields aren't required for `raw` material
                if($insert_arr['material'] == "raw"){
                    $manual_key_names[] = "level";
                    $manual_key_names[] = "priority";
                    $manual_key_names[] = "in_stock";
                }

                $manual_key_names[] = "id";
                $manual_key_names[] = "image-many-count";
                foreach($manual_key_names as $key){
                    unset($insert_arr[$key]);
                }

                $query_type = "insert";
                //$query_table defined earlier
                $query_columns = array();
                $query_values = array();
                foreach($insert_arr as $key => $value){
                    $query_columns[] = $key;
                    $query_values[] = $value;
                }

                $insert_query = get_query($query_type, $query_table, $query_columns, $query_values);
                $return['insert_query'] = $insert_query;

                $insert_result = null;

                if($_SERVER['HTTP_HOST'] == "localhost"){
                    //request on localhost,
                    //so have to queue update on localhost
                    //then call & update on remote server
                    $transaction_connection = begin_transaction();
                    $insert_result = insert_query($insert_query, $transaction_connection);
                    if($insert_result['result']){
                        $insert_result = curl_request(REMOTE_SERVER_ITEMS_API_ENDPOINT, $_POST);
                        if($insert_result['result']){
                            if(
                                    array_key_exists("result", $insert_result['data'])
                                &&  $insert_result['data']['result']
                            ){
                                $insert_result = commit_transaction($transaction_connection);
                            }else{
                                rollBack_transaction($transaction_connection);

                                $insert_result['result'] = false;
                                $insert_result['info'] = "error from remote server: " . $insert_result['data']['info'];
                                $insert_result['additional_information'] = "error from remote server: " . $insert_result['data']['additional_info'];
                            }
                        }else{
                            rollBack_transaction($transaction_connection);

                            $insert_result['info'] = "error connecting to remote server: " . $insert_result['info'];
                            $insert_result['additional_information'] = "error connecting to remote server: " . $insert_result['info'];
                        }
                    }
                }else{
                    //request on remote server,
                    //just update on remote server
                    $insert_result = insert_query($insert_query);
                }

                if($insert_result['result']){
                    unset($insert_arr['slno']);
                    $manual_columns = array();
                    foreach($manual_key_names as $key){
                        $manual_columns[] = "NULL AS `$key`";
                    }
                    $inserted_record = fetchRecord($query_table, $manual_columns, $default_where, "count_slno");
                    $return['info'] .= "record inserted ";
                    if($inserted_record['result']){
                        $return['result'] = true;
                        $return['info'] .= "and fetched record";
                        $return['data'] = $inserted_record['data'];

                        $return['fetch_query'] = $inserted_record['query'];
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

            $fields_data = validate_fields($_post_data, $fields_def);
            if($fields_data['result']){
                $query_set = array();
                $row_set_arr = $fields_data['data'];
                
                unset($row_set_arr['id']);
                unset($row_set_arr['image-many-count']);
                
                foreach($manual_key_names as $key){
                    unset($row_set_arr[$key]);
                }

                foreach($row_set_arr as $set_column => $set_value){
                    $query_set[] = "$set_column=$set_value";
                }
                
                $query_type = "update";
                //$query_table defined earlier
                //$query_set defined just above
                //$default_where will be used;

                $update_query = get_query($query_type, $query_table, $query_set, $default_where);
                $return['query'] = $update_query; //for debugging

                $update_result = null;

                if($_SERVER['HTTP_HOST'] == "localhost"){
                    //request on localhost,
                    //so have to queue update on localhost
                    //then call & update on remote server
                    $transaction_connection = begin_transaction();

                    $update_result = update_query($update_query, $transaction_connection);
                    if($update_result['result']){
                        $update_result = curl_request(REMOTE_SERVER_ITEMS_API_ENDPOINT, $_POST);
                        if($update_result['result']){
                            if(
                                    array_key_exists("result", $update_result['data'])
                                &&  $update_result['data']['result']
                            ){
                                $update_result = commit_transaction($transaction_connection);
                            }else{
                                rollBack_transaction($transaction_connection);

                                $update_result['result'] = false;
                                $update_result['info'] = "error from remote server: " . $update_result['data']['info'];
                                $update_result['additional_information'] = "error from remote server: " . $update_result['data']['additional_info'];
                            }
                        }else{
                            rollBack_transaction($transaction_connection);

                            $update_result['info'] = "error connecting to remote server: " . $update_result['info'];
                            $update_result['additional_information'] = "error connecting to remote server: " . $update_result['info'];
                        }
                    }
                }else{
                    //request on remote server,
                    //just update on remote server
                    $update_result = update_query($update_query);
                }

                if($update_result['result']){
                    $manual_columns =  array();
                    foreach($manual_key_names as $key_name){
                        $manual_columns[] = "'$_post_data[$key_name]' AS `$key_name`";
                    }
                    $updated_record = fetchRecord($query_table, $manual_columns, $default_where, false);
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

            $delete_result = null;

            if($_SERVER['HTTP_HOST'] == "localhost"){
                //request on localhost,
                //so have to queue update on localhost
                //then call & update on remote server
                $transaction_connection = begin_transaction();
                $delete_result = delete_query($delete_query, $transaction_connection);
                if($delete_result['result']){
                    $delete_result = curl_request(REMOTE_SERVER_ITEMS_API_ENDPOINT, $_POST);
                    if($delete_result['result']){
                        if(
                                array_key_exists("result", $delete_result['data'])
                            &&  $delete_result['data']['result']
                        ){
                            $delete_result = commit_transaction($transaction_connection);
                        }else{
                            rollBack_transaction($transaction_connection);

                            $delete_result['result'] = false;
                            $delete_result['info'] = "error from remote server: " . $delete_result['data']['info'];
                            $delete_result['additional_information'] = "error from remote server: " . $delete_result['data']['additional_info'];
                        }
                    }else{
                        rollBack_transaction($transaction_connection);
                        
                        $delete_result['info'] = "error connecting to remote server: " . $delete_result['info'];
                        $delete_result['additional_information'] = "error connecting to remote server: " . $delete_result['info'];
                    }
                }
            }else{
                //request on remote server,
                //just update on remote server
                $delete_result = delete_query($delete_query);
            }
            
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
            set_mysql_values($query_table, 'SET @slno=0');
            $query_type = "custom";
            //$query_table defined earlier
            $query_text = 
            "
            SELECT @slno:=@slno+1 AS `slno`, `items`.*, `t1`.*, `t2`.* FROM `items`

            LEFT JOIN (SELECT `shortcode` AS `t1_shortcode`,`making_cost`, `retailer_cost` FROM `stock` WHERE `id` IN (SELECT MAX(`id`) FROM `stock` GROUP BY `shortcode`)) t1 
            ON `items`.`shortcode` = `t1`.`t1_shortcode`

            LEFT JOIN (SELECT `shortcode` AS `t2_shortcode`, COUNT(`id`) AS `available_stock` FROM `stock` GROUP BY `shortcode`) t2
            ON `items`.`shortcode` = `t2`.`t2_shortcode`  

            ORDER BY `items`.`id`  ASC
            ";

            $select_query = get_query($query_type, $query_table, $query_text);
            $select_result = select_query($select_query);

            if($select_result['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
                $return['data'] = $select_result['additional_data'];
            }else{
                $return['result'] = true;
                $return['data'] = array();
                $return['info'] .= $select_result['info'];
                //$return['additional_info'] .= $select_result['additional_info'];
            }
        }elseif($action == "fetch_for_app"){
            $query_type = "custom";
            //$query_table defined earlier
            $categories_query_text = 
            "
            SELECT DISTINCT `type` FROM `items`
            ";
			
            $categories_query = get_query($query_type, $query_table, $categories_query_text);
            $categories_result = select_query($categories_query);
			
			$query_text = 
            "
            SELECT * FROM (
                SELECT * FROM (
                    SELECT * FROM `items` WHERE `priority` != 'default' AND `material` != 'raw' AND `in_stock` != 0 ORDER BY `datetime` DESC
                ) AS `t1` 
            ORDER BY FIELD(`priority`, 'top', 'new', 'offer')
            ) `t2`
            
            UNION
            
            SELECT * FROM (SELECT * FROM `items` WHERE `priority` = 'default' AND `material` != 'raw' AND `in_stock` != 0 ORDER BY rand()) `t3`
            ";
			
            $select_query = get_query($query_type, $query_table, $query_text);
            $select_result = select_query($select_query);
			
			//$return['query'] = $select_query;

            if($categories_result['result'] && $select_result['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
				$return['header'] = array(
										"header_1" => "Ambati Tasty Foods - Laxmiravulapalle, Telangana",
										"header_2" => "Online store for Keerana Vendors",
										"app_button" => "Download App",
										"mobile_number" => "8096031765"
									);
                $return['categories'] = $categories_result['additional_data'];
                $return['items'] = $select_result['additional_data'];
            }else{
                $return['result'] = true;
                $return['items'] = array();
                $return['info'] .= $select_result['info'];
                //$return['additional_info'] .= $select_result['additional_info'];
            }
        }elseif($action == "fetch_specified"){
            $query_type = "select";
            //$query_table defined earlier
            $query_columns = $_POST['required_fields'];
            $query_where = $_POST['rules'];            
            $suffix_query = array_key_exists('suffix_query', $_POST) ? $_POST['suffix_query'] : null;

            $select_query = get_query($query_type, $query_table, $query_columns, $query_where, $suffix_query);
            $return['query'] = $select_query['query'];

            $select_result = select_query($select_query);

            if($select_result['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
                $return['data'] = $select_result['additional_data'];
            }else{
                $return['result'] = true;
                $return['data'] = array();
                $return['info'] .= $select_result['info'];
                //$return['additional_info'] .= $select_result['additional_info'];
            }
        }elseif($action == "fetch_item_data"){
            $shortcode = $_POST['shortcode'];

            $query_type = "custom";
            //$query_table defined earlier
            $query_text = 
            "
            SELECT 
                `items`.`material`, `items`.`item`, `items`.`shortcode`, `items`.`unit`, `items`.`type`, 
                `stock_and_stock_nouse`.`making_cost`, `stock_and_stock_nouse`.`retailer_cost`, `stock_and_stock_nouse`.`wholesale_cost`, `stock_and_stock_nouse`.`item_number`, `stock_and_stock_nouse`.`date`
            FROM `items`

            LEFT JOIN (
            SELECT `shortcode`, `making_cost`, `retailer_cost`, `wholesale_cost`, `item_number`, `date` FROM `stock` WHERE `shortcode`= '$shortcode'
            UNION
            SELECT `shortcode`, `making_cost`, `retailer_cost`, `wholesale_cost`, `item_number`, `date` FROM `stock_nouse` WHERE `shortcode`= '$shortcode'
            UNION
            SELECT `shortcode`, `making_cost`, `retailer_cost`, `wholesale_cost`, `item_number`, `date` FROM `stock_deleted` WHERE `shortcode`= '$shortcode'
            ) AS `stock_and_stock_nouse`
            ON `items`.`shortcode` = `stock_and_stock_nouse`.`shortcode`

            WHERE `items`.`shortcode` = '$shortcode'

            ORDER BY `stock_and_stock_nouse`.`date` DESC, `stock_and_stock_nouse`.`item_number` DESC LIMIT 1
            ";

            $select_query = get_query($query_type, $query_table, $query_text);
            $select_result = select_query($select_query);
            if($select_result['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
                $return['data'] = $select_result['additional_data'];
            }else{
                $return['result'] = true;
                $return['data'] = array();
                //$return['info'] .= $select_result['info'];
                //$return['additional_info'] .= $select_result['additional_info'];
                $return['select_result'] = $select_result;
            }
        }elseif($action == "fetch_distinct_column"){
            $distinct_column = $_POST['data'];

            $query_type = "custom";
            //$query_table defined earlier
            $query_text = 
            "
                SELECT DISTINCT `$distinct_column` AS `$distinct_column` FROM `$query_table` WHERE `$distinct_column` IS NOT NULL;
            ";

            $select_query = get_query($query_type, $query_table, $query_text);
            $select_result = select_query($select_query);

            if($select_result['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
                $return['data'] = $select_result['additional_data'];
            }else{
                $return['result'] = false;
                $return['data'] = array();
                $return['info'] = $select_result;
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