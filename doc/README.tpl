another parser

this one handling nested lists

### covers:
    
    $grep 'test(' tests/lib/parser.js
{{COVERAGE}}

note:

    does NOT cover bbcode of the form
    
    [*]cc\n
    [*]cc\n

    (idem not wrapped by [/?list])

### usage:

    var p = new Parser();
    try{
        var html = p.parse('thebbcodestring').html()
    }catch(e){
        //errors may be raised, some because I should learn how to code, some you may want to hinder by customizing the parser
    }

### customization:

#### options

Parser accepts {escapeHtml:str=>str, cr2br:str=>str} (those one would not replace anything..)

- by default escapes <>&
- by default replaces \n,\r\n,\r in text nodes

Parser::parse will not escape any not configured tag (idem [whatever][/whatever] will be let as is)

#### custom html

In case you want to manage tag attributes

    var parser = new Parser
    parser.nodes.url = this.nodeFactory.makeConstructor({
        validTag: function(){
            if(!this.tag.attr.match(/#[a-f0-9A-F]{6}|\w+/)){
                throw 'invalid attr for color';
            }
        },
        html:function(){
            var color = this.tag.attr.match(/#[a-f0-9A-F]{6}|\w+/)[0];
            return '<span style="color:'+color+';">'+this.nodes.map(node=>node.html()).join('')+'</span>';
        }
    })

#### basic nodes

Adding more tags (e.g h1 is not handled by default)

    var parser = new Parser
    parser.nodes.h1 = parser.nodeFactory.makeConstructor()

Aliased nodes

    var parser = new Parser
    parser.nodes.quote = parser.nodeFactory.makeConstructor({alias: 'blockquote'})

#### removing parsed tag
    
Should you want not to parse urls

    var parser = new Parser
    delete parser.nodes.url