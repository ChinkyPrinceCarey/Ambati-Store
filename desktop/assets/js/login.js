let loginPage = true; //used in main.js 
$(function(){
    $('.card').transition('fade up');

    $('#loginForm')
    .form({
        fields: {
            username : 'empty',
            password : ['minLength[6]', 'empty'],
        },
        inline : true,
        transition : "slide down",
        duration : 500,
        onSuccess: function(event, fields){
            event.preventDefault();
            $(this).addClass("loading");
            ajaxPostCall(`${LIB_API_ENDPOINT}/login.php`, {action: "read", data: fields}, function(response){
                console.log(response);
                if(response.status){
                    loginState(response.status, response.statusText);
                }else if(response.title){
                    loginState(response.title, response.content, response.result);

                    if(response.result){
                        //storing user in a cookie
                        let user_array = response.data[0];
                        if(user_array){
                            Cookies.set('id', user_array.id);
                            Cookies.set('username', user_array.username);
                            Cookies.set('password', user_array.password);
                            Cookies.set('mobile_number', user_array.mobile_number);
                            Cookies.set('role', user_array.role);

                            window.location.replace("index.html");
                        }else{
                            clearCurrentUser();
                        }
                    }
                }else{
                    loginState("Error", "Something went wrong on backend connection")
                }
            });
            $(this).removeClass("loading");
        }
    });
})

function loginState(title, content, isPositive = false){
    let main_container = $("form+#login-state");
    main_container.children("#title").text(title);
    main_container.children("#content").text(content);
    
    if(title === undefined){
        main_container.addClass("hidden");
    }else{
        main_container.removeClass("hidden");
    }

    if(isPositive){
        main_container.removeClass("negative");
        main_container.addClass("positive");
    }else{
        main_container.removeClass("positive");
        main_container.addClass("negative");

        $('.card').transition('shake').transition('fade');
    }
}