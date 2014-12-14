// common game attributes
// TODO: MOVE COORDS
var GamePiece = function(x, y) {
    this.width = 101;
    this.height = 171;
    // default to off screen if not defined
    this.x = x || -101;
    this.y = y || -171;
};

GamePiece.prototype.updateCoords = function(x, y) {
    this.x = x;
    this.y = y;
};

// Enemies our player must avoid
var Enemy = function(level) {
    // Variables applied to each of our instances go here,
    // we've provided one for you to get started
    this.sprite = 'images/enemy-bug.png';
    this.level = level;
    this.velocity = (Math.random() * 101) + level;
    // generate at random row and column
    var coords = this.createCoords(level);
    this.x = coords.x;
    this.y = coords.y;
    GamePiece.call(this,this.x,this.y);
};

Enemy.prototype = Object.create(GamePiece.prototype);
Enemy.prototype.constructor = Enemy;
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.x = this.x+this.velocity * dt;
    // if the object has exited the screen to the right, respawn
    // the character off screen to the left. randomize
    // location to keep the game interesting
    if (this.x > ctx.canvas.width) {
        var coords = this.createCoords(this.level);
        this.x = coords.x;
        this.y = coords.y;
    }
};
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Enemy.prototype.createCoords = function(level) {
    var coords = {};
    // generate x value at a random location off screen
    coords.x = ((Math.random()*level) * -1) - this.width;
    coords.y = (Math.floor(Math.random()*3))*83 + 63;
    return coords;
};


// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function () {
    // have to call this without params to set default size
    GamePiece.call(this);
    this.init();
};

Player.prototype = Object.create(GamePiece.prototype);
Player.prototype.constructor = Player;

// called by game engine to keep player center coordinates updated
Player.prototype.update = function() {
    this.updateCenter();
};
Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite),this.x,this.y);
};

// initialization of attributes and location
Player.prototype.init = function() {
    this.reset();
    this.sprite = 'images/char-boy.png';
    this.points = 0;
    this.life = 100;
    this.alive = true;
};

Player.prototype.reset = function() {
    var x  = ctx.canvas.width / 2 - this.width / 2 ;
    var y = ctx.canvas.height - this.height - 60;
    this.center = {};
    this.updateCoords(x,y);
    this.updateCenter();

    // check if the player is still alive, if not
    // end the game
    if (this.life <= 0) {
        this.life = 0;
        this.alive = false;
    }
};
Player.prototype.handleInput = function(code) {
    // make sure the player is alive
    if (player.alive) {
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
        if (this.x + move.x < 0 || this.x + move.x + this.width > ctx.canvas.width) {
            move.x = 0;
        }
        if (this.y + move.y < 0 || this.y + move.y + this.height > ctx.canvas.height) {
            move.y = 0;
        }
        this.x += move.x;
        this.y += move.y;
        this.updateCenter();
    }
};

Player.prototype.updateCenter = function() {
    this.center.x = this.x + 50;
    this.center.y = this.y + 140;
};

// takes an object to create an game item for the board
var GameItem = function(item,x,y) {
    GamePiece.call(this,x,y);
    this.active = true;
    this.timeRemaining = item.timeRemaining;
    this.type = item.type;
    this.sprite = item.sprite;
    this.points = item.points;
    this.life = item.life;
    this.color = item.color;
    this.init();
};
GameItem.prototype = Object.create(GamePiece.prototype);
GameItem.prototype.constructor = GameItem;

GameItem.prototype.render = function() {
    if (this.active) {
        ctx.drawImage(Resources.get(this.sprite),this.x,this.y);
    }
};
GameItem.prototype.init = function() {
    this.active = true;
    this.defaultTimeRemaining = this.timeRemaining;
    this.defaultPoints = this.points;
    this.defaultLife = this.life;
    this.center = {"x": this.x + 50, "y": this.y + 133};

};
GameItem.prototype.update = function(dt) {
    if (this.active) {
        this.timeRemaining -= dt;
        if (this.timeRemaining <=0 ) {
            this.active = false;
        }
    }
};

/* Game play functions and variables */
var Game = function() {
    player = new Player();
    allEnemies = [];
    this.nextLevel = function() {
        return Math.ceil(Math.pow(this.level,2) /.19);
    }

    this.init();
};

Game.prototype.generateWeightedList = function(items) {
    // random generation adapted from http://codetheory.in/
    var weighted_list = [];
    for (var i = 0; i < items.length; i += 1) {
        var multiples = items[i].weight * 1000;
        for (var j = 0; j < multiples; j += 1) {
            weighted_list.push(i);
        }
    }
    return weighted_list;
};

Game.prototype.init = function() {
    // keep track of score by level and total game
    this.levelScore = 0;
    this.gameScore = 0;

    this.level = 1;

    this.gameOver = false;

    // activate bonus level when something special happens (like catching a star);
    this.isBonusLevel = false;

    // items that can spawn in the game, weighting, and other attributes can be adjusted as game progresses
    this.gameItems = this.resetToLevelOneGameItems();

    this.weighted_list = this.generateWeightedList(this.gameItems);
    // items currently on the game board
    this.itemsOnBoard = [];

    // points animations
    this.pointAnimations = [];

    this.playcols = 5;
    this.playRows = 3;
    // set itemsOnBoard to empty objects initially
    var i = 0;
    for (i; i < this.playcols*this.playRows; i += 1) {
        this.itemsOnBoard.push(undefined);
    }

    // load enemies
    this.resetEnemies();

    // update any player data based on level
};

Game.prototype.resetEnemies = function() {
    // reset all enemies to empty array
    // needed for game resets to level 1
    allEnemies = [];
    var maxEnemies = Math.floor(Math.sqrt(this.level));
    // load up the enemies
    for (var i = 0; i < maxEnemies; i += 1) {
        var enemy = new Enemy(this.level);
        allEnemies.push(enemy);
    }
};

Game.prototype.levelUp = function() {
    this.levelScore = 0;
    this.level += 1;
    this.resetEnemies();
    player.reset();
};

Game.prototype.renderLevelUp = function() {

}

//render any general game things like score animations and points
Game.prototype.render = function() {
    this.renderPointAnimations();
    this.renderScores();
    // check if player is alive
    if (!player.alive) {
        this.renderGameOver();
    }
};

Game.prototype.update = function(dt) {
    // only do this stuff if the player is alive
    if (player.alive) {
        this.checkPlayerGetsItem();
        this.updatePointAnimations(dt);
        var nItemsRemaining = this.removeExpiredItems();
        this.spawnItems(nItemsRemaining);
        this.checkPlayerHitsEnemy();
        this.playerIsStillAlive();

        // simple progressive way to track level up
        if (this.levelScore >= this.nextLevel()) {
            this.levelUp();
        }
    }
};

Game.prototype.renderGameOver = function() {
    ctx.save();
    ctx.fillStyle = 'red';
    ctx.font = '60px bold Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over',ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.fillStyle = 'magenta';
    ctx.font = '24px bold Arial';
    ctx.fillText('Press SPACE BAR to play again', ctx.canvas.width / 2, ctx.canvas.height / 2 + 50);
    ctx.restore();
}

Game.prototype.spawnItems = function(nItems) {
    var maxItems = 0;
    if (this.isBonusLevel) {
        maxItems = 14;
    }
    else if (this.level > 5) {
        maxItems = 5;
    }
    else {
        maxItems = this.level;
    }
    if (nItems < maxItems) {
        // generate random row and column locations
        var col = Math.floor(Math.random()*5);
        var row = Math.floor(Math.random()*3);

        // calculate a 10 by 10 bounding box for would be new item
        // check if this would spawn where the player currently is
        // located
        var item = {
            "left": col*101 + 40,
            "right": col*101 + 60,
            "top": row*83+50 + 123,
            "bottom": row*83+50 + 143
        };
        // check if there is an item at this spawn location
        var canSpawn = true;
        if (typeof this.itemsOnBoard[row*col + col] !== "undefined" || this.itemCollidesWithPlayer(item)) {
            canSpawn = false;
        }

        // based on your level, how frequently should items spawn
        var shouldSpawn = false;
        // only check this if the item can spawn there
        if (canSpawn) {
            var rNum = Math.floor(Math.random()*1000);
            if (this.level > rNum || this.level < 15) {
                shouldSpawn = true;
            }
        }


        // if we can spawn, randomly pick an item type to spawn
        if (canSpawn && shouldSpawn) {
            var randItem = Math.floor(Math.random()*1000);
            var index = this.weighted_list[randItem];
            this.itemsOnBoard[row*col + col] = new GameItem(this.gameItems[index],col*101,row*83+50);
        }
    }
};

/**
 * Removes expired game items from the active array of items
 *
 * @returns {nItems} the number of active items remaining
 */
Game.prototype.removeExpiredItems = function() {
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
    return nItems;
};

Game.prototype.checkPlayerGetsItem = function() {
    for (var i = 0; i < this.itemsOnBoard.length; i += 1) {
        var currentItem = this.itemsOnBoard[i];
        // if it is undefined, skip this iteration
        if (typeof currentItem === "undefined") {
            continue;
        }
        // create a small bounding box for the item
        // then test if the player center is inside
        // that bounding box
        var item = {
            "left": currentItem.center.x - 10,
            "right": currentItem.center.x + 10,
            "top": currentItem.center.y - 10,
            "bottom": currentItem.center.y + 10
        };
        if (this.itemCollidesWithPlayer(item)) {
            currentItem.active = false;
            this.gameScore += currentItem.points;
            this.levelScore += currentItem.points;
            if (player.life + currentItem.life < 100)
                player.life += currentItem.life;
            else
                player.life = 100;
            currentItem.timeRemaining = 0;

            var animate = {"points": currentItem.points, "color": currentItem.color,
                "x": currentItem.center.x, "y": currentItem.center.y, "v": 3};

            this.pointAnimations.push(animate);

            if (currentItem.type === "obstacle") {
                player.reset();
            }
        }
    }
};

Game.prototype.checkPlayerHitsEnemy = function() {
    for (var i = 0; i < allEnemies.length; i += 1) {
        var item = {
            "left": allEnemies[i].x + 10,
            "right": allEnemies[i].x + 90,
            "top": allEnemies[i].y + 110,
            "bottom": allEnemies[i].y + 130
        };
        if (this.itemCollidesWithPlayer(item)) {
            var damage = this.level;
            player.life -= damage > 99 ? 99 : damage;
            player.reset()
        }
    }
};


Game.prototype.itemCollidesWithPlayer = function(item) {
    return item.left < player.center.x && item.right > player.center.x && item.top < player.center.y && item.bottom > player.center.y
};

Game.prototype.playerIsStillAlive = function() {
    if (!player.alive) {
        // do some stuff to print score etc
        this.gameOver = true;
    }
};

/**
 * Loops over an array of point animations
 * Checks if the velocity has reached 0 and removes
 * it from the array if so
 */
Game.prototype.updatePointAnimations = function(dt) {
    for (var i = this.pointAnimations.length - 1; i >= 0; i -= 1) {
        if (this.pointAnimations[i].v <= 0) {
            this.pointAnimations.splice(i,1);
        }
        else {
            this.pointAnimations[i].x += 60 * dt;
            this.pointAnimations[i].y -= 60 * dt;
            this.pointAnimations[i].v -= (5 * dt);
        }
    }
};

Game.prototype.renderPointAnimations = function() {
    for (var i = 0; i < this.pointAnimations.length; i += 1) {
        ctx.save();
        ctx.fillStyle = this.pointAnimations[i].color;
        ctx.font = 'normal bold 2em Arial';
        ctx.fillText(this.pointAnimations[i].points,this.pointAnimations[i].x,this.pointAnimations[i].y);
        ctx.restore();
    }
};

Game.prototype.renderScores = function() {
    ctx.save();
    ctx.clearRect(0,0,ctx.canvas.width,50);
    ctx.font = '14px Arial';
    ctx.fillText("Life: ",0,15,50);
    ctx.fillText("Level: ",0,30,50);
    ctx.fillText("Next Level: ",0,45);
    ctx.fillText("Score: ",300, 15,50);
    ctx.fillStyle = 'blue';
    ctx.fillText(this.gameScore.toString(),350,15);
    ctx.fillText(player.life.toString(),50,15);
    ctx.fillText(this.level.toString(),50,30);
    ctx.fillStyle = 'green';
    ctx.lineWidth = 2;
    var levelProgress = (this.levelScore / this.nextLevel()) * 100;
    ctx.fillRect(75,35,levelProgress,12);
    ctx.strokeRect(75,35,100,12);
    ctx.font = '10px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(this.levelScore + " / " + this.nextLevel().toString(), 125, 45);
    ctx.restore();
};

Game.prototype.resetToLevelOneGameItems = function() {
    return [
        {"type": "blueGem", "weight": .50, "sprite": "images/Gem Blue.png",
            "points": 5, "life": 0, "timeRemaining": 5, "color": "blue"},
        {"type": "greenGem", "weight": .15, "sprite": "images/Gem Green.png",
            "points": 10, "life": 1, "timeRemaining": 4, "color": "green"},
        {"type": "orangeGem", "weight": .075, "sprite": "images/Gem Orange.png",
            "points": 20, "life": 2, "timeRemaining": 3, "color": "orange"},
        {"type": "heart", "weight": .1, "sprite": "images/Heart.png",
            "points": 0, "life": 25, "timeRemaining": 4, "color": "red"},
        {"type": "key", "weight": .025, "sprite": "images/Key.png",
            "points": 5, "life": 0, "timeRemaining": 2, "color": "gold"},
        {"type": "obstacle", "weight": .1, "sprite": "images/Rock.png",
            "points": -5, "life": -5, "timeRemaining": 5, "color": "gray"},
        {"type": "star", "weight": .05, "sprite": "images/Star.png",
            "points": 25, "life": 100, "timeRemaining": 2, "color": "yellow"}
    ];
};

Game.prototype.handleInput = function(code) {
    if (!player.alive && code === 'SPACEBAR') {
        player.init();
        game.init();
    }
}

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

var startGame = function() {
    game = new Game();
};

Resources.onReady(startGame);


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

document.addEventListener('keydown', function(e) {
    var allowedKeys = {
        32: 'SPACEBAR'
    };
    game.handleInput(allowedKeys[e.keyCode]);
});
