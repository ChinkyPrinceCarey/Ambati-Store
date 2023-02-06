let fetch_barcode_form;
let input_id_or_barcode;
let tableDom;

$(function(){

    fetch_barcode_form = $("#fetch_barcode");
    input_id_or_barcode = $('input[name=input_id_or_barcode]');

    let searchParams = new URLSearchParams(window.location.search)
    let preRequestedBarcode = searchParams.get('data')
    if(preRequestedBarcode){
        input_id_or_barcode.val(preRequestedBarcode);
        setTimeout(function(){fetch_barcode_form.submit();}, 5);
    }
    
    tableDom = 
    "<'ui stackable grid'"+
        "<'row'"+
            "<'eight wide column'B>"+
        ">"+
        "<'row dt-table'"+
            "<'sixteen wide column'tr>"+
        ">"+
    ">";

    fetch_barcode_form
    .form({
		onSuccess: function(event, fields){
            event.preventDefault();
            requestData();
        },
        onFailure: function(formErrors, fields){
            console.log(formErrors, fields);
        }
    });
});

function resetData(){
    $("main .card.item-card, main .ui.horizontal.divider.header").remove();
}

function requestData(){
    fetch_barcode_form.children("button").addClass("loading");
    let data_param = {
        action: "barcode_history",
        data: input_id_or_barcode.val()
    }

    ajaxPostCall(`${LIB_API_ENDPOINT}/warehouse_stock_reports.php`, data_param, function(response){
        let modal_body; let modal_title = "Parsing Item Data Error";
        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            if(response.data.length && response.data[0].length){
                resetData();
                response.data.forEach(element => {
                    if(element[0].action == "in_stock"){
                        //move the object to the end of the array
                        elementToMove = element[0];
                        element.splice(0, 1);
                        element.push(elementToMove);
                    }
                    initPrimaryDetails(element);
                    initDataTable(element);
                });
                $(".card.item-card input[type='checkbox']").prop("checked", true)
            }else{
                modal_title = "Barcode Never Existed";
                modal_body = `<b>${input_id_or_barcode.val()}</b> seems invalid`;
            }
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

        fetch_barcode_form.children("button").removeClass("loading");
    });
}

function initPrimaryDetails(data){
    let inStock = data[data.length - 1].action == "in_stock" ? true : false;

    let html_content = 
    `
    <h4 class="ui horizontal divider header">
        <i class="angle double down icon"></i>
    </h4>
    <div class="card item-card">
        <div class="wrapper" style="padding-bottom: 20px;">
            <h3 class="ui dividing header center ${inStock ? "green" : "red"}"><div class="ui horizontal label ${inStock ? "green" : "red"}">${inStock ? "In-Stock" : "Out-Stock"}</div> | ${data[0].item} | ${data[0].shortcode} | ${data[0].barcode}</h3>
            <input type="checkbox" name="item_toggle_${data[0].barcode}" id="item_toggle_${data[0].barcode}">
            <label for="item_toggle_${data[0].barcode}"></label>
            <div class="content">
                <div class="item-primary-details">
                    <div class="ui steps">
                        <div class="step">
                            <i class="address book icon"></i>
                            <div class="content">
                            <div class="title">${data[0].generate_id}</div>
                            <div class="description">Generate Id</div>
                            </div>
                        </div>
                        <div class="step">
                            <i class="calendar alternate icon"></i>
                            <div class="content">
                            <div class="title">${data[0].date}</div>
                            <div class="description">Stock Entry Date</div>
                            </div>
                        </div>
                        <div class="step">
                            <i class="money bill alternate icon"></i>
                            <div class="content">
                            <div class="title"><sup>₹</sup>${data[0].making_cost}</div>
                            <div class="description">Making Cost</div>
                            </div>
                        </div>
                        <div class="step">
                            <i class="docker icon"></i>
                            <div class="content">
                            <div class="title">${data[0].is_cotton == "1" ? "YES" : "NO"}</div>
                            <div class="description">Is Cotton Entry?</div>
                            </div>
                        </div>
                        <div class="step">
                            <i class="docker icon"></i>
                            <div class="content">
                            <div class="title">${data[data.length - 1].is_cotton == "1" ? "YES" : "NO"}</div>
                            <div class="description">Now Cotton?</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="ui horizontal divider violet">
                    Detailed History
                </div>
                <div class="detailed-history">
                    <table class="ui celled striped violet table" id="table_${data[0].barcode}">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Action</th>
                                <th>Making Cost</th>
                                <th>Unit Price</th>
                                <th>Profit Amt(%)</th>
                                <th>Sold Type</th>
                                <th>Sold Id</th>
                                <th>Is Cotton</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    `;

    $("main").append(html_content);
}

function initDataTable(dataArr){
    if(dataArr[dataArr.length - 1].action == "in_stock"){
        if(dataArr.length > 1){
            dataArr[dataArr.length - 1].row_date = dataArr[dataArr.length - 2].row_date;
        }
    }

    table = $(`table#table_${dataArr[0].barcode}`).DataTable({
        responsive: true,
        processing: true,
        serverSide: false, /* this will affect working of filtering */
        autoWidth: true, /* true => disables width calc hence saves optimisation  */
        select: true,
        select: {
            style: 'os',
            className: 'primary'
        },
        dom: tableDom,
        paging: false,
        ordering: false,
        rowId: 'row_id',
        data: dataArr,
        columns: [
            {
                data: "row_date",
                render: function(data, type, row){
                    return `<div class="ui blue basic label">${data}</div>`;
                }
            },
            {
                data: "action",
                render: function(data, type, row){
                    return  `<div class="ui purple horizontal label">${data}</div>`;
                }
            },
            {data: "making_cost"},
            {data: "unit_price"},
            {
                data: "profit",
                render: function(data, type, row){
                    unit_price = get_decimal(row.unit_price);
                    if(unit_price){
                        making_cost = get_decimal(row.making_cost);
                        profit_amt = get_decimal(unit_price - making_cost);
                        profit_percentage = get_decimal(((profit_amt)/unit_price) * 100)
                        return `${profit_amt}(${profit_percentage}%)`;
                    }else{
                        return '';
                    }
                }
            },
            {data: "sold_type", width: "8%"},
            {data: "sold_id", width: "8%"},
            {
                data: "is_cotton", 
                width: "4%",
                render: function(data, type, row){
                    return parseInt(data) == 1 ? "YES" : "NO";
                }
            }
        ]
    });
}