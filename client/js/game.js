import {ClientInventory} from "/client/js/ClientInventory.js";
const socket = io();
let WIDTH = 500;
let HEIGHT = 500;
const SCALE = 4;
var Pack;
//sign

const tileSize = 16;
const signDiv = document.getElementById("signDiv");
const signDivUsername = document.getElementById("signDiv-username");
const signDivSignIn = document.getElementById("signDiv-signIn");
const signDivSignUp = document.getElementById("signDiv-signUp");
const signDivPassword = document.getElementById("signDiv-password");

signDivSignIn.onclick = function(){
    socket.emit("signIn", {username:signDivUsername.value,password:signDivPassword.value});
}
signDivSignUp.onclick = function(){
    socket.emit("signUp", {username:signDivUsername.value,password:signDivPassword.value});
}

socket.on("signInResponse",function(data){
    if(data.success){
        signDiv.style.display = "none";
        gameDiv.style.display = "inline-block";
        
    } 
    else
        alert("Sign in unsuccessful.");
    
});
socket.on("signUpResponse",function(data){
    if(data.success){
        alert("Sign up successful.");
    } 
    else
        alert("Sign up unsuccessful, username already taken.");
    
});
//chat
const chatText = document.getElementById("chat-text");
const chatInput = document.getElementById("chat-input");
const chatForm = document.getElementById("chat-form");

const random=Math.random();


socket.on("addToChat",function(data){
    chatText.innerHTML += "<div>" + data + "</div>";
});
socket.on("evalAnswer",function(data){
    console.log(data);
});

chatForm.onsubmit = function(e){
    e.preventDefault();
    if(chatInput.value[0] === "/")
        socket.emit("evalServer",chatInput.value);
    else if (chatInput.value[0] === "@"){
        socket.emit("sendPMsgToServer",{
            username:chatInput.value.slice(1,chatInput.value.indexOf(',')),
            message:chatInput.value.slice(chatInput.value.indexOf(',') + 1),
        });
    }
    else {
        socket.emit("sendMsgToServer",chatInput.value);
    }
    chatInput.value = "";
}
chatInput.onkeydown = function(event) {
    event.stopImmediatePropagation();
};

//UI
var changeMap = function(){
    socket.emit("changeMap");
}

const changeMapButton = document.getElementById("changeMapButton");
changeMapButton.onclick = changeMap;

var inventory = new ClientInventory(socket);
socket.on("updateInventory",function(items){
    inventory.items = items;
    inventory.refreshRender();
})


//game
var Img = {};
Img.player = new Image ();
Img.player.src = '/client/img/playerdefault.png';
Img.bullet = new Image ();
Img.bullet.src = '/client/img/bullet.png';
Img.map = {};
Img.map["forest"] = new Image ();
Img.map['forest'].src = '/client/img/forest.png';
Img.map['beginnings'] = new Image();
Img.map['beginnings'].src = '/client/img/Beginnings.png';
Img.map["desert"] = new Image ();
Img.map['desert'].src = '/client/img/desert.png';
Img.slime = new Image ();
Img.slime.src = '/client/img/slime.png';
const canvas=document.getElementById("ctx");
const ctx=document.getElementById("ctx").getContext("2d");
ctx.font="30px Miniset"

ctx.imageSmoothingEnabled = false;

let globalScale = 2;
let resizeCanvas = function(){
    WIDTH = window.innerWidth * devicePixelRatio/ globalScale;
    HEIGHT = window.innerHeight * devicePixelRatio / globalScale;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    ctx.mozImageSmoothingEnabled = false;	//better graphics for pixel art
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;

    canvas.style.width = '' + window.innerWidth + 'px';
    canvas.style.height = '' + window.innerHeight + 'px';
}
resizeCanvas();

window.addEventListener('resize',function(){
resizeCanvas();
});
//linear interpetration
var lerp = function(start,end,t){
    return start * (1-t) + end*t;
}
//init
function animate(Img,x,y,width,height,scale,size,animationFrame,animationY){
    let realSize = scale*size
    let frameX = animationFrame * size;
    let frameY = animationY *size;
    // console.log(x,y,width,height,scale,size,animationFrame,animationY)
    ctx.drawImage(Img,frameX,frameY,size,size,x-width/2,y-height/2,realSize,realSize);
}

class Player {
    id;
    number;
    x;
    y;
    drawX;
    drawY;
    hp;
    hpMax;
    score;
    map;
    width;
    height;
    animation;
    animationTimers = [];
    facing;
    scale;
    static list = [];

    constructor(initPack){
        this.id = initPack.id;
        this.number = initPack.number;
        this.x = initPack.x;
        this.y = initPack.y;
        this.drawX = initPack.x;
        this.drawY = initPack.y;
        this.hp = initPack.hp;
        this.hpMax = initPack.hpMax;
        this.score = initPack.score;
        this.map = initPack.map;
        this.width = initPack.width;
        this.height = initPack.height;
        this.animation = initPack.animation;
        this.aniStats = {
            y:initPack.aniStats.y,
            frames:initPack.aniStats.frames,
            spd:initPack.aniStats.spd,
            current:initPack.aniStats.current,
        }
        this.status = initPack.status;
        this.facing = initPack.facing;
        this.scale=initPack.scale;
        this.offsetX = 0;
        this.offsetY = 8;
        Player.list[this.id] = this;
    }
    update() {
        this.drawX = lerp(this.drawX, this.x, 0.2);
        this.drawY = lerp(this.drawY, this.y, 0.2);
    }
    draw(){
        if(Player.list[selfId].map != this.map)
            return;

        let x = this.drawX;
        let y = this.drawY;
        var hpWidth = 30 * this.hp / this.hpMax;
        
        ctx.fillStyle = "red";
        ctx.fillRect(x - hpWidth/2,y - 40,hpWidth,4);
        
        
        var width = 16*this.scale;
        var height = 16*this.scale;
        
        // ctx.drawImage(Img.player,0,0,Img.player.width,Img.player.height,x-width/2,y-height/2,width,height);
     
        // if (this.animation.die) {
        //     this.animationTimers.push({
        //         id: "die",
        //         time: 5
        //     })
        // }
        // else if (this.animation.hurt) {
        //     this.animationTimers.push({
        //         id: "hurt",
        //         time: 2
        //     })
        // }
        // if (this.animationTimers.length > 0) {
        //     if (this.animationTimers[0].id == "die") {
        //         animationY = 12;
        //         frames = 5;
        //         animationSpeed = 1/15;
        //     }
        //     if (this.animationTimers[0].id == "hurt") {
        //         animationY = 8;
        //         frames = 2;
        //         animationSpeed = 1/10;
        //     }
        //     this.animationTimers[0].time -= animationSpeed;
        //     if (this.animationTimers[0].time <= 0) {
        //         this.animationTimers.shift()
        //     }
        // }
        // if(this.animation.die === true){
        //     animationY = 12;
        //     frames = 5;
        //     animationSpeed = 1/15;
        // }
        // else if(this.animation.hurt === true){
        //     animationY = 8;
        //     frames = 2;
        //     animationSpeed = 1/10;
        // }
        // else if(this.animation.walk === true){
        //     animationY = 4;
        //     frames = 4;
        //     animationSpeed = 1/10
        // }
        // else {
        //     animationY = 0;
        //     frames = 2;
        //     animationSpeed = 1/30
        // }
        // if(this.facing === "up"){
        //     animationY = animationY +3;    
        // }
        // else if(this.facing === "down"){
        //     animationY = animationY;
        // }
        // else if(this.facing === 'right'){
        //     animationY = animationY + 1;
        // }
        // else if(this.facing === 'left'){
        //     animationY = animationY + 2;
        // }
        // console.log(this.animation)
        // console.log(this.aniStats.y, this.aniStats.spd,this.aniStats.frames)
        animate(Img.player,x,y,width,height+this.offsetY,this.scale,16,Math.floor(this.aniStats.current),this.aniStats.y);
        
        // ctx.drawImage(Img.player,0, 0, 16, 16,x-width/2,y-height/2,width,height);
        
        //collision
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        var collisionX = x - this.width/2;
        var collisionY = y - this.height/2.;
        ctx.strokeRect(collisionX,collisionY, this.width, this.height);
        ctx.fillRect(x,y,10,10);

    }
    
    
}
class Bullet {
    id;
    number;
    x;
    y;
    drawX;
    drawY;
    map;
    width;
    height;
    animation;

    static list = [];

    constructor(initPack){
        this.id = initPack.id;
        this.number = initPack.number;
        this.x = initPack.x;
        this.y = initPack.y;
        this.drawX = initPack.x;
        this.drawY = initPack.y;
        this.map = initPack.map;
        this.width = initPack.width;
        this.height = initPack.height;
        this.animation = initPack.animation;
        this.animationFrame = 0;
        Bullet.list[this.id] = this;
    }
    draw(){
        
        if(Player.list[selfId].map != this.map)
            return;
        let width = Img.bullet.width*1.5;
        let height = Img.bullet.height*1.5;
        this.drawX = lerp(this.drawX, this.x,0.2);
        this.drawY = lerp(this.drawY, this.y,0.2);
        let x = this.drawX;
        let y = this.drawY;
        ctx.drawImage(Img.bullet,0,0,Img.bullet.width,Img.bullet.height,x-width/2,y - height/2, width,height);

        //collision
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        var collisionX = x - this.width/2;
        var collisionY = y - this.height/2;
        ctx.strokeRect(collisionX,collisionY, this.width, this.height);
        ctx.fillStyle = "black"
        ctx.fillRect(x,y,5,5);
    }
}
class Monster {
    static list = [];
    constructor(initPack){
        this.id = initPack.id;
        this.x = initPack.x;
        this.y = initPack.y;
        this.hp = initPack.hp;
        this.hpMax = initPack.hpMax;
        this.map = initPack.map;
        this.width = initPack.width;
        this.height = initPack.height;
        this.animation = initPack.animation;
        this.facing = initPack.facing;
        this.type = initPack.type;
        this.aniStats = initPack.aniStats;
        this.monsterType = initPack.monsterType;
        this.offsetY = initPack.offsetY;
        this.drawX = initPack.x;
        this.drawY = initPack.y;
        this.scale = 4;
        
        Monster.list[this.id] = this;
    }
    draw(){
        if(Player.list[selfId].map != this.map)
            return;
        
        
        this.drawX = lerp(this.drawX, this.x,0.2);
        this.drawY = lerp(this.drawY, this.y,0.2);
        let x = this.drawX;
        let y = this.drawY;

        var hpWidth = 30 * this.hp / this.hpMax;
        
        ctx.fillStyle = "red";
        ctx.fillRect(x - hpWidth/2,y - 40,hpWidth,4);
        console.log(this.animation)
        console.log(this.aniStats)
        animate(Img.slime,x,y-this.offsetY,this.width,this.height,this.scale,16,Math.floor(this.aniStats.current),this.aniStats.y);

        ctx.strokeStyle = 'red';
        ctx.lineWidth = 1;
        var collisionX = x - this.width/2;
        var collisionY = y - this.height/2;
        ctx.strokeRect(collisionX,collisionY, this.width, this.height);
        ctx.fillRect(x,y,5,5);
    }
}




var selfId = null;


socket.on("init",function(data){
    if(data.selfId)
        selfId = data.selfId;
    
    for (var i = 0; i < data.monster.length; i++){
        new Monster(data.monster[i]);
    }
    for (var i = 0; i < data.bullet.length; i++){
        new Bullet(data.bullet[i]);
    }
    for (var i = 0; i < data.player.length; i++){
        new Player(data.player[i]);
    }
    
});
//update
socket.on("update",function(data){
    for(var i = 0; i < data.bullet.length; i++) {
        var pack = data.bullet[i];
        var b = Bullet.list[pack.id];
        if(b) {
            if(pack.x !== undefined)
                b.x = pack.x;
            if(pack.y !== undefined)
                b.y = pack.y;
            if(pack.animation !== undefined)
                b.animation = pack.animation;
        }
    }
    for(var i = 0; i < data.player.length; i++) {
        var pack = data.player[i];
        var p = Player.list[pack.id];
        if(p) {
            if(pack.x !== undefined)
                p.x = pack.x;
            if(pack.y !== undefined)
                p.y = pack.y;
            if(pack.hp !== undefined)
                p.hp = pack.hp;
            if(pack.score !== undefined)
                p.score = pack.score;
            if(pack.map !== undefined)
                p.map = pack.map;
            if(pack.animation !== undefined)
                p.animation = pack.animation;
            if(pack.facing !== undefined)
                p.facing = pack.facing;
            if(pack.aniStats !== undefined)
                p.aniStats = pack.aniStats;
            if(pack.status !== undefined)
                p.status = pack.status;
        }
        
    }
    for(var i = 0; i < data.monster.length; i++) {
        var pack = data.monster[i];
        var p = Monster.list[pack.id];
        if(p) {
            if(pack.x !== undefined)
                p.x = pack.x;
            if(pack.y !== undefined)
                p.y = pack.y;
            if(pack.hp !== undefined)
                p.hp = pack.hp;
            if(pack.map !== undefined)
                p.map = pack.map;
            if(pack.animation !== undefined)
                p.animation = pack.animation;
            if(pack.facing !== undefined)
                p.facing = pack.facing;
            if(pack.aniStats !== undefined)
                p.aniStats = pack.aniStats;
            if(pack.status !== undefined)
                p.status = pack.status;
        }
        
    }
    Pack = data;
    
})
//remove
socket.on("remove", function(data){
    for (var i = 0; i < data.player.length; i++){
        delete Player.list[data.player[i]];
    }
    for (var i = 0; i < data.bullet.length; i++){
        delete Bullet.list[data.bullet[i]];
    }
    for (var i = 0; i < data.monster.length; i++){
        delete Monster.list[data.monster[i]];
    }
})
//loop (drawing)
var mapWidth;
var mapHeight;
let cameraX, cameraY;
function drawAll() {
    if(!selfId)
        return
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    for(var i in Player.list){
        Player.list[i].update();
    }
    cameraX = -Player.list[selfId].drawX + WIDTH/2;
    cameraY = -Player.list[selfId].drawY + HEIGHT/2;
    // let mapScale = 1;
    // let ratio = canvas.width/mapWidth;
    // mapScale = Math.max(mapScale, ratio);
    if(mapWidth >= canvas.width){
        if (cameraX > 0) {
            cameraX = 0;
        }
        else if (mapWidth + cameraX < canvas.width) {
            cameraX = canvas.width - mapWidth;
        }
    }
    if(mapHeight >= canvas.height){
        if (cameraY > 0) {
            cameraY = 0;
        }
        else if (mapHeight + cameraY < canvas.height) {
            cameraY = canvas.height - mapHeight;
        }
    }

    // console.log(x)
    
    // ctx.translate(WIDTH / 2, HEIGHT / 2);
    // ctx.scale(mapScale, mapScale);
    // ctx.translate(-WIDTH / 2, -HEIGHT / 2);
    ctx.translate(cameraX, cameraY);
    drawMap();
    
    for(var i in Monster.list) {
        Monster.list[i].draw();
    }
    for(var i in Player.list){
        Player.list[i].draw();
    }
    for(var i in Bullet.list) {
        Bullet.list[i].draw();
    }
    ctx.resetTransform();
    drawScore();
    drawFps();
};
var drawMap = function(){
    var player = Player.list[selfId];
    mapWidth = Img.map[player.map].width*4;
    mapHeight = Img.map[player.map].height*4;
    ctx.drawImage(Img.map[player.map],0,0,mapWidth,mapHeight);
}

var drawScore = function(){
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "black";
    ctx.fontWeight = "700";
    ctx.font = "40px Miniset";
    ctx.fillText(Player.list[selfId].score,30,30)
}

const times = [];
let fps;
function fpsfinder(){
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) {
        times.shift();
    }
    times.push(now);
    fps = times.length;
}
function refreshLoop() {
    fpsfinder();
    drawAll();
    window.requestAnimationFrame(refreshLoop);
}
window.requestAnimationFrame(refreshLoop);
var drawFps = function(){
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "red";
    ctx.fontWeight = "700";
    ctx.font = "20px Miniset";
    ctx.fillText(fps,30,60)
}
var lastScore = null
document.onkeydown = function(event) {
    if(gameDiv.style.display === "none"){
        return;
    }
    if(event.key === "d") //d
        socket.emit("keyPress",{inputId:"right",state:true});
    else if(event.key === "s") //s
        socket.emit("keyPress",{inputId:"down",state:true});
    else if(event.key === "a") //a
        socket.emit("keyPress",{inputId:"left",state:true});
    else if(event.key === "w") //w 
        socket.emit("keyPress",{inputId:"up",state:true});
}
document.onkeyup = function(event) {
    if(gameDiv.style.display === "none"){
        return;
    }
    if(event.key === "d") //d
        socket.emit("keyPress",{inputId:"right",state:false});
    else if(event.key === "s") //s
        socket.emit("keyPress",{inputId:"down",state:false});
    else if(event.key === "a") //a
        socket.emit("keyPress",{inputId:"left",state:false});
    else if(event.key === "w") //w 
        socket.emit("keyPress",{inputId:"up",state:false});
}


canvas.onmousedown = function(event){
    if(gameDiv.style.display === "none"){
        return;
    }
    socket.emit("keyPress", {inputId: "attack", state:true});
}
document.onmouseup = function(event){
    if(gameDiv.style.display === "none"){
        return;
    }
    socket.emit("keyPress", {inputId: "attack", state:false});
}

document.onmousemove = function(event){
    if(gameDiv.style.display === "none"){
        return;
    }
    // var selfX;
    // var selfY;
    // for (var i in Player.list) {
    //     if (Player.list[i].id == selfId) {
    //         selfX = Player.list[i].x;
    //         selfY = Player.list[i].y;
    //     }
    // }
    // var selfX = self.x - Player.list[selfId].x + WIDTH/2;
    // var selfY = self.y - Player.list[selfId].y + HEIGHT/2;
    var x = -Player.list[selfId].drawX + event.clientX * devicePixelRatio / globalScale - cameraX;
    var y = -Player.list[selfId].drawY + event.clientY * devicePixelRatio / globalScale - cameraY;
    var angle = Math.atan2(y,x) / Math.PI * 180;
    socket.emit("keyPress",{inputId:"mouseAngle",state:angle});
}
document.oncontextmenu = function(event){
    event.preventDefault();
}

