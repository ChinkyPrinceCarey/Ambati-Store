let API_ENDPOINT = "https://ambatitastyfoods.com/v2/"; //for remote server

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

function getCurrentDate(format="ymd"){
	var dt = new Date();
	
    let date = toIsoString(dt).slice(0, 10);
    let dateArr = date.split('-');

    if(format == "ymd"){
        return date;
    }else if(format == "dmy"){
        return `${dateArr[2]}-${dateArr[1]}-${dateArr[0]}`;
    }else if(format == "dm"){
		return `${dateArr[2]}${dateArr[1]}`;
	}else if(format == "dmt"){
		return toIsoString(dt).slice(0, 19).replace(/[-T:]/gm, '');
	}else if(format == "d/m/y"){
        return `${dateArr[2]}/${dateArr[1]}/${dateArr[0]}`;
    }

    return date;
}

function toIsoString(date) {
  var tzo = -date.getTimezoneOffset(),
      dif = tzo >= 0 ? '+' : '-',
      pad = function(num) {
          var norm = Math.floor(Math.abs(num));
          return (norm < 10 ? '0' : '') + norm;
      };

  return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) +
      ':' + pad(date.getMinutes()) +
      ':' + pad(date.getSeconds()) +
      dif + pad(tzo / 60) +
      ':' + pad(tzo % 60);
}
