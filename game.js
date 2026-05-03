const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#f4d1a0', 
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);
let player, shrimps, shells, enemies, bloodEmitter, obstacles; 
let score = 0, moltCount = 0, health = 3;
let scoreText, moltText, healthText, timerText, gameStarted = false; 
let moveDirection = { dx: 0, dy: 0, active: 0 };
let startTime, lastEnemyTime = 0; 

const sw = window.innerWidth;
const sh = window.innerHeight;
const baseWidth = sw / 15; 
const aspectRatio = 85 / 60;
const baseHeight = baseWidth * aspectRatio;
const moveSpeed = 250;  
const baseGrowth = 1.0;    
const moltGrowth = 1.08;   
const baseStoneSize = 100; 

function preload() {
    this.load.image('hou', 'hou.png'); 
    this.load.image('shrimp', 'shrimp.png');
    this.load.image('bg', 'bg.jpg'); 
    this.load.image('enemy', 'enemy.png');
    this.load.image('stone','stone.png'); 
    this.load.image('blue_dot', 'hou.png'); 
}

function create() {
    const sw = window.innerWidth, sh = window.innerHeight;
    this.add.image(sw/2, sh/2, 'bg').setDisplaySize(sw, sh).setDepth(0);

    shells = this.add.group();   
    enemies = this.physics.add.group(); 

    player = this.physics.add.sprite(sw/2, sh/2, 'hou').setDepth(5).setDisplaySize(baseWidth, baseHeight);
    
    // --- 【后门逻辑：加入伪造时间与自定义输入框】 ---
    player.setInteractive();
    player.on('pointerdown', () => {
        const box = document.getElementById('cheat-box');
        const input = document.getElementById('cheat-input');
        const btn = document.getElementById('cheat-confirm');
        box.style.display = 'block'; 
        input.focus();

        btn.onclick = () => {
            if (input.value === '319' || input.value === '104') { 
                box.style.display = 'none';
                // 伪造 41-49 秒之间的真实用时
                let fakeTimeSec = Phaser.Math.Between(41, 49); 
                startTime = this.time.now - (fakeTimeSec * 1000); 
                
                gameStarted = false;
                moltCount = 5; 
                if(enemies) enemies.clear(true, true);
                alert("兄弟认证成功！录入时空坐标...");
                showWinScene(this); 
            } else {
                alert("暗号错误！");
                box.style.display = 'none';
            }
            input.value = ''; 
        };
    });




    player.setCollideWorldBounds(true);
    player.body.enable = false;
    player.body.setSize(player.width * 0.6, player.height * 0.6, true);

    obstacles = this.physics.add.staticGroup();
    for (let i = 0; i < 3; i++) {
        spawnStaticStone(obstacles, sw, sh, player);
    }

    this.physics.add.collider(player, obstacles);

    bloodEmitter = this.add.particles(0, 0, 'blue_dot', {
        speed: { min: -100, max: 100 }, scale: { start: 0.1, end: 0 },
        alpha: { start: 1, end: 0 }, lifespan: 600, tint: 0x0000ff, emitting: false
    }).setDepth(6);

    shrimps = this.physics.add.group();
    refreshShrimps(this); 

    this.physics.add.overlap(player, shrimps, collectShrimp, null, this);
    this.physics.add.overlap(player, enemies, (p, e) => {
        if(e.alpha < 0.8) return; 
        e.destroy();
        handleDamage(this);
    }, null, this);
    
    scoreText = this.add.text(20, 20, '能量(虾): 0/3', { fontSize: '24px', fill: '#333', backgroundColor: 'rgba(255,255,255,0.6)', padding: {x:8, y:4} }).setDepth(10).setVisible(false);
    moltText = this.add.text(20, 65, '蜕壳进度: 0/5 次', { fontSize: '24px', fill: '#d35400', backgroundColor: 'rgba(255,255,255,0.6)', padding: {x:8, y:4} }).setDepth(10).setVisible(false);
    healthText = this.add.text(20, 110, '生命(蓝血): 3/3', { fontSize: '24px', fill: '#0000ff', backgroundColor: 'rgba(255,255,255,0.6)', padding: {x:8, y:4} }).setDepth(10).setVisible(false);
    timerText = this.add.text(sw/2, 20, '生存时间: 0s', { fontSize: '24px', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(10).setVisible(false);

    setupButtons(this, sh, sw);

    const startOverlay = this.add.rectangle(sw/2, sh/2, sw, sh, 0x000000, 0.7).setDepth(100).setInteractive();
    const startText = this.add.text(sw/2, sh/2, 
        "————【 鲎的壮丽成长史 】————\n\n" +
        "• 收集能量：吃虾成长，体型变大\n" +
        "• 进化蜕壳：需完成 5 次方可成年\n" +
        "• 躲避障碍：石头会随进化逐渐增多\n" +
        "• 保护蓝血：蜕壳时也很虚弱，小心海鸥！\n\n" +
        "( 点击屏幕开始进化 )", 
        { fontSize: '22px', fill: '#fff', align: 'left', lineSpacing: 12 }
    ).setOrigin(0.5).setDepth(101);

    startOverlay.on('pointerdown', () => {
        startTime = this.time.now;
        lastEnemyTime = this.time.now;
        startOverlay.destroy(); startText.destroy();
        scoreText.setVisible(true); moltText.setVisible(true); healthText.setVisible(true); timerText.setVisible(true);
        player.body.enable = true; gameStarted = true;
    });
}

function update() {
    if (!gameStarted) return;
    let currentTime = this.time.now;
    let timeElapsed = Math.floor((currentTime - startTime) / 1000);
    timerText.setText('生存时间: ' + timeElapsed + 's');

    const drag = 0.92; 
    if (moveDirection.active) {
        player.setVelocity(moveDirection.dx, moveDirection.dy);
        let angleDegs = Phaser.Math.RadToDeg(Math.atan2(moveDirection.dy, moveDirection.dx)) + 90;
        player.rotation = Phaser.Math.Angle.RotateTo(player.rotation, Phaser.Math.DegToRad(angleDegs), 0.15);
    } else {
        player.setVelocity(player.body.velocity.x * drag, player.body.velocity.y * drag);
    }

    if (moltCount >= 1 && currentTime - lastEnemyTime > 7000) { 
        spawnEnemy(this);
        lastEnemyTime = currentTime; 
    }
}

function spawnStaticStone(group, sw, sh, avoidTarget) {
    let rx, ry, safe = false, attempts = 0;
    while (!safe && attempts < 30) {
        attempts++;
        rx = Phaser.Math.Between(150, sw - 150);
        ry = Phaser.Math.Between(150, sh - 150);
        let dist = Phaser.Math.Distance.Between(rx, ry, avoidTarget.x, avoidTarget.y);
        let tooClose = false;
        group.getChildren().forEach(s => { if (Phaser.Math.Distance.Between(rx, ry, s.x, s.y) < 130) tooClose = true; });
        if (dist > 250 && !tooClose) safe = true;
    }
    if (safe) {
        let size = Phaser.Math.Between(baseStoneSize, baseStoneSize + 20);
        let s = group.create(rx, ry, 'stone');
        s.setDisplaySize(size, size);
        const radius = (size * 0.35); 
        s.body.setCircle(radius, (size/2 - radius), (size/2 - radius));
        s.refreshBody();
    }
}

function spawnEnemy(scene) {
    const sw = window.innerWidth;
    const enemy = enemies.create(Phaser.Math.Between(100, sw - 100), -100, 'enemy');
    enemy.setDisplaySize(140, 140).setAlpha(0).setDepth(4);
    let speed = 300 + (moltCount * 60); 
    scene.tweens.add({
        targets: enemy, alpha: 0.5, y: 80, duration: 1500,
        onComplete: () => { if (enemy.active) { enemy.setAlpha(1); enemy.setVelocityY(speed); } }
    });
}

function collectShrimp(player, shrimp) {
    shrimp.disableBody(true, true);
    score++;
    scoreText.setText('能量(虾): ' + score + '/3');
    this.tweens.add({
        targets: player, scaleX: player.scaleX * 0.8, scaleY: player.scaleY * 0.8, duration: 100, yoyo: true,
        onComplete: () => { player.setDisplaySize(player.displayWidth + baseGrowth, player.displayHeight + baseGrowth); }
    });
    if (score === 3) handleMolting(this); 
}

function handleDamage(scene) {
    if (!gameStarted) return; 
    health--;
    healthText.setText('生命(蓝血): ' + health + '/3');
    bloodEmitter.emitParticleAt(player.x, player.y, 15);
    scene.tweens.add({ targets: player, tint: 0xff0000, duration: 100, yoyo: true, repeat: 3, onComplete: () => { if(player) player.clearTint(); }});
    
    if (health <= 0) {
        gameStarted = false;
        scene.tweens.killTweensOf(player);
        let isMolting = false;
        scene.children.list.forEach(child => {
            if (child.text === '正在蜕壳进化...') { isMolting = true; child.destroy(); }
        });
        enemies.clear(true, true);
        gameOver(scene, isMolting ? "蜕壳时是很虚弱的，一定要避开海鸥！" : "小心海鸥！它们的俯冲可是很快的。");
    }
}

function handleMolting(scene) {
    if (health <= 0) return;
    player.setVelocity(0, 0);
    score = 0; 
    scoreText.setText('能量(虾): 0/3'); 

    const sw = window.innerWidth, sh = window.innerHeight;
    const moltMsg = scene.add.text(sw/2, sh/2, '正在蜕壳进化...', { 
        fontSize: '32px', fill: '#fff', backgroundColor: 'rgba(0,0,0,0.5)', padding: {x:20, y:10} 
    }).setOrigin(0.5).setDepth(50);

    let shell = shells.create(player.x, player.y, 'hou');
    shell.setDisplaySize(player.displayWidth, player.displayHeight).setAngle(player.angle).setAlpha(0.3).setTint(0xeeeeee).setDepth(3);

    scene.tweens.add({
        targets: player, alpha: 0.2, duration: 100, yoyo: true, repeat: 8,
        onComplete: () => {
            if (health <= 0) { moltMsg.destroy(); return; }
            player.setDisplaySize(player.displayWidth * moltGrowth, player.displayHeight * moltGrowth);
            player.alpha = 1;
            moltMsg.destroy(); 
            moltCount++; 
            if (moltCount < 5) {
                moltText.setText('蜕壳进度: ' + moltCount + '/5 次');
                spawnStaticStone(obstacles, sw, sh, player);
                refreshShrimps(scene);
            } else {
                gameStarted = false;
                enemies.clear(true, true);
                showWinScene(scene);
            }
        }
    });
}

function refreshShrimps(scene) {
    shrimps.clear(true, true);
    const padding = 150; 
    const safeW = window.innerWidth - padding;
    const safeH = window.innerHeight - padding;
    for (let i = 0; i < 3; i++) {
        let rx, ry, isSafe = false, attempts = 0;
        while (!isSafe && attempts < 50) {
            attempts++;
            rx = Phaser.Math.Between(padding, safeW);
            ry = Phaser.Math.Between(padding, safeH);
            let tooClose = false;
            obstacles.getChildren().forEach(stone => {
                if (Phaser.Math.Distance.Between(rx, ry, stone.x, stone.y) < 110) tooClose = true;
            });
            if (!tooClose) isSafe = true;
        }
        let s = shrimps.create(rx, ry, 'shrimp');
        s.setDisplaySize(50, 50);
        const currentScale = s.scaleX;
        scene.tweens.add({
            targets: s, scaleX: currentScale * 1.08, scaleY: currentScale * 1.08,
            duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
        });
    }
}

function showWinScene(scene) {
    let timeElapsed = Math.floor((scene.time.now - startTime) / 1000);
    let bestTime = localStorage.getItem('hou_best_time') || 999;
    if (timeElapsed < bestTime) { localStorage.setItem('hou_best_time', timeElapsed); bestTime = timeElapsed; }

    const sw = window.innerWidth, sh = window.innerHeight;
    scene.add.rectangle(sw/2, sh/2, sw, sh, 0x000000, 0.85).setDepth(200);
    
    // 这里是完整的科普文字内容
    scene.add.text(sw/2, sh/2 - 60, 
        "你太棒了！顺利完成 6 次蜕壳进化！\n\n" +
        `【 战绩统计：耗时 ${timeElapsed}秒 | 剩余血量 ${health} | 历史最快： ${bestTime}秒】\n\n` +
        "【 鲎的终极科普 】\n" +
        "• 幼年期的鲎每蜕一次壳都会显著长大\n" +
        "• 在成年之前，它们要经历约 16 次蜕壳\n" +
        "• 鲎的蓝色血液为人类医学做出了巨大贡献\n\n" +
        "保护滩涂，就是守护这些远古的蓝血生物。",
        { fontSize: '20px', fill: '#fff', align: 'center', lineSpacing: 10 }
    ).setOrigin(0.5).setDepth(201);

    const restartBtn = scene.add.rectangle(sw/2, sh/2 + 180, 200, 60, 0xffffff, 1).setInteractive().setDepth(202);
    scene.add.text(sw/2, sh/2 + 180, "再玩一次", { fontSize: '24px', color: '#000' }).setOrigin(0.5).setDepth(203);
    restartBtn.on('pointerdown', () => window.location.reload());
}

function gameOver(scene, reason) {
    const sw = window.innerWidth, sh = window.innerHeight;
    scene.add.rectangle(sw/2, sh/2, sw, sh, 0x330000, 0.8).setDepth(300);
    scene.add.text(sw/2, sh/2 - 100, "挑战失败", { fontSize: '40px', fill: '#ff0000', fontStyle: 'bold' }).setOrigin(0.5).setDepth(301);
    
    scene.add.text(sw/2, sh/2, reason, { 
        fontSize: '22px', 
        fill: '#ffcccc', 
        align: 'center', 
        wordWrap: { width: sw * 0.8 } 
    }).setOrigin(0.5).setDepth(301);

    const retryBtn = scene.add.rectangle(sw/2, sh/2 + 150, 200, 60, 0xff0000, 1).setInteractive().setDepth(302);
    scene.add.text(sw/2, sh/2 + 150, "重新挑战", { fontSize: '24px', color: '#fff' }).setOrigin(0.5).setDepth(303);
    retryBtn.on('pointerdown', () => window.location.reload());
}

function setupButtons(scene, screenH, screenW) {
    const bSize = 75, pad = 15;
    const cx = screenW - 200, cy = screenH - 180;
    const btns = [
        {x:cx, y:cy-bSize-pad, t:'↑', dx:0, dy:-moveSpeed}, 
        {x:cx, y:cy+bSize+pad, t:'↓', dx:0, dy:moveSpeed}, 
        {x:cx-bSize-pad, y:cy, t:'←', dx:-moveSpeed, dy:0}, 
        {x:cx+bSize+pad, y:cy, t:'→', dx:moveSpeed, dy:0}
    ];
    btns.forEach(b => {
        let r = scene.add.rectangle(b.x, b.y, bSize, bSize, 0x000000, 0.3).setInteractive().setDepth(20);
        scene.add.text(b.x, b.y, b.t, {fontSize:'40px', color:'#fff'}).setOrigin(0.5).setDepth(21);
        r.on('pointerdown', () => { if(gameStarted){ moveDirection.dx=b.dx; moveDirection.dy=b.dy; moveDirection.active=1; r.setFillStyle(0x000000, 0.6); }});
        r.on('pointerup', () => { moveDirection.active=0; r.setFillStyle(0x000000, 0.3); });
    });
}
