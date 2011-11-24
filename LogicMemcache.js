var mc=require("memcached");

var m=new mc('localhost:11211');
//m.connect()


//根据key获取用户信息
exports.get_user_by_key=function(key,fn)
{
  console.log("get memcached key:"+key);

   m.get(key,fn)
}

exports.getOnlineUserAll=function(fn)
{
    m.items(function(err,data){
        for(var key in data[0])
        {
            if(key!="server")
            {
                 m.cachedump(data[0].server,key,data[0][key].number,function(err,results){
                    if(!err)
                    {
                    }
                    else
                    {
                        console.log(err);
                    }
                 })
            }
        }
        m.end();
    });
}

exports.deleteMemcacheBykey=function(key,fn)
{
    m.del(key,fn)
}

exports.existkey=function(key)
{

}

