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

function generate_where($arr){
	foreach($arr as &$item){
		$item = "invoice_id=$item";
	}

	return $arr;
}
?>
<?php
$return = array();
$return['result'] = false;
$return['info'] = "merge_invoices.php: ";
$return['additional_info'] = "";

$invoice_ids_arr = array(
	"277",
	"278"
);

$query_type = "select2";
$query_table = "sales";
$query_columns = array("seller_id", "seller_name", "items_details");
$query_where = generate_where($invoice_ids_arr);

$select_query = get_query($query_type, $query_table, $query_columns, $query_where);
$return['query'] = $select_query['query'];

$select_result = select_query($select_query);

if($select_result['result']){
	$return['result'] = true;
	$return['info'] = $select_result;
	//$return['data'] = $select_result['additional_data'];

}else{
	$return['result'] = false;
	$return['info'] = $select_result;
}

$json_return = json_encode($return);
print_r($json_return);
?>