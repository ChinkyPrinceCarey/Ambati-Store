$(function(){
    console.log(`hello`)

    $("button#generate").on('click', function(){
        console.log(`clicked`)

        $("span#mfg").text($("input#mfg").val());
        $("span#weight").text($("input#weight").val());
        $("span#mrp").text($("input#mrp").val())
        $("span#expire_months").text($("input#expire_months").val())
    });

    $("#print").on('click', function(){
        window.print();
    });

})