function clamp(value, upperBound, lowerBound){
    return Math.min(Math.max(value,lowerBound),upperBound)
}

class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.MAX_RUN = 3;
        this.GRAVITY = 0.7; //took out world gravity for a bit more control
        this.ADDITIONAL_FALLING_ACC = 0.2;
        this.JUMP_VELOCITY = -9;
        this.CURB_JUMP = 0.65;
        this.RUN_STARTUP = 6;
        this.PLAYER_BBOX = [-8*SCALE,0,8*SCALE,-14*SCALE,0,16*SCALE]; //orgin +- distance to edge
    }

    create() {
        this.modVelTimer = 0;
        // Create a new tilemap game object which uses 16x16 pixel tiles, and is
        // 224 tiles wide and 16 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 16, 16, 224, 16);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create layers
        this.groundLayer = this.map.createLayer("GroundLayer", this.tileset, 0, 0);
        this.groundLayer.setScale(SCALE);
        this.decoreLayer = this.map.createLayer("DecoreLayer", this.tileset, 0, 0);
        this.decoreLayer.setScale(SCALE);
        //object layer
        this.coins = this.map.createFromObjects("ObjectLayer", {
            name: "coin",
            key: "platformer_misc",
            frame: "tile_0000.png"
        });
        this.enemies = this.map.createFromObjects("ObjectLayer", {
            name: "enemy",
            key: "platformer_misc",
            frame: "tile_0001.png"
        });
        this.bigEnemies = this.map.createFromObjects("ObjectLayer", {
            name: "bigEnemy",
            key: "platformer_misc",
            frame: "tile_0004.png"
        });
        this.objects = [].concat(this.coins).concat(this.enemies).concat(this.bigEnemies);
        for (let x of this.objects){
            x.x *= 2;
            x.y *= 2;
            x.setScale(SCALE);
        }
        this.enemies.concat();
        for (let x of this.bigEnemies){
            x.y -= 8;
            x.setScale(SCALE*1.5);
        }

        // set up player avatar
        my.sprite.player = this.make.sprite(36*SCALE, 176*SCALE, "player_character", "tile_0000.png").setScale(SCALE)
        //not sure why player.x and y are defaulting to 0,0 but fine whatever
        my.sprite.player.x = 32*SCALE
        my.sprite.player.y = 176*SCALE
        my.sprite.player.velVector = {x:0,y:0}
        my.sprite.player.grounded = 0;
        my.sprite.player.dckRll = 0;
        my.sprite.player.dash = 0;
        my.sprite.player.inactionable = 0;
        my.sprite.player.cayoteJmp = 0;
        my.sprite.player.prevGrounded = 0;

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();
        
        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.debug = this.debug ? false : true
            if (this.debug)
                this.initDebug()
            else
                this.destroyDebug()
        }, this);
    }
    initDebug(){
        this.bboxVisual = this.add.rectangle(0,0,this.PLAYER_BBOX[2]-this.PLAYER_BBOX[0],this.PLAYER_BBOX[5]-this.PLAYER_BBOX[3],0,0).setStrokeStyle(1,0xff00ff).setOrigin(0)
        this.velVecVisual = this.add.line(0,0,0,0,0,0,0x00ff00,1);
        this.BonkArea = this.add.line(0,0,0,0,0,0,0xff0000,1);
    }
    drawDebug(){
        let plrs = my.sprite.player;
        this.bboxVisual.x = plrs.x+this.PLAYER_BBOX[0];
        this.bboxVisual.y = plrs.y+this.PLAYER_BBOX[3];
        this.bboxVisual.width = this.PLAYER_BBOX[2]-this.PLAYER_BBOX[0];
        this.bboxVisual.height = this.PLAYER_BBOX[5]-this.PLAYER_BBOX[3];
        let xForBonkArea = plrs.x+(plrs.flipX ? -16*SCALE : 16*SCALE);
        this.BonkArea.setTo(xForBonkArea,plrs.y,xForBonkArea,plrs.y-16*SCALE);
        if (this.groundLayer.hasTileAtWorldXY(xForBonkArea,plrs.y-16*SCALE)&&this.groundLayer.hasTileAtWorldXY(xForBonkArea,plrs.y))
            this.BonkArea.setStrokeStyle(1,0xff0000);
        else
            this.BonkArea.setStrokeStyle(1,0xffff00);
        this.velVecVisual.setTo(plrs.x,plrs.y,plrs.x+plrs.velVector.x*SCALE*10,plrs.y+plrs.velVector.y*SCALE*10);
    }
    destroyDebug(){
        this.bboxVisual.destroy();
        this.velVecVisual.destroy();
        this.BonkArea.destroy();
    }
    doScreenShake(){

    }
    //collision detection 
    //default phaser tile collision has false negatives occasionally and lets the player fall through the floor at a high enough velocity
    //no longer based on tile property; anything on ground layer will have collision
    colliding(sprite,deltaX,deltaY,edges){
        edges = edges || [-sprite.width*originX,edges[0]+sprite.width,-sprite.height*originY,edges[2]+sprite.height];
        let halfwaypoint = edges.length/2
        for (let edgeX of edges.slice(0,halfwaypoint))
            for (let edgeY of edges.slice(halfwaypoint,edges.length))
                if (this.groundLayer.hasTileAtWorldXY(sprite.x+deltaX+edgeX,sprite.y+deltaY+edgeY))
                    return true;
        return false;
    }
    update() {
        let player = my.sprite.player;
        //collision handling
        let i = player.velVector.y;
        let j = player.velVector.x;
        while( i || j ){
            if (this.colliding(player,0,clamp(i,1,-1),this.PLAYER_BBOX)){
                player.grounded = (i > 0);
                player.velVector.y = 0;
                i = 0;
            }else{
                player.y += clamp(i,1,-1);
                if (Math.sign(i))
                    player.grounded = 0;
            }
            if (this.colliding(player,clamp(j,1,-1),0,this.PLAYER_BBOX)){
                player.velVector.x = 0;
                j = 0;
            }else
                player.x += clamp(j,1,-1);
            i -= clamp(i,1,-1);
            j -= clamp(j,1,-1);
        }

        //debug
        if (this.debug)
            this.drawDebug();

        //player squash and stretch
        player.setScale((player.scaleX*2 + SCALE)/3,(player.scaleY*2 + SCALE)/3);
        player.setOrigin((player.originX*2 + 0.5)/3,(player.originY*2 + 0.5)/3);
        if (!player.prevGrounded && player.grounded){
            player.setScale(SCALE*1.5,SCALE*0.5);
            player.setOrigin(0.5,0);
        }
        player.prevGrounded = player.cayoteJmp;

        //player stun
        if (!player.dash && player.inactionable){
            player.velVector.y += (this.GRAVITY);
            player.angle = 0;
            player.velVector.x = player.inactionable;
            player.inactionable -= Math.sign(player.velVector.x)/90;
            player.inactionable = player.grounded ? 0 : player.inactionable;
        }

        //player dash
        if (player.dash){
            player.velVector.x *= 0.9;
            player.velVector.y += (this.GRAVITY+this.ADDITIONAL_FALLING_ACC);
            player.angle += player.flipX ? -4 : 4;
            this.PLAYER_BBOX[3] = 2;
            this.PLAYER_BBOX[4] = 14;
        }
        if (player.dash && (Math.abs(player.velVector.x) < 5 || player.grounded)){
            let xForBonkArea = player.x+(player.flipX ? -16*SCALE : 16*SCALE);
            let blocked = this.groundLayer.hasTileAtWorldXY(xForBonkArea,player.y-16*SCALE)&&this.groundLayer.hasTileAtWorldXY(xForBonkArea,player.y);
            player.dash = 0;
            player.anims.play(blocked ? 'hurt' : 'roll');
            player.dckRll = !blocked;
            player.velVector.x = (player.flipX^blocked) ? -7 : 7;
            player.velVector.x *= (cursors.right.isDown - cursors.left.isDown) != Math.sign(player.velVector.x) ? 0.6 : 1;
            player.inactionable = player.velVector.x;
            player.velVector.y = -9;
            player.setScale(SCALE*0.5,SCALE*1.5);
        }
        if (Phaser.Input.Keyboard.JustDown(cursors.shift) && !player.inactionable){
            player.dash = 1;
            player.inactionable = 1;
            player.velVector.x = player.flipX ? -24 : 24;
            player.velVector.y = -5;
            player.anims.play('jump');
            player.angle = player.flipX ? -20 : 20;
            player.setScale(SCALE*1.5);
        }

        //player walk/run/roll
        let movePlayerDir = (cursors.right.isDown - cursors.left.isDown);
        if (!player.inactionable){
            if (player.dckRll){
                player.anims.play((Math.round(player.velVector.x)!=0) ? 'roll' : 'duck',true);
                player.velVector.x -= 0.01*Math.sign(player.velVector.x);
                this.modVelTimer = 0;
                this.PLAYER_BBOX[3] = 2;
                this.PLAYER_BBOX[4] = 14;
            }else if (movePlayerDir) {
                player.velVector.x = ((this.modVelTimer == movePlayerDir*this.RUN_STARTUP) ? movePlayerDir*this.MAX_RUN : (player.velVector.x*3+movePlayerDir*this.MAX_RUN)/4);
                player.setFlip(cursors.left.isDown, false);
                player.anims.play('walk', true);
                this.modVelTimer = (this.modVelTimer*movePlayerDir<this.RUN_STARTUP) ? this.modVelTimer+movePlayerDir : movePlayerDir*this.RUN_STARTUP;

            } else {
                player.anims.play('idle');
                this.modVelTimer = (Math.abs(this.modVelTimer)) ? this.modVelTimer-Math.sign(this.modVelTimer) : 0;
                player.velVector.x = Math.abs(player.velVector.x)>0.5 ? player.velVector.x/4 : 0;
            }

            // player jump
            if (!player.grounded && player.cayoteJmp)
                player.cayoteJmp --;
            if (player.grounded)
                player.cayoteJmp = 6;
            if(!player.grounded && !player.dckRll && !player.dash) {
                player.anims.play((player.velVector.y>0) ? 'fall' : 'jump');
            }else{
                if (!player.dckRll && cursors.down.isDown)
                    player.velVector.x *= 1.2;
                player.dckRll = cursors.down.isDown
            }
            if(player.cayoteJmp && Phaser.Input.Keyboard.JustDown(cursors.space)) {
                player.velVector.y = (this.JUMP_VELOCITY);
                player.cayoteJmp = 0;
                player.setScale(SCALE*0.5,SCALE*1.5);
                player.setOrigin(0.5,0.75);
            }

            //controllable jump height
            if(player.velVector.y < 0 && !cursors.space.isDown)
                player.velVector.y *= this.CURB_JUMP;

            //hang time
            if(player.velVector.y>-200 && player.velVector.y<200 && cursors.space.isDown)
                player.velVector.y += (this.GRAVITY-this.ADDITIONAL_FALLING_ACC);
            else if(player.velVector.y>0)
                player.velVector.y += (this.GRAVITY+this.ADDITIONAL_FALLING_ACC);
            else
                player.velVector.y += (this.GRAVITY);
        }
        
        //bbox handling
        if (this.PLAYER_BBOX[3]==2 && !(player.dckRll || player.dash)){
            let blocked = this.groundLayer.hasTileAtWorldXY(player.x+this.PLAYER_BBOX[0],player.y-14*SCALE)||
            this.groundLayer.hasTileAtWorldXY(player.x+this.PLAYER_BBOX[2],player.y-14*SCALE);
            this.PLAYER_BBOX[3] = blocked ? 2 : -14*SCALE;
            this.PLAYER_BBOX[4] = blocked ? 14 : 0;
            player.dckRll = blocked;
            player.velVector.x = blocked ? (player.flipX ? -1 : 1) : player.velVector.x;
        }

        //cammera scrolling
        if (player.x > 355){
            this.groundLayer.x -= (player.x-355);
            this.decoreLayer.x = this.groundLayer.x;
            for (let x of this.objects)
                x.x -= (player.x-355);
            player.x -= (player.x-355);
        }
        if (player.x < 355 && this.groundLayer.x - (player.x-355) < 0){
            this.groundLayer.x -= (player.x-355);
            this.decoreLayer.x = this.groundLayer.x;
            for (let x of this.objects)
                x.x -= (player.x-355);
            player.x -= (player.x-355);
        }

        //coin handling
        for (let x of this.coins){
            if (x.x-14 > player.x+this.PLAYER_BBOX[2])
                continue;
            if (x.x+14 < player.x+this.PLAYER_BBOX[0])
                continue;
            if (x.y+14 < player.y+this.PLAYER_BBOX[3])
                continue;
            if (x.y-14 > player.y+this.PLAYER_BBOX[5])
                continue;
            COINS ++;
            x.destroy();
            this.coins.splice(this.coins.indexOf(x),1);
        }

        //enemy handling
        for (let x of this.enemies){
            x.angle = 0;
            //check if enemy is offscreen
            if (clamp(x.x,-32,942) != x.x)
                continue;
            if (clamp(x.y,-32,544) != x.y)
                continue;
            x.angle = 30;
            if (0){
                x.destroy();
                this.coins.splice(this.coins.indexOf(x),1);
            }
        }
    }
}