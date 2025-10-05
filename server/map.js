import {Entity,Player,Bullet} from "./Entity.js"
import {checkCollision} from "../app.js"
const tileSize = 16;
import BeginningsMap from "../client/img/Beginnings.json" assert {type : 'json' };
var Beginnings = [[[]]];
//[[[1,2,3,],
// [4,5,6]]]
var MapInit = [
    function() {
        let width = BeginningsMap.layers[0].width;
        let height = BeginningsMap.layers[0].height;
        for(var l=0; l < BeginningsMap.layers.length;l++){
            Beginnings[l] = [];
            for(var h = 0; h<height;h++){
                Beginnings[l][h] = [];
                for(var w=0;w < width;w++){
                    Beginnings[l][h][w] = BeginningsMap.layers[l].data[w + h * width];
                }
            }
        }
        return Beginnings;
    },
];
var isInWall = function(pt){
        var gridX = Math.floor(pt.x / tileSize);
        var gridY = Math.floor(pt.y / tileSize);
    }
var mapLoad = function(){
    let length = MapInit.length;
    for(var i = 0; i < length;i++){
        return MapInit[i]();
    }
}
mapLoad();

function checkMap(bx,by,width,height,currentMap){
    let tileX1 = Math.floor(((bx-width/2)/tileSize)/4);
    let tileX2 = Math.floor(((bx+width/2)/tileSize)/4);
    let tileY1 = Math.floor(((by-height/2)/tileSize)/4);
    let tileY2 = Math.floor(((by+height/2)/tileSize)/4);
    var PlayerRect = {
        height:height,
        width:width,
        x:bx/64,
        y:bx/64,
    }
    
    if(currentMap === "beginnings"){    
        for (let y = tileY1; y <= tileY2; y++) {
            for (let x = tileX1; x <= tileX2; x++) {
                if (Beginnings[0][y] == null) {
                    continue;
                }
                
                if(Beginnings[0][y][x] === 7904)
                    return false;
                
            }
        }
    }
}
export {mapLoad,checkMap};