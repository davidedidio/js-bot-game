

var canvas = document.getElementById("game_canvas");
var ctx = canvas.getContext("2d");
var ctxHeight=800, ctxWidth=1200
ctx.setTransform(900, 0,0, 900, 0, 0)
ctx.lineWidth = 0.005

ALLOWED_ACTIONS = ["forward", "rotate", "fire"];
PROJECTILE_LIFE = 100
PROJECTILE_SPEED = 0.01
PLAYER_SPEED = 0.005
FIRE_COOLDOWN = 20

var level1 = {
 walls: [{x0: 0.25, y0:0.5, x1:0.75, y1: 0.5}],
 redTeam: [
    {x: 0.20, y: 0.20, cooldown:FIRE_COOLDOWN, alpha: 0, projectiles: []},
    {x: 0.50, y: 0.20, cooldown:FIRE_COOLDOWN, alpha: 0, projectiles: []},
    {x: 0.80, y: 0.20, cooldown:FIRE_COOLDOWN, alpha: 0, projectiles: []}],
 blueTeam: [
    {x: 0.20, y: 0.80, cooldown:FIRE_COOLDOWN, alpha: Math.PI, projectiles: []},
    {x: 0.50, y: 0.80, cooldown:FIRE_COOLDOWN, alpha: Math.PI, projectiles: []},
    {x: 0.80, y: 0.80, cooldown:FIRE_COOLDOWN, alpha: Math.PI, projectiles: []}],
}

function drawWalls(walls){
    for (var i in walls){
        w = walls[i]
        ctx.beginPath();
        ctx.moveTo(w.x0, w.y0);
        ctx.lineTo(w.x1, w.y1);
        ctx.stroke();
    }
}


function drawPlayers(team, color){
    for (var i in team){
        o = team[i]
        ctx.translate(o.x, o.y);
        ctx.rotate(o.alpha)
        ctx.beginPath();
        ctx.arc(0, 0, 0.02, 0, 2 * Math.PI);
        ctx.moveTo(-0.01, 0)
        ctx.lineTo(0, 0.01)
        ctx.lineTo(0.01, 0)
        ctx.fillStyle=color;
        ctx.fill();
        ctx.stroke();
        ctx.setTransform(900, 0,0, 900, 0, 0)

        drawProjectiles(o.projectiles)
    }
}

function drawProjectiles(projectiles){
    for (var i in projectiles){
        o = projectiles[i]
        ctx.translate(o.x, o.y);
        ctx.beginPath();
        ctx.arc(0, 0, 0.005, 0, 2 * Math.PI);
        ctx.fillStyle="gray";
        ctx.fill();
        ctx.stroke();
        ctx.setTransform(900, 0,0, 900, 0, 0)
    }
}

function drawLevel(level){
    drawWalls(level.walls)
    drawPlayers(level.redTeam, "red")
    drawPlayers(level.blueTeam, "blue")
}

function isActionValid(action, player){
    if(!ALLOWED_ACTIONS.includes(action["action"])){
        return false;
    }
    if(action["action"] == "rotate"){
        return action["angle"] != undefined && action["angle"] >= -2.0*Math.PI && action["angle"] <= 2.0*Math.PI
    }
    if(action["action"] == "fire"){
        return player.cooldown <= 0;
    }

    return true;
}

function executeAction(action, player){
    switch(action["action"]){
        case "forward":
            dx = -Math.sin(player.alpha)
            dy = Math.cos(player.alpha)
            player.x += dx * PLAYER_SPEED
            player.y += dy * PLAYER_SPEED
            break;
        case "rotate":
            player.alpha += action.angle
            break;
        case "fire":
            player.projectiles.push({
                life: PROJECTILE_LIFE,
                x: player.x,
                y: player.y,
                xDir: -Math.sin(player.alpha) * PROJECTILE_SPEED,
                yDir: Math.cos(player.alpha) * PROJECTILE_SPEED
            })
            player.cooldown = FIRE_COOLDOWN
            break;

    }
}

function movePlayers(team, colorLogic){
    for (var i in team){
        var player = team[i]
        var action = colorLogic(player)
        if(!isActionValid(action, player)){
            console.log("Action not valid: " + action);
        }else{
            executeAction(action, player)
        }
        moveProjectiles(player.projectiles)

        if(player.cooldown >= 0){
            player.cooldown -= 1
        }
    }
}

function moveProjectiles(projectiles){
    for (var i = projectiles.length - 1;  i >= 0; --i){
        p = projectiles[i];
        p.life -= 1;
        p.x += p.xDir;
        p.y += p.yDir;
    }
}

function randomInteger(from, to){
    return Math.floor(Math.random() * (to - from) ) + from;
}

function redTeamLogic(level){
    tst = [{action:"rotate", angle:0.1*(Math.random() - 0.5)}, {action:"forward"}, {action: "fire"}]
    return tst[randomInteger(0, 3)]
}

function blueTeamLogic(){
    return {action:"fire"}
}

function gameLoop(level){
    ctx.clearRect(0, 0, 1, 1);
    movePlayers(level.redTeam, redTeamLogic)
    movePlayers(level.blueTeam, blueTeamLogic)
    drawLevel(level);
}

setInterval(function () {gameLoop(level1)}, 30);
