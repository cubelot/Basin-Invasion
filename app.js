import {Entity, Player, Bullet,Monster,Actor} from "./server/Entity.js";
import {ServerInventory} from "./server/ServerInventory.js";
//database and server stuff
import {Database} from "./server/Database.js";
// require("./entity")
import express from "express";
// var express = require("express");
const app = express();
import http from "http";
const serv = http.Server(app);
import {mapLoad} from "./server/map.js"
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
    
const __dirname = dirname(fileURLToPath(import.meta.url));

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/client/index.html");
});
app.use("/client",express.static(__dirname + "/client"));

serv.listen(2000);
console.log("server started");

var SOCKET_LIST = {};

var checkCollision = function(rect1, rect2) {
  
    const rect1Right = rect1.x + rect1.width;
    const rect1Bottom = rect1.y + rect1.height;
    const rect2Right = rect2.x + rect2.width;
    const rect2Bottom = rect2.y + rect2.height;
    
    const xOverlap = rect1Right > rect2.x && rect1.x < rect2Right;

    const yOverlap = rect1Bottom > rect2.y && rect1.y < rect2Bottom;
    if(xOverlap && yOverlap == true){
        return true;
    }
    else {
        return false
    }

}


//socket connecting + when login
var DEBUG = true;


import {Server} from "socket.io";
const io = new Server(serv, {});
io.sockets.on("connection", function(socket) {
    
    socket.id=Math.random();
    
    SOCKET_LIST[socket.id] = socket;
    

    socket.on("signIn",function(data){
        Database.isValidPassword(data,function(res){
            if(!res)
                socket.emit("signInResponse", {success:false});
            Database.getPlayerProgress(data.username,function(progress){
                Player.onConnect(socket,data.username,progress);
                socket.emit("signInResponse",{success:true});
                
            });
        });
    });

    socket.on("signUp",function(data){
        Database.isUsernameTaken(data,function(res){
            if(res) {
                socket.emit("signUpResponse",{success:false});
            }
            else {
                Database.addUser(data,function(){
                    socket.emit("signUpResponse", {success:true});
                });
            }
        });
        
    });

    socket.on("disconnect",function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
        
    });
    
    socket.on("evalServer",function(data){
        if(!DEBUG)
            return;
        var result;
        console.log(data)
        let command = data.split(" ")[0];
        let properties = data.split(" ")[1].split(",")
        console.log(command)
        console.log(properties)
        switch(command){
            case "/id":
                if(properties.length === 1){
                    if(properties[0] === "self")
                        result = socket.id;
                    if(properties[0] === "allMonster"){
                        var monsterId = []
                        for(var i in Monster.list){
                            monsterId.push(i)
                        }
                        
                        result = monsterId;
                    }
                }
                break;
                    
            case "/summon":
                for(var i = 0; i < properties.length; i++){
                    if(0 < properties.length < 4)
                    if(i === 3)
                        var map = properties[3];
                    
                }
                let x = parseInt(properties[1])
                let y = parseInt(properties[2])
                let monsterType = String(properties[0])
                if(map) {
                    Monster.summonMonster(monsterType,x,y,map)
                    console.log("summoned")
                }
                else {
                    Monster.summonMonster(monsterType,x,y)
                    console.log("summoned")
                }
                break;
            default:
                alert("Incorrect Command");

        }

        socket.emit("evalAnswer",result);
    });
    
    


});



//Changing pack and bringing it client side
var initPack = {player:[],bullet:[],monster:[]};
var removePack = {player:[],bullet:[],monster:[]};


setInterval(function() {
    var pack = {
        player:Player.update(),
        bullet:Bullet.allUpdate(),
        monster:Monster.allUpdate(),
    }
   
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit("init",initPack);
        socket.emit('remove',removePack);
        socket.emit("update",pack);
    };
    initPack.player = [];
    initPack.bullet = [];
    initPack.monster = [];
    removePack.player = [];
    removePack.bullet = [];
    removePack.monster = [];

    
},1000/25);



export {initPack,removePack,SOCKET_LIST,checkCollision};