/*
    Little JS Hello World Demo
    - Just prints 'Hello World!'
    - A good starting point for new projects
*/

'use strict';

// import LittleJS module
import * as LJS from './dist/littlejs.esm.js';
const {vec2, rgb, min, tile} = LJS;

const levelSize = vec2(38, 20); // size of play area

let ball; // keep track of ball object
let score = 0; // start score at 0
let paddle; // keep track of player's paddle

const sound_bounce = new LJS.Sound([,,1e3,,.03,.02,1,2,,,940,.03,,,,,.2,.6,,.06], 0);
const sound_break = new LJS.Sound([,,90,,.01,.03,4,,,,,,,9,50,.2,,.2,.01], 0);
const sound_start = new LJS.Sound([,0,500,,.04,.3,1,2,,,570,.02,.02,,,,.04]);

///////////////////////////////////////////////////////////////////////////////
class Paddle extends LJS.EngineObject
{
    update()
    {
        this.pos.x = LJS.mousePos.x; // move paddle to mouse
        // clamp paddle to level size
        this.pos.x = LJS.clamp(this.pos.x, this.size.x/2, levelSize.x - this.size.x/2);
    }
    constructor()
    {
        super(vec2(0,1), vec2(6,.5)); // set object position and size
        this.setCollision(); // make object collide
        this.mass = 0; // make object have static physics
    }    
}
class Ball extends LJS.EngineObject 
{
    constructor(pos)
    {
        // super(pos); // set object position
        super(pos, vec2(.5), tile(0)); // set object position and size

        this.velocity = vec2(-.1, -.1); // give ball some movement
        this.setCollision(); // make object collide
        this.restitution = 1; // make object bouncy
    }

    collideWithObject(o)              
    {
        // speed up the ball
        const speed = min(1.04*this.velocity.length(), .5);
        this.velocity = this.velocity.normalize(speed);

        // prevent colliding with paddle if moving upwards
        if (o == paddle && this.velocity.y > 0)
            return false;

        // sound_bounce.play(); // play bounce sound
        sound_bounce.play(this.pos, 1, speed); // play bounce sound with pitch scaled by speed

        if (o == paddle)
        {
            // control bounce angle when ball collides with paddle
            const deltaX = o.pos.x - this.pos.x;
            this.velocity = this.velocity.rotate(.3 * deltaX);
            
            // make sure ball is moving upwards with a minimum speed
            this.velocity.y = LJS.max(-this.velocity.y, .2);
            
            // prevent default collision code
            return false;
        }

        return true; // allow object to collide
    }
    
}
class Wall extends LJS.EngineObject
{
    constructor(pos, size)
    {
        super(pos, size); // set object position and size

        this.setCollision(); // make object collide
        this.mass = 0; // make object have static physics
        this.color = rgb(0,0,0,0); // make object invisible
    }
}
class Brick extends LJS.EngineObject
{
    constructor(pos, size)
    {
        super(pos, size);

        this.setCollision(); // make object collide
        this.mass = 0; // make object have static physics
    }
    collideWithObject(o)              
    {
        this.destroy(); // destroy block when hit
        sound_break.play(this.pos); // play brick break sound
    // create explosion effect
    const color = this.color;
    new LJS.ParticleEmitter(
        this.pos, 0,             // pos, angle
        this.size, .1, 200, 3.14,// emitSize, emitTime, rate, cone
        undefined,               // tileInfo
        color, color,                       // colorStartA, colorStartB
        color.scale(1,0), color.scale(1,0), // colorEndA, colorEndB
        .2, .5, 1, .1, .1,  // time, sizeStart, sizeEnd, speed, angleSpeed
        .99, .95, .4, 3.14, // damp, angleDamp, gravity, cone
        .1, .5, false, true // fade, randomness, collide, additive
);  
      ++score; // award a point for each brick broke
        return true; // allow object to collide
    }
}

///////////////////////////////////////////////////////////////////////////////
function gameInit()
{
    // called once after the engine starts up
    // setup the game
    // create bricks
    
    for (let x=2;  x<=levelSize.x-2; x+=2)
    for (let y=12; y<=levelSize.y-2; y+=1)
    {
        const brick = new Brick(vec2(x,y), vec2(2,1)); // create a brick
        brick.color = LJS.randColor(); // give brick a random color
    }
    LJS.setCameraPos(levelSize.scale(.5)); // center camera in level
    LJS.setCanvasFixedSize(vec2(1280, 720)); // use a 720p fixed size canvas

    paddle = new Paddle; // create player's paddle

    // create a ball
    // ball = new Ball(LJS.cameraPos);

    // create walls
    new Wall(vec2(-.5,levelSize.y/2),            vec2(1,100)) // left
    new Wall(vec2(levelSize.x+.5,levelSize.y/2), vec2(1,100)) // right
    new Wall(vec2(levelSize.x/2,levelSize.y+.5), vec2(100,1)) // top
    

}

///////////////////////////////////////////////////////////////////////////////
function gameUpdate()
{
    // called every frame at 60 frames per second
    // handle input and update the game state
    // if there is no ball or ball is below level
    if (ball && ball.pos.y < -1) // if ball is below level
    {
        // destroy old ball
        ball.destroy();
        score -= 5; // penalize player 5 points
        ball = 0;
    }
    if (!ball && LJS.mouseWasPressed(0)) // if there is no ball and left mouse is pressed
    {
        sound_start.play(); // play start sound
        ball = new Ball(LJS.cameraPos); // create the ball
        
    }
}

///////////////////////////////////////////////////////////////////////////////
function gameUpdatePost()
{
    // called after physics and objects are updated
    // setup camera and prepare for render
}

///////////////////////////////////////////////////////////////////////////////
function gameRender()
{
    // called before objects are rendered
    // draw any background effects that appear behind objects
    LJS.drawRect(LJS.cameraPos, vec2(100), rgb(.5,.5,.5)); // draw background
    LJS.drawRect(LJS.cameraPos, levelSize, rgb(.1,.1,.1)); // draw level boundary   
}

///////////////////////////////////////////////////////////////////////////////
function gameRenderPost()
{
    // called after objects are rendered
    // draw effects or hud that appear above all objects
    // LJS.drawTextScreen('Hello World!', LJS.mainCanvasSize.scale(.5), 80);
    LJS.drawTextScreen('Score ' + score, vec2(LJS.mainCanvasSize.x/2, 70), 50); // show score
}

///////////////////////////////////////////////////////////////////////////////
// Startup LittleJS Engine
LJS.engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost, ['tiles.png']);

