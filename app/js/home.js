let cart_obj = [];
let default_cookie_option = {expires: 100, secure: true};

let request_url = "./lib/items.php";
let request_params = {
  action: "fetch_for_app",
  data: "random_data"
};

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

function initCart(){
  let cart = Cookies.get('cart');
  if(cart) cart = JSON.parse(cart);
  if(Array.isArray(cart) && cart.length){
    Cookies.set('cart', '[]', default_cookie_option);
    
    cart.forEach(function(item){
      let shortcode = item.shortcode;
      let quantity = item.quantity;
      
      let item_container = $(`.catalogue-item[data-shortcode='${shortcode}']`);
      
      if(item_container.length){
        let add_container = item_container.find(`.footer .add-container`);
        if(add_container.find('.initial').length){
          add_container.find('.initial').click();
          if(quantity > 1){
            add_container.find(`.post-initial input`).val(quantity).trigger('input');
          }
        }
      }else{
        console.log(`item container not found`, item.shortcode)
      }
    });
  }else{
  }
}

function onPageReady(){
  var offset = $(".sticky-items").offset();
  
  setTimeout(function(){
    initCart();
  }, 1000);

  if(!isUserLogged()){
    $('.menu-item[data-menu="home"]').removeClass("active");
    $("#content-rendered").css("filter", "blur(4px)");
    loginModal(true, `route_home`, true);
  }
  
  managePreloader(false);

  getLogin();

  setDefaultInputValues();

  //----------------------BEGIN: searching methods----------------------//
    $("input[name=search]").on("keyup", function(){
      $('.catalogue').addClass('loading-background');
      $('.catalogue-item').addClass('d-none');
      $('.catalogue-item.d-grid').removeClass('d-grid');
      $(".catalogue-item.last-item").removeClass('last-item');
    
      var search_text = $(this).val().toLowerCase();
      $(".catalogue-item").filter(function(){
        let isShow = $(this).find('.name').text().toLowerCase().indexOf(search_text) > -1;
        $(this).toggle(isShow);
        if(isShow){
          $(this).addClass("d-grid");
        }
      });
      
      $('.catalogue-item.d-grid:last').addClass('last-item');
    
      $('.catalogue').removeClass('loading-background');
      $('.catalogue-item').removeClass('d-none');
    
      window.scrollTo(offset.left, offset.top + 34);
    });
  //----------------------END: searching methods----------------------//

  //----------------------BEGIN: order methods----------------------//
  $('#order-form').submit(function(event){
    event.preventDefault();

    let name = $('input#name:valid').val();
    let mobile_number = $('input#mobile_number:valid').val();
    let address = $('textarea#address:valid').val();
    
    if(name !== undefined && mobile_number !== undefined && address !== undefined){
      formLoader();
      
      let total_items = get_total_items();
      let gross_total = get_gross_total();

      let data = {
                  summary: cart_obj, 
                  billing: {sub_total: gross_total, total: gross_total, offer_percentage: 0, offer_amount: 0}
                };

      let order_obj = {
                        action: "create",
                        username: Cookies.get('username'),
                        name: name,
                        mobile_number: mobile_number,
                        address: address,
                        total_items: total_items,
                        data: JSON.stringify(data),
                      };
      ajaxPostCall("lib/orders.php", order_obj, function(response){
        let alert_title = "Order Confirmation";
        let alert_body = "";
        if(response.status){
          alert_body = `Ooops, unable to place your order at the moment!`;
        }else if(response.result){
          Cookies.set('cart', '[]', default_cookie_option);
          alert_body = `Your order placed successfully, you will receive your order by evening!</br><strong>Order Id: ${response.order_id}</br>Amount: ${gross_total}</strong>`;

          Cookies.set('name', name, default_cookie_option);
          Cookies.set('mobile_number', mobile_number, default_cookie_option);
          Cookies.set('address', address, default_cookie_option);
        }else{
          alert_body = `Ooops, your order is not placed!`;
        }

        orderModal(false);
        basicModal(alert_title, alert_body);
        formLoader(false);
      });
    }else{
      //empty input fields
    }
  });
  //----------------------END: order methods----------------------//
  $('#register_btn').click(function(){
      let WhatsAppNumber = "91" + $('#mobile_number').text();
      let message = "I am contacting for an account in ```AMBATI TASTY FOODS```";
      
      window.location.href = "https://wa.me/"+ WhatsAppNumber +"?text=" + encodeURI(message);
  });

  $('#loginForm').submit(function(event){
    event.preventDefault();

    updateLoadingState(true);
    
    let username = $('#username').val();
    let password = $('#password').val();

    ajaxPostCall('lib/customers.php', {action: "fetch_specified", data: {username: username, password: password}}, function(response){
      if(response.status){
        updateLoginStatus("Error from Server", false);
      }else if(response.result){
        updateLoginStatus("Login successful!", true);

        let user = response.data[0];

        //set cookies
        Cookies.set('username', user.username, default_cookie_option);
        Cookies.set('password', user.password, default_cookie_option);
        Cookies.set('name', user.name, default_cookie_option);
        Cookies.set('mobile_number', user.mobile_number, default_cookie_option);
        Cookies.set('address', user.address, default_cookie_option);

        setDefaultInputValues();

        let post_login = loginModal("post_login");
  
        loginModal(false);
  
        postLogin(post_login);
      }else{
        updateLoginStatus("Invalid credentials", false);
      }

      updateLoadingState(false);
    });
  });

  $('#modal-okay').click(function(){
    if($(this).parent().parent().children(".title").text().indexOf("₹500") <= 0){
      $(".in-cart .footer .add-container .post-initial input").val(0).trigger("input");
    }
    basicModal(false);
  });

  $('#modal-close').click(function(){
    orderModal(false);
  });
  
  $('.close-icon').click(function(){
    let modal_id = $(this).parent().parent().attr('id');

    if(modal_id == "basic-alert"){
      if($(this).parent().parent().children(".title").text().indexOf("₹500") <= 0){
        $(".in-cart .footer .add-container .post-initial input").val(0).trigger("input");
      }
      
      basicModal(false);
    }else if(modal_id == "order-preview"){
      orderModal(false);
    }
  });

  $('.clear-cart #clear-btn').click(function(){
    $(".in-cart .footer .add-container .post-initial input").val(0).trigger("input");
    Cookies.remove('cart');
  });

  $('.place-order #order-btn').click(function(){
    if(get_gross_total() < 500){
      //when changing the modal_title 
      //'₹500' make sure to update in '#modal-okay' click function
      let modal_title = "Minimum Order checkout worth is ₹500";
      let modal_body = "Please select ₹500 worth items to place the order!";
      basicModal(modal_title, modal_body)
    }else if(isUserLogged()){
      orderModal();
    }else{
      loginModal(true, "order_modal");
    }
  });

  $(".categories .tag").click(function(){
    let isActive = $(this).hasClass("active");
    let category_type = $(this).text();
    $(".categories .tag.active").removeClass('active');

    $(".catalogue-item.last-item").removeClass('last-item');

    if(category_type == "In Cart"){
      if(isActive){
        $('.catalogue-item.d-none')
        .addClass('d-grid')
        .removeClass('d-none');
      }else{
        //remove previous `d-none` items
        $('.catalogue-item.d-none')
        .addClass('d-grid')
        .removeClass('d-none');

        $('.catalogue-item:not(.in-cart)')
        .removeClass('d-grid')
        .addClass('d-none');

        $(this).addClass("active");
      }
    }else{
      if(isActive){
        $('.catalogue-item.d-none')
          .addClass('d-grid')
          .removeClass('d-none');
      }else{
        //remove previous `d-none` items
        $('.catalogue-item.d-none')
        .addClass('d-grid')
        .removeClass('d-none');
        
        $(".catalogue-item:not(.catalogue-item[data-category='"+ category_type +"'])")
          .removeClass('d-grid')
          .addClass('d-none');
        $(this).addClass("active");
      }
    }
    window.scrollTo(offset.left, offset.top + 34);

    $('.catalogue .catalogue-item:not(.d-none):last').addClass('last-item');

    $(this).focusout();
    $(".lbl-toggle").click();
  });

  $(document).on('input', 'input[name=itemCount]', function() {
    let inputTag = $(this);
    let inputVal = parseInt(inputTag.val());

    if(inputVal > inputTag.attr('min')){
      if(inputVal < inputTag.attr('max')){
        initUpdateCart(this, false);
      }else{
        inputTag.val(inputTag.attr('max'));
        initUpdateCart(this, false);
        
        let modal_title = "Maximum Quantity";
        let modal_body = "Maximum Quantity has reached, cannot add more quantity for this item";
        basicModal(modal_title, modal_body);
      }
    }else{
      let add_container = $(this).parent().parent();
      let initial_container = add_container.children('.initial');
      let post_initial_container = add_container.children('.post-initial');

      initial_container.removeClass('d-none');
      post_initial_container.addClass('d-none');

      initUpdateCart(this, undefined);
    }
  });

  $('.footer .post-initial #add').click(function(){
    let addQuantity = parseInt(this.parentElement.parentElement.attributes["date-add-quantity"].value);
    let inputTag = $(this).parent().children('input');
    let inputVal = parseInt(inputTag.val());
    if(inputVal < inputTag.attr('max')){
      inputTag.val(inputVal + addQuantity);
      initUpdateCart(this, false);
    }else{
      inputTag.val(inputTag.attr('max'));
      initUpdateCart(this, false);
      
      let modal_title = "Maximum Quantity";
      let modal_body = "Maximum Quantity has reached, cannot add more quantity for this item";
      
      basicModal(modal_title, modal_body);
    }
    return false;
  });

  $('.footer .post-initial #remove').click(function(){
    let addQuantity = parseInt(this.parentElement.parentElement.attributes["date-add-quantity"].value);
    let inputTag = $(this).parent().children('input');
    let inputVal = parseInt(inputTag.val());
    let postInputVal = inputVal - addQuantity;
    if(postInputVal >= inputTag.attr('min')){
      inputTag.val(postInputVal);
      initUpdateCart(this, false);
    }else{
      //reset to initial
      let add_container = $(this).parent().parent();
      let initial_container = add_container.children('.initial');
      let post_initial_container = add_container.children('.post-initial');

      initial_container.removeClass('d-none');
      post_initial_container.addClass('d-none');

      initUpdateCart(this, undefined);
    }
    return false;
  });

  $(document).on('click', '.add-container .initial', function(){
    let addQuantity = parseInt(this.parentElement.attributes["date-add-quantity"].value);
    let add_container = $(this).parent();
    let initial_container = add_container.children('.initial');
    let post_initial_container = add_container.children('.post-initial');

    initial_container.addClass('d-none');
    post_initial_container.removeClass('d-none');
    
    post_initial_container.children('input[name=itemCount]').val(addQuantity);
    initUpdateCart(this, true);
  });


  /* BEGIN: image_preview */
  $('#previewClose').click(function(){
    $('#imgPreviewWrapper')
      .removeClass('animate-zoom-in')
      .addClass('animate-zoom-out');
      setTimeout(function(){
        $('.image-preview-container').addClass('d-none');
        $('#imgPreviewWrapper').removeClass('animate-zoom-out');
      }, 300);
  });

  $('.catalogue-item .section-1 .img').click(function(){
    if($(this).find('.previews').length){
      initPreview(this);
    }
  });

  $('.image-preview-container').click(function(e){
    if($(e.target).prop("tagName") == "DIV"){
      //working but getting too much recursion 
      //$('#previewClose').click();

      $('#imgPreviewWrapper')
      .removeClass('animate-zoom-in')
      .addClass('animate-zoom-out');
      setTimeout(function(){
        $('.image-preview-container').addClass('d-none');
        $('#imgPreviewWrapper').removeClass('animate-zoom-out');
      }, 300);
    }
  });
  /* END: image_preview */


  $('.login-container').click(function(e){
    if($(e.target).hasClass("login-container")){
      if(!loginModal("isDisableClose")){
        loginModal(false)
      }
    }
  });
}

function get_gross_total(){
  return parseFloat(cart_obj.reduce((n, {total_price}) => n + total_price, 0));
}

function get_total_items(){
  return parseInt(cart_obj.reduce((n, {quantity}) => n + quantity, 0));
}

/*
[
  {
    type: "add|remove|update",
    selector: "",
    text: "",
    val: "",
    shouldVisible: false,
    data: ""
  }
]
*/
function generateOrderSummaryText(item, mobile_number, address){
  let text = "";

  text += "Name:\n" + item + "\n";
  text += "\nMobile Number:\n" + mobile_number + "\n";
  text += "\nAddress:\n" + address + "\n\n";
  text += "Orders: \n";
  let slno = 1;

  cart_obj.forEach(obj => {
    //1. Khara(KHARA)(1x200) = 200
    text += "\n";
    text += slno + ". " + obj.item + "(" + obj.shortcode + ")" + "(" + obj.quantity + "x" + obj.unit_price + ")\t = " + obj.total_price;
    text += "\n";
    slno++;
  });

  text += "----------------------------";
  text += "\nSub Total\t = " + $('.footer-element #sub_total').text(); 
  text += "\nGST(0% GST)\t = " + $('.footer-element #gst').text();
  text += "\nTotal\t = " + $('.footer-element #total').text();
  return text;
}

$(document).on('click', '.delete-item', function(){
  let total_item_price = $(this).parent().parent().find('.total-price').text();
  if(get_gross_total() - parseInt(total_item_price) > 500){
    let shortcode = $(this).data('shortcode');
    
    let item_container = $(`.catalogue-item[data-shortcode='${shortcode}']`);
    let add_container = item_container.find(`.footer .add-container`);
    add_container.find(`.post-initial input`).val('0').trigger('input'); 
    
    orderModal();
  }else{
      //when changing the modal_title 
      //'₹500' make sure to update in '#modal-okay' click function
      let modal_title = "Minimum Order checkout worth is ₹500";
      let modal_body = "Item won't removed because checkout worth will be less than minimum worth of ₹500";
      basicModal(modal_title, modal_body)
  }
})

function updateCatalogueVisibility(onlyShowCart){
  if(onlyShowCart){
    $('.catalogue-item:not(.in-cart)').addClass('d-none');
  }else{
    $('.catalogue-item.d-none').removeClass('d-none');
  }
}

function initUpdateCart(this_, isIntital, cart_cookie = true){
  let catalogue_item = $(this_).parent().parent().parent();

  if(!isIntital){
    catalogue_item = $(this_).parent().parent().parent().parent();
  }

  let item = $(catalogue_item).find(".name").text();
  let shortcode = $(catalogue_item).find(".code #item_code").text();
  let unit_price = $(catalogue_item).find(".footer .price #cost").text();
  let item_count = $(catalogue_item).find(".footer .add-container .post-initial input").val();
  
  if(isIntital === undefined){
    //have to remove item from cart
    if(removeFromCart(shortcode)){
      $(catalogue_item).removeClass("in-cart");
      if($('.categories #cart').is(".active")){
        $(catalogue_item).addClass("d-none");
      }
      refreshUICart();
    }else{
      let modal_title = "Error removing item";
      let modal_body = "Unable to remove item, please contact administrator!";
      
      basicModal(modal_title, modal_body);
    }
  }else if(isIntital){
    if(addToCart(item, shortcode, unit_price)){
      $(catalogue_item).addClass("in-cart");
      refreshUICart();
    }else{
      let modal_title = "Error updating cart";
      let modal_body = "Unable to add item to cart, please contact administrator!";
      
      basicModal(modal_title, modal_body);
    }
  }else{
    if(updateCart(shortcode, unit_price, item_count)){
      refreshUICart();
    }else{
      let modal_title = "Error updating cart";
      let modal_body = "Unable to update cart, please contact administrator";
      
      basicModal(modal_title, modal_body);
    }
  }

  if(cart_cookie){
    Cookies.set('cart', cart_obj, default_cookie_option);
  }
}

function addToCart(item, shortcode, unit_price){
  return cart_obj.push(
    {
      "item": item,
      "shortcode": shortcode,
      "unit_price": parseFloat(unit_price),
      "quantity": 1,
      "total_price": parseFloat(unit_price)
    }
  );
}

function removeFromCart(shortcode){
  const findIndex = cart_obj.findIndex(a => a.shortcode === shortcode);
  if(findIndex != -1){
    return cart_obj.splice(findIndex, 1);
  }
  return false;
}

function updateCart(shortcode, unit_price, quantity){
  quantity = parseInt(quantity);
  unit_price = parseFloat(unit_price);
  
  let found_obj = cart_obj.find((obj, iter) => {
    if (obj.shortcode == shortcode) {      
      obj.unit_price = unit_price;
      obj.quantity = quantity;
      obj.total_price = (unit_price * quantity);
      
      //cart_obj[iter] = {};
      return true;
    }
  });
  return found_obj;
}

function refreshUICart(){
  let total_items = get_total_items();
  let gross_total = get_gross_total();

  $('.cart-summary .items-summary .items').text(total_items + " items");
  $('.cart-summary .items-summary #amount span').text(gross_total);
  $('#shortItemCount').text(total_items > 9 ? "9+" : total_items);

  if(total_items > 0){
    //show cart
    $('.cart-summary').removeClass('d-none');
  }else{
    //hide cart
    $('.cart-summary').addClass('d-none');
  }

}

/*Begin: Login Form Methods*/
function updateLoadingState(status){
  let login_btn = $('#login_btn');
  let form_elements = $("#loginForm").find(".form-element input, .form-element button");
  if(status){
    login_btn.addClass('loading');
    form_elements.attr("disabled", true);
  }else{
    login_btn.removeClass('loading');
    form_elements.attr("disabled", false);
  }
}

function updateLoginStatus(text, status){
  let login_status_container = $('#login_status');
  login_status_container.text(text);
  if(status === undefined){
    login_status_container.text(null);
    login_status_container.removeClass("success danger");
  }else if(status){
    login_status_container.removeClass("danger").addClass("success");
  }else{
    login_status_container.removeClass("success").addClass("danger");
  }
}
/*End: Login Form Methods*/

/*Begin: Preview Methods*/
function getFullImgOrginalPath(rootPath, absolutePath){
  let imageName = absolutePath.substring(12);
  return rootPath + "/full/" + imageName;
}

function initPreview(selector){
  let preview_main_img = $('#previewMainImg');
  let preview_side_imgs = $('#previewSideImgs');  

  preview_main_img.empty();
  preview_side_imgs.empty();

  let previews = $(selector).find(".previews img");
  previews.each(function(index, img){
    if(index == 0){
      preview_main_img.append('<img class="lazyPreview no-preloader" data-src="'+ img.src +'" src="imgs/loading.svg" alt="">');
      preview_side_imgs.append('<img class="lazyPreview active" data-src="'+ img.src +'" width="100" height="100">');
    }else{
      preview_side_imgs.append('<img class="lazyPreview" data-src="'+ img.src +'" width="100" height="100">');
    }
  });

  $(".image-preview-container").removeClass("d-none");
  $("#imgPreviewWrapper").addClass("animate-zoom-in");
  $('.lazyPreview').Lazy({
    onError: function(element){
      element.attr('src', 'imgs/image-not-found.jpg')
    }
  });
}

$(document).on('click', '#previewSideImgs img:not(.active)', function(){
  $('#previewMainImg img').attr('src', $(this).attr("src"));
  $("#previewSideImgs img.active").removeClass("active");
  $(this).addClass("active");
});
/*End: Preview Methods*/

function isItemHighlight(itemPriority, for_){
  if(itemPriority !== undefined){
    if(
         itemPriority == 'default' 
      || itemPriority == 'top'
    ){
      if(for_ == 'forClass'){
        return "";
      }else{
        //for ribbon
        return false;
      }
    }else{
      if(for_ == 'forClass'){
        return "highlight";
      }else{
        //for ribbon
        return true;
      }
    }
  }else{
    if(for_ == 'forClass'){
      return "";
    }else{
      //for ribbon
      return false;
    }
  }
}