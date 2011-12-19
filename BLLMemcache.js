var mc=require("memcached");

var m=new mc('localhost:11211');
//m.connect()


//根据key获取用户信息
exports.get_user_by_key=function(key,fn)
{
    console.log("get memcached key:"+key);
    if(key==undefined){return;}
    m.get(key,fn)
}

exports.ClearAll=function()
{
    Getstate(function(err,data){
        for(var key in data[0])
        {
            if(key!="server")
            {
                 m.cachedump(data[0].server,key,data[0][key].number,function(err,results){
                    if(!err)
                    {
                        results = Array.isArray(results) ? results : [results];
                        if(results.length>0)
                        {
                            for(var i=0;i<results.length;i++)
                            {
                                console.log(results[i].key);
                                //m.get(results[i].key,fn);
                                m.del(results[i].key,function(err,result){console.log(result)});
                            }
                        }
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

function Getcachedump(server,state,number,fn)
{
    m.cachedump(server,state,number,fn)
}

function Getstate(fn)
{
   m.stats(function(err,data){
      if(data[0].curr_items>0)
      {
         m.items(fn)
      }
   })
}

exports.setMemached=function(key,value)
{
    m.set(key,value,10000,function(err,results){
        if(!err)
        {
            console.log(results);
        }
        else
        {
            console.log(err);
        }
    });
}

//根据user_id查询某个用户是否在线
// fn.errfn 出错时触发事件
exports.queryMemcachedbyKeyifUserId=function(user,errfn)
{
   Getstate(function(err,data){
       console.log(data);
       if(data)
       {
          var callback=function(u){
              errfn("error",u.name+"已经异地登陆了！",u.socket_id)
              m.del(u.key);
          }
          stateCallback(data,user,errfn,callback);
       }
   });
}

//查看user_id 是否在线
exports.queryUserIdOnline=function(users,errfn,callback)
{
    Getstate(function(err,data){
        if(data)
        {
            for(var i=0;i<users.length;i++)
            {
                stateCallback(data,users[i],errfn,callback);
            }
        }
    })
}

//状态的回调
function stateCallback(data,user,errfn,callback)
{
	var keys = Object.keys(data[0]);
	keys.pop();//删除server 键

    console.log(keys);
    var isk=true;
    for(var j=0;j<keys.length;j++)
    {
       if(!isk){return}
       Getcachedump(data[0].server,keys[j],data[0][keys[j]].number,function(err,results){
          var errMessage=function(err){
              isk=false;
              console.log(err);
              errfn("error",err);
          };

          if(!err)
          {
              if(results)
              {
                  results = Array.isArray(results) ? results : [results];
                  if(results.length>0)
                  {
                      for(var i=0;i<results.length;i++)
                      {
                          if(!isk){return;}

                          var _key=results[i].key;
                           if(_key==user.key)
                           {
                              continue
                           }
                          exports.get_user_by_key(_key,function(err,results){
                              if(!err)
                              {
                                  if(!isk){return;}

                                  var u=JSON.parse(results);

                                  console.log(u);
                                  if(u==null || u==undefined)
                                  {
                                      return;
                                  }
                                  if(user.id==u.id)
                                  {
                                      isk=false; //关闭查找
                                      callback(u);
                                      return;
                                  }
                              }
                              else
                              {
                                  errMessage(err);
                              }
                          });
                      }
                  }
              }
          }
          else
          {
              errMessage(err);
          }
       })
    }
}

