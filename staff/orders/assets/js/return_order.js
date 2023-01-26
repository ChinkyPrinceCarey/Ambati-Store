let barcode_icon;
let search_order_btn;
let search_form;

let input_order_id;

let order_fields;
let input_date;
let input_username;
let input_name;
let input_mobile_number;
let input_address;

let return_order_btn;

let invoice_details;

var earlier_sale;
let earlier_sale_summary_table;
let earlier_sale_list_table;
let earlier_sale_billing_table;

let return_sale;
let return_sale_summary_table;
let return_sale_list_table;
let return_sale_billing_table;

let current_sale;
let current_sale_summary_table;
let current_sale_list_table;
let current_sale_billing_table;


let selected_sale_type = "retailer";

let track;

$(function(){

    $("span#date").text(getCurrentDate("dmy"));

    barcode_icon = $(".barcode.icon");

    barcode_icon.on('click', function(){
        ScannerCamera($(this));
    });

    $("#scanner").hide();

    $(".torch i").on('click', function(){
        if(!track){
            track = Quagga.CameraAccess.getActiveTrack();
        }

        if($(this).hasClass("on")){
            $(this).removeClass("on");
            track.applyConstraints({advanced: [{torch: false}]});
        }else{
            $(this).addClass("on");
            track.applyConstraints({advanced: [{torch: true}]});
        }
    });

    earlier_sale_summary_table = $("#earlier_invoice .card .wrapper div table#sale-summary");
    earlier_sale_list_table = $("#earlier_invoice .card .wrapper div table#sale-list");
    earlier_sale_billing_table =    earlier_sale_summary_table.children('tfoot')
                                        .add(earlier_sale_list_table.children('tfoot'));

    return_sale_summary_table = $("#return_invoice .card .wrapper div table#sale-summary");
    return_sale_list_table = $("#return_invoice .card .wrapper div table#sale-list");
    return_sale_billing_table =  return_sale_summary_table.children('tfoot')
                                        .add(return_sale_list_table.children('tfoot'));

    current_sale_summary_table = $("#current_invoice .card .wrapper div table#sale-summary");
    current_sale_list_table = $("#current_invoice .card .wrapper div table#sale-list");
    current_sale_billing_table = current_sale_summary_table.children('tfoot')
                                    .add(current_sale_list_table.children('tfoot'));
    
    search_form = $("#search_form");
    input_order_id = $("#order_id");
    search_order_btn = $("#search_order_btn");

    order_fields = $("#order_fields");

    input_date = $("#input_date");
    input_username = $("#username");
    input_name = $("#name");
    input_mobile_number = $("#mobile_number");
    input_address = $("#address");
    
    return_order_btn = $("#return_order_btn");

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
        ajaxPostCall(`${API_ENDPOINT}/lib/orders.php`, data_param, function(response){
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
                  let invoice_data = response.data[0];
                  if(!parseInt(invoice_data.is_confirmed)){
                    smallModal(
                      "Order is not confirmed", 
                      "You can't return items because the Order is not confirmed yet!", 
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
                              window.location.replace(getCurrentPage());
                              return false;
                          }
                      }
                    );

                    scanner_state.reason = "Order Data Parsed Successfully, however Order is not confirmed!";
                  }else{
                    invoice_details = JSON.parse(JSON.stringify(invoice_data));
                    delete invoice_details.items_details;

                    input_date.val(invoice_details.date);
                    input_order_id.val(invoice_details.order_id);
                    input_username.val(invoice_details.username);
                    input_name.val(invoice_details.name);
                    input_mobile_number.val(invoice_details.mobile_number);
                    input_address.val(invoice_details.address);
                    
                    if('return_order' in invoice_data.items_details){
                        return_sale.data = invoice_data.items_details.return_order.list;
                        return_sale.summary = invoice_data.items_details.return_order.summary;
                        return_sale.billing = invoice_data.items_details.return_order.billing;
                    }

                    current_sale.data = invoice_data.items_details.list;
                    current_sale.summary = invoice_data.items_details.summary;
                    current_sale.billing = invoice_data.items_details.billing;

                    earlier_sale.data = JSON.parse(JSON.stringify(current_sale.data));
                    earlier_sale.summary = JSON.parse(JSON.stringify(current_sale.summary));
                    earlier_sale.billing = JSON.parse(JSON.stringify(current_sale.billing));

                    initInvoices();
                    return_order_btn.show();
                    order_fields.show();
                    barcode_icon.show();

                    //removing the offer for current sale
                    current_sale.billing.offer_percentage = 0;
                    current_sale.billing.offer_amount = 0;

                    scanner_state.isEnabled = true;
                    scanner_state.reason = "Invoice Data Parsed Successfully";

                    return_sale.cookie_name = `order_return_${order_id}`;
                    return_sale.initCookieData();
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

    return_order_btn.on('click', function(){
        if((earlier_sale.data.length == current_sale.data.length)){
            smallModal(
                "No changes", 
                "No items are scanned",
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

function ScannerCamera(param1){
    let type;
    if(typeof param1 == "object"){
        if(param1.hasClass("strike")){
            type = "stop";
        }else{
            type = "start";
        }
    }else{
        type = param1;
    }

    if(type == "start"){
        //camera start
        $("#scanner").show().parent().addClass("camera-enabled");

        barcode_icon.addClass("strike");

        Quagga.init({
            inputStream : {
              name : "Live",
              type : "LiveStream",
              target: "#scanner .camera",
            },
            //frequency: "1",
            decoder : {
              readers : ["code_128_reader"]
            }
          }, function(err) {
              if (err) {
                  console.log(err);
                  return
              }
              console.log("Initialization finished. Ready to start");
              Quagga.start();
              Quagga.onDetected(function(data){
                if(!barcode_input.val()){
                    correctBarcodeExpression = /^(\d)([A-Za-z0-9]*)\d$/;
                    if(new RegExp(correctBarcodeExpression).test(data.codeResult.code)){
                        $("#barcode_input").val(data.codeResult.code);
                        sound_notification("scanned");
                    }
                }
              });
        });
    }else{
        $("#scanner").hide().parent().removeClass("camera-enabled");

        barcode_icon.removeClass("strike");
        Quagga.stop();
    }
}

function resetData(){
    order_fields.hide();
    return_order_btn.hide();
    barcode_icon.hide();

    $("#details h4.header span").text('');
    initValues();

    $('input').val('');

    $("table tbody").empty('')

    $("table tfoot tr #sub_total").text('')
    $("table tfoot tr #tax").text('')
    $("table tfoot tr #total").text('')
    
    $("table tfoot tr#offer_row").remove();
}

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

  current_sale = {...current_sale, ...stock_obj_methods};
  current_sale.data_table = current_sale_list_table;
  current_sale.summary_table = current_sale_summary_table;
  current_sale.includeMakingCostInSummary = true;
  current_sale.trashIconForActionAdd = true;
  current_sale.trashIconForActionClass = "return-item";

  return_sale = {...return_sale, ...sale_obj_methods};
  return_sale.data_table = return_sale_list_table;
  return_sale.summary_table = return_sale_summary_table;
  return_sale.includeMakingCostInSummary = true;

  current_sale.sale_obj = return_sale;
  return_sale.stock_obj = current_sale;


  scanner_data = {
      method(action, barcode){
          current_sale.update_data(action, barcode);
      },
      checkItem(barcode){
         return_sale.isItemExist(barcode);
      },
      offer_dialogue(){
        offer_dialogue(return_items, return_sale, false,
          {title: "Verify and Confirm Return", desc: "Return Items Overview", primary_btn_title: "Return Items"}, 
          {
            show_items_summary: true,
            show_items_units: true,
            show_total: true,
            show_making_cost: false,
            show_sub_total: false,
            show_tax: false,
            show_profit: false
          }
        );
      },
      remove_offer(){
          remove_offer(return_sale);
      }
  }
}

function return_items(){
    let current_order = {summary: current_sale.summary, list: current_sale.data, billing: current_sale.billing};
    let return_order = {summary: return_sale.summary, list: return_sale.data, billing: return_sale.billing};
    let combine_order = current_order;

    if(return_order.list.length){
        combine_order.return_order = return_order;
    }

    data_param = {
        action: "return_order_mobile",
        order_id: invoice_details.order_id,
        order_data: invoice_details,
        data: {
          no_of_items: current_order.summary.length,
          no_of_units: current_order.list.length,
          making_cost: current_order.billing.making_cost,
          sub_total: current_order.billing.sub_total,
          total_price: current_order.billing.total,
          items_details: JSON.stringify(combine_order)
        }
    }

    ajaxPostCall(`${API_ENDPOINT}/lib/orders.php`, data_param, function(response){
        let modal_body; let modal_title = "Parsing Error";
        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            return_sale.reset_cookie();
            smallModal(
                "Order Return Successful",
                `
                <p>Order Id#: <b>${response.order_id}</b></p>
                `,
                [
                    {
                        "class": "ui negative deny button",
                        "id": "modalCloseBtn",
                        "text": "Close",
                    }
                ], 
                {
                    closable: false,
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

function initTrackingId(){
    let itemsShortcode = [];
    table_order_summary_before.children("tbody").children("tr").each(function(){
        itemsShortcode.push($(this).data("shortcode"));
    });

    if(itemsShortcode.length){
        data_param = {
            action: "fetch_tracking_id",
            data: itemsShortcode
        }
    
        ajaxPostCall(`${API_ENDPOINT}/lib/items.php`, data_param, function(response){
            let modal_body; let modal_title = "Parsing Error";
            if(response.status){
                modal_body = response.status + ": " + response.statusText;
            }else if(response.title){
                modal_title = response.title;
                modal_body = response.content;
            }else if(response.result){
                response.data.forEach(element => {
                   $(`tr[data-shortcode='${element.shortcode}']`)
                   .find("td.tracking_id")
                   .text(element.tracking_id);
                });
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
}

$(document).on('click', '.return-item', function(){
  let selected_barcode = $(this).parent().parent().data('barcode');
  scanner_data.method("remove", selected_barcode);
})

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
                    <i class="large trash icon remove-item"></i>
                </td>
            </tr>
        `)
    }

    return_sale_list_table.children('tfoot').children("tr").children("#sub_total").text(return_sale.billing.sub_total)
    return_sale_list_table.children('tfoot').children("tr").children("#tax").text(return_sale.billing.tax)
    return_sale_list_table.children('tfoot').children("tr").children("#total").text(return_sale.billing.total)
  }
  /* -------------------- End: Return Order -------------------- *
  

  /* -------------------- Current Order Summary -------------------- */
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


  /* -------------------- Current Order List -------------------- */
  current_sale_list_table.children("tbody").empty();
  current_sale_list_table.children('tfoot').children("tr").children("#sub_total").text('')
  current_sale_list_table.children('tfoot').children("tr").children("#tax").text('')
  current_sale_list_table.children('tfoot').children("tr").children("#total").text('')

  for(let item of current_sale.data){
      current_sale_list_table
      .children("tbody")
      .append(`
          <tr data-barcode="${item.barcode}">
              <td class="collapsing"></td>
              <td>${item.item}[${item.shortcode}]</td>
              <td>${item.barcode}</td>
              <td class="right aligned collapsing">${item.unit_price}</td>
              <td class="right aligned collapsing">
                  <i class="large trash icon return-item"></i>
              </td>
          </tr>
      `)
  }

  current_sale_list_table.children('tfoot').children("tr").children("#sub_total").text(current_sale.billing.sub_total)
  current_sale_list_table.children('tfoot').children("tr").children("#tax").text(current_sale.billing.tax)
  current_sale_list_table.children('tfoot').children("tr").children("#total").text(current_sale.billing.total)

   /* -------------------- Earlier Order List -------------------- */
   earlier_sale_list_table.children("tbody").empty();
   earlier_sale_list_table.children('tfoot').children("tr").children("#sub_total").text('')
   earlier_sale_list_table.children('tfoot').children("tr").children("#tax").text('')
   earlier_sale_list_table.children('tfoot').children("tr").children("#total").text('')
 
   for(let item of earlier_sale.data){
    earlier_sale_list_table
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
 
   earlier_sale_list_table.children('tfoot').children("tr").children("#sub_total").text(earlier_sale.billing.sub_total)
   earlier_sale_list_table.children('tfoot').children("tr").children("#tax").text(earlier_sale.billing.tax)
   earlier_sale_list_table.children('tfoot').children("tr").children("#total").text(earlier_sale.billing.total)

  /* -------------------- Copy the Current Sale to Earlier Sale -------------------- */
  earlier_sale_summary_table.html(current_sale_summary_table.html())
  
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