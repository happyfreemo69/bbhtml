function Tag(txt){
    this.raw = txt;
    this.name = '';
    this.attr = '';
    this.type = Tag.types.open;
    var s = txt.substring(1, txt.length-1);
    if(s[0]=='/'){
        s = s.substring(1);
        this.type = Tag.types.close;
    }
    if(s.includes('=')){
        var arr = s.split('=');
        this.name = arr[0];
        this.attr = arr[1];
    }else{
        this.name = s;
    }
}
Tag.types = {
    open:0,
    close:1,
    openclose:2
};
Tag.prototype.equals = function(tag){
    return this.name == tag.name;
}
module.exports = Tag;