import {Entity, Player, Bullet} from "./Entity.js";
class ServerInventory {
    items;
    socket;
    constructor(items, socket){
        this.items = items;
        this.socket = socket;
        socket.on("useItem",(itemId) => {
            if(!this.hasItem(itemId,1)){
                    console.log("cheater");
                    return;
            }
            let item = ServerItem.list[itemId];
            item.event(Player.list[this.socket.id]);
        });
    }
    addItem(id,amount){
        for(var i = 0; i <this.items.length; i++){
            if(this.items[i].id === id){
                this.items[i].amount += amount;
                this.refreshRender();
                return;
            }
        }
        this.items.push({id:id,amount:amount});
        this.refreshRender();
    }
    removeItem(id,amount){
        for(var i = 0; i < this.items.length; i++){
            if(this.items[i].id === id){
                this.items[i].amount -= amount;
                if(this.items[i].amount <= 0)
                    this.items.splice(i,1);
                this.refreshRender();
                return;
            }
        }
    }
    hasItem(id,amount){
        for(var i = 0; i < this.items.length; i++){
            if(this.items[i].id === id){
                return this.items[i].amount >= amount;
            }
        }
        return false;
    }
    refreshRender(){
        this.socket.emit("updateInventory",this.items);
    }
    
}

class ServerItem {
    id;
    name;
    event;
    static list = []
    constructor(id,name,event){
        this.id=id;
        this.name = name;
        this.event = event;
        ServerItem.list[this.id] = this;
    }

}


new ServerItem("potion","Potion",function(player){
    player.hp = 10;
    player.inventory.removeItem("potion",1);
    player.inventory.addItem("superAttack",1);
    
});
new ServerItem("superAttack","Super Attack", function(player){
    for(var i = -(20); i < (20); i++){
        player.shootBullet(i * 10 + player.mouseAngle);
    }
    player.inventory.removeItem("superAttack",1);
    
});

export {ServerItem,ServerInventory};
