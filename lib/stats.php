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
$return['info'] = "stats.php: ";
$return['additional_info'] = "";

if(isset($_POST['data']) && !empty($_POST['data'])){

    $today_date = get_date("y-m-d", "today");
    $this_month_date = get_date("y-m-d", "this_month");
    //$this_year_date = get_date("y-m-d", "this_year");
    $this_year_date = "2022-01-01";
    
    $query_type = "custom";
    $query_table = "multiple";
    $query = "
    SELECT
        stock_1.today_stock_items, 
        stock_2.this_month_stock_items, 
        stock_3.total_stock_items, 
        
        sales_1.today_sales, 
        sales_1.today_revenue, 
        sales_1.today_profit,
        
        sales_2.this_month_sales, 
        sales_2.this_month_revenue, 
        sales_2.this_month_profit,
        
        sales_3.total_sales, 
        sales_3.total_revenue, 
        sales_3.total_profit
    FROM

    (SELECT COUNT(`id`) AS `today_stock_items` FROM `stock`  WHERE `date` BETWEEN '$today_date' AND '$today_date') AS `stock_1`,
    (SELECT COUNT(`id`) AS `this_month_stock_items` FROM `stock`  WHERE `date` BETWEEN '$this_month_date' AND '$today_date') AS `stock_2`,
    (SELECT COUNT(`id`) AS `total_stock_items` FROM `stock`  WHERE `date` BETWEEN '$this_year_date' AND '$today_date') AS `stock_3`,
    
    (SELECT SUM(`no_of_units`) AS `today_sales`, 
            SUM(`total_price`) AS `today_revenue`,
            SUM(`total_price`) - SUM(`making_cost`) AS `today_profit` 
    FROM `sales` WHERE `is_updated`='0' AND `date` BETWEEN '$today_date 00:00:00' AND '$today_date 23:59:59') AS `sales_1`,
    
    
    (SELECT SUM(`no_of_units`) AS `this_month_sales`, 
            SUM(`total_price`) AS `this_month_revenue`,
            SUM(`total_price`) - SUM(`making_cost`) AS `this_month_profit` 
    FROM `sales` WHERE `is_updated`='0' AND `date` BETWEEN '$this_month_date 00:00:00' AND '$today_date 23:59:59') AS `sales_2`,
    
    
    (SELECT SUM(`no_of_units`) AS `total_sales`, 
            SUM(`total_price`) AS `total_revenue`,
            SUM(`total_price`) - SUM(`making_cost`) AS `total_profit` 
    FROM `sales` WHERE `is_updated`='0' AND `date` BETWEEN '$this_year_date 00:00:00' AND '$today_date 23:59:59') AS `sales_3`
    
    ";

    $select_query = get_query($query_type, $query_table, $query);
    $select_result = select_query($select_query);
    
    if($select_result['result']){
        $return['result'] = true;
        $return['info'] .= "fetched all records ";
        $return['data'] = $select_result['additional_data'];
    }else{
        $return['result'] = false;
        $return['info'] .= $select_result;
        //$return['additional_info'] .= $select_result['additional_info'];
    }
}else{
    $return['info'] .= "invalid request";
}

$json_return = json_encode($return);
print_r($json_return);
?>