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
$return['info'] = "sale_cancel.php: ";
$return['additional_info'] = "";

if(isset($_POST['data']) && !empty($_POST['data'])){
    if(isset($_POST['action']) && !empty($_POST['action'])){
        $action = $_POST['action'];
        $query_table = "sales";

        if($action == "sale_cancel"){

					$id = $_POST['data']['id'];
					$invoice_id = $_POST['data']['invoice_id'];
					$seller_id = $_POST['data']['seller_id'];
					$seller_name = $_POST['data']['seller_name'];
					$custom_id = $_POST['data']['custom_id'];
					$custom_name = $_POST['data']['custom_name'];
					$sale_type = $_POST['data']['sale_type'];
					$customer_name = $_POST['data']['customer_name'];
					$customer_village = $_POST['data']['customer_village'];
					$customer_details = $_POST['data']['customer_details'];

					$updated_invoice_id = generateInvoiceId($invoice_id, true);
			
					/*
						1. update column `is_updated` to '1' of existing invoice
						2. insert new invoice [only if there are any items left]
						3. add back items to stock
					*/

					$queries_to_execute = 	array();

					/* 1. update column `is_updated` to '1' of existing invoice */
					$update_type = "update";
					$update_table = $query_table;
					$update_set = array("is_updated=1");
					//$update_where = array("invoice_id=$invoice_id");
					$update_where = "`id`='$id' AND `invoice_id` LIKE '$invoice_id' AND `is_updated`=0";
					$update_query = get_query($update_type, $update_table, $update_set, $update_where);
					$return['update_query'] = $update_query;
					$queries_to_execute[] = array("update" => $update_query);

					/* 2. insert new invoice [only if there are any items left] */
					if(array_key_exists("summary", $_POST['current_invoice'])){
						$insert_type = "insert";
						$insert_table = $query_table;
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
											"no_of_items",
											"no_of_units",
											"making_cost",
											"sub_total",
											"total_price",
											"items_details",
											"is_finished"
										);

						$query_values =		array(
												$updated_invoice_id,
												$sale_type,
												$seller_id,
												$seller_name,
												$custom_id,
												$custom_name,
												$customer_name,
												$customer_village,
												$customer_details,
												count($_POST['current_invoice']['summary']),
												count($_POST['current_invoice']['list']),
												$_POST['current_invoice']['billing']['making_cost'],
												$_POST['current_invoice']['billing']['sub_total'],
												$_POST['current_invoice']['billing']['total'],
												json_encode($_POST['current_invoice']),
												1
											);

						$insert_query = get_query($insert_type, $insert_table, $query_columns, $query_values);
						$return['insert_query'] = $insert_query;
						$queries_to_execute[] = array("insert" => $insert_query);
					}

					/* 3. add back items to stock */
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
						
					foreach($_POST['cancelled_invoice']['list'] as $cancelled_item){
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
						$queries_to_execute[] = array("insert" => $stock_insert_query);
					}

					$trasaction_result = execute_transactions($queries_to_execute);
			
					$return['queries'] = $queries_to_execute;
			
					if($trasaction_result['result']){
						$return['result'] = true;
						$return['info'] .= "items cancelled successfully";

						//escape backslash
						$updated_invoice_id = str_replace("\\", "", $updated_invoice_id);

						if(array_key_exists("summary", $_POST['current_invoice'])){
							$return['success_title'] = "Items Successfully Cancelled from Sale";
							$return['success_content'] = "<p>Invoice Id#: <b>$updated_invoice_id</b></p>";
											$return['success_content'] .= "<p>Updated Invoice Id added to sale reports!</p>";
											$return['success_content'] .= "<p>Cancelled items are added back to the stock!</p>";
						}else{
							$return['success_title'] = "All Items Successfully Cancelled from Sale";
							$return['success_content'] = "<p>Total Items are cancelled from sale with Invoice Id: <b>$invoice_id</b></p>";
											$return['success_content'] .= "<p>Cancelled items are added back to the stock!</p>";
						}

						$return['invoice_id'] = $updated_invoice_id;
						$return['fields_data'] = $_POST['data'];
						$return['data'] = "";
					}else{
						$return['info'] .= "error cancelling items from sale";
						$return['additional_info'] .= $trasaction_result['additional_information'];
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