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
        $is_sold_clause_str = " AND `is_sold`=0 ";

        if($action == "remove"){

            /*
                Unlike the other pages operation for `remove` action,
                Here we,
                first insert the record to `stock_deleted` table
                then delete the record from `stock` table
                And we do it in a transaction to avoid any data lose
            */

            $data = $_POST['data'];

            $query_where = array();
            foreach($data as $iter_data){
                //'cause we delete multiple rows at once
                $query_where[] = "id=" . $iter_data['id'];
            }

            $insert_into_type = "custom";
            $insert_into_table = "stock_deleted";
            $insert_into = "INSERT INTO stock_deleted SELECT * FROM stock WHERE " . join(" || ", $query_where);
            $insert_into .= $is_sold_clause_str;

            $insert_into_query = get_query($insert_into_type, $insert_into_table, $insert_into);
            
            
            $update_type = "update2";
            $update_table = $query_table;
            $update_set = array("is_sold=1");
            $update_where = $query_where;

            $update_query = get_query($update_type, $update_table, $update_set, $update_where);
            $update_query['query'] .= $is_sold_clause_str;

            $transaction_arr =  array(
                                    array("insert" => $insert_into_query),
                                    array("update" => $update_query)
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
        }elseif($action == "fetch_all"){
            $type = array_key_exists('type', $_POST) ? $_POST['type'] : "list";

            $start = array_key_exists('start', $_POST['data']) ? $_POST['data']['start'] : null;
            $end = array_key_exists('end', $_POST['data']) ? $_POST['data']['end'] : null;

            $return['start'] = $start;
            $return['end'] = $end;

            $where_clause = array("is_sold=0");
            if($start && $end){
                $where_clause = "date BETWEEN '$start' AND '$end'";
                $where_clause .= $is_sold_clause_str;
            }

            $extra_column = null;

            if($type == "summary"){
                $extra_column = array(
                    "SUM(`making_cost`) AS `total_making_cost`",
                    "SUM(`retailer_cost`) AS `total_retailer_cost`",
                    "SUM(`wholesale_cost`) AS `total_wholesale_cost`",
                    "COUNT(`shortcode`) AS `no_of_items`"
                );

                $group_by = "GROUP BY `shortcode`";
                if(is_array($where_clause)){
                    $where_clause = "`is_sold`=0 ";
                    $where_clause .= $group_by;
                }else{
                    $where_clause .= $is_sold_clause_str;
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