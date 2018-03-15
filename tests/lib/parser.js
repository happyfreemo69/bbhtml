var Parser = require('../../lib/parser');
var assert = require('assert');
describe('parser', function(){
    var test = function(x,y){
        var p = new Parser();
        assert.equal(p.parse(x),y)
    }
    it('base', function(){
        test('[u]g[/u]', '<u>g</u>');
        test('[i]g[/i]', '<i>g</i>');
        test('[b]g[/b]', '<b>g</b>');
        test('[p]g[/p]', '<p>g</p>');
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
        assert.equal(p.parse('[list][*]test\n[*]dobbles[/list]'), '<ul><li>test</li><li>dobbles</li></ul>');
    });

    it('handles nested list', function(){
        var p = new Parser();
        var Tag = Parser.Tag;
        p.nodes.list = p.nodeFactory.makeConstructor({alias:'ul', nesting:'*'});
        p.nodes['*'] = p.nodeFactory.makeConstructor({alias:'li', crossCheck:false});
        assert.equal(p.parse('[list][*]te[list][*]ok[/list]st[*]dobbles[/list]'), '<ul><li>te<ul><li>ok</li></ul>st</li><li>dobbles</li></ul>');
    });
})