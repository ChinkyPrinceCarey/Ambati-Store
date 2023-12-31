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
        $current_time_function_for_db = "ADDTIME(NOW(), '05:29:47')";
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
        $date = get_date("y-m-d t");
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
                
                $update_result = update_query($update_query);
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
            set_mysql_values($query_table, 'SET @slno=0');
            $fetch_filter = $_POST['fetch_filter'];

            $start = array_key_exists('start', $_POST['data']) ? $_POST['data']['start'] . " 00:00:00" : null;
            $end = array_key_exists('end', $_POST['data']) ? $_POST['data']['end'] . " 23:59:59" : null;

            $fetch_filter_where = "";
            if($fetch_filter){
                $fetch_filter = "'" . str_replace(",", "','", $fetch_filter) . "'";
                $fetch_filter_where = "`t2`.`status` IN ($fetch_filter)";
            }

            $fetch_date_filter_where = "";
            if($start && $end){
                $fetch_date_filter_where = "`date` BETWEEN '$start' AND '$end' ORDER BY `date` DESC";
            }

            $query_type = "custom";
            $query_text = 
            "
            SELECT * FROM 
                (
                    SELECT 
                            @slno:=@slno+1 AS `slno`,
                            `orders`.*, 
                            CASE 
                                WHEN `is_confirmed` = 0 AND `is_cancelled` = 0 THEN 'pending'
                                WHEN `is_confirmed` = 0 AND `is_cancelled` = 1 THEN 'cancelled'
                                WHEN `is_confirmed` = 1 AND `is_cancelled` = 0 THEN 'confirmed'
                            END AS 'status' FROM `orders`
                    WHERE $fetch_date_filter_where
                ) t2 WHERE $fetch_filter_where;
            ";

            $select_query = get_query($query_type, $query_table, $query_text);
            $return['query'] = $select_query;
            $select_result = select_query($select_query);

            if($select_result['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
                $return['data'] = $select_result['additional_data'];
            }else{
                $return['result'] = true;
                $return['data'] = array();
                //$return['info'] .= $select_result['additional_info'];
                //$return['additional_info'] .= $select_result['additional_info'];
            }
        }elseif($action == "fetch_order"){
            $order_id = $_POST['data'];

            $query_type = "custom";
            $query_text = 
            "
                SELECT  *, 
                        CASE 
                            WHEN `is_confirmed` = 0 AND `is_cancelled` = 0 THEN 'pending'
                            WHEN `is_confirmed` = 0 AND `is_cancelled` = 1 THEN 'cancelled'
                            WHEN `is_confirmed` = 1 AND `is_cancelled` = 0 THEN 'confirmed'
                        END AS 'status' FROM `orders`
                WHERE `order_id` LIKE '$order_id';
            ";

            $select_query = get_query($query_type, $query_table, $query_text);
            $return['query'] = $select_query;
            $select_result = select_query($select_query);

            if($select_result['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
                $return['data'] = $select_result['additional_data'];
            }else{
                $return['result'] = true;
                $return['data'] = array();
                //$return['info'] .= $select_result['additional_info'];
                //$return['additional_info'] .= $select_result['additional_info'];
            }
        }elseif($action == "cancel_order"){

            $order_id = $_POST['order_id'];
            $affected_reason = $_POST['data'];

            $query_type = "update";
            $update_set = array("is_cancelled=1", "affected_reason=$affected_reason", "affected_time=$current_time_function_for_db");
            $update_where = "`is_confirmed` = 0 AND `order_id` LIKE '$order_id'";
            
            $update_query = get_query($query_type, $query_table, $update_set, $update_where);
            $return['query'] = $update_query; //for debugging

            $update_result = update_query($update_query);

            if($update_result['result']){
                $return['result'] = true;
                $return['info'] .= "successful ";
            }else{
                $return['info'] .= "error updating the record ";
                $return['additional_info'] .= $update_result['additional_information'];

                //debug
                $return['query'] = $update_query;
            }
        }elseif($action == "sale_order"){
            $order_id = $_POST['order_id'];
            $order_data = $_POST['order_data'];
            $unscanned_data = json_decode($_POST['unscanned_data'], true);
            $scanned_data = json_decode($_POST['data'], true);
            
            if($unscanned_data && $scanned_data){
                $transaction_queries = array();
                $new_order_id = null;

                if(count($scanned_data['list'])){
                    //1. insert item in `stock_sold`
                    $scanned_items_list = $scanned_data['list'];
                    $barcodes_arr = getBarcodesData($scanned_items_list, "fetch_from_items");
                    $barcodes_str = getBarcodesData($barcodes_arr, "join_barcodes");
                    $shortcode_unit_price_data = getBarcodesData($scanned_data['summary'], "shortcode_unit_price");
                    $case_query_text = getCaseQueryText($shortcode_unit_price_data);
            
                    $stock_sold_query_type = "custom";
                    $stock_sold_table = "stock_sold";
                    $stock_sold_query_text = 
                    "
                        INSERT INTO `stock_sold` 
                        SELECT 
                            NULL AS `row_id`, 
                            '$date' AS `row_date`, 
                            'order' AS `sold_type`, 
                            '$order_id' AS `sold_id`, 
                            `stock`.*, 
                            $case_query_text,
                            NULL AS `is_restored`, 
                            NULL AS `affected_time` 
                        FROM `stock` 
                        WHERE `barcode` IN ($barcodes_str);
                    ";

                    $stock_sold_query = get_query($stock_sold_query_type, $stock_sold_table, $stock_sold_query_text);
                    $transaction_queries[] = array("insert" => $stock_sold_query);

                    //2. delete item from `stock`
                    $stock_delete_query_type = "custom";
                    $stock_delete_table = "stock";
                    $stock_delete_query_text = 
                    "
                        DELETE FROM `stock` WHERE `barcode` IN ($barcodes_str);
                    ";

                    $stock_delete_query = get_query($stock_delete_query_type, $stock_delete_table, $stock_delete_query_text);
                    $transaction_queries[] = array("delete" => $stock_delete_query);
                }
                
                if(count($unscanned_data['summary'])){
                    $new_order_id = generateInvoiceId($order_data['order_id'], true);
                    $remaining_what_status = $_POST['remaining_what_status'] == "cancel" ? 1 : 0 ;
                    $remaining_what_reason = $_POST['remaining_what_reason'];

                    $insert_query_type = "insert";
                    $insert_query_columns = array(
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
                        "items_details",
                        "is_cancelled",
                        "affected_time",
                        "affected_reason"
                    );

                    $insert_query_values =	array(
                                        $current_time_function_for_db,
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
                                        json_encode($unscanned_data),
                                        $remaining_what_status,
                                        $current_time_function_for_db,
                                        $remaining_what_reason
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
                                            "affected_time=" . $current_time_function_for_db
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
            if(array_key_exists('cancelled_invoice', $_POST)){
                $cancelled_invoice = $_POST['cancelled_invoice'];
                $order_details = $_POST['data'];
                $order_id = $order_details['order_id'];

                $transaction_queries = array();

                //return items from `orders` to `stock`
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
                    $transaction_queries[] = array("insert" => $stock_insert_query);
                }

                $barcodes_arr = getBarcodesData($cancelled_invoice['list'], "fetch_from_items");
                $barcodes_str = getBarcodesData($barcodes_arr, "join_barcodes");

                //update on `stock_sold`
                $stock_sold_type = "update";
                $stock_sold_table = "stock_sold";
                $stock_sold_set = array("is_restored=1", "affected_time=$date");
                $stock_sold_where = "`barcode` IN ($barcodes_str) AND `is_restored` = '0' AND `sold_type` = 'order' AND `sold_id` = '$order_id'";
                
                $stock_sold_query = get_query($stock_sold_type, $stock_sold_table, $stock_sold_set, $stock_sold_where);
                $transaction_queries[] = array("update" => $stock_sold_query);

                /*
                    scenario: 1
                    if all items are scanned in the order for return, 
                    
                    the `current_invoice` would be empty
                    so, 1) we will update JSON object
                    2) then we will use update query to set `is_cancelled` = 1 for that order

                    scenario: 2
                    if few items are unscanned in the order for return.
                    
                    the `current_invoice` will have list of items which are unscanned
                    the `cancelled_invoice` will have list of items which are scanned

                    so, we should use update query to update current order with `current_invoice` details.
                    then, we should create new order with 
                        continuos order_id number with `cancelled_invoice` details,
                        and, `is_cancelled` = 1
                */

                $is_all_items_scanned = !(      array_key_exists('list', $_POST['current_invoice'])
                                            &&  count($_POST['current_invoice']['list'])
                                        );
                
                if($is_all_items_scanned){
                    //update json column
                    //cancel that order
                    $current_invoice_items_details = json_encode($_POST['current_invoice']);

                    $update_query_type = "update";
                    $update_column_set = array(
                                            "is_cancelled=1", 
                                            "affected_reason=Order Return",
                                            "items_details=$current_invoice_items_details"
                                        );
                    $update_column_where = "`order_id` LIKE '$order_id'";

                    $update_query = get_query($update_query_type, $query_table, $update_column_set, $update_column_where);
                    $transaction_queries[] = array("update" => $update_query);
                }else{
                    //so, we should use update query to update current order with `current_invoice` details.

                    $current_invoice_no_of_items = count($_POST['current_invoice']['summary']);
                    $current_invoice_no_of_units = $_POST['current_invoice']['no_of_units'];
                    $current_invoice_making_cost = $_POST['current_invoice']['billing']['making_cost'];
                    $current_invoice_sub_total = $_POST['current_invoice']['billing']['sub_total'];
                    $current_invoice_total_price = $_POST['current_invoice']['billing']['total'];
                    $current_invoice_items_details = json_encode($_POST['current_invoice']);

                    $update_query_type = "update";
                    $update_column_set = array(
                                            "no_of_items=$current_invoice_no_of_items",
                                            "no_of_units=$current_invoice_no_of_units",
                                            "making_cost=$current_invoice_making_cost",
                                            "sub_total=$current_invoice_sub_total",
                                            "total_price=$current_invoice_total_price",
                                            "items_details=$current_invoice_items_details"
                                        );
                    $update_column_where = "`is_confirmed` = 1 AND `is_cancelled` = 0 AND `order_id` LIKE '$order_id'";

                    $update_query = get_query($update_query_type, $query_table, $update_column_set, $update_column_where);
                    $transaction_queries[] = array("update" => $update_query);

                    //then, we should create new order with 
                    //continuos order_id number with `cancelled_invoice` details,
                    //and, `is_cancelled` = 1
                    $date = date('Y-m-d H:i:s');
                    $order_id_without_decimal = preg_replace('/(\.).*$/', '', $order_id);

                    $cancelled_invoice_username = $order_details['username'];
                    $cancelled_invoice_name = $order_details['name'];
                    $cancelled_invoice_mobile_number = $order_details['mobile_number'];
                    $cancelled_invoice_address = $order_details['address'];

                    $cancelled_invoice_no_of_items = count($_POST['cancelled_invoice']['summary']);
                    $cancelled_invoice_no_of_units = $_POST['cancelled_invoice']['no_of_units'];
                    $cancelled_invoice_making_cost = $_POST['cancelled_invoice']['billing']['making_cost'];
                    $cancelled_invoice_sub_total = $_POST['cancelled_invoice']['billing']['sub_total'];
                    $cancelled_invoice_total_price = $_POST['cancelled_invoice']['billing']['total'];
                    $cancelled_invoice_items_details = json_encode($_POST['cancelled_invoice']);
                    
                    $insert_query_type = "custom";
                    $insert_query_text = "
                        INSERT INTO `orders` (
                            `date`,
                            `order_id`,
                            `sale_type`,
                            `username`,
                            `name`,
                            `mobile_number`,
                            `address`,
                            `no_of_items`,
                            `no_of_units`,
                            `making_cost`,
                            `sub_total`,
                            `total_price`,
                            `items_details`,
                            `is_cancelled`,
                            `affected_time`,
                            `affected_reason`
                        )
                        
                        SELECT 
                            '$date', 
                            (SELECT ROUND(`order_id` + '0.1', 1) FROM `orders` WHERE `order_id` BETWEEN '$order_id' AND '$order_id_without_decimal.9' ORDER BY `order_id` DESC LIMIT 1),
                            'order',
                            '$cancelled_invoice_username',
                            '$cancelled_invoice_name',
                            '$cancelled_invoice_mobile_number',
                            '$cancelled_invoice_address',
                            '$cancelled_invoice_no_of_items',
                            '$cancelled_invoice_no_of_units',
                            '$cancelled_invoice_making_cost',
                            '$cancelled_invoice_sub_total',
                            '$cancelled_invoice_total_price',
                            '$cancelled_invoice_items_details',
                            '1',
                            '$date', 
                            'Order Return'
                    ";
                    
                    $insert_query = get_query($insert_query_type, $query_table, $insert_query_text);
                    $transaction_queries[] = array("insert" => $insert_query);
                }

                if(count($transaction_queries)){
                    $trasaction_result = execute_transactions($transaction_queries);
            
                    $return['queries'] = $transaction_queries;
            
                    if($trasaction_result['result']){
                        $return['result'] = true;

                        $return['order_id'] = $order_id;

                        $return['info'] .= "Successfully Order Cancelled ";
                        
                        $return['success_title'] = "Items returned in the Order";
                        $return['success_content'] = "And created a new order with returned items which is cancelled";

                        if($is_all_items_scanned){
                            $return['info'] .= "Completely ";

                            $return['success_title'] = "Complete Order Cancelled";
                            $return['success_content'] = "Complete Order Cancelled";
                        }
                    }else{
                        $return['info'] .= $trasaction_result['additional_information'];
                    }
                }else{
                    $return['info'] .= "error generating queries for the database ";
                }
            }else{
                $return['info'] .= "no cancelled invoice ";
            }
        }elseif($action == "return_order_mobile"){
            if(array_key_exists('items_details', $_POST['data'])){
                $order_details = $_POST['order_data'];
                $order_id = $order_details['order_id'];

                $query_type = "update";
                $query_set = array(
                    "no_of_items=" . $_POST['data']['no_of_items'],
                    "no_of_units=" . $_POST['data']['no_of_units'],
                    "making_cost=" . $_POST['data']['making_cost'],
                    "sub_total=" . $_POST['data']['sub_total'],
                    "total_price=" . $_POST['data']['total_price'],
                    "items_details=" . $_POST['data']['items_details']
                );
                $update_where = "`order_id` LIKE '$order_id'";

                $update_query = get_query($query_type, $query_table, $query_set, $update_where);
                $return['query'] = $update_query; //for debugging
                
                $update_result = update_query($update_query);

                if($update_result['result']){
                    $return['result'] = true;
                    $return['order_id'] = $order_id;
                    $return['info'] .= "Successfully Items Returned in the Order ";
                }else{
                    $return['info'] .= $update_result['additional_information'];
                }
            }else{
                $return['info'] .= "null return order [or] current order data";
            }
        }elseif($action == "fetch_for_app"){
            $data = $_POST['data'];
            $username = $_POST['username'];

            $extra_columns = array("no_of_items", "total_price", "is_confirmed", "is_paid", "is_cancelled");
            $where_clause = "`username`='$username' ";

            if($data != "all"){
                $where_clause .= "AND `order_id` LIKE '$data' ";
                $extra_columns[] = "items_details";
            }

            $where_clause .= "ORDER BY `order_id` DESC";

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