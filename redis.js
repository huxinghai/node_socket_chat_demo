var redis=require("redis"),
    config=require("./config").redis;

var client=redis.createClient(config.port,config.host);

client.select(1);


//client.auth("huxinghai");
//exports.

var set=function(key,value,fn)
{
    client.set(key,value,fn)
}

var get=function(key,fn)
{
    client.get(key,fn)
}

var del=function(key,fn)
{
    client.del(key,fn);
}

//自增长
var incr=function(key,fn)
{
    client.incr(key,fn);
}

var tb={
  messages:"messages"
}

// 初始化
function init()
{
    for(var key in tb)
    {
        initMessageId(tb[key])
    }
}
init();

//添加信息
/**exports.addMessage=function(Msgs)
{
   AddTable(tb.messages,Msgs,"login")
}**/

//查询历史聊天记录
exports.queryhistroyAll=function(data,callback)
{
    var Msgs=[];
    var curr_callback=function(id,ids)
    {
        get(tb.messages+":"+id,function(err,msg){
            if(!err)
            {
                var callMethod=function()
                {
                    if(ids==id)
                    {
                        callback(Msgs);
                    }
                }

                var m=JSON.parse(msg);
                if(m==null || m==undefined)
                {
                    callMethod();
                    return;
                }

                if(m.state=="true" && ((m.user_id==data.id && m.suser_id==data.suser_id) || (m.suser_id==data.id && m.user_id==data.suser_id)))
                {
                    Msgs.push(m);
                }


                callMethod();
            }
        })
    }
    queryTableIds(tb.messages,curr_callback);
}

//查询一个星期的历史记录
exports.queryhistroyWeek = function(user_id,zuser_id,callback)  //user_id:用户ID zuser_id:好友ID
{
    var Msgs=[];
    var curr_callback=function(id,ids)
    {
        get(tb.messages+":"+id,function(err,msg){
            if(!err)
            {
                var callMethod=function()
                {
                    if(ids==id)
                    {
                        callback(Msgs);
                    }
                }

                var m=JSON.parse(msg);
                if(m==null || m==undefined)
                {
                    callMethod();
                    return;
                }

                //查询两人的聊天记录
                var wdate = addDay(null,-7); //获取7天前的日期
                var mdate = new Date(m.create_date); //发送信息的日期
                if(((m.user_id==user_id && m.suser_id == zuser_id) || (m.suser_id==user_id && m.user_id==zuser_id)) && wdate <= mdate)
                {
                    Msgs.push(m);
                }

                callMethod();
            }
        })
    }

    queryTableIds(tb.messages,curr_callback);
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

//标识状态
exports.updateMessageState=function(ids)
{
   for(var i=0;i<ids.length;i++)
   {
       get(tb.messages+":"+ids[i],function(err,msg){
            var m=JSON.parse(msg);
            if(m==undefined || m==null || m==false)
            {
                return;
            }
            m.state="true";
            set(tb.messages+":"+m.id,JSON.stringify(m),function(err,result){
              console.log(err);
              console.log(result);
            })
       });
   }
}

//获取用户接收的信息
exports.query_Messages=function(u,fncallback,state)
{
    queryMessage(u,fncallback,state);
}

function queryMessage(u,fncallback,state)
{
    var Msgs=[]
    var callback=function(id,ids)
    {
        get(tb.messages+":"+id,function(err,msg){
            var callMethod=function(){
                if(id==ids)
                {
                    fncallback(err,Msgs);
                }
            }

            if(msg)
            {
                var m=JSON.parse(msg);
                if(m!=null && m!=undefined)
                {
                    if(u.user_id==m.user_id)
                    {
                        if(u.suser_id!=null && u.suser_id!=undefined)
                        {
                            if(u.suser_id!=m.suser_id)
                            {
                                 callMethod();
                                 return;
                            }
                        }
                        if(m.state==state)
                        {
                            Msgs.push(m);
                        }
                    }
                }
            }
            callMethod();
        })
    };

    queryTableIds(tb.messages,callback);
}

function queryTableIds(tb_name,callback)
{
    get(tb_name+"Id",function(err,ids){
        if(!err)
        {
            if(ids)
            {
                for(var i=1;i<=ids;i++)
                {
                    callback(i,ids);
                }
            }
        }
        else
        {
            console.log(err);
        }
    })
}

exports.addMessage=function(trs)
{
    AddTable(tb.messages,trs);
}

//tbName 表名称 trs 行数
function AddTable(tbName,trs)
{
    var ix=0
    for(var i=0;i<trs.length;i++)
    {
        incr(tbName+"Id",function(err,id){
            if(!err)
            {
                if(id)
                {
                    var tr=trs[ix];
                    console.log(tr);
                    tr["id"]=id
                    set(tbName+":"+id,JSON.stringify(tr),function(err,result){
                        console.log(err);
                        console.log(result);

                    });
                }
            }
            else
            {
                console.log(err);
            }
            ix+=1;
        })
    }
}

//初始化信息ID
function initMessageId(table_name)
{
     //message 主键
    get(table_name+"Id",function(err,results){
        if(!err)
        {
            if(!results)
            {
                 set(table_name+"Id","0",function(err,results){
                    console.log(results);
                })
            }
        }else
        {
            console.log(err);
        }
    })
}

