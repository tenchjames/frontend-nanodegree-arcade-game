// Enemies our player must avoid
var Enemy = function() {
    // Variables applied to each of our instances go here,
    // we've provided one for you to get started

    // The image/sprite for our enemies, this uses
    // a helper we've provided to easily load images
    this.sprite = 'images/enemy-bug.png';
    this.x = -200;
    this.y = (Math.floor(Math.random()*3))*83 + 63;
    this.velocity = Math.random()*100+100;
}

Enemy.prototype = {
    update: function(dt) {
        // You should multiply any movement by the dt parameter
        // which will ensure the game runs at the same speed for
        // all computers.
        this.x = this.x+this.velocity * dt;
        if (this.x > ctx.canvas.width) {
            this.x = -200;
        }
    }
}

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
}

// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function () {
    this.sprite = 'images/char-boy.png';
    console.log(this.sprite);
    this.x = ctx.canvas.width / 2 - 50;
    this.y = ctx.canvas.height + -211;

}

// Player: can we rewrite some of this into common code?
Player.prototype = {
    update: function() {

    },

    render: function() {
        ctx.drawImage(Resources.get(this.sprite),this.x,this.y);
    },

    handleInput: function(code) {
        if (code === 'down') {
            this.y += 83;
        }
        if (code === 'up') {
            this.y -= 83;
        }
        if (code === 'left') {
            this.x -= 83;
        }
        if (code === 'right') {
            this.x += 83;
        }

    }
}


// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

var allEnemies = [];

var createPlayer = function() {
    player = new Player();
}

for (var i = 0; i < 5; i += 1) {
    var enemy = new Enemy();
    allEnemies.push(enemy)
}

var startGame = function() {

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
