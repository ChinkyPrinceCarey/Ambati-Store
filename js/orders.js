let request_url = "./lib/orders.php";
let request_params = {
  action: "fetch_for_app",
  data: "all",
  username: Cookies.get('username')
};

function onPageReady(){
  managePreloader(false);

  $(".order-container").click(function(){
    order_id = $(this).data("order-id");
    window.location.href = `order.html?order_id=${order_id}`;
  });
}