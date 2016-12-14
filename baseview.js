
function Directive(name,args,onBuild,onRender){
    this.name = name;
    this.args = args;
    this.onBuild=onBuild;//Right after replacewithplaceholder
    this.onRender = onRender;//Right after render (model change)
}

var directives = [
    new Directive(
        "content",
        function(){return [this.viewModel.get(arguments[0])]},
        function(content,el){$(el).html(content)},//used to say null, but you're not rendering on build. Or are you?'
        function(content,el){$(el).html(content)}),
    new Directive(//this was a silly experimental directive TODO delete
        "spanlist",
        function(){return [this.viewModel.get(arguments[0])]},
        function(arr,el){arr.forEach(function(){$(el).append("<span></span>");})},
        function(arr,el){arr.forEach(function(html,i){$(el).find("span").eq(i).html(html);})
        }),
    new Directive(
        "map",
        function(){return [this.viewModel.get(arguments[0]),this.childViewImports[arguments[1]],this.mappings[arguments[1]]]},
        function(collection,ChildView,mappings,el,nmmapcollection,nmmapview){
            this.childViews = collection.map(function(model,i){
                
                var childview = new ChildView({
                    model:model,
                    mappings:mappings,
                    index:i,
                    lastIndex:collection.length - i - 1
                });
                return childview;
            });

            var $children = $();
            this.childViews.forEach(function(childView,i){
                $children = $children.add(childView.el)
                childView.index = i;
            }.bind(this));
            $(el).replaceWith($children);
            this.$children = $children
        },
        function(collection,ChildView,mappings){
            
            this.childViews.forEach(function(childView,i){
                childView.lastIndex = collection.length - i - 1;
                childView.el.className = childView.className();
            });

            for(var i=this.childViews.length;i<collection.length;i++){
                this.childViews.push(new ChildView({
                    model:collection.models[i],
                    mappings:mappings,
                    index:i,
                    lastIndex:collection.length - i - 1
                }));
            }
            var $children = $();
            this.childViews.forEach(function(childView,i){
                $children = $children.add(childView.el)
            }.bind(this));
            this.$children.parent().empty().append($children);
            this.$children = $children;
        }),
    
        //This has to come last so that childviews directives are not read by parent (I think) 
    new Directive(
        "subview",
        function(){return [this.mappings[arguments[0]],this.subViewImports[arguments[0]]]},
        function(mappings,SubView,el,nmsubview){
            var options = {};
           
            if (mappings){
                _.extend(options,{mappings:mappings})
            }
            _.extend(options,{model:this.model});
    
            this.subViews[nmsubview] = new SubView(options);
            this.subViews[nmsubview].parent = this;
            this.$el.find("[nm-subview='"+nmsubview+"']").replaceWith(this.subViews[nmsubview].el)
        },
        null)
];

directives.cycle = function(view,functionName){
    this.filter(function(directive){return directive[functionName]}).forEach(function(directive){
        for (var i=0;i<this.directives["$"+directive.name].length;i++){
            var el = this.directives["$"+directive.name][i];
            var attr = el.getAttribute("nm-"+directive.name);
            var attrs = attr.split(":");

            args = directive.args.apply(this,attrs)

            directive[functionName].apply(this,args.concat([el]).concat(attrs))
        }
    }.bind(view))
}


var backboneViewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];
var additionalViewOptions = ['mappings','templateString','childViewImports','subViewImports','index','lastIndex']
var BaseView = Backbone.View.extend({
    constructor:function(options) {
        this.cid = _.uniqueId(this.tplid);
        this.templateString = $("#"+this.tplid).html();

        _.extend(this, _.pick(options, backboneViewOptions.concat(additionalViewOptions)));

        //Add this here so that it's available in className function
        this.viewModel = new Backbone.Model(_.clone(this.defaults));
        this.viewModel.attributes;
        
        //mappings contain mappings of view variables to model variables 
        this.subViews = {};
        this.childViews = {};
        this.propMap = {};
        this.funcs = {};

        _.each(this.mappings,function(modelVar,templateVar){
            if (typeof modelVar == "string") this.propMap[templateVar] = modelVar;
            else if (this.subViewImports[templateVar]) this.subViews[templateVar] = modelVar;
            else if (this.childViewImports[templateVar]) this.childViews[templateVar] = modelVar;
            else if (typeof modelVar == "function") this.funcs[templateVar] = modelVar;
        }.bind(this));     

        this.listenTo(this.model,"change",this.updateContextObject);
        this.updateContextObject(this.model,false);


        this._ensureElement();
        this.buildInnerHTML();
        this.initDirectives();

        this.build();
        this.listenTo(this.model,"change",function(){
            this.render()
        });
        this.initialize.apply(this, arguments);
    },
    
    initialize:function(options){
        //attach options to view (model, propMap, subViews, events)
        options = options || {};
        _.extend(this,options);
    },
    getModelAttr:function(attr){
        //quickly grab a models attribute by a view variable. Useful in classname function.
        if (typeof this.mappings[attr] =="string") return this.model.get(this.mappings[attr]);
        else return this.mappings[attr].call(this)
    },
    updateContextObject:function(model,changedOnly){
      

        var obj = {}
        
        //Change templateVars->modelVars to templateVars->model.get("modelVar"), and set on the model
        _.extend(obj,_.mapObject(this.propMap,function(modelVar){
            
            return model.get(modelVar);
        }));
        

        _.extend(obj,_.mapObject(this.funcs,function(func){
            var ret = func.call(this);
            return ret;
            //func.call makes it work but only once
        }.bind(this)))
                

        
        this.viewModel.set(obj);


        
    
    },
    build:function(){  
        directives.cycle(this,"onBuild")
        this.delegateEvents();
    },
    buildInnerHTML:function(){
        if (this.$el) this.$el.html(this.renderedTemplate());
        else {
            dummydiv = document.createElement("div");
            dummydiv.innerHTML = this.renderedTemplate();
            while(dummydiv.childNodes.length){
                this.el.appendChild(dummydiv.childNodes[0]);
            }
            //maybe less hackish solution http://stackoverflow.com/a/25214113/1763217
        }
    },
    initDirectives:function(){
        this.directives = {};

        if (this.$el){
            directives.forEach(function(directive){
                this.directives["$"+directive.name] = this.$el.find("[nm-"+directive.name+"]");
            }.bind(this))
        }
        else{
             directives.forEach(function(directive){
                this.directives["$"+directive.name] = $(this.el.querySelectorAll("[nm-"+directive.name+"]"))
            }.bind(this))
        }
        
    },
    renderedTemplate:function(){
        return _.template(this.templateString)(this.viewModel.attributes)
    },
    delegateEvents: function(events) {//http://stackoverflow.com/a/12193069/1763217
        var delegateEventSplitter = /^(\S+)\s*(.*)$/;
        events || (events = _.result(this, 'events'));                    
        if (!events) return this;
        this.undelegateEvents();
        for (var key in events) {
            var method = events[key];
            if (!_.isFunction(method)) method = this[events[key]];
            if (!method) throw new Error('Method "' + events[key] + '" does not exist');
            var match = key.match(delegateEventSplitter);
            var eventTypes = match[1].split(','), selector = match[2];
            method = _.bind(method, this);
            var self = this;
            _(eventTypes).each(function(eventName) {
                eventName += '.delegateEvents' + self.cid;
                if (selector === '') {
                self.$el.bind(eventName, method);
                } else {
                    self.$el.delegate(selector, eventName, method);
                }
            });
        }
    },
    render:function(){
        //Render is a function that takes directives and applies them.
        //This is better than using jquery .html() on the entire element because this way you don't lose events.

        var view = this;

        directives.cycle(this,"onRender")


        
        _.each(this.subViews,function(subView){
            subView.render();
        });
        
    },




    tagName:undefined,//don't want a tagName to be div by default. Rather, make it a documentfragment'
    subViewImports:{},
    childViewImports:{},
      _ensureElement: function() {
        //Overriding this to support document fragments
      if (!this.el) {
          if(this.attributes || this.id || this.className || this.tagName){//if you have any of these backbone properties, do backbone behavior
                var attrs = _.extend({}, _.result(this, 'attributes'));
                if (this.id) attrs.id = _.result(this, 'id');
                if (this.className) attrs['class'] = _.result(this, 'className');
                this.setElement(this._createElement(_.result(this, 'tagName') || 'div'));
                this._setAttributes(attrs);
          }
          else{//however, default to this.el being a documentfragment (makes this.el named improperly but whatever)
              this.el = new DocumentFragment();
          }
      } else {
        this.setElement(_.result(this, 'el'));
      }
    }
});