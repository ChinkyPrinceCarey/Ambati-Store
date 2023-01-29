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
let order_payment_btn;

let order_details;
let order_summary_before;
let order_summary_after;

let table_items_list;
let table_items_summary;

$(function(){

    $("span#date").text(getDate("d-m-y"));

    table_items_list = $("#items-list");
    table_items_summary = $("#items-summary");

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
    order_payment_btn = $("#order_payment_btn");

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

      let order_id = input_order_id.val();
      resetData();
      if(order_id){
        data_param = {
            action: "fetch_order",
            type: "order_id",
            data: order_id
        }
        ajaxPostCall(`${LIB_API_ENDPOINT}/orders.php`, data_param, function(response){
            let modal_body; let modal_title = "Parsing Order Error";
            if(response.status){
                modal_body = response.status + ": " + response.statusText;
            }else if(response.title){
                modal_title = response.title;
                modal_body = response.content;
            }else if(response.result){
                if(response.data.length > 1){
                    modal_title = "Fetching Order";
                    modal_body = "More than one order fetched";
                }else if(response.data.length == 0){
                    modal_title = "Fetching Order";
                    modal_body = "Invalid Order Id#";
                }else{
                    let order_data = response.data[0];
                    if(parseInt(order_data.is_confirmed)){
                      order_details = JSON.parse(JSON.stringify(order_data));
                      
                      input_order_id.val(order_details.order_id);
                      input_username.val(order_details.username);
                      input_name.val(order_details.name);
                      input_mobile_number.val(order_details.mobile_number);
                      input_address.val(order_details.address);
                      
                      initOrder();
                      order_fields.show();
                      save_details_btn.show();
                      if(parseInt(order_details.is_paid)){
                        order_payment_btn.children("span").text("AMOUNT PAID");
                        order_payment_btn.addClass("disabled");
                      }
                    }else{
                      modal_title = "Fetching Order";
                      modal_body = "Order is not confirmed yet";
                    }
                }
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
                          search_form.removeClass("loading");
                          return true;
                      }
                  }
              );
            }
        });
      }else{
          smallModal(
            'Empty Order Id when Searching', 
            "Enter Order Id", 
            [
              {
                "class": "ui positive approve button",
                "id": "",
                "text": "Okay"
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
        save_details_btn.hide();

        search_order_btn.hide();

        edit_details_btn.show();
        order_payment_btn.show();

        input_order_id.parent().addClass('disabled opacity-1');
    });

    edit_details_btn.on('click', function(){
        smallModal(
            "Confirm?", 
            "Are you sure would you like to search another Order Id#?", 
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
                  resetData();
                  return true;
                },
                onDeny: function(){
                    return true;
                }
            }
        );
    });

    order_payment_btn.on('click', function(){
        if(parseInt(order_details.is_paid)){
            smallModal(
                "Order Payment has been paid", 
                "Something went wrong, it looks like Order Payment has already paid",
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
            order_payment();
        }
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
    order_payment_btn.hide();

    order_details = {};

    clearTables();
}

function initValues(){
}

function order_payment(){
    data_param = {
        action: "order_payment",
        data: order_details.order_id
    }

    ajaxPostCall(`${LIB_API_ENDPOINT}/orders.php`, data_param, function(response){
        let modal_body; let modal_title = "Parsing Error";
        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            smallModal(
                "Order Payment Successful",
                `
                Order Id# ${order_details.order_id}
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
                            printInvoice($("#order-items-summary").parent(), "summary", response, function(isCompleted){
                                $("#printInvoiceSummaryBtn").removeClass("loading");
                            });
                        }else if(buttonId == "printInvoiceListBtn"){
                            $("#printInvoiceListBtn").addClass("loading");
                            printInvoice($("#order-items-list").parent(), "list", response, function(isCompleted){
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
    let tables = table_items_summary
                .add(table_items_list);

    tables.children("tbody").empty();
    
    tables.children('tfoot').children("tr").children("#sub_total").text('');
    tables.children('tfoot').children("tr").children("#tax").text('');
    tables.children('tfoot').children("tr").children("#total").text('');
}

function initOrder(){
  $("#order_items_list").addClass("loading");
  $("#order_items_summary").addClass("loading");

  /* -------------------- Summary -------------------- */
  clearTables();

  for(let item of order_details.items_details.summary){
    table_items_summary
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

  table_items_summary.children('tfoot').children("tr").children("#sub_total").text(order_details.items_details.billing.sub_total)
  table_items_summary.children('tfoot').children("tr").children("#tax").text(order_details.items_details.billing.tax)
  table_items_summary.children('tfoot').children("tr").children("#total").text(order_details.items_details.billing.total)

  for(let item of order_details.items_details.list){
    table_items_list
    .children("tbody")
    .append(`
        <tr data-barcode="${item.barcode}">
            <td class="collapsing"></td>
            <td>${item.item}[${item.shortcode}]</td>
            <td>${item.barcode}</td>
            <td class="right aligned collapsing">${item.unit_price}</td>
            <td class="right aligned collapsing"></td>
        </tr>
    `)
  }

  table_items_list.children('tfoot').children("tr").children("#sub_total").text(order_details.items_details.billing.sub_total)
  table_items_list.children('tfoot').children("tr").children("#tax").text(order_details.items_details.billing.tax)
  table_items_list.children('tfoot').children("tr").children("#total").text(order_details.items_details.billing.total)

  table_items_list.css("counter-reset", `DescendingSerial ${order_details.items_details.list.length+1}`);

  $("#order_items_list").removeClass("loading");
  $("#order_items_summary").removeClass("loading");
  search_form.removeClass("loading");
}