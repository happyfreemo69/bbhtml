another parser

this one handling nested lists

### covers:
    
    $grep 'test(' tests/lib/parser.js
    test('[u]g[/u]', '<u>g</u>');
    test('[i]g[/i]', '<i>g</i>');
    test('[b]g[/b]', '<b>g</b>');
    test('[p]g[/p]', '<p>g</p>');
    test('[color=red]t[/color]', '<span style="color:red;">t</span>');
    test('[color=#eeeeee]t[/color]', '<span style="color:#eeeeee;">t</span>');
    test('[url=http://xx]t[/url]', '<a href="http://xx">t</a>');
    test('[url=http://x"x]t[/url]', '<a href="http://xx">t</a>');
    test('[list][*]te[list][*]ok[/list]st[*]dobbles[/list]', '<ul><li>te<ul><li>ok</li></ul>st</li><li>dobbles</li></ul>');
    test('[p]g\no\r\nk\r![/p]', '<p>g<br/>o<br/>k<br/>!</p>');
    test('[e]g[/e]', '[e]g[/e]');
    test('d[u]g[b]test[/b]gro[/u]c', 'd<u>g<b>test</b>gro</u>c');
    test('d[u]g[b]te[i]i[/i]st[/b]gro[/u]c', 'd<u>g<b>te<i>i</i>st</b>gro</u>c');
    test('d[u]g[b]te[u]i[/u]st[/b]gro[/u]c', 'd<u>g<b>te<u>i</u>st</b>gro</u>c');
    test('[list][*]mok\n[*]dobbles[/list]', '<ul><li>mok</li><li>dobbles</li></ul>',p);
    test('[u]<li>test</li>[/u]', '<u>&lt;li&gt;test&lt;/li&gt;</u>');


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