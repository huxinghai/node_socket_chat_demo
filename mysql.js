var mysql=require('mysql'),
    config=require("./config").mysql;

var client=mysql.createClient(config);

client.query("USE neza_development")

//查询
var query=function(sql,fn)
{
    client.query(sql,fn);
};

exports.queryUser=function(sh,callback)
{
    query("select *from users where login like '%"+sh.login+"%' and id<>"+ sh.suser_id +" and not id in (select zuser_id from friends where user_id="+ sh.suser_id +")",callback);
}

//查询历史信息
/**exports.queryhistry=function(user_id,suser_id,callback_fn)
{
    query("select *from messages where state='true' and ((suser_id="+ user_id +" and user_id="+ suser_id +") or (suser_id="+ suser_id +" and user_id="+ user_id +")) ",callback_fn);
};**/

//查询发送的信息
exports.queryMsg=function(u,callback)
{
    var wh="";
    if(u.suser_id!=null && u.suser_id!=undefined)
    {
        wh=" and suser_id="+u.suser_id;
    }
    query("select *from messages where state='false' and user_id="+u.user_id + wh,callback);
}


//添加
exports.insertMessage=function(msg)
{
    var query=client.query("INSERT INTO messages set suser_id=?,user_id=?,messages=?,create_date=?,state=?",   [msg.suser_id,msg.user_id,msg.messages,new Date(),'false']);

    return query;
}

//通知好友
exports.noticeFriends=function(user_id,callback)
{
    query("select a.*,b.name,c.name as sname,'Friend' as type from messages as a"+
          " left join users as b on a.user_id=b.id "+
          " left join users as c on a.suser_id=c.id where state='false' and a.user_id="+user_id,callback);
}

//标识用户上线
exports.update_online=function(user)
{
    var query=client.query("UPDATE users set is_online='true',memache_key=?,socket_id=? where id=?",[user.key,user.socket_id,user.id]);

    return query;
}



//激请加好友
exports.add_friends=function(fr)
{
    var query=client.query("INSERT INTO friends set user_id=?,zuser_id=?",[fr.suser_id,fr.zuser_id]);

    return query;
}

//查询用户的好友
exports.queryFriendsFirst=function(data,callback)
{
        query("select b.login,b.name as sname,a.id,a.user_id,a.zuser_id from friends as a "+
          "left join users as b on a.zuser_id=b.id where a.user_id="+data.suser_id+" and a.zuser_id='"+data.zuser_id+"'",callback);
}

//查询所有好友
exports.query_friends=function(user_id,callback)
{
    query("select a.zuser_id,a.user_id,b.id,b.name from friends as a "+
          "left join users as b on a.zuser_id=b.id where a.user_id="+user_id,callback);
}

//查询某个好友
exports.query_friendOne=function(user_id,zuser_id,callback)
{
    query("select a.zuser_id,a.user_id,b.id,b.name from friends as a "+
          "left join users as b on a.zuser_id=b.id where a.user_id="+user_id+" and a.zuser_id="+zuser_id,callback);
}

exports.existfirends=function(user,callback)
{
    query("select a.*,b.name as sname,c.name from friends as a "+
            "left join users as b on a.user_id=b.id"+
            " left join users as c on a.zuser_id=c.id where a.user_id="+ user.suser_id +" and a.zuser_id="+user.zuser_id,callback)
}

//判断是否在存
exports.existUserId=function(user_id,callback)
{
    query("select *from users where id="+user_id,callback);
};

//标识阅读
exports.updateMessage=function(id,user_id)
{
    var query=client.query("UPDATE messages set state='true' where id=? and user_id=?",[id,user_id]);

    return query;
}

