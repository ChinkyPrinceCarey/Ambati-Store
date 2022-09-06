var target = new EventTarget();
target.addListener("onApiReady", onPageReady);
target.addListener("onApiReady", onScriptReady);

function onScriptReady(){
  $('.menu-item').click(function(e){
    let item = $(this);
    if(!item.hasClass('active')){
      
      let menu = item.data('menu');
      let route = "";
      
      if(menu == "home"){
        route = "index.html";
      }else if(isUserLogged() && menu == "orders"){
        route = "orders.html"
      }else if(isUserLogged() && menu == "profile"){
        //route = "profile.html"
      }

      if(route){
        $('.menu-item.active').removeClass('active');
        item.addClass('active');

        window.location.href = route;
      }else if(!isUserLogged()){
        loginModal(true, `route_${menu}`);
      }
    }
  })
}

function isUserLogged(){
  return (
          (Cookies.get('username') !== undefined)
      &&  (Cookies.get('password') !== undefined)
  );
}

function getLogin(){
  if(isUserLogged()){
    let username = Cookies.get('username');
    let password = Cookies.get('password');

    ajaxPostCall('lib/customers.php', {action: "fetch_specified", data: {username: username, password: password}}, function(response){
      if(response.status){

      }else if(response.result){
        let user = response.data[0];
        Cookies.set('name', user.name, default_cookie_option);
        Cookies.set('mobile_number', user.mobile_number, default_cookie_option);
        Cookies.set('address', user.address, default_cookie_option);
      }else{
        Cookies.remove('username');
        Cookies.remove('password');
        Cookies.remove('name');
        Cookies.remove('mobile_number');
        Cookies.remove('address');
      }
    })
  }else{
    Cookies.remove('username');
    Cookies.remove('password');
    Cookies.remove('name');
    Cookies.remove('mobile_number');
    Cookies.remove('address');
  }
}

/**
 * @param1 
      * (boolean)
      * default: true
**/
function formLoader(){
  let should_loader = true;

  if(arguments.length){
    if(typeof arguments[0] == "boolean"){
      should_loader = arguments[0];
    }
  }

  if(should_loader){
    $("i.close-icon").addClass("disabled");
    $("#modal-order").addClass("loading");
    $(".element input, .element textarea, #modal-order, #modal-close").attr('disabled', true);
  }else{
    $("i.close-icon").removeClass("disabled");
    $("#modal-order").removeClass("loading");
    $(".element input, .element textarea, #modal-order, #modal-close").attr('disabled', false);
  }
}

/**
 * @param1 
      * (boolean)modal-visibility
**/
function initModal(){
  let should_modal_show = true;

  if(arguments.length){
    if(typeof arguments[0] == "boolean"){
      should_modal_show = arguments[0];
    }
  }

  if(should_modal_show){
    $('body').addClass('overflow-hidden');
    //$('#content-rendered').addClass('blur-4px');
  }else{
    if(
          !orderModal("is_visible")
      &&  !basicModal("is_visible")
    ){
      $('body').removeClass('overflow-hidden');
      //$('#content-rendered').removeClass('blur-4px');
    }
  }
}

/**
 * @param1 
      * (boolean)modal-visibility
      ** (string)== "is_visible" ==> returns (boolean);
      ** (string)modal-title
      ** (default)true

  * @param2 
       (string)modal-body
**/ 
function basicModal(){
  let should_modal_show = true;

  let modal = $('.modal#basic-alert');
  let modal_wrapper = modal.children('.wrapper');

  let modal_title = "";
  let modal_body = "";

  if(arguments.length){
    if(typeof arguments[0] == "boolean"){
      should_modal_show = arguments[0];
    }else if(arguments[0] == "is_visible"){
      return !modal.hasClass("d-none");
    }else{
      modal_title = arguments[0];
    }

    if(arguments[1] != undefined){
      modal_body = arguments[1];
    }
  }

  modal_wrapper.children('.title').text(modal_title);
  modal_wrapper.children('.body').html(modal_body);

  if(should_modal_show){
    modal_wrapper
      .removeClass('animate-close-top')
      .addClass('animate-open-top')
    ;

    modal.removeClass('d-none');

    initModal();
  }else{
    modal_wrapper
      .removeClass('animate-open-top')
      .addClass('animate-close-top')
    ;

    setTimeout(function(){
      modal.addClass('d-none');
      initModal(false);
    }, 800);
  }
}

/**
 * @param1 
      * (boolean)modal-visibility  
      ** (string)== "is_visible" ==> returns (boolean);  
      ** (default)true
**/
function orderModal(){
  let should_modal_show = true;
  
  let modal = $('.modal#order-preview');
  let modal_wrapper = modal.children('.wrapper');

  let table = modal_wrapper.find('table');
  let tbody = table.children('tbody');
  let tfoot = table.children('tfoot');
  
  if(arguments.length){
    if(typeof arguments[0] == "boolean"){
      should_modal_show = arguments[0];
    }else if(arguments[0] == "is_visible"){
      return !modal.hasClass("d-none");
    }
  }

  if(should_modal_show){
    /*BEGIN: table operation */
      tbody.empty();

      let slno = 1;
      cart_obj.forEach(obj => {
        tbody.append(
          '<tr>'
          +'<td><i class="fa fa-times delete-item" aria-hidden="true" data-shortcode="'+ obj.shortcode +'"></i></td>'
          +'<td>'+ slno +'</td>'
          +'<td>'+ obj.item +'('+ obj.shortcode +')</td>'
          +'<td>'+ obj.quantity +'</td>'
          +'<td>'+ obj.unit_price +'</td>'
          +'<td class="right-align bold total-price">'+ obj.total_price +'</td>'
          +'</tr>'
        );

        slno++;
      });

      let sub_total = parseFloat(get_gross_total().toFixed(2));
      let gst = parseFloat((0).toFixed(2));
      let total = sub_total + gst;

      tfoot.find('#sub_total').text(sub_total);
      tfoot.find('#gst').text(gst);
      tfoot.find('#total').text(total);
    /*END: table operation */

    if(!basicModal("is_visible")){
      modal_wrapper
        .removeClass('animate-close-top')
        .addClass('animate-open-top')
      ;

      modal.removeClass('d-none');
      initModal();
    }else{
      console.log('basic modal is already showing; cannot show order modal');
    }
  }else{
    modal_wrapper
      .removeClass('animate-open-top')
      .addClass('animate-close-top')
    ;
  
    setTimeout(function(){
      modal.addClass('d-none');
      initModal(false);
    }, 800);
  }
}


/**
 * @param1 
      * (boolean)modal-visibility
      ** (string)== "is_visible" ==> returns (boolean);
      ** (string)== "post_login" ==> returns (string);
      ** (default)true
    @param2
      * (string)post-login
      *(optional)
**/ 
function loginModal(){
  let should_modal_show = true;
  let post_login = "";

  let modal = $(".login-container");

  if(arguments.length){
    if(typeof arguments[0] == "boolean"){
      should_modal_show = arguments[0];
    }else if(arguments[0] == "is_visible"){
      return !modal.hasClass("d-none");
    }else if(arguments[0] == "post_login"){
      return modal.data("post_login");
    }

    if(arguments[1] != undefined){
      post_login = arguments[1];
    }
  }

  if(should_modal_show){
    modal
      .addClass("animate-open-top")
      .removeClass("d-none")
      .data('post_login', post_login)
    ;
    
    $('body').addClass('overflow-hidden');
  }else{
    modal
      .removeClass('animate-open-top')
      .addClass('animate-close-top')
      .data('post_login', '')
    ;
    
    $('body').removeClass('overflow-hidden');
    
    setTimeout(function(){
      modal
        .removeClass('animate-close-top')
        .addClass('d-none')
      ;
    }, 800);
  }
}

function postLogin(post_login){
  if(post_login == "order_modal"){
    orderModal();
  }else if(post_login == "route_orders"){
    $('.menu-item[data-menu="orders"]').click();
  }else if(post_login == "route_profile"){
    $('.menu-item[data-menu="profile"]').click();
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

function ajaxPostCall(param1, param2, callback){
  let url = (typeof param1 == "object") ? $(param1).prop('action') : param1;
  
  let jqxhr = $.post(url, param2)
      jqxhr.done(callback)
      jqxhr.fail(callback);
}