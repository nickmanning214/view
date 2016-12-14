Header = BaseView.extend({
    tagName:"header",
    templateString:"<h1 nm-content='h1-content'></h1><nav nm-subview='Nav' class='subview'></nav>",
    defaults:{
        "h1-content":"This template is missing an h1."
    },
    defaultSubViews:{
        "Nav":[Nav]//selectors as properties are messy. Use nm-subview
    },
    events:{
        "switch nav":function(){
            console.log("Switch")
        },
        "switch,select nav":function(){
            console.log("Select")
        },
        "unselect nav":function(){
            console.log("Unselect")
        }
    },
    subViewImports:{
        "Nav":Nav
    }
});