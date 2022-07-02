let selected_sale_type;

let restore_stock_btn;

let scanned_data_table_summary;
let scanned_data_table_list;
let scanned_data_table_billing;
let scanned_data = {};

let unscanned_data_table_summary;
let unscanned_data_table_list;
let unscanned_data_table_billing;
let unscanned_data = {};

$(function(){

    $("span#date").text(getCurrentDate("dmy"));

    scanned_data_table_summary = $("#scanned_data .card .wrapper div table#sale-summary");
    scanned_data_table_list = $("#scanned_data .card .wrapper div table#sale-list");
    scanned_data_table_billing = scanned_data_table_summary.children('tfoot')
                                    .add(scanned_data_table_list.children('tfoot'))

    unscanned_data_table_summary = $("#unscanned_data .card .wrapper div table#sale-summary");
    unscanned_data_table_list = $("#unscanned_data .card .wrapper div table#sale-list");
    unscanned_data_table_billing = unscanned_data_table_summary.children('tfoot')
                                    .add(unscanned_data_table_list.children('tfoot'))

    selected_sale_type = "dump";

    restore_stock_btn = $("#restore_stock_btn");
    
    initLoadStock("fetch_all", "stock_dump", function(dump_stock_data){
        unscanned_data.data = dump_stock_data;
        initLoadStock("summary_data", "stock_dump", function(dump_stock_summary){
            unscanned_data.summary = dump_stock_summary;
            initLoadStock("billing_data", "stock_dump", function(dump_stock_billing){
                unscanned_data.billing = dump_stock_billing[0];

                initTables();
                initValues();

                scanner_state.isEnabled = true;
                scanner_state.reason = 'Dump Stock Loaded';
                restore_stock_btn.removeClass('disabled');
            });
        });
    });

    restore_stock_btn.on('click', function(){
        if(!scanned_data.data.length){
            smallModal(
                "No Stock to Retore", 
                "It seems no items are scanned for restore",
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
    });
});

function initValues(){
    //unscanned_data ==> sale
    //scanned_data ==>stock

    scanned_data = {
        data: [],
        data_table: true,
        summary: true,
        summary_table: true,
        billing: true
    }

    scanned_data = {...scanned_data, ...sale_obj_methods};
    scanned_data.data_table = scanned_data_table_list;
    scanned_data.summary_table = scanned_data_table_summary;

    unscanned_data = {...unscanned_data, ...stock_obj_methods};
    unscanned_data.data_table = unscanned_data_table_list;
    unscanned_data.summary_table = unscanned_data_table_summary;

    unscanned_data.sale_obj = scanned_data;
    scanned_data.stock_obj = unscanned_data;

    scanner_data = {
        method(action, barcode){
          unscanned_data.update_data(action, barcode);
        },
        checkItem(barcode){
          scanned_data.isItemExist(barcode);
        },
        offer_dialogue(){
            offer_dialogue(
                restore_stock, 
                scanned_data, 
                false,
                {title: "Verify and Confirm Restore Stock", desc: "Restore Stock Overview", primary_btn_title: "Restore Stock"}
            );
        },
        evaluateOffer(input_id){
            evaluateOffer(input_id, scanned_data);
        },
        remove_offer(){
            remove_offer(scanned_data);
        }
    }

    scanned_data.cookie_name = "restore_scan_all";
    scanned_data.initCookieData();
}

function initLoadStock(_type, _table, callback){
    ajaxPostCall("lib/warehouse_stock_reports.php", {action: _type, table: _table, data: ["something_random"]}, function(response){
        let modal_title = "Loading Stock Error";
        let modal_body = null;

        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            callback(response.data);
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

function initTables(){
    $("#scanned_data")
    .add("#unscanned_data")
    .addClass("loading");

    /* -------------------- begin: Summary -------------------- */
    for(let item of unscanned_data.summary){
        unscanned_data_table_summary
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

    unscanned_data_table_summary.children('tfoot').children("tr").children("#sub_total").text(unscanned_data.billing.sub_total)
    unscanned_data_table_summary.children('tfoot').children("tr").children("#tax").text(unscanned_data.billing.tax)
    unscanned_data_table_summary.children('tfoot').children("tr").children("#total").text(unscanned_data.billing.total)
    /* -------------------- end: Summary -------------------- */

    /*-------------------- begin: List --------------------*/
    for(let item of unscanned_data.data){
        item.unit_price = item.retailer_cost;
        unscanned_data_table_list
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

    unscanned_data_table_list.children('tfoot').children("tr").children("#sub_total").text(unscanned_data.billing.sub_total)
    unscanned_data_table_list.children('tfoot').children("tr").children("#tax").text(unscanned_data.billing.tax)
    unscanned_data_table_list.children('tfoot').children("tr").children("#total").text(unscanned_data.billing.total)
    
    unscanned_data_table_list
    .css("counter-reset", `DescendingSerial ${unscanned_data.data.length+1}`);
    /*-------------------- end: List -------------------- */

    $("#scanned_data")
    .add("#unscanned_data")
    .removeClass("loading");
}

function restore_stock(){
    data_param = {
        action: "restore_stock",
        data: JSON.stringify(scanned_data.data)
    }

    ajaxPostCall('lib/warehouse_stock_reports.php', data_param, function(response){

        let modal_body; let modal_title = "Data Error";
        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            scanned_data.reset_cookie();
            smallModal(
                "Stock Restore Successful",
                `
                <p>Total No.# of items are restored <b>${scanned_data.data.length}</b></p>
                <table>
                    <tr>
                        <td>Total Price of</td>
                        <td><b>${scanned_data.billing.total.toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Total Making Cost of</td>
                        <td><b>${scanned_data.billing.making_cost.toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Profit of</td>
                        <td><b>${(scanned_data.billing.total - scanned_data.billing.making_cost).toFixed(2)}</b></td>
                    </tr>
                </table>
                `,
                [
                    {
                        "class": "ui approve medium violet button",
                        "id": "printInvoiceSummaryBtn",
                        "text": "Print Summary",
                    },
                    {
                        "class": "ui approve pink button",
                        "id": "printInvoiceListBtn",
                        "text": "Print List",
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