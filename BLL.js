//功能逻辑
exports.bll=function(m,db,socket,fu,errfn,redis)
{
    this.connection=function(data)
    {
        console.log(data);
        var user_key=data.user;
        //获取memcached key 值
        m.get_user_by_key(data.user,function(err,data){

            eval("var u="+data)
            if(u==null || u==undefined)
            {
              errMessage("error","用户没有登陆，请重新登陆！");
              return;
            }

            var user=u.user;
            //取名字
            socket.name=user_key

            user["key"]=user_key
            user["is_online"]='true' //上线
            user["socket_id"]=socket.id;
            console.log(socket.id);
            TaglinUser(user);       //标识用户上线

            islinUserbyId(user)     //判断是否在线

            //接收没有在线的信息
            Get_Message({user_id:user.id},function(err, results, fields){
                if(!err)
                {
                    if(results.length>0)
                    {
                        socket.emit(user.key,{data:results,type:"Messages"});
                        updateMessageState(results)
                    }
                }
                else
                {
                    errMessage("notice","显示没有在线的信息出错!"+err);
                }
            },"false");

            notice_user(user);  //告诉其它用户

            getNoticeMessage(user.id); //看有通知信息吗
        });
    };

    this.message_histroy=function(data)
    {
        /**db.queryhistry(data.id,data.sid,function(err, results, fields){
            if(!err)
            {
                socket.emit("msg_hist",results);
            }
            else
            {
                socket.emit("error",{error_stats:false,error_msg:"显示历史信息出错"+err});
            }
        }); //mysqldb **/

        var curr_callback=function(results)
        {
            if(results.length>0)
            {
                socket.emit("msg_hist",{data:results,type:"Messages"});
            }
        };

        redis.queryhistroy(data,curr_callback);
    }

    this.closeSocket=function(socket_name)
    {
        if(socket_name==undefined){return;}
         console.log("--key:"+socket_name+" connection close ----->");
         //获取memached key的信息
         m.get_user_by_key(socket_name,function(err,data){
             console.log(data);
             if( !err && data)
             {
                eval("var u="+data);
                if(u==undefined || u==null){ return; }
                var user=u.user;
                user["is_online"]="false"

                //删除memached的key
                m.deleteMemcacheBykey(socket_name,function(err,data){
                    if(data)
                    {
                        notice_user(user);        //告诉其它用户
                    }
                });
             }
         })
    };

    //搜索好友
    this.searchFriends=function(data)
    {
        if(data==null || data=="")
        {
            console.log("no search vlaue");
            return;
        }

        var callback=function(err,results)
        {
            if(!err)
            {
                socket.emit("Friends",results);
            }
        }

        db.queryUser(data,callback);
    }

    //通知上线与下线用户
    //user 登陆对象
    var notice_user=function(user)
    {
        notice_user_online(user);
    };

    //邀请好友
    this.nFriends=function(data)
    {
        if(data.user_id==undefined || data.suser_id==undefined)
        {
            errfn("notice","加入好友非法操作！");
            return;
        }
        db.insertMessage(data);

        getNoticeMessage(data.user_id);
    };

    //同意加入好友
    this.argeeFriends=function(data)
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
                        console.log(results);
                        if(!err)
                        {
                           var callbackNotice=function(u)
                            {
                                fu.io.sockets.socket(u.socket_id).emit("alluser",results);

                                var tuser=[]
                                for(var i=0;i<results.length;i++)
                                {
                                     tuser.push({key:'',id:results[i].zuser_id});
                                }

                                var callbackOnline=function(use)
                                {
                                    fu.io.sockets.socket(u.socket_id).emit("alluser",[use]);
                                }
                                m.queryUserIdOnline(tuser,errfn,callbackOnline);
                            }
                            m.queryUserIdOnline(results,errfn,callbackNotice);
                        }
                    }
                    db.queryFriendsFirst(data,callbackquery);
                }
            }
        }
        db.queryFriendsFirst(data,callback);
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
                    var users=[{key:'',id:user_id}]
                    var callbackMemcached=function(u)
                    {
                        fu.io.sockets.socket(u.socket_id).emit(u.key,{data:results,type:"Friends"});
                        updateSysMessageState(results); //更新状态
                    }
                    //如果用户在线把信息发送给它
                    m.queryUserIdOnline(users,errfn,callbackMemcached);
                }
            }
        }
        db.noticeFriends(user_id,callback);
    }

    //将发送信息保存
    this.add_messages=function(data)
    {
       var su=null //获取发送的用户资料

       var u=null  //获取接收用户的资料

        var addCallback=function(err, results, fields)
        {
            if(!err)
            {
                if(results.length>0)
                {
                   //stats 标识未读状态
                   var msg={state:'false',
                            suser_id:results[0].user_id,
                            user_id:results[0].zuser_id,
                            messages:data.messages,
                            slogin:results[0].slogin,
                            login:results[0].login,create_date:new Date()};

                   // db.insert(msg); // mysqldb
                   redis.addMessage([msg]);
                   sendMessage({suser_id:data.user_send,user_id:data.user});
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
        m.queryMemcachedbyKeyifUserId(user,errfn);
    };


    //添加用户
    var TaglinUser=function(user)
    {
        m.setMemached(user.key,JSON.stringify({user:user}));
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
            var recv_message=function(err, results, fields)
            {
                if(results.length>0)
                {

                    var users=[{key:"",id:results[0].suser_id},{key:"",id:results[0].user_id}];

                    var queryKeyMemcached=function(us)
                    {
                        fu.io.sockets.socket(us.socket_id).emit(us.key,{data:results,type:"Messages"});
                        //updateMessagqueryhistroyeState(results);
                        if(us.id==u.user_id)
                        {
                            updateMessageState(results);
                        }
                    }
                    //如果用户在线把信息发送给它
                    m.queryUserIdOnline(users,errfn,queryKeyMemcached);
                }
            };

           Get_Message(u,recv_message,"false");
        }
    }

    //获取信息
    //user:接收用户,send_user:发送用户
    var Get_Message=function(user,callback,state)
    {
        //db.queryMsg({user_id:user.id},callback); //mysqldb
        redis.query_Messages(user,callback,state);
    };

    //更新系统信息状态
    function updateSysMessageState(results)
    {
        var ids="";
        for(var i=0;i<results.length;i++)
        {
            ids+=ids=="" ? results[i].id : ","+results[i].id
        }

        db.updateMessage(ids); //mysqldb
    }

    //更新聊天状态
    function updateMessageState(results)
    {
        redis.updateMessageState(results);
    };


    //通知用户上线
    function notice_user_online(user)
    {
        var callback=function(err, results, fields)
        {
            console.log("query friends----------");
            console.log(results);

            if(!err)
            {
                m.queryUserIdOnline(results,errfn,function(u){
                   fu.io.sockets.socket(u.socket_id).emit("alluser",[user]);
                   fu.io.sockets.socket(user.socket_id).emit("alluser",[u]);
                })
                socket.emit("alluser",results);//告诉自己
            }
        };

        db.query_friends(user.id,callback)
    };
}

