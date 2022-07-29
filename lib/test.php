<?php
require_once('define_defaults.php');
require_once('functions.php');
?>
<?php
$arr = array('name' => 'mickey');
unset($arr['name']);
print_r($arr);

//mkdir('uploa');
echo $_SERVER['HTTP_HOST'];

?>