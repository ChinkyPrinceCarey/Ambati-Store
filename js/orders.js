let request_url = "./lib/orders.php";
let request_params = {
  action: "fetch_for_app",
  data: "all",
  username: Cookies.get('username')
};

function onPageReady(){
  managePreloader(false);
}

function getOrderStatus(is_cancelled, is_confirmed, is_paid, return_type){
  text_arr = ["Cancelled", "Ordered", "On the Way", "Delivered"];
  color_arr = ["red", "blue", "yellow", "green"];

  is_cancelled = parseInt(is_cancelled);
  is_confirmed = parseInt(is_confirmed);
  is_paid = parseInt(is_paid);

  let state;
  if(is_cancelled){
    state = 0;
  }else if(is_confirmed){
    if(is_paid){
      state = 3;
    }else{
      state = 2;
    }
  }else{
    state = 1;
  }

  return return_type == "text" ? text_arr[state] : color_arr[state];
}