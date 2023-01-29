let save_details_btn;
let edit_details_btn;
let sale_cancel_btn;
let cotton_barcode_print_btn;

let search_form;
let input_invoice_id;
let search_invoice_btn;

let input_username;
let input_name;
let input_mobile_number;
let input_address;

let invoice_details;;

var earlier_sale;
let earlier_sale_summary_table;
let earlier_sale_list_table;
let earlier_sale_billing_table;

let cancelled_sale;
let cancelled_sale_summary_table;
let cancelled_sale_list_table;
let cancelled_sale_billing_table;

let return_sale;
let return_sale_summary_table;
let return_sale_list_table;
let return_sale_billing_table;

let current_sale;
let current_sale_summary_table;
let current_sale_list_table;
let current_sale_billing_table;

$(function(){
    $("span#date").text(getDate("d-m-y"));

    save_details_btn = $("#save_details_btn");
    edit_details_btn = $("#edit_details_btn");
    sale_cancel_btn = $("#sale_cancel_btn");
    cotton_barcode_print_btn = $("#cotton_barcode_print_btn");

    save_details_btn.hide();
    edit_details_btn.hide();
    sale_cancel_btn.hide();
    cotton_barcode_print_btn.hide();

    search_form = $("#search_form");
    input_invoice_id = $("#invoice_id");
    search_invoice_btn = $("#search_invoice_btn");

    input_username = $("#username");
    input_name = $("#name");
    input_mobile_number = $("#mobile_number");
    input_address = $("#address");
    
    earlier_sale_summary_table = $("#earlier_invoice .card .wrapper div table#sale-summary");
    earlier_sale_list_table = $("#earlier_invoice .card .wrapper div table#sale-list");
    earlier_sale_billing_table =    earlier_sale_summary_table.children('tfoot')
                                        .add(earlier_sale_list_table.children('tfoot'));

    cancelled_sale_summary_table = $("#cancelled_invoice .card .wrapper div table#sale-summary");
    cancelled_sale_list_table = $("#cancelled_invoice .card .wrapper div table#sale-list");
    cancelled_sale_billing_table =  cancelled_sale_summary_table.children('tfoot')
                                        .add(cancelled_sale_list_table.children('tfoot'));

    return_sale_summary_table = $("#return_invoice .card .wrapper div table#sale-summary");
    return_sale_list_table = $("#return_invoice .card .wrapper div table#sale-list");
    return_sale_billing_table =  return_sale_summary_table.children('tfoot')
                                        .add(return_sale_list_table.children('tfoot'));

    current_sale_summary_table = $("#current_invoice .card .wrapper div table#sale-summary");
    current_sale_list_table = $("#current_invoice .card .wrapper div table#sale-list");
    current_sale_billing_table = current_sale_summary_table.children('tfoot')
                                    .add(current_sale_list_table.children('tfoot'));

    resetData();

    let searchParams = new URLSearchParams(window.location.search)
    let preRequestedOrderId = searchParams.get('order_id')
    if(preRequestedOrderId){
        input_invoice_id.val(preRequestedOrderId);
        setTimeout(function(){search_invoice_btn.click();}, 5);
    }

    search_invoice_btn.on('click', function(){
        search_form.addClass("loading");

        scanner_state.isEnabled = false;
        scanner_state.reason = 'Loading New Invoice so Scanning Disabled';

        save_details_btn.hide();
        edit_details_btn.hide();
        sale_cancel_btn.hide();
        cotton_barcode_print_btn.hide();

        let invoice_id = input_invoice_id.val();
        resetData();
        if(invoice_id){
            data_param = {
                action: "fetch_order",
                type: "order_id",
                data: invoice_id
            }
            ajaxPostCall(`${LIB_API_ENDPOINT}/orders.php`, data_param, function(response){
                let modal_body; let modal_title = "Parsing Invoice Error";
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
                        scanner_state.reason = "Something is incorrect with the invoice parsed";
                        
                        modal_body = scanner_state.reason;
                    }else if(response.data.length == 0){
                        scanner_state.isEnabled = false;
                        scanner_state.reason = "Something is incorrect empty invoice parsed";

                        modal_body = scanner_state.reason;
                    }else{
                      let invoice_data = response.data[0];
                      
                      invoice_details = JSON.parse(JSON.stringify(invoice_data));
                      delete invoice_details.items_details;

                      input_invoice_id.val(invoice_details.order_id)
                      input_username.val(invoice_details.username);
                      input_name.val(invoice_details.name);
                      input_mobile_number.val(invoice_details.mobile_number);
                      input_address.val(invoice_details.address);

                      input_invoice_id.parent().addClass('disabled');
                      search_invoice_btn.parent().addClass('disabled');
                      edit_details_btn.show();
                      sale_cancel_btn.show();
                      cotton_barcode_print_btn.show();
                      
                      if(parseInt(invoice_data.is_confirmed)){
                        current_sale.data = invoice_data.items_details.list;
                        current_sale.summary = invoice_data.items_details.summary;
                        current_sale.billing = invoice_data.items_details.billing;

                        if('return_order' in invoice_data.items_details){
                            return_sale.data = invoice_data.items_details.return_order.list;
                            return_sale.summary = invoice_data.items_details.return_order.summary;
                            return_sale.billing = invoice_data.items_details.return_order.billing;
                        }

                        earlier_sale.data = JSON.parse(JSON.stringify(current_sale.data));
                        earlier_sale.summary = JSON.parse(JSON.stringify(current_sale.summary));
                        earlier_sale.billing = JSON.parse(JSON.stringify(current_sale.billing));

                        initInvoices();

                        //removing the offer for current sale
                        current_sale.billing.offer_percentage = 0;
                        current_sale.billing.offer_amount = 0;

                        scanner_state.isEnabled = true;
                        scanner_state.reason = "Invoice Data Parsed Successfully";

                        cancelled_sale.cookie_name = `order_return_${invoice_id}`;
                        cancelled_sale.initCookieData();
                      }else{
                        search_form.removeClass("loading");
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
            scanner_state.reason = 'Empty Invoice Id when Searching';

            smallModal(
                scanner_state.reason, 
                "Enter Invoice Id to cancel items in it", 
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

    edit_details_btn.on('click', function(){
        smallModal(
            "Are you sure want to edit?", 
            "By clicking Okay all data will be erased...", 
            [
                {
                    "class": "ui positive approve medium button",
                    "id": "",
                    "text": "Okay",
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
                    
                    scanner_state.isEnabled = false;
                    scanner_state.reason = 'Details are not saved after clicking on Edit';

                    input_invoice_id.parent().removeClass('disabled');
                    search_invoice_btn.parent().removeClass('disabled');

                    edit_details_btn.hide();
                    sale_cancel_btn.hide();
                    cotton_barcode_print_btn.hide();

                    resetData();

                    return true;
                },
                onDeny: function(){
                    return true;
                }
            }
        );
    })

    sale_cancel_btn.on('click', function(){
        if(!cancelled_sale.data.length){
            smallModal(
                "Are you sure want to cancel?",
                `<p>YOU ARE CANCELLING ALL THE ITEMS IN THIS SALE</p>`,
                [
                    {
                        "class": "ui positive approve medium button",
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
                        cancelled_sale.data = earlier_sale.data;
                        order_return();
                        return true;
                    },
                    onDeny: function(){
                      return true;
                    }
                }
            );
        }else if((cancelled_sale.data.length + return_sale.data.length) != (current_sale.data.length)){
            smallModal(
                "Are you sure want to return?",
                `
                <p>Invoice Id#: <b>${input_invoice_id.val()}</b></p>
                <p><b>${current_sale.summary.length == 0 ? "YOU ARE CANCELLING ALL THE ITEMS IN THIS SALE" : ""}<b></p>
                <p>Verify the data before clicking on Confirm</p>
                </br>
                <p>Cancel Items Overview</b></p>
                <table border="1">
                    <tr>
                        <td>Total No.of. Items</td>
                        <td><b>${cancelled_sale.summary.length}</b></td>
                    </tr>
                    <tr>
                        <td>Total No.of. Units</td>
                        <td><b>${cancelled_sale.data.length}</b></td>
                    </tr>
                    <tr>
                        <td>Total Cost</td>
                        <td><b>${cancelled_sale.billing.total}</b></td>
                    </tr>
                </table>
                `,
                [
                    {
                        "class": "ui positive approve medium button",
                        "id": "",
                        "text": "Confirm",
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
                      order_return();
                        return true;
                    },
                    onDeny: function(){
                        return true;
                    }
                }
            );
        }else{
            scanner_state.isEnabled = false;
            scanner_state.reason = 'Data Mismatching(i.e. Earlier Data, Current Data and Removed Data)';

            smallModal(
                "Data Mismatching",
                scanner_state.reason + "</br>Reload Page and Try...",
                [
                    {
                        "class": "ui positive approve medium button",
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

    cotton_barcode_print_btn.on('click', function(){
        cotton_barcode_print_btn.addClass('loading');

        let modal_title;
        let modal_body;
        if(return_sale.data.length){
            let cottonItems = getCottonItems();
            if(cottonItems.length){
                generateCottonBarcodes(cottonItems);
                smallModal(
                    "Confirm to Print Cotton Items Barcodes",
                    `Found <b>${cottonItems.length}</b> cotton items barcodes in the return order, would you like to print?`,
                    [
                        {
                            "class": "ui positive approve button",
                            "id": "",
                            "text": "Print",
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
                            printLabels(function(isCompleted){
                                return true;    
                            });
                            cotton_barcode_print_btn.removeClass('loading');
                            return true;
                        },
                        onDeny: function(){
                            return true;
                        }
                    }
                );
            }else{
                modal_title = 'No Cotton Items for the Return Order';
                modal_body = 'There are no cotton items in the return order list';
            }
        }else{
            modal_title = 'No Items for the Return Order';
            modal_body = 'Empty Return Order';
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
                        cotton_barcode_print_btn.removeClass('loading');
                        return true;
                    }
                }
            );
        }
    });
});

function initValues(){

    invoice_details = {};

    current_sale = {
        data: [],
        data_table: true,
        summary: true,
        summary_table: true,
        billing: true,
        sale_obj: true
    };

    cancelled_sale = {
        data: [],
        data_table: true,
        summary: true,
        summary_table: true,
        billing: true,
        stock_obj: true
    };
    
    return_sale = {
        data: [],
        data_table: true,
        summary: true,
        summary_table: true,
        billing: true,
        stock_obj: true
    };

    earlier_sale = {
        data: [],
        data_table: false,
        summary: false,
        summary_table: false,
        billing: false,
        sale_obj: false
    };

    return_sale = {...return_sale, ...stock_obj_methods};
    return_sale.data_table = return_sale_list_table;
    return_sale.summary_table = return_sale_summary_table;
    return_sale.includeMakingCostInSummary = true;

    cancelled_sale = {...cancelled_sale, ...sale_obj_methods};
    cancelled_sale.data_table = cancelled_sale_list_table;
    cancelled_sale.summary_table = cancelled_sale_summary_table;
    cancelled_sale.includeMakingCostInSummary = true;

    return_sale.sale_obj = cancelled_sale;
    cancelled_sale.stock_obj = return_sale;


    scanner_data = {
        method(action, barcode){
            return_sale.update_data(action, barcode);
        },
        checkItem(barcode){
           cancelled_sale.isItemExist(barcode);
        }
    }
}

function getCottonItems(){
    let items = [];
    return_sale.data.forEach(element => {
        if(element.is_cotton == "1"){
            items.push(element);
        }
    });

    return items;
}

function generateCottonBarcodes(itemsList){
    $("#barcodes-list").parent().parent().remove();
    
    $(`
    <div class="card d-none">
        <div class="wrapper">
            <div id="barcodes-list"></div>
        </div>
    </div>
    `).appendTo('body');

    let i = 1;
    itemsList.forEach(element =>{
        $('#barcodes-list').append(`
            <div class="barcode">
                <svg    id="barcode_${i}"
                        jsbarcode-width="1"
                        jsbarcode-height="20"
                        jsbarcode-textmargin="1"
                        jsbarcode-fontsize="10"
                        jsbarcode-fontoptions="bold"
                        jsbarcode-text=${element.barcode}-${element.retailer_cost}
                        jsbarcode-value=${element.barcode}
                ></svg>
            </div>`
        );
            
        JsBarcode(`#barcode_${i}`).init();

        $(`#barcode_${i} g`).attr('transform', 'translate(10, 4)');
        $(`#barcode_${i}`).append(`
            <g class="custom_data">
                <line x1="0" y1="38" x2="100%" y2="38" stroke="black"></line>
                <text style="font: 7px Arial; font-weight:600" x="5" y="45">${element.item}</text>
            </g>
        `);
        i++;
    });

    let barcodes_data = $('#barcodes-list div:nth-of-type(1)').parent().parent().html();
    $('#barcodes-list').empty();
    $('#barcodes-list').html(barcodes_data);
}

function order_return(){
    let current_invoice = {
        summary: current_sale.summary, 
        list: current_sale.data, 
        billing: current_sale.billing,
        no_of_units: sumPropertyValues(current_sale.summary, 'quantity')
    };

    if(return_sale.data.length){
        current_invoice.return_order = {summary: return_sale.summary, list: return_sale.data, billing: return_sale.billing};
    }

    let cancelled_invoice = {
        summary: cancelled_sale.summary, 
        list: cancelled_sale.data, 
        billing: cancelled_sale.billing,
        no_of_units: sumPropertyValues(cancelled_sale.summary, 'quantity')
    }

    let data_param = {
        action: "order_return",
        data: invoice_details,
        current_invoice: current_invoice,
        cancelled_invoice: cancelled_invoice
    }

    ajaxPostCall(`${LIB_API_ENDPOINT}/orders.php`, data_param, function(response){
        
        let modal_body; let modal_title = "Cancelling Sale Error";
        
        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            cancelled_sale.reset_cookie();
            
            smallModal(
                response.success_title,
                response.success_content,
                [   
                    {
                        "class": "ui positive approve button",
                        "id": "modalCloseBtn",
                        "text": "Okay",
                    },
                    {
                        "class": "ui negative deny button",
                        "id": "modalCloseBtn",
                        "text": "Close",
                    }
                ], 
                {
                    closable: false,
                    onApprove: function(){
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

function resetData(){

    initValues();

    $('input').val('');

    $("table tbody").empty('')

    $("table tfoot tr #sub_total").text('')
    $("table tfoot tr #tax").text('')
    $("table tfoot tr #total").text('')
    
    $("table tfoot tr#offer_row").remove();
}

function initInvoices(){
    $("#return_invoice")
    .add("#current_invoice")
    .add("#earlier_invoice")
    .addClass("loading");

    if(return_sale.data.length){
        /* -------------------- Begin: Return Order -------------------- */
            /* -------------------- Summary -------------------- */
        return_sale_summary_table.children("tbody").empty();
        return_sale_summary_table.children('tfoot').children("tr").children("#sub_total").text('')
        return_sale_summary_table.children('tfoot').children("tr").children("#tax").text('')
        return_sale_summary_table.children('tfoot').children("tr").children("#total").text('')
    
        for(let item of return_sale.summary){
            return_sale_summary_table
            .children("tbody")
            .append(`
                <tr data-item="${item.shortcode}_${item.unit_price}_${item.making_cost}">
                    <td class="slno collapsing"></td>
                    <td class="item_shortcode">${item.item}[${item.shortcode}]</td>
                    <td class="quantity right aligned collapsing">${item.quantity}</td>
                    <td class="unit_price right aligned collapsing">${item.unit_price}</td>
                    <td class="total_price right aligned collapsing">${item.total_price}</td>
                </tr>
            `)
        }
    
        return_sale_summary_table.children('tfoot').children("tr").children("#sub_total").text(return_sale.billing.sub_total)
        return_sale_summary_table.children('tfoot').children("tr").children("#tax").text(return_sale.billing.tax)
        return_sale_summary_table.children('tfoot').children("tr").children("#total").text(return_sale.billing.total)
    
            /* -------------------- List -------------------- */
        return_sale_list_table.children("tbody").empty();
        return_sale_list_table.children('tfoot').children("tr").children("#sub_total").text('')
        return_sale_list_table.children('tfoot').children("tr").children("#tax").text('')
        return_sale_list_table.children('tfoot').children("tr").children("#total").text('')
    
        for(let item of return_sale.data){
            return_sale_list_table
            .children("tbody")
            .append(`
                <tr data-barcode="${item.barcode}">
                    <td class="collapsing"></td>
                    <td>${item.item}[${item.shortcode}]</td>
                    <td>${item.barcode}</td>
                    <td class="right aligned collapsing">${item.unit_price}</td>
                    <td class="right aligned collapsing">
                        <!--<i class="large trash icon remove-item"></i>-->
                    </td>
                </tr>
            `)
        }
    
        return_sale_list_table.children('tfoot').children("tr").children("#sub_total").text(return_sale.billing.sub_total)
        return_sale_list_table.children('tfoot').children("tr").children("#tax").text(return_sale.billing.tax)
        return_sale_list_table.children('tfoot').children("tr").children("#total").text(return_sale.billing.total)
      }
      /* -------------------- End: Return Order -------------------- *    

    /* -------------------- Summary -------------------- */
    current_sale_summary_table.children("tbody").empty();
    current_sale_summary_table.children('tfoot').children("tr").children("#sub_total").text('')
    current_sale_summary_table.children('tfoot').children("tr").children("#tax").text('')
    current_sale_summary_table.children('tfoot').children("tr").children("#total").text('')

    for(let item of earlier_sale.summary){
        current_sale_summary_table
        .children("tbody")
        .append(`
            <tr data-item="${item.shortcode}_${item.unit_price}_${item.making_cost}">
                <td class="slno collapsing"></td>
                <td class="item_shortcode">${item.item}[${item.shortcode}]</td>
                <td class="quantity right aligned collapsing">${item.quantity}</td>
                <td class="unit_price right aligned collapsing">${item.unit_price}</td>
                <td class="total_price right aligned collapsing">${item.total_price}</td>
            </tr>
        `)
    }

    current_sale_summary_table.children('tfoot').children("tr").children("#sub_total").text(current_sale.billing.sub_total)
    current_sale_summary_table.children('tfoot').children("tr").children("#tax").text(current_sale.billing.tax)
    current_sale_summary_table.children('tfoot').children("tr").children("#total").text(current_sale.billing.total)


    /* -------------------- List -------------------- */
    current_sale_list_table.children("tbody").empty();
    current_sale_list_table.children('tfoot').children("tr").children("#sub_total").text('')
    current_sale_list_table.children('tfoot').children("tr").children("#tax").text('')
    current_sale_list_table.children('tfoot').children("tr").children("#total").text('')

    for(let item of earlier_sale.data){
        current_sale_list_table
        .children("tbody")
        .append(`
            <tr data-barcode="${item.barcode}">
                <td class="collapsing"></td>
                <td>${item.item}[${item.shortcode}]</td>
                <td>${item.barcode}</td>
                <td class="right aligned collapsing">${item.unit_price}</td>
                <td class="right aligned collapsing">
                    <!--<i class="large trash icon remove-item"></i>-->
                </td>
            </tr>
        `)
    }

    current_sale_list_table.children('tfoot').children("tr").children("#sub_total").text(current_sale.billing.sub_total)
    current_sale_list_table.children('tfoot').children("tr").children("#tax").text(current_sale.billing.tax)
    current_sale_list_table.children('tfoot').children("tr").children("#total").text(current_sale.billing.total)

    /* -------------------- Copy the Current Sale to Earlier Sale -------------------- */

    earlier_sale_summary_table.html(current_sale_summary_table.html())
    earlier_sale_list_table.html(current_sale_list_table.html())

    //because current invoice will not have the offer row
    //now have to add offer row to the earlier invoice
    earlier_sale_summary_table.children('tfoot').append(`
        <tr id="offer_row">
            <th></th>
            <th id="offer_percentage" class="right aligned" colspan="3">Offer(${current_sale.billing.offer_percentage}%)</th>
            <th id="offer_amount" class="right aligned">${current_sale.billing.offer_amount}</th>
        </tr>
    `);
    
    earlier_sale_list_table.children('tfoot').append(`
        <tr id="offer_row">
            <th></th>
            <th id="offer_percentage" class="right aligned" colspan="2">Offer(${current_sale.billing.offer_percentage}%)</th>
            <th id="offer_amount" class="right aligned">${current_sale.billing.offer_amount}</th>
            <th></th>
        </tr>
    `);

    current_sale_list_table
    .add(earlier_sale_list_table)
    .css("counter-reset", `DescendingSerial ${earlier_sale.data.length+1}`);

    /* -------------------- begin: ReInitialise Variable Values -------------------- */
    /* -------------------- end: ReInitialise Variable Values -------------------- */


    $("#return_invoice")
    .add("#current_invoice")
    .add("#earlier_invoice")
    .removeClass("loading");

    search_form.removeClass("loading");
}