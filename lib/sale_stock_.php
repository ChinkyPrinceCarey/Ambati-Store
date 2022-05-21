<?php

error_reporting(E_ALL); // Error/Exception engine, always use E_ALL

ini_set('ignore_repeated_errors', TRUE); // always use TRUE

ini_set('display_errors', FALSE); // Error/Exception display, use FALSE only in production environment or real server. Use TRUE in development environment

ini_set('log_errors', TRUE); // Error/Exception file logging engine.
ini_set('error_log', './sale_errors.log'); // Logging file path

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
$return['info'] = "sale_stock.php: ";
$return['additional_info'] = "";

if(isset($_POST['data']) && !empty($_POST['data'])){
    if(isset($_POST['action']) && !empty($_POST['action'])){
        $action = $_POST['action'];
		$is_stock_shift = array_key_exists('is_stock_shift', $_POST) ? $_POST['is_stock_shift'] : false;
        $query_table = "sales";

        if($action == "sale_items"){
			$fields_def = array(
				SALE_TYPE,
				SELLER_ID,
				SELLER_NAME,
				CUSTOM_ID,
				CUSTOM_NAME,
				CUSTOMER_NAME,
				CUSTOMER_VILLAGE,
				CUSTOMER_DETAILS
			);

			if($is_stock_shift){
				$fields_def = array(
					SALE_TYPE,
					STORE_ID,
					STORE_NAME
				);
			}

			$fields_data = validate_fields($_POST, $fields_def);

			if($fields_data['result']){
				$last_record = fetchRecord($query_table, null, "1 ORDER BY `invoice_id` DESC LIMIT 1", false, false, true);
				//c$return['fetch_record'] = $last_record;

				if($last_record['result']){
					$items_data = $_POST['data'];
					if(count($items_data)){

						//------------------------------------------------------//
						$delete_query_type = "delete_or_clause";
						$delete_table = "stock";
						$delete_columns = array("id");
						$delete_where = array();
						foreach($items_data['list'] as $item){
							$delete_where[] = "barcode=" . $item['barcode'];
						}
						$delete_query = get_query($delete_query_type, $delete_table, $delete_columns, $delete_where);
						$return['delete_query'] = $delete_query;
						//------------------------------------------------------//

						//$last_record = $last_record['data'][0];
						$last_record = count($last_record['data']) ? $last_record['data'][0] : array("invoice_id" => 0);
						
						$last_invoice_id = $last_record['invoice_id'];
						
						$fields_data['data']['invoice_id'] = generateInvoiceId($last_invoice_id);
						$fields_data['data']['no_of_items'] = count($items_data['summary']);
						$fields_data['data']['no_of_units'] = count($items_data['list']);

						$fields_data['data']['making_cost'] = $items_data['billing']['making_cost'];
						$fields_data['data']['sub_total'] = $items_data['billing']['sub_total'];
						$fields_data['data']['total_price'] = $items_data['billing']['total'];
						$fields_data['data']['offer_percentage'] = $items_data['billing']['offer_percentage'];
						$fields_data['data']['offer_amount'] = $items_data['billing']['offer_amount'];
						

						$return['fields_data'] = $fields_data['data']; //for debugging
						
						//--------------------------------------------------------------------//
						$query_type = "insert";
						$query_columns = 	array(
												"invoice_id",
												"sale_type",
												"seller_id",
												"seller_name",
												"custom_id",
												"custom_name",
												"customer_name",
												"customer_village",
												"customer_details",
												"store_id",
												"store_name",
												"no_of_items",
												"no_of_units",
												"making_cost",
												"sub_total",
												"total_price",
												"offer_percentage",
												"offer_amount",
												"items_details",
												"is_sold"
											);
						
						$query_values =		array(
												$fields_data['data']['invoice_id'],
												$fields_data['data']['sale_type'],
												$fields_data['data']['seller_id'],
												$fields_data['data']['seller_name'],
												$fields_data['data']['custom_id'],
												$fields_data['data']['custom_name'],
												$fields_data['data']['customer_name'],
												$fields_data['data']['customer_village'],
												$fields_data['data']['customer_details'],
												$fields_data['data']['store_id'],
												$fields_data['data']['store_name'],
												$fields_data['data']['no_of_items'],
												$fields_data['data']['no_of_units'],
												$fields_data['data']['making_cost'],
												$fields_data['data']['sub_total'],
												$fields_data['data']['total_price'],
												$fields_data['data']['offer_percentage'],
												$fields_data['data']['offer_amount'],
												json_encode($items_data),
												$is_stock_shift ? "0" : "1"
											);

						$insert_query = get_query($query_type, $query_table, $query_columns, $query_values);
						$return['insert_query'] = $insert_query;
						//--------------------------------------------------------------------//

						$queries_to_execute = 	array(
													array("insert" =>$insert_query),
													array("delete" =>$delete_query)
												);
						
						$trasaction_result = execute_transactions($queries_to_execute);
				
						$return['transaction_queries'] = $queries_to_execute;
				
						if($trasaction_result['result']){
							$return['result'] = true;
							$return['info'] .= "items sold successfully!";
							$return['fields_data'] = $fields_data['data'];
							$return['invoice_id'] = $fields_data['data']['invoice_id'];
						}else{
							$return['info'] .= "error selling items";
                    		$return['additional_info'] .= $trasaction_result['additional_information'];
						}
					}else{
						$return['info'] .= "empty items data ";	
					}
				}else{
					$return['info'] .= "unable to get last record ";
					$return['additional_info'] .= $last_record['additional_info'];
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

file_put_contents('./parameters_0702221851.txt', json_encode($_POST));

//file_put_contents('./sale_error_log.txt', $json_return);



print_r($json_return);
?>