var util = require('util');
var Tag = require('./tag');
function Node(tag){
    this.tag = tag;
    this.nodes = [];
}
Node.prototype.name = function(){return this.tag.name}
Node.prototype.addNode = function(node){
    this.nodes.push(node);
    return node;
}
Node.prototype.close = function(tag){
    if(!this.tag.equals(tag)){
        console.log('closing tf', this.name(), tag.name)
        throw 'tag mismatch:'+tag.name;
    }
}
Node.prototype.addText = function(txt){
    this.nodes.push(new TextNode(txt))
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
    Node.call(this, txt);
}
TextNode.prototype.html = function(){
    return this.tag;
}

util.inherits(TextNode, Node);

/**
 * [Parser description]
 * @param {{
 *    nodes: {string:CustomNode} CustomNode implements Node (probably ::html),
 * }} options [description]
 */
function Parser(options = {}){
    this.nodeFactory = {
        get:tag=>{
            var N = this.nodes[tag.name];
            if(N){
                return new N(tag);
            }
            return new Node(tag);
        },
        makeConstructor:function(opts={}){
            function C(){Node.apply(this, arguments)}
            util.inherits(C, Node);
            C.prototype.html = function(){
                var name = opts.alias||this.name();
                var html = '<'+name+'>'+this.nodes.map(node=>{
                    return node.html().trim();
                }).join('')+'</'+name+'>';
                return html
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
    this.nodes = options.nodes || {
        b: Node,
        u: Node,
        i: Node,
        p: Node
    };
    this.openCloseTags = {'*':1,'#':1}
    this.ons = {
        strangeTag: this.onStrangeTag.bind(this)
    };
}
var _count = 0;
function log(){
    var args = [' '.repeat(_count*2)].concat(...arguments)
    //console.log.apply(console.log, args)
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
    this.currentNode = new RootNode(new Tag('_'));//this tag must not be in this.nodes
    this.stack = [this.currentNode];

    while(count++<1000){//do not trust myself...
        var next = currentContent.match(re);
        if(next == null){
            //no more tokens to proceed
            this.currentNode.addText(currentContent);
            return this.currentNode.html();
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