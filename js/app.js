/* globals */
var game = {},
    allEnemies = [],
    player = {};

/**
 * Common game piece attributes
 * @param {number} x The x coordinate
 * @param {number} y The y coordinate
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
 * Updates x, y coordinate of any GamePiece object
 * @param {number} x The x coordinate
 * @param {number} y The y coordinate
 */
GamePiece.prototype.updateCoordinates = function (x, y) {
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

/**
 * Keeps the enemy player coordinates up to date
 * @param {number} dt date/time difference since last frame
 * dt keeps the movement speed the same for all computers
 */
Enemy.prototype.update = function (dt) {
    this.x = this.x + this.velocity * dt;
    /** re-spawn enemy at random location after exits screen */
    if (this.x > ctx.canvas.width) {
        var coords = this.createCoords(this.level);
        this.x = coords.x;
        this.y = coords.y;
    }
};
/**
 * Displays the enemy sprite image at its' given x, y
 */
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

/**
 * Keep the Center point of player updated
 */
Player.prototype.update = function () {
    this.updateCenter();
};

/**
 * Draw the currently selected player sprite at x, y
 */
Player.prototype.render = function () {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

/**
 * initialize attributes for a new player
 */
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
    this.updateCoordinates(x, y);
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
 * @param {string} code The string representation of the key
 * that was pressed
 */
Player.prototype.handleInput = function (code) {
    var i = 0,
        move = {x: 0, y: 0},
        spritesLength;
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
        spritesLength = this.sprites.length;
        for (i; i < this.unlockedSprites && spritesLength; i += 1) {
            if (i === code) {
                this.sprite = this.sprites[i];
                this.levelUp = false;
            }
        }
    }
};

/**
 * Keeps the center of the player updated
 * Center is used with collision detection
 */
Player.prototype.updateCenter = function () {
    this.center.x = this.x + 50;
    this.center.y = this.y + 140;
};

/**
 * Game Item objects like gems, stars, keys
 * @param {object} item The game piece item (gem etc...)
 * @param {number} x The x coordinate
 * @param {number} y The y coordinate
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

/**
 * Draw the Gem, Key, Star, or Heart to the screen
 * if it is active
 */
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
 * random generation adapted from http://codetheory.in/
 * @param {object} items Gems, Keys, Starts, Hearts
 * @returns {Array}
 */
Game.prototype.generateWeightedList = function (items) {
    var weighted_list = [],
        i,
        j = 0,
        multiples = 0,
        itemsLength = items.length;
    for (i = 0; i < itemsLength; i += 1) {
        multiples = items[i].weight * 1000;
        for (j = 0; j < multiples; j += 1) {
            weighted_list.push(i);
        }
    }
    return weighted_list;
};
/**
 * Sets up a brand new game at level one
 */
Game.prototype.init = function () {
    var i = 0;
    // keep track of score by level and total game
    this.levelScore = 0;
    this.gameScore = 0;

    this.level = 1;

    /** bonus level timer set when star is grabbed */
    this.isBonusLevel = 0;

    /** default game items */
    this.gameItems = this.resetToLevelOneGameItems();

    /** an array of game items used in random selection */
    this.weighted_list = this.generateWeightedList(this.gameItems);

    this.itemsOnBoard = [];

    /** Array, so multiple text animations can happen */
    this.pointAnimations = [];

    /** set to board size rows and columns */
    this.playcols = 5;
    this.playRows = 3;

    /** undefined items will be assumed to be open spots to spawn new */
    for (i; i < this.playcols * this.playRows; i += 1) {
        this.itemsOnBoard.push(undefined);
    }

    this.resetEnemies();

    this.spriteAnimations = [];
};
/**
 * Called at each level to generate a random number
 * of enemies based on level. Slowly increases
 */
Game.prototype.resetEnemies = function () {
    var i = 0,
        maxEnemies = Math.floor(Math.sqrt(this.level)),
        enemy = {};
    allEnemies = [];
    // load up the enemies
    for (i; i < maxEnemies; i += 1) {
        enemy = new Enemy(this.level);
        allEnemies.push(enemy);
    }
};

/**
 * If player hits next point level threshold
 * the game level is increased and new enemies
 * are spawned. Player is also reset to start
 */
Game.prototype.levelUp = function () {
    this.levelScore = 0;
    this.level += 1;
    this.resetEnemies();
    player.reset();
    player.levelUp = true;
};

/**
 * Animation when player reaches new level
 */
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

/**
 * Shows unlocked Sprites on the level up screen
 */
Game.prototype.renderAvailableSprites = function () {
    var i = 0,
        spritesLength = player.sprites.length;
    for (i; i < player.unlockedSprites && i < spritesLength; i += 1) {
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
 * Animates Game over screen when player is dead
 */
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

Game.prototype.renderGameItems = function () {
    this.itemsOnBoard.forEach(function(item) {
        if (item !== undefined) {
            item.render();
        }
    });
};

/**
 * Main render method that conditionally calls
 * other render methods based on events and game
 * and player state
 */
Game.prototype.render = function () {
    this.renderPointAnimations();
    this.renderScores();
    this.renderSpriteAnimations();
    // check if player is alive
    if (!player.alive) {
        this.renderGameOver();
    }
    if (player.levelUp) {
        this.renderAvailableSprites();
        this.renderLevelUp();
    }
};

/**
 * Keeps game items in sync and up to date
 * Different updates happen based on player status
 * @param {number} dt date/time frame difference
 */
Game.prototype.update = function (dt) {
    if (player.alive && !player.levelUp) {
        var nItemsRemaining = this.removeExpiredItems();
        this.checkPlayerGetsItem();
        this.updatePointAnimations(dt);
        this.updateSpriteAnimations(dt);
        this.spawnItems(nItemsRemaining);
        this.checkPlayerHitsEnemy();

        if (this.levelScore >= this.nextLevel()) {
            this.levelUp();
        }

        /** countdown bonus level timer */
        if (this.isBonusLevel > 0) {
            this.isBonusLevel -= dt;
        }
    } else if (player.alive && player.levelUp) {
        this.updatePointAnimations(dt);
        this.removeExpiredItems();
    }
};

/**
 * checks if item can spawn by creating
 * 10 by 10 bounding box and then some randomization
 * @param {number} nItems The number open spots
 * where an item can spawn on the board
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

        /** some randomization to how often items spawn, change this
         * formula to impact the spawn speed for items
         */
        if (canSpawn) {
            rNum = Math.floor(Math.random() * 1000);
            if (this.level > rNum || this.level < 15 || this.isBonusLevel > 0) {
                shouldSpawn = true;
            }
        }

        /**
         * this is where the weighted list is used, be sure to
         * multiply by number of items in weighted list array
         */
        if (canSpawn && shouldSpawn) {
            randItem = Math.floor(Math.random() * this.weighted_list.length);
            index = this.weighted_list[randItem];
            this.itemsOnBoard[row * col + col] = new GameItem(this.gameItems[index], col * 101, row * 83 + 50);
        }
    }
};

/**
 * Removes expired game items from the active array of items
 * @returns {number} the number of active items remaining
 */
Game.prototype.removeExpiredItems = function () {
    var nItems = 0,
        i,
        itemsOnBoardLength = this.itemsOnBoard.length;
    // clean up any dead items and put them back for later use
    for (i = itemsOnBoardLength - 1; i >= 0; i -= 1) {
        if (this.itemsOnBoard[i] !== undefined && this.itemsOnBoard[i].active === false) {
            delete this.itemsOnBoard[i];
        }
        if (this.itemsOnBoard[i] !== undefined && this.itemsOnBoard[i].active === true) {
            nItems += 1;
        }
    }
    return nItems;
};

/**
 * Check if the player collides with a game item
 * Not enemy collision
 */
Game.prototype.checkPlayerGetsItem = function () {
    var i,
        currentItem = {},
        item = {},
        animate = {},
        text,
        itemsOnBoardLength = this.itemsOnBoard.length,
        gameItemsLength;
    for (i = 0; i < itemsOnBoardLength; i += 1) {
        currentItem = this.itemsOnBoard[i];
        if (currentItem !== undefined) {
            /**
             * create a small bounding box for the item
             * then test if the player center is inside
             * that bounding box
             */
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
                        /** lower the odds of generating the next key */
                        gameItemsLength = this.gameItems.length;
                        for (i = 0; i < gameItemsLength; i += 1) {
                            if (this.gameItems[i].type === "key") {
                                this.gameItems[i].weight -= 0.005;
                            } else if (this.gameItems[i].type === "orangeGem") {
                                this.gameItems[i].weight += 0.005;
                            }
                        }
                        this.weighted_list = this.generateWeightedList(this.gameItems);
                        this.spriteAnimations.push({
                            "spriteNumber": player.unlockedSprites - 1,
                            "x": player.center.x,
                            "y": player.center.y
                        });
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

/**
 * Checks player to enemy collision
 * Uses the same bounding box method as game items
 * but enemy bounding box is bigger
 */
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

/**
 * Check if enemy or other item hit the player
 * @param {object} item The Enemy or GameItem
 * @returns {boolean}
 */
Game.prototype.itemCollidesWithPlayer = function (item) {
    return item.left < player.center.x && item.right > player.center.x
        && item.top < player.center.y && item.bottom > player.center.y;
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

/**
 * loops over any pending text animations and renders
 */
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

/**
 * Updates sprite location until it reaches end point
 * @param {number} dt The last date time for prior frame difference
 */
Game.prototype.updateSpriteAnimations = function (dt) {
    var i = this.spriteAnimations.length - 1,
        moveToX,
        moveToY = 435;

    for (i; i >= 0; i -= 1) {
        moveToX = this.spriteAnimations[i].spriteNumber * 101;
        if (this.spriteAnimations[i].x < moveToX) {
            this.spriteAnimations[i].x += dt * Math.floor(moveToY - this.spriteAnimations[i].y);
        } else {
            this.spriteAnimations[i].x -= dt * Math.floor(moveToY - this.spriteAnimations[i].y);
        }
        this.spriteAnimations[i].y += dt * 30;
        if (this.spriteAnimations[i].y > moveToY) {
            this.spriteAnimations.splice(i, 1);
        }
    }
};

/**
 * Animates sprites when they are unlocked by a key
 */
Game.prototype.renderSpriteAnimations = function () {
    var i = this.spriteAnimations.length - 1;

    for (i; i >= 0; i -= 1) {
        ctx.drawImage(Resources.get(player.sprites[this.spriteAnimations[i].spriteNumber]), this.spriteAnimations[i].x, this.spriteAnimations[i].y);
    }
};

/**
 * Displays the points, life, and level info at top of game
 */
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
    if (levelProgress < 0) {
        levelProgress = 0;
    }
    ctx.fillRect(75, 35, levelProgress, 12);
    ctx.strokeRect(75, 35, 100, 12);
    ctx.font = '10px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.fillText(this.levelScore + " / " + this.nextLevel().toString(), 125, 45);
    ctx.restore();
};

/**
 * Resets game item info to default values
 * @returns {{Array}}
 */
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
