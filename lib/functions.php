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
		$_sanitize_rules[] = "all_trim";
		$_sanitize_rules[] = "special_chars_remove";
	}elseif($_type == "text"){
		$_sanitize_rules[] = "lr_trim";
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
			return $columns;
		break;
		
		case 'stock':
			$columns[]  = "generate_id";
			$columns[]  = "date";
			$columns[]  = "material";
			$columns[]  = "item";
			$columns[]  = "shortcode";
			$columns[]  = "unit";
			$columns[]  = "type";
			$columns[]  = "quantity";
			$columns[]  = "making_cost";
			$columns[]  = "retailer_cost";
			$columns[]  = "wholesale_cost";
			$columns[]  = "item_number";
			$columns[]  = "barcode";
			$columns[]  = "custom_data";
			return $columns;
		break;
		
		case 'stock_deleted':
			$columns[]  = "generate_id";
			$columns[]  = "date";
			$columns[]  = "material";
			$columns[]  = "item";
			$columns[]  = "shortcode";
			$columns[]  = "unit";
			$columns[]  = "type";
			$columns[]  = "quantity";
			$columns[]  = "making_cost";
			$columns[]  = "retailer_cost";
			$columns[]  = "wholesale_cost";
			$columns[]  = "item_number";
			$columns[]  = "barcode";
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

		default:
			return $columns;
	}
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

function get_date($type, $format = "default"){
	$date = date('d-m-Y H:i:s');
	switch($type){
		case 'today':
			$date = date('Y-m-d');
		break;

		case 'this_month':
			$date = date('Y-m-01');
		break;

		case 'this_year':
			$date = date('Y-01-01');
		break;
	}

	return $date;
}
?>