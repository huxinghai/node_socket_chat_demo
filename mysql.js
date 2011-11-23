var mysql=require('mysql');

var client=mysql.createClient({
    user:"root",
    password:""
});

client.query("USE chat")

//查询
var query=function(sql,fn)
{
    client.query(sql,fn);
};

//查询历史信息
exports.queryhistry=function(user_id,suser_id,callback_fn)
{
    query("select *from messages where state='true' and ((suser_id="+ user_id +" and user_id="+ suser_id +") or (suser_id="+ suser_id +" and user_id="+ user_id +")) ",callback_fn);
};

//查询发送的信息
exports.queryMsg=function(u,callback)
{
    var wh="";
    if(u.suser_id!=null && u.suser_id!=undefined)
    {
        wh=" and a.suser_id="+u.suser_id;
    }
    query("select a.*,b.memache_key,c.memache_key as smemache_key from messages as a "+
              "left join users as b on a.user_id=b.id "+
              "left join users as c on a.suser_id=c.id "+
           "where a.state='false' and b.is_online='true' and a.user_id="+u.user_id + wh,callback);
}


//添加
exports.insert=function(msg)
{
    var query=client.query("INSERT INTO messages set suser_id=?,user_id=?,messages=?,slogin=?,login=?,create_date=?,state=?",   [msg.suser_id,msg.user_id,msg.messages,msg.slogin,msg.login,msg.create_date,msg.state]);

    return query;
}

//标识用户上线
exports.update_online=function(user)
{
    var query=client.query("UPDATE users set is_online='true',memache_key=?,socket_id=? where id=?",[user.key,user.socket_id,user.id]);

    return query;
}

//标识用记下线
exports.update_offline=function(user_id)
{
    var query=client.query("UPDATE users set is_online='false',memache_key='',socket_id='' where id=?",[user_id]);

    return query;
}

//激请加好友
exports.add_friends=function(fr)
{
    var query=client.query("INSERT INTO friends set user_id=?,zuser_id=?",[fr.user_id,fr.zuser_id]);

    return query;
}

//查询好友
exports.query_friends=function(user_id,callback)
{
    query("select a.zuser_id,a.user_id,b.id,b.login,b.is_online,memache_key,b.socket_id from friends as a "+
          "left join users as b on a.zuser_id=b.id where a.user_id="+user_id,callback);
}

exports.existfirends=function(user,callback)
{
    query("select a.*,b.login as slogin,c.login from friends as a "+
            "left join users as b on a.user_id=b.id"+
            " left join users as c on a.zuser_id=c.id where a.user_id="+ user.user_send +" and a.zuser_id="+user.user,callback)
}

//判断是否在存
exports.existUserIdOnline=function(user_id,callback)
{
    query("select *from users where is_online='true' and id="+user_id,callback);
};

//标识阅读
exports.update=function(ids)
{
    var query=client.query("UPDATE messages set state='true' where id in (?)",[ids]);

    return query;
}

