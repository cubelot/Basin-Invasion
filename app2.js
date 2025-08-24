
//database and server stuff
// var mongojs = require("mongojs");
// var db = mongojs("127.0.0.1:27017/myGame", ["account","progress"]);

//db.account.insertOne({username:"b",password:"bb"});
var express = require("express");
var app = express();
var serv = require("http") .Server(app);

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/client/index.html");
});
app.use("/client",express.static(__dirname + "/client"));

serv.listen(2000);
console.log("server started");

var SOCKET_LIST = {};



var Entity = function(param) {
    var self = {
        x:250,
        y:250,
        spdX:0,
        spdY:0,
        id:"",
        map:"forest",
    }
    if(param) {
        if(param.x)
            self.x = param.x;
        if(param.x)
            self.y = param.y;
        if(param.map)
            self.map = param.map;
        if(param.id)
            self.id = param.id;
    }
    self.update = function(){
        self.updatePosition();
    }
    self.updatePosition = function() {
        self.x += self.spdX;
        self.y += self.spdY;
    }
    self.getDistance = function(pt) {
        return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
    }
    return self;
}

var Player = function(param){
    var self = Entity(param);
    self.number = "" + Math.floor(10 * Math.random());
    self.username = param.username;
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingAttack = false;
    self.mouseAngle = 0;
    self.maxSpd = 10;
    self.bulletNumber = 2;
    self.hp = 10;
    self.hpMax = 10;
    self.score = 0;
    self.cooldown = 0;
    
    
    var super_update = self.update;
    self.update = function() {
        self.updateSpd();
        super_update();

        if(self.pressingAttack && self.cooldown <= 0){
            for(var i = -((self.bulletNumber)/2); i < ((self.bulletNumber)/2); i++){
                self.shootBullet(i * 10 + self.mouseAngle);
            }
            self.cooldown = 10;   
        }
        else {
            self.cooldown--;
        }   
    }
    self.shootBullet = function(angle){
        var b = Bullet({
            parent:self.id,
            angle:angle,
            x:self.x,
            y:self.y,
            map:self.map,
     });
        b.x = self.x;
        b.y = self.y;
    }
    self.updateSpd = function() {
        if(self.pressingRight)
            self.spdX = self.maxSpd;
        else if(self.pressingLeft)
            self.spdX = -self.maxSpd;
        else
            self.spdX = 0;
        if (self.pressingUp)
            self.spdY = -self.maxSpd;
        else if(self.pressingDown)
            self.spdY = self.maxSpd;
        else 
            self.spdY = 0;
    }
    Player.list[self.id] = self;

    self.getInitPack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,
            number:self.number,
            hp:self.hp,
            hpMax:self.hpMax,
            score:self.score,
            map:self.map,
        }
    }

    self.getUpdatePack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,
            hp:self.hp,
            score:self.score,
            map:self.map,
        }
    }
    initPack.player.push(self.getInitPack());
    return self;
}
Player.list = {};
Player.onConnect = function(socket,username){
    var map = "forest";
    if(Math.random() < 0.5)
        map = "desert";
    var player = Player({
        id:socket.id,
        map:map,
        username:username,
    })
    socket.on("keyPress",function(data){
        if(data.inputId === "left")
            player.pressingLeft = data.state;
        else if(data.inputId === "right")
            player.pressingRight = data.state;
        else if(data.inputId === "up")
            player.pressingUp = data.state;
        else if(data.inputId === "down")
            player.pressingDown = data.state;
        else if(data.inputId === "attack")
            player.pressingAttack = data.state;
        else if(data.inputId === "mouseAngle")
            player.mouseAngle = data.state;
    });
    socket.on("changeMap",function(data){
        if(player.map === "desert")
            player.map = "forest";
        else if(player.map === "forest")
            player.map = "desert";
    });
    socket.on("sendMsgToServer",function(data){
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit("addToChat",player.username + ": " + data);
        }
    });
    socket.on("sendPMsgToServer",function(data){
        var recipientSocket = null;
        for(var i in Player.list)
            if(Player.list[i].username === data.username)
                recipientSocket = SOCKET_LIST[i];
        if(recipientSocket == null){
            socket.emit("addToChat","The player " + data.username + " is not online.");
        }
        else {
            recipientSocket.emit("addToChat","From " + player.username + ": " + data.message);
            socket.emit("addToChat","To " + data.username + ": " + data.message);
        }
    });
    socket.emit("init", {
        selfId:socket.id,
        player:Player.getAllInitPack(),
        bullet:Bullet.getAllInitPack(),
    })
    return player;

}

Player.getAllInitPack = function(){
    var players = [];
    for(var i in Player.list)
        players.push(Player.list[i].getInitPack());
    return players;
}
Player.onDisconnect = function(socket) {
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
}
Player.update = function() {
    var pack=[];
    for(var i in Player.list) {
        var player = Player.list[i];
        player.update();
        pack.push(player.getUpdatePack());
    }
    return pack;
}

var Bullet = function(param) {
    var self = Entity(param);
    self.id = Math.random(param);
    self.angle = param.angle;
    self.spdX = Math.cos(param.angle/180*Math.PI) * 10;
    self.spdY = Math.sin(param.angle/180*Math.PI) * 10;
    self.parent = param.parent;
    self.timer = 0;
    self.toRemove = false;
    self.collisionDistance = 32;
    var super_update = self.update;
    self.update = function(){
        if(self.timer++ > 100)
            self.toRemove = true;
        super_update();

        for(var i in Player.list){
            var p = Player.list[i]
            if(self.map == p.map && self.getDistance(p) < self.collisionDistance && self.parent !== p.id) {
                //handle collision
                p.hp -= 1;
                
                if(p.hp <= 0) {
                    var shooter = Player.list[self.parent];
                    if(shooter)
                        shooter.score += 1;
                    p.hp = p.hpMax;
                    p.x = Math.random()*500;
                    p.y = Math.random()*500;
                }
                self.toRemove = true;
            }
        }
    }
    Bullet.list[self.id] = self;
    
    self.getInitPack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y,
            map:self.map,
        }
    }

    self.getUpdatePack = function(){
        return {
            id:self.id,
            x:self.x,
            y:self.y
        }
    }
    
    initPack.bullet.push(self.getInitPack());
    return self;
}
Bullet.list = {};

Bullet.getAllInitPack = function(){
    var bullets = [];
    for(var i in Bullet.list)
        bullets.push(Bullet.list[i].getInitPack());
    return bullets;
}

Bullet.update = function(){
    
    var pack = [];
    for(var i in Bullet.list) {
        var bullet = Bullet.list[i];
        bullet.update();
        if (bullet.toRemove) {
            delete Bullet.list[i];
            removePack.bullet.push(bullet.id);
        }
        else 
            pack.push(bullet.getUpdatePack());
        }
    return pack;
}
//socket connecting + when login
var DEBUG = false;

var isValidPassword = function(data,cb){
    cb(true);
    // db.account.find({username:data.username,password:data.password},function(err,res){
    //     if(res.length > 0)
    //         cb(true);
    //     else
    //         cb(false);
            
    // });
}


var isUsernameTaken = function(data,cb){
    cb(false);
    // db.account.find({username:data.username},function(err,res){
    //     if(res.length > 0)
    //         cb(true);
    //     else
    //         cb(false);
    // });
}

var addUser = function(data,cb){
    cb();
    // db.account.insert({username:data.username,password:data.password},function(err){
    //     cb();
    // });
}    
  
var io = require("socket.io") (serv,{});
io.sockets.on("connection", function(socket) {
    
    socket.id=Math.random();
    
    SOCKET_LIST[socket.id] = socket;
    
    var player;

    socket.on("signIn",function(data){
        isValidPassword(data,function(res){
            if(res){
                Player.onConnect(socket,data.username);
                socket.emit("signInResponse",{success:true});
                
            }
            else {
                socket.emit("signInResponse", {success:false});
        }});
    });

    socket.on("signUp",function(data){
        isUsernameTaken(data,function(res){
            if(res) {
                socket.emit("signUpResponse",{success:false});
            }
            else {
                addUser(data,function(){
                    socket.emit("signUpResponse", {success:true});
                });
            }
        });
        
    });

    socket.on("disconnect",function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket)
        
    });
    
    socket.on("evalServer",function(data){
        if(!DEBUG)
            return;
        var res = eval(data); 
        for(var i in SOCKET_LIST){
            socket.emit("evalAnswer",res);
        }
    });
    


});



//Changing pack and bringing it client side
var initPack = {player:[],bullet:[]};
var removePack = {player:[],bullet:[]};


setInterval(function() {
    var pack = {
        player:Player.update(),
        bullet:Bullet.update(),
    }
   
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit("init",initPack);
        socket.emit('remove',removePack);
        socket.emit("update",pack);
    };
    initPack.player = [];
    initPack.bullet = [];
    removePack.player = [];
    removePack.bullet = [];

    
},1000/25);