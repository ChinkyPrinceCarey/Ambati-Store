let notifyAudio;

let scanner_form;

let scanner_btn;
let barcode_input;

let scanner_data;

let scanner_state = {
    isEnabled: false,
    isKeyPressEnable: true,
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

    sound_notification(); //initializing audio

    stock_obj_methods = {
        update_data: function(_action, _barcode){
            if(scanner_state.isEnabled){
                if(_action == "add"){
                    let sale_item = this.sale_obj.update_data('remove', _barcode);
                    if(sale_item) this.data.push(sale_item);
                    this.update_data_table(_action, sale_item, this.trashIconForActionAdd, this.trashIconForActionClass); //ignores if no table is present
                    this.update_summary(_action, sale_item); //ignores if summary object is null
                    this.update_billing(_action, sale_item); //ignores if summary object is null

                    return sale_item;
                }else if(_action == "remove"){
                    let stock_item = this.data.find(item => item.barcode == _barcode);
                    if(!stock_item){
                        if(_barcode.length == 14 && this.cottonScanning){
                            //it would be generate id
                            //so let's check
                            stock_item = this.data.find(item => item.generate_id == _barcode);
                            if(stock_item) _barcode = stock_item.barcode;
                        }
                    }
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
                                sound_notification("scan_success");
                            }else{
                                sound_notification("scan_fail");
                            }

                            return sale_item;
                        }else{
                            scanner_state.isEnabled = false;
                            scanner_state.reason = 'Error at updateList(..): Stock Data and Sale Data are not matching';
                        }
                    }else{
                        sound_notification("scan_fail");
    
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
        isItemExist: isItemExist,
        includeMakingCostInSummary: false,
        cottonScanning: false,
        trashIconForActionAdd: false,
        trashIconForActionClass: "remove-item"
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
                    this.update_billing(_action, _param);

                    this.update_cookie(); //ignores if `cookie_name` not present 
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

                            this.update_cookie();
                            
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
        initCookieData: function(){
            let cookie_name = this.cookie_name;
            let cookie_data = Cookies.get(cookie_name);

            if(cookie_data && cookie_data != ""){
                smallModal(
                    `Restore Previous Scanned Data?`,
                    `Previously uncompleted scanned data is available to restore, would you like to restore it?`,
                    [
                        {
                            "class": "ui positive approve medium button",
                            "id": "",
                            "text": `Yes`,
                        },
                        {
                            "class": "ui negative deny button",
                            "id": "",
                            "text": "No",
                        }
                    ], 
                    {
                        closable: false,
                        onApprove: function(){
                            Cookies.set(cookie_name, "", { expires: 7 });
                            barcode_input.val(cookie_data);
                            scanner_btn.click();          
                            return true;
                        },
                        onDeny: function(){
                            Cookies.set(cookie_name, "", { expires: 7 });
                            return true;
                        }
                    }
                );
            }
        },
        update_cookie: function(){
            if(
                this.cookie_name !== undefined
            &&  this.cookie_name !== ""
            //&&  this.isCookieEnabled
            ){
                Cookies.set(this.cookie_name, this.data.map((item)=>{return item.barcode}), { expires: 7 });
            }
        },
        reset_cookie: function(){
            Cookies.set(this.cookie_name, "", { expires: 7 });
        },
        update_data_table: update_data_table,
        update_summary: update_summary,
        update_billing: update_billing,
        isItemExist: isItemExist,
        isCookieEnabled: true,
        includeMakingCostInSummary: false
    }
    
    scanner_form = $("#scanner_form");
    scanner_btn = $("#scanner_btn");
    barcode_input = $("#barcode_input");
    barcode_input.attr("autocomplete", false);

    scanner_state.isEnabled = false; //just to trigger the updateScannerFormUI()

    scanner_form
    .form({
		onSuccess: function(event, fields){
            event.preventDefault();
            if(scanner_form.hasClass("disabled")){
                sound_notification("scan_fail");

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
                    if(
                            barcode_input.val().includes(" ")
                        ||  barcode_input.val().includes(",")
                    ){
                        scan_items_bulk();
                    }else{
                        scanner_data.method("remove", barcode_input.val());
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

function update_data_table(_action, _item, _show_trash_row = false, _trash_icon_class = "remove-item"){
    if(!(this.data_table === false)){
        if(scanner_state.isEnabled){
            let table_body = this.data_table.children('tbody');

            if(_action == "add"){
                let table_trash_row = _show_trash_row ? `<i class="large trash icon ${_trash_icon_class}"></i>` : '';
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

            let item_index;
            if(this.includeMakingCostInSummary){
                item_index = this.summary.findIndex(item => 
                                    (item.shortcode == _item.shortcode)
                                &&  (item.unit_price == _item.unit_price)
                                &&  (item.making_cost == _item.making_cost)
                            );
            }else{
                item_index = this.summary.findIndex(item => 
                                    (item.shortcode == _item.shortcode)
                                &&  (item.unit_price == _item.unit_price)
                            );
            }
            
            let data_item = `${_item.shortcode}_${_item.unit_price}`;
            if(this.includeMakingCostInSummary){
                data_item += `_${_item.making_cost}`;
            }

            if(_action == "add"){
                if(item_index >= 0){
                    let item_table_row = table_body.children(`tr[data-item='${data_item}']`);
                    if(item_table_row){
    
                        let updated_quantity = parseInt(this.summary[item_index].quantity) + 1;
                        let updated_total_price = get_decimal(this.summary[item_index].total_price) + get_decimal(_item.unit_price);
                        
                        updated_total_price = get_decimal(updated_total_price);
                        
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
                            making_cost: get_decimal(_item.making_cost),
                            unit_price: get_decimal(_item.unit_price),
                            quantity: 1,
                            sold_quantity: 0,
                            total_price: get_decimal(_item.unit_price)
                        }
                    );
            
                    table_body.append(`
                        <tr data-item="${data_item}">
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
                if(item_index >= 0){
                    let sale_summary_item_table_row = table_body.children(`tr[data-item='${data_item}']`);
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
        if(typeof this.billing != "object") this.billing = JSON.parse(JSON.stringify(billing_template_obj));
        if(scanner_state.isEnabled){
            for(let prop in this.billing){
                if(typeof this.billing[prop] == "string"){
                    this.billing[prop] = get_decimal(this.billing[prop])
                }
            }

            if(_action == "add"){
                this.billing.sub_total += get_decimal(_item.unit_price);
                this.billing.making_cost += get_decimal(_item.making_cost);
            }else{
                this.billing.sub_total -= get_decimal(_item.unit_price);
                this.billing.making_cost -= get_decimal(_item.making_cost);
            }

            //billing.tax = get_decimal((billing.sub_total * 18) / 100); //18% GST
            this.billing.tax = 0;
            this.billing.total = get_decimal(this.billing.sub_total + this.billing.tax);

            this.billing.sub_total = get_decimal(this.billing.sub_total);
            this.billing.making_cost = get_decimal(this.billing.making_cost);

            let table_foot;
            
            if(this.data_table){
                if(table_foot){
                    table_foot = table_foot.add(this.data_table.children('tfoot'));
                }else{
                    table_foot = this.data_table.children('tfoot');

                }
            }
            
            if(this.summary_table){
                if(table_foot){
                    table_foot = table_foot.add(this.summary_table.children('tfoot'));
                }else{
                    table_foot = this.summary_table.children('tfoot');
                }
            }

            if(table_foot.length){
                table_foot.children("tr").children("#sub_total").text(this.billing.sub_total)
                table_foot.children("tr").children("#tax").text(this.billing.tax)
                table_foot.children("tr").children("#total").text(this.billing.total)
            }
        }
    }
}

function isItemExist(_barcode, _show_message = true, _searchBarcode = true){
    let modal_content = $(".ui.modal .content");
    let message_title = "Item not exist in Sale List";
    let message_content = "Item you're checking for is not exist in the sale list";
    let message_class = "negative";
    
    let is_item_exist = false;
    if(_searchBarcode){
        is_item_exist = this.data.find(item => item.barcode == _barcode);
        if(!is_item_exist && this.cottonScanning){
            //since cotton scan enabled it could be generate_id
            is_item_exist = this.data.find(item => item.generate_id == _barcode);
        }
    }else{
        is_item_exist = this.summary.find(item => item.shortcode == _barcode);   
    }
    
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
    ajaxPostCall(`${LIB_API_ENDPOINT}/warehouse_stock_reports.php`, {action: "fetch_all", data: ["something_random"]}, function(response){
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
});

function sound_notification(){
    if(arguments.length){
        notifyAudio.pause();
        if(typeof arguments[0] == "boolean"){
            if(!arguments[0]){
                //`false` passed hence clearing any audio
                notifyAudio = new Audio();
            }
        }else{
            let default_audio_dir = "assets/sounds/";
            switch (arguments[0]){
                case "scanned":
                    notifyAudio.src = default_audio_dir + "notification_sound.mp3";
                break;
                case "scan_success":
                    notifyAudio.src = default_audio_dir + "success_adding_item.mp3";
                break;
                case "scan_fail":
                    notifyAudio.src = default_audio_dir + "error_adding_item.mp3";
                break;
                case "wrong_item":
                    notifyAudio.src = default_audio_dir + "loud.mp3";
                break;
                case "all_scanned":
                    notifyAudio.src = default_audio_dir + "success.mp3";
                break;
                default:
                    notifyAudio.pause();
                    return;
            }
            notifyAudio.play();
        }
    }else{
        //no arguments, which means we have to init the `notifyAudio` variable
        notifyAudio = new Audio();
    }
}

document.addEventListener('keypress', e => {
    if(scanner_state.isKeyPressEnable){
        if(barcode_input.is(":focus") && scanner_form.hasClass("disabled")){
            sound_notification("scan_fail");
            scanner_form.submit(); //which will trigger and shows modal and plays error
        }else if(!(
                barcode_input.is(":focus")
            ||  $("#details input, #details button, #offer_form input").is(":focus")
            || ($('.ui.modal').modal('is active') && $('.ui.modal .header').text() == "Verify and Confirm Sale")
        )
        ){
            sound_notification("scan_fail");
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
		let barcodes_arr =  barcode_input
                            .val()
                            .replace(/,/g, " ")
                            .split(" ");
		barcode_input.val('');
		$.each(barcodes_arr, function(){
			barcode_input.val(this);
			scanner_btn.click();
		})
	}, 1000);
}

function sumPropertyValues(array, prop){
    return array.reduce( function(a, b){
        return a + b[prop];
    }, 0);
}

/*begin: OFFER */
$(document).on('keyup', '#input_offer_percentage, #input_offer_amount', function(e){
    scanner_data.evaluateOffer(e.target.id);
})

$(document).on('click', '#apply_offer_btn', function(e){
    scanner_data.apply_offer();
})

function apply_offer(_sale_data, _sale_summary_table, _sale_list_table){
    let apply_offer_btn = $("#apply_offer_btn");
    let offer_percentage = parseInt($("#input_offer_percentage").val());
    let offer_amount = parseInt($("#input_offer_amount").val());

    let table_sale_items_overview = $("#sale_items_overview");

    if(apply_offer_btn.hasClass("teal")){
        //check the condition
        if(offer_percentage && offer_amount){
            //then apply the offer
            _sale_data.billing.offer_percentage = offer_percentage;
            _sale_data.billing.offer_amount = offer_amount;
            
            //if by any chance exist then remove it
            table_sale_items_overview.children("#offer_row").remove();

            table_sale_items_overview.append(`
                <tr id="offer_row">
                    <td>Offer(${offer_percentage}%)</td>
                    <td><b>${offer_amount}</b></td>
                </tr>
            `);

            _sale_summary_table.children('tfoot').children("tr").children("#offer_percentage").text(`Offer(${offer_percentage}%)`)
            _sale_summary_table.children('tfoot').children("tr").children("#offer_amount").text(offer_amount)
            
            _sale_list_table.children('tfoot').children("tr").children("#offer_percentage").text(`Offer(${offer_percentage}%)`)
            _sale_list_table.children('tfoot').children("tr").children("#offer_amount").text(offer_amount)

        }else{
            //possible bug/error
            //so remove the offer as it will reset any offer
            scanner_data.remove_offer();
        }
        
        //update the button and fields
        apply_offer_btn.removeClass("teal")
        apply_offer_btn.addClass("red")
        apply_offer_btn.children("#text").text("Remove Offer")

        $("#input_offer_percentage").parent().addClass("disabled");
        $("#input_offer_amount").parent().addClass("disabled");
    }else{
        //remove the offer
        scanner_data.remove_offer();
    }
}

function remove_offer(_sale_data, _sale_summary_table, _sale_list_table){
    let apply_offer_btn = $("#apply_offer_btn");
    let table_sale_items_overview = $("#sale_items_overview");

    $("#input_offer_percentage").val('');
    $("#input_offer_amount").val('');

    if(_sale_data){
        _sale_data.billing.offer_percentage = 0;
        _sale_data.billing.offer_amount = 0;
    }

    table_sale_items_overview.children("#offer_row").remove();
    
    if(_sale_summary_table && _sale_list_table){
        _sale_summary_table.children('tfoot').children("tr").children("#offer_percentage").text(`Offer(%)`)
        _sale_summary_table.children('tfoot').children("tr").children("#offer_amount").text('')
            
        _sale_list_table.children('tfoot').children("tr").children("#offer_percentage").text(`Offer(%)`)
        _sale_list_table.children('tfoot').children("tr").children("#offer_amount").text('')
    }

    //update the button and fields
    apply_offer_btn.removeClass("red")
    apply_offer_btn.addClass("teal")
    apply_offer_btn.addClass("disabled")
    apply_offer_btn.children("#text").text("Apply Offer")

    $("#input_offer_percentage").parent().removeClass("disabled");
    $("#input_offer_amount").parent().removeClass("disabled");
}

function evaluateOffer(offer_input_id, _sale_data){
    let input_offer_percentage = $("#input_offer_percentage");
    let input_offer_amount = $("#input_offer_amount");
    let apply_offer_btn = $("#apply_offer_btn");

    let offer_message = $("#offer_message");
    let offer_message_title = $("#offer_message_title");
    let offer_message_limit_percentage = $("#offer_message_content #limit_percentage");
    let offer_message_limit_amount = $("#offer_message_content #limit_amount");

    let making_cost = get_decimal(_sale_data.billing.making_cost);
    let sub_total = get_decimal(_sale_data.billing.sub_total);
    let pre_profit = get_decimal(sub_total - making_cost);

    let offer_limit_percentage = 15;
    let offer_limit_amount = parseInt((offer_limit_percentage/100) * (pre_profit));
    offer_message_limit_percentage.text(offer_limit_percentage)
    offer_message_limit_amount.text(offer_limit_amount)
    
    let offer_percentage = parseInt(input_offer_percentage.val());
    let offer_amount = parseInt(input_offer_amount.val());
    
    if(offer_input_id == "input_offer_percentage"){
        offer_amount = parseInt((offer_percentage/100) * (sub_total))
        input_offer_amount.val(offer_amount);
    }else{
        offer_percentage = parseInt((offer_amount/sub_total)*100);
        input_offer_percentage.val(offer_percentage)
    }

    //update button
    if(parseInt(input_offer_percentage.val()) && parseInt(input_offer_amount.val())){
        apply_offer_btn.removeClass("disabled");
    }else{
        apply_offer_btn.addClass("disabled");
    }

    //update offer message ui
    if(offer_amount < offer_limit_amount){
        //postive profit
        offer_message.removeClass("negative")
        offer_message.addClass("positive")
        offer_message_title.text('Offer in Profit Threshold')
    }else{
        //negetive profit
        offer_message.removeClass("positive")
        offer_message.addClass("negative")
        offer_message_title.text('Offer beyond Profit Threshold')
    }
}

function offer_dialogue(
    callback, 
    _sale_data, 
    _show_offer = true,
    _modal_data = {title: "Verify and Confirm Sale", desc: "Sale Items Overview", primary_btn_title: "Sale Stock"},
    _summary_data = {
       show_items_summary: true,
       show_items_units: true,
       show_making_cost: true,
       show_sub_total: true,
       show_tax: true,
       show_total: true,
       show_profit: true
    }
){
    scanner_state.isKeyPressEnable = false;
    let offer_dom = '';
    if(_show_offer){
        offer_dom = 
        `
        <div class="ui form" id="offer_form">
            <div class="inline fields">
                <div class="three wide field">
                    <div class="ui left labeled input">
                        <input type="number" id="input_offer_percentage" name="input_offer_percentage" placeholder="">
                        <label for="input_offer_percentage" class="ui label"><b>%</b></label>
                    </div>
                </div>
                <div class="three wide field">
                    <div class="ui left labeled input">
                        <input type="number" id="input_offer_amount" name="input_offer_amount" placeholder="">
                        <label for="input_offer_amount" class="ui label"><b>₹</b></label>
                    </div>
                </div>
                <div class="four wide field">
                    <button class="ui teal right labeled icon disabled button" id="apply_offer_btn">
                        <i class="copy icon"></i>
                        <span id="text">Apply Offer</span>
                    </button>
                </div>
            </div>
        </div>
        <div class="ui message" id="offer_message">
            <div class="header" id="offer_message_title"></div>
            <p id="offer_message_content">
                Offer Amount of ₹<span id="limit_amount"></span> will cross the <span id="limit_percentage"></span>% profit threshold
            </p>
        </div>
        `;
    }

    let dialogue_title = _modal_data.title;
    let dialogue_desc = _modal_data.desc;
    let primary_button_title = _modal_data.primary_btn_title;

    let dialogue_body = "";
    
    if(_summary_data.show_items_summary){
        dialogue_body += `
        <tr>
            <td>Total No.of. Items</td>
            <td><b>${_sale_data.summary.length ? _sale_data.summary.length : "0"}</b></td>
        </tr>   
        `;
    }
    
    if(_summary_data.show_items_units){
        dialogue_body += `
        <tr>
            <td>Total No.of. Units</td>
            <td><b>${_sale_data.data.length ? _sale_data.data.length : "0"}</b></td>
        </tr>
        `;
    }
    
    if(_summary_data.show_making_cost){
        dialogue_body += `
        <tr>
            <td>Total Making Cost <i class="toggle-visibility eye icon"></i></td>
            <td><b class="opacity-0">${_sale_data.billing.making_cost ? _sale_data.billing.making_cost : "0"}</b></td>
        </tr>
        `;
    }
    
    if(_summary_data.show_sub_total){
        dialogue_body += `
        <tr>
            <td>Sub Total</td>
            <td><b>${_sale_data.billing.sub_total ? _sale_data.billing.sub_total : "0"}</b></td>
        </tr>
        `;
    }
    
    if(_summary_data.show_tax){
        dialogue_body += `
        <tr>
            <td>Tax</td>
            <td><b>${_sale_data.billing.tax ? _sale_data.billing.tax : "0"}</b></td>
        </tr>
        `;
    }
    
    if(_summary_data.show_total){
        dialogue_body += `
        <tr>
            <td>Total</td>
            <td><b>${_sale_data.billing.total ? _sale_data.billing.total : "0"}</b></td>
        </tr>
        `;
    }
    
    if(_summary_data.show_profit){
        dialogue_body += `
        <tr>
            <td>Profit <i class="toggle-visibility eye icon"></i></td>
            <td><b class="opacity-0">${_sale_data.billing.total - _sale_data.billing.making_cost}</b></td>
        </tr>
        `;
    }
    
    smallModal(
        `${dialogue_title}`,
        `
        <p><b>${dialogue_desc}</b></p>
        <table border="1" id="sale_items_overview">
            ${dialogue_body}
        </table>
        </br>
        ${offer_dom}
        `,
        [
            {
                "class": "ui positive approve medium button",
                "id": "",
                "text": `${primary_button_title}`,
            },
            {
                "class": "ui negative deny button",
                "id": "",
                "text": "Close",
            }
        ], 
        {
            closable: false,
            onApprove: function(){
                scanner_state.isKeyPressEnable = true;
                callback();
                return true;
            },
            onDeny: function(){
                scanner_data.remove_offer();
                scanner_state.isKeyPressEnable = true;
                return true;
            }
        }
    );
}
/*end: OFFER */

/*begin: COOKIE */
function initCookieData(){
    
}
/*end: COOKIE */