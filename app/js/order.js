let request_url;
let request_params;
let manual_data;

let searchParams = new URLSearchParams(window.location.search)
let preRequestedOrderId = searchParams.get('order_id')
if(preRequestedOrderId){
  request_url = "./lib/orders.php";
  request_params = {
    action: "fetch_for_app",
    data: preRequestedOrderId,
    username: Cookies.get('username')
  };
}else{
  manual_data = "";
}

function setDefaultInputValues(){
  if(Cookies.get('name') !== undefined){
    $('input#name').val(Cookies.get('name'));
  }

  if(Cookies.get('mobile_number') !== undefined){
    $('input#mobile_number').val(Cookies.get('mobile_number'));
  }
  
  if(Cookies.get('address') !== undefined){
    $('textarea#address').val(Cookies.get('address'));
  }
}

function onPageReady(){
  managePreloader(false);

  $('input, textarea').attr('disabled', true);
  $('button#placeOrder, button#addItems').hide();

  $('button#close').click(function(){
    $('.menu-item[data-menu="orders"]').click();
  })
}