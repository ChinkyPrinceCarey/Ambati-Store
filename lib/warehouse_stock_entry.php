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
            $fields_def = array(GENERATE_ID, MATERIAL, ITEM, SHORTCODE, TYPE, UNIT, QUANTITY, MAKING_COST, RETAILER_COST, WHOLESALE_COST);
            $fields_data = validate_fields($_POST, $fields_def);

            if($fields_data['result']){
				
				//$query_table defined earlier
				$query_type = "insert";
				$query_columns = 	array(
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
										"custom_data"
									);
				$query_values =		array(
										$fields_data['data']['generate_id'],
										$fields_data['data']['date'],
										$fields_data['data']['material'],
										$fields_data['data']['item'],
										$fields_data['data']['shortcode'],
										$fields_data['data']['type'],
										$fields_data['data']['unit'],
										$fields_data['data']['quantity'],
										$fields_data['data']['making_cost'],
										$fields_data['data']['retailer_cost'],
										$fields_data['data']['wholesale_cost'],
										$fields_data['data']['custom_data']
									);

									
				$query_columns[] = "item_number";
				$query_columns[] = "barcode";
				
				$queries_to_execute = 	array();
				$current_item_no = $fields_data['data']['current_item_no'];
				foreach($fields_data['data']['barcodes'] as $iter_barcode){
					
					$iter_query_values = $query_values;
					
					$iter_query_values[] = $current_item_no;
					$iter_query_values[] = $iter_barcode;
					
					$insert_query = get_query($query_type, $query_table, $query_columns, $iter_query_values);
					
					$queries_to_execute[] = array("insert" => $insert_query);
					
					$current_item_no++;
				}
				
				$trasaction_result = execute_transactions($queries_to_execute);
				
				$return['queries'] = $queries_to_execute;
				
				if($trasaction_result['result']){
					$return['result'] = true;
                    $return['info'] .= "stock added successfully";
					$return['data'] = "";
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