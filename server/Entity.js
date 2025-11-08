
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
        this.spd = 1;
        this.maxSpd = 5;
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
        this.spdX = this.spdX * this.spd;
        this.spdY = this.spdY * this.spd;
        let oldX = this.x;
        this.x += this.spdX;
        if(checkMap(this.x,this.y, this.width, this.height,this.map) === false){
            this.x = oldX;
            if(this.type === "bullet"){
                this.toRemove = true;
            }
        }
        let oldY = this.y;
        this.y += this.spdY;
        if(checkMap(this.x,this.y, this.width, this.height,this.map) === false){
            this.y = oldY;
            if(this.type === "bullet"){
                this.toRemove = true;
            }
        }
        this.spdX = this.spdX/this.spd;
        this.spdY = this.spdY/this.spd;
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
        this.bulletNumber = 1;
        this.hp = 11231231230;
        this.hpMax = 10123123123;
        this.score = 0;
        this.cooldown = 0;
        this.width = 32;
        this.height = 56;
        this.status = "alive";
        this.aniStats = {
            y:0,
            frames:0,
            spd:0,
            current:0,
        }
        this.type = "player";
        this.animation = {
            idle:true,
            walk:false,
            hurt:false,
            die:false,
        }
        this.scale = 4;
        this.facing = "down";
        this.immunityFrame = 20;
        this.inventory = new ServerInventory(param.progress.items,param.socket);
        this.direction = "south";
        
        Player.list[this.id] = this;
        
        
        initPack.player.push(this.getInitPack());
        
    }
    
    update() {
        for (var i = 0; i < this.maxSpd; i++) {
            this.updateSpd();
            this.updatePosition();
            this.updateAnimations();
        }
        if(this.status === "dead"){
            this.immunityFrame = 100;
        }
        if(this.status === "hurt")
            this.immunityFrame = 100;
        if(this.pressingAttack && this.cooldown <= 0){
            this.shootBullet(this.mouseAngle);
            // for(var i = -((this.bulletNumber)/2); i < ((this.bulletNumber)/2); i++){
            //     this.shootBullet(i * 10 + this.mouseAngle);
            // }
            this.cooldown = 20;   
        }
        else {
            this.cooldown--;
        }
        if(this.immunityFrame > 0){
            this.immunityFrame--;
        }
        
    }
    updateAnimations(){
        console.log(this.status)
        if(this.animation.die === true){
            this.status = "dead";
        }
        else if (this.animation.hurt === true){
            if (this.status != "hurt") {
                this.aniStats.current = 0;
            }
            this.status = "hurt";
        }
        if(this.animation.die === true){
            this.aniStats.y = 12;
            this.aniStats.frames = 5;
            this.aniStats.spd = 1/30;
        }
        else if(this.animation.hurt === true){
            this.aniStats.y = 8;
            this.aniStats.frames = 2;
            this.aniStats.spd = 1/30;
        }
        else if(this.animation.walk === true){
            this.aniStats.y = 4;
            this.aniStats.frames = 4;
            this.aniStats.spd = 1/30;
        }
        else {
            this.aniStats.y = 0;
            this.aniStats.frames = 2;
            this.aniStats.spd = 1/60;
        }
        if(this.facing === "up"){
            this.aniStats.y += 3;
        }
        else if(this.facing === "down"){
            this.aniStats.y += 0;
        }
        else if(this.facing === 'right'){
            this.aniStats.y += 1;
        }
        else if(this.facing === 'left'){
            this.aniStats.y += 2;
        }
        
        this.aniStats.current += this.aniStats.spd;
        if(this.aniStats.current >= this.aniStats.frames){
            if(this.status === "dead" || this.animation.die === true){
                this.status = "alive";
                this.x = 500;
                this.y = 250;
                this.hp = this.hpMax;
                this.score--;
                this.immunityFrame = 20;
                this.animation.die = false;
            }
            if(this.status === "hurt" || this.animation.hurt === true){
                this.status = "alive";
                this.immunityFrame = 10;
                this.animation.hurt = false;
            }
            
        }
        this.aniStats.current %= this.aniStats.frames;
        console.log(this.aniStats)
        // console.log(this.aniStats)
        // console.log(this.animation)
        
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
    // updatePosition() {
    //     let oldX = this.x;
    //     this.x += this.spdX;
    //     if(checkMap(this.x,this.y, this.width, this.height,this.map) === false){
    //         this.x = oldX;
    //     }
    //     let oldY = this.y;
    //     this.y += this.spdY;
    //     if(checkMap(this.x,this.y, this.width, this.height,this.map) === false){
    //         this.y = oldY;
    //     }
    // }
    updateSpd(){
        this.spdX = 0;
        this.spdY = 0;
        this.animation.idle = false;
        this.animation.walk = false;
        var currentRight = this.pressingRight;
        var currentLeft = this.pressingLeft;
        var currentUp = this.pressingUp;
        var currentDown = this.pressingDown;
        
        if(currentRight && currentLeft){
            currentRight = false;
            currentLeft = false;
        }
        if(currentUp && currentDown){
            currentUp = false;
            currentDown = false;
        }
        if(currentUp){
            this.animation.walk = true;
            this.facing = "up"
            if(currentRight){
                this.spdY = -0.7071;
                this.spdX = 0.7071;
            }
            else if(currentLeft){
                this.spdY = -0.7071;
                this.spdX = -0.7071;
            }
            else {
                this.spdY = -1;
            }
        }
        else if(currentDown){
            this.facing = "down";
            this.animation.walk = true;
            if(currentRight){
                this.spdY = 0.7071;
                this.spdX = 0.7071;
            }
            else if(currentLeft){
                this.spdY = 0.7071;
                this.spdX = -0.7071;
            }
            else {
                this.spdY = 1;
            }
        }
        else if(currentRight){
            this.animation.walk = true;
            this.spdX = 1;
            this.facing = "right"
        }
        else if(currentLeft){
            this.animation.walk = true;
            this.spdX = -1;
            this.facing = "left"
        }
        if (this.spdX && this.spdY == 0){
            this.animation.idle = true;
        }
        if(this.status === "hurt" || this.status === "dead"){
            this.spdX = 0;
            this.spdY = 0;
        }
        this.spdX = this.spdX * this.spd;
        this.spdY = this.spdY * this.spd;
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
            aniStats:this.aniStats,
            status:this.status,
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
            aniStats:this.aniStats,
            status:this.status,
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
                p.animation.hurt = true;
                if(p.hp <= 0) {
                    p.animation.die = true;
                    let shooter = Player.list[this.parent];
                    if(shooter)
                        shooter.score += 1;
                }
                this.toRemove = true;
            }
            
        }
        for(var i in Monster.list){
            
            let m = Monster.list[i]
            
            if(this.map == m.map && checkCollision(this,m)) {
                //handle collision
                m.hp -= 1;
                
                if(m.hp <= 0) {
                    let shooter = Player.list[this.parent];
                    if(shooter)
                        shooter.score += 1;
                    m.toRemove = true;
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
        this.facing = "down";
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
        this.spd = param.spd;
        this.toRemove = false;
        this.maxSpd = 5;
        Monster.list[this.id] = this;


        initPack.monster.push(this.getInitPack());
    }
    update(){
        for(var i = 0; i<this.maxSpd;i++){
            this.updateSpd();
            this.updatePosition();
            
        }
        if(this.hp <= 0)
            this.toRemove = true;
        for(var i in Player.list){
            
            let p = Player.list[i]
            
            if(this.map === p.map && checkCollision(this,p)) {
                //handle collision
                if(p.immunityFrame === 0){
                    p.hp -= 1;
                    p.animation.hurt = true;
                    if(p.hp <= 0) {
                        p.animation.die = true;
                    }
                }
            }
            
        }
    }
    
    updateSpd(){
        for(var i in this.animation){
            this.animation[i] = false;
        }
        let current=0;
        let min=0;
        let closestId=null;
        for(var i in Player.list){
            if(Player.list[i].map === this.map){
                current = this.getDistance(Player.list[i]);
                if (closestId == null) {
                    closestId = i;
                    min = current;
                }
                else if(Math.min(current,min) === current){
                    closestId = i;
                    min = Math.min(current,min);
                }
            }
            
        }
        if (closestId == null) {
            return;
        }
        if(min > 320){
            this.spdX = 0;
            this.spdY = 0;
            this.animation.idle = true;
            return;
        }
        let player = Player.list[closestId];
        if(player.x > this.x){
            this.animation.walk = true;
            if(player.y > this.y){
                this.spdX = 0.7071;
                this.spdY = 0.7071;
                this.facing = "down";
            }
            else if(player.y < this.y){
                this.spdX = 0.7071;
                this.spdY = -0.7071;
                this.facing = "up";
            }
            else {
                this.spdX = 1;
                this.spdY = 0;
                this.facing = "right";
            }
        }
        if(player.x < this.x){
            this.animation.walk = true;
            if(player.y > this.y){
                this.spdX = -0.7071;
                this.spdY = 0.7071;
                this.facing = "down"
            }
            else if(player.y < this.y){
                this.spdX = -0.7071;
                this.spdY = -0.7071;
                this.facing = "up";
            }
            else {
                this.spdX = -1;
                this.spdY = 0;
                this.facing = "left";
            }
        }
        if(player.x === this.x){
            this.animation.walk = true;
            this.spdX = 0;
            if(player.y > this.y){
                this.spdY = 1;
                this.facing = "down";
            }
            else if(player.y < this.y){
                this.spdY = -1;
                this.facing = "up";
            }
            else {
                this.spdY = 0;
                this.animation.idle = true;
            }
        }
        this.spdX = this.spdX * this.spd;
        this.spdY = this.spdY * this.spd;

        
        
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
            spd:monster.spd,
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