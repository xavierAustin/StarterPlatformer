class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.atlas("platformer_misc", "monochrome_tilemap_transparent_packed.png", "tilemap-other.json");
        this.load.atlas("player_character", "fuzzydinosaur.png", "tilemap-player-packed.json");

        // Load tilemap information
        this.load.image("tilemap_tiles", "monochrome_tilemap_transparent_packed.png"); // Packed tilemap
        this.load.tilemapTiledJSON("platformer-level-1", "level0.json"); // Tilemap in JSON

        // Load audio
        this.load.audio("walkies", "footsteps.wav");
        this.load.audio("jumpies", "jump.wav");
        this.load.audio("dashies", "dash.wav");
        this.load.audio("hurties", "hurt.wav");
        this.load.audio("coinies", "coin.wav");
        this.load.audio("rollies", "roll.wav");
        this.load.audio("killies", "kill.wav");
        this.load.audio("deadies", "dead.wav");
        this.load.audio("bonkies", "bonk.wav");
        this.load.audio("destries", "destroy.wav");
        this.load.audio("BGM","sepha03AtmosphericJungleTool(Loop).mp3")
    }

    create() {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNames('player_character', {
                prefix: "tile_",
                start: 3,
                end: 6,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            defaultTextureKey: "player_character",
            frames: [
                { frame: "tile_0000.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'hurt',
            defaultTextureKey: "player_character",
            frames: [
                { frame: "tile_0010.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'dead',
            defaultTextureKey: "player_character",
            frames: [
                { frame: "tile_0009.png" }
            ],
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            defaultTextureKey: "player_character",
            frames: [
                { frame: "tile_0001.png" }
            ],
        });

        this.anims.create({
            key: 'fall',
            defaultTextureKey: "player_character",
            frames: [
                { frame: "tile_0002.png" }
            ],
        });

        this.anims.create({
            key: 'duck',
            defaultTextureKey: "player_character",
            frames: [
                { frame: "tile_0007.png" }
            ],
        });

        this.anims.create({
            key: 'roll',
            frames: this.anims.generateFrameNames('player_character', {
                prefix: "tile_",
                start: 7,
                end: 8,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 7,
            repeat: -1
        });

        this.anims.create({
            key: 'enemyWalk',
            frames: this.anims.generateFrameNames('platformer_misc', {
                prefix: "tile_",
                start: 1,
                end: 2,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 5,
            repeat: -1
        });

        this.anims.create({
            key: 'bigEnemyWalk',
            frames: this.anims.generateFrameNames('platformer_misc', {
                prefix: "tile_",
                start: 4,
                end: 5,
                suffix: ".png",
                zeroPad: 4
            }),
            frameRate: 3,
            repeat: -1
        });

         // ...and pass to the next Scene
         this.scene.start("platformerScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}