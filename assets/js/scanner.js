let success_notification;
let success_notification_src
let error_notification;

let scanner_form;

let scanner_btn;
let barcode_input;

let scanner_data;

let scanner_state = {
    isEnabled: false,
    reason: 'Page just loaded, save the details to scan items',
    default_error_suffix: "</br>adding/removing items disabled</br>Kindly perform sale ASAP"
}

Object.defineProperty(scanner_state, "isEnabled", {
    get: function () {
        return this._isEnabled;
    },
    set: function (val) {
        this._isEnabled = val;
        updateScannerFormUI();
    }
});

function updateScannerFormUI(){
    if(scanner_state.isEnabled){
        scanner_form.removeClass("disabled");
        scanner_btn.removeClass("disabled");
    }else{
        scanner_form.addClass("disabled");
        scanner_btn.addClass("disabled");
    }
}

let stock_obj_methods;
let sale_obj_methods;

let billing_template_obj = {
    making_cost: 0,
    sub_total: 0,
    tax: 0,
    total: 0,
    offer_percentage: 0,
    offer_amount: 0
};

$(function(){

    stock_obj_methods = {
        update_data: function(_action, _barcode){
            if(scanner_state.isEnabled){
                if(_action == "add"){
                    let sale_item = this.sale_obj.update_data('remove', _barcode);
                    if(sale_item) this.data.push(sale_item);
                    this.update_data_table(_action, sale_item); //ignores if no table is present
                    this.update_summary(_action, sale_item); //ignores if summary object is null
                    this.update_billing(_action, sale_item); //ignores if summary object is null

                    return sale_item;
                }else if(_action == "remove"){
                    let stock_item = this.data.find(item => item.barcode == _barcode);
                    if(stock_item){
                        let removed_data = this.data.filter(item => item.barcode != _barcode);
                        if((this.data.length == (removed_data.length + 1))){
                            sale_item = stock_item;

                            if(!("unit_price" in sale_item) && !(typeof selected_sale_type == "undefined")){
                                sale_item.unit_price =  selected_sale_type == "wholesale" ? 
                                                        sale_item.wholesale_cost : sale_item.retailer_cost;
                            }
    
                            this.data.length = 0;
                            this.data.push.apply(this.data, removed_data);
                                                    
                            this.sale_obj.update_data("add", sale_item);
    
                            this.update_data_table(_action, sale_item); //ignores if no table is present
                            this.update_summary(_action, sale_item); //ignores if summary object is null
                            this.update_billing(_action, sale_item); //ignores if summary object is null
                            
                            barcode_input.val('');

                            if(scanner_state.isEnabled){
                                play_success_notification();
                            }else{
                                play_error_notification();
                            }

                            return sale_item;
                        }else{
                            scanner_state.isEnabled = false;
                            scanner_state.reason = 'Error at updateList(..): Stock Data and Sale Data are not matching';
                        }
                    }else{
                        play_error_notification();
    
                        smallModal(
                            "Item not available!", 
                            `The barcode: <b>${_barcode}</b> is not exist </br> Check if it has been added already or not exist at all!`, 
                            [
                                {
                                    "class": "ui violet button",
                                    "id": "checkItemExistBtn",
                                    "text": "Check",
                                },
                                {
                                    "class": "ui positive approve button",
                                    "id": "",
                                    "text": "Okay",
                                }
                            ], 
                            {
                                closable: false,
                                onApprove: function(){
                                    barcode_input.val('');
                                    barcode_input.focus();
                                    $(".ui.modal .content .message").remove();
                                    return true;
                                }
                            }
                        );
                    }
                }
            }
        },
        update_data_table: update_data_table,
        update_summary: update_summary,
        update_billing: update_billing,
        isItemExist: isItemExist
    }

    sale_obj_methods = {
        update_data: function(_action, _param, _show_trash_row = true){
            //_param
            //1. item [or]
            //2. barcode
            if(scanner_state.isEnabled){
                if(_action == "add"){
                    this.data.push(_param);
                    this.update_data_table(_action, _param, _show_trash_row); //@param == item
                    this.update_summary(_action, _param); //ignores if summary object is null
                    this.update_billing(_action, _param)
                }else if(_action == "remove"){
                    barcode = _param;
                    
                    if(typeof _param == "object") barcode = _param.barcode;
                    
                    let sale_item = this.data.find(item => item.barcode == barcode);
                    if(sale_item){
                        let removed_data = this.data.filter(item => item.barcode != barcode);
                        if(this.data.length == (removed_data.length + 1)){
                            this.data.length = 0;
                            this.data.push.apply(this.data, removed_data);
                            
                            this.update_data_table(_action, sale_item); //@param == barcode
                            this.update_summary(_action, sale_item); //ignores if summary object is null
                            this.update_billing(_action, sale_item);
                            
                            return sale_item;
                        }else{
                            scanner_state.isEnabled = false;
                            scanner_state.reason = 'Error at updateList(..): Remove Item: Sale Data and Removing Item Data are not matching';
                        }
                    }else{
                        scanner_state.isEnabled = false;
                        scanner_state.reason = `Error at updateList(..): Remove Item: Unable to find item with barcode: <b>${barcode}</b> in the sale list`;
                    }
                }
            }
        },
        update_data_table: update_data_table,
        update_summary: update_summary,
        update_billing: update_billing,
        isItemExist: isItemExist
    }

    success_notification = $("#success_notification")[0];
    success_notification_src = $(success_notification).attr('src');
    error_notification = $("#error_notification")[0];

    scanner_form = $("#scanner_form");
    scanner_btn = $("#scanner_btn");
    barcode_input = $("#barcode_input");

    scanner_state.isEnabled = false; //just to trigger the updateScannerFormUI()

    scanner_form
    .form({
		onSuccess: function(event, fields){
            event.preventDefault();
            if(scanner_form.hasClass("disabled")){
                play_error_notification();

                //"It seems you're not saved details, save details then proceed with adding items..."

                smallModal(
                    "Scanning Items Disabled", 
                    scanner_state.reason,
                    [
                        {
                            "class": "ui positive approve button",
                            "id": "",
                            "text": "Okay",
                        }
                    ], 
                    {
                        closable: false,
                        onApprove: function(){
                            barcode_input.val('');
                            return true;
                        }
                    }
                );

            }else{
                if(barcode_input.val()){
                    if(barcode_input.val().length < 25){
                        scanner_data.method("remove", barcode_input.val());
                    }else{
                        //bulk items are inputed
                        scan_items_bulk();
                    }
                }else{
                    smallModal(
                        "Something went wrong!", 
                        "Empty Barcode Input", 
                        [
                            {
                                "class": "ui positive approve button",
                                "id": "",
                                "text": "Okay",
                            }
                        ], 
                        {
                            closable: false,
                            onApprove: function(){
                                barcode_input.val('');
                                return true;
                            }
                        }
                    );
                }
            }
        }
    });
});

function update_data_table(_action, _item, _show_trash_row = false){
    if(!(this.data_table === false)){
        if(scanner_state.isEnabled){
            let table_body = this.data_table.children('tbody');

            if(_action == "add"){
                let table_trash_row = _show_trash_row ? `<i class="large trash icon remove-item"></i>` : '';
                table_body.prepend(`
                    <tr data-barcode="${_item.barcode}">
                        <td class="collapsing"></td>
                        <td>${_item.item}[${_item.shortcode}]</td>
                        <td>${_item.barcode}</td>
                        <td class="right aligned collapsing">${_item.unit_price}</td>
                        <td class="right aligned collapsing">${table_trash_row}</td>
                    </tr>
                `);
    
                table_body.parent().css("counter-reset", `DescendingSerial ${this.data.length+1}`);
            }else if(_action == "remove"){
                let table_item_row = table_body.children(`tr[data-barcode=${_item.barcode}]`);
                if(table_item_row.length){
                    table_item_row.remove();
                    table_body.parent().css("counter-reset", `DescendingSerial ${this.data.length+1}`);
                }else{
                    scanner_state.isEnabled = false;
                    scanner_state.reason = 'Error at updateList(..): Unable to find current item row in Sale List Table';
                }
            }
        }
    }
}

function update_summary(_action, _item){
    if(!(this.summary === false)){
        if(typeof this.summary != "object") this.summary = [];
        if(scanner_state.isEnabled){
            let table_body = this.summary_table.children('tbody');
            if(_action == "add"){
                let item_index = this.summary.findIndex(item => (item.shortcode == _item.shortcode) && (item.unit_price == _item.unit_price));
    
                if(item_index >= 0){
                    let item_table_row = table_body.children(`tr[data-item=${_item.shortcode}_${_item.unit_price}]`);
                    if(item_table_row){
    
                        let updated_quantity = parseInt(this.summary[item_index].quantity) + 1;
                        let updated_total_price = parseInt(this.summary[item_index].total_price) + parseInt(_item.unit_price);
    
                        this.summary[item_index].quantity = updated_quantity;
                        this.summary[item_index].total_price = updated_total_price;
            
                        item_table_row.children(".quantity").text(updated_quantity);
                        item_table_row.children(".total_price").text(updated_total_price);
            
                    }else{
                        scanner_state.isEnabled = false;
                        scanner_state.reason = 'Error at updateSummary(..): Unable to find current item row in Sale Summary Table';
                    }
            
                }else{
                    this.summary.push(
                        {
                            item: _item.item,
                            shortcode: _item.shortcode,
                            making_cost: parseInt(_item.making_cost),
                            unit_price: parseInt(_item.unit_price),
                            quantity: 1,
                            sold_quantity: 0,
                            total_price: parseInt(_item.unit_price)
                        }
                    );
            
                    table_body.append(`
                        <tr data-item="${_item.shortcode}_${_item.unit_price}">
                            <td class="slno collapsing"></td>
                            <td class="item_shortcode">${_item.item}[${_item.shortcode}]</td>
                            <td class="quantity right aligned collapsing">1</td>
                            <td class="unit_price right aligned collapsing">${_item.unit_price}</td>
                            <td class="total_price right aligned collapsing">${_item.unit_price}</td>
                        </tr>
                    `);
                }
            }else{
                /* --------------- ACTION_REMOVE --------------- */
                let item_index = this.summary.findIndex(item => (item.shortcode == _item.shortcode) && (item.unit_price == _item.unit_price));
    
                if(item_index >= 0){
                    let sale_summary_item_table_row = table_body.children(`tr[data-item=${_item.shortcode}_${_item.unit_price}]`);
                    if(sale_summary_item_table_row){
                        if(this.summary[item_index].quantity > 1){
                            this.summary[item_index].quantity = this.summary[item_index].quantity - 1;
                            this.summary[item_index].total_price = this.summary[item_index].total_price - _item.unit_price;
    
                            sale_summary_item_table_row.children(".quantity").text(this.summary[item_index].quantity);
                            sale_summary_item_table_row.children(".total_price").text(this.summary[item_index].total_price);
                        }else{
                            sale_summary_item_table_row.remove();
                            
                            let filtered_sale_summary = this.summary.filter(function(item, index) {
                                return index !== item_index
                            });
    
                            this.summary.length = 0;
                            this.summary.push.apply(this.summary, filtered_sale_summary);
                        }
                    }else{
                        scanner_state.isEnabled = false;
                        scanner_state.reason = 'Error at updateSummary(..): Unable to find current item row in Sale Summary Table';
                    }
                }else{
                    scanner_state.isEnabled = false;
                    scanner_state.reason = 'Error at updateSummary(..): Unable to find current item row in Sale Summary Data';
                }
            }
        }
    }
}

function update_billing(_action, _item){
    if(!(this.billing === false)){
        if(typeof this.billing != "object") this.billing = JSON.parse(JSON.stringify(billing_template_obj));;
        if(scanner_state.isEnabled){
            for(let prop in this.billing){
                if(typeof this.billing[prop] == "string"){
                    this.billing[prop] = parseFloat(this.billing[prop])
                }
            }

            if(_action == "add"){
                this.billing.sub_total += parseInt(_item.unit_price);
                this.billing.making_cost += parseInt(_item.making_cost);
            }else{
                this.billing.sub_total -= parseInt(_item.unit_price);
                this.billing.making_cost -= parseInt(_item.making_cost);
            }

            //billing.tax = parseFloat(((billing.sub_total * 18) / 100).toFixed(2)); //18% GST
            this.billing.tax = 0;
            this.billing.total = parseFloat((this.billing.sub_total + this.billing.tax).toFixed(2));

            let table_foot =    this.data_table.children('tfoot')
                                .add(this.summary_table.children('tfoot'));

            if(table_foot.length){
                table_foot.children("tr").children("#sub_total").text(this.billing.sub_total)
                table_foot.children("tr").children("#tax").text(this.billing.tax)
                table_foot.children("tr").children("#total").text(this.billing.total)
            }
        }
    }
}

function isItemExist(_barcode, _show_message = true){
    let modal_content = $(".ui.modal .content");
    let message_title = "Item not exist in Sale List";
    let message_content = "Item you're checking for is not exist in the sale list";
    let message_class = "negative";

    let is_item_exist = this.data.find(item => item.barcode == _barcode);
    
    if(is_item_exist){
        message_title = "Item Exist";
        message_content = "Item you're checking for is already in the sale list";
        message_class = "success";
    }

    if(modal_content.children(".message")){
        modal_content.children(".message").remove();
    }

    if(_show_message){
        modal_content.append(`
            <div class="ui ${message_class} message" style="margin: 1px;">
                <i class="close icon"></i>
                <div class="header">${message_title}</div>
                <p>${message_content}</p>
            </div>
        `);
    }

    return is_item_exist;
}

function initLoadStock(){
    ajaxPostCall("lib/warehouse_stock_reports.php", {action: "fetch_all", data: ["something_random"]}, function(response){
        let modal_title = "Loading Stock Error";
        let modal_body = null;

        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            stock_data.data = response.data;
        }else{
            modal_body = "Something went wrong on backend connection";
        }

        if(modal_body){
            smallModal(
                modal_title, 
                modal_body, 
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
    });
}

$(document).on('click', '.toggle-visibility', function(){
    let toggle = $(this);
    let element = $(this).parent().next().children("b");
    if(element.hasClass("opacity-0")){
        element.removeClass("opacity-0");
        element.addClass("opacity-1")
        toggle.addClass("slash")

        //now have to add the timer
        setTimeout(function(){
            if(element.hasClass("opacity-1")){
                element.removeClass("opacity-1");
                element.addClass("opacity-0");
                toggle.removeClass("slash");
            }
        }, 1000)
    }else{
        element.removeClass("opacity-1");
        element.addClass("opacity-0");
        toggle.removeClass("slash");
    }
    //console.log(element);
});

$('.actions').on('click', '#checkItemExistBtn', function(){
    scanner_data.checkItem(barcode_input.val());
})

$(document).on('click', '.remove-item', function(){
    if(scanner_state.isEnabled){
                        //icon  //td      //tr
        let item_row = $(this).parent().parent();
        if(item_row){
            let item_barcode = item_row.attr("data-barcode");
            scanner_data.method("add", item_barcode);
        }else{
            scanner_state.isEnabled = false;
            scanner_state.reason = "Error at Remove Item: Unable to find sale item row to remove";
        }
    }

    //deliberately not using `else if` block
    if(!scanner_state.isEnabled){
        smallModal(
            "Error removing sale item",
            scanner_state.reason + scanner_state.default_error_suffix,
            [
                {
                    "class": "ui positive approve button",
                    "id": "",
                    "text": "Okay",
                }
            ], 
            {
                closable: false,
                onApprove: function(){
                    return true;
                }
            }
        );
    }
})

function play_success_notification(){
    error_notification.pause();

    success_notification.pause();
    $(success_notification).attr('src', '');
    $(success_notification).attr('src', success_notification_src);
    success_notification.play();
}

function play_error_notification(){
    success_notification.pause();
    error_notification.play();
}

document.addEventListener('keypress', e => {
    if(barcode_input.is(":focus") && scanner_form.hasClass("disabled")){
        play_error_notification();
        scanner_form.submit(); //which will trigger and shows modal and plays error
    }else if(!(
            barcode_input.is(":focus")
        ||  $("#details input, #details button, #offer_form input").is(":focus")
        || ($('.ui.modal').modal('is active') && $('.ui.modal .header').text() == "Verify and Confirm Sale")
    )
    ){
        play_error_notification();
        smallModal(
            "Focus is not on Barcode Field", 
            "Manually click on Barcode Field to keep focus", 
            [
                {
                    "class": "ui positive approve button",
                    "id": "",
                    "text": "Okay",
                }
            ], 
            {
                closable: false,
                onApprove: function(){
                    return true;
                }
            }
        );
    }
})

function calculateNoOfVars(){
    return      (sale_data.summary.length * 6)
            +   (sale_data.data.length * 17)
            +   (6) //for billing
            +   (11); //for other vars
}

function scan_items_bulk(){
	setTimeout(function(){
		let barcodes_arr = barcode_input.val().split(" ");
		barcode_input.val('');
		$.each(barcodes_arr, function(){
			barcode_input.val(this);
			scanner_btn.click();
		})
	}, 1000);
}