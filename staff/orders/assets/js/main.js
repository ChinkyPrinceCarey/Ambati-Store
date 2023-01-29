API_ENDPOINT = "";
LIB_API_ENDPOINT = "";
if(window.location.hostname == "betastaff.ambatitastyfoods.com"){
    API_ENDPOINT = "https://beta.ambatitastyfoods.com";
}else{
    API_ENDPOINT = "https://ambatitastyfoods.com";
}
LIB_API_ENDPOINT = API_ENDPOINT + "/lib";

function smallModal(header, content, buttons, options){
  let main_container = $('.small.modal');
  let buttons_container = "";
  
  main_container.children(".header").html(header);
  main_container.children(".content").children("p").html(content);
  buttons.forEach(element => {
      if(element.node == "button"){
          buttons_container += `<button class="${element.class}" id="${element.id}">${element.text}</button>`;
      }else{
          buttons_container += `<div class="${element.class}" id="${element.id}">${element.text}</div>`;
      }
  });
  main_container.children(".actions").html(buttons_container);

  main_container.modal(options).modal('show');
}

function ajaxPostCall(param1, param2, callback){
    let url = (typeof param1 == "object") ? $(param1).prop('action') : param1;
    
    let jqxhr = $.post(url, param2)
        jqxhr.done(callback)
        jqxhr.fail(callback);
}

function getDate(format = "y-m-d", when = "today"){
    var date = new Date();

    if(when == "yesterday"){
        date.setDate(date.getDate() - 1);
    }else if(typeof when == "number"){
        date.setDate(date.getDate() + when);
    }

    var year = date.getFullYear();
    var month = (1 + date.getMonth()).toString().padStart(2, '0');
    var day = date.getDate().toString().padStart(2, '0');
    var hours = date.getHours().toString().padStart(2, '0');
    var minutes = date.getMinutes().toString().padStart(2, '0');
    var seconds = date.getSeconds().toString().padStart(2, '0');
  
    switch(format){
      case "y-m-d":
        return year + "-" + month + "-" + day;
      case "y-m-d t":
        return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
      case "d-m-y":
        return day + "-" + month + "-" + year;
      case "dm":
        return day + month;
      case "ymdt":
        return year + month + day + hours + minutes + seconds;
      case "d/m/y":
        return day + "/" + month + "/" + year;
      default:
        return "Invalid format";
    }
}

function updateSumOnFooter(api, column_index, is_decimal = true, prefix = "₹"){
    let total_sum = 0;
    if(api.column(column_index, { search:'applied' }).data().length){
        total_sum = api
           .column(column_index, { search:'applied' } )
           .data()
           .reduce(function(a, b){
                if(is_decimal){
                    return get_decimal(a) + get_decimal(b);
                }else{
                    return parseInt(a) + parseInt(b);
                }
           });
    }
    $(api.column(column_index).footer()).html(`${prefix} ${total_sum}`);  
}

function get_decimal(_val){
    if(typeof _val != "number") _val = parseFloat(_val);
    return parseFloat(_val.toFixed(2));
}

function getCurrentPage(){
    let url = window.location.href;
    let url_arr = url.split("/");
    url_arr = url_arr[url_arr.length - 1];
    url_arr = url_arr.split('?');
    return url_arr[0];
}