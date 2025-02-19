class Tetris {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.nextCanvas = document.getElementById('next-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        // 设置画布大小
        this.canvas.width = 300;
        this.canvas.height = 600;
        this.nextCanvas.width = 100;
        this.nextCanvas.height = 100;
        
        // 游戏配置
        this.blockSize = 30;
        this.cols = this.canvas.width / this.blockSize;
        this.rows = this.canvas.height / this.blockSize;
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        
        // 游戏状态
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.isGameOver = false;
        this.isPaused = false;
        
        // 难度设置
        this.difficulties = {
            easy: { initialSpeed: 1000, speedIncrease: 50, scoreMultiplier: 1 },
            medium: { initialSpeed: 750, speedIncrease: 75, scoreMultiplier: 1.5 },
            hard: { initialSpeed: 500, speedIncrease: 100, scoreMultiplier: 2 }
        };
        this.currentDifficulty = 'easy';
        
        // 方块形状定义
        this.shapes = [
            [[1, 1, 1, 1]], // I
            [[1, 1], [1, 1]], // O
            [[1, 1, 1], [0, 1, 0]], // T
            [[1, 1, 1], [1, 0, 0]], // L
            [[1, 1, 1], [0, 0, 1]], // J
            [[1, 1, 0], [0, 1, 1]], // S
            [[0, 1, 1], [1, 1, 0]]  // Z
        ];
        
        // 颜色定义
        this.colors = ['#00f0f0', '#f0f000', '#f000f0', '#f0a000', '#0000f0', '#00f000', '#f00000'];
        
        // 当前方块和下一个方块
        this.currentPiece = null;
        this.nextPiece = null;
        
        // 音乐控制
        this.bgm = document.getElementById('bgm');
        this.isMusicOn = false;
        
        this.initializeControls();
    }
    
    initializeControls() {
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (this.isGameOver || this.isPaused) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                    this.moveRight();
                    break;
                case 'ArrowDown':
                    this.moveDown();
                    break;
                case 'ArrowUp':
                    this.rotate();
                    break;
                case ' ':
                    this.hardDrop();
                    break;
            }
        });
        
        // 移动端控制
        document.getElementById('left-btn').addEventListener('click', () => this.moveLeft());
        document.getElementById('right-btn').addEventListener('click', () => this.moveRight());
        document.getElementById('rotate-btn').addEventListener('click', () => this.rotate());
        document.getElementById('down-btn').addEventListener('click', () => this.moveDown());
        
        // 游戏控制
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn').addEventListener('click', () => this.togglePause());
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.currentDifficulty = e.target.value;
            if (this.currentPiece) this.startGame(); // 重新开始游戏以应用新难度
        });
        
        // 音乐控制
        document.getElementById('music-btn').addEventListener('click', () => this.toggleMusic());
        document.getElementById('volume').addEventListener('input', (e) => {
            this.bgm.volume = e.target.value / 100;
        });
    }
    
    startGame() {
        // 重置游戏状态
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.isGameOver = false;
        this.isPaused = false;
        
        // 更新显示
        this.updateScore();
        
        // 生成初始方块
        this.currentPiece = this.generatePiece();
        this.nextPiece = this.generatePiece();
        
        // 开始游戏循环
        if (this.gameLoop) clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => this.update(), 
            this.difficulties[this.currentDifficulty].initialSpeed);
    }
    
    generatePiece() {
        const index = Math.floor(Math.random() * this.shapes.length);
        return {
            shape: this.shapes[index],
            color: this.colors[index],
            x: Math.floor((this.cols - this.shapes[index][0].length) / 2),
            y: 0
        };
    }
    
    update() {
        if (this.isGameOver || this.isPaused) return;
        
        if (this.canMove(this.currentPiece.x, this.currentPiece.y + 1)) {
            this.currentPiece.y++;
        } else {
            this.placePiece();
            this.clearLines();
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.generatePiece();
            
            if (!this.canMove(this.currentPiece.x, this.currentPiece.y)) {
                this.gameOver();
                return;
            }
        }
        
        this.draw();
    }
    
    canMove(newX, newY, shape = this.currentPiece.shape) {
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const boardX = newX + x;
                    const boardY = newY + y;
                    
                    if (boardX < 0 || boardX >= this.cols || 
                        boardY >= this.rows || 
                        (boardY >= 0 && this.board[boardY][boardX])) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
    
    placePiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;
                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }
    }
    
    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== 0)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.cols).fill(0));
                linesCleared++;
                y++; // 检查同一行（因为上面的行下移了）
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            const difficulty = this.difficulties[this.currentDifficulty];
            this.score += linesCleared * 100 * difficulty.scoreMultiplier * this.level;
            this.level = Math.floor(this.lines / 10) + 1;
            
            // 增加速度
            clearInterval(this.gameLoop);
            const newSpeed = Math.max(
                difficulty.initialSpeed - (this.level - 1) * difficulty.speedIncrease,
                100
            );
            this.gameLoop = setInterval(() => this.update(), newSpeed);
            
            this.updateScore();
        }
    }
    
    moveLeft() {
        if (this.canMove(this.currentPiece.x - 1, this.currentPiece.y)) {
            this.currentPiece.x--;
            this.draw();
        }
    }
    
    moveRight() {
        if (this.canMove(this.currentPiece.x + 1, this.currentPiece.y)) {
            this.currentPiece.x++;
            this.draw();
        }
    }
    
    moveDown() {
        if (this.canMove(this.currentPiece.x, this.currentPiece.y + 1)) {
            this.currentPiece.y++;
            this.draw();
        } else {
            this.placePiece();
            this.clearLines();
            this.currentPiece = this.nextPiece;
            this.nextPiece = this.generatePiece();
            
            if (!this.canMove(this.currentPiece.x, this.currentPiece.y)) {
                this.gameOver();
                return;
            }
            this.draw();
        }
    }
    
    hardDrop() {
        while (this.canMove(this.currentPiece.x, this.currentPiece.y + 1)) {
            this.currentPiece.y++;
        }
        this.placePiece();
        this.clearLines();
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.generatePiece();
        
        if (!this.canMove(this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver();
            return;
        }
        this.draw();
    }
    
    rotate() {
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[row.length - 1 - i])
        );
        
        if (this.canMove(this.currentPiece.x, this.currentPiece.y, rotated)) {
            this.currentPiece.shape = rotated;
            this.draw();
        }
    }
    
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        // 绘制已放置的方块
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (this.board[y][x]) {
                    this.drawBlock(this.ctx, x, y, this.board[y][x]);
                }
            }
        }
        
        // 绘制当前方块
        if (this.currentPiece) {
            for (let y = 0; y < this.currentPiece.shape.length; y++) {
                for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                    if (this.currentPiece.shape[y][x]) {
                        this.drawBlock(
                            this.ctx,
                            this.currentPiece.x + x,
                            this.currentPiece.y + y,
                            this.currentPiece.color
                        );
                    }
                }
            }
        }
        
        // 绘制下一个方块
        if (this.nextPiece) {
            const offsetX = (this.nextCanvas.width - 
                this.nextPiece.shape[0].length * this.blockSize) / 2;
            const offsetY = (this.nextCanvas.height - 
                this.nextPiece.shape.length * this.blockSize) / 2;
            
            for (let y = 0; y < this.nextPiece.shape.length; y++) {
                for (let x = 0; x < this.nextPiece.shape[y].length; x++) {
                    if (this.nextPiece.shape[y][x]) {
                        this.drawBlock(
                            this.nextCtx,
                            x + offsetX / this.blockSize,
                            y + offsetY / this.blockSize,
                            this.nextPiece.color
                        );
                    }
                }
            }
        }
    }
    
    drawBlock(ctx, x, y, color) {
        const size = this.blockSize;
        ctx.fillStyle = color;
        ctx.fillRect(x * size, y * size, size, size);
        ctx.strokeStyle = '#000';
        ctx.strokeRect(x * size, y * size, size, size);
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.level;
        document.getElementById('lines').textContent = this.lines;
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pause-btn').textContent = 
            this.isPaused ? '继续' : '暂停';
    }
    
    toggleMusic() {
        this.isMusicOn = !this.isMusicOn;
        const musicBtn = document.getElementById('music-btn');
        
        if (this.isMusicOn) {
            this.bgm.play();
            musicBtn.textContent = '音乐: 关';
        } else {
            this.bgm.pause();
            musicBtn.textContent = '音乐: 开';
        }
    }
    
    gameOver() {
        this.isGameOver = true;
        clearInterval(this.gameLoop);
        alert(`游戏结束！\n最终得分: ${this.score}\n消除行数: ${this.lines}\n达到等级: ${this.level}`);
    }
}

// 初始化游戏
window.addEventListener('load', () => new Tetris());