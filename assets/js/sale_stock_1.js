let seller_dropdown;
let sale_type_dropdown;

let save_details_btn;
let edit_details_btn;
let sale_stock_btn;

let selected_seller_id;
let selected_seller_name;

let custom_fields;
let custom_name;
let custom_id;

let customer_name;
let customer_village;
let customer_details;

let selected_sale_type;

let stock_data = [];

$(function(){

    $("span#date").text(getCurrentDate("dmy"));

    seller_dropdown = $(".dropdown.seller-dropdown"); //$("#seller_dropdown");
    sale_type_dropdown = $(".dropdown.sale-type-dropdown"); //$("#sale_type_dropdown");

    custom_fields = $("#custom_fields");
    custom_name = $("#custom_name");
    custom_id = $("#custom_id");

    custom_fields.hide();

    customer_name = $("#customer_name");
    customer_village = $("#customer_village");
    customer_details = $("#customer_details");

    save_details_btn = $("#save_details_btn");
    edit_details_btn = $("#edit_details_btn");
    sale_stock_btn = $("#sale_stock_btn");

    edit_details_btn.hide();
    sale_stock_btn.hide();

    initLoadStock();

    initSellersOpts();

    sale_type_dropdown.dropdown({
        onChange: saleTypeOnChange
        }
    );

    save_details_btn.on('click', function(){
        let selected_seller_text = seller_dropdown.dropdown('get text');
        let selected_sale_type_text = sale_type_dropdown.dropdown('get text');
        if(selected_seller_text == "Select Seller"){

            scanner_state.isEnabled = false;
            scanner_state.reason = 'Seller not selected';

            smallModal(
                scanner_state.reason, 
                "Select a Seller", 
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
        }else if(selected_sale_type_text == "Select Sale Type"){

            scanner_state.isEnabled = false;
            scanner_state.reason = 'Sale Type not selected';

            smallModal(
                scanner_state.reason,
                "Select a Sale Type", 
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
            scanner_state.isEnabled = true;
            scanner_state.reason = 'Details are saved';

            custom_id.parent().addClass("disabled");
            custom_name.parent().addClass("disabled");

            seller_dropdown.addClass("disabled");
            sale_type_dropdown.addClass("disabled");
            
            customer_name.parent().addClass("disabled");
            customer_village.parent().addClass("disabled");
            customer_details.parent().addClass("disabled");
            
            save_details_btn.hide();

            edit_details_btn.show();
            sale_stock_btn.show();
        }
    });

    edit_details_btn.on('click', function(){
        scanner_state.isEnabled = false;
        scanner_state.reason = 'Details are not saved after clicking on edit';

        custom_id.parent().removeClass("disabled");
        custom_name.parent().removeClass("disabled");

        save_details_btn.show();
        seller_dropdown.removeClass("disabled");
        customer_name.parent().removeClass("disabled");
        customer_village.parent().removeClass("disabled");
        customer_details.parent().removeClass("disabled");

        edit_details_btn.hide();
        sale_stock_btn.hide();
    })

    sale_stock_btn.on('click', function(){
        if(!selected_seller_id || !selected_seller_name){
            smallModal(
                "Something went wrong!", 
                "Seller not selected, click on edit details and reselect seller", 
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
        }else if(!selected_sale_type){
            smallModal(
                "Something went wrong!", 
                "Sale Type not selected", 
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
        }else if(!sale_data.length){
            smallModal(
                "Empty Sale Data", 
                "No items are added to sale",
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
            offer_dialogue(sale_items);
        }
    });

	//
	setTimeout(function(){
		alert("Items adding manually");
		scan_items_manually();
	}, 10000);
	//
});


function sale_items(){
    data_param = {
        no_of_vars: calculateNoOfVars(),
        action: "sale_items",
        seller_id: selected_seller_id,
        seller_name: selected_seller_name,
        custom_id: custom_id.val(),
        custom_name: custom_name.val(),
        customer_name: customer_name.val(),
        customer_village: customer_village.val(),
        customer_details: customer_details.val(),
        sale_type: selected_sale_type,
        vehicle_id: "",
        vehicle_name: "",
        data: {summary: sale_summary, list: sale_data, billing: billing}
    }

    ajaxPostCall('lib/sale_stock.php', data_param, function(response){

        console.log(response);

        let modal_body; let modal_title = "Parsing Item Data Error";
        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            smallModal(
                "Items Sale Successful",
                `
                <p>Invoice Id#: <b>${response.invoice_id}</b></p>
                <p>Total No.# of items are sold <b>${sale_data.length}</b></p>
                <table>
                    <tr>
                        <td>Total Price of</td>
                        <td><b>${billing.total.toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Total Making Cost of</td>
                        <td><b>${billing.making_cost.toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Profit of</td>
                        <td><b>${(billing.total-billing.making_cost).toFixed(2)}</b></td>
                    </tr>
                    <tr>
                        <td>Offer ${billing.offer_percentage}%</td>
                        <td><b>${billing.offer_amount}</b></td>
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
            stock_data = response.data;
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

function initSellersOpts(){
    seller_dropdown.addClass("loading");

    ajaxPostCall("lib/sellers.php", {action: "fetch_all", data: 'random_string'}, function(response){
        let modal_title = "Parsing Sellers Options error";
        let modal_body = null;

        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            let optArr = [{value: 's0', name: 'custom(s0)'}];
            $.each(response.data, function(){
                optArr.push({
                    value: this.seller_id,
                    name: `${this.seller_name}(${this.seller_id})`
                });
            });

            seller_dropdown.dropdown({values: optArr, onChange: sellerOnChange});
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
        
        seller_dropdown.removeClass("loading");
    });
}

function saleTypeOnChange(value, text, choice){
    selected_sale_type = value;
}

function sellerOnChange(value, text, choice){
    console.log(value, text, choice)

    selected_seller_id = value;
    selected_seller_name = text.substring(0, text.indexOf("("));

    if(selected_seller_id == "s0"){
        custom_fields.show();
        custom_id.parent().removeClass("disabled")
        custom_name.parent().removeClass("disabled")
    }else{
        custom_id.val('')
        custom_name.val('')

        custom_fields.hide();
        custom_id.parent().addClass("disabled")
        custom_name.parent().addClass("disabled")   
    }
}

//
function scan_items_manually(){
	
	let excel_data = ["07021KR4075",
    "07025KAR219",
    "07025KAR224",
    "0702PNUT530",
    "0702PNUT597",
    "0702PNUT598",
    "0702PNUT5101",
    "0702PNUT5104",
    "0702PNUT5106",
    "0702PNUT5112",
    "0702WBTN522",
    "07021KR2045",
    "0702MCHP517",
    "0702MCHP523",
    "07021KR1012",
    "07021KR1013",
    "0702BLCH521",
    "0702BLCH535",
    "0702PPTJ55",
    "0702MRRY13",
    "0702MRRY15",
    "0702MRRY16",
    "0702MCHP531",
    "0702MCHP532",
    "0702MCHP5110",
    "0702CFRES14",
    "0702CCNTM4",
    "0702CHEN55",
    "0702CHEN516",
    "0702CHEN517",
    "0702CHEN525",
    "0702CHEN526",
    "0702CHEN540",
    "0702CHEN557",
    "0702CHEN560",
    "0702CHEN567",
    "0702CHEN568",
    "0702CHEN574",
    "0702CHEN575",
    "0702CHEN579",
    "0702CHEN594",
    "0702CHEN596",
    "0702PNT1086",
    "07022KR1021",
    "07022KR1034",
    "07022KR1050",
    "07022KR1064",
    "07022KR1068",
    "07022KR1071",
    "07022KR1079",
    "0702PNT10112",
    "0702PNT10114",
    "0702PNT10116",
    "0702PNT10118",
    "0702PNT10120",
    "07022KR10139",
    "07022KR10143",
    "07022KR10149",
    "0702CHEN5110",
    "0702CHEN5111",
    "0702CHEN5113",
    "0702CHEN5115",
    "0702CHEN5118",
    "0702CHEN5120",
    "0702CHEN5131",
    "0702CHEN5132",
    "0702CHEN5133",
    "0702CHEN5134",
    "0702PRTYB10",
    "0802CHEN530",
    "0802CHEN553",
    "0802CHEN555",
    "0802CHEN586",
    "0802CHEN587",
    "0802CHEN588",
    "0802CHEN589",
    "0802CHEN590",
    "0802CHEN592",
    "0802CHEN594",
    "0802CHEN596",
    "0802CHEN597",
    "0802CHEN598",
    "0802CHEN599",
    "0802CHEN5100",
    "0802PNUT52",
    "0802PNUT54",
    "0802PNUT56",
    "0802PNUT58",
    "0802PNUT520",
    "0802PNUT521",
    "0802PNUT523",
    "0802PNUT524",
    "0802PNUT525",
    "0802PNUT526",
    "0802PNUT528",
    "0802PNUT530",
    "0802PNUT532",
    "0802PNUT538",
    "0802PNUT551",
    "0802PNUT552",
    "0802PNUT554",
    "0802PNUT575",
    "0802PNUT588",
    "0802PNUT5150",
    "0802PNUT5152",
    "0802PNUT5154",
    "0802PNUT5156",
    "0802PNUT5174",
    "0802PNUT5175",
    "0802PNUT5196",
    "0802PNUT5199",
    "0802PNUT5201",
    "0802PNUT5202",
    "0802PNUT5212",
    "0802PNUT5219",
    "0802PNUT5220",
    "0802PNUT5221",
    "0802PNUT5222",
    "0802PNUT5224",
    "0802PNUT5226",
    "0802PNUT5228",
    "0802PNUT5230",
    "0802PNUT5232",
    "0802PNUT5235",
    "0802PNUT5237",
    "0802PNUT5239",
    "0802PNUT5254",
    "0802PNUT5270",
    "0802PNUT5291",
    "0802PNUT5294",
    "0802PNUT5296",
    "0802PNUT5298",
    "0802PNUT5327",
    "0802PNUT5329",
    "0802PNUT5331",
    "0802PNUT5333",
    "0802PNUT5335",
    "0802PNUT5337",
    "0802PNUT5345",
    "0802PNUT5347",
    "0802PNUT5349",
    "0802CHEN5187",
    "0802CHEN5231",
    "0802CHEN5232",
    "0802PNUT5458",
    "0802PNUT5465",
    "0802PNUT5467",
    "0802PNUT5470",
    "0802PNUT5471",
    "0802PNUT5473",
    "0802PNUT5474",
    "0802PNUT5475",
    "0802PNUT5494",
    "08021KR20451",
    "08021KR20452",
    "08021KR20453",
    "08021KR20454",
    "08021KR20455",
    "08021KR20456",
    "08021KR20457",
    "08021KR20458",
    "08021KR20459",
    "08021KR20460",
    "08021KR20461",
    "08021KR20462",
    "08021KR20463",
    "08021KR20464",
    "08021KR20465",
    "08021KR20466",
    "08021KR20467",
    "08021KR20468",
    "08021KR20469",
    "08021KR20470",
    "08021KR20471",
    "08021KR20472",
    "08021KR20473",
    "08021KR20474",
    "08021KR20475",
    "08021KR20476",
    "08021KR20477",
    "08021KR20478",
    "08021KR20479",
    "08021KR20480",
    "08021KR20481",
    "08021KR20482",
    "08021KR20483",
    "08021KR20484",
    "08021KR20485",
    "08021KR20486",
    "08021KR20487",
    "08021KR20488",
    "08021KR20489",
    "08021KR20490",
    "08021KR20491",
    "08021KR20492",
    "08021KR20493",
    "08021KR20494",
    "08021KR20495",
    "08021KR20496",
    "08021KR20497",
    "08021KR20498",
    "08021KR20499",
    "08021KR20500",
    "08021KR20501",
    "08021KR20502",
    "08021KR20503",
    "08021KR20504",
    "08021KR20505",
    "08021KR20506",
    "08021KR20507",
    "08021KR20508",
    "08021KR20509",
    "08021KR20510",
    "08021KR20511",
    "08021KR20512",
    "08021KR20513",
    "08021KR20514",
    "08021KR20515",
    "08021KR20516",
    "08021KR20517",
    "08021KR20518",
    "08021KR20519",
    "08021KR20520",
    "08021KR20521",
    "08021KR20522",
    "08021KR20523",
    "08021KR20524",
    "08021KR20525",
    "08021KR20526",
    "08021KR20527",
    "08021KR20528",
    "08021KR20529",
    "08021KR20530",
    "08021KR20531",
    "08021KR20532",
    "08021KR20533",
    "08021KR20534",
    "08021KR20535",
    "08021KR20536",
    "08021KR20537",
    "08021KR20538",
    "08021KR20539",
    "08021KR20540",
    "08021KR20541",
    "08021KR20542",
    "08021KR20543",
    "08021KR20544",
    "08021KR20545",
    "08021KR20546",
    "08021KR20547",
    "08021KR20548",
    "08021KR20549",
    "08021KR20550",
    "08021KR20551",
    "08021KR20552",
    "08021KR20553",
    "08021KR20554",
    "08021KR20555",
    "08021KR20556",
    "08021KR20557",
    "08021KR20558",
    "08021KR20559",
    "08021KR20560",
    "08021KR20561",
    "08021KR20562",
    "08021KR20563",
    "08021KR20564",
    "08021KR20565",
    "08021KR20566",
    "08021KR20567",
    "08021KR20568",
    "08021KR20569",
    "08021KR20570",
    "08021KR20571",
    "08021KR20572",
    "08021KR20573",
    "08021KR20574",
    "08021KR20575",
    "08021KR20576",
    "08021KR20577",
    "08021KR20578",
    "08021KR20676",
    "08022KR5088",
    "0802ECLAI2",
    "0802CAKE52",
    "0802SPJOY19",
    "0802SPJOY30",
    "0802SPJOY43",
    "0802MGL502",
    "0802RYMK527",
    "08027STAR1",
    "08027STAR5",
    "0802LLOP237",
    "0802LLOP241",
    "0802CCNMK19",
    "0802CYCL57",
    "0802CYCL511",
    "0802SRSWT13",
    "0802SRSWT14",
    "0802SRSWT17",
    "0802SRSWT22",
    "0802GOLD24",
    "0902MCH1066",
    "0902MCH1073",
    "0902MCH1082",
    "0902MCH10166",
    "0902GBAT5144",
    "0902GBAT5146",
    "0902GBAT5147",
    "0902GBAT5148",
    "0902GBAT5149",
    "0902GBAT5154",
    "0902GBAT5156",
    "0902GBAT5157",
    "0902GBAT5158",
    "0902GBAT5159",
    "1102BLG024",
    "1102ECELS20",
    "1102SKA5J4",
    "1202BKY072",
    "1202GBT1020",
    "1202GBT1022",
    "1202GBT1084",
    "1202GBT1093",
    "1202GBT1095",
    "1202GBT1097",
    "1202GNBT513",
    "1202GNBT551",
    "1202GNBT553",
    "1202GNBT554",
    "1202GNBT555",
    "1202GNBT556",
    "1202GNBT557",
    "1202GNBT558",
    "1202GNBT559",
    "1202GNBT560",
    "1202GNBT562",
    "1202GNBT5110",
    "1202GNBT5154",
    "14025KAR241",
    "14025KAR243",
    "14025KAR244",
    "14025KAR245",
    "1402MCH1030",
    "1402GBAT54",
    "1402GBAT530",
    "1402GBAT534",
    "1402GBAT536",
    "1402GBAT546",
    "1402GBAT552",
    "1402GBAT572",
    "1402GBAT590",
    "1402GBAT598",
    "1402GBAT5111",
    "1402GBAT5122",
    "1402GBAT5129",
    "1402GBAT5134",
    "1402GBAT5144",
    "1402GBAT5146",
    "1402GBAT5162",
    "1402GBAT5164",
    "1402GBAT5165",
    "1402GBAT5172",
    "1402GBAT5173",
    "1402GBAT5177",
    "1402GBAT5181",
    "1402GBAT5187",
    "1402GBAT5192",
    "1402GBAT5193",
    "1402GBAT5194",
    "1402GBAT5200",
    "1402GBAT5201",
    "1402GBAT5210",
    "1402GBAT5212",
    "1402GBAT5214",
    "1402GBAT5216",
    "1402GBAT5221",
    "1402GBAT5224",
    "1402GBAT5225",
    "1402GBAT5226",
    "1402GBAT5229",
    "1402GBAT5232",
    "1402GBAT5233",
    "1402GBAT5260",
    "1402GBAT5270",
    "1402GBAT5277",
    "1402GBAT5302",
    "1402PPTJ53",
    "1402PPTJ525",
    "1402MFXCD34",
    "1402SITIB11",
    "15025KAR267",
    "15025KAR269",
    "15022KR507",
    "15022KR508",
    "15022KR5016",
    "15022KR5018",
    "15022KR5020",
    "15022KR5022",
    "15022KR4O126",
    "1502RYMK513",
    "1502RYMK521",
    "1502RYMK522",
    "1502RYMK531",
    "1502RYMK542",
    "1502RYMK544",
    "1502RYMK546",
    "1502RYMK548",
    "1502RYMK549",
    "1602BOON518",
    "1602GBT103",
    "1602GBT1034",
    "1602GBT1035",
    "1602GBT1045",
    "1602GBT1047",
    "1602GBT1048",
    "1602GBT1049",
    "1602GBT1051",
    "1602GBT1069",
    "1602GBT1070",
    "16022BN1013",
    "16022BN1015",
    "16022BN1017",
    "16022BN1018",
    "16022BN1020",
    "1602PNUT533",
    "1602PNUT542",
    "1602PNUT561",
    "1602PNUT562",
    "1602PNUT564",
    "1602PNUT565",
    "1602PNUT567",
    "1602PNUT581",
    "1602PNUT583",
    "1602PNUT589",
    "1602PAPD521",
    "1602PAPD525",
    "16022KR4O215",
    "16022KR4O255",
    "16022KR4O258",
    "16022KR4O271",
    "16022KR4O295",
    "16022KR4O304",
    "16022KR4O307",
    "16022KR4O308",
    "16022KR4O320",
    "16022KR4O339",
    "16022KR4O340",
    "16022KR4O343",
    "16022KR4O344",
    "16022KR4O363",
    "16022KR4O364",
    "16022KR4O378",
    "16022KR4O383",
    "16022KR4O384",
    "16022KR4O449",
    "16022KR4O450",
    "16021KR2085",
    "16021KR2098",
    "16021KR20111",
    "16021KR20113",
    "16021KR20277",
    "1602PNT103",
    "1602PNT108",
    "1602PNT1012",
    "1602PNT1022",
    "1602PNT1039",
    "1602PNT1040",
    "1602PNT1060",
    "1602PNT1072",
    "1602PNT1079",
    "1602PNUT5221",
    "1602PNUT5224",
    "1602PNUT5231",
    "1602PNUT5232",
    "1602PNUT5237",
    "1602PNUT5246",
    "1602PNUT5252",
    "1602PNUT5253",
    "1602PNUT5254",
    "1602PNUT5262",
    "1602PNUT5263",
    "1602PNUT5264",
    "1602PNUT5267",
    "1602PNUT5268",
    "1602PNUT5273",
    "1602PNUT5274",
    "1602PNUT5276",
    "1602PNUT5277",
    "1602PNUT5279",
    "1602PNUT5280",
    "1602PNUT5281",
    "1602PNUT5286",
    "1602PNUT5297",
    "1602PNUT5298",
    "1602PNUT5301",
    "1602PNUT5311",
    "1602PNUT5318",
    "1602PNUT5321",
    "1602PNUT5327",
    "1602PNUT5330",
    "1602PNUT5335",
    "1602PNUT5356",
    "1602PNUT5365",
    "1602PNUT5366",
    "1602PNUT5367",
    "1602PNUT5368",
    "1602PNUT5369",
    "1602PNUT5377",
    "1602PNUT5378",
    "1602PNUT5387",
    "1702KSPD125",
    "1702KSPD157",
    "17021SPDJ21",
    "17021SPDJ23",
    "17021SPDJ25",
    "17021SPDJ26",
    "17021SPDJ27",
    "17021SPDJ28",
    "17021SPDJ41",
    "17021SPDJ44",
    "17021SPDJ48",
    "17021SPDJ50",
    "17021SPDJ52",
    "1702BLCH561",
    "1702PAPD511",
    "1702PAPD533",
    "1702PAPD575",
    "1702GNBT5110",
    "1702GNBT5111",
    "1702GNBT5112",
    "1702GNBT5113",
    "1702GNBT5114",
    "1702GNBT5115",
    "1702GNBT5116",
    "1702GNBT5117",
    "1702GNBT5118",
    "1802PNUT521",
    "1802PNUT523",
    "1802PNUT525",
    "1802PNUT527",
    "1802PNUT529",
    "1802PNUT531",
    "1802PNUT533",
    "1802PNUT535",
    "1802PNUT537",
    "1802PNUT539",
    "1802PNUT548",
    "1802PNUT550",
    "1802PNUT552",
    "1802PNUT554",
    "1802PNUT566",
    "1802PNUT575",
    "1802PNUT577",
    "1802GNBT522",
    "1802GNBT525",
    "1802GNBT527",
    "1802GNBT529",
    "1802GNBT531",
    "1802GNBT532",
    "1802GNBT543",
    "1802GNBT5122",
    "1802GNBT5123",
    "1802GNBT5124",
    "1802GNBT5126",
    "1802GNBT5128",
    "1802GNBT5131",
    "1802GNBT5133",
    "1802GNBT5135",
    "1802GNBT5138",
    "1802GNBT5140",
    "1802GNBT5144",
    "1802GNBT5147",
    "1802GNBT5148",
    "1802GNBT5149",
    "1802GNBT5150",
    "1802GNBT5151",
    "1802GNBT5153",
    "1802GNBT5155",
    "1802GNBT5157",
    "1802GNBT5160",
    "1802GNBT5163",
    "1802GNBT5175",
    "1802GNBT5177",
    "1802GNBT5178",
    "1802GNBT5180",
    "1802GNBT5182",
    "1802GNBT5184",
    "1802GNBT5193",
    "1802CHEN59",
    "1802CHEN522",
    "1802CHEN523",
    "1802CHEN524",
    "1802CHEN525",
    "1802CHEN526",
    "1802CHEN527",
    "1802CHEN528",
    "1802CHEN529",
    "1802CHEN530",
    "1802CHEN549",
    "1802CHEN571",
    "1802CHEN572",
    "1802CHEN573",
    "1802CHEN574",
    "1802CHEN575",
    "1802CHEN576",
    "1802CHEN578",
    "1802CHEN588",
    "1802CHEN590",
    "1802CHEN591",
    "1802CHEN592",
    "1802CHEN5100",
    "1802GBAT525",
    "1802GBAT527",
    "1802GBAT528",
    "1802GBAT529",
    "1802GBAT530",
    "1802GBAT531",
    "1802GBAT532",
    "1802GBAT5154",
    "18021KR2019",
    "18021KR2021",
    "18021KR2032",
    "18021KR2055",
    "18021KR20138",
    "18021KR20169",
    "18021KR20173",
    "18021KR20177",
    "18021KR20180",
    "18021KR20191",
    "18021KR20222",
    "18021KR20264",
    "18021KR20336",
    "18021KR20374",
    "18021KR20377",
    "18021KR20378",
    "18021KR20407",
    "18021KR20423",
    "18021KR20446",
    "18021KR20474",
    "18021KR20489",
    "18021KR20559",
    "18021KR20564",
    "18021KR20577",
    "18021KR20608",
    "18021KR20610",
    "18021KR20626",
    "18021KR20641",
    "18021KR20680",
    "18021KR20754",
    "1802CHEN5133",
    "1802CHEN5137",
    "1802CHEN5139",
    "1802CHEN5144",
    "1802CHEN5146",
    "1802CHEN5148",
    "1802CHEN5150",
    "1802CHEN5152",
    "1802PAPD531",
    "1802PAPD543",
    "1802GBAT5265",
    "1802GBAT5267",
    "1802GBAT5269",
    "1802GBAT5271",
    "1802GBAT5273",
    "1802GBAT5275",
    "1802GBAT5279",
    "18021KR20811",
    "18021KR20814",
    "18021KR20817",
    "18021KR20838",
    "1802MONEY1",
    "1802MONEY7",
    "1802BIGTR1",
    "1802TATOO1",
    "1802LIGHT1",
    "1802LIGHT2",
    "19022KAR5130",
    "19022KAR5182",
    "19022KAR5204",
    "19022KAR5206",
    "21022KR50166",
    "21023KRKG18",
    "21023KRKG60",
    "21023KRKG64",
    "21023KRKG70",
    "21023KRKG83",
    "21023KRKG126",
    "2102CHEN548",
    "2102CHEN550",
    "2102CHEN566",
    "2102CHEN584",
    "2102CHEN586",
    "2102CHEN587",
    "2102CHEN589",
    "2102CHEN590",
    "2102CHEN591",
    "2102CHEN592",
    "2102CHEN593",
    "2102CHEN5111",
    "2102CHEN5113",
    "2102CHEN5115",
    "2102CHEN5119",
    "2102CHEN5134",
    "2102CHEN5136",
    "2102CHEN5138",
    "2102CHEN5156",
    "2102CHEN5158",
    "2102PAPD51",
    "2102PAPD54",
    "2102PAPD58",
    "2102PAPD519",
    "2102PAPD535",
    "2102PAPD537",
    "2102PAPD538",
    "2102PAPD582",
    "2102PAPD587",
    "2102PAPD588",
    "2102MCH1027",
    "2102MCH1098",
    "2202MCHP522",
    "2202MCHP524",
    "2202MCHP526",
    "2202MCHP533",
    "2202MCHP537",
    "2202MCHP539",
    "2202MCHP541",
    "2202MCHP546",
    "2202MCHP598",
    "2202MCHP5100",
    "2202MCHP5108",
    "2202MCHP5110",
    "2202MCHP5112",
    "2202MCHP5114",
    "2202MCHP5128",
    "2202MCHP5130",
    "2202MCHP5132",
    "2202MCHP5186",
    "2202MCHP5190",
    "2202PAPD512",
    "2202PAPD513",
    "2202CHOCO5",
    "2202CHOCO14",
    "2202DKING15",
    "2202DKING22",
    "2202DEKEL18",
    "2202FRUPP13",
    "2202FRUPP14",
    "2202FRUPP17",
    "2302PAPD53",
    "2302PAPD56",
    "2302PAPD529",
    "2402FINGP17",
    "2402PNUT512",
    "2402PNUT525",
    "2402PNUT527",
    "2402PNUT559",
    "2402PNUT565",
    "2402PNUT567",
    "2402PNUT5110",
    "2402PNUT5113",
    "2402PNUT5132",
    "2402PNUT5134",
    "2402PNUT5136",
    "2402PNUT5138",
    "2402PNUT5148",
    "2402PNUT5150",
    "2402BLCH51",
    "2402PNUT5234",
    "2402PNUT5250",
    "2402PNUT5251",
    "2402PNUT5252",
    "2402PNUT5263",
    "2402PNUT5280",
    "2402PNUT5282",
    "2402PNUT5284",
    "2402PNUT5287",
    "2402PNUT5291",
    "2402PNUT5292",
    "2402PNUT5295",
    "2402PNUT5297",
    "2402PNUT5302",
    "2402PNUT5306",
    "2402PNUT5314",
    "24022BN4087",
    "24022BN4095",
    "24022BN4097",
    "24022BN40100",
    "24022BN40102",
    "24022BN40121",
    "24022BN40122",
    "24022BN40124",
    "24022BN40132",
    "24022BN40133",
    "24022BN40134",
    "24022BN40138",
    "24022BN40139",
    "24022BN40140",
    "24022BN40141",
    "24022BN40146",
    "24022BN40147",
    "24022BN40148",
    "24022BN40184",
    "24022BN40186",
    "24022BN40193",
    "24022BN40195",
    "2402SNPD21",
    "2402SNPD23",
    "2402SNPD24",
    "2402PNT102",
    "2402PNT104",
    "2402PNT1025",
    "2402PNT1027",
    "2402PNT1028",
    "2402PNT1029",
    "2402PNT1031",
    "2402PNT1033",
    "2402PNT1035",
    "2402PNT1042",
    "2402PNT1044",
    "25021BN2019",
    "25021BN2022",
    "25021BN2023",
    "25021BN2025",
    "25021BN2027",
    "25021BN2029",
    "25021BN2030",
    "25021BN2031",
    "25021BN2033",
    "25021BN2062",
    "25021BN2063",
    "25021BN2064",
    "25021BN2067",
    "25021BN2069",
    "25021BN2087",
    "25021BN2089",
    "25021BN20164",
    "25021BN20173",
    "25021BN20201",
    "25021BN20202",
    "25021BN20204",
    "25021BN407",
    "25021BN409",
    "25021BN4011",
    "25021BN4022",
    "25021BN4028",
    "25021BN4034",
    "25021BN4061",
    "25021BN4063",
    "25021BN4065",
    "25021BN4067",
    "25021BN4069",
    "25021BN4079",
    "25021BN4081",
    "25021BN4083",
    "25021BN4085",
    "25021BN4087",
    "25021BN4089",
    "25021BN4091",
    "25021BN4093",
    "25021BN40203",
    "25021BN40205",
    "25021BN40209",
    "25021BN40211",
    "25021BN40212",
    "25021BN40213",
    "25021BN40214",
    "25021BN40220",
    "25021BN20573",
    "25021BN20576",
    "25021BN20587",
    "25021BN20590",
    "2602PAPD55",
    "2602PAPD57",
    "2602PAPD510",
    "2602PAPD521",
    "2602PAPD523",
    "2602PAPD524",
    "2602PAPD579",
    "2602PAPD583",
    "26022KR4O3",
    "26022KR4O4",
    "26022KR4O5",
    "26022KR4O17",
    "26022KR4O23",
    "26022KR4O28",
    "26022KR4O29",
    "26022KR4O36",
    "26022KR4O41",
    "26022KR4O44",
    "26022KR4O46",
    "26022KR4O47",
    "26022KR4O51",
    "26022KR4O56",
    "26022KR4O61",
    "26022KR4O65",
    "26022KR4O68",
    "26022KR4O73",
    "26022KR4O74",
    "26022KR4O75",
    "26022KR4O77",
    "26022KR4O80",
    "26022KR4O88",
    "26022KR4O101",
    "2602CHEN56",
    "2602CHEN516",
    "2602CHEN518",
    "2602CHEN520",
    "2602CHEN581",
    "2602CHEN582",
    "2602CHEN583",
    "2602CHEN584",
    "2602CHEN585",
    "2602CHEN586",
    "2602CHEN589",
    "2602CHEN590",
    "2602CHEN5138",
    "2602CHEN5139",
    "2602CHEN5153"];
	
    $.each(excel_data, function(){
        console.log(this);
        barcode_input.val(this)
        scanner_btn.click();
    })
}
//