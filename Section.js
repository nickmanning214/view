//Note: I added class names here, just to be able to label selectors with class names so that they are more obviously selectors on first glance.
var Section = BaseView.extend({
    templateString:"<header class='section-header' nm-subview='Header'></header><section class='section-section' nm-content='section-content'></section><footer class='section-footer' nm-content='footer-content'></footer>",
    defaults:{
        "section-content":"You need to add section content",
        "footer-content":"You need to add footer content"
    },
    className:function(){
        //should be
        return this.getModelAttr("section-content");
    },
    tagName:"section",
    subViewImports:{
        "Header":Header
    }
})