<?php
date_default_timezone_set("Asia/Calcutta");   //India time (GMT+5:30)

function validate_fields($_fields_data, $_fields_def){
    $return = array();
    $return['result'] = true;
    $return['info'] = "validate_fields(..): ";

    foreach($_fields_def as $field_def){
        $name = $field_def['name'];
        $type = $field_def['type'];
        $sanitize = array_key_exists('sanitize', $field_def) ? $field_def['sanitize'] : array();
        $validation = array_key_exists('validation', $field_def) ? $field_def['validation'] : null;
        $can_accept_null = array_key_exists('accept_null', $field_def) ? $field_def['accept_null'] : false ;

        if(
            (!isset($_fields_data[$name])) && 
            (
                (!$can_accept_null && empty($_fields_data[$name])) 
            )
        ){
            $return['result'] = false;
            $return['info'] .= "empty $name";
        }else{
					$_fields_data[$name] = sanitize_field_data($type, $_fields_data[$name], $sanitize);
					$data = $_fields_data[$name];
		
					if($validation){
						$validation_status = is_field_valid($data, $type, $validation);
						if(!$validation_status['result']){
								$return['result'] = false;
								$return['info'] .= "$name : " . $validation_status['info'];
								break 1;
						}
					}
        }
    }

    if($return['result']){
        $return['info'] .= "all fields are valid!";
    }

    $return['data'] = $_fields_data;
    return $return;
}

function sanitize_field_data($_type, $_data, $_sanitize_rules){
	//by default add few sanitize_rules to the respective field type
	if($_type == "id"){
		$_sanitize_rules[] = "all_trim";
		$_sanitize_rules[] = "keep_hash_special_char";
	}elseif($_type == "name"){
		$_sanitize_rules[] = "lr_trim";
	}elseif($_type == "digits"){
		$_sanitize_rules[] = "digits";
	}elseif($_type == "decimal_digits"){
		$_sanitize_rules[] = "decimal_digits";
	}elseif($_type == "text"){
		$_sanitize_rules[] = "lr_trim";
	}elseif($_type == "image"){
		$_sanitize_rules[] = "upload_and_return_path";
	}

	foreach($_sanitize_rules as $_iter_sanitize_rule){
		$_data = sanitize_the_value($_data, $_iter_sanitize_rule);
	}

	return $_data;
}

function sanitize_the_value($_value, $_sanitize_rule){
	switch($_sanitize_rule){
		case 'lr_trim':
			return trim($_value);
			break;
		
		case 'all_trim':
			return str_replace(' ', '', $_value);
			break;
		
		case 'special_chars_remove':
			return preg_replace('/[^A-Za-z0-9\ ]/', '', $_value);
			break;
		
		//this removes all the special chars except `#`
		case 'keep_hash_special_char':
			return preg_replace('/[^A-Za-z0-9#\ ]/', '', $_value);
			break;

		case 'toUpper':
			return strtoupper($_value);
			break;

		case 'digits':
			return (int) $_value;
			break;

		case 'decimal_digits':
			return get_decimal($_value);
			break;
		
		case 'upload_and_return_path':
			if(!is_array($_value)) $_value = array();

			foreach($_value as &$image){
				//thumb [or] orginal
				$timestamp = "";
				if(array_key_exists('timestamp', $image)){
					$timestamp = $image['timestamp'];
					unset($image['timestamp']);
				}
				foreach($image as $type => &$data){
					if(strlen($data) > 40){
						//it's base_64 image
						//uploading to server
						//from .js it will request to upload on local server
            $imagename = "{$timestamp}_{$type}.jpg";

            $path = UPLOADS_DIRNAME . "/" . $imagename;
            $imageSavePath = APP_BASE_DIR . "/" . $path;

            if(file_put_contents($imageSavePath, file_get_contents($data)) !== FALSE){
							$data = $path;
            }else{
							//clearing base64 data because it's failed to upload
							$data = "";
            }
					}
				}
				usleep(100);
			}
			return json_encode($_value);
			break;

		default:
			return $_value;
	}
}

function is_field_valid($_data, $_type, $_validation_rules){
    $return = array();
    $return['result'] = false;
    $return['info'] = "is_field_valid(..): ";

		//add if any validation_rules to the respective field type
    //if($_type == "id"){}

    foreach($_validation_rules as $field_def){
        
        //another loop because to get the keyname 
        foreach($field_def as $iter_rule_name => $iter_rule_def){
            $data_match_status = is_data_matches_with_rule($_data, $iter_rule_name, $iter_rule_def);
            if(!$data_match_status['result']){
                $return['result'] = false;
                $return['info'] .= $data_match_status['info'];
                
                break 2;
            }else{
                $return['result'] = true;
            }
        }
    }

    return $return;
}

function get_decimal($_value){
	return round($_value, 2);
}

function has_contains($_str, $_match){
	return (strpos($_str, $_match) !== FALSE);
}

function has_alpha_chars($_str){
	return preg_match('/^[a-zA-Z ]+$/', $_str);
}

function has_spaces($_str){
	return has_contains($_str, " ");
}

function has_special_chars($_str){
	return preg_match('/[^A-Za-z 0-9]+/', $_str);
}

function is_data_matches_with_rule($_data, $_rule_name, $_rule_def = null){
    $return = array();
    $return['result'] = false;
    $return['info'] = "is_data_matches_with_rule(..): ";

    switch($_rule_name){
		case 'minlength':
			if(!(strlen($_data) >= $_rule_def)){
				$return['result'] = false;
				$return['info'] .= "'$_data' length less than the required length of " . $_rule_def;				
			}
		break;
		case 'maxlength':
			if((strlen($_data) > $_rule_def)){
				$return['result'] = false;
				$return['info'] .= "'$_data' length more than the required length of " . $_rule_def;				
			}
		break;
		case 'length':
			if(!(strlen($_data) == $_rule_def)){
				$return['result'] = false;
				$return['info'] .= "'$_data' length should be " . $_rule_def;				
			}
		break;
		case 'allow_only_number':
			if(
				!is_numeric($_data) || has_contains($_data, "+") || has_contains($_data, "-")
			){
				//has alphabatical/symbols 
				$return['result'] = false;
				$return['info'] .= "'$_data' contains alphabatical characters/symbols";
			}
		break;
		case 'allow_only_alpha':
			$allow_only_alpha = $_rule_def;
			if($allow_only_alpha){
				//should contain 'alpha' chars only		
				if(!has_alpha_chars($_data)){
					//has non alphabatical chars 
					$return['result'] = false;
					$return['info'] .= "'$_data' contains numbers/symbols";
				}
			}else{
				$return['result'] = false;
				$return['info'] .= "'$_data' no method available for alpha validation";
			}
		break;
		case 'allow_special_chars':
			$allow_special_chars = $_rule_def;
			if($allow_special_chars){
				if(!(has_special_chars($_data))){
					$return['result'] = false;
					$return['info'] .= "'$_data' does not contains any symbols";
				}
			}else{
				if((has_special_chars($_data))){
					$return['result'] = false;
					$return['info'] .= "'$_data' contains symbols";
				}				
			}
		break;
		case 'allow_spaces':
			$allow_spaces = $_rule_def;
			if($allow_spaces){
				if(!(has_spaces($_data))){
					$return['result'] = false;
					$return['info'] .= "'$_data' does not contains any spaces";
				}
			}else{
				if((has_spaces($_data))){
					$return['result'] = false;
					$return['info'] .= "'$_data' contains spaces";
				}				
			}
		break;

		case 'email':
			$email = $_rule_def;
			if($email){
				if(!preg_match('/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/', $_data, $_match)){
					$return['result'] = false;
					$return['info'] .= "'$_data' is an invalid email id";
				}
			}
		break;
		
		case 'json':
			$json = $_rule_def;
			if($json){
				json_decode($_data);
				$is_valid_json = json_last_error() === JSON_ERROR_NONE;
   			if(!$is_valid_json){
					$return['result'] = false;
					$return['info'] .= "invalid json";
				}
			}
		break;

		case 'array':
			$array = $_rule_def;
			if($array){
				if(!is_array($_data)){
					$return['result'] = false;
					$return['info'] .= "invalid array";
				}
			}
		break;
		
		default:
			$return['result'] = false;
			$return['info'] .= "`$_rule_name` no such method exist for validation";
	}

    if($return['info'] == "is_data_matches_with_rule(..): "){
        //that means no error so return result as true
        $return['result'] = true;
    }

    return $return;
}

function getTableDefaultColumns($_table, $_slno = true, $_id = true){
	$columns = array();

	/*
	*******************
	$_slno = true => include `slno`	to the columns list
	$_slno = false => exclude `slno` to the columns list
	$_slno = string(count_slno) => get the count of no.of of the records(rows) in the table
	$_slno = string(number) => set the manual `slno` as passed in the argument
	*******************
	*/

	$columnSlno = null;
	if(is_bool($_slno) === true){
		if($_slno){
			$columnSlno = "@slno:=@slno+1 AS `slno`";
		}
	}elseif($_slno == "count_slno"){
		$columnSlno = "(SELECT (COUNT(`id`)) FROM `$_table`) AS `slno`";
	}else{
		//manual `slno` given so passing the same to column
		$columnSlno = "'$_slno' AS `slno`";
	}

	if($columnSlno){
		$columns[] = $columnSlno;
	}

	if($_id){
		$columns[] = "id";
	}

	switch($_table){
		case 'users':
			$columns[]  = "username";
			$columns[]  = "password";
			$columns[]  = "role";
			$columns[]  = "mobile_number";
			return $columns;
		break;
		
		case 'material':
			$columns[]  = "material";
			return $columns;
		break;
		
		case 'units':
			$columns[]  = "unit";
			return $columns;
		break;
		
		case 'types':
			$columns[]  = "type";
			return $columns;
		break;
		
		case 'items':
			$columns[]  = "material";
			$columns[]  = "item";
			$columns[]  = "shortcode";
			$columns[]  = "unit";
			$columns[]  = "type";
			$columns[]  = "counting";
			$columns[]  = "sub_name";
			$columns[]  = "company_name";
			$columns[]  = "flavour";
			$columns[]  = "denomination";
			$columns[]  = "actual_cost";
			$columns[]  = "cost";
			$columns[]  = "level";
			$columns[]  = "tracking_id";
			$columns[]  = "in_stock";
			$columns[]  = "priority";
			$columns[]  = "image";
			return $columns;
		break;

		case 'stock':
			$columns[]  = "generate_id";
			$columns[]  = "date";
			$columns[]  = "material";
			$columns[]  = "item";
			$columns[]  = "shortcode";
			$columns[]  = "type";
			$columns[]  = "unit";
			$columns[]  = "quantity";
			$columns[]  = "making_cost";
			$columns[]  = "retailer_cost";
			$columns[]  = "wholesale_cost";
			$columns[]  = "profit";
			$columns[]  = "item_number";
			$columns[]  = "barcode";
			$columns[]  = "is_cotton";
			$columns[]  = "custom_data";
			return $columns;
		break;
		
		case 'stock_history':
			$columns[]  = "generate_id";
			$columns[]  = "date";
			$columns[]  = "material";
			$columns[]  = "item";
			$columns[]  = "shortcode";
			$columns[]  = "type";
			$columns[]  = "unit";
			$columns[]  = "quantity";
			$columns[]  = "making_cost";
			$columns[]  = "retailer_cost";
			$columns[]  = "wholesale_cost";
			$columns[]  = "profit";
			return $columns;
		break;
		
		case 'stock_dump':
			$columns[]  = "row_id";
			$columns[]  = "NULL AS `sold_type`";
			$columns[]  = "NULL AS `sold_id`";
			$columns[]  = "id";
			$columns[]  = "generate_id";
			$columns[]  = "date";
			$columns[]  = "material";
			$columns[]  = "item";
			$columns[]  = "shortcode";
			$columns[]  = "type";
			$columns[]  = "unit";
			$columns[]  = "quantity";
			$columns[]  = "making_cost";
			$columns[]  = "retailer_cost";
			$columns[]  = "wholesale_cost";
			$columns[]  = "profit";
			$columns[]  = "item_number";
			$columns[]  = "barcode";
			$columns[]  = "is_cotton";
			$columns[]  = "custom_data";
			$columns[]  = "NULL AS `unit_price`";
			$columns[]  = "is_restored";
			return $columns;
		break;
		
		case 'stock_deleted':
			$columns[]  = "row_id";
			$columns[]  = "NULL AS `sold_type`";
			$columns[]  = "NULL AS `sold_id`";
			$columns[]  = "id";
			$columns[]  = "generate_id";
			$columns[]  = "date";
			$columns[]  = "material";
			$columns[]  = "item";
			$columns[]  = "shortcode";
			$columns[]  = "type";
			$columns[]  = "unit";
			$columns[]  = "quantity";
			$columns[]  = "making_cost";
			$columns[]  = "retailer_cost";
			$columns[]  = "wholesale_cost";
			$columns[]  = "profit";
			$columns[]  = "item_number";
			$columns[]  = "barcode";
			$columns[]  = "is_cotton";
			$columns[]  = "custom_data";
			$columns[]  = "NULL AS `unit_price`";
			$columns[]  = "is_restored";
			return $columns;
		break;
		
		case 'stock_for_tracking':
			$columns[]  = "NULL AS `row_id`";
			$columns[]  = "NULL AS `sold_type`";
			$columns[]  = "NULL AS `sold_id`";
			$columns[]  = "id";
			$columns[]  = "generate_id";
			$columns[]  = "date";
			$columns[]  = "material";
			$columns[]  = "item";
			$columns[]  = "shortcode";
			$columns[]  = "type";
			$columns[]  = "unit";
			$columns[]  = "quantity";
			$columns[]  = "making_cost";
			$columns[]  = "retailer_cost";
			$columns[]  = "wholesale_cost";
			$columns[]  = "profit";
			$columns[]  = "item_number";
			$columns[]  = "barcode";
			$columns[]  = "is_cotton";
			$columns[]  = "custom_data";
			$columns[]  = "NULL AS `unit_price`";
			$columns[]  = "NULL AS `is_restored`";
			return $columns;
		break;

		case 'stock_sold':
			$columns[]  = "row_id";
			$columns[]  = "sold_type";
			$columns[]  = "sold_id";
			$columns[]  = "id";
			$columns[]  = "generate_id";
			$columns[]  = "date";
			$columns[]  = "material";
			$columns[]  = "item";
			$columns[]  = "shortcode";
			$columns[]  = "type";
			$columns[]  = "unit";
			$columns[]  = "quantity";
			$columns[]  = "making_cost";
			$columns[]  = "retailer_cost";
			$columns[]  = "wholesale_cost";
			$columns[]  = "profit";
			$columns[]  = "item_number";
			$columns[]  = "barcode";
			$columns[]  = "is_cotton";
			$columns[]  = "custom_data";
			$columns[]  = "unit_price";
			$columns[]  = "is_restored";
			return $columns;
		break;

		case 'sellers':
			$columns[]  = "seller_id";
			$columns[]  = "seller_name";
			$columns[]  = "seller_mobile_number";
			return $columns;
		break;

		case 'sales':
			$columns[]  = "date";
			$columns[]  = "invoice_id";
			$columns[]  = "seller_id";
			$columns[]  = "seller_name";
			$columns[]  = "custom_id";
			$columns[]  = "custom_name";
			$columns[]  = "customer_name";
			$columns[]  = "customer_village";
			$columns[]  = "customer_details";
			$columns[]  = "sale_type";
			return $columns;
		break;

		case 'vehicles':
			$columns[]  = "vehicle_id";
			$columns[]  = "vehicle_name";
			return $columns;
		break;

		case 'customers':
			$columns[]  = "username";
			$columns[]  = "name";
			$columns[]  = "mobile_number";
			$columns[]  = "address";
			$columns[]  = "password";
			$columns[]  = "is_allowed";
			return $columns;
		break;

		case 'orders':
			$columns[]  = "date";
			$columns[]  = "sale_type";
			$columns[]  = "order_id";
			$columns[]  = "username";
			$columns[]  = "name";
			$columns[]  = "mobile_number";
			$columns[]  = "address";
			$columns[]  = "no_of_items";
			$columns[]  = "no_of_units";
			$columns[]  = "making_cost";
			$columns[]  = "sub_total";
			$columns[]  = "total_price";
			$columns[]  = "offer_percentage";
			$columns[]  = "offer_amount";
			$columns[]  = "is_confirmed";
			$columns[]  = "is_paid";
			$columns[]  = "is_cancelled";
			return $columns;
		break;

		case 'staff':
			$columns[] = "id";
			$columns[] = "name";
			$columns[] = "email_id";
			$columns[] = "mobile_number";
			$columns[] = "roles";
			$columns[] = "updated_at";
			$columns[] = "created_at";
			return $columns;
		break;
		
		default:
			return $columns;
	}
}

function getBarcodesfromGenerateId($generate_id){
	$return = array();
	$return['result'] = false;
	$return['info'] = "getBarcodesfromGenerateId(): ";
	
	$query_type = "custom";
	$query_table = "stock";
	$query_text = 
	"
	SELECT DISTINCT `barcode` AS `barcode` FROM (
		SELECT `generate_id`, `barcode` FROM `stock` WHERE `generate_id` = '$generate_id'
		UNION
		SELECT `generate_id`, `barcode` FROM `stock_deleted` WHERE `generate_id` = '$generate_id'
		UNION
		SELECT `generate_id`, `barcode` FROM `stock_dump` WHERE `generate_id` = '$generate_id'
		UNION
		SELECT `generate_id`, `barcode` FROM `stock_sold` WHERE `generate_id` = '$generate_id'
	) AS `t5`;
	";
	$query = get_query($query_type, $query_table, $query_text);
	$query_result = select_query($query);
	if($query_result['result']){
		if(count($query_result['additional_data'])){
			$return['result'] = true;
			$return['info'] .= "fetched all barcodes ";
			$return['data'] = $query_result['additional_data'];
		}else{
			$return['info'] .= "no barcodes exist with provided generate_id ";
		}
	}else{
		$return['info'] .= $query_result['additional_info'];
	}

	return $return;
}

function getBarcodeHistory($barcode){
	$return = array();
	$return['result'] = false;
	$return['info'] = "getBarcodeHistory(): ";

	$stock_deleted_columns_str = getDefaultColumnsQueryStr("stock_deleted");
	$stock_dump_columns_str = getDefaultColumnsQueryStr("stock_dump");
	$stock_sold_columns_str = getDefaultColumnsQueryStr("stock_sold");
	$stock_columns_str = getDefaultColumnsQueryStr("stock_for_tracking");

	$custom_query_type = "custom";
	$custom_query_table = "stock";
	$custom_query_text = 
	"
	SELECT * FROM (
		SELECT $stock_deleted_columns_str, DATE_FORMAT(`row_date`, '%d-%m-%Y %H:%i:%s') as `row_date`, 'deleted' as `action` FROM `stock_deleted` WHERE `is_restored` = 0 AND `barcode` = '$barcode'
		UNION
		SELECT $stock_deleted_columns_str, DATE_FORMAT(`row_date`, '%d-%m-%Y %H:%i:%s') as `row_date`, 'deleted' as `action` FROM `stock_deleted` WHERE `is_restored` = 1 AND `barcode` = '$barcode'
		UNION
		SELECT $stock_deleted_columns_str, DATE_FORMAT(`affected_time`, '%d-%m-%Y %H:%i:%s') as `row_date`, 'un-deleted' as `action` FROM `stock_deleted` WHERE `is_restored` = 1 AND `barcode` = '$barcode'
		UNION
		SELECT $stock_dump_columns_str, DATE_FORMAT(`row_date`, '%d-%m-%Y %H:%i:%s') as `row_date`, 'dumped' as `action` FROM `stock_dump` WHERE `is_restored` = 0 AND `barcode` = '$barcode'
		UNION
		SELECT $stock_dump_columns_str, DATE_FORMAT(`row_date`, '%d-%m-%Y %H:%i:%s') as `row_date`, 'dumped' as `action` FROM `stock_dump` WHERE `is_restored` = 1 AND `barcode` = '$barcode'
		UNION
		SELECT $stock_dump_columns_str, DATE_FORMAT(`affected_time`, '%d-%m-%Y %H:%i:%s') as `row_date`, 'un-dumped' as `action` FROM `stock_dump` WHERE `is_restored` = 1 AND `barcode` = '$barcode'
		UNION
		SELECT $stock_sold_columns_str, DATE_FORMAT(`row_date`, '%d-%m-%Y %H:%i:%s') as `row_date`, 'app_order' as `action` FROM `stock_sold` WHERE `is_restored` = 0 AND `sold_type` = 'order' AND `barcode` = '$barcode'
		UNION
		SELECT $stock_sold_columns_str, DATE_FORMAT(`row_date`, '%d-%m-%Y %H:%i:%s') as `row_date`, 'app_order' as `action` FROM `stock_sold` WHERE `is_restored` = 1 AND `sold_type` = 'order' AND `barcode` = '$barcode'
		UNION
		SELECT $stock_sold_columns_str, DATE_FORMAT(`affected_time`, '%d-%m-%Y %H:%i:%s') as `row_date`, 'app_order_return' as `action` FROM `stock_sold` WHERE `is_restored` = 1 AND `sold_type` = 'order' AND `barcode` = '$barcode'
		UNION
		SELECT $stock_sold_columns_str, DATE_FORMAT(`row_date`, '%d-%m-%Y %H:%i:%s') as `row_date`, 'company_sale' as `action` FROM `stock_sold` WHERE `is_restored` = 0 AND `sold_type` = 'sale' AND `barcode` = '$barcode'
		UNION
		SELECT $stock_sold_columns_str, DATE_FORMAT(`row_date`, '%d-%m-%Y %H:%i:%s') as `row_date`, 'company_sale' as `action` FROM `stock_sold` WHERE `is_restored` = 1 AND `sold_type` = 'sale' AND `barcode` = '$barcode'
		UNION
		SELECT $stock_sold_columns_str, DATE_FORMAT(`affected_time`, '%d-%m-%Y %H:%i:%s') as `row_date`, 'company_sale_return' as `action` FROM `stock_sold` WHERE `is_restored` = 1 AND `sold_type` = 'sale' AND `barcode` = '$barcode'
		UNION
		SELECT $stock_columns_str, DATE_FORMAT(`date`, '%d-%m-%Y %H:%i:%s') as `row_date`, 'in_stock' as `action` FROM `stock` WHERE `barcode` = '$barcode'
	) AS `t1`
	ORDER BY `row_date` ASC
	;
	";

	$custom_query = get_query($custom_query_type, $custom_query_table, $custom_query_text);
	$custom_query_result = select_query($custom_query);

	if($custom_query_result['result']){
		if(count($custom_query_result['additional_data'])){
			$return['result'] = true;
			$return['info'] .= "fetched barcode history";
			$return['data'] = $custom_query_result['additional_data'];
		}else{
			$return['info'] .= "no barcodes exist with provided generate_id ";
		}
	}else{
		$return['info'] .= $custom_query_result['additional_info'];
	}

	return $return;
}

function getDefaultColumnsQueryStr($table_name){
	$table_columns_arr = getTableDefaultColumns($table_name, false, false);
	$table_columns_str = join("`, `", $table_columns_arr);
	
	$table_columns_str = "`$table_columns_str`";

	$table_columns_str = str_replace("`NULL", "NULL", $table_columns_str);
	$table_columns_str = str_replace("``", "`", $table_columns_str);


	return $table_columns_str;
}

function fetchRecord($table, $manual_columns = array(), $where_clause = array("1"), $slno = true, $includeId = true, $returnQueryResult = false){
	$return = array();
	$return['result'] = false;
	$return['info'] = "fetchRecord(..): ";
	$return['additional_info'] = "";
	$return['query'] = array();

	$default_columns = getTableDefaultColumns($table, $slno, $includeId);
	$table_columns = $default_columns;
	if(is_array($manual_columns) && count($manual_columns)){
		$table_columns = array_merge($default_columns, $manual_columns);
	}

	$query_type = "select";
	$table_name = $table;
	//$table_columns; defined earlier
	$where_values = $where_clause;

	$select_query = get_query($query_type, $table_name, $table_columns, $where_values);
	$return['query'] = $select_query;

	$select_result = select_query($select_query, array("table" => $table_name));
	if($select_result['result']){
		$records_count = count($select_result['additional_data']);
		$return['info'] .= $records_count . " record(s) fetched";
		if($records_count || $returnQueryResult){
			$return['result'] = true;
			$return['count'] = $records_count;
			$return['data'] = $select_result['additional_data'];
		}
	}else{
		$return['info'] .= "failed to fetch record";
		$return['additional_info'] .= $select_result['additional_information'];
	}

	return $return;
}

function generateInvoiceId($previous_invoice_id, $is_update = false){
	$separator = "\\.";
	
	if(!$is_update){
		$clean_invoice_id = preg_replace("/($separator).*/", '', $previous_invoice_id);
		return ((int)$clean_invoice_id) + 1;
	}else{
		if(preg_match("/(?<=$separator).*/", $previous_invoice_id, $invoice_id_suffix_arr)){
			$invoice_id_suffix = $invoice_id_suffix_arr[0];
			$updated_invoice_id_suffix = ((int)$invoice_id_suffix) + 1;
			return preg_replace("/(?<=$separator).*/", $updated_invoice_id_suffix, $previous_invoice_id);
		}else{
			return $previous_invoice_id . $separator . 2;
		}
	}
}

function getKeyinArr($_arr){
	$id = null;
	if(is_array($_arr) && count($_arr)){
		foreach($_arr as $key=>$value){
			$id = $key;
			return $id;
		}
	}
	return $id;
}

/* Begin: Navigation Functions */
function filterNavItems($items, $user_role){
    foreach($items as $iteration => &$value){
        if(shouldExecludeNavItem($value, $user_role)){
            unset($items[$iteration]);
			$items = array_values($items); //to reindex the array
        }elseif(
            ($value['link'] == null) && 
            (array_key_exists("dropdown", $value) && count($value['dropdown']))
        ){
                $value['dropdown'] = filterNavItems($value['dropdown'], $user_role);
        }elseif(
            ($value['link'] == null) && 
            (array_key_exists("items", $value) && count($value['items']))
        ){
            $value['items'] = filterNavItems($value['items'], $user_role);
        }
        
    }
    return $items;
}

function shouldExecludeNavItem($item, $requested_user_type){
    return !in_array($requested_user_type, $item['access']);
}
/* End: Navigation Functions */

function get_date($format = "y-m-d", $when = "today"){
	$date = new DateTime();

	switch($when){
		case 'yesterday':
			$date->modify('-1 day');
			break;
		case 'this_month':
			$date->setDate($date->format('Y'), $date->format('m'), 1);
			break;
		case 'this_year':
			$date->setDate($date->format('Y'), 1, 1);
			break;
		case is_numeric($when):
			$date->modify("+$when day");
			break;
	}

	switch($format){
		case "y-m-d":
		  return $date->format("Y-m-d");
		case "y-m-d t":
		  return $date->format("Y-m-d H:i:s");
		case "d-m-y":
		  return $date->format("d-m-Y");
		case "dm":
		  return $date->format("dm");
		case "ymdt":
		  return $date->format("YmdHis");
		case "d/m/y":
		  return $date->format("d/m/Y");
		default:
		  return "Invalid format";
	}
}

function getOrderId(){
	$return = array();
	$return['result'] = false;
	$return['info'] = "getOrderId(): ";
	$return['data'] = array();

	$last_record = fetchRecord('orders', null, "1 ORDER BY `order_id` DESC LIMIT 1", false, false, true);
	if($last_record['result']){
		$last_record = count($last_record['data']) ? $last_record['data'][0] : array("order_id" => 0);
		$last_order_id = $last_record['order_id'];

		$return['result'] = true;
		$return['info'] .= "fetched order_id";
		$return['data'] = generateInvoiceId($last_order_id);
	}else{
		$return['info'] .= "error fetching last order_id";
		$return['last_record'] = $last_record;
	}

	return $return;
}

function type_item_column($param){
  $type_path = LIB_DIR . "/type.json";
  $type_arr = json_decode(file_get_contents($type_path), true);
  if(gettype($param) == "array"){
		$key_name = key($param);
		$key_value = $param[$key_name];
		if($key_value === false){
			unset($type_arr[$key_name]);
		}else{
    	$type_arr[$key_name] = $key_value;
		}
    file_put_contents($type_path, json_encode($type_arr));
  }else if($param == "all"){
		return $type_arr;
	}else{
    return $type_arr[$param];
  }
}

function generateOrderByCase($type_arr){
	$counter = 1;
	$order_by_case_str = "";
	foreach($type_arr as $type){
		$order_by_case_str .= "WHEN `type` = '$type' THEN $counter ";
		$counter++;
	}
	$counter++;
	$order_by_case_str .= "ELSE $counter END";

	return $order_by_case_str;
}

function shuffle_assoc($list) { 
  if (!is_array($list)) return $list; 

  $keys = array_keys($list); 
  shuffle($keys); 
  $random = array(); 
  foreach ($keys as $key) { 
    $random[$key] = $list[$key]; 
  }
  return $random; 
}

function sale_stock($_fields_data, $_is_vehicle_shift){
	$return = array();
	$return['result'] = false;
	$return['info'] = "sale_stock(): ";
	$return['additional_info'] = "sale_stock(): ";

	$date = get_date("y-m-d t");

	$query_table = "sales";
	
	$last_record = fetchRecord($query_table, null, "1 ORDER BY `invoice_id` DESC LIMIT 1", false, false, true);
	if($last_record['result']){
		$last_record = count($last_record['data']) ? $last_record['data'][0] : array("invoice_id" => 0);
		$last_invoice_id = $last_record['invoice_id'];
		$new_invoice_id = generateInvoiceId($last_invoice_id);
						
		$items_data = $_fields_data['data']['data'];
		$items_data = json_decode($items_data, true);

		$return_data = 	array_key_exists('return_data', $_fields_data['data']) ? 
										json_decode($_fields_data['data']['return_data'], true) : false ;

		if (json_last_error() === JSON_ERROR_NONE){
			if(count($items_data)){
				/*----------------------BEGIN: operations on `stock` table----------------------*/
					$stock_related_queries = array();
					if(!$return_data){
						/**--------------------GETS EXECUTED ON SALE[or]STOCK_SHIFT--------------------**/
						/* OPERATIONS:
							==>insert the row in `stock_sold`
							==>delete the row in `stock`
						*/

						$items_list = $items_data['list'];
						$items_summary = $items_data['summary'];

						$barcodes_arr = getBarcodesData($items_list, "fetch_from_items");
						$barcodes_str = getBarcodesData($barcodes_arr, "join_barcodes");
						$where_str = "`barcode` IN ($barcodes_str)";

						$shortcode_unit_price_data = getBarcodesData($items_summary, "shortcode_unit_price");
						$case_query_text = getCaseQueryText($shortcode_unit_price_data);
				
						$stock_sold_query_type = "custom";
						$stock_sold_table = "stock_sold";
						$stock_sold_query_text = 
						"
							INSERT INTO `stock_sold` 
							SELECT 
								NULL AS `row_id`, 
								'$date' AS `row_date`, 
								'sale' AS `sold_type`, 
								'$new_invoice_id' AS `sold_id`, 
								`stock`.*, 
								$case_query_text,
								NULL AS `is_restored`, 
								NULL AS `affected_time` 
							FROM `stock` 
							WHERE $where_str;
						";

						$stock_sold_query = get_query($stock_sold_query_type, $stock_sold_table, $stock_sold_query_text);
						$stock_related_queries[] = array("insert" => $stock_sold_query);

						$stock_query_type = "custom";
						$stock_table = "stock";
						$stock_query_text = 
						"
							DELETE FROM `stock` WHERE $where_str;
						";

						$stock_query = get_query($stock_query_type, $stock_table, $stock_query_text);
						$stock_related_queries[] = array("delete" => $stock_query);
					}else{
						/**--------------------GETS EXECUTED ON SALE_CANCEL[or]RETURN_STOCK_SHIFT--------------------**/
						/*
							OPERATIONS:
							==>insert the row in `stock` table
							==>update the row in `stock_sold` table
						*/
						$return_list = $return_data['data'];

						if($return_list && count($return_list)){
							foreach($return_list as $item){
								$stock_query_type = "insert";
								$stock_table = "stock";
								$stock_columns = array();
								$stock_values = array();

								unset(
									$item['slno'],
									$item['unit_price']
								);

								foreach($item as $column => $value){
									$stock_columns[] = $column;
									$stock_values[] = $value;
								}
								$stock_related_queries[] = array("insert" => get_query($stock_query_type, $stock_table, $stock_columns, $stock_values));
							}

							$barcodes_arr = getBarcodesData($return_list, "fetch_from_items");
            				$barcodes_str = getBarcodesData($barcodes_arr, "join_barcodes");
							$where_str = "`barcode` IN ($barcodes_str)";
            				$where_str .= " AND `is_restored` = '0'";

							$stock_sold_type = "update";
							$stock_sold_table = "stock_sold";
							$stock_sold_set = array("is_restored=1", "affected_time=$date");
							$stock_sold_where = $where_str;
							$stock_sold_query = get_query($stock_sold_type, $stock_sold_table, $stock_sold_set, $stock_sold_where);
							$stock_related_queries[] = array("update" => $stock_sold_query);
						}
					}
				/*----------------------END: operations on `stock` table----------------------*/

				/*----------------------BEGIN: operations on `sales` table----------------------*/
					$_fields_data['data']['no_of_items'] = count($items_data['summary']);
					$_fields_data['data']['no_of_units'] = count($items_data['list']);
					
					$_fields_data['data']['making_cost'] = $items_data['billing']['making_cost'];
					$_fields_data['data']['sub_total'] = $items_data['billing']['sub_total'];
					$_fields_data['data']['total_price'] = $items_data['billing']['total'];
					$_fields_data['data']['offer_percentage'] = $items_data['billing']['offer_percentage'];
					$_fields_data['data']['offer_amount'] = $items_data['billing']['offer_amount'];

					unset(
						$_fields_data['data']['action'], 
						$_fields_data['data']['data'],
						$_fields_data['data']['return_data'],
						$_fields_data['data']['is_stock_shift']
					);

					if(
						!array_key_exists('invoice_id', $_fields_data['data']) 
						|| !$_fields_data['data']['invoice_id']
					){
						/* CREATING NEW INVOICE */

						unset(
							$_fields_data['data']['id'],
							$_fields_data['data']['is_finished']
						);
						
						$_fields_data['data']['invoice_id'] = $new_invoice_id;

						$sale_query_type = "insert";
						//$query_table defined earlier
						$sale_query_columns = 	array(
							"items_details",
							"is_finished"
						);
						$sale_query_values =	array(
							json_encode($items_data),
							$_is_vehicle_shift ? "0" : "1"
						);

						foreach($_fields_data['data'] as $column => $value){
							$sale_query_columns[] = $column;
							$sale_query_values[] = $value;
						}
					}else{
						/* UPDATING EXISTING INVOICE */

						unset($items_data['current_sale_list']); //because we've used itself in stock

						$id = $_fields_data['data']['id'];
						unset($_fields_data['data']['id']); //it's row id

						$invoice_id = $_fields_data['data']['invoice_id'];

						$sale_query_type = "update";
						//$query_table defined earlier
						$sale_query_columns = 	array(
							"items_details=" . json_encode($items_data),
						);

						foreach($_fields_data['data'] as $column => $value){
							$sale_query_columns[] = "$column=$value";
						}

						$sale_query_values = array(
															'id=' . $id,
															'invoice_id=' . $invoice_id
														);
					}

					$sale_query = get_query($sale_query_type, $query_table, $sale_query_columns, $sale_query_values);
				/*----------------------END: operations on `sales` table----------------------*/

				/*----------------------BEGIN: DB Operations----------------------*/
					$queries_to_execute = 	array(
						array($sale_query_type => $sale_query)
					);

					$queries_to_execute = array_merge($queries_to_execute, $stock_related_queries);

					$trasaction_result = execute_transactions($queries_to_execute);

					$return['transaction_queries'] = $queries_to_execute;
					//$return['fields_data'] = $_fields_data['data'];

					if($trasaction_result['result']){
						$return['result'] = true;
						$return['info'] .= "items sold successfully!";
						$return['invoice_id'] = $_fields_data['data']['invoice_id'];
						$return['usage'] = get_memory();
					}else{
						$return['info'] .= "error selling items";
						$return['additional_info'] .= $trasaction_result['additional_information'];
					}
				/*----------------------END: DB Operations----------------------*/
			}else{
				$return['info'] .= "empty items data ";	
			}
		}else{
			$return['info'] .= "invalid data!";
		}
	}else{
		$return['info'] .= "unable to get last record ";
		$return['additional_info'] .= $last_record['additional_info'];
	}

	return $return;
}

function getBarcodesData($data_arr, $action){
	if($action == "fetch_from_items"){
		return array_map(function($item){
			return $item['barcode'];
		}, $data_arr);
	}elseif($action == "join_barcodes"){
		return "'" . implode("','", $data_arr) . "'";
	}elseif($action == "barcode_unit_price"){
		$new_array = array();
		foreach($data_arr as $row){
		  $new_array[$row['barcode']] = $row['unit_price'];
		}
		return $new_array;
	}elseif($action == "shortcode_unit_price"){
		$new_array = array();
		foreach($data_arr as $row){
		  $new_array[$row['shortcode']] = $row['unit_price'];
		}
		return $new_array;
	}else{
		return null;
	}
}

function getCaseQueryText($data_arr){
	$query_text = "CASE `shortcode` ";
	foreach ($data_arr as $shortcode => $unit_price) {
		$query_text .= "WHEN '$shortcode' THEN '$unit_price' ";
	}
	$query_text .= "END as `unit_price` ";
	return $query_text;
}

function get_memory(){
   $mem_usage = memory_get_usage();
   $mem_peak = memory_get_peak_usage();

	 return array(
		 	'memory_usage_kb' => number_format($mem_usage / 1024, 2), 
	 		'memory_peak_usage_kb' => number_format($mem_peak / 1024, 2),
		 	'memory_usage_mb' => number_format($mem_usage / (1024 * 1024), 2), 
	 		'memory_peak_usage_mb' => number_format($mem_peak / (1024 * 1024), 2)
		);
}

function updateCustomerData($cookies, $fields){
	$return['result'] = false;
	$return['info'] = "updateCustomerData(): ";
	
	if(
				is_array($cookies)
		&& 	count($cookies)
		&& 	count($fields)
	){

		$update_set	= array();
		foreach($cookies as $name => $value){
			if(
						array_key_exists($name, $fields)
				&&	$cookies[$name] != $fields[$name]
			){
				$update_set[] = "$name=$fields[$name]";
			}
		}

		if(count($update_set)){
			$update_query_type = "update";
			$update_query_table = "customers";
			$update_query_where = array('username=' . $fields['username']);

			$update_query = get_query($update_query_type, $update_query_table, $update_set, $update_query_where);

			$update_result = update_query($update_query);
			$return['update_query'] = $update_query;
			$return['update_set'] = $update_set;
			$return['update_result'] = $update_result;
			if($update_result['result']){
				$return['result'] = true;
				$return['info'] .= "fields are updated";
			}else{
				$return['info'] .= "fields are not updated";
			}
		}else{
			$return['info'] .= "nothing to update";
		}
	}else{
		$return['info'] .= "wrong with cookies or fields";
	}

	return $return;
}

function curl_request($url, $data){
	// Generated by curl-to-PHP: http://incarnate.github.io/curl-to-php/
	$return = array();
	$return['result'] = false;
	$return['info'] = "curl_request(): ";
	$return['data'] = array();

	$ch = curl_init();

	curl_setopt($ch, CURLOPT_URL, $url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));

	$headers = array();
	$headers[] = 'User-Agent: Mozilla/5.0 (Windows NT 6.3; Win64; x64; rv:96.0) Gecko/20100101 Firefox/96.0';
	$headers[] = 'Accept: application/json, text/javascript, */*; q=0.01';
	$headers[] = 'Accept-Language: en-US,en;q=0.5';
	$headers[] = 'Accept-Encoding: gzip, deflate';
	$headers[] = 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8';
	$headers[] = 'X-Requested-With: XMLHttpRequest';
	$headers[] = 'Connection: keep-alive';
	$headers[] = 'Sec-Fetch-Dest: empty';
	$headers[] = 'Sec-Fetch-Mode: no-cors';
	$headers[] = 'Sec-Fetch-Site: same-origin';
	$headers[] = 'Pragma: no-cache';
	$headers[] = 'Cache-Control: no-cache';
	curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
	curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
	curl_setopt($ch, CURLOPT_ENCODING, '');

	$result = curl_exec($ch);
	if(curl_errno($ch)){
		$return['info'] .= 'Error:' . curl_error($ch);
	}else{
		$return['result'] = true;
	}
	curl_close($ch);

	$return['data'] = json_decode($result, true);

	return $return;
}
?>