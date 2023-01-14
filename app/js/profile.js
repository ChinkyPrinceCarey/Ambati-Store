let request_url;
let request_params;
let manual_data;

function setDefaultInputValues(){
  if(Cookies.get('name') !== undefined){
    $('input#name').val(Cookies.get('name'));
  }

  if(Cookies.get('mobile_number') !== undefined){
    $('input#mobile_number').val(Cookies.get('mobile_number'));
  }
  
  if(Cookies.get('address') !== undefined){
    $('textarea#address').val(Cookies.get('address'));
  }
}

function onPageReady(){
  managePreloader(false);

  setDefaultInputValues();
  $('input, textarea').attr('disabled', true);

  $('button#logout').click(function(){
    Cookies.remove('username');
    Cookies.remove('password');

    window.location.href = `index.html`;
  });

  $('button#requestDelete').click(function(){

    let mailBody = encodeURIComponent(`Hello, kindly delete my account with username: ${Cookies.get('name')} \n Mobile Number: ${Cookies.get('mobile_number')} \n\n Regards,\n${Cookies.get('name')}`);

    window.location.href = `mailto:support@ditsa.in?subject=Request for deleting my account&body=${mailBody}`;
  });
}