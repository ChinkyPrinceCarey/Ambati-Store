let generateStockForm;

let dropdown_material;
let dropdown_type;
let dropdown_item;

let field_unit;
let field_quantity;
let field_making_cost;
let field_retailer_cost;
let field_wholesale_cost;

let custom_fields;
let mrp_field;
let manufactured_date;
let input_manufactured_date;
let calendar_manufactured_date;
let field_weight;
let input_weight;
let dropdown_weight;

let field_current_item_no;
let field_no_of_barcodes;
let tracking_id;
let dropdown_is_cotton;

let selected_type;
let selected_item_name;
let selected_item_shortcode;

let barcodes = [];

let generate_stock_btn;
let edit_stock_btn;
let add_stock_btn;

let GenerateId = [];

let inProcess;

$(function(){
	$("span#date").text(getCurrentDate("dmy"));

    loadMaterial();

    let searchParams = new URLSearchParams(window.location.search)
    let preRequestedShortcode = searchParams.get('shortcode')
    if(preRequestedShortcode){
        $('input[name=shortcode]').val(preRequestedShortcode);
        setTimeout(function(){$('#get_data').submit();}, 5);
    }

    generateStockForm = $('form#generate_stock');

    dropdown_material = $('.dropdown.material-field');
    dropdown_type = $('.dropdown.type-field');
    dropdown_item = $('.dropdown.item-field');

    field_unit = $('input[name=unit]');
    field_quantity = $('input[name=quantity]');
    field_making_cost = $('input[name=making_cost]');
    field_wholesale_cost = $('input[name=wholesale_cost]');
    field_retailer_cost = $('input[name=retailer_cost]');
    
    custom_fields = $('#custom-fields');
    mrp_field = $("input[name=mrp]");
    manufactured_date = $('#mfg_field');
    input_manufactured_date = manufactured_date.children("div").children("div").children("input");
    calendar_manufactured_date = manufactured_date.children("div.ui.calendar");

    custom_fields.hide();
    
    field_weight = $("#weight_field")
    input_weight = field_weight.children("div").children("input");
    dropdown_weight = field_weight.children("div").children(".ui.dropdown");
    
    field_current_item_no = $('input[name=current_item_no]');
    field_no_of_barcodes = $('input[name=no_of_barcodes]');
    tracking_id = $('input[name=tracking_id]');
    dropdown_is_cotton = $('.dropdown.is-cotton-field');
	
	generate_stock_btn = $('#generate_stock_btn');
	
	edit_stock_btn = $('#edit_stock_btn');
	edit_stock_btn.hide();
	
	add_stock_btn = $('#add_stock_btn'); 
	add_stock_btn.hide();

    dropdown_material.dropdown({
        onChange: materialOnChange
        }
    );

    jQuery('.dropdown.is-cotton-field').dropdown('setting','onChange', dropdownIsCottonChange);
    dropdownIsCottonChange("no"); //this will hide quantity by default

    //input_manufactured_date.val(getCurrentDate("d/m/y")); //not required

    calendar_manufactured_date
    .calendar({
        monthFirst: false,
        type: 'date',
        formatter: {
        date: function(date, settings){
            if (!date) return '';
            var day = date.getDate();
            var month = date.getMonth() + 1;
            var year = date.getFullYear();
            return day + '/' + month + '/' + year;
        }
        }
    });

    field_weight
    .children(".ui")
    .children(".dropdown")
    .dropdown();

    field_weight
    .children(".ui")
    .children(".dropdown")
    .dropdown('get text');

    $('#get_data')
    .form({
		inline : true,
        transition : "slide down",
        duration : 500,
        fields: {
            shortcode : ['length[5]'],
        },
        onSuccess: function(event, fields){
            event.preventDefault();
			
			console.log(event, fields)

            $('#get_data').addClass("loading");
            fieldsLoading();

            ajaxPostCall(`${LIB_API_ENDPOINT}/items.php`, {action: "fetch_item_data", data: "random_data", shortcode: fields.shortcode}, function(response){
                let modal_body; let modal_title = "Parsing Item Data Error";
                if(response.status){
                    modal_body = response.status + ": " + response.statusText;
                }else if(response.title){
                    modal_title = response.title;
                    modal_body = response.content;
                }else if(response.result){
                    let item_data = response.data;
                    if(item_data.length == 1){
                        item_data = item_data[0];

                        jQuery('.dropdown.material-field').dropdown('setting','onChange', console.log);

                        dropdown_material.dropdown('set selected', item_data.material)
						adjustFields(item_data.material);

                        dropdown_type
                        .dropdown({
                            values: [
                                {
                                    name     : item_data.type,
                                    value    : item_data.type,
                                    selected : true
                                }
                            ]
                        });

                        dropdown_item
                        .dropdown({
                            values: [
                                {
                                    name     : `${item_data.item} [${item_data.shortcode}]`,
                                    value    : item_data.shortcode,
                                    selected : true
                                }
                            ]
                        });

                        jQuery('.dropdown.material-field').dropdown('setting','onChange', materialOnChange);

						
						resetFields();
						
                        populateFields(response.data);
                        
                    }else{
                        modal_body = "Error getting correct item [or] could be item not exist";    
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
				
                $('#get_data').removeClass("loading");
                fieldsLoading(false);
            });
        }
    });
	
	
	$('form#generate_stock').form({
		onValid: function(field){console.log("onValid", field)},
		onInvalid: function(field){
			console.log("onValid", field)
			add_stock_btn.hide();
		},
		onSuccess: function(event, fields){
			event.preventDefault();
			
			fields.type = selected_type;
			fields.item = selected_item_name;
			fields.shortcode = selected_item_shortcode;
			if(fields.material == "raw"){
				fields.retailer_cost = fields.making_cost;
				fields.wholesale_cost = fields.making_cost;
			}
			
			console.log("validateGenerateStockFields(fields)", validateGenerateStockFields(fields));
			console.log(event, fields);
			
			if(validateGenerateStockFields(fields)){
                //lock the fields
				changeFieldsState();
				
				//hide generate stock btn
				generate_stock_btn.hide();
				
				//show edit stock btn
				edit_stock_btn.show();
				
				//show add stock btn
				add_stock_btn.show().focus();
				
				//now generate barcodes
				generateBarcodes(fields);
			}else{
				add_stock_btn.hide();
			}
		},
		onFailure: function(event, fields){
			console.log("onFailure", event, fields)
			add_stock_btn.hide();
		}
	});
	
	edit_stock_btn.on('click', function(){
		//unlock the fields
		changeFieldsState(false);
		
		//show generate stock btn
		generate_stock_btn.show();
		
		//hide add stock btn
		add_stock_btn.hide();
		
		//hide edit stock btn
		edit_stock_btn.hide();
		
		//empty barcodes
		barcodes = [];
		$('#barcodes-list').empty();
	})
	
	add_stock_btn.on('click', function(){
		
		if(!isIframeLoaded){
			smallModal(
					"Barcode Printing Module not loaded yet", 
					"Please wait a while and try again", 
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
		}else if(
            getIsCottonEntry() ? 
                (parseInt(field_quantity.val()) * parseInt(field_no_of_barcodes.val()) == barcodes.length) : 
                (parseInt(field_no_of_barcodes.val()) == barcodes.length)
        ){
			if(typeof inProcess == "undefined"){
                inProcess = true;
                data_param = {
                    action: "stock_entry",
                    data: "random_data",
                    date: getCurrentDate(),
                    generate_id: GENERATEID("all"),
                    material: dropdown_material.dropdown('get value'),
                    type: selected_type,
                    item: selected_item_name,
                    shortcode: selected_item_shortcode,
                    unit: field_unit.val(),
                    quantity: field_quantity.val(),
                    making_cost: field_making_cost.val(),
                    retailer_cost: dropdown_material.dropdown('get value') == "raw" ? field_making_cost.val() : field_retailer_cost.val(),
                    wholesale_cost: dropdown_material.dropdown('get value') == "raw" ? field_making_cost.val() : field_wholesale_cost.val(),
                    current_item_no: field_current_item_no.val(),
                    barcodes: barcodes,
                    custom_data: getCustomData(),
                    is_cotton: getIsCottonEntry()
                };
                
                ajaxPostCall(`${LIB_API_ENDPOINT}/warehouse_stock_entry.php`, data_param, function(response){
                    let modal_body; let modal_title = "Parsing Item Data Error";
                    if(response.status){
                        modal_body = response.status + ": " + response.statusText;
                    }else if(response.title){
                        modal_title = response.title;
                        modal_body = response.content;
                    }else if(response.result){
                        //let item_data = response.data;
                        //console.log(response.data);
                        smallModal(
                            "Stock Added Successfully", 
                            `${field_no_of_barcodes.val()} stock items of ${selected_item_name}[${selected_item_shortcode}] are added successfully, click on print to print labels or notedown generated_id to print labels later
                            ${tracking_id.val() ? '</br><h3>TRACKING_ID: <b>'+ tracking_id.val() +'</b></h3>' : ''}
                            <h2>GENERATED_ID: <b>${data_param.generate_id}</b></h2>`, 
                            [
                                {
                                    "node": "button",
                                    "class": "ui positive approve medium button focusbgblack",
                                    "id": "modalPrintBtn",
                                    "text": "Print",
                                },
                                {
                                    "node": "button",
                                    "class": "ui negative deny button focusbgblack",
                                    "id": "modalCloseBtn",
                                    "text": "Close",
                                }
                            ], 
                            {
                                closable: false,
                                onApprove: function(){
                                    $("#modalPrintBtn").addClass("loading");
                                    printLabels(function(isCompleted){
                                        $("#modalPrintBtn").removeClass("loading");
                                    });
                                    return false;
                                },
                                onDeny: function(){
                                    $("#modalCloseBtn").addClass("loading");
                                    window.location.replace(getCurrentPage());
                                    return false;
                                }
                            }
                        );
                        
                        setTimeout(function(){
                            $("#modalPrintBtn").focus();
                        }, 100)
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
		}else{
			smallModal(
            "Something is wrong", 
            `No# of Items(${field_no_of_barcodes}) and No# of Barcodes(${barcodes.length}) are not equal</br>Reload the Page`, 
            [
                {
                    "class": "ui positive approve button",
                    "id": "",
                    "text": "Reload",
                }
            ],
            {
                onApprove: function(){
                    window.location.replace(getCurrentPage());
                    return false;
                }
            }
        );
		}
	});
})

function loadMaterial(){
    ajaxPostCall(`${LIB_API_ENDPOINT}/material.php`, {action: "fetch_all", data: "random_data"}, function(response){

        let modal_title = "error fetching `material`";
        let modal_body = null;

        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            $.each(response.data, function(i){
                $('select[name="material"]').append(
                    `<option value="${this.material}">${this.material}</option>`
                );
            });
            $('select[name="material"]').dropdown();
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
                        "text": "Okay",
                    }
                ], 
                {
                    closable: true
                }
            );    
        }
    });
}

function wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
      end = new Date().getTime();
   }
 }

function GENERATEID(){  
    if(arguments.length){
      if(typeof arguments[0] == "string"){
        switch(arguments[0]){
            case 'new':
                wait(1000);
                let newGenerateId = getCurrentDate("dmt");
                GenerateId.push(newGenerateId);
                return newGenerateId;

            case 'first':
            return GenerateId[0];

            case 'last':
            return GenerateId[GenerateId.length - 1];

            case 'all':
            return GenerateId;

            case 'value':
                if(arguments[1]){
                    return GenerateId[arguments[1]];
                }
            return undefined;
        }
      }
    }else{
        return undefined;
    }
}

function generateBarcodes(data){
	//append a svg element with id
	//then generate barcode to it
	
	//console.log(data);
	//console.log(data.no_of_barcodes);
	
	let currentItemNumber = parseInt(field_current_item_no.val());
    let currentDate = getCurrentDate('dm');
    let custom_data = getCustomData();

    data.no_of_barcodes = parseInt(data.no_of_barcodes);
    data.quantity = parseInt(data.quantity);
	
	$('#barcodes-list').empty();
	barcodes = [];

    if(getIsCottonEntry()){
        for(i=1; i<=data.no_of_barcodes; i++){
            let thisGenerateId = GENERATEID("new");
            let barcodeText = thisGenerateId;
            if(data.tracking_id) barcodeText += ` | ${data.tracking_id}`

            for(let j=1; j<=data.quantity; j++){ 
                let barcode_value = `${currentDate}${data.shortcode}${currentItemNumber}`;
                let obj = {generate_id: thisGenerateId, barcode: barcode_value }
                barcodes.push(obj);

                currentItemNumber++;
            }
            $('#barcodes-list').append(`
            <div class="barcode">
                <svg    id="barcode_${i}"
                        jsbarcode-width="1"
                        jsbarcode-height="20"
                        jsbarcode-textmargin="1"
                        jsbarcode-fontsize="10"
                        jsbarcode-fontoptions="bold"
                        jsbarcode-text=${barcodeText}
                        jsbarcode-value=${thisGenerateId}
                ></svg>
            </div>
            `);
            JsBarcode(`#barcode_${i}`).init();

            //adding custom data
            $(`#barcode_${i} g`).attr('transform', 'translate(10, 4)');
            $(`#barcode_${i}`).append(`
                <g class="custom_data">
                    <line x1="0" y1="38" x2="100%" y2="38" stroke="black"></line>
                    <text style="font: 7px Arial; font-weight:600" x="5" y="45">${currentDate}${data.shortcode}${currentItemNumber}-${currentItemNumber + data.quantity}</text>
                </g>
            `);   
        }
    }else{
        GENERATEID("new");
        
        data.no_of_barcodes = parseInt(data.no_of_barcodes);
        
        let barcodeTrackText = "";
        if(data.tracking_id) barcodeTrackText = `|${data.tracking_id}`;
        
        for(let i=1; i<=data.no_of_barcodes; i++){ 
            let barcode_value = `${currentDate}${data.shortcode}${currentItemNumber}`;
            barcodes.push(barcode_value);
            
            $('#barcodes-list').append(
            `<div class="barcode"><svg id="barcode_${i}"
            jsbarcode-width="1"
            jsbarcode-height="20"
            jsbarcode-textmargin="1"
            jsbarcode-fontsize="10"
            jsbarcode-fontoptions="bold"
            jsbarcode-text=${barcode_value}-${data.retailer_cost}${barcodeTrackText}
            jsbarcode-value=${barcode_value}
            >
            </svg></div>`);
            
            JsBarcode(`#barcode_${i}`).init();

            //add Custom Data
            if(custom_data){
                $(`#barcode_${i} g`).attr('transform', 'translate(10, 4)');
                $(`#barcode_${i}`).append(`
                    <g class="custom_data">
                        <line x1="0" y1="38" x2="100%" y2="38" stroke="black"></line>
                        <text style="font: 7px Arial; font-weight:600" x="5" y="45">${custom_data}</text>
                    </g>
                `);
            }
            
            currentItemNumber++;
        }
    }

    //if any custom data added to svg
    //those are will not be visible
    //so appending again completely
    if(getIsCottonEntry() || custom_data){
        let barcodes_data = $('#barcodes-list div:nth-of-type(1)').parent().parent().html();
        $('#barcodes-list').empty();
        $('#barcodes-list').html(barcodes_data);
    }
}

function getIsCottonEntry(){
    return dropdown_is_cotton.dropdown('get value') == "yes" ? 1 : 0;
}

function getCustomData(){
    let custom_data = '';
    if(mrp_field.val()){
        custom_data += `MRP:${mrp_field.val()}/\-  `;
    }

    if(input_weight.val()){
        custom_data += `Weight:${input_weight.val()}${dropdown_weight.dropdown('get text')}  `;
    }

    if(input_manufactured_date.val()){
        custom_data += `Mfg:${input_manufactured_date.val()}  `;
    }

    return custom_data.slice(0, -1);
}

function validateGenerateStockFields(obj){
	let isValid = true;
	for (const property in obj) {
	  //console.log(`${property}: ${obj[property]}`);
	  if(!(
                property == "mrp"
            ||  property == "mfg"
            ||  property == "weight"
            ||  property == "tracking_id"
        )
        && (!obj[property])
        ){
		  smallModal(
				`${property}: is empty`, 
				"fill the input and generate", 
				[
					{
						"class": "ui positive approve button",
						"id": "",
						"text": "Okay",
					}
				]
		);
		
		isValid = false;
		return false;
	  }
	}
	
	return isValid;
}

function changeFieldsState(shouldDisable = true){
	if(shouldDisable){
		dropdown_material.addClass('disabled');
		dropdown_type.addClass('disabled');
		dropdown_item.addClass('disabled');
		field_unit.parent().addClass('disabled');
		field_quantity.parent().addClass('disabled');
		field_making_cost.parent().addClass('disabled');
		field_retailer_cost.parent().addClass('disabled');
		field_wholesale_cost.parent().addClass('disabled');
		field_current_item_no.parent().addClass('disabled');
		field_no_of_barcodes.parent().addClass('disabled');
        dropdown_is_cotton.parent().addClass("disabled")

        mrp_field.parent().addClass('disabled');
        calendar_manufactured_date.addClass('disabled');
        input_weight.parent().addClass('disabled');
        dropdown_weight.addClass('disabled');
	}else{
		dropdown_material.removeClass('disabled');
		dropdown_type.removeClass('disabled');
		dropdown_item.removeClass('disabled');
		field_unit.parent().removeClass('disabled');
		field_quantity.parent().removeClass('disabled');
		field_making_cost.parent().removeClass('disabled');
		field_retailer_cost.parent().removeClass('disabled');
		field_wholesale_cost.parent().removeClass('disabled');
		field_current_item_no.parent().removeClass('disabled');
		field_no_of_barcodes.parent().removeClass('disabled');
        dropdown_is_cotton.parent().removeClass('disabled');

        mrp_field.parent().removeClass('disabled');
        calendar_manufactured_date.removeClass('disabled');
        input_weight.parent().removeClass('disabled');
        dropdown_weight.removeClass('disabled');
	}
}

function resetFields(){
	add_stock_btn.hide();
	
    field_unit.val('')
    field_quantity.val('')
    field_making_cost.val('')
    field_retailer_cost.val('')
    field_wholesale_cost.val('')
    field_no_of_barcodes.val('')
}

function adjustFields(materialType){
    if(materialType == "raw"){
        field_retailer_cost.attr('readonly', true)
        field_wholesale_cost.attr('readonly', true)

        field_retailer_cost.attr('tabindex', -1)
        field_wholesale_cost.attr('tabindex', -1)
		
		field_retailer_cost.parent().hide();
		field_wholesale_cost.parent().hide();
    }else{
        field_retailer_cost.attr('readonly', false)
        field_wholesale_cost.attr('readonly', false)

        field_retailer_cost.removeAttr('tabindex')
        field_wholesale_cost.removeAttr('tabindex')
		
		field_retailer_cost.parent().show();
		field_wholesale_cost.parent().show();
    }

    if(materialType != "raw"){
        custom_fields.show();

        mrp_field.removeAttr('tabindex');
        input_manufactured_date.removeAttr('tabindex')
        input_weight.removeAttr('tabindex')
    }else{
        custom_fields.hide();

        mrp_field.attr('tabindex', -1);
        input_manufactured_date.attr('tabindex', -1)
        input_weight.attr('tabindex', -1)
    }
}

function dropdownIsCottonChange(value, text, choice){
    if(value == "yes"){
        field_quantity.val('').parent().show();
        field_no_of_barcodes.siblings().text('No.of Cottons');
    }else{
        field_quantity.val('1').parent().hide();
        field_no_of_barcodes.siblings().text('No.of Items');
    }
}

function materialOnChange(value, text, choice){

    console.log(`materialOnChange`)
    console.log(value, text, choice);

    adjustFields(value);

    let rules = [`material=${value}`]
    let required_fields = ['DISTINCT `type` AS `type`']
    let suffix_query_str = 'ORDER BY `type` ASC';
    
    getSelectOpts(`${LIB_API_ENDPOINT}/items.php`, rules, required_fields, suffix_query_str, dropdown_type);
    
    dropdown_item.dropdown({values: []});
    resetFields();
}

function typeOnChange(value, text, choice){
	
	resetFields();
	
	selected_type = value;
    let material = dropdown_material.dropdown('get value');
    if(material){
        let rules = [`material=${material}`, `type=${value}`]
        let required_fields = ['item', 'shortcode']
        let suffix_query_str = 'ORDER BY `item` ASC';

        dropdown_item.dropdown({values: []});
        getSelectOpts(`${LIB_API_ENDPOINT}/items.php`, rules, required_fields, suffix_query_str, dropdown_item);
    }else{
        smallModal(
            "Error Getting Selected Material Value", 
            "Reload the page", 
            [
                {
                    "class": "ui positive approve button",
                    "id": "",
                    "text": "Reload",
                }
            ],
            {
                onApprove: function(){
                    window.location.replace(getCurrentPage());
                    return false;
                }
            }
        );
    }
}

function itemOnChange(value, text, choice){
    console.log('itemOnChange');
	
	resetFields();
    fieldsLoading();

    ajaxPostCall(`${LIB_API_ENDPOINT}/items.php`, {action: "fetch_item_data", data: "random_data", shortcode: value}, function(response){
        let modal_body; let modal_title = "Parsing Item Data Error";
        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            populateFields(response.data);
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

        if(!response.result) fieldsLoading(false)
    })
}

function fieldsLoading(isShow = true){
    if(isShow){
        generateStockForm.addClass("loading")
    }else{
        generateStockForm.removeClass("loading")
    }
}

function populateFields(item_data){
    console.log(item_data)
    if(item_data.length == 1){
        item_data = item_data[0];
		
		selected_type = item_data.type;
		selected_item_name = item_data.item;
		selected_item_shortcode = item_data.shortcode;

        field_unit.val('').val(item_data.unit)
        field_quantity.val('').val(item_data.quantity)
        field_making_cost.val('').val(item_data.making_cost)
        field_retailer_cost.val('').val(item_data.retailer_cost)
        field_wholesale_cost.val('').val(item_data.wholesale_cost)

        if(getCurrentDate() == item_data.date){
            field_current_item_no.val('').val(parseInt(item_data.item_number) + 1);
        }else{
            field_current_item_no.val('').val(1);
        }

        tracking_id.val('').val(item_data.tracking_id);
    }else{
        smallModal(
            "Error Getting Item Data", 
            "Reload the Page", 
            [
                {
                    "class": "ui positive approve button",
                    "id": "",
                    "text": "Reload",
                }
            ], 
            {
                closable: true,
                onApprove: function(){
                    window.location.replace(getCurrentPage());
                    return false;
                }
            }
        );
    }
    fieldsLoading(false);
}

function getSelectOpts(url, rules, required_fields, suffix_query_string, opt_menu_selector){
    opt_menu_selector.addClass("loading");
    
    let data_parameter = {
        action: "fetch_specified", 
        data: 'random_string', 
        rules: rules, 
        required_fields: required_fields,
        suffix_query: suffix_query_string
    }
    
    ajaxPostCall(url, data_parameter, function(response){
        let modal_title = "Parsing Dropdown Opt error";
        let modal_body = null;

        if(response.status){
            modal_body = response.status + ": " + response.statusText;
        }else if(response.title){
            modal_title = response.title;
            modal_body = response.content;
        }else if(response.result){
            populateOpts(opt_menu_selector, response.data);
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
        
        opt_menu_selector.removeClass("loading");
    });
}

function populateOpts(optMenuSelector, optData){

    let optArr = [];

    switch(optMenuSelector.children('select').attr('name')){
        case 'type':
            $.each(optData, function(){
                optArr.push({
                    value: this.type,
                    name: this.type
                });
            });
            optMenuSelector.dropdown({values: optArr, onChange: typeOnChange});
        break;
        
        case 'item':
            $.each(optData, function(){
                optArr.push({
                    value: this.shortcode,
                    name: `${this.item} [${this.shortcode}]` 
                });
            });
            optMenuSelector.dropdown({values: optArr, onChange: itemOnChange});
        break;
    }
}