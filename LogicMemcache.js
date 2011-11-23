var mc=require("./memcache").Client

var m=new mc(11211,'localhost');
m.connect()

//根据key获取用户信息
exports.get_user_by_key=function(key,fn)
{
  console.log("get memcached key:"+key);

   m.get(key,fn)
}

