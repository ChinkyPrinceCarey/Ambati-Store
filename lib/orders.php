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
$return['info'] = "orders.php: ";
$return['additional_info'] = "";

if(isset($_POST['data']) && !empty($_POST['data'])){
    if(isset($_POST['action']) && !empty($_POST['action'])){
        $action = $_POST['action'];
        $query_table = "orders";

        $manual_key_names = ['slno', 'making_cost', 'retailer_cost', 'available_stock'];

        $id = getKeyinArr($_POST['data']);

        $default_where_column = "id";
        $default_where_value = $id;
        $default_where = array("$default_where_column=$default_where_value");

        $fields_def = array(
                        USERNAME, NAME, MOBILE_NUMBER, ADDRESS
                    	);
        $_post_data = is_numeric($id) ? $_POST['data'][$id] : null ;

        if($action == "create"){
            $fields_data = validate_fields($_POST, $fields_def);
            if($fields_data['result']){

							$order_id = getOrderId();
							if($order_id['result']){
								$order_id = $order_id['data'];

								$fields_data = $fields_data['data'];

								$items_data = $fields_data['data'];
								$items_data = json_decode($items_data, true);

								if(json_last_error() === JSON_ERROR_NONE){
									if(count($items_data)){
										$sale_type = "order";
										$username = $fields_data['username'];
										$name = $fields_data['name'];
										$mobile_number = $fields_data['mobile_number'];
										$address = $fields_data['address'];

										$no_of_items = $fields_data['total_items'];
										$no_of_units = count($items_data['summary']);
										
										$making_cost = 0;
										$sub_total = $items_data['billing']['sub_total'];
										$total_price = $items_data['billing']['total'];
										$offer_percentage = $items_data['billing']['offer_percentage'];
										$offer_amount = $items_data['billing']['offer_amount'];

										$query_type = "insert";
										$query_columns = array(
																			"order_id",
																			"sale_type",
																			"username",
																			"name",
																			"mobile_number",
																			"address",
																			"no_of_items",
																			"no_of_units",
																			"making_cost",
																			"sub_total",
																			"total_price",
																			"offer_percentage",
																			"offer_amount",
																			"items_details"
																		);
										$query_values =	array(
																			$order_id,
																			$sale_type,
																			$username,
																			$name,
																			$mobile_number,
																			$address,
																			$no_of_items,
																			$no_of_units,
																			$making_cost,
																			$sub_total,
																			$total_price,
																			$offer_percentage,
																			$offer_amount,
																			json_encode($items_data)
																		);

										$insert_query = get_query($query_type, $query_table, $query_columns, $query_values);
                		//$return['insert_query'] = $insert_query;

                    //$_SERVER['HTTP_HOST'] != "localhost"
										if(true){
											$insert_result = insert_query($insert_query);
											if($insert_result['result']){
												$return['result'] = true;
                        $return['info'] .= "order created";
                        $return['order_id'] = $order_id;
											}else{
												$return['info'] .= "error creating order: database error";
											}
										}else{
											//requesting on local_server
											$return['info'] .= "error creating order: Requesting on local_server";
										}
									}else{
										//no items in order
										$return['info'] .= "error creating order: No Items in Order";
									}
								}else{
									//error parsing orders
									$return['info'] .= "error creating order: parsing orders";
								}
							}else{
								//error creating order
								$return['info'] .= "error creating order: fetching order_id";
							}
            }else{
                $return['info'] .= "error creating order: " . $fields_data['info'];
            }
        	}elseif($action == "edit"){
            $data = $_POST['data'];

            $fields_data = validate_fields($_post_data, $fields_def);
            if($fields_data['result']){
                $query_set = array();
                $row_set_arr = $fields_data['data'];
                
                unset($row_set_arr['id']);
                unset($row_set_arr['image-many-count']);
                
                foreach($manual_key_names as $key){
                    unset($row_set_arr[$key]);
                }

                foreach($row_set_arr as $set_column => $set_value){
                    $query_set[] = "$set_column=$set_value";
                }
                
                $query_type = "update";
                //$query_table defined earlier
                //$query_set defined just above
                //$default_where will be used;

                $update_query = get_query($query_type, $query_table, $query_set, $default_where);
                $return['query'] = $update_query; //for debugging

                $update_result = null;

                if($_SERVER['HTTP_HOST'] == "localhost"){
                    //request on localhost,
                    //so have to queue update on localhost
                    //then call & update on remote server
                    $transaction_connection = begin_transaction();

                    $update_result = update_query($update_query, $transaction_connection);
                    if($update_result['result']){
                        $update_result = curl_request(REMOTE_SERVER_ITEMS_API_ENDPOINT, $_POST);
                        if($update_result['result']){
                            if(
                                    array_key_exists("result", $update_result['data'])
                                &&  $update_result['data']['result']
                            ){
                                $update_result = commit_transaction($transaction_connection);
                            }else{
                                $update_result['result'] = false;
                                $update_result['info'] = "error from remote server: " . $update_result['data']['info'];
                                $update_result['additional_information'] = "error from remote server: " . $update_result['data']['additional_info'];
                            }
                        }else{
                            $update_result['info'] = "error connecting to remote server: " . $update_result['info'];
                            $update_result['additional_information'] = "error connecting to remote server: " . $update_result['info'];
                        }
                    }
                }else{
                    //request on remote server,
                    //just update on remote server
                    $update_result = update_query($update_query);
                }

                if($update_result['result']){
                    $manual_columns =  array();
                    foreach($manual_key_names as $key_name){
                        $manual_columns[] = "'$_post_data[$key_name]' AS `$key_name`";
                    }
                    $updated_record = fetchRecord($query_table, $manual_columns, $default_where, false);
                    $return['info'] .= "record updated ";
                    if($updated_record['result']){
                        $return['result'] = true;
                        $return['info'] .= "and fetched record ";
                        $return['data'] = $updated_record['data'];
                    }else{
                        $return['info'] .= "but " . $updated_record['info'];
                        $return['additional_info'] .= $updated_record['additional_info'];
                    }
                }else{
                    $return['info'] .= "error updating the record ";
                    $return['additional_info'] .= $update_result['additional_information'];

                    //debug
                    $return['query'] = $update_query;
                }
            }else{
                $return['info'] .= "invalid data " . $fields_data['info'];
            }
        }elseif($action == "fetch_all"){
            $fetched_all_records = null;
            if($_SERVER['HTTP_HOST'] == "localhost"){
                $fetched_all_records = curl_request(REMOTE_SERVER_ORDERS_API_ENDPOINT, $_POST);

                if($fetched_all_records['result']){
                    if($fetched_all_records['data']['result']){
                        $return['result'] = true;
                        $return['data'] = $fetched_all_records['data']['data'];
                    }else{
                        $return['info'] .= $fetched_all_records['data']['info'];
                    }
                }else{
                    $return['data'] = array();
                    $return['info'] .= $fetched_all_records['info'];
                    $return['additional_info'] .= $fetched_all_records['additional_info'];
                }
            }else{
                $extra_columns = array("no_of_items", "no_of_units", "making_cost", "sub_total", "total_price", "offer_percentage", "offer_amount", "is_confirmed", "is_paid");
                $fetched_all_records = fetchRecord($query_table, $extra_columns);

                $return = $fetched_all_records;
            }
        }elseif($action == "fetch_for_app"){
            $query_type = "custom";
            //$query_table defined earlier
            $categories_query_text = 
            "
            SELECT DISTINCT `type` FROM `items`
            ";
			
            $categories_query = get_query($query_type, $query_table, $categories_query_text);
            $categories_result = select_query($categories_query);
			
			$query_text = 
            "
            SELECT * FROM (
                SELECT * FROM (
                    SELECT * FROM `items` WHERE `priority` != 'default' AND `material` != 'raw' AND `in_stock` = 1 ORDER BY `datetime` DESC
                ) AS `t1` 
            ORDER BY FIELD(`priority`, 'top', 'new', 'offer')
            ) `t2`
            
            UNION
            
            SELECT * FROM (SELECT * FROM `items` WHERE `priority` = 'default' AND `material` != 'raw' AND `in_stock` = 1 ORDER BY rand()) `t3`
            ";
			
            $select_query = get_query($query_type, $query_table, $query_text);
            $select_result = select_query($select_query);
			
			//$return['query'] = $select_query;

            if($categories_result['result'] && $select_result['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
				$return['header'] = array(
										"header_1" => "Ambati Tasty Foods - Laxmiravulapalle, Telangana",
										"header_2" => "Online store for Keerana Vendors",
										"app_button" => "App Coming Soon",
										"mobile_number" => "8096031765"
									);
                $return['categories'] = $categories_result['additional_data'];
                $return['items'] = $select_result['additional_data'];
            }else{
                $return['result'] = true;
                $return['items'] = array();
                $return['info'] .= $select_result['info'];
                //$return['additional_info'] .= $select_result['additional_info'];
            }
        }elseif($action == "fetch_specified"){
            $query_type = "select";
            //$query_table defined earlier
            $query_columns = $_POST['required_fields'];
            $query_where = $_POST['rules'];            
            $suffix_query = array_key_exists('suffix_query', $_POST) ? $_POST['suffix_query'] : null;

            $select_query = get_query($query_type, $query_table, $query_columns, $query_where, $suffix_query);
            $return['query'] = $select_query['query'];

            $select_result = select_query($select_query);

            if($select_result['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
                $return['data'] = $select_result['additional_data'];
            }else{
                $return['result'] = true;
                $return['data'] = array();
                $return['info'] .= $select_result['info'];
                //$return['additional_info'] .= $select_result['additional_info'];
            }
        }elseif($action == "fetch_item_data"){
            $shortcode = $_POST['shortcode'];

            $query_type = "custom";
            //$query_table defined earlier
            $query_text = 
            "
            SELECT 
                `items`.`material`, `items`.`item`, `items`.`shortcode`, `items`.`unit`, `items`.`type`, 
                `stock_and_stock_nouse`.`making_cost`, `stock_and_stock_nouse`.`retailer_cost`, `stock_and_stock_nouse`.`wholesale_cost`, `stock_and_stock_nouse`.`item_number`, `stock_and_stock_nouse`.`date`
            FROM `items`

            LEFT JOIN (
            SELECT `shortcode`, `making_cost`, `retailer_cost`, `wholesale_cost`, `item_number`, `date` FROM `stock` WHERE `shortcode`= '$shortcode'
            UNION
            SELECT `shortcode`, `making_cost`, `retailer_cost`, `wholesale_cost`, `item_number`, `date` FROM `stock_nouse` WHERE `shortcode`= '$shortcode'
            UNION
            SELECT `shortcode`, `making_cost`, `retailer_cost`, `wholesale_cost`, `item_number`, `date` FROM `stock_deleted` WHERE `shortcode`= '$shortcode'
            ) AS `stock_and_stock_nouse`
            ON `items`.`shortcode` = `stock_and_stock_nouse`.`shortcode`

            WHERE `items`.`shortcode` = '$shortcode'

            ORDER BY `stock_and_stock_nouse`.`date` DESC, `stock_and_stock_nouse`.`item_number` DESC LIMIT 1
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
                //$return['info'] .= $select_result['info'];
                //$return['additional_info'] .= $select_result['additional_info'];
                $return['select_result'] = $select_result;
            }
        }elseif($action == "fetch_distinct_column"){
            $distinct_column = $_POST['data'];

            $query_type = "custom";
            //$query_table defined earlier
            $query_text = 
            "
                SELECT DISTINCT `$distinct_column` AS `$distinct_column` FROM `$query_table` WHERE `$distinct_column` IS NOT NULL;
            ";

            $select_query = get_query($query_type, $query_table, $query_text);
            $select_result = select_query($select_query);

            if($select_result['result']){
                $return['result'] = true;
                $return['info'] .= "fetched all records ";
                $return['data'] = $select_result['additional_data'];
            }else{
                $return['result'] = false;
                $return['data'] = array();
                $return['info'] = $select_result;
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