<?php
  require_once('define_defaults.php');
?>
<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Origin, Content-Type, X-Auth-Token');

header('Content-Type: application/json');

function image_upload($imagename, $data){
  $local_path = UPLOADS_DIR . "/" . $imagename;
  $local_imageSavePath = BASE_DIR . $local_path;
  file_put_contents($local_imageSavePath, file_get_contents($data));
}
?>
<?php
$return = array();
$return['result'] = false;
$return['info']  = "item_image_upload: ";

if(isset($_POST['data']) && !empty($_POST['data'])){
  if(isset($_POST['action']) && !empty($_POST['action'])){
      $action = $_POST['action'];
      if($action == "item_image_upload"){
        $timestamp = $_POST['timestamp'];
        
        $data = $_POST['data'];
        $thumb_data = $data['thumb'];
        $orginal_data = $data['orginal'];

        image_upload("{$timestamp}_thumb.jpg", $thumb_data);
        image_upload("{$timestamp}_orginal.jpg", $orginal_data);

        $return['result'] = true;
        $return['info'] .= "image uploaded";
      }else{
        $return['info'] .= "action not found: " . $action;    
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