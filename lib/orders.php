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
$return['info'] = "orders.php: ";
$return['additional_info'] = "";

if(isset($_POST['data']) && !empty($_POST['data'])){
    if(isset($_POST['action']) && !empty($_POST['action'])){
        $action = $_POST['action'];
        $query_table = "orders";

        $manual_key_names = ['slno', 'making_cost', 'retailer_cost', 'available_stock'];

        $id = getKeyinArr($_POST['data']);

        $default_where_column = "id";
        $default_where_value = $id;
        $default_where = array("$default_where_column=$default_where_value");

        $fields_def = array(
                        USERNAME, NAME, MOBILE_NUMBER, ADDRESS
                    );
        $_post_data = is_numeric($id) ? $_POST['data'][$id] : null ;

        if($action == "create"){
            $fields_data = validate_fields($_POST, $fields_def);
            if($fields_data['result']){

                $customer_update = updateCustomerData($_COOKIE, $fields_data['data']);

                //$return['customer_update'] = $customer_update;

                $order_id = getOrderId();
                if($order_id['result']){
                    $order_id = $order_id['data'];

                    $fields_data = $fields_data['data'];

                    $items_data = $fields_data['data'];
                    $items_data = json_decode($items_data, true);

                    if(json_last_error() === JSON_ERROR_NONE){
                        if(count($items_data)){
                            $date = date('Y-m-d H:i:s');
                            $sale_type = "order";
                            $username = $fields_data['username'];
                            $name = $fields_data['name'];
                            $mobile_number = $fields_data['mobile_number'];
                            $address = $fields_data['address'];

                            $no_of_items = $fields_data['total_items'];
                            $no_of_units = count($items_data['summary']);
                            
                            $making_cost = 0;
                            $sub_total = $items_data['billing']['sub_total'];
                            $total_price = $items_data['billing']['total'];
                            $offer_percentage = $items_data['billing']['offer_percentage'];
                            $offer_amount = $items_data['billing']['offer_amount'];

                            $query_type = "insert";
                            $query_columns = array(
                                                    "date",
                                                    "order_id",
                                                    "sale_type",
                                                    "username",
                                                    "name",
                                                    "mobile_number",
                                                    "address",
                                                    "no_of_items",
                                                    "no_of_units",
                                                    "making_cost",
                                                    "sub_total",
                                                    "total_price",
                                                    "offer_percentage",
                                                    "offer_amount",
                                                    "items_details"
                                                );
                            $query_values =	array(
                                                $date,
                                                $order_id,
                                                $sale_type,
                                                $username,
                                                $name,
                                                $mobile_number,
                                                $address,
                                                $no_of_items,
                                                $no_of_units,
                                                $making_cost,
                                                $sub_total,
                                                $total_price,
                                                $offer_percentage,
                                                $offer_amount,
                                                json_encode($items_data)
                                            );

                            $insert_query = get_query($query_type, $query_table, $query_columns, $query_values);
            
                            if(true){
                                $insert_result = insert_query($insert_query);
                                if($insert_result['result']){
                                    $return['result'] = true;
                                    $return['info'] .= "order created";
                                    $return['order_id'] = $order_id;
                                }else{
                                    $return['info'] .= "error creating order: database error";
                                }
                            }else{
                                //requesting on local_server
                                $return['info'] .= "error creating order: Requesting on local_server";
                            }
                        }else{
                            //no items in order
                            $return['info'] .= "error creating order: No Items in Order";
                        }
                    }else{
                        //error parsing orders
                        $return['info'] .= "error creating order: parsing orders";
                    }
                }else{
                    //error creating order
                    $return['info'] .= "error creating order: fetching order_id";
                }
            }else{
                $return['info'] .= "error creating order: " . $fields_data['info'];
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
                                $update_result['result'] = false;
                                $update_result['info'] = "error from remote server: " . $update_result['data']['info'];
                                $update_result['additional_information'] = "error from remote server: " . $update_result['data']['additional_info'];
                            }
                        }else{
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
        }elseif($action == "fetch_all"){
            $fetched_all_records = null;
            if($_SERVER['HTTP_HOST'] == "localhost"){
                $fetched_all_records = curl_request(REMOTE_SERVER_ORDERS_API_ENDPOINT, $_POST);
				if($fetched_all_records['result']){
                    if($fetched_all_records['data']['result']){
                        $return['result'] = true;
                        $return['data'] = $fetched_all_records['data']['data'];
                    }else{
                        $return['info'] .= $fetched_all_records['data']['info'];
                    }
                }else{
                    $return['data'] = array();
                    $return['info'] .= $fetched_all_records['info'];
                    $return['additional_info'] .= $fetched_all_records['additional_info'];
                }
            }else{
                $extra_columns = array("no_of_items", "no_of_units", "making_cost", "sub_total", "total_price", "offer_percentage", "offer_amount", "is_confirmed", "is_paid");
                $where_clause = array("is_cancelled=0");
                $fetched_all_records = fetchRecord($query_table, $extra_columns, $where_clause);
				$return = $fetched_all_records;
            }
        }elseif($action == "fetch_order"){
            $order_id = $_POST['data'];
            $extra_column = array("items_details");
            $where_clause = "`order_id` LIKE '$order_id' AND `is_cancelled`='0'";
            $fetched_all_records = fetchRecord($query_table, $extra_column, $where_clause);
            if($fetched_all_records['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
                $return['data'] = $fetched_all_records['data'];
            }else{
                $return['result'] = true;
                $return['data'] = array();
                $return['info'] .= $fetched_all_records['info'];
                $return['additional_info'] .= $fetched_all_records['additional_info'];
            }
        }elseif($action == "sale_order"){
            if($_SERVER['HTTP_HOST'] == "localhost"){

                $scanned_data = json_decode($_POST['data'], true);

                if($scanned_data){
                    /* OPERATIONS:
                        ==>insert the row in `stock_nouse`
                        ==>delete the row in `stock`
                    */

                    $transaction_connection = begin_transaction();
                    $is_transaction_success = true;

                    $items_list = $scanned_data['list'];

                    $where_data = array();
                    foreach($items_list as $item){
                        $where_data[] = "`barcode`='" . $item['barcode'] . "'";
                    }

                    $stock_nouse_query_type = "custom";
                    $stock_nouse_table = "stock_nouse";
                    $stock_nouse_query_text = 
                    "
                    INSERT INTO `stock_nouse` SELECT NULL AS `row_id`, `stock`.* FROM `stock` WHERE ". implode(" OR ",$where_data) .";
                    ";

                    $stock_nouse_query = get_query($stock_nouse_query_type, $stock_nouse_table, $stock_nouse_query_text);
                    $stock_nouse_result = insert_query($stock_nouse_query, $transaction_connection);
                    if(!$stock_nouse_result['result']){
                        $is_transaction_success = false;
                        $return['info'] .= "stock_nouse: " . $stock_nouse_result['additional_information'];
                    }else{
                        $stock_query_type = "custom";
                        $stock_table = "stock";
                        $stock_query_text = 
                        "
                        DELETE FROM `stock` WHERE ". implode(" OR ",$where_data) .";
                        ";

                        $stock_query = get_query($stock_query_type, $stock_table, $stock_query_text);
                        $stock_delete_result = delete_query($stock_query, $transaction_connection);
                        
                        if(!$stock_delete_result['result']){
                            $is_transaction_success = false;
                            $return['info'] .= "stock_delete: " . $stock_delete_result['additional_information'];
                        }
                    }
                    
                    if($is_transaction_success){
                        $server_result = curl_request(REMOTE_SERVER_ORDERS_API_ENDPOINT, $_POST);
                        if($server_result['result'] && $server_result['data']['result']){
                            $return = commit_transaction($transaction_connection);
                            $return['order_id'] = $server_result['data']['order_id'];
                        }else{
                            if(count($server_result['data'])){
                                $return = $server_result['data'];
                            }else{
                                $return = $server_result;
                            }
                        }
                    }
                }else{
                    $return['info'] .= "error parsing scanned data";
                }
            }else{
                $order_id = $_POST['order_id'];
                $order_data = $_POST['order_data'];
                $unscanned_data = json_decode($_POST['unscanned_data'], true);
                $scanned_data = json_decode($_POST['data'], true);
                
                if($unscanned_data && $scanned_data){
                    $transaction_queries = array();
                    $new_order_id = null;
                    
                    if(count($unscanned_data['summary'])){
                        $new_order_id = generateInvoiceId($order_data['order_id'], true);

                        $insert_query_type = "insert";
                        $insert_query_columns = array(
                            "order_id",
                            "sale_type",
                            "username",
                            "name",
                            "mobile_number",
                            "address",
                            "no_of_items",
                            "no_of_units",
                            "making_cost",
                            "sub_total",
                            "total_price",
                            "offer_percentage",
                            "offer_amount",
                            "items_details"
                        );

                        $insert_query_values =	array(
                                            $new_order_id,
                                            $order_data['sale_type'],
                                            $order_data['username'],
                                            $order_data['name'],
                                            $order_data['mobile_number'],
                                            $order_data['address'],
                                            count($unscanned_data['summary']),
                                            array_sum(array_column($unscanned_data['summary'], 'quantity')),
                                            0,
                                            $unscanned_data['billing']['sub_total'],
                                            $unscanned_data['billing']['total'],
                                            0,
                                            0,
                                            json_encode($unscanned_data)
                                        );

                        $insert_query = get_query($insert_query_type, $query_table, $insert_query_columns, $insert_query_values);
                        $transaction_queries[] = array("insert" => $insert_query);
                    }

                    if(count($scanned_data['summary'])){
                        $update_query_type = "update";
                        $update_column_set = array(
                                                "no_of_items=" . count($scanned_data['summary']),
                                                "no_of_units=" . array_sum(array_column($scanned_data['summary'], 'quantity')),
                                                "making_cost=" . $scanned_data['billing']['making_cost'],
                                                "sub_total=" . $scanned_data['billing']['sub_total'],
                                                "total_price=" . $scanned_data['billing']['total'],
                                                "is_confirmed=1",
                                                "items_details=" . json_encode($scanned_data),
                                            );
                        $update_column_where = "`order_id` LIKE '$order_id'";

                        $update_query = get_query($update_query_type, $query_table, $update_column_set, $update_column_where);
                        $transaction_queries[] = array("update" => $update_query);
                    }

                    if(count($transaction_queries)){
                        $trasaction_result = execute_transactions($transaction_queries);
                
                        $return['queries'] = $transaction_queries;
                
                        if($trasaction_result['result']){
                            $return['result'] = true;
                            $return['info'] .= "order sale successful ";
                            $return['order_id'] = $order_id;
                            if(count($unscanned_data['summary'])){
                                $return['info'] .= "and creating new order successful ";
                                $return['new_order_id'] = $new_order_id;
                            }
                        }else{
                            $return['info'] .= "order sale unsuccessful"; 
                            $return['trasaction_result'] = $trasaction_result;  
                        }
                    }else{
                        $return['info'] .= "error generating queries for the database";    
                    }
                }else{
                    $return['info'] .= "error parsing scanned or unscanned data";
                }
            }
        }elseif($action == "order_payment"){
            $order_id = $_POST['data'];
            
            $update_query_type = "update";
            $update_column_set = array("is_paid=1");
            $update_column_where = "`order_id` LIKE '$order_id' AND `is_cancelled`='0'";
            $update_query = get_query($update_query_type, $query_table, $update_column_set, $update_column_where);
            
            $update_result = update_query($update_query);
            if($update_result['result']){
                $return['result'] = true;
                $return['info'] .= "amount paid ";
            }else{
                $return['result'] = false;
                $return['info'] .= $update_result['additional_info'];
                $return['additional_info'] .= $update_result['additional_info'];
            }
        }elseif($action == "order_return"){
            if($_SERVER['HTTP_HOST'] == "localhost"){
                if(
                    array_key_exists('cancelled_invoice', $_POST)
                ){
                    $cancelled_invoice = $_POST['cancelled_invoice'];

                    $transaction_connection = begin_transaction();
                    $is_transaction_success = true;

                    $queries_to_execute = array();

                    $stock_insert_type = "insert";
                    $stock_insert_table = "stock";
                    $stock_insert_columns = array(
                        "generate_id",
                        "date",
                        "material",
                        "item",
                        "shortcode",
                        "type",
                        "unit",
                        "quantity",
                        "making_cost",
                        "retailer_cost",
                        "wholesale_cost",
                        "item_number",
                        "barcode",
                        "custom_data"
                    );
                    
                    foreach($cancelled_invoice['list'] as $cancelled_item){
                        $stock_insert_values =	array(
                            $cancelled_item['generate_id'],
                            $cancelled_item['date'],
                            $cancelled_item['material'],
                            $cancelled_item['item'],
                            $cancelled_item['shortcode'],
                            $cancelled_item['type'],
                            $cancelled_item['unit'],
                            $cancelled_item['quantity'],
                            $cancelled_item['making_cost'],
                            $cancelled_item['retailer_cost'],
                            $cancelled_item['wholesale_cost'],
                            $cancelled_item['item_number'],
                            $cancelled_item['barcode'],
                            $cancelled_item['custom_data']
                        );

                        $stock_insert_query = get_query($stock_insert_type, $stock_insert_table, $stock_insert_columns, $stock_insert_values);
                        $insert_result = insert_query($stock_insert_query, $transaction_connection);
                        if(!$insert_result['result']){
                            $is_transaction_success = false;
                            break;
                        }
                    }

                    if($is_transaction_success){
                        $server_result = curl_request(REMOTE_SERVER_ORDERS_API_ENDPOINT, $_POST);
                        if($server_result['result'] && $server_result['data']['result']){
                            $return = commit_transaction($transaction_connection);

                            if($return['result']){
                                $return['success_title'] = $server_result['data']['success_title'];
                                $return['success_content'] = $server_result['data']['success_content'];
                            }
                        }else{
                            $return = $server_result;
                        }
                    }
                }
            }else{
                $order_details = $_POST['data'];
                $order_id = $order_details['order_id'];
                
                if(
                    array_key_exists('current_invoice', $_POST)
                    && count($_POST['current_invoice']['list'])
                ){
                    $update_query_type = "update";
                    $update_column_set = array("is_cancelled=1");
                    $update_column_where = "`order_id` LIKE '$order_id'";

                    $update_query = get_query($update_query_type, $query_table, $update_column_set, $update_column_where);
                    
                    /* --------- */

                    $insert_query_type = "insert";
                    $insert_query_columns = array(
                        "order_id",
                        "sale_type",
                        "username",
                        "name",
                        "mobile_number",
                        "address",
                        "no_of_items",
                        "no_of_units",
                        "making_cost",
                        "sub_total",
                        "total_price",
                        "offer_percentage",
                        "offer_amount",
                        "items_details",
                        "is_confirmed"
                    );
                    $insert_query_values =	array(
                                    generateInvoiceId($order_id, true),
                                    $order_details['sale_type'],
                                    $order_details['username'],
                                    $order_details['name'],
                                    $order_details['mobile_number'],
                                    $order_details['address'],
                                    $order_details['no_of_items'],
                                    $order_details['no_of_units'],
                                    $order_details['making_cost'],
                                    $order_details['sub_total'],
                                    $order_details['total_price'],
                                    $order_details['offer_percentage'],
                                    $order_details['offer_amount'],
                                    json_encode($_POST['current_invoice']),
                                    1
                                );

                    $insert_query = get_query($insert_query_type, $query_table, $insert_query_columns, $insert_query_values);

                    $transaction_queries = array(array("update" => $update_query), array("insert" => $insert_query));

                    $transactions_result = execute_transactions($transaction_queries);
                    if($transactions_result['result']){
                        $return['result'] = true;
                        $return['info'] .= "Order cancelled and Order created";

                        $return['success_title'] = "Items returned in the Order";
                        $return['success_content'] = "Items returned in the Order";
                    }else{
                        $return['info'] .= $transactions_result['additional_information'];
                    }
                }else{
                    $update_query_type = "update";
                    $update_column_set = array("is_cancelled=1");
                    $update_column_where = "`order_id` LIKE '$order_id'";

                    $update_query = get_query($update_query_type, $query_table, $update_column_set, $update_column_where);
                    $update_result = update_query($update_query);
                    if($update_result['result']){
                        $return['result'] = true;
                        $return['info'] .= "Order cancelled";

                        $return['success_title'] = "Complete Order Cancelled";
                        $return['success_content'] = "Complete Order Cancelled";
                    }else{
                        $return['info'] .= $update_result['additional_information'];
                    }
                }
            }
        }elseif($action == "fetch_for_app"){
            $data = $_POST['data'];
            $username = $_POST['username'];

            $where_clause = "`username`='$username' ";

            if($data != "all"){
                $where_clause .= "AND `order_id`='$data' ";
            }

            $where_clause .= "ORDER BY `order_id` DESC";

            $extra_columns = array("no_of_items", "total_price", "is_confirmed", "is_paid", "is_cancelled");
            $fetched_all_records = fetchRecord($query_table, $extra_columns, $where_clause);
            if($fetched_all_records['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
                $return['orders'] = $fetched_all_records['data'];
            }else{
                $return['result'] = true;
                $return['orders'] = array();
                $return['info'] .= $fetched_all_records['info'];
                $return['additional_info'] .= $fetched_all_records['additional_info'];
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