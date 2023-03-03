class Localize {
    init() {
        $("[data-i18n]").each(function(element) {
            let message = chrome.i18n.getMessage($(this).attr('data-i18n'));
            if(this.nodeName === "OPTION"){
                $(this).text(message)
            }
            else{
                $(this).html(message)
            }
            
        })
    }
    
    localizeHtmlPage()
    {
        //Localize by replacing __MSG_***__ meta tags
        var objects = document.getElementsByTagName('html');
        for (var j = 0; j < objects.length; j++)
        {
            var obj = objects[j];
    
            var valStrH = obj.innerHTML.toString();
            var valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1)
            {
                return v1 ? chrome.i18n.getMessage(v1) : "";
            });
    
            if(valNewH != valStrH)
            {
                obj.innerHTML = valNewH;
            }
        }
    }    
}