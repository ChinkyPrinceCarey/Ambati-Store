let search_order_btn;
let search_form;

let input_order_id;

let order_fields;
let input_username;
let input_name;
let input_mobile_number;
let input_address;

let save_details_btn;
let edit_details_btn;
let sale_stock_btn;

let order_details;
let order_summary_before;
let order_summary_after;

let selected_sale_type = "retailer";
let stock_data;
let sale_data;

let table_scanned_list;
let table_scanned_summary;

let table_order_summary_before;
let table_order_summary_after;

let API_ENDPOINT = "";
API_ENDPOINT = "https://ambatitastyfoods.com/v2/"; //for remote server

$(function(){

    $("span#date").text(getCurrentDate("dmy"));

    table_scanned_list = $("#scanned-list");
    table_scanned_summary = $("#scanned-summary");

    table_order_summary_before = $("#order-summary-before");
    table_order_summary_after = $("#order-summary-after");

    search_form = $("#search_form");
    input_order_id = $("#order_id");
    search_order_btn = $("#search_order_btn");

    order_fields = $("#order_fields");

    input_username = $("#username");
    input_name = $("#name");
    input_mobile_number = $("#mobile_number");
    input_address = $("#address");
    
    save_details_btn = $("#save_details_btn");
    edit_details_btn = $("#edit_details_btn");
    sale_stock_btn = $("#sale_stock_btn");

    resetData();

    let searchParams = new URLSearchParams(window.location.search)
    let preRequestedOrderId = searchParams.get('order_id')
    if(preRequestedOrderId){
        input_order_id.val(preRequestedOrderId);
        setTimeout(function(){search_form.submit();}, 5);
    }

    search_form.submit(function(e){
        
        e.preventDefault();

      search_form.addClass("loading");

      scanner_state.isEnabled = false;
      scanner_state.reason = 'Loading Order Details so Scanning Disabled';

      let order_id = input_order_id.val();
      resetData();
      if(order_id){
        data_param = {
            action: "fetch_order",
            type: "order_id",
            data: order_id
        }
        ajaxPostCall(API_ENDPOINT + 'lib/orders.php', data_param, function(response){
            let modal_body; let modal_title = "Parsing Order Error";
            if(response.status){
                modal_body = response.status + ": " + response.statusText;

                scanner_state.isEnabled = false;
                scanner_state.reason = modal_body;
            }else if(response.title){
                modal_title = response.title;
                modal_body = response.content;

                scanner_state.isEnabled = false;
                scanner_state.reason = response.title;
            }else if(response.result){
                if(response.data.length > 1){
                    scanner_state.isEnabled = false;
                    scanner_state.reason = "Something is incorrect with the Order Id#";
                    
                    modal_title = "Fetching Order";
                    modal_body = scanner_state.reason;
                }else if(response.data.length == 0){
                    scanner_state.isEnabled = false;
                    scanner_state.reason = "Looks like Order Id# is invalid";

                    modal_title = "Fetching Order";
                    modal_body = scanner_state.reason;
                }else{
                    let order_data = response.data[0];
                    if(!parseInt(order_data.is_confirmed)){
                        order_details = JSON.parse(JSON.stringify(order_data));
                        delete order_details.items_details;

                        input_order_id.val(order_details.order_id);
                        input_username.val(order_details.username);
                        input_name.val(order_details.name);
                        input_mobile_number.val(order_details.mobile_number);
                        input_address.val(order_details.address);
                        
                        order_summary_before = JSON.parse(JSON.stringify(order_data.items_details));
                        order_summary_after = JSON.parse(JSON.stringify(order_data.items_details));

                        initOrder();
                        order_fields.show();
                        save_details_btn.show();

                        scanner_state.reason = "Order Data Parsed Successfully, however Order not saved yet!";
                    }else{
                        scanner_state.reason = "Order is already confirmed!";

                        modal_title = "Fetching Order";
                        modal_body = scanner_state.reason;
                    }
                }
            }else{
                modal_body = response.info;

                scanner_state.isEnabled = false;
                scanner_state.reason = modal_body;
            }

            if(modal_body){
                smallModal(
                    modal_title, 
                    modal_body, 
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
                            search_form.removeClass("loading");
                            return true;
                        }
                    }
                );
            }
        });
      }else{
            scanner_state.isEnabled = false;
            scanner_state.reason = 'Empty Order Id when Searching';

            smallModal(
                scanner_state.reason, 
                "Enter Order Id", 
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
                        search_form.removeClass("loading");
                        return true;
                    }
                }
            );
        }
    });

    save_details_btn.on('click', function(){
        scanner_state.isEnabled = true;
        scanner_state.reason = 'Order parsed and details are saved';

        save_details_btn.hide();

        search_order_btn.hide();

        edit_details_btn.show();
        sale_stock_btn.show();

        input_order_id.parent().addClass('disabled opacity-1');

        initValues();
    });

    edit_details_btn.on('click', function(){
        smallModal(
            "Confirm?", 
            "This will clear the current scanned data, would you like to edit?", 
            [
                {
                    "class": "ui positive approve button",
                    "id": "",
                    "text": "Edit",
                },
                {
                    "class": "ui negative deny button",
                    "id": "",
                    "text": "Cancel",
                }
            ], 
            {
                closable: false,
                onApprove: function(){

                    scanner_state.isEnabled = false;
                    scanner_state.reason = 'Details are not saved after clicking on edit';
            
                    resetData();

                    return true;
                },
                onDeny: function(){
                    return true;
                }
            }
        );
    });

    sale_stock_btn.on('click', function(){
        if(!sale_data.data.length){
            smallModal(
                "Empty Sale Data", 
                "No items are scanned to sale",
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
        }else{
            scanner_data.offer_dialogue();
        }

        /*
        else if(order_summary_after.summary.length){
            smallModal(
                "Would you like to Sale?", 
                "Few more items in Order Summary are not scanned, however would you like to sale items so far for this order?",
                [
                    {
                        "class": "ui positive approve button",
                        "id": "",
                        "text": "Yes",
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
                        return true;
                    },
                    onDeny: function(){
                        return true;
                    }
                }
            );
        }
        */
    });
});

function resetData(){
    order_fields.hide();

    input_order_id.parent().removeClass('disabled opacity-1');
    input_order_id.val('');
    input_username.val('');
    input_name.val('');
    input_mobile_number.val('');
    input_address.val('');

    search_order_btn.show();

    save_details_btn.hide();
    edit_details_btn.hide();
    sale_stock_btn.hide();

    order_details = {};
    order_summary_before = {};
    order_summary_after = {};

    stock_data = {};
    sale_data = {};
    
    clearTables();
}

function initValues(){
    stock_data = {
        data: [],
        data_table: false,
        summary: false,
        summary_table: false,
        billing: false,
        sale_obj: true
    }

    sale_data = {
        data: [],
        data_table: true,
        summary: true,
        summary_table: true,
        billing: true,
        stock_obj: true
    }

    initLoadStock();

    stock_data = {...stock_data, ...stock_obj_methods};
    sale_data = {...sale_data, ...sale_obj_methods};

    sale_data.data_table = table_scanned_list;
    sale_data.summary_table = table_scanned_summary;
    sale_data.includeMakingCostInSummary = true;

    stock_data.sale_obj = sale_data;
    sale_data.stock_obj = stock_data;

    order_summary_after.data_table = false;
    order_summary_after.summary_table = table_order_summary_after;
    order_summary_after.stock_obj = false;
    
    order_summary_after = {...order_summary_after, ...sale_obj_methods};

    scanner_data = {
        method(action, barcode){
            if(action == "remove"){
                let item = stock_data.isItemExist(barcode, false);
                if(item){
                    let shortcode = item.shortcode;
                    let isExistInOrderSummary = order_summary_after.isItemExist(shortcode, false, false);
                    if(isExistInOrderSummary){
                        item.app_price = isExistInOrderSummary.unit_price;

                        if(item.unit_price != item.app_price){
                            item.unit_price = item.app_price;
                        }

                        let updatedItem = stock_data.update_data(action, barcode);
                        if(updatedItem){
                            order_summary_after.update_summary(action, updatedItem);
                            order_summary_after.update_billing(action, updatedItem);

                            if(!order_summary_after.summary.length){
                                scanner_state.isEnabled = false;
                                scanner_state.reason = 'All Order Items are scanned, Kindly verify and Sale Order';
                            }
                        }
                    }else{
                        play_error_notification();
                        smallModal(
                            "Wrong Item Scanned", 
                            "The item you're scanned is not in Order Summary, Kindly scan items which are in Order Summary", 
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
                                    barcode_input.focus();
                                    return true;
                                }
                            }
                        );
                    }
                }else{
                    //item not exist in `stock` 
                    //so whatever modal it should show, it'll show
                    stock_data.update_data(action, barcode);
                }
            }else{
                let updatedItem = stock_data.update_data(action, barcode);
                if(updatedItem){
                    order_summary_after.update_summary(action, updatedItem);
                    order_summary_after.update_billing(action, updatedItem);

                    if(!scanner_state.isEnabled){
                        scanner_state.isEnabled = true;
                        scanner_state.reason = '';
                    }
                }
            }
        },
        checkItem(barcode){
            sale_data.isItemExist(barcode);
        },
        offer_dialogue(){
            offer_dialogue(sale_items, sale_data, false);
        },
        evaluateOffer(input_id){
            evaluateOffer(input_id, sale_data);
        },
        apply_offer(){
            apply_offer(sale_data, table_scanned_summary, table_scanned_list);
        },
        remove_offer(){
            remove_offer(sale_data);
        }
    }

    sale_data.cookie_name = `order_${order_details.order_id}`;
    sale_data.initCookieData();
}

function sale_items(){
    data_param = {
        action: "sale_order",
        order_id: order_details.order_id,
        order_data: order_details,
        unscanned_data: JSON.stringify({summary: order_summary_after.summary, billing: order_summary_after.billing}),
        data: JSON.stringify({summary: sale_data.summary, list: sale_data.data, billing: sale_data.billing})
    }

    ajaxPostCall('lib/orders.php', data_param, function(response){
        let modal_body; let modal_title = "Parsing Error";
        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            sale_data.reset_cookie();
            smallModal(
                "Order Sale Successful",
                `
                <p>Order Id#: <b>${response.order_id}</b></p>
                <p>Total No.# of items are sold <b>${sale_data.data.length}</b></p>
                ${response.new_order_id ? `<p><strong>New Order Id#: ${response.new_order_id}</strong></p>` : ""}
                <table>
                    <tr>
                        <td>Total Price of</td>
                        <td><b>${sale_data.billing.total.toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Total Making Cost of</td>
                        <td><b>${sale_data.billing.making_cost.toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Profit of</td>
                        <td><b>${(sale_data.billing.total - sale_data.billing.making_cost).toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Offer ${sale_data.billing.offer_percentage}%</td>
                        <td><b>${sale_data.billing.offer_amount}</b></td>
                    </tr>
                </table>
                `,
                [
                    {
                        "class": "ui approve medium violet button",
                        "id": "printInvoiceSummaryBtn",
                        "text": "Print Invoice Summary",
                    },
                    {
                        "class": "ui approve pink button",
                        "id": "printInvoiceListBtn",
                        "text": "Print Invoice List",
                    },
                    {
                        "class": "ui negative deny button",
                        "id": "modalCloseBtn",
                        "text": "Close",
                    }
                ], 
                {
                    closable: false,
                    onApprove: function(e){
                        let buttonId = e.attr('id');
                        if(buttonId == "printInvoiceSummaryBtn"){
                            $("#printInvoiceSummaryBtn").addClass("loading");
                            printInvoice($("#sale-summary").parent(), "summary", response, function(isCompleted){
                                $("#printInvoiceSummaryBtn").removeClass("loading");
                            });
                        }else if(buttonId == "printInvoiceListBtn"){
                            $("#printInvoiceListBtn").addClass("loading");
                            printInvoice($("#sale-list").parent(), "list", response, function(isCompleted){
                                $("#printInvoiceListBtn").removeClass("loading");
                            });
                        }else{}
                        return false;
                    },
                    onDeny: function(){
                        $("#modalCloseBtn").addClass("loading");
                        window.location.replace(getCurrentPage());
                        return false;
                    }
                }
            );
        }else{
            modal_body = response.info;
        }

        if(modal_body){
            smallModal(
                modal_title, 
                modal_body, 
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
}

function clearTables(){
    let tables = table_order_summary_after
                .add(table_order_summary_before)
                .add(table_scanned_summary)
                .add(table_scanned_list);

    tables.children("tbody").empty();
    
    tables.children('tfoot').children("tr").children("#sub_total").text('');
    tables.children('tfoot').children("tr").children("#tax").text('');
    tables.children('tfoot').children("tr").children("#total").text('');
}

function initOrder(){
  $("#order_summary_after").addClass("loading");
  $("#order_summary_before").addClass("loading");

  /* -------------------- Summary -------------------- */
  clearTables();

  for(let item of order_summary_after.summary){
    table_order_summary_after
      .children("tbody")
      .append(`
          <tr data-item="${item.shortcode}_${item.unit_price}">
              <td class="slno collapsing"></td>
              <td class="item_shortcode">${item.item}[${item.shortcode}]</td>
              <td class="quantity right aligned collapsing">${item.quantity}</td>
              <td class="unit_price right aligned collapsing">${item.unit_price}</td>
              <td class="total_price right aligned collapsing">${item.total_price}</td>
          </tr>
      `)
  }

  table_order_summary_after.children('tfoot').children("tr").children("#sub_total").text(order_summary_after.billing.sub_total)
  table_order_summary_after.children('tfoot').children("tr").children("#tax").text(order_summary_after.billing.tax)
  table_order_summary_after.children('tfoot').children("tr").children("#total").text(order_summary_after.billing.total)

  table_order_summary_before.html(table_order_summary_after.html())

  $("#order_summary_after").removeClass("loading");
  $("#order_summary_before").removeClass("loading");
  search_form.removeClass("loading");
}