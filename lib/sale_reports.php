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
$return['info'] = "sale_reports.php: ";
$return['additional_info'] = "";

if(isset($_POST['data']) && !empty($_POST['data'])){
    if(isset($_POST['action']) && !empty($_POST['action'])){
        if(isset($_POST['type']) && !empty($_POST['type'])){
            $action = $_POST['action'];
            $type = $_POST['type'];
            $query_table = "sales";

            if($action == "fetch_all"){
                $request_sale_type = $_POST['sale_type'];

                $start = array_key_exists('start', $_POST['data']) ? $_POST['data']['start'] : null;
                $end = array_key_exists('end', $_POST['data']) ? $_POST['data']['end'] : null;

                $return['start'] = $start;
                $return['end'] = $end;

                $where_clause = array("is_updated=0");
                if($start && $end){
                    $where_clause = "date BETWEEN '$start 00:00:00' AND '$end 23:59:59' AND `is_updated`='0'";
                    
                    if($request_sale_type == "store"){
                        $where_clause .= " AND `sale_type`='store'";
                    }
                }

                $extra_columns = array();
                if($type == "overview"){
                    $extra_columns = array("no_of_items", "no_of_units", "making_cost", "(`total_price` - `making_cost`) AS `profit`", "total_price", "offer_percentage", "offer_amount", "is_finished");
                }elseif($type == "summary"){
                    $extra_columns = array("JSON_EXTRACT(`items_details`, '$.summary') AS `summary`");
                }elseif($type == "list"){
                    $extra_columns = array("JSON_EXTRACT(`items_details`, '$.list') AS `list`");
                }

                $fetched_all_records = fetchRecord($query_table, $extra_columns, $where_clause);
                
                if($fetched_all_records['result']){
                    $return['result'] = true;
                    $return['info'] .= "fetched all records ";

                    if($type == "overview"){
                        $return['data'] = $fetched_all_records['data'];
                    }else{
                        $updated_records = array();
                        $slno = 1;

                        $records = $fetched_all_records['data'];
                        foreach($records as $record){
                            $id = $record['id'];
                            $date = $record['date'];
                            $invoice_id = $record['invoice_id'];
                            $sale_type = $record['sale_type'];
                            $seller_id = $record['seller_id'];
                            $seller_name = $record['seller_name'];
                            $custom_id = $record['custom_id'];
                            $custom_name = $record['custom_name'];

                            $specified_records = $record[$type];
                            foreach($specified_records as &$specified_record){
                                $specified_record['slno'] = $slno; $slno++;
                                $specified_record['id'] = $record['id'];
                                $specified_record['date'] = $record['date'];
                                $specified_record['invoice_id'] = $record['invoice_id'];
                                $specified_record['sale_type'] = $record['sale_type'];
                                $specified_record['seller_id'] = $record['seller_id'];
                                $specified_record['seller_name'] = $record['seller_name'];
                                $specified_record['custom_id'] = $record['custom_id'];
                                $specified_record['custom_name'] = $record['custom_name'];
                                
                                if($type == "summary"){
                                    $specified_record['making_cost'] *= $specified_record['quantity'];
                                    
                                    //18% GST
                                    //$specified_record['total_price'] *= 1.18;
                                    $specified_record['total_price'] = round($specified_record['total_price'], 2);
                                    
                                    $specified_record['profit'] = $specified_record['total_price'] - $specified_record['making_cost'];
                                    $specified_record['profit'] = round($specified_record['profit'], 2);

                                }else{
                                    //18% GST
                                    //$specified_record['unit_price'] *= 1.18;
                                    $specified_record['unit_price'] = round($specified_record['unit_price'], 2);

                                    $specified_record['profit'] = $specified_record['unit_price'] - $specified_record['making_cost'];
                                    $specified_record['profit'] = round($specified_record['profit'], 2);
                                }

                                if($specified_record['sale_type'] == "store" && $type == "summary"){
                                    if((int)$specified_record['sold_quantity'] > 0){
                                        $hold_quantity = (int)$specified_record['quantity'] - (int)$specified_record['sold_quantity'];

                                        //**************SOLD RECORD**************//
                                        $sold_record = $specified_record;
                                        $sold_record['quantity'] = $specified_record['sold_quantity'];
                                        $sold_record['making_cost'] *= $sold_record['quantity'];
                                        $sold_record['total_price'] = $sold_record['unit_price'] * $sold_record['quantity'];
                                        $sold_record['is_finished'] = 1;

                                        $updated_records[] = $sold_record;

                                        if($hold_quantity > 0){
                                            //**************HOLD RECORD**************//
                                            $hold_record = $specified_record;
                                            $hold_record['quantity'] = $hold_quantity;
                                            $hold_record['making_cost'] *= $hold_record['quantity'];
                                            $hold_record['total_price'] = $hold_record['unit_price'] * $hold_record['quantity'];
                                            $hold_record['is_finished'] = 0;

                                            $updated_records[] = $hold_record;
                                        }
                                    }else{
                                        $hold_record = $specified_record;
                                        $hold_record['is_finished'] = 0;
                                        
                                        $updated_records[] = $hold_record;
                                    }
                                }else{
                                    $specified_record['is_finished'] = 1;
                                    $updated_records[] = $specified_record;
                                }
                            }
                        }
                        $return['data'] = $updated_records;
                    }
                }else{
                    $return['result'] = true;
                    $return['data'] = array();
                    $return['info'] .= $fetched_all_records['info'];
                    $return['additional_info'] .= $fetched_all_records['additional_info'];
                }
            }elseif($action == "fetch_invoice"){
                $invoice_id = $_POST['data'];

                $extra_columns = array("items_details");
                $where_clause = "`invoice_id` LIKE '$invoice_id' AND `is_updated`=0 AND `is_finished`=1";
                //$where_clause = array("invoice_id=$invoice_id", "is_updated=0");

                $fetched_all_records = fetchRecord($query_table, $extra_columns, $where_clause);
                $return['fetch'] = fetchRecord($query_table, $extra_columns, $where_clause);
                
                if($fetched_all_records['result']){
                    $return['result'] = true;
                    $return['info'] .= "fetched invoice ";
                    $return['data'] = $fetched_all_records['data'];
                }else{
                    $return['info'] = "Invoice Id# $invoice_id doesn't exist";
                    //$return['info'] .= $fetched_all_records['info'];

                    $return['title'] = "Invoice not Exist";
                    $return['content'] = $return['info'];

                    $return['additional_info'] .= $fetched_all_records['additional_info'];
                }
            }else{
                $return['info'] .= "action: $action does not exist";
            }
        }else{
            $return['info'] .= "empty type";    
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