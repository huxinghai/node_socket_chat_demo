var   db =require("./mysql")
		, mc=require("./memcache_user")
		, redis=require("./redis_message_bll");


//功能逻辑
exports.bll=function(socket,fu)
{	
	this.connection=function(data)
	{
		var user_key=data.key;
		//获取memcached key 值
		m.get_user_by_key(user_key,function(data){

			var user=JSON.parse(data);
			if(user==null || user==undefined || user==false)
			{
				errMessage("error","用户没有登陆，请重新登陆！");
				return;
			}
			//取名字
			socket.name = user_key;
			user["socket_id"] = socket.id;

			TaglinUser(user);       //标识用户上线

			islinUserbyId(user)     //判断是否在线

			//接收没有在线的信息
			Get_Message({user_id:user.id},function(results){
				if(results.length>0)
				{
					var relts=toMessageResults(results);
					socket.emit(user.key,{data:relts,type:"Messages"});
				}
			},"false");

			notice_user(user);  //告诉其它用户

			getNoticeMessage(user.id); //看有通知信息吗
		});
	};

	//argument date array 
	//例: data = [
	//				{ 	create_date:2012-02-24,id:1,messages:###,
	//					sname:张三,suser_id:123,name:李四,user_id:456,state:true
	//				},
	//				{ 	create_date:2012-02-28,id:1,messages:**,
	//					sname:张三,suser_id:123,name:李四,user_id:456,state:true
	//				}
	//			 ]
	//转换: data = [
	//					{
	//						sname:张三,suser_id:123,name:李四,user_id:456,state:true,
	//						msgs:[
	//								{create_date:2012-02-24,id:1,messages:###},
	//								{create_date:2012-02-28,id:1,messages:**}
	//							  ]
	//					}
	//			   ]
	function toMessageResults(data)
	{
		var info=[]
		for(var i=0;i<data.length;i++)
		{
			var id=data[i].id;
			var create_date=data[i].create_date;
			var messages=data[i].messages;
			var isk=false;
			for(var j=0;j<info.length;j++)
			{		
				if(data[i].suser_id==info[j].suser_id)
				{
					info[j]["msgs"].push({
						id: id,
						create_date: getCreateDateMessage(create_date),
						current_date: new Date(),
						messages: messages
					})
					isk=true
					break;
				}
			}

			if(isk){ continue };

			delete(data[i].id);
			delete(data[i].create_date);
			delete(data[i].messages);
			delete(data[i].state);

			data[i]["msgs"]=[{
				id: id,
				create_date: getCreateDateMessage(create_date),
				messages: messages,
				current_date: new Date()
			}];
			data[i]["type"]="Message"
			info.push(data[i]);
		}

		return info;
	}

	//获取信息时间yyyy-MM-dd h:m
	function getCreateDateMessage(date)
	{
		var tdate = new Date(date);

		return tdate.format("yyyy/MM/dd h:m");
	}

	//标识信息已经读取
	this.updateMsgState=function(ids)
	{
		if(ids.length>0)
		{
			redis.updateMessageState(ids);
		}
	}

	//聊天记录
	this.message_histroy=function(data)  //--
	{
		var curr_callback=function(results)
		{
			if(results.length>0)
			{
				socket.emit("msg_hist",{data:results,type:"Messages"});
			}
		};

		redis.queryhistroyAll(data,curr_callback);
	}

	//获取一个星期的历史信息
	this.messages_histroy_week=function(user_id,zuser_id) //user_id 当前用记ID zuser_id:好友ID
	{
		var callback = function(msgs)
		{
			var data = toMessageResults(msgs)
			socket.emit("msg_hist_week",data);
		}

		redis.queryhistroyWeek(user_id,zuser_id,callback);
	}

	this.closeSocket=function(socket_name)
	{
		if(socket_name==undefined){return;}
		console.log("--key:"+socket_name+" connection close ----->");
		inspectorIsLine(socket_name);
	};

	//检查是否在线
	function inspectorIsLine(key)
	{
		//获取memached key的信息
		m.get_user_by_key(key,function(data){
			if(data)
			{
				var user=JSON.parse(data);

				if(user==undefined || user==null){ return; }			
				if(user.is_online=="false")
				{
					//删除memached的key
					m.deleteMemcacheBykey(key,function(data){
						if(data)
						{
							notice_user(user);        //告诉其它用户
						}
					});
				}
			}
		})
	}
		
	//搜索好友
	this.searchFriends=function(data) //--
	{
			if(data==null || data=="")
			{
				console.log("no search vlaue");
				return;
			}

			db.queryUser(data,function(err,results){
				if(!err)
				{
					socket.emit("Friends",results);
				}
			});
	}

	//通知上线与下线用户
	//user 登陆对象
	var notice_user=function(user)
	{
		notice_user_online(user);
	};

	//邀请好友
	this.nFriends=function(data) //--
	{
		if(data.user_id==undefined || data.suser_id==undefined)
		{
			errMessage("notice","加入好友非法操作！");
			return;
		}
		db.insertMessage(data);

		getNoticeMessage(data.user_id);
	};

	//同意加入好友
	this.agreeFriends=function(data) //--
	{

		var callback=function(err,results)
		{
			if(!err)
			{
				if(results.length<=0)
				{
					db.add_friends(data);

					var callbackquery=function(err,results)
					{
						if(!err)
						{                            
							if(results.length>0)
							{                            
								var _user={id:results[0].user_id,key:null};
								m.queryUserIdOnline(_user,function(u){
									//先把好友资料发送到客户端    
									fu.io.sockets.socket(u.socket_id).emit("alluser",results);

									var tuser={id:results[0].zuser_id,key:null}
									m.queryUserIdOnline(tuser,function(use){
										fu.io.sockets.socket(u.socket_id).emit("alluser",[use]);
									}); //查看用户是否在线 
								});//如果用户在线把好友发送给客户端
							}
						}
					}
					db.queryFriendsFirst(data,callbackquery);  //查询好友信息
				}
			}
		}
		db.queryFriendsFirst(data,callback); //判断是否存在好友
	};

	//获取通知信息
	function getNoticeMessage(user_id)
	{
		var callback=function(err,results)
		{
			if(!err)
			{
				if(results.length>0)
				{
					var user={key:'',id:user_id}
					//如果用户在线把信息发送给它
					m.queryUserIdOnline(user,function(u){
						fu.io.sockets.socket(u.socket_id).emit(u.key,{data:results,type:"Friends"});
					});
				}
			}
		}
		db.noticeFriends(user_id,callback);
	}

	//将发送信息保存
	this.add_messages=function(data) //--
	{
		if(!data.messages)
		{
			errMessage("notice","发送信息不能为空!");
			return;
		} 

		var addCallback=function(err, results, fields)
		{
				if(!err)
				{
						if(results.length>0)
						{
							//stats 标识未读状态
							var msg={
							 	state: 'false',
								suser_id: results[0].user_id,
								user_id: results[0].zuser_id,
								messages: data.messages,
								sname: results[0].sname,
								name: results[0].name,
								create_date: new Date()
							};

							var callback =  function(msg)
							{
								var mg = JSON.parse(msg)
								sendOnlineUserInfo(data.suser_id,[mg])
							}

							redis.addMessage(msg,callback);  //添加信息
							//发送给好友信息
							sendMessage({suser_id:data.suser_id,user_id:data.zuser_id});
						}
				}
		}

		//查询好友
		db.existfirends(data,addCallback); // mysqldb
	};

	//判断用户是否在线
	var islinUserbyId=function(user)
	{
		//判断是否已经登陆
		m.queryMemcachedbyKeyifUserId(user);
	};


	//添加用户
	var TaglinUser=function(user)
	{
		m.setMemached(user.key,JSON.stringify(user));
	};


	//读取发送信息
	//suser_id 发送用户;user_id 接收用户user_id
	var writeInfo=function(_suser_id,_user_id)
	{
		sendMessage({suser_id:_suser_id,user_id:_user_id});
	};

	//发送信息
	function sendMessage(u)
	{
		if(u.user_id != null && u.user_id!=undefined)
		{
			var recv_message=function(results)
			{
				if(results.length>0)
				{
					sendOnlineUserInfo(results[0].user_id,results);
				}
			};

			Get_Message(u,recv_message,"false");
		}
	}

	function sendOnlineUserInfo(user_id,results)
	{
		var user={key:"",id:user_id};

		var resuInfo=toMessageResults(results);

		//如果用户在线把信息发送给它
		m.queryUserIdOnline(user,function(us){
			fu.io.sockets.socket(us.socket_id).emit(us.key,{data:resuInfo,type:"Messages"});
		});
	}

	//获取信息
	//user:接收用户,send_user:发送用户
	var Get_Message=function(user,callback,state)
	{
		redis.query_Messages(user,callback,state);
	};

	//更新系统信息状态
	this.updateSysMessageState=function(info)
	{
		if(info)
		{
			db.updateMessage(info.id,info.suser_id); //mysqldb
		}
	}


	//通知用户上线
	function notice_user_online(user)
	{
		var callback=function(err, results, fields)
		{
			console.log("query friends----------");
			console.log(results);

			if(!err)
			{
				for(var i=0;i<results.length;i++)
				{
					m.queryUserIdOnline(results[i],function(u){
						//上线好友告诉自己
						socket.emit("alluser",[u]);
						//告诉好友自己上线
						fu.io.sockets.socket(u.socket_id).emit("alluser",[user]);
					})
				}
			}
		};

		db.query_friends(user.id,callback)
	};

	//错误与提示信息
	var errMessage=function(_type,_messages,socket_id)
	{
		var s=socket
		if(socket_id)
		{
				s=fu.io.sockets.socket(socket_id);
		}
		s.emit("error",{type:_type,messages:_messages});
	}

	var m = new mc.memcached(errMessage);

	//清除上次的memcache
	m.delOfflineUser(notice_user);
}

