const USE_DB = true

import mongojs from "mongojs";
// var mongojs = require("mongojs");
const db = USE_DB ? mongojs("127.0.0.1:27017/myGame", ["account","progress"]) : null;

db.account.insertOne({username:"b",password:"bb"});
var Database = {};
Database.isValidPassword = function(data,cb){
    if(!USE_DB)
        return cb(true);
    db.account.findOne({username:data.username,password:data.password},function(err,res){
        if(res)
            cb(true);
        else
            cb(false);
            
    });
}


Database.isUsernameTaken = function(data,cb){
    if(!USE_DB)
        return cb(false);
    db.account.findOne({username:data.username},function(err,res){
        if(res)
            cb(false);
    });
}

Database.addUser = function(data,cb){
    if(!USE_DB)
        return cb();
    db.account.insert({username:data.username,password:data.password},function(err){
        Database.savePlayerProgress({username:data.username,items:[]},function(){
            cb();
        });
    });
}

Database.getPlayerProgress = function(username,cb){
    if(!USE_DB)
        return cb({items:[]});
    db.progress.findOne({username:username},function(err,res){
        console.log(err, res)
        if (res == null) {
            return cb({items:[]});
        }
        cb({items:res.items});
    });
}
Database.savePlayerProgress = function(data,cb){
    cb = cb || function(){}
    if(!USE_DB)
        return cb();
    db.progress.replaceOne({username:data.username},data,{upsert:true},cb);
}
export {Database};