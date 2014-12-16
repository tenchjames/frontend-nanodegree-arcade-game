/* globals */
var game = {},
    allEnemies = [],
    player = {};

/**
 * Common game piece attributes
 * @param {number} x
 * @param {number} y
 * @constructor
 */
var GamePiece = function (x, y) {
    this.width = 101;
    this.height = 171;
    // default to off screen if not defined
    if (x || x === 0) {
        this.x = x;
    } else {
        this.x = -101;
    }
    if (y || y === 0) {
        this.y = y;
    } else {
        this.y = -171;
    }
};
/**
 * Updates x, y coords of any GamePiece object
 * @param {number} x
 * @param {number} y
 */
GamePiece.prototype.updateCoords = function (x, y) {
    this.x = x;
    this.y = y;
};

/**
 * Enemies the player must avoid
 * @param {number} level The level drives how strong the enemy is
 * @constructor
 */
var Enemy = function (level) {
    // Variables applied to each of our instances go here,
    // we've provided one for you to get started
    this.sprite = 'images/enemy-bug.png';
    this.level = level;
    // randomize velocity based off level.
    // keep max random velocity to 505 total (about 1 second to span
    // the entire game board)
    this.velocity = (Math.random() * level * 50);
    // generate at random row and column
    var coords = this.createCoords(level);
    this.x = coords.x;
    this.y = coords.y;
    GamePiece.call(this, this.x, this.y);
};

Enemy.prototype = Object.create(GamePiece.prototype);
Enemy.prototype.constructor = Enemy;

Enemy.prototype.update = function (dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    this.x = this.x + this.velocity * dt;
    // if the object has exited the screen to the right, respawn
    // the character off screen to the left. randomize
    // location to keep the game interesting
    if (this.x > ctx.canvas.width) {
        var coords = this.createCoords(this.level);
        this.x = coords.x;
        this.y = coords.y;
    }
};

Enemy.prototype.render = function () {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

/**
 * Create random coordinates for enemy spawn location
 * @param {number} level
 * @returns {{}}
 */
Enemy.prototype.createCoords = function (level) {
    var coords = {};
    // generate x value at a random location off screen
    coords.x = ((Math.random() * level) * -1) - this.width;
    coords.y = (Math.floor(Math.random() * 3)) * 83 + 63;
    return coords;
};


/**
 * Player object - holds life, sprite animations,
 * and other behaviors for player type
 * @constructor
 */
var Player = function () {
    // have to call this without params to set default size
    GamePiece.call(this);
    this.init();
};

Player.prototype = Object.create(GamePiece.prototype);
Player.prototype.constructor = Player;

/** Keep the Center point of player updated */
Player.prototype.update = function () {
    this.updateCenter();
};

Player.prototype.render = function () {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

/** initialize attributes for a new player */
Player.prototype.init = function () {
    this.reset();
    this.sprites = [
        'images/char-boy.png',
        'images/char-cat-girl.png',
        'images/char-horn-girl.png',
        'images/char-pink-girl.png',
        'images/char-princess-girl.png'
    ];
    this.sprite = this.sprites[0];
    this.unlockedSprites = 1;
    this.life = 100;
    this.alive = true;
    this.levelUp = false;
};

/**
 * Method is called when player needs to be reset to
 * the starting location. Checks of player is still
 * alive, and resets coordinates.
 */
Player.prototype.reset = function () {
    var x = ctx.canvas.width / 2 - this.width / 2,
        y = ctx.canvas.height - this.height - 60;
    this.center = {};
    this.updateCoords(x, y);
    this.updateCenter();

    // check if the player is still alive, if not
    // end the game
    if (this.life <= 0) {
        this.life = 0;
        this.alive = false;
    }
};

/**
 * Conditionally handles input base on if player is
 * alive or between levels
 * @param {string} code
 */
Player.prototype.handleInput = function (code) {
    // make sure the player is alive and not at a level up
    // selection
    var i = 0,
        move = {x: 0, y: 0};
    if (this.alive && !this.levelUp) {
        if (code === 'down') {
            move.y = 83;
        } else if (code === 'up') {
            move.y = -83;
        } else if (code === 'left') {
            move.x = -101;
        } else if (code === 'right') {
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
    } else if (this.alive && this.levelUp) {
        for (i; i < this.unlockedSprites && this.sprites.length; i += 1) {
            if (i === code) {
                this.sprite = this.sprites[i];
                this.levelUp = false;
            }
        }
    }
};

Player.prototype.updateCenter = function () {
    this.center.x = this.x + 50;
    this.center.y = this.y + 140;
};

/**
 * Game Item objects like gems, stars, keys
 * @param {object} item The game piece item (gem etc...)
 * @param {number} x
 * @param {number} y
 * @constructor
 */
var GameItem = function (item, x, y) {
    GamePiece.call(this, x, y);
    this.active = true;
    this.timeRemaining = item.timeRemaining;
    this.type = item.type;
    this.sprite = item.sprite;
    this.points = item.points;
    this.life = item.life;
    this.color = item.color;
    this.active = true;
    this.center = {"x": this.x + 50, "y": this.y + 133};
};

GameItem.prototype = Object.create(GamePiece.prototype);
GameItem.prototype.constructor = GameItem;

GameItem.prototype.render = function () {
    if (this.active) {
        ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    }
};

/**
 * Keeps game item time remaining and active status updated
 * @param {number} dt The last date/time difference
 */
GameItem.prototype.update = function (dt) {
    if (this.active) {
        this.timeRemaining -= dt;
        if (this.timeRemaining <= 0) {
            this.active = false;
        }
    }
};

/**
 * Holds game items
 * @constructor
 */
var Game = function () {
    player = new Player();
    allEnemies = [];
    this.nextLevel = function () {
        return Math.ceil(Math.pow(this.level, 2) / 0.19);
    };
    /** Used if game needs to be reset */
    this.init();
};
/**
 * Shows unlocked Sprites on the level up screen
 */
Game.prototype.renderAvailableSprites = function () {
    var i = 0;
    for (i; i < player.unlockedSprites && i < player.sprites.length; i += 1) {
        ctx.drawImage(Resources.get(player.sprites[i]), i * 101, 435);
        ctx.save();
        ctx.fillStyle = 'blue';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(i.toString(), i * 101 + 50, 495);
        ctx.restore();
    }
};

/**
 * random generation adapted from http://codetheory.in/
 * @param {object} items Gems, Keys, Starts, Hearts
 * @returns {Array}
 */
Game.prototype.generateWeightedList = function (items) {
    var weighted_list = [],
        i = 0,
        j = 0,
        multiples = 0;
    for (i = 0; i < items.length; i += 1) {
        multiples = items[i].weight * 1000;
        for (j = 0; j < multiples; j += 1) {
            weighted_list.push(i);
        }
    }
    return weighted_list;
};

Game.prototype.init = function () {
    var i = 0;
    // keep track of score by level and total game
    this.levelScore = 0;
    this.gameScore = 0;

    this.level = 1;

    // activate bonus level when something special happens (like catching a star);
    this.isBonusLevel = 0;

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
    for (i; i < this.playcols * this.playRows; i += 1) {
        this.itemsOnBoard.push(undefined);
    }

    // load enemies
    this.resetEnemies();

    // update any player data based on level
};

Game.prototype.resetEnemies = function () {
    var i = 0,
        maxEnemies = Math.floor(Math.sqrt(this.level)),
        enemy = {};
    // reset all enemies to empty array
    // needed for game resets to level 1
    allEnemies = [];
    // load up the enemies
    for (i; i < maxEnemies; i += 1) {
        enemy = new Enemy(this.level);
        allEnemies.push(enemy);
    }
};

Game.prototype.levelUp = function () {
    this.levelScore = 0;
    this.level += 1;
    this.resetEnemies();
    player.reset();
    player.levelUp = true;
};

Game.prototype.renderLevelUp = function () {
    ctx.save();
    ctx.fillStyle = 'blue';
    ctx.font = '60px bold Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Level ' + this.level, ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.fillStyle = 'magenta';
    ctx.font = '24px bold Arial';
    ctx.fillText('Choose Avitar number below', ctx.canvas.width / 2, ctx.canvas.height / 2 + 50);
    ctx.fillStyle = 'gold';
    ctx.fillText('Collect Keys to unlock more', ctx.canvas.width / 2, ctx.canvas.height / 2 + 100);
    ctx.restore();
};

//render any general game things like score animations and points
Game.prototype.render = function () {
    this.renderPointAnimations();
    this.renderScores();
    // check if player is alive
    if (!player.alive) {
        this.renderGameOver();
    }
    if (player.levelUp) {
        this.renderAvailableSprites();
        this.renderLevelUp();
    }

};

Game.prototype.update = function (dt) {
    // only do this stuff if the player is alive
    if (player.alive && !player.levelUp) {
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

        // if we are in a bonus level from the star, reduce timer
        if (this.isBonusLevel > 0) {
            this.isBonusLevel -= dt;
        }
    } else if (player.alive && player.levelUp) {
        this.updatePointAnimations(dt);
        this.removeExpiredItems();
    }
};

Game.prototype.renderGameOver = function () {
    ctx.save();
    ctx.fillStyle = 'red';
    ctx.font = '60px bold Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', ctx.canvas.width / 2, ctx.canvas.height / 2);
    ctx.fillStyle = 'magenta';
    ctx.font = '24px bold Arial';
    ctx.fillText('Press SPACE BAR to play again', ctx.canvas.width / 2, ctx.canvas.height / 2 + 50);
    ctx.restore();
};
/**
 * checks if item can spawn by creating
 * 10 by 10 bounding box and then some randomization
 * @param nItems
 */
Game.prototype.spawnItems = function (nItems) {
    var maxItems,
        col,
        row,
        item = {},
        canSpawn = true,
        shouldSpawn = true,
        rNum,
        randItem,
        index;

    if (this.isBonusLevel > 0) {
        maxItems = 14;
    } else if (this.level > 5) {
        maxItems = 5;
    } else {
        maxItems = this.level;
    }
    if (nItems < maxItems) {
        col = Math.floor(Math.random() * 5);
        row = Math.floor(Math.random() * 3);
        item = {
            "left": col * 101 + 40,
            "right": col * 101 + 60,
            "top": row * 83 + 50 + 123,
            "bottom": row * 83 + 50 + 143
        };
        if (this.itemsOnBoard[row * col + col] !== undefined || this.itemCollidesWithPlayer(item)) {
            canSpawn = false;
        }

        // based on your level, how frequently should items spawn
        // only check this if the item can spawn there
        if (canSpawn) {
            rNum = Math.floor(Math.random() * 1000);
            if (this.level > rNum || this.level < 15 || this.isBonusLevel > 0) {
                shouldSpawn = true;
            }
        }

        // if we can spawn, randomly pick an item type to spawn
        if (canSpawn && shouldSpawn) {
            randItem = Math.floor(Math.random() * 1000);
            index = this.weighted_list[randItem];
            this.itemsOnBoard[row * col + col] = new GameItem(this.gameItems[index], col * 101, row * 83 + 50);
        }
    }
};

/**
 * Removes expired game items from the active array of items
 *
 * @returns {nItems} the number of active items remaining
 */
Game.prototype.removeExpiredItems = function () {
    var nItems = 0,
        i;
    // clean up any dead items and put them back for later use
    for (i = this.itemsOnBoard.length - 1; i >= 0; i -= 1) {
        if (this.itemsOnBoard[i] !== undefined && this.itemsOnBoard[i].active === false) {
            delete this.itemsOnBoard[i];
        }
        if (this.itemsOnBoard[i] !== undefined && this.itemsOnBoard[i].active === true) {
            nItems += 1;
        }
    }
    return nItems;
};

Game.prototype.checkPlayerGetsItem = function () {
    var i,
        currentItem = {},
        item = {},
        animate = {},
        text;
    for (i = 0; i < this.itemsOnBoard.length; i += 1) {
        currentItem = this.itemsOnBoard[i];
        // if it is undefined, skip this iteration
        if (currentItem !== undefined) {
            // create a small bounding box for the item
            // then test if the player center is inside
            // that bounding box
            item = {
                "left": currentItem.center.x - 10,
                "right": currentItem.center.x + 10,
                "top": currentItem.center.y - 10,
                "bottom": currentItem.center.y + 10
            };
            if (this.itemCollidesWithPlayer(item)) {
                currentItem.active = false;
                this.gameScore += currentItem.points;
                this.levelScore += currentItem.points;
                if (player.life + currentItem.life < 100) {
                    player.life += currentItem.life;
                } else {
                    player.life = 100;
                }
                currentItem.timeRemaining = 0;

                if (currentItem.points > 0) {
                    animate = {"text": "+ " + currentItem.points, "color": 'green',
                        "x": currentItem.center.x + 20, "y": currentItem.center.y, "animateTime": 3, "Xdirection": 1};
                    this.pointAnimations.push(animate);
                }

                if (currentItem.life !== 0) {
                    text = "+ ";
                    if (currentItem.life < 0) {
                        text = "";
                    }
                    animate = {"text": text + currentItem.life, "color": 'red',
                        "x": currentItem.center.x - 20, "y": currentItem.center.y, "animateTime": 3, "Xdirection": -1};
                    this.pointAnimations.push(animate);
                }

                if (currentItem.type === "key") {
                    if (player.unlockedSprites < player.sprites.length) {
                        player.unlockedSprites += 1;
                        // lower odds of unlocking next sprite
                        for (i = 0; i < this.gameItems.length; i += 1) {
                            if (this.gameItems[i].type === "key") {
                                this.gameItems[i].weight -= 0.005;
                            } else if (this.gameItems[i].type === "orangeGem") {
                                this.gameItems[i].weight += 0.005;
                            }
                        }
                        this.weighted_list = this.generateWeightedList(this.gameItems);
                    }
                } else if (currentItem.type === "obstacle") {
                    player.reset();
                } else if (currentItem.type === "star") {
                    this.isBonusLevel = this.level;
                }
            }
        }

    }
};

Game.prototype.checkPlayerHitsEnemy = function () {
    var i,
        damage,
        item = {};
    for (i = 0; i < allEnemies.length; i += 1) {
        item = {
            "left": allEnemies[i].x + 10,
            "right": allEnemies[i].x + 90,
            "top": allEnemies[i].y + 110,
            "bottom": allEnemies[i].y + 130
        };
        if (this.itemCollidesWithPlayer(item)) {
            damage = this.level;
            player.life -= damage > 99 ? 99 : damage;
            player.reset();
        }
    }
};


Game.prototype.itemCollidesWithPlayer = function (item) {
    return item.left < player.center.x && item.right > player.center.x
        && item.top < player.center.y && item.bottom > player.center.y;
};

Game.prototype.playerIsStillAlive = function () {
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
Game.prototype.updatePointAnimations = function (dt) {
    var i;
    for (i = this.pointAnimations.length - 1; i >= 0; i -= 1) {
        if (this.pointAnimations[i].animateTime <= 0) {
            this.pointAnimations.splice(i, 1);
        } else {
            this.pointAnimations[i].x += (60 * this.pointAnimations[i].Xdirection) * dt;
            this.pointAnimations[i].y -= 60 * dt;
            this.pointAnimations[i].animateTime -= (5 * dt);
        }
    }
};

Game.prototype.renderPointAnimations = function () {
    var i;
    for (i = 0; i < this.pointAnimations.length; i += 1) {
        ctx.save();
        ctx.fillStyle = this.pointAnimations[i].color;
        ctx.font = 'normal bold 2em Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.pointAnimations[i].text, this.pointAnimations[i].x, this.pointAnimations[i].y);
        ctx.restore();
    }
};

Game.prototype.renderScores = function () {
    ctx.save();
    ctx.clearRect(0, 0, ctx.canvas.width, 50);
    ctx.font = '14px Arial';
    ctx.fillText("Life: ", 0, 15, 50);
    ctx.fillText("Level: ", 0, 30, 50);
    ctx.fillText("Next Level: ", 0, 45);
    ctx.fillText("Score: ", 300, 15, 50);
    ctx.fillStyle = 'blue';
    ctx.fillText(this.gameScore.toString(), 350, 15);
    ctx.fillText(player.life.toString(), 50, 15);
    ctx.fillText(this.level.toString(), 50, 30);
    ctx.fillStyle = 'green';
    ctx.lineWidth = 2;
    var levelProgress = (this.levelScore / this.nextLevel()) * 100;
    ctx.fillRect(75, 35, levelProgress, 12);
    ctx.strokeRect(75, 35, 100, 12);
    ctx.font = '10px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(this.levelScore + " / " + this.nextLevel().toString(), 125, 45);
    ctx.restore();
};

Game.prototype.resetToLevelOneGameItems = function () {
    return [
        {"type": "blueGem", "weight": 0.50, "sprite": "images/Gem Blue.png",
            "points": 5, "life": 0, "timeRemaining": 5, "color": "blue"},
        {"type": "greenGem", "weight": 0.15, "sprite": "images/Gem Green.png",
            "points": 10, "life": 1, "timeRemaining": 4, "color": "green"},
        {"type": "orangeGem", "weight": 0.1, "sprite": "images/Gem Orange.png",
            "points": 20, "life": 2, "timeRemaining": 3, "color": "orange"},
        {"type": "heart", "weight": 0.1, "sprite": "images/Heart.png",
            "points": 0, "life": 5, "timeRemaining": 4, "color": "red"},
        {"type": "key", "weight": 0.025, "sprite": "images/Key.png",
            "points": 0, "life": 0, "timeRemaining": 2, "color": "gold"},
        {"type": "obstacle", "weight": 0.1, "sprite": "images/Rock.png",
            "points": -5, "life": -5, "timeRemaining": 5, "color": "gray"},
        {"type": "star", "weight": 0.025, "sprite": "images/Star.png",
            "points": 25, "life": 10, "timeRemaining": 2, "color": "yellow"}
    ];
};

Game.prototype.handleInput = function (code) {
    if (!player.alive && code === 'SPACEBAR') {
        player.init();
        this.init();
    }
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

var startGame = function () {
    game = new Game();
};

Resources.onReady(startGame);


// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function (e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        48: 0,
        49: 1,
        50: 2,
        51: 3,
        52: 4,
        53: 5
    };

    player.handleInput(allowedKeys[e.keyCode]);
});

document.addEventListener('keydown', function (e) {
    var allowedKeys = {
        32: 'SPACEBAR'
    };
    game.handleInput(allowedKeys[e.keyCode]);
});
