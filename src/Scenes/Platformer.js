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
        this.COMBO = {kills:0,timer:0,coins:0};
        if (!BGM){
            BGM = this.sound.add("BGM",{loop:1,volume:0.55});
            BGM.play()
        }
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
        let coins = this.map.createFromObjects("ObjectLayer", {
            name: "coin",
            key: "platformer_misc",
            frame: "tile_0000.png"
        });
        let enemies = this.map.createFromObjects("ObjectLayer", {
            name: "enemy",
            key: "platformer_misc",
            frame: "tile_0001.png"
        });
        let bigEnemies = this.map.createFromObjects("ObjectLayer", {
            name: "bigEnemy",
            key: "platformer_misc",
            frame: "tile_0004.png"
        });
        this.objects = (coins).concat(enemies).concat(bigEnemies);
        for (let x of this.objects){
            x.x *= 2;
            x.y *= 2;
            x.setScale(SCALE);
        }
        for (let x of enemies){
            x.velVector = {x:-0.7,y:0};
            x.anims.play('enemyWalk');
        }
        for (let x of bigEnemies){
            x.y -= 8;
            x.velVector = {x:-0.5,y:0};
            x.setScale(SCALE*1.5);
            x.anims.play('bigEnemyWalk');
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
        my.sprite.player.footstep = 0;
        my.sprite.player.health = 0;
        my.sprite.player.dead = 1;
        my.sprite.player.anims.play('idle');
        my.sprite.player.walkNoise = this.sound.add("walkies",{loop: 0, volume:1});
        my.sprite.player.jumpNoise = this.sound.add("jumpies",{loop: 0, volume:0.3});
        my.sprite.player.dashNoise = this.sound.add("dashies",{loop: 0, volume:0.25});
        my.sprite.player.hurtNoise = this.sound.add("hurties",{loop: 0, volume:0.4});
        my.sprite.player.bonkNoise = this.sound.add("bonkies",{loop: 0, volume:0.4})
        my.sprite.player.deadNoise = this.sound.add("deadies",{loop: 0, volume:0.6});
        my.sprite.player.rollNoise = this.sound.add("rollies",{loop: 0, volume:0.4});
        my.sprite.player.rollNoise.playedOnce = 0;
        this.coinNoise = this.sound.add("coinies",{loop: 0, volume:0.7});
        this.killNoise = this.sound.add("killies",{loop: 0, volume:0.7});
        this.bonkNoise = this.sound.add("destries",{loop: 0, volume:0.7});
        my.sprite.player.runningVfx = this.add.particles(0, 0, "platformer_misc", {
            frame: "tile_0008.png",
            random: true,
            scale: {start: SCALE/2, end: 0},
            alpha: {start: 1, end: 0},
            maxAliveParticles: 32,
            lifespan: 350,
            gravityY: 400,
            speedX: [-90,-60,-30,30,60,90],
            speedY: -50
        });
        my.sprite.player.runningVfx.stop()
        my.sprite.player.blockBopVfx = this.add.particles(0, 0, "platformer_misc", {
            frame: "tile_0000.png",
            random: true,
            scale: {start: SCALE, end: SCALE},
            maxAliveParticles: 32,
            lifespan: 200,
            gravityY: 3200,
            speedY: -400
        });
        my.sprite.player.blockBopVfx.stop()
        my.sprite.player.blockBreakVfx = this.add.particles(0, 0, "platformer_misc", {
            frame: "tile_0007.png",
            random: true,
            scale: {start: SCALE/2, end: 0},
            maxAliveParticles: 32,
            lifespan: 350,
            gravityY: 1600,
            speedX: [-30,-15,5,15,30],
            speedY: -30
        });
        my.sprite.player.blockBreakVfx.stop()
        my.sprite.player.enemyStompVfx = this.add.particles(0, 0, "platformer_misc", {
            frame: "tile_0003.png",
            random: true,
            scale: {start: SCALE, end: 0},
            maxAliveParticles: 32,
            lifespan: 1000,
            gravityY: 1600,
            speedX: [-30,-15,5,15,30],
            speedY: -150
        });
        my.sprite.player.enemyStompVfx.stop()
        my.sprite.player.bigenemyStompVfx = this.add.particles(0, 0, "platformer_misc", {
            frame: "tile_0006.png",
            random: true,
            scale: {start: SCALE*1.5, end: 0},
            maxAliveParticles: 32,
            lifespan: 1500,
            gravityY: 1600,
            speedX: [-30,-15,5,15,30],
            speedY: -70
        });
        my.sprite.player.bigenemyStompVfx.stop()

        //add score
        this.scoreboard = {
            text:this.add.text(48,25,"x "+COINS,{fontSize:25}).setOrigin(0,0.5),
            coinsprite:this.make.sprite({x:25, y:25, key:"platformer_misc", frame:"tile_0000.png"}).setScale(SCALE),
            display:COINS
        };

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
        this.objectBbox = []
        for (let x of this.objects){
            let temp  = (x.name == "coin");
            this.objectBbox[this.objects.indexOf(x)] = this.add.rectangle(0,0,16*SCALE-temp*SCALE*2,16*SCALE,0,0)
            this.objectBbox[this.objects.indexOf(x)].setStrokeStyle(1,temp ? 0x0000ff : 0xff0000);
        }
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
        if (this.objects.length != this.objectBbox.length){
            this.destroyDebug()
            this.initDebug()
        }
        for (let x of this.objects){
            this.objectBbox[this.objects.indexOf(x)].x = x.x 
            this.objectBbox[this.objects.indexOf(x)].y = x.y + (x.name == "coin")*SCALE
        }
    }
    destroyDebug(){
        this.bboxVisual.destroy();
        this.velVecVisual.destroy();
        this.BonkArea.destroy();
        for (let x of this.objectBbox)
            x.destroy();
    }
    //collision detection 
    //default phaser tile collision has false negatives occasionally and lets the player fall through the floor at a high enough velocity
    //no longer based on tile property; anything on ground layer will have collision
    colliding(sprite,deltaX,deltaY,edges){
        edges = edges || [-8*sprite.scaleX,8*sprite.scaleX,0,7.9*sprite.scaleX];
        let halfwaypoint = edges.length/2
        for (let edgeX of edges.slice(0,halfwaypoint))
            for (let edgeY of edges.slice(halfwaypoint,edges.length))
                if (this.groundLayer.hasTileAtWorldXY(sprite.x+deltaX+edgeX,sprite.y+deltaY+edgeY))
                    return true;
        return false;
    }
    update() {
        let player = my.sprite.player;

        //player squash and stretch
        player.setScale((player.scaleX*2 + SCALE)/3,(player.scaleY*2 + SCALE)/3);
        player.setOrigin((player.originX*2 + 0.5)/3,(player.originY*2 + 0.5)/3);
        if (!player.prevGrounded && player.grounded && !player.dash){
            player.setScale(SCALE*1.5,SCALE*0.5);
            player.setOrigin(0.5,0);
            player.walkNoise.detune = -200;
            player.walkNoise.play();
            player.runningVfx.explode(10,player.x-this.groundLayer.x,player.y+this.PLAYER_BBOX[5]-4);
        }
        player.prevGrounded = player.cayoteJmp;

        //player stun
        if (!player.dash && player.inactionable){
            player.velVector.y += (this.GRAVITY);
            player.angle = 0;
            player.velVector.x = player.inactionable;
            player.velVector.x *= (cursors.right.isDown - cursors.left.isDown) == Math.sign(player.inactionable) ? 1 : 0.5;
            player.inactionable -= Math.sign(player.inactionable)/90;
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
            player.inactionable = player.velVector.x;
            if (blocked)
                player.bonkNoise.play();
            player.velVector.y = this.JUMP_VELOCITY;
            player.setScale(SCALE*0.5,SCALE*1.5);
            let playerXYInTile = this.groundLayer.worldToTileXY(player.x,player.y);
            let tiles = this.groundLayer.getTilesWithin(playerXYInTile.x-player.flipX,playerXYInTile.y-1,2,3, {isNotEmpty: true});
            for (let x of tiles){
                if (x.index == 8){
                    this.COMBO.coins = Math.min(this.COMBO.coins+1,15);
                    COINS += Math.ceil((this.COMBO.kills+this.COMBO.coins)/2);
                    player.health += Math.ceil((this.COMBO.kills+this.COMBO.coins)/2);
                    this.COMBO.timer = Math.min(this.COMBO.timer+20,60);
                    this.coinNoise.detune = this.COMBO.coins*50
                    this.coinNoise.play();
                    player.blockBopVfx.explode(1, (x.x*16+8)*SCALE, (x.y*16-8)*SCALE)
                }
                if (x.index == 11){
                    player.blockBreakVfx.explode(1, x.x*16*SCALE, x.y*16*SCALE);
                    player.blockBreakVfx.explode(1, x.x*16*SCALE+8*SCALE, x.y*16*SCALE);
                    player.blockBreakVfx.explode(1, x.x*16*SCALE+8*SCALE, x.y*16*SCALE+8*SCALE);
                    player.blockBreakVfx.explode(1, x.x*16*SCALE, x.y*16*SCALE+8*SCALE);
                }
                if ((x.index == 8 || x.index == 11) && !this.bonkNoise.isPlaying)
                    this.bonkNoise.play();
            }
            this.groundLayer.replaceByIndex(11,-1,playerXYInTile.x-player.flipX,playerXYInTile.y-1,2,3);
            this.groundLayer.replaceByIndex(8,30,playerXYInTile.x-player.flipX,playerXYInTile.y-1,2,3);
        }
        if (Phaser.Input.Keyboard.JustDown(cursors.shift) && !player.inactionable){
            player.dash = 1;
            player.inactionable = 1;
            player.velVector.x = player.flipX ? -24 : 24;
            player.velVector.y = -5;
            player.anims.play('jump');
            player.dashNoise.play()
            player.angle = player.flipX ? -20 : 20;
            player.setScale(SCALE*1.5);
        }

        //player walk/run/roll
        if (player.anims.currentAnim.key == 'roll' && !player.rollNoise.isPlaying && !player.rollNoise.playedOnce){
            player.rollNoise.play();
            player.rollNoise.playedOnce = 1;
        }
        if (player.anims.currentAnim.key != 'roll'){
            player.rollNoise.stop();
            player.rollNoise.playedOnce = 0;
        }else if (player.grounded){
            player.runningVfx.explode(!Math.floor(Math.random()*10),player.x-this.groundLayer.x,player.y+this.PLAYER_BBOX[5]-4);
        }
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
                player.footstep = ((player.footstep + 1) % 16)*player.grounded;
                if (!player.footstep && player.grounded){
                    player.walkNoise.detune = 0;
                    player.walkNoise.play();
                    player.runningVfx.explode(2,player.x-this.groundLayer.x-movePlayerDir*10*SCALE,player.y+this.PLAYER_BBOX[5]-4);
                }
            } else {
                player.anims.play('idle');
                this.modVelTimer = (Math.abs(this.modVelTimer)) ? this.modVelTimer-Math.sign(this.modVelTimer) : 0;
                player.velVector.x = Math.abs(player.velVector.x)>0.5 ? player.velVector.x/4 : 0;
                player.footstep = 0;
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
                player.jumpNoise.rate = 1;
                player.jumpNoise.detune = 0;
                player.jumpNoise.play();
                player.cayoteJmp = 0;
                player.runningVfx.explode(10,player.x-this.groundLayer.x,player.y+this.PLAYER_BBOX[5]-4);
                player.setScale(SCALE*0.5,SCALE*1.5);
                player.setOrigin(0.5,0.75);
            }

            //controllable jump height
            if(player.velVector.y < 0 && !cursors.space.isDown){
                player.velVector.y *= this.CURB_JUMP;
                player.jumpNoise.rate = 3;
                player.jumpNoise.detune = -1900;
            }

            //hang time
            if(player.velVector.y>-200 && player.velVector.y<200 && cursors.space.isDown)
                player.velVector.y += (this.GRAVITY-this.ADDITIONAL_FALLING_ACC);
            else if(player.velVector.y>0)
                player.velVector.y += (this.GRAVITY+this.ADDITIONAL_FALLING_ACC);
            else
                player.velVector.y += (this.GRAVITY);
        }
        
        //player bbox handling
        if (this.PLAYER_BBOX[3]==2 && !(player.dckRll || player.dash)){
            let blocked = this.groundLayer.hasTileAtWorldXY(player.x+this.PLAYER_BBOX[0],player.y-14*SCALE)||
            this.groundLayer.hasTileAtWorldXY(player.x+this.PLAYER_BBOX[2],player.y-14*SCALE);
            this.PLAYER_BBOX[3] = blocked ? 2 : -14*SCALE;
            this.PLAYER_BBOX[4] = blocked ? 14 : 0;
            player.dckRll = blocked;
            player.velVector.x = blocked ? (player.flipX ? -1 : 1) : player.velVector.x;
        }

        //pitfall handling
        if (player.y > 512-10){
            player.health = -(player.health<300)*91;
            player.dash = 0;
            player.dckRll = 0;
            player.anims.play('hurt');
            player.velVector.x = (player.flipX) ? 7 : -7;
            player.inactionable = player.velVector.x;
            player.hurtNoise.play();
            player.velVector.y = this.JUMP_VELOCITY*3;
            player.setScale(SCALE*0.5,SCALE*1.5);
        }

        //death handling (allows for post mortem shenanigans and i quite like that)
        if (!player.inactionable && player.health < 0){
            if (!player.deadNoise.isPlaying && player.dead < 10)
                player.deadNoise.play();
            if (player.dead > 40){
                COINS = Math.max(COINS-600,0);
                if (this.debug)
                    this.destroyDebug()
                this.debug = false;
                this.scene.start('platformerScene');
            }
            player.anims.play('dead');
            player.dead ++;
            player.velVector = {x:0,y:0};
        }
        if (player.health >= 0){
            player.dead = 0;
        }

        //win condition
        if (-this.groundLayer.x > 6760){
            COINS += player.y < 300 ? 300 : 0;
            if (this.debug)
                this.destroyDebug()
            this.debug = false;
            this.scene.start('platformerScene');
        }

        //cammera scrolling
        if (player.x > 355){
            this.groundLayer.x -= (player.x-355);
            this.decoreLayer.x = this.groundLayer.x;
            player.blockBreakVfx.x -= (player.x-355);
            player.blockBopVfx.x -= (player.x-355);
            player.enemyStompVfx.x -= (player.x-355);
            player.bigenemyStompVfx.x -= (player.x-355);
            player.runningVfx.x -= (player.x-355);
            for (let x of this.objects)
                x.x -= (player.x-355);
            player.x -= (player.x-355);
        }
        if (player.x < 355 && this.groundLayer.x - (player.x-355) < 0){
            this.groundLayer.x -= (player.x-355);
            this.decoreLayer.x = this.groundLayer.x;
            player.blockBreakVfx.x -= (player.x-355);
            player.blockBopVfx.x -= (player.x-355);
            player.enemyStompVfx.x -= (player.x-355);
            player.bigenemyStompVfx.x -= (player.x-355);
            player.runningVfx.x -= (player.x-355);
            for (let x of this.objects)
                x.x -= (player.x-355);
            player.x -= (player.x-355);
        }
        player.x = Math.max(player.x,0);

        //combo handleing
        if (this.COMBO.timer == 0){
            this.COMBO.kills = 0;
            this.COMBO.coins = 0;
        }else
            this.COMBO.timer -= player.grounded;
        
        //scoreboard handling
        if (this.COMBO.timer == 0){
            this.scoreboard.display += (this.scoreboard.display<COINS)/3+(COINS-this.scoreboard.display)/300;
            this.scoreboard.text.setText("x "+Math.floor(this.scoreboard.display)+((player.health<300) ? "" : " Extra \u2661"));
        }else{
            let display = Math.floor(this.scoreboard.display)
            display = ("x "+display)+" + "+(COINS-display);
            display += (this.COMBO.kills+this.COMBO.coins > 1) ? " Combo "+(this.COMBO.kills+this.COMBO.coins)+"!" : "";
            display += (player.health<300) ? "" : " Extra \u2661";
            this.scoreboard.text.setText(display);
        }
        console.log(Math.floor(this.scoreboard.display) == COINS);

        //coin handling
        for (let x of this.objects){
            if (x.name == "coin"){
                if (x.x-7*SCALE > player.x+this.PLAYER_BBOX[2])
                    continue;
                if (x.x+7*SCALE < player.x+this.PLAYER_BBOX[0])
                    continue;
                if (x.y+9*SCALE < player.y+this.PLAYER_BBOX[3])
                    continue;
                if (x.y-7*SCALE > player.y+this.PLAYER_BBOX[5])
                    continue;
                this.COMBO.coins = Math.min(this.COMBO.coins+1,15);
                COINS += Math.ceil((this.COMBO.kills+this.COMBO.coins)/2);
                player.health += Math.ceil((this.COMBO.kills+this.COMBO.coins)/2);
                this.COMBO.timer = Math.min(this.COMBO.timer+20,60);
                this.coinNoise.detune = this.COMBO.coins*50
                this.coinNoise.play();
                player.blockBopVfx.explode(1, x.x-this.groundLayer.x, x.y)
                x.destroy();
                this.objects.splice(this.objects.indexOf(x),1);
            }else{
        //enemy handling
            //culling based on enemy on-screen-ness
            if (clamp(x.x,942,-32) != x.x)
                continue;
            if (clamp(x.y,544,-32) != x.y)
                continue;

            x.velVector.y += this.GRAVITY;
            
            //enemy tile map collision
            let i = x.velVector.y;
            while( i ){
                if (this.colliding(x,0,clamp(i,1,-1))){
                    x.velVector.y = 0;
                    break;
                }else
                    x.y += clamp(i,1,-1);
                i -= clamp(i,1,-1);
            }
            //tilemap and enemy to enemy collision
            if (this.colliding(x,x.velVector.x,0))
                x.velVector.x *= -1;
            else
                x.x += x.velVector.x;

            //enemy to player collision
            if (clamp(x.x,player.x+this.PLAYER_BBOX[2]+8*SCALE,player.x+this.PLAYER_BBOX[0]-8*SCALE) != x.x)
                continue;
            if (clamp(x.y,player.y+this.PLAYER_BBOX[5]+8*SCALE,player.y+this.PLAYER_BBOX[3]-8*SCALE) != x.y)
                continue;
            
            //enemy stomped
            if (player.velVector.y > 0 && !player.grounded && !player.dash){
                player.cayoteJmp = 0;
                player.velVector.y = this.JUMP_VELOCITY;
                player.inactionable = player.dckRll ? 0 : player.inactionable;
                if (x.scaleX == SCALE){
                    this.COMBO.kills = Math.min(this.COMBO.kills+1,15);
                    COINS += (this.COMBO.kills+this.COMBO.coins);
                    player.health += (this.COMBO.kills+this.COMBO.coins);
                    this.COMBO.timer = 60;
                    this.killNoise.detune = this.COMBO.kills*50
                    x.destroy();
                    this.objects.splice(this.objects.indexOf(x),1);
                    this.killNoise.play();
                    player.enemyStompVfx.explode(1, x.x-this.groundLayer.x, x.y);
                    continue;
                }
            }
            //enemy rolled over or dashed into
            if (player.dash || (player.dckRll && Math.abs(player.velVector.x)>1)){
                this.COMBO.kills = Math.min(this.COMBO.kills+1,15);
                COINS += (this.COMBO.kills+this.COMBO.coins);
                player.health += (this.COMBO.kills+this.COMBO.coins);
                this.COMBO.timer = 60;
                this.killNoise.detune = this.COMBO.kills*50
                x.destroy();
                this.objects.splice(this.objects.indexOf(x),1);
                this.killNoise.play();
                if (x.scaleX == SCALE)
                    player.enemyStompVfx.explode(1, x.x-this.groundLayer.x, x.y);
                else
                    player.bigenemyStompVfx.explode(1, x.x-this.groundLayer.x, x.y);
                continue;
            }
            

            //enemy hit
            player.health = -(player.health<300)*91;
            player.anims.play('hurt');
            player.velVector.x = (player.flipX) ? 7 : -7;
            player.inactionable = player.velVector.x;
            player.hurtNoise.play();
            player.velVector.y = this.JUMP_VELOCITY;
            player.setScale(SCALE*0.5,SCALE*1.5);
            x.destroy();
            this.objects.splice(this.objects.indexOf(x),1);
            this.killNoise.play();
            if (x.scaleX == SCALE)
                player.enemyStompVfx.explode(1, x.x-this.groundLayer.x, x.y);
            else
                player.bigenemyStompVfx.explode(1, x.x-this.groundLayer.x, x.y);
        }
    }

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
    }
}