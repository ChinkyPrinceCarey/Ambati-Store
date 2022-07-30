let BASE_API = "http://localhost/ambati_sms/v2";

$(function(){
    console.log(`hello`)
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
})

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
    ajaxPostCall("lib/navigation.php", {user_role: user.role}, function(response){
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
$(document).on('keypress', 'input[type=number]', enterNumbers);

function enterNumbers(event){
  if((event.code == 'ArrowLeft') || (event.code == 'ArrowRight') ||
     (event.code == 'ArrowUp') || (event.code == 'ArrowDown') || 
     (event.code == 'Delete') || (event.code == 'Backspace')){
     return;
  }else if(event.key.search(/\d/) == -1){
    event.preventDefault();
  }
}

function toIsoString(date) {
    var tzo = -date.getTimezoneOffset(),
        dif = tzo >= 0 ? '+' : '-',
        pad = function(num) {
            var norm = Math.floor(Math.abs(num));
            return (norm < 10 ? '0' : '') + norm;
        };
  
    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds()) +
        dif + pad(tzo / 60) +
        ':' + pad(tzo % 60);
  }
  

function getCurrentDate(format="ymd"){
	var dt = new Date();
	
    let date = toIsoString(dt).slice(0, 10);
    let dateArr = date.split('-');

    if(format == "ymd"){
        return date;
    }else if(format == "dmy"){
        return `${dateArr[2]}-${dateArr[1]}-${dateArr[0]}`;
    }else if(format == "dm"){
		return `${dateArr[2]}${dateArr[1]}`;
	}else if(format == "dmt"){
		return toIsoString(dt).slice(0, 19).replace(/[-T:]/gm, '');
	}else if(format == "d/m/y"){
        return `${dateArr[2]}/${dateArr[1]}/${dateArr[0]}`;
    }

    return date;
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
			timestamp_param = `timestamp=${getCurrentDate('dmt')}`;
            url = window.location.href;
			
			if(url.includes("?")){
				if(url.includes("timestamp=")){
					url = url.replaceAll(/[\d]{14}(?<!(timestamp=))/gm, getCurrentDate('dmt'));
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