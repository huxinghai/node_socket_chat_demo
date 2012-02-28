var redis=require("redis"),
	config=require("./config").redis;

var client=redis.createClient(config.port,config.host);

client.select(1);

exports.tbs=
{
    message:{
        name: "messages",
        columns: [
            "state",
            "suser_id",
            "user_id",
            "messages",
            "sname",
            "name",
            "create_date",
            "id"
        ]
    }
}

//自增长
exports.incr=function(key,fn)
{
    client.incr(key,function(err, results){
        GlobalCallback(err,results,"incr",fn);
    });
}

exports.set=function(key,value,fn)
{
    client.set(key,value,function(err,results){
        GlobalCallback(err,results,"set",fn);
    })
}

exports.get = function(key,fn)
{
    client.get(key,function(err,results){
        GlobalCallback(err,results,"get",fn);
    })
}

exports.mget = function(keys,fn)
{
    client.mget(keys,function(err,results){
        GlobalCallback(err,results,"mget",fn);
    })
}

exports.del=function(key,fn)
{
    client.del(key,function(err,results){
        GlobalCallback(err,results,"del",fn);
    });
}

exports.add_table = function(tb_name,tb_columns,info)
{
    this.incr(tb_name+"Id",function(id){
        info["id"] = id;
        for(var i=0;i<tb_columns.length;i++)
        {            
            this.set(tb_name+":"+id+":"+tb_columns[i],info[tb_columns[i]]);
        }
    })
}

function GlobalCallback(err,results,name,callback)
{
    if(!err)
    {
        if(callback)
        {
            callback(results);
        }        
    }else
    {
        show_redis_error(name,err);
    }
}

function show_redis_error(name,err)
{
    console.log("-----------"+ name +"--Function---error:"+err);
}

//初始化表ID
(function()
{
    function initMessageId(table_name)
    {    
        //message 主键
        this.get(table_name+"Id",function(results){
            if(!results)
            {
                this.set(table_name+"Id",0);
            }
        })
    }

    for(var key in this.tbs)
    {
        initMessageId(this.tbs[key].name);
    }
}())