// Common character attributes
var Character = function(x,y) {
    this.width = 101;
    this.height = 171;
    this.visible = false;
    // default to off screen
    this.coords = { x:-101, y:-171 };
}

Character.prototype = {
    updateCoords: function(x, y) {
        this.coords.x = x;
        this.coords.y = y;
    }
}

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
Enemy.prototype = {
    update: function(dt) {
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
    },
    // Draw the enemy on the screen, required method for game
    render: function () {
        ctx.drawImage(Resources.get(this.sprite), this.coords.x, this.coords.y);
    },
    spawn: function(level) {
        // Spawn off screen so can have smooth transition on to the screen
        // spawn a random amount off screen based on the level
        this.level = level;
        this.coords = this.createCoords(level);
        this.velocity = Math.random()*level + level;
    },
    createCoords: function(level) {
        var coords = {}
        coords.x = (((Math.random()+1)*level) * -1) - this.width;
        coords.y = (Math.floor(Math.random()*3))*83 + 63;
        return coords;
    }
}


// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.
var Player = function () {
    Character.call(this,0,0);
    this.sprite = 'images/char-boy.png';
}

Player.prototype = Object.create(Character.prototype);
Player.prototype.constructor = Player;
Player.prototype = {
    update: function() {

    },

    render: function() {
        ctx.drawImage(Resources.get(this.sprite),this.coords.x,this.coords.y);
    },

    handleInput: function(code) {
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
    },
    spawn: function() {
        // Spawn off screen so can have smooth transition on to the screen
        // spawn a random amount off screen based on the level
        this.coords.x = ctx.canvas.width / 2 - this.width / 2 ;
        this.coords.y = ctx.canvas.height - this.height - 60;
    }
}


// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

var allEnemies = [];

var createPlayer = function() {
    player = new Player();
    player.spawn();
}

for (var i = 0; i < 4; i += 1) {
    var enemy = new Enemy();
    enemy.spawn(100);
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


function windowToCanvas(canvas, x, y) {
    var bbox = canvas.getBoundingClientRect();
    return { x: x - bbox.left * (canvas.width  / bbox.width),
        y: y - bbox.top  * (canvas.height / bbox.height)
    };
}

document.addEventListener('mousemove', function(e) {
    e.preventDefault();
    var coords = document.getElementById('coords');
    var loc = windowToCanvas(ctx.canvas, e.x, e.y);
    var text = "";
    text += "x: ";
    text += loc.x.toFixed(0);
    text += ", y: ";
    text += loc.y.toFixed(0);
    coords.innerHTML = text;
})
