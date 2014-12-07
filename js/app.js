// common game attributes
// TODO: MOVE COORDS
var GamePiece = function() {
    this.width = 101;
    this.height = 171;
    // default to off screen
    this.coords = { x:-101, y:-171 };
}

GamePiece.prototype.updateCoords = function(x, y) {
    this.coords.x = x;
    this.coords.y = y;
}

// Common character attributes TODO: CHECK THIS IF NEEDED
var Character = function(x,y) {
    GamePiece.call(this);
    this.coords.x = x;
    this.coords.y = y;
}
Character.prototype = Object.create(GamePiece.prototype);
Character.prototype.constructor = Character;


// Enemies our player must avoid
var Enemy = function() {
    // Variables applied to each of our instances go here,
    // we've provided one for you to get started
    Character.call(this,0,0);
    this.sprite = 'images/enemy-bug.png';
    this.level = 1;
}

Enemy.prototype = Object.create(Character.prototype);
Enemy.prototype.constructor = Enemy;
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.coords.x = this.coords.x+this.velocity * dt;
    // if the object has exited the screen to the right, respawn
    // the character off screen to the left. randomize
    // location to keep the game interesting
    if (this.coords.x > ctx.canvas.width) {
        this.coords = this.createCoords(this.level);
    }
}
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.coords.x, this.coords.y);
}
Enemy.prototype.spawn = function(level) {
    // Spawn off screen so can have smooth transition on to the screen
    // spawn a random amount off screen based on the level
    this.level = level;
    this.coords = this.createCoords(level);
    this.velocity = Math.random()*level + level;
}
Enemy.prototype.createCoords = function(level) {
    var coords = {}
    coords.x = (((Math.random()+1)*level) * -1) - this.width;
    coords.y = (Math.floor(Math.random()*3))*83 + 63;
    return coords;
}


// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function () {
    GamePiece.call(this);
    var x  = ctx.canvas.width / 2 - this.width / 2 ;
    var y = ctx.canvas.height - this.height - 60;
    Character.call(this,x,y);
    this.center  = {"x": this.coords.x+50, "y": this.coords.y+140}
    this.sprite = 'images/char-boy.png';
    this.points = 0;
    this.life = 100;
}

Player.prototype = Object.create(Character.prototype);
Player.prototype.constructor = Player;

Player.prototype.update = function() {
    this.updateCenter();
}
Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite),this.coords.x,this.coords.y);
}

Player.prototype.handleInput = function(code) {
    var move = {x: 0, y:0 };
    if (code === 'down') {
        move.y = 83
    }
    else if (code === 'up') {
        move.y = -83
    }
    else if (code === 'left') {
        move.x = -101;
    }
    else if (code === 'right') {
        move.x = 101;
    }
    if (this.coords.x + move.x < 0 || this.coords.x + move.x + this.width > ctx.canvas.width) {
        move.x = 0;
    }
    if (this.coords.y + move.y < 0 || this.coords.y + move.y + this.height > ctx.canvas.height) {
        move.y = 0;
    }
    this.coords.x += move.x;
    this.coords.y += move.y;
    this.updateCenter();
}

Player.prototype.spawn = function() {
    this.coords.x = ctx.canvas.width / 2 - this.width / 2 ;
    this.coords.y = ctx.canvas.height - this.height - 60;
    console.log(this.center)
}
Player.prototype.updateCenter = function() {
    this.center.x = this.coords.x + 50;
    this.center.y = this.coords.y + 140;
}

// TODO: CAN I PASS X&Y UP CHAIN
// takes an object to create an game item for the board
var GameItem = function(item,x,y) {
    GamePiece.call(this);
    this.active = true;
    this.timeRemaining = item.timeRemaining;
    this.type = item.type;
    this.sprite = item.sprite;
    this.points = item.points;
    this.life = item.life;
    this.color = item.color;
    this.coords.x = x;
    this.coords.y = y;
    this.init();
}
GameItem.prototype = Object.create(GamePiece.prototype);
GameItem.prototype.constructor = GameItem;
GameItem.prototype.render = function() {
    if (this.active) {
        ctx.drawImage(Resources.get(this.sprite),this.coords.x,this.coords.y);
    }
}
GameItem.prototype.init = function() {
    this.active = true;
    this.defaultTimeRemaining = this.timeRemaining;
    this.defaultPoints = this.points;
    this.defaultLife = this.life;
    this.center = {"x": this.coords.x + 50, "y": this.coords.y + 133};

}
GameItem.prototype.update = function(dt) {
    if (this.active) {
        this.timeRemaining -= dt;
        if (this.timeRemaining <=0 ) {
            this.active = false;
        }
    }
}

/* Game play functions and variables */
var Game = function(player,enemies) {
    // the level of the game which drives the difficulty
    this.level = 1;
    this.player = player;
    this.enemies = enemies;
    // keep track of score by level and total game
    this.levelScore = 0;
    this.gameScore = 0;

    // activate bonus level when something special happens (like catching a star);
    this.isBonusLevel = false;

    // items that can spawn in the game, weighting, and other attributes can be adjusted as game progresses
    this.gameItems = this.resetToLevelOneGameItems();

    // items currently on the game board
    this.itemsOnBoard = [];

    // reuse previously created items that are not on the board
    // to save memory
    this.cachedItems = [];

    this.playcols = 5;
    this.playRows = 3;

    this.init();

}

Game.prototype = {
    generateWeightedList: function(items) {
        // random generation adapted from http://codetheory.in/
        var weighted_list = [];
        for (var i = 0; i < items.length; i += 1) {
            var multiples = items[i].weight * 1000;
            for (var j = 0; j < multiples; j += 1) {
                weighted_list.push(i);
            }
        }
        return weighted_list;
    },
    init: function() {
        this.weighted_list = this.generateWeightedList(this.gameItems);

        // set itemsOnBoard to empty objects initially
        for (var i = 0; i < this.playcols*this.playRows; i += 1) {
            this.itemsOnBoard.push(undefined);
        }

        // load up the enemies

        // update any player data based on level
    },
    update: function() {
        this.updateScores();
        var maxItems = this.level > 14 ? 14 : this.level;
        var nItems = 0;
        // clean up any dead items and put them back for later use
        for (var i = this.itemsOnBoard.length-1; i >= 0; i -= 1) {
            if (typeof this.itemsOnBoard[i] !== "undefined" && this.itemsOnBoard[i].active === false) {
                delete this.itemsOnBoard[i];
            }
            if (typeof this.itemsOnBoard[i] !== "undefined" && this.itemsOnBoard[i].active === true) {
                nItems += 1;
            }
        }

        if (nItems < maxItems) {
            // generate random row and column locations base off image dimensions
            var col = Math.floor(Math.random()*5);
            var row = Math.floor(Math.random()*3);

            // check if there is an item at this spawn location
            var canSpawn = true;
            if (typeof this.itemsOnBoard[row*col + col] !== "undefined") {
                canSpawn = false;
            }

            // based on your level, how frequently should items spawn
            var shouldSpawn = false;
            var rNum = Math.floor(Math.random()*100);
            if (this.level > rNum) {
                shouldSpawn = true;
            }

            // if we can spawn, randomly pick an item type to spawn
            if (canSpawn && shouldSpawn) {
                var randItem = Math.floor(Math.random()*1000);
                var index = this.weighted_list[randItem];
                var item = new GameItem(this.gameItems[index],col*101,row*83+50);
                this.itemsOnBoard[row*col + col] = item;
            }
        }
    },
    updateScores: function() {
        for (var i = 0; i < this.itemsOnBoard.length; i += 1) {
            // if it is undefined, skip this iteration
            if (typeof this.itemsOnBoard[i] === "undefined") {
                continue;
            }

            var left = this.itemsOnBoard[i].center.x - 10,
                right = this.itemsOnBoard[i].center.x + 10,
                top = this.itemsOnBoard[i].center.y - 10,
                bottom = this.itemsOnBoard[i].center.y + 10;
            if (left < player.center.x && right > player.center.x && top < player.center.y && bottom > player.center.y) {
                if (this.itemsOnBoard[i].active) {
                    this.itemsOnBoard[i].active = false;
                    this.gameScore += this.itemsOnBoard[i].points;
                    player.life += this.itemsOnBoard[i].life;
                    this.itemsOnBoard[i].timeRemaining = 0;
                    document.getElementById('score').innerHTML = this.gameScore;
                }
            }
        }
    },
    resetToLevelOneGameItems: function() {
        return [
            {"type": "blueGem", "weight": .40, "sprite": "images/Gem Blue.png",
                "points": 5, "life": 1, "timeRemaining": 5, "color": "blue"},
            {"type": "greenGem", "weight": .25, "sprite": "images/Gem Green.png",
                "points": 10, "life": 2, "timeRemaining": 4, "color": "green"},
            {"type": "orangeGem", "weight": .075, "sprite": "images/Gem Orange.png",
                "points": 25, "life": 3, "timeRemaining": 3, "color": "orange"},
            {"type": "heart", "weight": .1, "sprite": "images/Heart.png",
                "points": 0, "life": 25, "timeRemaining": 4, "color": "red"},
            {"type": "key", "weight": .075, "sprite": "images/Key.png",
                "points": 5, "life": 0, "timeRemaining": 2, "color": "gold"},
            {"type": "obstacle", "weight": .05, "sprite": "images/Rock.png",
                "points": -5, "life": -5, "timeRemaining": 5, "color": "gray"},
            {"type": "star", "weight": .05, "sprite": "images/Star.png",
                "points": 25, "life": 100, "timeRemaining": 2, "color": "yellow"}
        ];
    },
    animateGainingPoints: function(pts,color,x,y) {

    }
}


// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
var allEnemies = [];

for (var i = 0; i < 4; i += 1) {
    var enemy = new Enemy();
    enemy.spawn(50);
    allEnemies.push(enemy)
}


var createPlayer = function() {
    player = new Player();
    //player.spawn();
    game = new Game(player,allEnemies);
}



Resources.onReady(createPlayer);
Resources.isReady();


// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});



/* mouse tracking function */
function windowToCanvas(canvas, x, y) {
    var bbox = canvas.getBoundingClientRect();
    return { x: x - bbox.left * (canvas.width  / bbox.width),
        y: y - bbox.top  * (canvas.height / bbox.height)
    };
}

//document.addEventListener('mousemove', function(e) {
//    e.preventDefault();
//    var coords = document.getElementById('coords');
//    var loc = windowToCanvas(ctx.canvas, e.x, e.y);
//    var text = "";
//    text += "x: ";
//    text += loc.x.toFixed(0);
//    text += ", y: ";
//    text += loc.y.toFixed(0);
//    coords.innerHTML = text;
//});
