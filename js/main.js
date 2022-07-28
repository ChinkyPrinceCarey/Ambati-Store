let cart_obj = [];
let default_cookie_option = {expires: 100, secure: true};

var target = new EventTarget();
target.addListener("onApiReady", onCustomReady);

function onCustomReady(){
  var offset = $(".sticky-items").offset();

  $('.lazy').Lazy();
  
  managePreloader(false);

  if(Cookies.get('name') !== undefined){
    $('input#name').val(Cookies.get('name'));
  }

  if(Cookies.get('name') !== undefined){
    $('input#name').val(Cookies.get('name'));
  }

  if(Cookies.get('mobile_number') !== undefined){
    $('input#mobile_number').val(Cookies.get('mobile_number'));
  }
  
  if(Cookies.get('address') !== undefined){
    $('textarea#address').val(Cookies.get('address'));
  }

  $("input[name=search]").on("keyup", function(){
    $('.catalogue').addClass('loading-background');
    $('.catalogue-item').addClass('d-none');
    $('.catalogue-item.d-grid').removeClass('d-grid');
  
    var search_text = $(this).val().toLowerCase();
    $(".catalogue-item").filter(function(){
      let isShow = $(this).find('.name').text().toLowerCase().indexOf(search_text) > -1;
      $(this).toggle(isShow);
      if(isShow){
        $(this).addClass("d-grid");
      }
    });
  
    $('.catalogue').removeClass('loading-background');
    $('.catalogue-item').removeClass('d-none');
	
    window.scrollTo(offset.left, offset.top + 34);
  });

  $('#order-form').submit(function(event){
    event.preventDefault();
    let name = $('input#name:valid').val();
    let mobile_number = $('input#mobile_number:valid').val();
    let address = $('textarea#address:valid').val();
    
    if(name !== undefined && mobile_number !== undefined && address !== undefined){
      Cookies.set('name', name, default_cookie_option);
      Cookies.set('mobile_number', mobile_number, default_cookie_option);
      Cookies.set('address', address, default_cookie_option);

      let order_summary = generateOrderSummaryText(name, mobile_number, address);

      let WhatsAppNumber = "91" + $('#mobile_number').text();
      
      //erase order
      $(".in-cart .footer .add-container .post-initial input").val(0).trigger("input");
      manageModal(false);

      //window.location.href = "https://wa.me/"+ WhatsAppNumber +"?text=" + encodeURI(order_summary);

      let gross_total = $('.footer-element #total').text();
      console.log(`gross_total: ${gross_total}`)

      ajaxPostCall("api/order.php", {mobile_number: mobile_number, gross_total: gross_total}, function(response){
        let alert_obj = [
          {
            type: "update",
            selector: "#alert .wrapper .title",
            text: "Order Confirmation!"
          },
          {
            type: "update",
            selector: "#alert .wrapper .body",
            html: `Your order placed successfully, you will receive your order by evening!</br><strong>Order Id: 1</br>Amount: ${gross_total}</strong>`
          }
        ];
        manageModal(true, alert_obj);
      });

    }
  });

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

    if(username == "8686068182" && password == "admin"){
      updateLoginStatus("Login successful!", true);

      //set cookies
      Cookies.set('username', username, default_cookie_option);
      Cookies.set('password', password, default_cookie_option);

      //hide login-form
      $('.login-conatiner')
      .removeClass('animate-open-top')
      .addClass('animate-close-top');
      setTimeout(function(){
        $('.login-conatiner').addClass('d-none');
      }, 800);

      //proceed to order-form
      manageModal(true, undefined, cart_obj);

    }else{
      updateLoginStatus("Invalid credentials", false);
    }

    updateLoadingState(false);
  });

  $('#modal-close, #modal-okay').click(function(){
    manageModal(false);
  });

  $('.place-order #order-btn').click(function(){
    if((Cookies.get('username') == "8686068182")
    && (Cookies.get('password') == "admin")){
      //proceed to order-form
      manageModal(true, undefined, cart_obj);
    }else{
      //show login-form
      $(".login-conatiner")
        .addClass("animate-open-top")
        .removeClass("d-none");
    }
  });

  $(".categories .tag").click(function(){
    let isActive = $(this).hasClass("active");
    let category_type = $(this).text();
    $(".categories .tag.active").removeClass('active');
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
    $(this).focusout();
  });

  $('input[name=itemCount]').on('input', function() {
    let inputTag = $(this);
    let inputVal = parseInt(inputTag.val());

    if(inputVal > inputTag.attr('min')){
      if(inputVal < inputTag.attr('max')){
        initUpdateCart(this, false);
      }else{
        inputTag.val(inputTag.attr('max'));
        initUpdateCart(this, false);
        let alert_obj = [
          {
            type: "update",
            selector: "#alert .wrapper .title",
            text: "Maximum Quantity!"
          },
          {
            type: "update",
            selector: "#alert .wrapper .body",
            text: "Maximum Quantity has reached, cannot add more quantity for this item!"
          }
        ];
        manageModal(true, alert_obj);
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
    let inputTag = $(this).parent().children('input');
    let inputVal = parseInt(inputTag.val());
    if(inputVal < inputTag.attr('max')){
      inputTag.val(inputVal + 1);
      initUpdateCart(this, false);
    }else{
      inputTag.val(inputTag.attr('max'));
      initUpdateCart(this, false);
      let alert_obj = [
        {
          type: "update",
          selector: "#alert .wrapper .title",
          text: "Maximum Quantity!"
        },
        {
          type: "update",
          selector: "#alert .wrapper .body",
          text: "Maximum Quantity has reached, cannot add more quantity for this item!"
        }
      ];
      manageModal(true, alert_obj);
    }
    return false;
  });

  $('.footer .post-initial #remove').click(function(){
    let inputTag = $(this).parent().children('input');
    let inputVal = parseInt(inputTag.val());
    if(inputVal > inputTag.attr('min')){
      inputTag.val(inputVal - 1);
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

  $('.add-container .initial').click(function(){
    let add_container = $(this).parent();
    let initial_container = add_container.children('.initial');
    let post_initial_container = add_container.children('.post-initial');

    initial_container.addClass('d-none');
    post_initial_container.removeClass('d-none');
    
    post_initial_container.children('input[name=itemCount]').val(1);
    initUpdateCart(this, true);
  });

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
    initPreview(this);
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

  $('.login-conatiner').click(function(e){
    if($(e.target).hasClass("login-conatiner")){
      $('.login-conatiner')
      .removeClass('animate-open-top')
      .addClass('animate-close-top');
      setTimeout(function(){
        $('.login-conatiner')
          .addClass('d-none')
          .removeClass('animate-close-top');
      }, 800);
    }
  });
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
function generateOrderSummaryText(name, mobile_number, address){
  let text = "";

  text += "Name:\n" + name + "\n";
  text += "\nMobile Number:\n" + mobile_number + "\n";
  text += "\nAddress:\n" + address + "\n\n";
  text += "Orders: \n";
  let slno = 1;
  cart_obj.forEach(obj => {
    //1. Khara(KHARA)(1x200) = 200
    text += "\n";
    text += slno + ". " + obj.name + "(" + obj.item_code + ")" + "(" + obj.quantity + "x" + obj.cost + ")\t = " + obj.total_cost;
    text += "\n";
    slno++;
  });

  text += "----------------------------";
  text += "\nSub Total\t = " + $('.footer-element #sub_total').text(); 
  text += "\nGST(0% GST)\t = " + $('.footer-element #gst').text();
  text += "\nTotal\t = " + $('.footer-element #total').text();
  return text;
}

function manageModal(shouldVisible, arrayOfObj, orderArrayOfObj){
  if(arrayOfObj !== undefined){
    $('#order-confirmation').addClass('d-none');
    $('#alert').removeClass('d-none');

    arrayOfObj.forEach(obj => {
      if(obj.type == "update"){
        if(obj.text){
          $(obj.selector).text(obj.text)
        }
        if(obj.val){
          $(obj.selector).val(obj.val)
        }
        if(obj.html){
          $(obj.selector).html(obj.html)
        }
        obj.shouldVisible || obj.shouldVisible === undefined ? 
          $(obj.selector).show() : 
          $(obj.selector).hide() ;
      }else if(obj.type == "remove"){
        $(obj.selector).remove();
      }else if(obj.type == "append"){
        $(obj.selector).append(obj.data);
      }
    });
  }

  if(orderArrayOfObj !== undefined){
    //order summary
    $('#alert').addClass('d-none');
    $('#order-confirmation').removeClass('d-none');

    $('table#order-summary tbody').empty();
    let slno = 1;
    let sub_total = 0;
    orderArrayOfObj.forEach(obj => {
      $('table#order-summary tbody').append(
        '<tr>'
        +'<td>'+ slno +'</td>'
        +'<td>'+ obj.name +'('+ obj.item_code +')</td>'
        +'<td>'+ obj.quantity +'</td>'
        +'<td>'+ obj.cost +'</td>'
        +'<td class="right-align bold">'+ obj.total_cost +'</td>'
        +'</tr>'
      );
      slno++;
      sub_total += obj.total_cost;
    });
    
    let total = sub_total; //(sub_total * 1.18);
    let gst = 0; //total - sub_total;

    $('.footer-element #sub_total').text(sub_total.toFixed(2));
    $('.footer-element #gst').text(gst.toFixed(2));
    $('.footer-element #total').text(total.toFixed(2));
  }

  if(shouldVisible){
    $('.modal-wrapper')
      .removeClass('animate-close-top')
      .addClass('animate-open-top');
    $('.modal').removeClass('d-none');
  }else{
    $('.modal-wrapper')
      .removeClass('animate-open-top')
      .addClass('animate-close-top');
    setTimeout(function(){
      $('.modal').addClass('d-none');
    }, 800);
  }
}

function updateCatalogueVisibility(onlyShowCart){
  if(onlyShowCart){
    $('.catalogue-item:not(.in-cart)').addClass('d-none');
  }else{
    $('.catalogue-item.d-none').removeClass('d-none');
  }
}

function initUpdateCart(this_, isIntital){
  let catalogue_item = $(this_).parent().parent().parent();

  if(!isIntital){
    catalogue_item = $(this_).parent().parent().parent().parent();
  }

  let name = $(catalogue_item).find(".name").text();
  let item_code = $(catalogue_item).find(".code #item_code").text();
  let cost = $(catalogue_item).find(".footer .price #cost").text();
  let item_count = $(catalogue_item).find(".footer .add-container .post-initial input").val();
  
  if(isIntital === undefined){
    //have to remove item from cart
    if(removeFromCart(item_code)){
      $(catalogue_item).removeClass("in-cart");
      if($('.categories #cart').is(".active")){
        $(catalogue_item).addClass("d-none");
      }
      refreshUICart();
    }else{
      let alert_obj = [
        {
          type: "update",
          selector: "#alert .wrapper .title",
          text: "Error removing item!"
        },
        {
          type: "update",
          selector: "#alert .wrapper .body",
          text: "Unable to remove item, please contact administrator!"
        }
      ];
      manageModal(true, alert_obj);
    }
  }else if(isIntital){
    if(addToCart(name, item_code, cost)){
      $(catalogue_item).addClass("in-cart");
      refreshUICart();
    }else{
      let alert_obj = [
        {
          type: "update",
          selector: "#alert .wrapper .title",
          text: "Error updating cart!"
        },
        {
          type: "update",
          selector: "#alert .wrapper .body",
          text: "Unable to add item to cart, please contact administrator!"
        }
      ];
      manageModal(true, alert_obj);
    }
  }else{
    if(updateCart(item_code, cost, item_count)){
      refreshUICart();
    }else{
      let alert_obj = [
        {
          type: "update",
          selector: "#alert .wrapper .title",
          text: "Error updating cart!"
        },
        {
          type: "update",
          selector: "#alert .wrapper .body",
          text: "Unable to update cart, please contact administrator!"
        }
      ];
      manageModal(true, alert_obj);
    }
  }
}


/*Currently this doesn't have any usage */
/*
function addToCartFromObj(item_code, quantity){
  //data-item-code={{item_code}}
  //add above attribute when working on `previous-cart`

  let catalogue_item = $('.catalogue-item[data-item-code="'+ item_code +'"');
  if(catalogue_item !== undefined && catalogue_item.length){
    console.log("catalogue_item", catalogue_item);
    if(catalogue_item.children('.footer .add-container:not(.no-stock)')){
      let item_quantity_input = catalogue_item.find('.footer .add-container .post-initial input');
      console.log(item_quantity_input);
      item_quantity_input.val(quantity);
      item_quantity_input.trigger("input");
      console.log(item_quantity_input.val());
    }
  } 
}
*/

function addToCart(name, item_code, cost){
  return cart_obj.push(
    {
      "name": name,
      "item_code": item_code,
      "cost": parseFloat(cost),
      "quantity": 1,
      "total_cost": parseFloat(cost)
    }
  );
}

function removeFromCart(item_code){
  const findIndex = cart_obj.findIndex(a => a.item_code === item_code);
  if(findIndex != -1){
    return cart_obj.splice(findIndex, 1);
  }
  return false;
}

function updateCart(item_code, cost, quantity){
  quantity = parseInt(quantity);
  cost = parseFloat(cost);
  
  let found_obj = cart_obj.find((obj, iter) => {
    if (obj.item_code == item_code) {      
      obj.cost = cost;
      obj.quantity = quantity;
      obj.total_cost = (cost * quantity);
      
      //cart_obj[iter] = {};
      return true;
    }
  });
  return found_obj;
}

function refreshUICart(){
  let total_items = cart_obj.reduce((n, {quantity}) => n + quantity, 0);
  let gross_total = cart_obj.reduce((n, {total_cost}) => n + total_cost, 0);

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

function managePreloader(shouldShow){
	if(shouldShow){
		$('.preloader').show();
	}else{
		$('.preloader').hide();
	}
}

/*Begin: Preloader Init */
var tl = new TimelineMax({
  repeat: -1
});

tl.add(
  TweenMax.from(".logo-svg", 2, {
    scale: 0.5,
    rotation: 360,
    ease: Elastic.easeInOut
  })
);

tl.add(
  TweenMax.to(".logo-svg", 2, {
    scale: 0.5,
    rotation: 360,
    ease: Elastic.easeInOut
  })
);
/*End: Preloader Init */

/*Begin: Login Form Methods*/
function updateLoadingState(status){
  let login_btn = $('#login_btn');
  if(status){
    login_btn.addClass('loading');
  }else{
    login_btn.removeClass('loading');
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
  let img_selector = $(selector).children();
  let preview_1_src = img_selector.attr("preview-1-src");
  let preview_2_src = img_selector.attr("preview-2-src");
  let preview_3_src = img_selector.attr("preview-3-src");

  let preview_main_img = $('#previewMainImg');
  let preview_side_imgs = $('#previewSideImgs');  

  preview_main_img.empty();
  preview_side_imgs.empty();
  if(preview_1_src != undefined){
    preview_main_img.append('<img class="lazyPreview no-preloader" data-src="'+ preview_1_src +'" src="imgs/loading.svg" alt="">');
    preview_side_imgs.append('<img class="lazyPreview active" src="'+ preview_1_src +'" width="100" height="100">')
  }

  if(preview_2_src != undefined){
    preview_side_imgs.append('<img class="lazyPreview" data-src="'+ preview_2_src +'" width="100" height="100">')
  }

  if(preview_3_src != undefined){
    preview_side_imgs.append('<img class="lazyPreview" data-src="'+ preview_3_src +'" width="100" height="100">')
  }

  $(".image-preview-container").removeClass("d-none");
  $("#imgPreviewWrapper").addClass("animate-zoom-in");
  $('.lazyPreview').Lazy();
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

function ajaxPostCall(param1, param2, callback){
  let url = (typeof param1 == "object") ? $(param1).prop('action') : param1;
  
  let jqxhr = $.post(url, param2)
      jqxhr.done(callback)
      jqxhr.fail(callback);
}