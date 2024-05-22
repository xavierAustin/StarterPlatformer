// Jim Whitehead
// Created: 4/14/2024
// Phaser: 3.70.0
//
// Cubey
//
// An example of putting sprites on the screen using Phaser
// 
// Art assets from Kenny Assets "Shape Characters" set:
// https://kenney.nl/assets/shape-characters

// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    fps: { target: 60, forceSetTimeOut: 1 }, 
    /*physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: {
                x: 0,
                y: 0
            }
        }
    },*/
    width: 910,
    height: 512,
    scene: [Load, Platformer]
}

var cursors;
const SCALE = 2.0;
var my = {sprite: {}, text: {}};
var COINS = 0;
var BGM = 0;

const game = new Phaser.Game(config);