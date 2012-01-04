var mc=require("memcached"),
    config=require("./config").memcached;

var m=new mc(config.host);
//m.connect()


//根据key获取用户信息
exports.get_user_by_key=function(key,fn)
{
    console.log("get memcached key:"+key);
    if(key==undefined){return;}
    m.get(key,fn)
}

exports.delOfflineUserb=function(errfn,callback)
{
    Getstate(function(err,data){
       if(data)
       {
			var callbackAccion=function(err,results)
			{
				if(!err)
				{
					if(results)
					{
						var user=JSON.parse(results);
						if(!user)
						{
							return;
						}
						if(user.is_online=="false")
						{
							m.del(user.key,function(err,data){
								if(!data)
								{
									callback(user);
									console.log(user.name+"下线了!");
								}
							})
						}
					}
				}
			}	
          stateCallback(data,errfn,callbackAccion);
       }
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
				if(u.is_online=="true")
				{
					errfn("error",u.name+"已经异地登陆了！"+JSON.stringify(u),u.socket_id)
				}
				m.del(u.key);
			}
			var callbackAccion=function(err,results)
			{
				callbackGetUserByKey(err,results,callback,user);
			}	
          stateCallback(data,errfn,callbackAccion);
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
				callbackUserIdOnline(data,errfn,callback,users[i])
			}
        }
    })
}

function callbackUserIdOnline(data,errfn,callback,user)
{
	var callbackAccion=function(err,results)
	{
		callbackGetUserByKey(err,results,callback,user);
	}


	stateCallback(data,errfn,callbackAccion);
}

//状态的回调
function stateCallback(data,errfn,callback)
{
	var keys = Object.keys(data[0]);
	keys.pop();//删除server 键
	
	var callbackAccion=function(err,results)
	{
		callbackCachedump(err,results,callback);
	}

    console.log(keys);
    for(var j=0;j<keys.length;j++)
    {
       Getcachedump(data[0].server,keys[j],data[0][keys[j]].number,callbackAccion)
    }
}

function callbackCachedump(err,results,callback)
{
    if(!err)
    {
        if(results)
        {
            results = Array.isArray(results) ? results : [results];
            if(results.length>0)
            {
                for(var i=0;i<results.length;i++)
                {
                    var _key=results[i].key;
                    exports.get_user_by_key(_key,callback);
                }
            }
        }
    }
}

function callbackGetUserByKey(err,results,callback,user)
{
     if(!err)
     {
         var u=JSON.parse(results);
         console.log(u);
         if(u==null || u==undefined){return;}
         if(user.id==u.id && user.key!=u.key)
         {
             callback(u);
             return;
         }
     }
}

