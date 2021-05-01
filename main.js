var canvas = document.getElementById("game_canvas");
var ctx = canvas.getContext("2d");
var ctxHeight=900, ctxWidth=900
ctx.setTransform(ctxHeight, 0,0, ctxWidth, 0, 0)
ctx.lineWidth = 0.005

ALLOWED_ACTIONS = ["forward", "rotate", "fire"];
PROJECTILE_LIFE = 100;
PROJECTILE_SPEED = 0.01;
PROJECTILE_RADIUS = 0.005;
PLAYER_SPEED = 0.005;
PLAYER_RADIUS = 0.03;
FIRE_COOLDOWN = 20;

var level1 = {
 walls: [{x: 0.25, y:0.5, w:0.5, h: 0.01, alpha: 0}],
 redTeam: [
    {x: 0.20, y: 0.20, cooldown:FIRE_COOLDOWN, alpha: 0, projectiles: [], alive: true},
    {x: 0.50, y: 0.20, cooldown:FIRE_COOLDOWN, alpha: 0, projectiles: [], alive: true},
    {x: 0.80, y: 0.20, cooldown:FIRE_COOLDOWN, alpha: 0, projectiles: [], alive: true}],
 blueTeam: [
    {x: 0.20, y: 0.80, cooldown:FIRE_COOLDOWN, alpha: Math.PI, projectiles: [], alive: true},
    {x: 0.50, y: 0.80, cooldown:FIRE_COOLDOWN, alpha: Math.PI, projectiles: [], alive: true},
    {x: 0.80, y: 0.80, cooldown:FIRE_COOLDOWN, alpha: Math.PI, projectiles: [], alive: true}],
}

function drawWalls(walls){
    for (var i in walls){
        w = walls[i]
        ctx.translate(w.x, w.y);
        ctx.rotate(w.alpha)
        ctx.beginPath();
        ctx.rect(0, 0, w.w, w.h);
        ctx.stroke();
        ctx.fill();
        ctx.setTransform(ctxHeight, 0,0, ctxWidth, 0, 0)
    }
}


function drawPlayers(team, color){
    for (var i in team){
        o = team[i]
        ctx.translate(o.x, o.y);
        ctx.rotate(o.alpha)
        ctx.beginPath();
        ctx.arc(0, 0, PLAYER_RADIUS, 0, 2 * Math.PI);
        ctx.moveTo(-0.01, 0)
        ctx.lineTo(0, 0.01)
        ctx.lineTo(0.01, 0)
        if (!o.alive){
            ctx.fillStyle="gray";
        }else{
            ctx.fillStyle=color;
        }
        ctx.fill();
        ctx.stroke();
        ctx.setTransform(ctxHeight, 0,0, ctxWidth, 0, 0)

        drawProjectiles(o.projectiles)
    }
}

function drawProjectiles(projectiles){
    for (var i in projectiles){
        o = projectiles[i]
        ctx.translate(o.x, o.y);
        ctx.beginPath();
        ctx.arc(0, 0, PROJECTILE_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle="gray";
        ctx.fill();
        ctx.stroke();
        ctx.setTransform(ctxHeight, 0,0, ctxWidth, 0, 0)
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

    if(!player.alive){
        return false
    }

    if(action["action"] == "rotate"){
        return action["angle"] != undefined && action["angle"] >= -2.0*Math.PI && action["angle"] <= 2.0*Math.PI
    }
    if(action["action"] == "fire"){
        return player.cooldown <= 0;
    }

    return true;
}

function executeAction(action, player, level){
    switch(action["action"]){
        case "forward":
            dx = -Math.sin(player.alpha)
            dy = Math.cos(player.alpha)
            player.x += dx * PLAYER_SPEED
            player.y += dy * PLAYER_SPEED

            var hasCollision = false;
            for (i in level.walls){
                wall = level.walls[i]
                if(hasCircleToRectangleCollision(player.x, player.y, PLAYER_RADIUS, wall.x, wall.y, wall.w, wall.h, wall.alpha)){
                    hasCollision = true;
                }
            }
            for (i in level.redTeam){
                op = level.redTeam[i]
                if(player !== op){
                    if(hasCircleToCircleCollision(player.x, player.y, PLAYER_RADIUS, op.x, op.y, PLAYER_RADIUS)){
                        hasCollision = true;
                    }
                }
            }
            for (i in level.blueTeam){
                op = level.blueTeam[i]
                if(player !== op){
                    if(hasCircleToCircleCollision(player.x, player.y, PLAYER_RADIUS, op.x, op.y, PLAYER_RADIUS)){
                        hasCollision = true;
                    }
                }
            }

            if(hasCollision){
                // TODO this should be an interpolation that snaps just before the collision point.
                player.x -= dx * PLAYER_SPEED
                player.y -= dy * PLAYER_SPEED
            }

            if (player.x + PLAYER_RADIUS > 1.0){
                player.x = 1.0 - PLAYER_RADIUS;
            }else if (player.x - + PLAYER_RADIUS < 0.0){
                player.x = PLAYER_RADIUS;
            }
            if (player.y + PLAYER_RADIUS > 1.0){
                player.y = 1.0 - PLAYER_RADIUS;
            }else if (player.y - PLAYER_RADIUS < 0.0){
                player.y = PLAYER_RADIUS;
            }
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

function hasCircleToRectangleCollision(cx, cy, cr, rx, ry, rw, rh, rAngle){
    // TODO first match the coordinate system of the rectangle with the rotation (rAngle)

    return cx - cr < rx + rw &&
        cx + cr > rx &&
        cy - cr < ry + rh &&
        cy + cr > ry;
}

function hasCircleToCircleCollision(c1x, c1y, c1r, c2x, c2y, c2r){
    var x2mx1 = c2x - c1x;
    var y2my1 = c2y - c1y;
    var r1pr2 = c1r + c2r;
    return x2mx1 * x2mx1 + y2my1 * y2my1 <= r1pr2 * r1pr2;
}

function movePlayers(team, colorLogic, level){
    for (var i in team){
        var player = team[i]
        var action = colorLogic(player)
        if(!isActionValid(action, player)){
            console.log("Action not valid: " + action);
        }else{
            executeAction(action, player, level)
        }

        moveProjectiles(player, level.walls)

        if(player.cooldown >= 0){
            player.cooldown -= 1;
        }
    }
}

function moveProjectiles(player, walls){
    for (i in player.projectiles){
        p = player.projectiles[i];
        p.life -= 1;
        p.x += p.xDir;
        p.y += p.yDir;

        var hasCollision = false;
        for (i in walls){
            wall = walls[i]
            if(hasCircleToRectangleCollision(p.x, p.y, PROJECTILE_RADIUS, wall.x, wall.y, wall.w, wall.h, wall.alpha)){
                hasCollision = true;
            }
        }

        if(hasCollision){
            p.life = 0;
        }
    }

    player.projectiles = player.projectiles.filter((p, index, arr) => {
            return p.life > 0;
    });

}

function checkHitTeam(firingTeam, hitTeam){
    for(i in firingTeam){
        var player = firingTeam[i];
        for(j in player.projectiles){
            var proj = player.projectiles[j]
            for(k in hitTeam){
                var hitPlayer = hitTeam[k]
                if(hasCircleToCircleCollision(hitPlayer.x, hitPlayer.y, PLAYER_RADIUS, proj.x, proj.y, PROJECTILE_RADIUS)){
                    hitPlayer.alive = false;
                    proj.life = 0;
                }
            }
        }
    }
}

function checkProjectileHit(level){
    checkHitTeam(level.redTeam, level.blueTeam);
    checkHitTeam(level.blueTeam, level.redTeam);

    //level.redTeam = level.redTeam.filter((p, index, arr) => {return p.alive});
    //level.blueTeam = level.blueTeam.filter((p, index, arr) => {return p.alive});

    for (i in level.redTeam){
        var p = level.redTeam[i]
        p.projectiles = p.projectiles.filter((p, index, arr) => {return p.life > 0;});
    }
    for (i in level.blueTeam){
        var p = level.blueTeam[i]
        p.projectiles = p.projectiles.filter((p, index, arr) => {return p.life > 0;});
    }

}

function randomInteger(from, to){
    return Math.floor(Math.random() * (to - from) ) + from;
}

function redTeamLogic(level){
    tst = [{action:"rotate", angle:0.4*(Math.random() - 0.5)}, {action:"forward"}, {action: "fire"}]
    return tst[randomInteger(0, 3)]
}

function blueTeamLogic(){
    tst = [{action:"rotate", angle:0.4*(Math.random() - 0.5)}, {action:"forward"}, {action: "fire"}]
    return tst[randomInteger(0, 3)]
}

function gameLoop(level){
    ctx.clearRect(0, 0, 1, 1);
    movePlayers(level.redTeam, redTeamLogic, level)
    movePlayers(level.blueTeam, blueTeamLogic, level)
    checkProjectileHit(level)
    drawLevel(level);
}

setInterval(function () {gameLoop(level1)}, 30);
