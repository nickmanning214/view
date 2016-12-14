Nav = BaseView.extend({
    //problem: it loses the selected class when rerendered from parent (data not stored anywhere).
    //Rather than forcing it into the template, maybe avoid rerendering this view somehow.
    //The problem is that when you click a span, it triggers an event. The parent view is listening for
    //this event. It sets the model which triggers a render. Render automatically renders all child
    //views, regardless of whether it is neccessary. In this case, the issue with rendering is you lose 
    //references to elements since each element is different. That's the problem with template strings.'
    tagName:"nav",
    templateString:"<div nm-spanlist='links'></div>",
    defaults:{
        links:["Link 1","Link 2","Link 3"]
    },
    events:{
        "click span":function(event){      
            var eventTrigger;
            if (!this.selected) {
                this.selected = event.currentTarget;
                $(this.selected).toggleClass("selected");
                eventTrigger = "select";
            }
            else if (this.selected!==event.currentTarget) {
                $(this.selected).toggleClass("selected");
                this.selected = event.currentTarget;
                $(this.selected).toggleClass("selected");
                eventTrigger = "switch"; 
            }
            else {
                $(this.selected).toggleClass("selected")
                this.selected = null;
                eventTrigger = "unselect";
            }            
            this.$el.trigger(eventTrigger,{index:this.$el.find("span").index(this.selected)});        
        }
    }
});