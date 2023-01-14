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
$return['info'] = "sale_stock.php: ";
$return['additional_info'] = "";

if(isset($_POST['data']) && !empty($_POST['data'])){
	if(isset($_POST['action']) && !empty($_POST['action'])){
		$action = $_POST['action'];
		$is_stock_shift = array_key_exists('is_stock_shift', $_POST) ? $_POST['is_stock_shift'] : false;
		$query_table = "sales";

		if(
					$action == "sale_items"
			||	$action == "vehicle_stock_shift"
			||	$action == "vehicle_stock_return"
		){

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

			$fields_data = validate_fields($_POST, $fields_def);

			if($fields_data['result']){
				$return = sale_stock($fields_data, $is_stock_shift);
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