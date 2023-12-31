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
$return['info'] = "warehouse_stock_reports: ";
$return['additional_info'] = "";

if(isset($_POST['data']) && !empty($_POST['data'])){
    if(isset($_POST['action']) && !empty($_POST['action'])){
        $action = $_POST['action'];
        $query_table = "stock";
        $date = get_date("y-m-d t");
        if($action == "remove"){
            /*
                OPERATIONS
                ==>insert the row in `stock_deleted`
                ==>delete the row from `stock`
            */
            $data = $_POST['data'];
            $barcodes_arr = getBarcodesData($data, "fetch_from_items");
            $barcodes_str = getBarcodesData($barcodes_arr, "join_barcodes");
            $where_str = "`barcode` IN ($barcodes_str)";

            $stock_deleted_query_type = "custom";
            $stock_deleted_query_table = "stock_deleted";
            $stock_deleted_query_text = "INSERT INTO `stock_deleted` SELECT NULL AS `row_id`, '$date' AS `row_date`, `stock`.*, NULL AS `is_restored`, NULL AS `affected_time` FROM `stock` WHERE $where_str";

            $stock_deleted_query = get_query($stock_deleted_query_type, $stock_deleted_query_table, $stock_deleted_query_text);
            
            $stock_query_type = "custom";
            $stock_query_table = $query_table;
            $stock_query_text = "DELETE FROM `stock` WHERE $where_str";
            $stock_query = get_query($stock_query_type, $stock_query_table, $stock_query_text);

            $transaction_arr =  array(
                                    array("insert" => $stock_deleted_query),
                                    array("delete" => $stock_query)
                                );
            
            $trasaction_result = execute_transactions($transaction_arr);
            $return['queries'] = $transaction_arr;
            
            if($trasaction_result['result']){
                $return['result'] = true;
                $return['info'] .= "stock removed successfully";
                $return['data'] = "";
            }else{
                $return['info'] .= "error removing stock";
                $return['additional_info'] .= $trasaction_result['additional_information'];
            }
        }elseif($action == "undelete"){
            /*
                OPERATIONS
                ==>insert the row in `stock`
                ==>update the row in `stock_deleted`
            */

            $data = $_POST['data'];
            $barcodes_arr = getBarcodesData($data, "fetch_from_items");
            $barcodes_str = getBarcodesData($barcodes_arr, "join_barcodes");

            $columns_list_arr = getTableDefaultColumns("stock", false, true);
            $columns_list_str = join(", ", $columns_list_arr);

            $where_str = "`barcode` IN ($barcodes_str)";
            $where_str .= " AND `is_restored` = '0'";

            $stock_query_type = "custom";
            $stock_query_table = "stock";
            $stock_query_text = "INSERT INTO `stock` SELECT $columns_list_str FROM `stock_deleted` WHERE $where_str";
            $stock_query = get_query($stock_query_type, $stock_query_table, $stock_query_text);

            $stock_deleted_type = "update";
            $stock_deleted_table = "stock_deleted";
            $stock_deleted_set = array("is_restored=1", "affected_time=$date");
            $stock_deleted_where = $where_str;
            $stock_deleted_query = get_query($stock_deleted_type, $stock_deleted_table, $stock_deleted_set, $stock_deleted_where);

            $transaction_arr =  array(
                                    array("insert" => $stock_query),
                                    array("update" => $stock_deleted_query)
                                );
            
            $trasaction_result = execute_transactions($transaction_arr);
            $return['queries'] = $transaction_arr;
            
            if($trasaction_result['result']){
                $return['result'] = true;
                $return['info'] .= "restored stock from deleted stock successfully!";
                $return['data'] = "";
            }else{
                $return['info'] .= "error restoring stock from deleted stock";
                $return['additional_info'] .= $trasaction_result['additional_information'];
            }
        }elseif($action == "fetch_all"){
            if(array_key_exists('table', $_POST)){
                $query_table = $_POST['table'];;
            }

            $date_column = "date";
            if(array_key_exists('date_column', $_POST)){  
                $date_column = $_POST['date_column'];
            }

            $type = array_key_exists('type', $_POST) ? $_POST['type'] : "list";

            $start = array_key_exists('start', $_POST['data']) ? $_POST['data']['start'] : null;
            $end = array_key_exists('end', $_POST['data']) ? $_POST['data']['end'] : null;

            $return['start'] = $start;
            $return['end'] = $end;

            $where_clause = array("1");
            if($start && $end){
                $where_clause = "`$date_column` BETWEEN '$start 00:00:00' AND '$end 23:59:59'";
            }

            $conditions = array_key_exists('conditions', $_POST['data']) ? $_POST['data']['conditions'] : null;
            if($conditions){
                if(is_array($where_clause)){
                    $where_clause = $conditions;
                }else{
                    $where_clause .= " AND $conditions";
                }
            }

            $extra_column = null;

            if($query_table != "stock"){
                $extra_column = array("DATE_FORMAT(`row_date`, '%d-%m-%Y %H:%i:%s') AS `row_date`");
            }

            if($type == "summary"){
                $extra_column = array(
                    "ROUND(SUM(`making_cost`), 2) AS `total_making_cost`",
                    "ROUND(SUM(`retailer_cost`), 2) AS `total_retailer_cost`",
                    "ROUND(SUM(`wholesale_cost`), 2) AS `total_wholesale_cost`",
                    "COUNT(`shortcode`) AS `no_of_items`"
                );

                $group_by = "GROUP BY `shortcode`";
                if(is_array($where_clause)){
                    $where_clause = $group_by;
                }else{
                    $where_clause .= $group_by;
                }
            }elseif($type == "monthly"){
                $extra_column = array(
                    "DATE_FORMAT(`row_date`, '%M %Y') AS `month`",
                    "COUNT(`shortcode`) AS `no_of_items`",
                    "ROUND(SUM(`making_cost`), 2) AS `total_making_cost`",
                    "ROUND(SUM(`retailer_cost`), 2) AS `total_retailer_cost`",
                    "ROUND(SUM(`wholesale_cost`), 2) AS `total_wholesale_cost`"
                );

                $group_by = "GROUP BY YEAR(`row_date`), MONTH(`row_date`)";
                if(is_array($where_clause)){
                    $where_clause = $group_by;
                }else{
                    $where_clause .= $group_by;
                }
            }

            $fetched_all_records = fetchRecord($query_table, $extra_column, $where_clause);
            
            if($fetched_all_records['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
                $return['data'] = $fetched_all_records['data'];
            }else{
                $return['result'] = true;
                $return['data'] = array();
                $return['info'] .= $fetched_all_records['info'];
                $return['query'] = $fetched_all_records['query'];
                $return['additional_info'] .= $fetched_all_records['additional_info'];
            }
        }elseif($action == "fetch_barcodes"){
            $type = $_POST['type'];
            $data = $_POST['data'];

            $where_clause = array("1");
            if($type == "barcode_series"){
                $data = $data[0];
                $hyphen_index = strpos($data, "-");
                $begin_item_number = substr($data, 9, $hyphen_index - 9);
                $end_item_number = substr($data, $hyphen_index + 1);

                $barcode = substr($data, 0, $hyphen_index);

                $where_clause = "`generate_id` = (SELECT `generate_id` FROM `stock` WHERE `barcode`='$barcode') AND `item_number` >= $begin_item_number AND `item_number` <= $end_item_number";

            }elseif($type == "barcodes"){
                $where_clause = "";
                foreach($data as $barcode){
                    $where_clause .= "`barcode`='$barcode' OR ";
                }
                $where_clause = preg_replace("/( OR )$/", "", $where_clause);
            }else{
                $where_clause = array("generate_id=$data");
            }
            
            $fetched_all_records = fetchRecord($query_table, null, $where_clause);
            $return['query'] = $fetched_all_records['query'];

            if($fetched_all_records['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
                $return['data'] = $fetched_all_records['data'];
            }else{
                $return['result'] = false;
                
                $return['title'] = "Error Fetching Records";
                $return['content'] = $fetched_all_records['info'];
                
                $return['info'] .= $fetched_all_records['info'];
                $return['additional_info'] .= $fetched_all_records['additional_info'];
            }
        }elseif($action == "summary_data"){
            $table = $_POST['table'];
            $query_type = "custom";
            $query_text = 
            "
            SELECT 
                `item`,
                `shortcode`,
                `making_cost`,
                `retailer_cost` AS `unit_price`,
                COUNT(`shortcode`) AS `quantity`,
                '0' AS `sold_quantity`,
                ROUND(SUM(`retailer_cost`), 2) AS `total_price`
            FROM `$table` 
            GROUP BY `shortcode`, `retailer_cost`
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
                $return['additional_info'] .= $select_result['additional_info'];
            }
        }elseif($action == "billing_data"){
            $table = $_POST['table'];
            $query_type = "custom";
            $query_text = 
            "
            SELECT 
            ROUND(SUM(`making_cost`), 2) AS `making_cost`,
            ROUND(SUM(`retailer_cost`), 2) AS `sub_total`,
            '0' AS `tax`,
            ROUND(SUM(`retailer_cost`), 2) AS `total`,
            '0' AS `offer_percentage`,
            '0' AS `offer_amount`
            FROM `$table`
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
                $return['additional_info'] .= $select_result['additional_info'];
            }
        }elseif($action == "dump_stock"){
            /*
                OPERATIONS
                ==>insert the row in `stock_dump`
                ==>delete the row from `stock`
            */

            $data = json_decode($_POST['data'], true);
            $barcodes_arr = getBarcodesData($data, "fetch_from_items");
            $barcodes_str = getBarcodesData($barcodes_arr, "join_barcodes");
            $where_str = "`barcode` IN ($barcodes_str)";

            $stock_dump_query_type = "custom";
            $stock_dump_query_table = "stock_dump";
            $stock_dump_query_text = "INSERT INTO `stock_dump` SELECT NULL AS `row_id`, '$date' AS `row_date`, `stock`.*, NULL AS `is_restored`, NULL AS `affected_time` FROM `stock` WHERE $where_str";

            $stock_dump_query = get_query($stock_dump_query_type, $stock_dump_query_table, $stock_dump_query_text);
            
            $stock_query_type = "custom";
            $stock_query_table = $query_table;
            $stock_query_text = "DELETE FROM `stock` WHERE $where_str";
            $stock_query = get_query($stock_query_type, $stock_query_table, $stock_query_text);

            $transaction_arr =  array(
                                    array("insert" => $stock_dump_query),
                                    array("delete" => $stock_query)
                                );
            
            $trasaction_result = execute_transactions($transaction_arr);
            $return['queries'] = $transaction_arr;
            
            if($trasaction_result['result']){
                $return['result'] = true;
                $return['info'] .= "stock dumped successfully";
                $return['data'] = "";
            }else{
                $return['info'] .= "error dumping stock";
                $return['additional_info'] .= $trasaction_result['additional_information'];
            }
        }elseif($action == "undump"){
            /*
                OPERATIONS
                ==>insert the row in `stock`
                ==>update the row in `stock_dump`
            */

            $data = is_array($_POST['data']) ? $_POST['data'] : json_decode($_POST['data'], true);
            $barcodes_arr = getBarcodesData($data, "fetch_from_items");
            $barcodes_str = getBarcodesData($barcodes_arr, "join_barcodes");

            $columns_list_arr = getTableDefaultColumns("stock", false, true);
            $columns_list_str = join(", ", $columns_list_arr);

            $where_str = "`barcode` IN ($barcodes_str)";
            $where_str .= " AND `is_restored` = '0'";

            $stock_query_type = "custom";
            $stock_query_table = "stock";
            $stock_query_text = "INSERT INTO `stock` SELECT $columns_list_str FROM `stock_dump` WHERE $where_str";
            $stock_query = get_query($stock_query_type, $stock_query_table, $stock_query_text);

            $stock_dump_type = "update";
            $stock_dump_table = "stock_dump";
            $stock_dump_set = array("is_restored=1", "affected_time=$date");
            $stock_dump_where = $where_str;
            $stock_dump_query = get_query($stock_dump_type, $stock_dump_table, $stock_dump_set, $stock_dump_where);

            $transaction_arr =  array(
                                    array("insert" => $stock_query),
                                    array("update" => $stock_dump_query)
                                );
            
            $trasaction_result = execute_transactions($transaction_arr);
            $return['queries'] = $transaction_arr;
            
            if($trasaction_result['result']){
                $return['result'] = true;
                $return['info'] .= "restored stock from dump stock successfully!";
                $return['data'] = "";
            }else{
                $return['info'] .= "error restoring stock from dump stock";
                $return['additional_info'] .= $trasaction_result['additional_information'];
            }
        }elseif($action == "barcode_history"){
            $barcodes_list = array();
            
            if(preg_match('/^\d*$/', $_POST['data'])){
                $fetchedBarcodesList = getBarcodesfromGenerateId($_POST['data']);
                if($fetchedBarcodesList['result']){
                    $barcodes_list = getBarcodesData($fetchedBarcodesList['data'], "fetch_from_items");
                }else{
                    $return['info'] .= $fetchedBarcodesList['info'];
                }
            }else{
                $barcodes_list[] = $_POST['data'];
            }

            if(count($barcodes_list)){
                foreach($barcodes_list as $barcode){
                    $barcodeHistory = getBarcodeHistory($barcode);
                    if($barcodeHistory['result']){
                        $return['result'] = true;
                        $return['data'][] = $barcodeHistory['data'];
                    }else{
                        $return['result'] = false;
                        $return['info'] .= $barcodeHistory['info'];
                        break;
                    }
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