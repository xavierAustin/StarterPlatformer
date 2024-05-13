class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.MAX_RUN = 300;
        this.DRAG = 700;    // DRAG < ACCELERATION = icy slide
        this.GRAVITY = 4000; //took out world gravity for a bit more control
        this.ADDITIONAL_FALLING_ACC = 2000;
        this.JUMP_VELOCITY = -900;
        this.CURB_JUMP = 0.65;
        this.RUN_STARTUP = 6;
    }

    create() {
        this.modVelTimer = 0;
        this.ledgecooldown = 0;
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformer-level-1", 18, 18, 45, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = this.map.addTilesetImage("kenny_tilemap_packed", "tilemap_tiles");

        // Create a layer
        this.groundLayer = this.map.createLayer("Ground-n-Platforms", this.tileset, 0, 0);
        this.groundLayer.setScale(2.0);

        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(36, 576, "platformer_characters", "tile_0000.png").setScale(SCALE)
        my.sprite.player.setCollideWorldBounds(true);

        //rectangle
        this.edge = this.add.rectangle(0,0,SCALE*2,SCALE*2,0xffffff,1)

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer); //this just like doesn't actually detect collisions sometimes?
        //like im pretty sure i could make a better collision handler

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
            this.edge.visible ^= 1;
        }, this);

        // Create a layer
        this.decore = this.map.createLayer("Decore", this.tileset, 0, 0);
        this.decore.setScale(2.0);
        console.log(my.sprite.player.body);
    }

    update() {
        let velVector = my.sprite.player.body.velocity;
        if(cursors.left.isDown) {
            if (this.modVelTimer==-this.RUN_STARTUP)
                my.sprite.player.body.setVelocityX(-this.MAX_RUN);
            else if (this.modVelTimer>-this.RUN_STARTUP)
                my.sprite.player.body.setVelocityX((velVector.x*3-this.MAX_RUN)/4);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            this.modVelTimer = (this.modVelTimer>-this.RUN_STARTUP) ? this.modVelTimer-1 : -this.RUN_STARTUP;

        } else if(cursors.right.isDown) {
            // TODO: have the player accelerate to the right
            if (this.modVelTimer==this.RUN_STARTUP)
                my.sprite.player.body.setVelocityX(this.MAX_RUN);
            else if (this.modVelTimer<this.RUN_STARTUP)
                my.sprite.player.body.setVelocityX((velVector.x*3+this.MAX_RUN)/4);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            this.modVelTimer = (this.modVelTimer<this.RUN_STARTUP) ? this.modVelTimer+1 : this.RUN_STARTUP;

        } else {
            // TODO: set acceleration to 0 and have DRAG take over
            //my.sprite.player.body.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.anims.play('idle');
            this.modVelTimer = (Math.abs(this.modVelTimer)) ? this.modVelTimer-Math.sign(this.modVelTimer) : 0;
            my.sprite.player.body.setVelocityX(0);
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            // TODO: set a Y velocity to have the player "jump" upwards (negative Y direction)
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }
        //controllable jump height
        if(velVector.y < 0 && !cursors.up.isDown)
            velVector.y *= this.CURB_JUMP;

        //hang time
        if(velVector.y>-200 && velVector.y<200 && cursors.up.isDown)
            my.sprite.player.body.setAccelerationY(this.GRAVITY-this.ADDITIONAL_FALLING_ACC);
        else if(velVector.y>0)
            my.sprite.player.body.setAccelerationY(this.GRAVITY+this.ADDITIONAL_FALLING_ACC);
        else if(!my.sprite.player.body.blocked.down)
            my.sprite.player.body.setAccelerationY(this.GRAVITY);
        //ledge grab
        this.edge.x = my.sprite.player.flipX ? my.sprite.player.x+24*SCALE : my.sprite.player.x-24*SCALE;
        this.edge.y = my.sprite.player.y-18*SCALE;
        if(this.ledgecooldown < 1 && !this.groundLayer.hasTileAtWorldXY(this.edge.x,this.edge.y) && this.groundLayer.hasTileAtWorldXY(this.edge.x,this.edge.y+9*SCALE)){
            my.sprite.player.body.setAccelerationY(0);
            my.sprite.player.body.setVelocityY(0);
            if (Phaser.Input.Keyboard.JustDown(cursors.up)){
                this.ledgecooldown = 10;
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            }
            if (Phaser.Input.Keyboard.JustDown(cursors.down))
                this.ledgecooldown = 10;
        }
        this.ledgecooldown--;
    }
}