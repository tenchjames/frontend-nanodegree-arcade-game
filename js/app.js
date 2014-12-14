// common game attributes
// TODO: MOVE COORDS
var GamePiece = function(x, y) {
    this.width = 101;
    this.height = 171;
    // default to off screen if not defined
    this.x = x || -101;
    this.y = y || -171;
}

GamePiece.prototype.updateCoords = function(x, y) {
    this.x = x;
    this.y = y;
}

// Enemies our player must avoid
var Enemy = function(level) {
    // Variables applied to each of our instances go here,
    // we've provided one for you to get started
    this.sprite = 'images/enemy-bug.png';
    this.level = level;
    this.velocity = (Math.random() * 75) + level;
    // generate at random row and column
    var coords = this.createCoords(level);
    this.x = coords.x;
    this.y = coords.y;
    GamePiece.call(this,this.x,this.y);
}

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
}
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
}

Enemy.prototype.createCoords = function(level) {
    var coords = {}
    // generate x value at a random location off screen
    coords.x = ((Math.random()*level) * -1) - this.width;
    coords.y = (Math.floor(Math.random()*3))*83 + 63;
    return coords;
}


// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function () {
    // have to call this without params to set default size
    GamePiece.call(this);
    this.reset();
    this.sprite = 'images/char-boy.png';
    this.points = 0;
    this.life = 100;
}

Player.prototype = Object.create(GamePiece.prototype);
Player.prototype.constructor = Player;

Player.prototype.update = function() {
    this.updateCenter();
}
Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite),this.x,this.y);
}
Player.prototype.reset = function() {
    var x  = ctx.canvas.width / 2 - this.width / 2 ;
    var y = ctx.canvas.height - this.height - 60;
    this.center = {};
    this.updateCoords(x,y);
    this.updateCenter();
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

Player.prototype.updateCenter = function() {
    this.center.x = this.x + 50;
    this.center.y = this.y + 140;
}

// TODO: CAN I PASS X&Y UP CHAIN
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
}
GameItem.prototype = Object.create(GamePiece.prototype);
GameItem.prototype.constructor = GameItem;
GameItem.prototype.render = function() {
    if (this.active) {
        ctx.drawImage(Resources.get(this.sprite),this.x,this.y);
    }
}
GameItem.prototype.init = function() {
    this.active = true;
    this.defaultTimeRemaining = this.timeRemaining;
    this.defaultPoints = this.points;
    this.defaultLife = this.life;
    this.center = {"x": this.x + 50, "y": this.y + 133};

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
var Game = function() {
    // the level of the game which drives the difficulty
    this.level = 9;
    player = new Player();
    allEnemies = [];
    // keep track of score by level and total game
    this.levelScore = 0;
    this.gameScore = 0;

    // activate bonus level when something special happens (like catching a star);
    this.isBonusLevel = false;

    // items that can spawn in the game, weighting, and other attributes can be adjusted as game progresses
    this.gameItems = this.resetToLevelOneGameItems();

    // items currently on the game board
    this.itemsOnBoard = [];

    // points animations
    this.pointAnimations = [];

    this.playcols = 5;
    this.playRows = 3;

    this.init();

}

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
// TODO: MOVE TO END
Game.prototype.init = function() {
    this.weighted_list = this.generateWeightedList(this.gameItems);

    // set itemsOnBoard to empty objects initially
    for (var i = 0; i < this.playcols*this.playRows; i += 1) {
        this.itemsOnBoard.push(undefined);
    }

    // limit number of enemies to 5 since only 3 rows
    var maxEnemies = this.level % 3 + 1;
    // load up the enemies
    for (var i = 0; i < maxEnemies; i += 1) {
        var enemy = new Enemy(i + 1);
        allEnemies.push(enemy);
    }

    // update any player data based on level
};

//render any general game things like score animations and points
Game.prototype.render = function() {
    this.renderPointAnimations();
    this.updateScores();
};

Game.prototype.update = function(dt) {
    this.checkPlayerGetsItem();
    this.updatePointAnimations(dt);
    var nItemsRemaining = this.removeExpiredItems();
    this.spawnItems(nItemsRemaining);
    this.checkPlayerHitsEnemy();
};

Game.prototype.spawnItems = function(nItems) {
    var maxItems = this.level % 5 + 1;

    if (nItems < maxItems) {
        // generate random row and column locations
        var col = Math.floor(Math.random()*5);
        var row = Math.floor(Math.random()*3);

        // check if there is an item at this spawn location
        var canSpawn = true;
        if (typeof this.itemsOnBoard[row*col + col] !== "undefined") {
            canSpawn = false;
        }

        // based on your level, how frequently should items spawn
        var shouldSpawn = false;
        var rNum = Math.floor(Math.random()*1000);
        if (this.level*2 > rNum) {
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
}

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
}

Game.prototype.checkPlayerGetsItem = function() {
    for (var i = 0; i < this.itemsOnBoard.length; i += 1) {
        // if it is undefined, skip this iteration
        if (typeof this.itemsOnBoard[i] === "undefined") {
            continue;
        }
        // create a small bounding box for the item
        // then test if the player center is inside
        // that bounding box
        var item = {
            "left": this.itemsOnBoard[i].center.x - 10,
            "right": this.itemsOnBoard[i].center.x + 10,
            "top": this.itemsOnBoard[i].center.y - 10,
            "bottom": this.itemsOnBoard[i].center.y + 10
        };
        if (this.itemCollidesWithPlayer(item)) {
            if (this.itemsOnBoard[i].active) {
                this.itemsOnBoard[i].active = false;
                this.gameScore += this.itemsOnBoard[i].points;
                player.life += this.itemsOnBoard[i].life;
                this.itemsOnBoard[i].timeRemaining = 0;

                var animate = {"points": this.itemsOnBoard[i].points, "color":this.itemsOnBoard[i].color,
                    "x": this.itemsOnBoard[i].center.x, "y": this.itemsOnBoard[i].center.y, "v": 3};

                this.pointAnimations.push(animate);
                document.getElementById('score').innerHTML = this.gameScore;
            }
        }
    }
};

Game.prototype.checkPlayerHitsEnemy = function() {
    for (var i = 0; i < allEnemies.length; i += 1) {
        var item = {
            "left": allEnemies[i].x + 60,
            "right": allEnemies[i].x + 100,
            "top": allEnemies[i].y + 110,
            "bottom": allEnemies[i].y + 130
        };
        if (this.itemCollidesWithPlayer(item)) {
            player.life -= 5;
            this.enemyGotPlayer();
        }
    }
};

Game.prototype.enemyGotPlayer = function() {
    document.getElementById('life').innerHTML = player.life;
    player.reset();
}

Game.prototype.itemCollidesWithPlayer = function(item) {
    return item.left < player.center.x && item.right > player.center.x && item.top < player.center.y && item.bottom > player.center.y
}


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
}

Game.prototype.renderPointAnimations = function() {
    for (var i = 0; i < this.pointAnimations.length; i += 1) {
        ctx.save();
        ctx.fillStyle = this.pointAnimations[i].color;
        ctx.font = 'normal bold 2em "Lucida Console"';
        ctx.fillText(this.pointAnimations[i].points,this.pointAnimations[i].x,this.pointAnimations[i].y);
        ctx.restore();
    }
}

Game.prototype.updateScores = function() {
    ctx.save();
    ctx.font = '12pt Arial';
    ctx.fillText("Score: " + this.gameScore,ctx.canvas.width - 150, 15);
    ctx.restore();
};

Game.prototype.resetToLevelOneGameItems = function() {
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
}


// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

var startGame = function() {
    game = new Game();
}

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
