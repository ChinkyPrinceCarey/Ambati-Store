let get_data_form;
let print_barcode_btn;

$(function(){
    $("span#date").text(getCurrentDate("dmy"));

    get_data_form = $("#get_data");
    print_barcode_btn = $("#print_barcode_btn");
    print_barcode_btn.addClass("disabled");

    let searchParams = new URLSearchParams(window.location.search)
    let preRequestedBarcode = searchParams.get('barcode')
    if(preRequestedBarcode){
        $('input[name=input_id_or_barcodes]').val(preRequestedBarcode);
        setTimeout(function(){get_data_form.submit();}, 5);
    }

    get_data_form
    .form({
		onSuccess: function(event, fields){
            event.preventDefault();
            
            print_barcode_btn.addClass("disabled");
            
            let input_id_or_barcodes = fields.input_id_or_barcodes;

            let data_param = {
                action: "fetch_barcodes",
                type: getFetchType(input_id_or_barcodes),
                data: input_id_or_barcodes.includes(",") || parseInt(input_id_or_barcodes) != input_id_or_barcodes ? input_id_or_barcodes.split(",") : input_id_or_barcodes
            }

            ajaxPostCall(`${LIB_API_ENDPOINT}/warehouse_stock_reports.php`, data_param, function(response){
                let modal_body; let modal_title = "Parsing Item Data Error";
                if(response.status){
                    modal_body = response.status + ": " + response.statusText;
                }else if(response.title){
                    modal_title = response.title;
                    modal_body = response.content;
                }else if(response.result){
                    print_barcode_btn.removeClass("disabled");
                    $("#generated_id").text(response.data[0].generate_id);
                    
                    let isCottonPrint = false;
                    if(getFetchType(input_id_or_barcodes) == "generated_id"){
                        isCottonPrint = response.data[0].is_cotton == "1";
                    }
                    populateBarcodes(response.data, isCottonPrint);
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
    });

    print_barcode_btn.on('click', function(){
        print_barcode_btn.addClass("loading")
        printLabels(function(isCompleted){
            print_barcode_btn.removeClass("loading");
        });
    })
});

function getFetchType(fetch_data){
    if(fetch_data.includes("-")){
        return "barcode_series";
    }else if(
            (fetch_data.includes(","))
        ||  (parseInt(fetch_data) != fetch_data)
    ){
        return "barcodes";
    }else{
        return "generated_id";
    }
}

function populateBarcodes(data, isCottonPrint){
    $('#barcodes-list').empty();
    let custom_data = data[0].custom_data;
    if(isCottonPrint){
        let cottonDate = data[0].date.split("-");
        cottonDate = `${cottonDate[2]}${cottonDate[1]}`;
        let dataLength = data.length - 1;
        $('#barcodes-list').append(`
        <div class="barcode">
            <svg    id="barcode_1"
                    jsbarcode-width="1"
                    jsbarcode-height="20"
                    jsbarcode-textmargin="1"
                    jsbarcode-fontsize="10"
                    jsbarcode-fontoptions="bold"
                    jsbarcode-text=${data[0].generate_id}
                    jsbarcode-value=${data[0].generate_id}
            ></svg>
        </div>
        `);
        JsBarcode(`#barcode_1`).init();

        //adding custom_data
        $(`#barcode_1 g`).attr('transform', 'translate(10, 4)');
        $(`#barcode_1`).append(`
            <g class="custom_data">
                <line x1="0" y1="38" x2="100%" y2="38" stroke="black"></line>
                <text style="font: 7px Arial; font-weight:600" x="5" y="45">${cottonDate}${data[0].shortcode}${data[0].item_number}-${data[dataLength].item_number}</text>
            </g>
        `);
    }else{
        for(let item of data){
            $('#barcodes-list').append(
                `<div class="barcode"><svg id="barcode_${item.item_number}"
                    jsbarcode-width="1"
                    jsbarcode-height="20"
                    jsbarcode-textmargin="1"
                    jsbarcode-fontsize="10"
                    jsbarcode-fontoptions="bold"
                    jsbarcode-text=${item.barcode}-${item.retailer_cost}
                    jsbarcode-value=${item.barcode}
                >
                </svg></div>`);  
            JsBarcode(`#barcode_${item.item_number}`).init();

            //add Custom Data
            if(custom_data){
                $(`#barcode_${item.item_number} g`).attr('transform', 'translate(10, 5)');
                $(`#barcode_${item.item_number}`).append(`
                    <g class="custom_data">
                        <line x1="0" y1="40" x2="100%" y2="40" stroke="black"></line>
                        <text style="font: 7px Arial; font-weight:600" x="5" y="49">${custom_data}</text>
                    </g>
                `);
            }
        }
    }

    //if any custom data added to svg
    //those are will not be visible
    //so appending again completely
    if(isCottonPrint || custom_data){
        let barcodes_data = $("#barcodes-list div:nth-of-type(1)").parent().html();
        $('#barcodes-list').empty();
        $('#barcodes-list').html(barcodes_data);
    }
}