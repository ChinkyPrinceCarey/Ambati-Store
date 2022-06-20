<?php
//not used
function is_double_quote_required($_values){
	if(strpos($_values, "'") !== FALSE || strpos($_values, '\'') !== FALSE){
		return true;
	}else{
		return false;
	}
}

function is_exist($_str, $_match){
	return (strpos($_str, $_match) !== FALSE);
}

/* Following method will generate
3 types of quotes
	1. Backquote = `example`
	2. Single Quote = 'example'
	3. Double Quote = "example"

2 types of separators
	4. AND
	5. Comma(,)
*/
function generate_quotes($quote_type, $array, $break_type="comma"){
	$string = "";
	$equal = "=";
	$quote = null;
	
	$backquote = "`";
	$singlequote = "'";
	$doublequote = '"';
	
	if($quote_type == "bq"){
		//backquote
		$quote = $backquote;
	}else if($quote_type == "sq"){
		//single quote
		$quote = $singlequote;
	}else if($quote_type == "dq"){
		//double quote
		$quote = $doublequote;
	}
	
	$break = null;
	$and = " AND ";
	$or = " OR ";
	$comma = ", ";
	
	if($break_type == "comma"){
		$break = $comma;
	}else if($break_type == "and"){
		$break = $and;
	}else if($break_type == "or"){
		$break = $or;
	}
	
	if(
		(is_exist($array[0], "="))
		&& !(is_exist($array[0], " AS "))
	){
		//because it has equal[=] in the array
		//it will be where values or set values in update
		
		foreach($array as $array_loop){
			//a=10 ==> array(	"a",		"10"	)
			//					$column		$value
			$array_spilt = explode("=", $array_loop);
			
			$column = $array_spilt[0];
			$value = $array_spilt[1];

			if($value == "NULL"){
				$string .= $backquote . $column . $backquote . $equal . $value . $break;
			}elseif($value == ''){
				$value = 'NULL';
				$string .= $backquote . $column . $backquote . $equal . $value . $break;
			}else{
				$string .= $backquote . $column . $backquote . $equal . $quote . $value . $quote . $break;
			}
		}
		$string = preg_replace("/($break)$/", "", $string);
		
	}else{
		
		foreach($array as $array_loop){
			if($array_loop === null || $array_loop == ''){
				$string .= "NULL" . $break;
			}else{
				if(is_exist($array_loop, " AS ")){
					$string .= $array_loop . $break;
				}else{
					$string .= $quote . $array_loop . $quote . $break;
				}
			}
			
		}
		$string = preg_replace("/($break)$/", "", $string);
		
	}
	
	return $string;
}

function add_filter_where($__query_type, $__table_name, $__where_values){
	if($__query_type != "insert"){
		if(is_array($__where_values)){
			if($__table_name == "customers"){
				if(!in_array("deleted=1", $__where_values)){
					$__where_values[] = "deleted=0";
				}
			}elseif($__table_name == "emi_payments"){
				if(!in_array("cancelled=1", $__where_values)){
					$__where_values[] = "cancelled=0";
				}
			}
		}
	}
	return $__where_values;
}

//generates query
function get_query($_type, $_table_name, $_column_names="*", $_where_values=1, $_additional = null){
	
	if($_type && $_table_name && $_column_names){
		
		$query = array();
		$query['additional_information'] = "get_query() method";
		
		$_where_values = add_filter_where($_type, $_table_name, $_where_values);
		
		$query['table_name'] = $_table_name;
		$query['column_names'] = $_column_names;
		$query['where_values'] = $_where_values;
		
		if($_type == "custom"){
			//method called with self written query
			//so we just have to pass the query to the appropriate method
			$query['query'] = $_column_names;
		}else{
				switch($_type){
					case "select":
						$column_names = $_column_names == "*" ? "*" : generate_quotes("bq", $_column_names);
						$where_values = !is_array($_where_values) ? $_where_values : generate_quotes("sq", $_where_values, "and");

						$query['query'] = "SELECT $column_names FROM `$_table_name` WHERE $where_values $_additional";
					break;

					case "select2":
						$column_names = $_column_names == "*" ? "*" : generate_quotes("bq", $_column_names);
						$where_values = !is_array($_where_values) ? $_where_values : generate_quotes("sq", $_where_values, "or");

						$query['query'] = "SELECT $column_names FROM `$_table_name` WHERE $where_values $_additional";
					break;
					
					case "update":
						if($_column_names != "*" && $_where_values != 1)
							$set_values = generate_quotes("sq", $_column_names);
							$where_values = !is_array($_where_values)? $_where_values : generate_quotes("sq", $_where_values, "and");
							
							$query['set_values'] = $set_values;
							$query['query'] = "UPDATE `$_table_name` SET $set_values WHERE $where_values";
					break;
					
					case "update2":
						if($_column_names != "*" && $_where_values != 1)
							$set_values = generate_quotes("sq", $_column_names);
							$where_values = !is_array($_where_values)? $_where_values : generate_quotes("sq", $_where_values, "or");
							
							$query['set_values'] = $set_values;
							$query['query'] = "UPDATE `$_table_name` SET $set_values WHERE $where_values";
					break;
					
					case "delete_and_clause":
						if($_where_values != 1)
							$where_values = !is_array($_where_values)? $_where_values : generate_quotes("sq", $_where_values, "and");
							
							$query['column_and_its_values'] = $_column_names;
							$query['query'] = "DELETE FROM `$_table_name` WHERE $where_values";
					break;
					
					case "delete_or_clause":
						if($_where_values != 1)
							$where_values = !is_array($_where_values)? $_where_values : generate_quotes("sq", $_where_values, "or");
							
							$query['column_and_its_values'] = $_column_names;
							$query['query'] = "DELETE FROM `$_table_name` WHERE $where_values";
					break;
					
					//_where_values parameter used as column value in INSERT QUERY
					case "insert":
						if($_column_names != "*" && $_where_values != 1)
							$column_names = generate_quotes("bq", $_column_names);
							$column_values = generate_quotes("sq", $_where_values);
							
							$query['query'] = "INSERT INTO `$_table_name` ($column_names) VALUES ($column_values)";
					break;
				}
		}
		
	}else{
		//wrong calling of the get_query() method
		$query['additional_information'] = "get_query() method called in a wrong way, please see documentation";
	}
	
	return $query;
}

//select query
function select_query($_query, $_options = array("assoc"=>true, "add_slno"=>false, "conearr" =>false, "json"=>true, "json_validate"=>true, "table"=>null)){
	$result = array();
	$result['result'] = false;
	$result['additional_information'] = "select_query(): select_query() called";
	$result['additional_data'] = array();
	
	//options variables
	$options_assoc = array_key_exists('assoc', $_options) ? $_options['assoc']: true;
	$options_json = array_key_exists('json', $_options) ? $_options['json']: true;
	$options_json_validate = array_key_exists('json_validate', $_options) ? $_options['json_validate']: true;
	$cone_arr = array_key_exists('conearr', $_options) ? $_options['conearr']: false;
	$add_slno = array_key_exists('add_slno', $_options) ? $_options['add_slno']: true;
	//$set_slno = array_key_exists('set_slno', $_options) ? $_options['set_slno']: false;
	
	if($add_slno){
		set_mysql_values($_options['table'], 'SET @slno=0');
	}
	
	try{
		global $conn;
		
		$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		
		$stmt = $conn->query($_query['query']);
		
		if($stmt === false){
			$result['additional_information'] = "select_query(): Error executing the query: " . $query['query'];
			return $result;
		}
		
		$slno = 1;
		while($row = $stmt->fetch(PDO::FETCH_ASSOC)){
			//echo "<pre>"; print_r($row); echo "</pre>";
			$row_arr = $row;
			$arr = array();
			if($add_slno){
				$arr[] = $slno;
			}
			if($options_assoc){
				//associative array will be resulted
				if($options_json){
					foreach($row_arr as $key=>$value){
						$json_decode_arr = json_decode($value, true);
						if($options_json_validate){
							if($cone_arr){
								$arr[] = $json_decode_arr ? $json_decode_arr : $value ;
							}else{
								$row_arr[$key] = $json_decode_arr ? $json_decode_arr : $value ;
							}
						}else{
							$row_arr[$key] = $json_decode_arr;
						}
					}
				}
				$result['additional_data'][] = $cone_arr ? $arr : $row_arr;	
				$slno++;
			}else{
				//NONE Associative array will be resulted
				foreach($row_arr as $key=>$value){
					if($options_json){
						$json_decode_arr = json_decode($value, true);
						if($options_json_validate){
							$row_arr[$key] = $json_decode_arr ? $json_decode_arr : $value ;
						}else{
							$row_arr[$key] = $json_decode_arr;
						}
					}
					
					$result['additional_data'][$key][] = $row_arr[$key]; 
				}
			}
		}
		
		$result['result'] = true;
		$result['additional_information'] = "select_query(): query executed sucessfully!";
		return $result;
	}
	catch(PDOException $e) {
		$result['additional_information'] = "select_query(): Catch Block: Error: " . $e->getMessage();
		return $result;
	}
}

//select query
function select_query2($_query, $_options = array("assoc"=>true, "add_slno"=>false, "conearr" =>false, "json"=>true, "json_validate"=>true)){
	$result = array();
	$result['result'] = false;
	$result['additional_information'] = "select_query(): select_query() called";
	$result['additional_data'] = array();
	
	//options variables
	$options_assoc = array_key_exists('assoc', $_options) ? $_options['assoc']: true;
	$options_json = array_key_exists('json', $_options) ? $_options['json']: true;
	$options_json_validate = array_key_exists('json_validate', $_options) ? $_options['json_validate']: true;
	$cone_arr = array_key_exists('conearr', $_options) ? $_options['conearr']: false;
	$add_slno = array_key_exists('add_slno', $_options) ? $_options['add_slno']: false;
	
	try{
		global $conn;
		
		$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		
		$stmt = $conn->query($_query['query']);
		
		if($stmt === false){
			$result['additional_information'] = "select_query(): Error executing the query: " . $query['query'];
			return $result;
		}
		
		$slno = 1;
		while($row = $stmt->fetch(PDO::FETCH_ASSOC)){
			//echo "<pre>"; print_r($row); echo "</pre>";
			$row_arr = $row;
			$arr = array();
			if($add_slno){
				$arr[] = $slno;
			}
			if($options_assoc){
				//associative array will be resulted
				if($options_json){
					foreach($row_arr as $key=>$value){
						$json_decode_arr = json_decode($value, true);
						if($options_json_validate){
							if($cone_arr){
								if($key == "type_name" || $key == "type_id"){
									if($key == "type_name"){
										$type_name = $json_decode_arr ? $json_decode_arr : $value ;
										$type_id = array_key_exists('type_id', $row_arr) ? $row_arr['type_id'] : "" ;
										$arr[] = $json_decode_arr ? $json_decode_arr : $type_name . "(" . $type_id . ")"  ;
									}
								}else{
									$arr[] = $json_decode_arr ? $json_decode_arr : $value ;
								}
							}else{
								$row_arr[$key] = $json_decode_arr ? $json_decode_arr : $value ;
							}
						}else{
							$row_arr[$key] = $json_decode_arr;
						}
					}
				}
				$result['additional_data'][] = $cone_arr ? $arr : $row_arr;	
				$slno++;
			}else{
				//NONE Associative array will be resulted
				foreach($row_arr as $key=>$value){
					if($options_json){
						$json_decode_arr = json_decode($value, true);
						if($options_json_validate){
							$row_arr[$key] = $json_decode_arr ? $json_decode_arr : $value ;
						}else{
							$row_arr[$key] = $json_decode_arr;
						}
					}
					
					$result['additional_data'][$key][] = $row_arr[$key]; 
				}
			}
		}
		
		$result['result'] = true;
		$result['additional_information'] = "select_query(): query executed sucessfully!";
		return $result;
	}
	catch(PDOException $e) {
		$result['additional_information'] = "select_query(): Catch Block: Error: " . $e->getMessage();
		return $result;
	}
}

//update query
function update_query($_query, $_transaction_conn=null){
	
	if($_transaction_conn){
		$conn = $_transaction_conn;
	}else{
		global $conn;
		$conn->setAttribute(PDO::ATTR_AUTOCOMMIT, true);
	}
	
	$result = array();
	$result['result'] = false;
	$result['additional_information'] = "update_query(): update_query() called";
	
	try{
		$pdo_statement = $conn->prepare( $_query['query'], array(PDO::MYSQL_ATTR_FOUND_ROWS => true) );
			
		$stmt = $pdo_statement->execute();
		
		$affected_rows = $pdo_statement->rowCount();
		$result['affected_rows'] = $affected_rows;
		
		$result['additional_information'] = "update_query(): Error executing query: " . $_query['query'];
		
		if($_transaction_conn){
			if (!empty($stmt)){
				$result['result'] = true;
				$result['additional_information'] = "update_query(): query executed successfully!";
				$result['pdo_statement'] = $pdo_statement;
			}
		}else{
			if($affected_rows){
				$result['result'] = true;
				$result['additional_information'] = "update_query(): $affected_rows row(s) affected!";
			}else{
				$result['additional_information'] = "update_query(): ZERO rows are affected!";
			}
		}
		
		return $result;
	}
	catch(PDOException $e) {
		$result['additional_information'] = "update_query(): Catch Block: Error: " . $e->getMessage();
		return $result;
	}
	
}

//delete query
function delete_query($_query, $_transaction_conn=null){
	
	if($_transaction_conn){
		$conn = $_transaction_conn;
	}else{
		global $conn;
		$conn->setAttribute(PDO::ATTR_AUTOCOMMIT, true);
	}
	
	$result = array();
	$result['result'] = false;
	$result['additional_information'] = "delete_query(): delete_query() called";
	
	try{
		$pdo_statement = $conn->prepare( $_query['query'], array(PDO::MYSQL_ATTR_FOUND_ROWS => true) );
			
		$stmt = $pdo_statement->execute();

		$result['additional_information'] = "delete_query(): Error executing query: " . $_query['query'];

		if($_transaction_conn){
			if (!empty($stmt)){
				$result['result'] = true;
				$result['additional_information'] = "delete_query(): query executed successfully!";
				$result['pdo_statement'] = $pdo_statement;
			}
		}else{
			$deleted_rows = $pdo_statement->rowCount();
			if($deleted_rows){
				$result['result'] = true;
				$result['additional_information'] = "delete_query(): $deleted_rows row(s) deleted";
			}else{
				$result['additional_information'] = "delete_query(): ZERO rows are deleted!";
			}
		}
		
		return $result;
	}
	catch(PDOException $e) {
		$result['additional_information'] = "delete_query(): Catch Block: Error: " . $e->getMessage();
		return $result;
	}
}

//insert query
function insert_query($_query, $_transaction_conn=null){
	
	if($_transaction_conn){
		$conn = $_transaction_conn;
	}else{
		global $conn;
		$conn->setAttribute(PDO::ATTR_AUTOCOMMIT, true);
	}
	
	$result = array();
	$result['result'] = false;
	$result['additional_information'] = "insert_query(): insert_query() called!";
	
	try{
		$pdo_statement = $conn->prepare( $_query['query'], array(PDO::MYSQL_ATTR_FOUND_ROWS => false) );
			
		$stmt = $pdo_statement->execute();
		
		$result['additional_information'] = "insert_query(): Error executing query: " . $_query['query'];

		if($_transaction_conn){
			if (!empty($stmt)){
				$result['result'] = true;
				$result['additional_information'] = "insert_query(): New record(s) created successfully!";
				$result['pdo_statement'] = $pdo_statement;
			}
		}else{
			$affected_rows = $pdo_statement->rowCount();
			if($affected_rows){
				$result['result'] = true;
				$result['additional_information'] = "insert_query(): New record(s) created successfully!";
			}else{
				$result['additional_information'] = "insert_query(): ZERO rows are created!";
			}
		}
		
		return $result;
	}
	catch(PDOException $e) {
		$result['additional_information'] = "insert_query(): Catch Block: Error: " . $e->getMessage();
		return $result;
	}
}

//transaction queries
function execute_transactions($_queries_array){
	
	global $conn;
	$conn->beginTransaction();
	
	$return_array = array();
	$return_array['result'] = false;
	$return_array['additional_information'] = "execute_transactions(): execute_transactions() called";
	
	$commit_all_transactions = false;
	
	foreach($_queries_array as $index_key){
		foreach($index_key as $type => $query){
			try{
				$execute_result = null;
				
				switch($type){
					case "insert":
						$execute_result = insert_query($query, $conn);
					break;
					
					case "update":
						$execute_result = update_query($query, $conn);
					break;
					
					case "delete":
						$execute_result = delete_query($query, $conn);
					break;
				}
				
				if($execute_result!=null && array_key_exists("query",$query) && $execute_result['result']){
					
					$stmt = $execute_result['pdo_statement'];
					
					//executed perfectly
					if(!$stmt->rowCount()){
						//affected rows are 0
						$conn->rollBack();
								
						$return_array['additional_information'] = "execute_transactions(): affected row(s) are 0 while executing: " . $query['query'];
						$commit_all_transactions = false;
						return $return_array;
					}
				}else{
					//some error in query
					$conn->rollBack();
					$return_array['additional_information'] = "execute_transactions(): Error while executing query : " . $query['query'] . " Error: " . $execute_result['additional_information'];
					$commit_all_transactions = false;
					return $return_array;
				}
				$commit_all_transactions = true;
				
			}catch(PDOException $e){
				$conn->rollBack();
				$return_array['additional_information'] = "execute_transactions(): Catch Block: PDO Exception while executing " . $query['query'] . " : " . $e->getMessage();
				return $return_array;
			}
		}
	}
	
	if($commit_all_transactions){
		//no error has occured while executing queries
		//so we can perform commit operation
		try{
			$conn->commit();
			$return_array['result'] = true;
			$return_array['additional_information'] = "execute_transactions(): All queries are executed successfully!";
			
			return $return_array;
			
		}catch(PDOException $e){
			$conn->rollBack();
			$return_array['additional_information'] = "execute_transactions(): Catch Block: PDO Exception while commit: " . $e->getMessage();
			return $return_array;
		}
	}else{
		//this line should not execute
		//because if any error has occured earlier, automatically it will return the function, it won't come this far
		$return_array['additional_information'] = "execute_transactions(): some error in queries!";
		return $return_array;
	}
}


function set_mysql_values($_table, $_query){
	$return = 	array(
					"result" => false, 
					"additional_information" => "set_mysql_values(): called"
				);
	
	$query_type = "custom";
	$table_name = $_table;
	$query = $_query;
	$select_query = get_query($query_type, $table_name, $query);

	$select_result = select_query($select_query);
	
	$return['result'] = $select_result['result'];
	$return['query'] = $select_query;
	$return['additional_information'] = "set_mysql_values(): " . $select_result['additional_information'];
	
	return $return;
}

?>