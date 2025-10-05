
import {mapLoad,checkMap} from "./map.js"
import monsterData from "./monsters.json" assert {type:'json'}
import {initPack,removePack,SOCKET_LIST} from "../app.js"
import {ServerInventory} from "./ServerInventory.js"
import {Database} from "./Database.js"
import {checkCollision} from "../app.js"
class Entity {
    x;
    y;
    spdX;   
    spdY;
    id;
    map;
    type;
    animation = {};
    facing;
    constructor(param){
        this.x=250;
        this.y=250;
        this.spdX=0;
        this.spdY=0;
        this.id= Math.random();
        this.map="beginnings";
        this.type="entity";
        this.animation={};
        if(param) {
            if(param.x)
                this.x = param.x;
            if(param.x)
                this.y = param.y;
            if(param.map)
                this.map = param.map;
            if(param.id)
                this.id = param.id;
        }
        
    }
    update(){
        this.updatePosition();
    }
    updatePosition() {
        this.x += this.spdX;
        this.y += this.spdY;
    }
    getDistance (pt) {
        return Math.sqrt(Math.pow(this.x-pt.x,2) + Math.pow(this.y-pt.y,2));
    }
    
}

class Player extends Entity{
    username;
    pressingRight;
    pressingLeft;
    pressingUp;
    pressingDown;
    pressingAttack;
    mouseAngle;
    maxSpd;
    bulletNumber;
    hp;
    hpMax;
    score;
    cooldown;
    width;
    height;
    type;
    animation;
    facing;
    scale;
    static list = [];
    constructor(param){
        super(param);
        this.username = param.username;
        this.pressingRight = false;
        this.pressingLeft = false;
        this.pressingUp = false;
        this.pressingDown = false;
        this.pressingAttack = false;
        this.mouseAngle = 0;
        this.maxSpd = 10;
        this.bulletNumber = 2;
        this.hp = 10;
        this.hpMax = 10;
        this.score = 0;
        this.cooldown = 0;
        this.width = 40;
        this.height = 60;
        this.type = "player";
        this.animation = {
            idle:true,
            walk:false,
            hurt:false,
            die:false,
        }
        this.scale = 4;
        this.facing = "south";
        this.inventory = new ServerInventory(param.progress.items,param.socket);
        
        Player.list[this.id] = this;
        
        
        initPack.player.push(this.getInitPack());
        
    }
    
    update() {
        for (var i = 0; i < this.maxSpd; i++) {
            
        this.updateSpd();
        this.updatePosition();
        }

        if(this.pressingAttack && this.cooldown <= 0){
            for(var i = -((this.bulletNumber)/2); i < ((this.bulletNumber)/2); i++){
                this.shootBullet(i * 10 + this.mouseAngle);
            }
            this.cooldown = 10;   
        }
        else {
            this.cooldown--;
        }   
    }
    shootBullet(angle){
        if(Math.random() < 0.4)
            this.inventory.addItem("potion",1);
        var b = new Bullet({
            parent:this.id,
            angle:angle,
            x:this.x,
            y:this.y,
            map:this.map,
        });
        b.x = this.x;
        b.y = this.y;
    }
    updatePosition() {
        let oldX = this.x;
        this.x += this.spdX;
        if(checkMap(this.x,this.y, this.width, this.height,this.map) === false){
            this.x = oldX;
        }
        let oldY = this.y;
        this.y += this.spdY;
        if(checkMap(this.x,this.y, this.width, this.height,this.map) === false){
            this.y = oldY;
        }
    }
    updateSpd(){
        this.animation.walk=false;
        this.animation.idle = false;
        this.animation.die = false;
        this.animation.hurt = false;
        
        if(this.pressingUp){
            this.spdY = -1;
            this.animation.walk = true;
            this.facing = "north";
        }
        else if(this.pressingDown){
            this.spdY = 1;
            this.animation.walk = true;
            this.facing = "south";
        }
        else 
            this.spdY = 0;
        if(this.pressingRight){
                this.spdX = 1;
                this.animation.walk = true;
                this.facing = "east";
            }
        else if(this.pressingLeft){
                this.spdX = -1;
                this.animation.walk = true;
                this.facing = "west";
            }
        else
            this.spdX = 0;
        if(this.spdX && this.spdY == 0)
            this.animation.idle = true;
    }
    

    getInitPack(){
        return {
            id:this.id,
            x:this.x,
            y:this.y,
            number:this.number,
            hp:this.hp,
            hpMax:this.hpMax,
            score:this.score,
            map:this.map,
            width:this.width,
            height:this.height,
            animation:this.animation,
            facing:this.facing,
            scale:this.scale,
            type:this.type,
        }
    }

    getUpdatePack(){
        return {
            id:this.id,
            x:this.x,
            y:this.y,
            hp:this.hp,
            score:this.score,
            map:this.map,
            animation:this.animation,
            facing:this.facing,
        }
    }
    static onConnect(socket,username,progress){
        let map = "forest";
        if(Math.random() < 0.5)
            map = "desert";
        let player = new Player({
            id:socket.id,
            map:map,
            username:username,
            socket:socket,
            progress:progress,
        });
        mapLoad();
        player.inventory.refreshRender();
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
        socket.on("changeMap",function(){
            if(player.map === "desert")
                player.map = "forest";
            else if(player.map === "forest")
                player.map = "beginnings";
            else if(player.map === "beginnings")
                player.map = "desert";
        });
        socket.on("sendMsgToServer",function(data){
            for(var i in SOCKET_LIST){
                SOCKET_LIST[i].emit("addToChat",player.username + ": " + data);
            }
        });
        socket.on("sendPMsgToServer",function(data){
            let recipientSocket = null;
            for(let i in Player.list)
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
            monster:Monster.getAllInitPack(),
        })
        return player;

    }
    static getAllInitPack(){
        let players = [];
        for(let i in Player.list)
            players.push(Player.list[i].getInitPack());
        return players;
    }
    static onDisconnect(socket) {
        let player = Player.list[socket.id];
        if(!player)
            return;
        Database.savePlayerProgress({
            username:player.username,
            items:player.inventory.items,
        });
        delete Player.list[socket.id];
        removePack.player.push(socket.id);
    }
    static update() {
        let pack=[];
        for(let i in Player.list) {
            let player = Player.list[i];
            player.update();
            pack.push(player.getUpdatePack());
        }
        return pack;
    }
}
   



class Bullet extends Entity{
    angle;
    spdX;
    spdY;
    parent;
    timer;
    toRemove;
    width;
    type;
    height;
    animation = {};
    static list = [];
    constructor(param){
        super(param);
        console.log(this.id)
        this.angle = param.angle;
        this.spdX = Math.cos(param.angle/180*Math.PI) * 10;
        this.spdY = Math.sin(param.angle/180*Math.PI) * 10;
        this.parent = param.parent;
        this.timer = 0;
        this.toRemove = false;
        this.width = 24;
        this.type = "bullet";
        this.height = 24;
        this.animation = {
            none: true,
        }
        console.log(this.id)
        // var super_update = this.update;
        Bullet.list[this.id] = this;
        
        
        initPack.bullet.push(this.getInitPack());
    }
    update(){
        if(this.timer++ > 100)
            this.toRemove = true;
        super.update();

        for(var i in Player.list){
            
            let p = Player.list[i]
            
            if(this.map == p.map && checkCollision(this,p) && this.parent !== p.id) {
                //handle collision
                p.hp -= 1;
                
                if(p.hp <= 0) {
                    let shooter = Player.list[this.parent];
                    if(shooter)
                        shooter.score += 1;
                    p.hp = p.hpMax;
                    p.x = Math.random()*500;
                    p.y = Math.random()*500;
                }
                this.toRemove = true;
            }
            
        }
    }
    getInitPack(){
        return {
            id:this.id,
            x:this.x,
            y:this.y,
            map:this.map,
            width:this.width,
            height:this.height,
            animation:this.animation,
            type:this.type,
        }
    }

    getUpdatePack(){
        return {
            id:this.id,
            x:this.x,
            y:this.y,
            animation:this.animation,
        }
    }

    static getAllInitPack(){
        let bullets = [];
        for(let i in Bullet.list)
            bullets.push(Bullet.list[i].getInitPack());
        return bullets;
    }

    static allUpdate(){
        
        let pack = [];
        for(let i in Bullet.list) {
            let bullet = Bullet.list[i];
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
}



class Actor extends Entity {
    hp;
    hpMax;
    animation;
    facing;
    type;
    width;
    height;
    name;
    
    constructor(param){
        super(param)
        this.hp;
        this.hpMax;
        this.animation = {
            idle:true,
            walk:false,
            hurt:false,
            die:false,
        }
        this.type = "actor";
        this.facing = "south";
        this.height;
        this.width;
        this.name = "Actor";
        this.toSummon = false;
        
    }
}
class Monster extends Actor {
    static list = []
    constructor(param){
        super(param)
        this.monsterType = param.monsterType;
        this.type = "monster";
        this.name = param.name;
        this.hp = param.hp;
        this.hpMax = param.hpMax;
        this.animation = param.animation;
        this.height = param.height;
        this.width = param.width;
        this.name = param.name;
        this.spdX = param.spdX;
        this.spdY = param.spdY;
        this.map = param.map;
        Monster.list[this.id] = this;


        initPack.monster.push(this.getInitPack());
    }
    update(){
        if(this.hp <= 0)
            this.toRemove = true;
        
    }
    getInitPack(){
        return {
            id:this.id,
            x:this.x,
            y:this.y,
            hp:this.hp,
            hpMax:this.hpMax,
            map:this.map,
            width:this.width,
            height:this.height,
            animation:this.animation,
            facing:this.facing,
            type:this.type,
            monsterType:this.monsterType,
        }
    }

    getUpdatePack(){
        return {
            id:this.id,
            x:this.x,
            y:this.y,
            hp:this.hp,
            animation:this.animation,
            facing:this.facing,
        }
    }
    static getAllInitPack(){
        let monsters = [];
        for(let i in Monster.list)
            monsters.push(Monster.list[i].getInitPack());
        return monsters;
    }

    static allUpdate(){
        
        let pack = [];
        for(let i in Monster.list) {
            let monster = Monster.list[i];
            monster.update();
            if (monster.toRemove) {
                delete Monster.list[i];
                removePack.monster.push(monster.id);
            }
            else 
                pack.push(monster.getUpdatePack());
            }
        return pack;
    }
    static summonMonster(monsterType,x,y,map){
        let type = monsterTypes[monsterType]
        console.log(type)
        let monster = monsterData[type][monsterType]
        let summoningData = {
            x:x,
            y:y,
            hp:monster.hp,
            hpMax:monster.hpMax,
            animation:monster.animation,
            height:monster.height,
            width:monster.width,
            name:monster.name,
            monsterType:monsterType,
            map:monster.map,
            type:type,
        }
        if(map)
            summoningData.map = map;
        new Monster(summoningData);
        console.log("created monster");
    }

}

var monsterTypes = {
    slime:"monster",
}
export {Entity, Player, Bullet,Monster,Actor};