Directive = {};
Directive = Backbone.View.extend({
    name:null,
    build:null,
    render:null,
    initialize:function(options){
        if (!this.name) console.error("Error: Directive requires a name in the prototype.");
        this.val = this.el.getAttribute("nm-"+this.name);
        if (!options.parentView) console.error("Error: Directive requires a parentView passed as an option.");
        this.parentView = options.parentView;
        if (!this.childInit) console.error("Error: Directive requires childInit in prototype.");
        this.childInit();
        this.build();
    }
});

Directive.OptionalWrap = Directive.extend({
    name:"optionalwrap",
    childInit:function(){
       this.result = this.parentView.viewModel.get(this.val);


        //The viewmodel of the featurepanel is updated when the model changes.
        this.listenTo(this.parentView.viewModel,"change:"+this.val,function(){
            this.result = this.parentView.viewModel.get(this.val);
            this.render();
        })
        
        this.wrapper = this.el;
        this.childNodes = [].slice.call(this.el.childNodes, 0);
        
    },
    build:function(){
        if (!this.result) $(this.childNodes).unwrap();
    },
    render:function(){
        if (!this.result){
            $(this.childNodes).unwrap();
        }
        else {
           if (!document.body.contains(this.childNodes[0])){
                console.error("First child has to be in DOM");
                //solution: add a dummy text node at beginning
            }
            else if (!document.body.contains(this.wrapper)){
                this.childNodes[0].parentNode.insertBefore(this.wrapper,this.childNodes[0]);
            }
            for(var i=0;i<this.childNodes.length;i++){
                this.wrapper.appendChild(this.childNodes[i])
            }
        }
    }
})

Directive.Content = Directive.extend({
    name:"content",
    childInit:function(){
        this.content = this.parentView.viewModel.get(this.val);
        this.listenTo(this.parentView.viewModel,"change:"+this.val,function(){
            this.content = this.parentView.viewModel.get(this.val);
            this.render();
        })
    },
    build:function(){
        this.$el.html(this.content)
    },
    render:function(){
        this.$el.html(this.content)
    }
});

Directive.Href = Directive.extend({
    name:"href",
    childInit:function(){
        this.href = this.parentView.viewModel.get(this.val);
        this.listenTo(this.parentView.viewModel,"change:"+this.val,function(){
            this.href = this.parentView.viewModel.get(this.val);
            this.render();
        })
    },
    build:function(){
        if (this.$el.prop("tagName")=="A") this.$el.attr("href",this.href);
        else {
            var a = document.createElement("a");
            a.classList.add("wrapper-a")
            a.setAttribute("href",this.href);
            this.wrapperA = a;
            this.$el.wrap(a);
        }
    },
    render:function(){
        if (this.$el.prop("tagName")=="A") $(this.el).attr("href",this.href)
        else {
            this.wrapperA.setAttribute("href",this.href);
        }
    }
});

Directive.Src = Directive.extend({
    name:"src",
    childInit:function(){
        this.src = this.parentView.viewModel.get(this.val);
        this.listenTo(this.parentView.viewModel,"change:"+this.val,function(){
            this.src = this.parentView.viewModel.get(this.val);
            this.render();
        });
    },
    build:function(){
        this.$el.attr("src",this.src);
    },
    render:function(){
        this.$el.attr("src",this.src);
    }
});

Directive.Map = Directive.extend({
    name:"map",
    childInit:function(){
        this.collection = this.parentView.viewModel.get(this.val.split(":")[0]);
        this.ChildView = this.parentView.childViewImports[this.val.split(":")[1]];
        this.childViewMappings = this.parentView.mappings[this.val.split(":")[1]];
        //If there is an error here, it's possibly because you didn't include a mapping for this in the giant nested JSON in the parent parent parent parent parent view.
        
        this.listenTo(this.collection,"add",function(){
            this.collection = this.parentView.viewModel.get(this.val.split(":")[0]);
            this.renderAdd();
        });

        this.listenTo(this.collection,"reset",function(){
            this.collection = this.parentView.viewModel.get(this.val.split(":")[0]);            
            this.renderReset();
        })

        this.listenTo(this.collection,"remove",function(){
            this.collection = this.parentView.viewModel.get(this.val.split(":")[0]);            
            this.renderRemove();
        })
        
    },
    build:function(){
        //Map models to childView instances with their mappings
        this.childViews = this.collection.map(function(childModel,i){
            
            var childview = new this.ChildView({
                model:childModel,
                mappings:this.childViewMappings,
                index:i,
                lastIndex:this.collection.length - i - 1
            });
            return childview;
        }.bind(this));


        var $children = $();
        this.childViews.forEach(function(childView,i){
            $children = $children.add(childView.el)
            childView.index = i;
        }.bind(this));
        if ($children.length) {
            this.$el.replaceWith($children);
            this.$parent = $children.parent()
        }
        else{
            this.$parent = this.$el.parent();
        }
        this.$children = $children
    },
    renderAdd:function(){

        //update the childviews that already exist
        this.childViews.forEach(function(childView,i){
            childView.lastIndex = this.collection.length - i - 1;
            //This part is problematic because you will override 
            //classnames set manually on the element that aren't 
            //part of the view object (an event for example).

            //Any class names that need to be set on render should really be data attributes

            //var className = _.result(childView,"className");
            //if(className)childView.el.className = className;
            var attributes = _.extend({}, _.result(childView, 'attributes'))
            childView._setAttributes(attributes);
        }.bind(this));

        for(var i=this.childViews.length;i<this.collection.length;i++){
            this.childViews.push(new this.ChildView({
                model:this.collection.models[i],
                mappings:this.childViewMappings,
                index:i,
                lastIndex:this.collection.length - i - 1
            }));
        }
        var $children = $();
        this.childViews.forEach(function(childView,i){
            $children = $children.add(childView.el)
        }.bind(this));
        this.$parent.empty().append($children);
        this.$children = $children;
    },
    renderReset:function(){
        this.$parent.empty();
    },
    renderRemove:function(){
        this.$children.last().remove();
        this.childViews.splice(-1,1);
        this.$children = this.$parent.children();
    }
});

Directive.Optional = Directive.extend({
    name:"optional",
    childInit:function(){
        this.result = this.parentView.mappings[this.val].call(this.parentView);
        this.listenTo(this.parentView.viewModel,"change",function(){
            this.result = this.parentView.mappings[this.val].call(this.parentView);
            this.render();
        });
    },
    build:function(){
        if (!this.result) $(this.el).hide()
        else $(this.el).css("display","");
    },
    render:function(){
        if (!this.result) $(this.el).hide()
        else $(this.el).css("display","");
    }
});


Directive.Optional = Directive.extend({
    name:"enable",
    childInit:function(){
        this.result = this.parentView.mappings[this.val].call(this.parentView);
        this.listenTo(this.parentView.viewModel,"change",function(){
            this.result = this.parentView.mappings[this.val].call(this.parentView);
            this.render();
        });
    },
    build:function(){
        if (!this.result) $(this.el).prop("disabled",true);
        else $(this.el).prop("disabled","");
    },
    render:function(){
        if (!this.result) $(this.el).prop("disabled",true);
        else $(this.el).prop("disabled","");
    }
});

Directive.SubView = Directive.extend({
    name:"subview",
    childInit:function(){
        this.childMappings = this.parentView.mappings[this.val];

        if (this.parentView.subViewImports[this.val].prototype instanceof Backbone.View) this.ChildConstructor = this.parentView.subViewImports[this.val];
        else this.ChildConstructor = this.parentView.subViewImports[this.val].call(this.parentView);
        this.subViews = {};
    },
    build:function(){
        var options = {};
           
        if (this.childMappings){
            _.extend(options,{
                mappings:this.childMappings
                ,el:this.el
            })
        }
        _.extend(options,{model:this.parentView.model});

        //element is nm-map, but this.name=subview. What?
        this.subViews[this.val] = new this.ChildConstructor(options);
        var classes = _.result(this.subViews[this.val],"className")
        if (classes){
            classes.split(" ").forEach(function(cl){
                this.subViews[this.val].el.classList.add(cl)
            }.bind(this))
        };

        var attributes = _.result(this.subViews[this.val],"attributes");
        if (attributes){
            _.each(attributes,function(val,name){
                this.subViews[this.val].el.setAttribute(name,val)    
            }.bind(this))
        }
        
        this.subViews[this.val].parent = this;
        this.$el.replaceWith(this.subViews[this.val].el);
    }
})






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
        
        //mappings contain mappings of view variables to model variables.
        //strings are references to model variables. Functions are for when a view variable does
        //not match perfectly with a model variable. These are updated each time the model changes.
        this.propMap = {};
        this.funcs = {};

        _.each(this.mappings,function(modelVar,templateVar){
            if (typeof modelVar == "string") this.propMap[templateVar] = modelVar;
            else if (typeof modelVar == "function") this.funcs[templateVar] = modelVar;
        }.bind(this));     

        //Problem: if you update the model it updates for every subview (not efficient).
        //And it does not update for submodels. Perhaps there are many different solutions for this.
        //You can have each submodel trigger change event.
        
        //Whenever the model changes, update the viewModel by mapping properties of the model to properties of the view (assigned in mappings)
        this.listenTo(this.model,"change",this.updateContextObject);
        this.updateContextObject(this.model);


        this._ensureElement();
        this.buildInnerHTML();
        this.initDirectives();
        this.delegateEvents();
        

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
    updateContextObject:function(model){

        var obj = {}
        
        //Change templateVars->modelVars to templateVars->model.get("modelVar"), and set on the model
        _.extend(obj,_.mapObject(this.propMap,function(modelVar){
            
            return this.model.get(modelVar);
        }.bind(this)));
        

        _.extend(obj,_.mapObject(this.funcs,function(func){
            var ret = func.call(this);
            return ret;
            //func.call makes it work but only once
        }.bind(this)))
                

        
        this.viewModel.set(obj);


        
    
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

        for (var directiveName in Directive){
            var __proto = Directive[directiveName].prototype
            if (__proto instanceof Directive){ //because foreach will get more than just other directives
                var name = __proto.name;
                var elements = (this.$el)?$.makeArray(this.$el.find("[nm-"+name+"]")):$.makeArray($(this.el.querySelectorAll("[nm-"+name+"]")));
                
                
                if (elements.length) {
                    this.directives[name] = elements.map(function(element,i,elements){
                        //on the second go-around for nm-map, directiveName somehow is called "SubView"
                        return new Directive[directiveName]({
                            parentView:this,
                            el:element
                        });
                    }.bind(this)); 
                }
            }
        }

        /*
        this.directives = directiveTypes.reduce(function(directives,type){
            var elements = (this.$el)?$.makeArray(this.$el.find("[nm-"+type.name+"]")):$.makeArray($(this.el.querySelectorAll("[nm-"+type.name+"]")));
            if (elements.length) directives[type.name] = elements.map(function(element){
                return new Dir(type,element)
            });
            return directives;
        }.bind(this),{});
        */


        
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