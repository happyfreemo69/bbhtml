var Tag = require('../../lib/tag');
var assert = require('assert');
describe('tag', function(){
    
    it('opening', function(){
        var t = new Tag('[u]');
        assert.equal(t.name, 'u');
        assert.equal(t.type, Tag.types.open);
    });

    it('with attr', function(){
        var t = new Tag('[color=red]');
        assert.equal(t.name, 'color');
        assert.equal(t.attr, 'red');
    });

    it('closing', function(){
        var t = new Tag('[/u]');
        assert.equal(t.name, 'u');
        assert.equal(t.type, Tag.types.close);
    });
})