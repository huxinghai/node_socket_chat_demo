var r =  require("./redis_client");

var tb = r.tbs;


//获取历史信息
exports.queryhistroyAll = function(user,callback)
{
    query_msg(function(results){
        var Msgs = []
        for(var i=0;i<results.length;i++)
        {
            var m = JSON.parse(results[i]);
            if(m)
            {
                if((m.user_id==user.id && m.suser_id==user.suser_id) || (m.suser_id==user.id && m.user_id==user.suser_id))
                {
                    Msgs.push(m)
                }
            }
        }
        callback(Msgs);
    })
}

//获取一个星期的Message
//user_id:用户ID zuser_id:好友ID
exports.queryhistroyWeek = function(user_id,zuser_id,callback)
{
    query_msg(function(results){
        var Msgs = []
        for(var i=0;i<results.length;i++)
        {
            var m = JSON.parse(results[i]);
            if(m)
            {
                //查询两人的聊天记录
                var wdate = addDay(null,-7); //获取7天前的日期
                var mdate = new Date(m.create_date); //发送信息的日期
                if(((m.user_id==user_id && m.suser_id==zuser_id) || (m.suser_id==user_id && m.user_id==zuser_id)) && wdate <= mdate)
                {
                    Msgs.push(m)
                }
            }
        }
        callback(Msgs);
    });
}

//标识信息状态
exports.updateMessageState = function(ids)
{
    for(var i=0; i<ids.length;i++)
    {
        r.get(tb.message.name+":"+ids[i],function(result){
            var m = JSON.parse(result);
            m.state = "true";
            r.set(tb.message.name+":"+m.id,JSON.stringify(m));
        })       
    }
}

//获取表的所有key
function queryTableIds(table_name,callback)
{   
    ///^messages:[1-9]\d*$/
    r.get(table_name+"Id",function(ids){
        ids = parseInt(ids);
        for(var i=1 ;i<=ids; i++)
        {
            callback(i,ids);
        }
    })
}

function query_msg(callback)
{
    var MsgId = []
    queryTableIds(tb.message.name,function(id,ids){

        MsgId.push(tb.message.name+":"+id);
        if(id >= ids)
        {            
            r.mget(MsgId,function(results){
                callback(results);
            })
        }
    })
}

//获取用户接收的信息
exports.query_Messages=function(u,callback,state)
{
    query_msg(function(results){
        var Msgs = []
        for(var i=0;i<results.length;i++)
        {
            var m = JSON.parse(results[i]);
            if(m)
            {
                if(u.user_id==m.user_id && m.state==state)
                {
                    Msgs.push(m)
                }                        
            }
        }
        callback(Msgs);
    })
}

//添加信息
exports.addMessage=function(message,callback)
{
    r.incr(tb.message.name+"Id",function(id){
        message["id"] = id;
        r.set(tb.message.name+":"+id,JSON.stringify(message),function(result){
            r.get(tb.message.name+":"+id,callback);
        });
    })
}

//添加天
function addDay(date,_day)
{
    var d = date
    if(!d)
    {
        d = new Date();  
    }         
    
    var day = d.getDate();
    var t = day+_day
    if(t <= 0)
    {
        var _month = d.getMonth()-1
        d.setDate(0); //把天数还原
        if(_month<0)
        {
            d.setDate(d.getDate()+t);
        }
        else
        {
            d.setDate(d.getDate()+t);
        }
    }
    else
    {
        d.setDate(t);
    }
    d.setHours(0);
    d.setMinutes(0);
    return d
}