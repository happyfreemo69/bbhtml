var util = require('util');
var Tag = require('./tag');
var _count = 0;
function log(){
    var args = [' '.repeat(_count*2)].concat(...arguments)
    //console.log.apply(console.log, args)
}

/**
 * [Node description]
 * @param {[type]} tag  [description]
 * @param {escapeHtml:str=>str} opts html function or falsy
 */
function Node(tag, opts){
    this.tag = tag;
    this.opts = opts;
    this.nodes = [];
}
Node.prototype.name = function(){return this.tag.name}
Node.prototype.addNode = function(node){
    this.nodes.push(node);
    return node;
}
Node.prototype.close = function(tag){
    if(this.tag.name != tag.name){
        log('closing tf', this.name(), tag.name)
        throw 'tag mismatch:'+tag.name;
    }
}
Node.prototype.addText = function(txt){
    this.nodes.push(new TextNode(txt, this.opts))
}
Node.prototype.html = function(){
    return '<'+this.tag.name+'>'+this.nodes.map(node=>{
        return node.html();
    }).join('')+'</'+this.tag.name+'>';
}

function RootNode(){
    Node.apply(this, arguments);
}
util.inherits(RootNode, Node);
RootNode.prototype.html = function(){
    return this.nodes.map(node=>{
        return node.html();
    }).join('')
}
function TextNode(txt){
    Node.apply(this, arguments);
}
TextNode.prototype.html = function(){
    //lazy escape the html upon processing..html
    var x = this.opts.escapeHtml(this.tag);
    x = this.opts.cr2br(x);
    return x;
}

util.inherits(TextNode, Node);

/**
 * The internal are quite exposed to users
 * bbcode is shitty and we all have something better to do than trying to make something shiny out of a
 * poorly designed solution anyway
 *
 * Following parser will somehow cover the basic usecases
 * 
 * @param {{
 *    nodes: {string:CustomNode} CustomNode implements Node (probably ::html),
 *    escapeHtml: str=>str
 *    cr2br: str=>str
 * }} options [description]
 */
function Parser(options = {}){
    this.escapeHtml = options.escapeHtml||function(txt){
        return txt.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    };
    this.cr2br = options.cr2br||function(txt){
        return txt.replace(/\r\n?|\n/g,'<br/>');
    };
    this.nodeFactory = {
        get:tag=>{
            var N = this.nodes[tag.name];
            if(N){
                return new N(tag, {escapeHtml:this.escapeHtml, cr2br: this.cr2br});
            }
            return new Node(tag,{escapeHtml:this.escapeHtml, cr2br: this.cr2br});
        },
        /**
         * [makeConstructor description]
         * @param  {
         *         validTag: function,
         *         crossCheck: false disables exceptions if mismatching tags
         *         nesting: dequeues stack until opening tag is found
         *             will raise exception if closed nodes do not have crossCheck:false
         *         html: function see implem
         *         
         * } opts [description]
         * @return {[type]}      [description]
         */
        makeConstructor:function(opts={}){
            function C(){
                Node.apply(this, arguments);
                if(opts.validTag && this.tag.type == Tag.types.open){
                    opts.validTag.call(this);
                }
                if(opts.cr2br){
                    this.opts.cr2br = opts.cr2br;
                }
            }
            util.inherits(C, Node);
            if(opts.html){
                C.prototype.html = opts.html;
            }else{
                C.prototype.html = function(){
                    var name = opts.alias||this.name();
                    var html = '<'+name+'>'+this.nodes.map(node=>{
                        return node.html().trim();
                    }).join('')+'</'+name+'>';
                    return html;
                }
            }

            if(opts.crossCheck === false){
                C.prototype.close = function(){}
            }
            if(opts.nesting){
                C.prototype.nesting = opts.nesting;
            }
            return C;
        }
    }
    var parser = this;
    this.nodes = options.nodes || {
        b: Node,
        i: Node,
        p: Node,
        u:this.nodeFactory.makeConstructor({
            html:function(){
                return '<span style="text-decoration: underline;">'+this.nodes.map(node=>node.html()).join('')+'</span>';
            }
        }),
        quote:parser.nodeFactory.makeConstructor({alias:'blockquote'}),
        color: this.nodeFactory.makeConstructor({
            validTag: function(){
                if(!this.tag.attr.match(/#[a-f0-9A-F]{6}|\w+/)){
                    throw 'invalid attr for color';
                }
            },
            html:function(){
                var color = this.tag.attr.match(/#[a-f0-9A-F]{6}|\w+/)[0];
                return '<span style="color:'+color+';">'+this.nodes.map(node=>node.html()).join('')+'</span>';
            }
        }),
        url: this.nodeFactory.makeConstructor({
            validTag: function(){
                if(this.tag.attr.trim().length = 0){
                    throw 'expect link for url';
                }
            },
            html:function(){
                //you dont want to modify & 
                var href = this.tag.attr.trim().replace(/"/g,'');
                return '<a href="'+href+'">'+this.nodes.map(node=>node.html()).join('')+'</a>';
            }
        }),
        list:parser.nodeFactory.makeConstructor({alias:'ul', nesting:'*', cr2br: function(x){return x}}),
        '*':parser.nodeFactory.makeConstructor({alias:'li', crossCheck:false,cr2br:function(x){return x;}}),
    };
    this.openCloseTags = {'*':1};
    this.ons = {
        strangeTag: this.onStrangeTag.bind(this)
    };
}
/**
 * @return {string}  html equivalent
 */
Parser.prototype.parse = function(str){
    var re = /\[\/?[^\[\]]+\]/;
    var beg = 0;
    var s = '';
    var currentContent = str;
    var count = 0;
    this.currentNode = new RootNode(new Tag('_'),{escapeHtml:this.escapeHtml, cr2br:this.cr2br});//this tag must not be in this.nodes
    this.stack = [this.currentNode];

    while(count++<1000){//do not trust myself...
        var next = currentContent.match(re);
        if(next == null){
            //no more tokens to proceed
            if(currentContent){
                this.currentNode.addText(currentContent);
            }
            return this.currentNode;
        }
        var tag = new Tag(next[0]);
        var delta = currentContent.substring(0, next.index);
        this.onTag(tag, delta);
        currentContent = currentContent.substring(next.index + tag.raw.length)
    }
    throw 'I suck '+count;
}
Parser.prototype.on = function(name, fn){
    this.ons[name] = fn;
}
Parser.prototype.onStrangeTag = function(tag, text){
    this.currentNode.addText(text+tag.raw);
}
Parser.prototype.openNode = function(tag, text, node){
    if(text){
        log('adding text ', text, 'to ', this.currentNode.name())
        this.currentNode.addText(text);
    }
    this.currentNode = this.currentNode.addNode(node || this.nodeFactory.get(tag))
    this.stack.push(this.currentNode);
    _count++;
}
Parser.prototype.closeNode = function(tag, text){
    this.currentNode.close(tag);
    if(text){
        this.currentNode.addText(text);
    }
    this.stack.pop();
    this.currentNode = this.stack[this.stack.length-1];
    _count--;
}

Parser.prototype.openCloseNode = function(tag,text){
    //tag is illformed
    //such as [*]
    if(this.currentNode.name() == tag.name){
        log('sibling', tag.raw, text)
        this.closeNode(tag,text);
        this.openNode(tag,'');
    }else{
        log('oc::open current ', this.currentNode.tag.raw, text)
        //this is actually wrong if previous tag is NOT [list] for a [*]
        //we should hint that * be tied to list for instance
        //lets just admit openCloseNodes will always be linked to tag [list]
        this.openNode(tag, text);
    }
}
/**
 * Up to you to reject the tag or not
 * @param  {[type]} tag   [description]
 * @param  {[type]} delta [description]
 * @return {[type]}       [description]
 */
Parser.prototype.onTag = function(tag, text){
    log('onTag::processs', tag.raw)
    //we may parse the (opening) tag as [url=xxx] or [color=xxx]
    if(!this.nodes.hasOwnProperty(tag.name)){
        log('strange')
        return this.ons.strangeTag.call(this, tag, text);
    }
    if(tag.type == Tag.types.open){
        log('onTag::opening ', tag.raw, text)
        if(!(tag.name in this.openCloseTags)){
            log('->open', tag.raw, text)
            this.openNode(tag, text);
        }else{
            log('->oc', tag.raw, text);
            this.openCloseNode(tag, text);
        }
        
    }else{
        if(!this.nodeFactory.get(tag).nesting){
            this.closeNode(tag, text);
        }else{
            //dequeue until opening tag is closed
            for(var i = this.stack.length-1; i>0; --i){
                var last = this.stack[this.stack.length-1];
                if(last.name()!=tag.name){
                    this.closeNode(tag, text);
                    text = '';
                }
            }
            if(this.stack.length > 1){
                this.closeNode(tag, text);
            }else{
                throw 'parsing failed';
            }
        }
    }
}
Parser.Tag = Tag;
Parser.Node = Node;
module.exports = Parser;