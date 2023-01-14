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
$return['info'] = "warehouse_stock_entry: ";
$return['additional_info'] = "";

if(isset($_POST['data']) && !empty($_POST['data'])){
    if(isset($_POST['action']) && !empty($_POST['action'])){
        $action = $_POST['action'];
        $query_table = "stock";

        if($action == "stock_entry"){
            $fields_def = array(MATERIAL, ITEM, SHORTCODE, TYPE, UNIT, QUANTITY, MAKING_COST, RETAILER_COST, WHOLESALE_COST);
            $fields_data = validate_fields($_POST, $fields_def);

            if($fields_data['result']){
							//$query_table defined earlier
							$query_type = "insert";
							$query_columns = 	array(
													"date",
													"material",
													"item",
													"shortcode",
													"type",
													"unit",
													"custom_data",
													"is_cotton"
												);
							$query_values =		array(
													$fields_data['data']['date'],
													$fields_data['data']['material'],
													$fields_data['data']['item'],
													$fields_data['data']['shortcode'],
													$fields_data['data']['type'],
													$fields_data['data']['unit'],
													$fields_data['data']['custom_data'],
													$fields_data['data']['is_cotton']
												);

							if($fields_data['data']['is_cotton']){
									$quantity = (int) $fields_data['data']['quantity'];
									$combinedMaking_cost = (int) $fields_data['data']['making_cost'];
									$combinedRetailer_cost = (int) $fields_data['data']['retailer_cost'];
									$combinedWholesale_cost = (int) $fields_data['data']['wholesale_cost'];

									$individualMaking_cost = (int) ($combinedMaking_cost / $quantity);
									$individualRetailer_cost = (int) ($combinedRetailer_cost / $quantity);
									$individualWholesale_cost = (int) ($combinedWholesale_cost / $quantity);

									$query_columns[] = "quantity";
									$query_values[] = "1";
									
									$query_columns[] = "making_cost";
									$query_values[] = $individualMaking_cost;
									
									$query_columns[] = "retailer_cost";
									$query_values[] = $individualRetailer_cost;
									
									$query_columns[] = "wholesale_cost";
									$query_values[] = $individualWholesale_cost;
							}else{
								$query_columns[] = "generate_id";
								$query_values[] = $fields_data['data']['generate_id'][0];

								$query_columns[] = "quantity";
								$query_values[] = $fields_data['data']['quantity'];
								
								$query_columns[] = "making_cost";
								$query_values[] = $fields_data['data']['making_cost'];
								
								$query_columns[] = "retailer_cost";
								$query_values[] = $fields_data['data']['retailer_cost'];
								
								$query_columns[] = "wholesale_cost";
								$query_values[] = $fields_data['data']['wholesale_cost'];
							}

							if($fields_data['data']['is_cotton']){
								$query_columns[] = "generate_id";	
							}
							$query_columns[] = "barcode";
							$query_columns[] = "item_number";
							
							$queries_to_execute = 	array();
							$current_item_no = $fields_data['data']['current_item_no'];
							foreach($fields_data['data']['barcodes'] as $iter_barcode){
								
								$iter_query_values = $query_values;
								
								if($fields_data['data']['is_cotton']){
									$iter_query_values[] = $iter_barcode['generate_id'];
									$iter_query_values[] = $iter_barcode['barcode'];
								}else{
									$iter_query_values[] = $iter_barcode;
								}
								$iter_query_values[] = $current_item_no;
								
								$insert_query = get_query($query_type, $query_table, $query_columns, $iter_query_values);
								
								$queries_to_execute[] = array("insert" => $insert_query);
								
								$current_item_no++;
							}

							$no_of_items = count($fields_data['data']['barcodes']);

							$stock_history_query_type = "insert";
							$stock_history_query_table = "stock_history";
							$stock_history_query_columns = array("generate_id", "date", "material", "item", "shortcode", "type", "unit", "quantity", "making_cost", "retailer_cost", "wholesale_cost", "profit");
							$stock_history_query_values = array(
													$fields_data['data']['generate_id'][0],
													$fields_data['data']['date'],
													$fields_data['data']['material'],
													$fields_data['data']['item'],
													$fields_data['data']['shortcode'],
													$fields_data['data']['type'],
													$fields_data['data']['unit'],
													$no_of_items,
													($fields_data['data']['making_cost'] * $no_of_items),
													($fields_data['data']['retailer_cost'] * $no_of_items),
													($fields_data['data']['wholesale_cost'] * $no_of_items),
													'0'
							);
							$stock_history_query = get_query($stock_history_query_type, $stock_history_query_table, $stock_history_query_columns, $stock_history_query_values);

							$queries_to_execute[] = array("insert" => $stock_history_query);
							
							$trasaction_result = execute_transactions($queries_to_execute);
							
							//$return['queries'] = $queries_to_execute;
							
							if($trasaction_result['result']){
								$return['result'] = true;
								$return['info'] .= "stock added successfully";
								$return['data'] = "";
								$return['usage'] = get_memory();
							}else{
									$return['info'] .= "error adding stock";
									$return['additional_info'] .= $trasaction_result['additional_information'];

									//debug
									$return['query'] = $insert_query;
							}
            }else{
                $return['info'] .= "invalid data " . $fields_data['info'];
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