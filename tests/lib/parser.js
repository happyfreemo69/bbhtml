var Parser = require('../../lib/parser');
var assert = require('assert');
describe('parser', function(){
    var test = function(x,y,parser){
        var p = parser||new Parser();
        assert.equal(p.parse(x).html(),y)
    }
    it('base', function(){
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
    });

    it('ignores not known tags', function(){
        test('[e]g[/e]', '[e]g[/e]');
    });

    it('embeds', function(){
        test('d[u]g[b]test[/b]gro[/u]c', 'd<u>g<b>test</b>gro</u>c');
    });

    it('embeds2', function(){
        test('d[u]g[b]te[i]i[/i]st[/b]gro[/u]c', 'd<u>g<b>te<i>i</i>st</b>gro</u>c');
    });

    it('embeds with same tags', function(){
        test('d[u]g[b]te[u]i[/u]st[/b]gro[/u]c', 'd<u>g<b>te<u>i</u>st</b>gro</u>c');
    });

    it('handles list', function(){
        var p = new Parser();
        var Tag = Parser.Tag;
        p.nodes.list = p.nodeFactory.makeConstructor({alias:'ul'});
        p.nodes['*'] = p.nodeFactory.makeConstructor({alias:'li', crossCheck:false, cr2br:x=>x});
        test('[list][*]mok\n[*]dobbles[/list]', '<ul><li>mok</li><li>dobbles</li></ul>',p);
    });

    it('handles nested list', function(){
        //actually not supported, left for example
        var p = new Parser();
        var Tag = Parser.Tag;
        p.nodes.olist = p.nodeFactory.makeConstructor({alias:'ol', nesting:'#'});
        p.nodes['#'] = p.nodeFactory.makeConstructor({alias:'li', crossCheck:false});
        p.openCloseTags['#'] = 1;
        assert.equal(p.parse('[olist][#]te[olist][#]ok[/olist]st[#]dobbles[/olist]').html(), '<ol><li>te<ol><li>ok</li></ol>st</li><li>dobbles</li></ol>',p);
    });

    it('escapes html', function(){
        test('[u]<li>test</li>[/u]', '<u>&lt;li&gt;test&lt;/li&gt;</u>');
    });

    it('customs escapes html', function(){
        var p = new Parser({escapeHtml:x=>'gro'})
        assert.equal(p.parse('[u]<li>test</li>[/u]').html(), '<u>gro</u>', p);
    });

    it('customizes html', function(){
        var called = false;
        var thrown = false;
        var p = new Parser({escapeHtml:function(txt){
            if(txt=='a'){
                called = true;
                throw 'a';
            }
        }});
        try{
            assert.equal(p.parse('a').html(),'whatever')
        }catch(e){
            thrown = true;
        }
        assert(called);
        assert(thrown);
    });

    it('customs html', function(){
        var p = new Parser();
        var Tag = Parser.Tag;
        p.nodes.url = p.nodeFactory.makeConstructor({html:function(){
            //yes injection on tag
            return '<a href="'+this.tag.attr+'">'+this.nodes.map(x=>x.html()).join('')+'</a>';
        }});
        assert.equal(p.parse('[url=http://ok]te[i]i[/i]st[/url]').html(),'<a href="http://ok">te<i>i</i>st</a>')
    });

    it('basic alias', function(){
        var p = new Parser();
        p.nodes.quote = p.nodeFactory.makeConstructor({alias:'blockquote'});
        assert.equal(p.parse('[quote]x[/quote]').html(),'<blockquote>x</blockquote>')
    });

    it('ignore tags', function(){
        var p = new Parser();
        delete p.nodes.url;
        assert.equal(p.parse('[url=x]x[/url]').html(),'[url=x]x[/url]')
    });

    it('new node', function(){
        var p = new Parser();
        p.nodes.h1 = p.nodeFactory.makeConstructor();
        assert.equal(p.parse('[h1=x]x[/h1]').html(),'<h1>x</h1>')
    });

    it('customs cr to <br/>', function(){
        var p = new Parser({cr2br:x=>x});
        assert.equal(p.parse('[p]x\nx[/p]').html(),'<p>x\nx</p>',p)
    });
})