let vehicle_dropdown;
let selected_vehicle_id;
let selected_vehicle_name;

let selected_sale_type;

let save_details_btn;
let edit_details_btn;
let sale_stock_btn;

let stock_data = [];

$(function(){

    $("span#date").text(getCurrentDate("dmy"));

    vehicle_dropdown = $(".dropdown.vehicle-dropdown");
    initVehicles();

    selected_sale_type = "vehicle";

    save_details_btn = $("#save_details_btn");
    edit_details_btn = $("#edit_details_btn");
    sale_stock_btn = $("#sale_stock_btn");

    edit_details_btn.hide();
    sale_stock_btn.hide();

    initLoadStock();

    save_details_btn.on('click', function(){
        if(isVehicleSelected()){

            scanner_state.isEnabled = true;
            scanner_state.reason = 'Vehicle selected and saved';

            vehicle_dropdown.addClass("disabled");
            
            save_details_btn.hide();

            edit_details_btn.show();
            sale_stock_btn.show();

        }else{

            scanner_state.isEnabled = false;
            scanner_state.reason = 'Vehicle not selected';

            smallModal(
                scanner_state.reason, 
                "Select a Vehicle", 
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

    edit_details_btn.on('click', function(){
        scanner_state.isEnabled = false;
        scanner_state.reason = 'Vehicle not selected after clicking on edit';

        save_details_btn.show();
        vehicle_dropdown.removeClass("disabled");

        edit_details_btn.hide();
        sale_stock_btn.hide();
    })

    sale_stock_btn.on('click', function(){
        if(!isVehicleSelected()){
            smallModal(
                "Something went wrong!", 
                "Vehicle not selected, click on edit details and reselect vehicle", 
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
                "Empty Sale Data!", 
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
});

function initVehicles(){
    vehicle_dropdown.addClass("loading");

    ajaxPostCall("lib/vehicles.php", {action: "fetch_all", data: ["something_random"]}, function(response){
        let modal_title = "Loading Vehicles Error";
        let modal_body = null;

        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            let optArr = [];
            $.each(response.data, function(){
                optArr.push({
                    value: this.vehicle_id,
                    name: `${this.vehicle_name}(${this.vehicle_id})`
                });
            });

            vehicle_dropdown.dropdown({values: optArr, onChange: vehicleOnChange});
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

        vehicle_dropdown.removeClass("loading");
    });
}

function isVehicleSelected(){
    return  (
                    selected_vehicle_id  
                &&  selected_vehicle_name  
                &&  (vehicle_dropdown.dropdown('get text') == `${selected_vehicle_name}(${selected_vehicle_id})`)
            )
}

function sale_items(){
    data_param = {
        no_of_vars: calculateNoOfVars(),
        action: "vehicle_stock_shift",
        is_stock_shift: true,
        seller_id: "s0",
        seller_name: "vehicle",
        custom_id: "",
        custom_name: "",
        customer_name: "",
        customer_village: "",
        customer_details: "",
        sale_type: selected_sale_type,
        vehicle_id: selected_vehicle_id,
        vehicle_name: selected_vehicle_name,
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

function vehicleOnChange(value, text, choice){
    selected_vehicle_id = value;
    selected_vehicle_name = text.substring(0, text.indexOf("("));
}