let ALL_ENV;
let SERVER_MODE;
let SERVER_MODE_VARIABLES;
let API_ENDPOINT;
let LIB_API_ENDPOINT;

$(function(){
    console.log(`hello`);

    InitVariables();

    if(LIB_API_ENDPOINT){
        if(typeof loginPage === "undefined"){
            preloader("Validating Authentication");
            /* Begin: Check User */
            if(isUserValid()){
                let user = getCurrentUser();
                $(".profile .name").text(user.username);

                preloader("Preparing the Page");
                /* Begin: Initializes Navigation Items & Scroll Bar */
                initNavigation();
                const demo = document.querySelector('nav');
                if(demo){
                    const ps = new PerfectScrollbar(demo);
                    ps.update();
                }
                /* End: Initializes Navigation Items & Scroll Bar */
                //preloader will be hidden inside `activateCurrentNavItem()`

                //Initialize dropdown
                $('select').dropdown();
            }else{
                //show modal then on button click let signout
                clearCurrentUser();
                smallModal(
                "Invalid Login Detected", 
                "Relogin because invalid login detected!", 
                    [
                        {
                            "class": "ui positive approve button",
                            "id": "",
                            "text": "Relogin",
                        }
                    ], 
                    {
                        closable: false,
                        onApprove: function(){
                            window.location.replace("login.html");
                            return false;
                        }
                    }
                );
            }
            /* End: Check User */
        }else{
            //it will fall in this block if login page
            clearCurrentUser();
        }
    }else{
        smallModal(
            "Empty LIB_API_ENDPOINT", 
            "LIB_API_ENDPOINT failed to load", 
            [
                {
                    "class": "ui positive approve button",
                    "id": "",
                    "text": "Relogin",
                }
            ], 
            {
                closable: false,
                onApprove: function(){
                    window.location.replace("login.html");
                    return false;
                }
            }
        );
    }
});

/*BEGIN: CODE CAN BE USED IN FUTURE IMPLEMENTATIONS */
async function asyncInitEnv(){
    try{
        const response = await fetch('../variables.json');
        const ALL_ENV = await response.json();
        
        SERVER_MODE = ALL_ENV.SERVER_MODE;
        SERVER_MODE_VARIABLES = ALL_ENV[SERVER_MODE];
        API_ENDPOINT = get_variable(SERVER_MODE_VARIABLES, SERVER_MODE_VARIABLES.API_ENDPOINT);
        LIB_API_ENDPOINT = get_variable(SERVER_MODE_VARIABLES, SERVER_MODE_VARIABLES.LIB_API_ENDPOINT);
    }catch(error){
        console.error('initEnv: Error:', error);
        smallModal(
        "Error Loading ENV", 
        error, 
            [
                {
                    "class": "ui positive approve button",
                    "id": "",
                    "text": "Try Again",
                }
            ], 
            {
                closable: false,
                onApprove: function(){
                    window.location.replace(getCurrentPage());
                    return false;
                }
            }
        );
    }
}

const asyncWait = ms => new Promise(resolve => setTimeout(resolve, ms));

async function asyncWaitForVariables(howManyMilliSeconds, howManyTimes){
    console.log("waitForVariables");
    for(let i=0; i<howManyTimes; i++){
        console.log(i);
        if(LIB_API_ENDPOINT) return true;
        
        await asyncWait(howManyMilliSeconds);
        if(LIB_API_ENDPOINT) return true;
    }

    return false;
}

function syncInitEnv(){
    fetch('../variables.json')
    .then(response => response.json())
    .then(ALL_ENV => {
        SERVER_MODE = ALL_ENV.SERVER_MODE;
        SERVER_MODE_VARIABLES = ALL_ENV[SERVER_MODE];
        API_ENDPOINT = get_variable(SERVER_MODE_VARIABLES, SERVER_MODE_VARIABLES.API_ENDPOINT);
        LIB_API_ENDPOINT = get_variable(SERVER_MODE_VARIABLES, SERVER_MODE_VARIABLES.LIB_API_ENDPOINT);
        console.log('variables has been set');
    })
    .catch(error => {
        console.error('Error loading JSON file:', error);
        smallModal(
            "Error Loading ENV", 
            error, 
            [
                {
                    "class": "ui positive approve button",
                    "id": "",
                    "text": "Try Again",
                }
            ], 
            {
                closable: false,
                onApprove: function(){
                    window.location.replace(getCurrentPage());
                    return false;
                }
            }
        );
    });
}

const syncWait = ms => {
    const end = Date.now() + ms
    while (Date.now() < end) continue
}

function syncWaitForVariables(howManyMilliSeconds, howManyTimes){
    console.log("syncWaitForVariables");
    for(let i=0; i<howManyTimes; i++){
        console.log(i);
        if(LIB_API_ENDPOINT) break;
        
        syncWait(howManyMilliSeconds);
        if(LIB_API_ENDPOINT) break;
    }

    return false;
}
/*END: CODE CAN BE USED IN FUTURE IMPLEMENTATIONS */

function get_variable(_arr, _str){
    let currly_var_pattern = /(?<={)(\w+)(?=})/gm;
    let currly_variables = _str.match(currly_var_pattern);
    if(currly_variables){
        for(currly_variable of currly_variables){
            let currly_value = _arr[currly_variable];
            if(currly_value){
                _str = _str.replace('{'+currly_variable+'}', currly_value);
            }
        }
        if(_str.match(currly_var_pattern)){
            _str = get_variable(_arr, _str);
        }
    }
    return _str;
}

function InitVariables(){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '../variables.json', false);
    xhr.send();
    
    if(xhr.status === 200){
        ALL_ENV = JSON.parse(xhr.responseText);
        
        SERVER_MODE = ALL_ENV.SERVER_MODE;
        SERVER_MODE_VARIABLES = ALL_ENV[SERVER_MODE];
        API_ENDPOINT = get_variable(SERVER_MODE_VARIABLES, SERVER_MODE_VARIABLES.API_ENDPOINT);
        LIB_API_ENDPOINT = get_variable(SERVER_MODE_VARIABLES, SERVER_MODE_VARIABLES.LIB_API_ENDPOINT);
        
        console.log('variables has been set');
    }else{
        console.error('Error loading JSON file:', xhr.statusText);
        smallModal(
            "Error Loading ENV", 
            xhr.statusText, 
            [
                {
                    "class": "ui positive approve button",
                    "id": "",
                    "text": "Try Again",
                }
            ], 
            {
                closable: false,
                onApprove: function(){
                    window.location.replace(getCurrentPage());
                    return false;
                }
            }
        );
    }
}

function preloader(param){
    if(param){
        if(typeof param == "string") $("#preloader div #title").text(param);
        $("#preloader div").addClass("active");
        $("#preloader").show();
    }else{
        $("#preloader div").removeClass("active");
        $("#preloader").hide();
    }
}

function initNavigation(){
    let user = getCurrentUser();
    ajaxPostCall(`${LIB_API_ENDPOINT}/navigation.php`, {user_role: user.role}, function(response){
        let modalTitle;
        let modalContent;
        if(response.status){
            modalTitle = response.status;
            modalContent = response.statusText;
        }else if(response.title){
            modalTitle = response.title;
            modalContent = response.content;
        }else if(response.result){
            $("nav").html(drawNavigation(response.data));
            activateCurrentNavItem();
        }else{
            modalTitle = "Error loading the navigation";
            //modalContent = "Something went wrong on backend connection";
            modalContent = response.info;
        }

        if(modalTitle && modalContent){
            smallModal(
                modalTitle, 
                modalContent, 
                [
                    {
                        "class": "ui positive approve button",
                        "id": "",
                        "text": "Reload",
                    }
                ], 
                {
                    closable: false,
                    onApprove: function(){
                        window.location.replace(getCurrentPage());
                        return false;
                    }
                }
            );
        }
    })
}

let subMenuItemIdCounter = 0;
function drawNavigation(items, dom = ""){
    if(dom === undefined){ dom = ""; }

    items.forEach((element) =>{
        if(element.dropdown){
            let sub_menu = drawNavigation(element.dropdown);
            let id = "d" + subMenuItemIdCounter;
            dom += `<li class="has-sub-menu">
                <input type="checkbox" id="${id}" tabindex="0">
                <label for="${id}">
                    <i class="${element.icon}"></i>
                    <span class="text">${element.title}</span>
                </label>
                <ul class="sub-menu">${sub_menu}</ul>
            </li>`;
            subMenuItemIdCounter++;
        }else if(element.items){
            dom += `<li class="navigation-header">${element.header}</li>`
            dom += drawNavigation(element.items);
        }else{
            dom += 
            `
            <li>
                <a href="${element.link}" onclick="${element.onclick}">
                    <i class="${element.icon}"></i>
                    <span class="text">${element.title}</span>
                </a>
            </li>
            `;
        }
    })
    return dom;
}

function activateCurrentNavItem(){
    let breadCrumbArr = [];
    $("nav li").each(function(){
        let currentPage = getCurrentPage();
        if($(this).children("a").attr("href") == currentPage){
            $(this).addClass("active");
            breadCrumbArr.push($(this).children("a").children("span.text").text());

            let ancestors = $(this).parents();
            ancestors.each(function(){
                let tagName = this.nodeName.toLowerCase();
                if(tagName == "li"){
                    $(this).addClass("active");
                    breadCrumbArr.push($(this).children("label").children("span.text").text());
                    if($(this).prev().attr("class") == "navigation-header"){
                        breadCrumbArr.push($(this).prev().text());
                    }
                }
            })
            return false;
        }        
    });

    breadCrumbArr.push("Dashboard");
    generateBreadCrumb(breadCrumbArr);
    
    preloader();
}

function generateBreadCrumb(breadCrumbArr){
    breadCrumbArr.reverse().forEach((item)=>{
        $(".breadcrumb-container").append(`<li>${item}</li>`);
    })
}

function updateDialog(){
    smallModal(
        "Error",
        `The module contains error, please do recompile`,
        [
            {
                "class": "ui negative deny button",
                "id": "modalCloseBtn",
                "text": "Okay",
            }
        ], 
        {
            closable: false,
            onDeny: function(){
                $("#modalCloseBtn").addClass("loading");
                window.location.replace('index.html');
                return false;
            }
        }
    );
}

function smallModal(header, content, buttons, options){
    let main_container = $('.small.modal');
    let buttons_container = "";
    
    main_container.children(".header").html(header);
    main_container.children(".content").children("p").html(content);
    buttons.forEach(element => {
        if(element.node == "button"){
            buttons_container += `<button class="${element.class}" id="${element.id}">${element.text}</button>`;
        }else{
            buttons_container += `<div class="${element.class}" id="${element.id}">${element.text}</div>`;
        }
    });
    main_container.children(".actions").html(buttons_container);

    main_container.modal(options).modal('show');
}

function ajaxPostCall(param1, param2, callback){
    let url = (typeof param1 == "object") ? $(param1).prop('action') : param1;
    
    let jqxhr = $.post(url, param2)
        jqxhr.done(callback)
        jqxhr.fail(callback);
}

function getCurrentUser(){
    let user = {};
    Cookies.get('id') !== undefined ? user.id = Cookies.get('id') : null;
    Cookies.get('username') !== undefined ? user.username = Cookies.get('username') : null;
    Cookies.get('password') !== undefined ? user.password = Cookies.get('password') : null;
    Cookies.get('mobile_number') !== undefined ? user.mobile_number = Cookies.get('mobile_number') : null;
    Cookies.get('role') !== undefined ? user.role = Cookies.get('role') : null;

    return user;
}

function isUserValid(){
    return (Object.keys(getCurrentUser()).length == 5) ? true : false;
}

function clearCurrentUser(){
    Cookies.remove('id');
    Cookies.remove('username');
    Cookies.remove('password');
    Cookies.remove('mobile_number');
    Cookies.remove('role');
}

function getCurrentPage(){
    let url = window.location.href;
    let url_arr = url.split("/");
    url_arr = url_arr[url_arr.length - 1];
    url_arr = url_arr.split('?');
    return url_arr[0];
}

function printLabels(callback){
	console.log('printLabels');
	
	let generated_Barcodelist = $("#barcodes-list").html();

	let myFrame = $("#myframe");
	let myFrame_Barcodelist = myFrame.contents().find('.barcode_list');
	
	myFrame_Barcodelist.html(generated_Barcodelist);
	
	setTimeout(function(){
		document.getElementById('myframe').contentWindow.print();
        callback(true);
	}, 2000);
}

function invoicePrint(type, hideTracking, callback){
    let myFrame = $("#myframe")
    myFrame = myFrame.contents();

    if(type == "delivery_print"){
        let containers = myFrame.find(`
                            #company-address,
                            #footer,
                            #support-contact
                        `);
        containers.removeClass("d-none");

        myFrame.find(`#invoice-type`).addClass("d-none");
    }else if(type == "cancel_preview_print"){
        myFrame.find(`#invoice-type`).text('***CANCEL PREVIEW PRINT***');
    }

    if(hideTracking){
        myFrame.find(`#item-details`).addClass("hide-tracking");
    }

    myFrame.find(`#input_date`).text(input_date.val());
    myFrame.find(`#order_id`).text(input_order_id.val());
    myFrame.find(`#name`).text(input_name.val());
    myFrame.find(`#mobile_number`).text(input_mobile_number.val());
    myFrame.find(`#address`).text(input_address.val());

    let myFrame_itemsDetails = myFrame.contents().find('#item-details');
    let itemsDetails = $("#order-summary-after").parent().html();
    
    myFrame_itemsDetails.html(itemsDetails);

    setTimeout(function(){
        document.getElementById('myframe').contentWindow.print();
        callback(true);
    }, 2000);
}

function printInvoice(table_selector_, invoice_type_, response_data_, callback){
    console.log('printInvoice');
	
	let html_content = table_selector_.html();

	let myFrame = $("#myframe");
    let date = myFrame.contents().find('.date span');
    date.text($("#date").text());

    let invoice = myFrame.contents().find('.invoice span');
    invoice.text(response_data_.invoice_id);

    
    let sale_type = myFrame.contents().find('.sale-type span');
    sale_type.text(response_data_.fields_data ? response_data_.fields_data.sale_type : response_data_.sale_type);

    
    let invoice_type = myFrame.contents().find('.invoice-type span');
    invoice_type.text(invoice_type_);
    
    let invoiced_to_details = myFrame.contents().find('.invoiced_to .details');

    let invoice_details = `
    Seller Name: ${response_data_.fields_data ? response_data_.fields_data.seller_name : response_data_.seller_name}
    </br>Seller Id: ${response_data_.fields_data ? response_data_.fields_data.seller_id : response_data_.seller_id}
    `
    if(response_data_.fields_data || response_data_.custom_id){
        invoice_details += `</br>Custom Seller Id: ${response_data_.fields_data ? response_data_.fields_data.custom_id : response_data_.custom_id}`
    }
    
    if(response_data_.fields_data || response_data_.custom_name){
        invoice_details += `</br>Custom Seller Name: ${response_data_.fields_data ? response_data_.fields_data.custom_name : response_data_.custom_name}`
    }

    invoice_details += `
    </br>Customer Name: ${response_data_.fields_data ? response_data_.fields_data.customer_name : response_data_.customer_name}
    </br>Customer Village: ${response_data_.fields_data ? response_data_.fields_data.customer_village : response_data_.customer_village}
    </br>Customer Details: ${response_data_.fields_data ? response_data_.fields_data.customer_details : response_data_.customer_details}
    `

    invoiced_to_details.html(invoice_details)

    
	let data = myFrame.contents().find('#data');
	data.html(html_content);
	
	setTimeout(function(){
		document.getElementById('myframe').contentWindow.print();
        callback(true);
	}, 2000);
}

//disables mouse wheel on number input element
document.addEventListener("wheel", function(event){
    if(document.activeElement.type === "number"){
        document.activeElement.blur();
    }
});

//allow only number input on number input element
$(document).on('keypress', 'input[type=number]:not(.allow_decimal)', enterNumbers);

function enterNumbers(event){
  if((event.code == 'ArrowLeft') || (event.code == 'ArrowRight') ||
     (event.code == 'ArrowUp') || (event.code == 'ArrowDown') || 
     (event.code == 'Delete') || (event.code == 'Backspace')){
     return;
  }else if(event.key.search(/\d/) == -1){
    event.preventDefault();
  }
}

//allow deccimal number input on number input element
$(document).on('keydown', 'input.allow_decimal', allowDecimalValue);

function allowDecimalValue(){
    var input = $(this);
    var oldVal = input.val();
    var regex = new RegExp(input.attr('pattern'), 'g');

    setTimeout(function(){
        var newVal = input.val();
        if(!regex.test(newVal)){
            input.val(oldVal); 
        }
    }, 1);
}

function updateSumOnFooter(api, column_index, is_decimal = true, prefix = "₹"){
    let total_sum = 0;
    if(api.column(column_index, { search:'applied' }).data().length){
        total_sum = api
           .column(column_index, { search:'applied' } )
           .data()
           .reduce(function(a, b){
                if(is_decimal){
                    return get_decimal(get_decimal(a) + get_decimal(b));
                }else{
                    return parseInt(a) + parseInt(b);
                }
           });
    }
    $(api.column(column_index).footer()).html(`${prefix} ${total_sum}`);
    $(api.column(column_index).footer()).attr('data-value', total_sum);
}

function get_decimal(_val){
    if(typeof _val != "number") _val = parseFloat(_val);
    return parseFloat(_val.toFixed(2));
}

function getDate(format = "y-m-d", when = "today"){
    var date = new Date();

    if(when == "yesterday"){
        date.setDate(date.getDate() - 1);
    }else if(typeof when == "number"){
        date.setDate(date.getDate() + when);
    }

    var year = date.getFullYear();
    var month = (1 + date.getMonth()).toString().padStart(2, '0');
    var day = date.getDate().toString().padStart(2, '0');
    var hours = date.getHours().toString().padStart(2, '0');
    var minutes = date.getMinutes().toString().padStart(2, '0');
    var seconds = date.getSeconds().toString().padStart(2, '0');
  
    switch(format){
      case "y-m-d":
        return year + "-" + month + "-" + day;
      case "y-m-d t":
        return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
      case "d-m-y":
        return day + "-" + month + "-" + year;
      case "dm":
        return day + month;
      case "ymdt":
        return year + month + day + hours + minutes + seconds;
      case "d/m/y":
        return day + "/" + month + "/" + year;
      default:
        return "Invalid format";
    }
}

//for leading zeros
//(9).pad() //09
//(9).pad(3) //009
Number.prototype.pad = function(size) {
    var s = String(this);
    while (s.length < (size || 2)) {s = "0" + s;}
    return s;
}

$('.ui.modal .content').on('click', '.message .close', function() {
    console.log(`close fired`)
    $(this)
      .closest('.message')
      .transition('fade')
    ;
});

//websockets live reload
let liveurl = "ws://localhost:8080";
liveurl = "ws://192.168.225.110:8080"; //When on SK2FM Network
//liveurl = "ws://192.168.43.212:8080"; //When on Realme 6i Network
//liveurl = "ws://169.254.174.206:8080"; //When on Realme 6i Network
var exampleSocket = new WebSocket(liveurl)
exampleSocket.onmessage = function (event) {
    if(event.data != undefined){
        if(event.data == "Hello! Message From Server!!"){
            console.log('open connection')
        }else{
            console.log('received message')
			timestamp_param = `timestamp=${getDate("ymdt")}`;
            url = window.location.href;
			
			if(url.includes("?")){
				if(url.includes("timestamp=")){
					url = url.replaceAll(/[\d]{14}(?<!(timestamp=))/gm, getDate("ymdt"));
				}else{
					url += `&&${timestamp_param}`;
				}
			}else{
				url += `?${timestamp_param}`;
			}
			
            window.location.replace(url);
        }
    }else{
        console.log('undefined data')
    }
}