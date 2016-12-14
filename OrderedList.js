var OrderedList = BaseView.extend({
    templateString:"<ol><% _.each(list,function(item){ %> <%= item %> <%})%> </ol>",
    defaults:{
        list:[
            "Item 1", "Item 2", "Item 3"
        ]
    }
});