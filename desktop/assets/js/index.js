$(function(){
    let urlParams = new URLSearchParams(window.location.search)
    let urlPreRequestedError = urlParams.get('error')
    if(urlPreRequestedError){
        smallModal(
            `Error ${urlPreRequestedError}`,
            `The page you're trying to access thrown error ${urlPreRequestedError}`, 
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
                window.location.replace(getCurrentPage());
                return false;
            }
            }
        );
    }else{
        initStats();
    }

    /*
    $('.icon.toggle-visibility').on('click', function(){
        console.log(`clicked`);
        let toggle = $(this);
        let element = $(this).parent().children('div').children('.number');
        if(element.hasClass("opacity-0")){
            element.removeClass("opacity-0");
            element.addClass("opacity-1")
            toggle.addClass("slash")
    
            //now have to add the timer
            setTimeout(function(){
                if(element.hasClass("opacity-1")){
                    element.removeClass("opacity-1");
                    element.addClass("opacity-0");
                    toggle.removeClass("slash");
                }
            }, 1000)
        }else{
            element.removeClass("opacity-1");
            element.addClass("opacity-0");
            toggle.removeClass("slash");
        }
    });
    */

    $('.icon.toggle-visibility').on('mouseenter', function(){
        let element = $(this).parent().children('div').children('.number');
        element.removeClass("opacity-0");
        element.addClass("opacity-1")
    });
    
    $('.icon.toggle-visibility').on('mouseleave', function(){
        let element = $(this).parent().children('div').children('.number');
        element.removeClass("opacity-1");
        element.addClass("opacity-0")
    });
})

function initStats(){
    ajaxPostCall(`${LIB_API_ENDPOINT}/stats.php`, {data: "random_data"}, function(response){
        let modalTitle;
        let modalContent;
        if(response.status){
            modalTitle = response.status;
            modalContent = response.statusText;
        }else if(response.title){
            modalTitle = response.title;
            modalContent = response.content;
        }else if(response.result){
            if(response.data.length == 1){
                populateStatItems(response.data[0]);
            }else{
                console.log(`response`, response)
                modalTitle = "Something wrong with Stat Data";
                modalContent = "Stat Data contains no data items [or] multiple data items";
            }
        }else{
            modalTitle = "Error loading stats";
            //modalContent = "Something went wrong on backend connection";
            modalContent = response.info;
        }

        if(modalTitle && modalContent){
            smallModal(
                modalTitle, 
                modalContent, 
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

function populateStatItems(statData){
    //console.log('statData', statData);

    let container_stock_items = $("#stock_items");
    let container_total_sales = $("#total_sales");
    let container_total_revenue = $("#total_revenue");
    let container_total_profit = $("#total_profit");

    container_stock_items.children(".today").children(".number").attr('data-value', statData.today_stock_items)
    container_stock_items.children(".this-month").children(".number").attr('data-value', statData.this_month_stock_items)
    container_stock_items.children(".total").children(".number").attr('data-value', statData.total_stock_items)
    
    container_total_sales.children(".today").children(".number").attr('data-value', statData.today_sales)
    container_total_sales.children(".this-month").children(".number").attr('data-value', statData.this_month_sales)
    container_total_sales.children(".total").children(".number").attr('data-value', statData.total_sales)
    
    container_total_revenue.children(".today").children(".number").attr('data-value', statData.today_revenue)
    container_total_revenue.children(".this-month").children(".number").attr('data-value', statData.this_month_revenue)
    container_total_revenue.children(".total").children(".number").attr('data-value', statData.total_revenue)
    
    container_total_profit.children(".today").children(".number").attr('data-value', statData.today_profit)
    container_total_profit.children(".this-month").children(".number").attr('data-value', statData.this_month_profit)
    container_total_profit.children(".total").children(".number").attr('data-value', statData.total_profit)
    
    animateStat();
}

function animateStat(){
    $('.stat .number').each(function () {
        $(this).prop('Counter', 0).animate({
                Counter: $(this).data('value')
            }, {
            duration: 1000,
            easing: 'swing',
            step: function (now) {                      
                $(this).text(Math.ceil(now));
            }
        });
    });
}