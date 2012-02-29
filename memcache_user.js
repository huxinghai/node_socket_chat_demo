var m = require("./memcache_client");

exports.memcached =function(errfn)
{
	var self = this;
	//获取用户key value
	this.get_user_by_key = function(key,fn)
	{
		console.log("---memcached--get----"+key+"---");
		m.get(key,fn);
	}

	//delete 离线 User
	this.delOfflineUser = function(callback){
		m.stats(function(results){
			getStateKey(results,function(results){
				if(results)
				{
					var user=JSON.parse(results);
					if(user.is_online=="false")
					{
						m.del(user.key,function(data){
							if(!data)
							{
								callback(user);
								console.log("----------"+user.name+"----下线了!");
							}
						})
					}
				}
			})
		})
	}

	//根据user_id查询某个用户是否在线
	this.queryMemcachedbyKeyifUserId = function(user)
	{
		m.stats(function(results){
			getStateKey(results,function(results){
				compareUserByNotKey(results,user,function(u){
					if(u.is_online=="true")
					{
						errfn("error",u.name+"已经异地登陆了！"+JSON.stringify(u),u.socket_id)
					}

					m.del(u.key);
					return;
				})
			})
		})
	}

	//查看user_id 是否在线
	this.queryUserIdOnline = function(user,callback)
	{
		m.stats(function(results){
			getStateKey(results,function(u){
				compareUserByNotKey(u,user,function(u){
					callback(u);
				})
			})
		})
	}

	//设置memcahced
	this.setMemached = function(key,value)
	{
		m.set(key,value);
	}

	this.deleteMemcacheBykey = function(key,fn)
	{
		m.del(key,fn);
	}

	//获相同ID,不同Key的用户
	function compareUserByNotKey(results,user,callback)
	{
		var u=JSON.parse(results);

		if(u==null || u==undefined){return;}

		if(user.id==u.id && u.key != user.key)
		{
			callback(u);
		}
	}


	//获取状态
	function getStateKey(s,callback)
	{
		if(s[0].curr_items>0)
		{
			m.items(function(results){
				var sm = results[0]
				var keys = Object.keys(sm);
				keys.pop();//删除server 键

				for(var j=0;j<keys.length;j++)
				{
					m.cachedump(sm.server,keys[j],sm[keys[j]].number,function(results){
						callbackCachedump(results,callback);
					})
				}
			})
		}
	}

	//获取cachedump 段的keys
	function callbackCachedump(results,callback)
	{
		if(results)
		{
			results = Array.isArray(results) ? results : [results];
			if(results.length>0)
			{
				for(var i=0;i<results.length;i++)
				{
					var _key=results[i].key;
					self.get_user_by_key(_key,callback);
				}
			}
		}
	}
}