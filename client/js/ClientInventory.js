
class ClientInventory {
    items;
    socket;
    constructor(socket){
        this.items = [];
        this.socket = socket;
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
        //server
        // if(self.server){
        //     self.socket.emit("updateInventory",self.items);
        //     return;
        // }

        var inventory = document.getElementById("inventory");
        inventory.innerHTML = "";
        var addbutton = (data) => {
            let item = ClientItem.list[data.id];
            let button = document.createElement("button");
            button.onclick = () => {
                this.socket.emit("useItem",item.id);
            }
            button.innerText = item.name + " x" + data.amount;
            inventory.appendChild(button);
        }
        for(let i = 0; i < this.items.length; i++){
            addbutton(this.items[i]);
        }
    }
    // if(self.server){
    //    socket.on("useItem",function(itemId){
    //         if(!self.hasItem(itemId,1)){
    //             console.log("cheater");
    //             return;
    //         }
    //         let item = Item.list[itemId];
    //         item.event(Player.list[self.socket.id]);
    //    });
    // }
}

class ClientItem {
    id;
    name;
    event;
    static list = [];
    constructor(id,name,event){
        this.id=id;
        this.name=name;
        this.event=event;
        ClientItem.list[this.id] = this;
    }

}


new ClientItem("potion","Potion",function(){
    
});
new ClientItem("superAttack","Super Attack", function(){
    
});

export {ClientItem,ClientInventory};