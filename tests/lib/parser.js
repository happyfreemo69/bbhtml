var Parser = require('../../lib/parser');
var assert = require('assert');
describe('parser', function(){
    var test = function(x,y,parser){
        var p = parser||new Parser();
        assert.equal(p.parse(x),y)
    }
    it('base', function(){
        test('[u]g[/u]', '<u>g</u>');
        test('[i]g[/i]', '<i>g</i>');
        test('[b]g[/b]', '<b>g</b>');
        test('[p]g[/p]', '<p>g</p>');
        test('[color=red]t[/color]', '<span style="color:red;">t</span>');
        test('[color=#eeeeee]t[/color]', '<span style="color:#eeeeee;">t</span>');
        test('[url=http://xx]t[/url]', '<a href="http://xx">t</a>');
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
        p.nodes['*'] = p.nodeFactory.makeConstructor({alias:'li', crossCheck:false});
        test('[list][*]mok\n[*]dobbles[/list]', '<ul><li>mok</li><li>dobbles</li></ul>',p);
    });

    it('handles nested list', function(){
        var p = new Parser();
        var Tag = Parser.Tag;
        p.nodes.list = p.nodeFactory.makeConstructor({alias:'ul', nesting:'*'});
        p.nodes['*'] = p.nodeFactory.makeConstructor({alias:'li', crossCheck:false});
        test('[list][*]te[list][*]ok[/list]st[*]dobbles[/list]', '<ul><li>te<ul><li>ok</li></ul>st</li><li>dobbles</li></ul>',p);
    });
    it('escapes html', function(){
        test('[u]<li>test</li>[/u]', '<u>litest/li</u>');
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
            assert.equal(p.parse('a'),'whatever')
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
        assert.equal(p.parse('[url=http://ok]te[i]i[/i]st[/url]'),'<a href="http://ok">te<i>i</i>st</a>')
    });
})